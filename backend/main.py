"""
ReMind - Backend FastAPI
Asistente Visual de Memoria para personas con Alzheimer.
"""

import os
import base64
import logging
from io import BytesIO
from contextlib import asynccontextmanager
from typing import Optional

import cv2
import numpy as np
import face_recognition
import sqlite3
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite://./backend/remind.db",
)
IDENTIFICATION_THRESHOLD = float(os.getenv("IDENTIFICATION_THRESHOLD", "0.6"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("remind")


# ---------------------------------------------------------------------------
# Singleton: Face Recognition Model Loader
# ---------------------------------------------------------------------------

class FaceRecognitionSingleton:
    """
    Singleton que garantiza que el modelo de face_recognition (dlib)
    se carga una sola vez al inicio del servidor.
    """

    _instance: Optional["FaceRecognitionSingleton"] = None
    _initialized: bool = False

    def __new__(cls) -> "FaceRecognitionSingleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self) -> None:
        if not self._initialized:
            logger.info("Cargando modelo de reconocimiento facial (dlib)...")
            # Forzar la carga del modelo ejecutando una codificación dummy
            _dummy = np.zeros((100, 100, 3), dtype=np.uint8)
            face_recognition.face_encodings(
                face_recognition.load_image_file(BytesIO(cv2.imencode(".jpg", _dummy)[1]))
            ) if False else None  # noqa: el modelo se pre-carga con la importación
            self._initialized = True
            logger.info("Modelo de reconocimiento facial cargado correctamente.")

    def get_encodings(self, image: np.ndarray) -> list[np.ndarray]:
        """Detecta rostros y devuelve sus embeddings de 128-d."""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_image, model="hog")
        encodings = face_recognition.face_encodings(rgb_image, face_locations)
        return encodings


face_model = FaceRecognitionSingleton()


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db_connection():
    """Crea y retorna una conexión a SQLite (archivo `backend/remind.db`)."""
    db_path = os.path.join(os.path.dirname(__file__), "remind.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_sqlite_db():
    """Crea las tablas necesarias en SQLite si no existen."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Create table with new columns if it doesn't exist
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                relationship TEXT NOT NULL,
                age INTEGER,
                extra TEXT,
                embedding TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_people_name ON people (name)")

        # Migration for existing databases: ensure `age` and `extra` columns exist.
        # SQLite doesn't support DROP COLUMN; we only add missing columns.
        cur.execute("PRAGMA table_info(people)")
        cols = [r[1] for r in cur.fetchall()]
        if "age" not in cols:
            cur.execute("ALTER TABLE people ADD COLUMN age INTEGER")
        if "extra" not in cols:
            cur.execute("ALTER TABLE people ADD COLUMN extra TEXT")
        conn.commit()
    finally:
        conn.close()


def fetch_all_embeddings() -> list[dict]:
    """Obtiene todos los registros con sus embeddings de la base de datos."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, relationship, age, extra, embedding FROM people")
        rows = cur.fetchall()
        results = []
        for row in rows:
            emb_text = row["embedding"]
            try:
                emb_list = json.loads(emb_text)
            except Exception:
                # Fallback: stored as repr() or comma-separated
                emb_list = list(map(float, emb_text.strip('[]').split(','))) if emb_text else []

            results.append({
                "id": row["id"],
                "name": row["name"],
                "relationship": row["relationship"],
                "age": row["age"],
                "extra": row["extra"],
                "embedding": np.array(emb_list, dtype=np.float64),
            })
        return results
    finally:
        conn.close()


def save_person(name: str, relationship: str, embeddings: list[list[float]], age: Optional[int] = None, extra: Optional[str] = None) -> int:
    """Guarda una persona y sus embeddings augmentados en la base de datos."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        person_id = None
        for i, emb in enumerate(embeddings):
            emb_text = json.dumps(emb)
            cur.execute(
                "INSERT INTO people (name, relationship, age, extra, embedding) VALUES (?, ?, ?, ?, ?)",
                (name, relationship, age, extra, emb_text),
            )
            if person_id is None:
                person_id = cur.lastrowid
        conn.commit()
        return person_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Error al guardar persona: {e}")
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decodifica una imagen en base64 a un array NumPy (BGR)."""
    # Remover el prefijo data:image/...;base64, si existe
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_string)
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("No se pudo decodificar la imagen.")

    return image


def augment_embedding(embedding: np.ndarray, num_variations: int = 3) -> list[np.ndarray]:
    """
    Aplica Data Augmentation simple al embedding.
    Genera variaciones añadiendo ruido gaussiano pequeño para simular
    cambios leves de brillo/contraste.
    """
    augmented = [embedding.tolist()]
    for i in range(1, num_variations):
        noise = np.random.normal(0, 0.01 * i, embedding.shape)
        varied = embedding + noise
        # Normalizar para mantener la magnitud similar
        varied = varied / np.linalg.norm(varied) * np.linalg.norm(embedding)
        augmented.append(varied.tolist())
    return augmented


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    """Esquema para registrar una nueva persona."""
    name: str = Field(..., min_length=1, max_length=200, description="Nombre de la persona")
    relationship: str = Field(
        ..., min_length=1, max_length=100, description="Parentesco (ej: Hija, Esposo, Doctor)"
    )
    image: str = Field(..., description="Imagen en base64 del rostro")
    age: Optional[int] = Field(None, description="Edad (opcional)")
    extra: Optional[str] = Field(None, max_length=1000, description="Información extra (campo libre)")


class RegisterResponse(BaseModel):
    """Respuesta del registro exitoso."""
    message: str
    person_id: int
    name: str
    relationship: str
    age: Optional[int] = None
    extra: Optional[str] = None


class IdentifyRequest(BaseModel):
    """Esquema para identificar un rostro."""
    image: str = Field(..., description="Frame de video en base64")


class IdentifyResponse(BaseModel):
    """Respuesta de identificación."""
    name: str
    relationship: str
    confidence: float = Field(
        ..., description="Distancia euclidiana (menor = más confianza)"
    )
    age: Optional[int] = None
    extra: Optional[str] = None


class DeleteResponse(BaseModel):
    message: str
    deleted: int


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa el modelo de reconocimiento facial al arrancar."""
    face_model.initialize()
    # Inicializar base de datos SQLite local
    init_sqlite_db()
    logger.info("ReMind Backend iniciado correctamente.")
    yield
    logger.info("ReMind Backend detenido.")


app = FastAPI(
    title="ReMind API",
    description="API de asistencia visual para personas con Alzheimer.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - permitir el frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    """Health check."""
    return {"status": "ok", "message": "ReMind API activa"}


@app.get("/people")
async def list_people():
    """Lista las personas registradas (sin embeddings)."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, relationship, age, extra, created_at FROM people ORDER BY id")
        rows = cur.fetchall()
        result = [ {"id": row["id"], "name": row["name"], "relationship": row["relationship"], "age": row["age"], "extra": row["extra"], "created_at": row["created_at"]} for row in rows ]
        return result
    finally:
        conn.close()


@app.delete("/people/{person_id}", response_model=DeleteResponse)
async def delete_person(person_id: int):
    """Elimina una persona por su `id`."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM people WHERE id = ?", (person_id,))
        deleted = cur.rowcount
        conn.commit()
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
        return DeleteResponse(message="Persona eliminada", deleted=deleted)
    finally:
        conn.close()


@app.delete("/people", response_model=DeleteResponse)
async def delete_all_people(confirm: bool = False):
    """Elimina todos los registros. Requiere `?confirm=true` para evitar borrados accidentales."""
    if not confirm:
        raise HTTPException(status_code=400, detail="Para borrar todo, añade `?confirm=true` a la petición")
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM people")
        deleted = cur.rowcount
        conn.commit()
        return DeleteResponse(message="Todos los registros eliminados", deleted=deleted)
    finally:
        conn.close()


@app.post("/register", response_model=RegisterResponse)
async def register_person(request: RegisterRequest):
    """
    Registra una nueva persona.
    Acepta una imagen base64, detecta el rostro, genera un embedding de 128-d,
    aplica Data Augmentation (3 variaciones) y guarda todo en PostgreSQL.
    """
    try:
        image = decode_base64_image(request.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    encodings = face_model.get_encodings(image)

    if len(encodings) == 0:
        raise HTTPException(
            status_code=400,
            detail="No se detectó ningún rostro en la imagen. Intente con otra foto.",
        )

    if len(encodings) > 1:
        raise HTTPException(
            status_code=400,
            detail="Se detectaron múltiples rostros. Solo debe aparecer una persona.",
        )

    # Generar 3 variaciones del embedding (Data Augmentation)
    primary_encoding = encodings[0]
    augmented_embeddings = augment_embedding(primary_encoding, num_variations=3)

    try:
        person_id = save_person(request.name, request.relationship, augmented_embeddings, age=request.age, extra=request.extra)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al guardar en la base de datos.",
        )

    logger.info(f"Persona registrada: {request.name} ({request.relationship})")

    return RegisterResponse(
        message=f"{request.name} ha sido registrado exitosamente.",
        person_id=person_id,
        name=request.name,
        relationship=request.relationship,
        age=request.age,
        extra=request.extra,
    )


@app.post("/identify", response_model=IdentifyResponse)
async def identify_person(request: IdentifyRequest):
    """
    Identifica un rostro en un frame de video.
    Compara el embedding del rostro contra la base de datos
    usando Distancia Euclidiana con un umbral de 0.6.
    """
    try:
        image = decode_base64_image(request.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    encodings = face_model.get_encodings(image)

    if len(encodings) == 0:
        return IdentifyResponse(
            name="desconocido",
            relationship="",
            confidence=1.0,
        )

    # Usar el primer rostro detectado
    query_encoding = encodings[0]

    # Obtener todos los embeddings de la BD
    try:
        db_people = fetch_all_embeddings()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al consultar la base de datos.",
        )

    if not db_people:
        return IdentifyResponse(
            name="desconocido",
            relationship="",
            confidence=1.0,
        )

    # Buscar la mejor coincidencia (menor distancia euclidiana)
    best_match = None
    best_distance = float("inf")

    for person in db_people:
        distance = np.linalg.norm(query_encoding - person["embedding"])
        if distance < best_distance:
            best_distance = distance
            best_match = person

    # Verificar contra el umbral
    if best_distance <= IDENTIFICATION_THRESHOLD and best_match is not None:
        logger.info(
            f"Identificado: {best_match['name']} "
            f"(distancia: {best_distance:.4f})"
        )
        return IdentifyResponse(
            name=best_match["name"],
            relationship=best_match["relationship"],
            confidence=round(best_distance, 4),
            age=best_match.get("age"),
            extra=best_match.get("extra"),
        )

    return IdentifyResponse(
        name="desconocido",
        relationship="",
        confidence=round(best_distance, 4),
        age=None,
        extra=None,
    )

if __name__ == "__main__":
    import uvicorn
    # El 0.0.0.0 es la clave mágica para que tu celular pueda entrar
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
