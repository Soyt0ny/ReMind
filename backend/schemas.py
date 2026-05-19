from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterUserRequest(BaseModel):
    email:        str = Field(..., min_length=3, max_length=200)
    display_name: str = Field(..., min_length=1, max_length=100)
    password:     str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email:    str
    password: str


class VerifyRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    display_name: str


# ---------------------------------------------------------------------------
# People
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name:         str           = Field(..., min_length=1, max_length=200)
    relationship: str           = Field(..., min_length=1, max_length=100)
    image:        str
    age:          Optional[int] = None
    extra:        Optional[str] = Field(None, max_length=1000)
    phone:        Optional[str] = Field(None, max_length=20)
    is_emergency: bool          = False


class RegisterResponse(BaseModel):
    message:      str
    person_id:    int
    name:         str
    relationship: str
    age:          Optional[int] = None
    extra:        Optional[str] = None
    phone:        Optional[str] = None
    photo:        Optional[str] = None
    is_emergency: bool          = False


class IdentifyRequest(BaseModel):
    image: str


class IdentifyResponse(BaseModel):
    name:         str
    relationship: str
    confidence:   float
    age:          Optional[int] = None
    extra:        Optional[str] = None
    photo:        Optional[str] = None


class UpdatePersonRequest(BaseModel):
    name:         str           = Field(..., min_length=1, max_length=200)
    relationship: str           = Field(..., min_length=1, max_length=100)
    age:          Optional[int] = None
    extra:        Optional[str] = Field(None, max_length=1000)
    phone:        Optional[str] = Field(None, max_length=20)
    image:        Optional[str] = None
    is_emergency: bool          = False


class UpdatePersonResponse(BaseModel):
    message:      str
    person_id:    int
    name:         str
    relationship: str
    age:          Optional[int] = None
    extra:        Optional[str] = None
    phone:        Optional[str] = None
    photo:        Optional[str] = None
    is_emergency: bool          = False


class DeleteResponse(BaseModel):
    message: str
    deleted: int
