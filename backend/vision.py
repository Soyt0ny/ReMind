import base64
import logging
from typing import Optional

import cv2
import face_recognition
import numpy as np

logger = logging.getLogger("remind.vision")


class FaceRecognitionSingleton:
    _instance: Optional["FaceRecognitionSingleton"] = None
    _initialized: bool = False

    def __new__(cls) -> "FaceRecognitionSingleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self) -> None:
        if not self._initialized:
            logger.info("Cargando modelo de reconocimiento facial (dlib)...")
            self._initialized = True
            logger.info("Modelo cargado.")

    def get_encodings(self, image: np.ndarray) -> list[np.ndarray]:
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        locations = face_recognition.face_locations(rgb, model="hog")
        return face_recognition.face_encodings(rgb, locations)


face_model = FaceRecognitionSingleton()


def decode_base64_image(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    arr = np.frombuffer(base64.b64decode(b64), dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen.")
    return img


def create_thumbnail(image: np.ndarray, max_size: int = 200, quality: int = 80) -> str:
    h, w = image.shape[:2]
    scale = max_size / max(h, w)
    if scale < 1:
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        return ""
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()


def augment_embedding(embedding: np.ndarray, num_variations: int = 3) -> list[list[float]]:
    result = [embedding.tolist()]
    for i in range(1, num_variations):
        noise  = np.random.normal(0, 0.01 * i, embedding.shape)
        varied = embedding + noise
        varied = varied / np.linalg.norm(varied) * np.linalg.norm(embedding)
        result.append(varied.tolist())
    return result
