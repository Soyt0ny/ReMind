"""
ReMind - Backend FastAPI
Asistente Visual de Memoria para personas con Alzheimer.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth     import create_token, get_current_user, hash_password, verify_password
from database import (
    delete_all_people,
    delete_person,
    get_all_people,
    get_embeddings_cached,
    get_person_by_id,
    get_person_photo,
    get_user_by_email,
    get_user_by_id,
    get_user_password_hash,
    create_user,
    init_db,
    invalidate_cache,
    save_person,
    update_person_metadata,
)
from schemas  import (
    DeleteResponse,
    IdentifyRequest,
    IdentifyResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    RegisterUserRequest,
    TokenResponse,
    UpdatePersonRequest,
    UpdatePersonResponse,
    VerifyRequest,
)
from vision   import augment_embedding, create_thumbnail, decode_base64_image, face_model

IDENTIFICATION_THRESHOLD = float(__import__("os").getenv("IDENTIFICATION_THRESHOLD", "0.6"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("remind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    face_model.initialize()
    init_db()
    logger.info("ReMind Backend iniciado correctamente.")
    yield
    logger.info("ReMind Backend detenido.")


app = FastAPI(
    title="ReMind API",
    description="API de asistencia visual para personas con Alzheimer.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok", "message": "ReMind API activa"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/auth/register", response_model=TokenResponse)
async def register_account(body: RegisterUserRequest):
    if get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo.")
    pw_hash = hash_password(body.password)
    try:
        user_id = create_user(body.email, body.display_name, pw_hash)
    except Exception:
        raise HTTPException(status_code=500, detail="Error al crear la cuenta.")
    return TokenResponse(
        access_token=create_token(user_id),
        user_id=user_id,
        display_name=body.display_name,
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Correo o contrasena incorrectos.")
    return TokenResponse(
        access_token=create_token(user["id"]),
        user_id=user["id"],
        display_name=user["display_name"],
    )


@app.post("/auth/verify")
async def verify_password_endpoint(body: VerifyRequest, user_id: int = Depends(get_current_user)):
    pw_hash = get_user_password_hash(user_id)
    if not pw_hash or not verify_password(body.password, pw_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
    return {"ok": True}


@app.get("/auth/me")
async def me(user_id: int = Depends(get_current_user)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return {"id": user["id"], "email": user["email"], "display_name": user["display_name"]}


# ---------------------------------------------------------------------------
# People (protected)
# ---------------------------------------------------------------------------

@app.get("/people")
async def list_people(user_id: int = Depends(get_current_user)):
    return get_all_people(user_id)


@app.put("/people/{person_id}", response_model=UpdatePersonResponse)
async def update_person(person_id: int, body: UpdatePersonRequest, user_id: int = Depends(get_current_user)):
    existing = get_person_by_id(person_id, user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Persona no encontrada.")

    name         = body.name.strip()
    relationship = body.relationship.strip()
    age          = body.age
    extra        = body.extra.strip() if body.extra else None
    phone        = body.phone.strip() if body.phone else None

    if body.image:
        try:
            image = decode_base64_image(body.image)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        encodings = face_model.get_encodings(image)
        if len(encodings) == 0:
            raise HTTPException(status_code=400, detail="No se detecto ningun rostro en la imagen.")
        if len(encodings) > 1:
            raise HTTPException(status_code=400, detail="Se detectaron multiples rostros.")

        augmented = augment_embedding(encodings[0], num_variations=3)
        thumbnail = create_thumbnail(image)

        delete_person(person_id, user_id)
        new_id = save_person(
            user_id=user_id,
            name=name, relationship=relationship,
            embeddings=augmented, age=age, extra=extra, phone=phone, photo=thumbnail,
            is_emergency=body.is_emergency,
        )
        invalidate_cache(user_id)
        logger.info(f"Actualizado con nueva foto: {name} (user {user_id})")
        return UpdatePersonResponse(
            message=f"{name} actualizado exitosamente.", person_id=new_id,
            name=name, relationship=relationship, age=age, extra=extra, phone=phone,
            photo=thumbnail, is_emergency=body.is_emergency,
        )

    update_person_metadata(person_id, user_id, name, relationship, age, extra, phone, is_emergency=body.is_emergency)
    invalidate_cache(user_id)
    logger.info(f"Actualizado: {name} (user {user_id})")
    return UpdatePersonResponse(
        message=f"{name} actualizado exitosamente.", person_id=person_id,
        name=name, relationship=relationship, age=age, extra=extra, phone=phone,
        photo=existing["photo"], is_emergency=body.is_emergency,
    )


@app.delete("/people/{person_id}", response_model=DeleteResponse)
async def remove_person(person_id: int, user_id: int = Depends(get_current_user)):
    deleted = delete_person(person_id, user_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Persona no encontrada.")
    invalidate_cache(user_id)
    return DeleteResponse(message="Persona eliminada", deleted=deleted)


@app.delete("/people", response_model=DeleteResponse)
async def remove_all(confirm: bool = False, user_id: int = Depends(get_current_user)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Agrega ?confirm=true para confirmar.")
    deleted = delete_all_people(user_id)
    invalidate_cache(user_id)
    return DeleteResponse(message="Todos los registros eliminados", deleted=deleted)


@app.post("/register", response_model=RegisterResponse)
async def register_person(body: RegisterRequest, user_id: int = Depends(get_current_user)):
    try:
        image = decode_base64_image(body.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    encodings = face_model.get_encodings(image)
    if len(encodings) == 0:
        raise HTTPException(status_code=400, detail="No se detecto ningun rostro en la imagen.")
    if len(encodings) > 1:
        raise HTTPException(status_code=400, detail="Se detectaron multiples rostros. Solo debe aparecer una persona.")

    augmented = augment_embedding(encodings[0], num_variations=3)
    thumbnail = create_thumbnail(image)

    try:
        person_id = save_person(
            user_id=user_id,
            name=body.name,
            relationship=body.relationship,
            embeddings=augmented,
            age=body.age,
            extra=body.extra,
            phone=body.phone,
            photo=thumbnail,
            is_emergency=body.is_emergency,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Error al guardar en la base de datos.")

    invalidate_cache(user_id)
    logger.info(f"Registrado: {body.name} (user {user_id})")

    return RegisterResponse(
        message=f"{body.name} registrado exitosamente.",
        person_id=person_id,
        name=body.name,
        relationship=body.relationship,
        age=body.age,
        extra=body.extra,
        phone=body.phone,
        photo=thumbnail,
        is_emergency=body.is_emergency,
    )


@app.post("/identify", response_model=IdentifyResponse)
async def identify_person(body: IdentifyRequest, user_id: int = Depends(get_current_user)):
    try:
        image = decode_base64_image(body.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    encodings = face_model.get_encodings(image)
    if len(encodings) == 0:
        return IdentifyResponse(name="desconocido", relationship="", confidence=1.0)

    query = encodings[0]
    db    = get_embeddings_cached(user_id)

    if not db:
        return IdentifyResponse(name="desconocido", relationship="", confidence=1.0)

    best_match    = None
    best_distance = float("inf")
    for person in db:
        d = float(np.linalg.norm(query - person["embedding"]))
        if d < best_distance:
            best_distance = d
            best_match    = person

    if best_distance <= IDENTIFICATION_THRESHOLD and best_match:
        photo = get_person_photo(best_match["group_id"])
        logger.info(f"Identificado: {best_match['name']} (d={best_distance:.4f}, user={user_id})")
        return IdentifyResponse(
            name=best_match["name"],
            relationship=best_match["relationship"],
            confidence=round(best_distance, 4),
            age=best_match.get("age"),
            extra=best_match.get("extra"),
            photo=photo,
        )

    return IdentifyResponse(name="desconocido", relationship="", confidence=round(best_distance, 4))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
