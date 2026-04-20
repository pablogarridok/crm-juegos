"""
Microservicio de reconocimiento facial.
Recibe dos imágenes (referencia + actual), las compara con DeepFace
y devuelve si los rostros coinciden.

El microservicio NO conoce usuarios, NO gestiona sesiones, NO decide accesos.
Solo compara rostros. Laravel es quien decide qué hacer con el resultado.
"""

import os
import base64
import tempfile
from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
from PIL import Image

app = FastAPI(title="GameCRM Face Recognition Service", version="1.0.0")

# Solo Laravel (mismo host Docker) puede llamar a este servicio.
# El navegador nunca se comunica directamente con este microservicio.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # En producción: restringir a la IP de Laravel
    allow_methods=["POST"],
    allow_headers=["*"],
)


class CompareRequest(BaseModel):
    """
    Dos imágenes en base64.
    Laravel envía ambas: la registrada (referencia) y la capturada (webcam).
    """
    image_reference: str   # base64 de la foto registrada en enrolamiento
    image_current: str     # base64 de la foto actual de la webcam


class CompareResponse(BaseModel):
    match: bool
    distance: float
    threshold: float
    model: str


def decode_base64_image(b64_string: str) -> str:
    """Decodifica base64 y lo guarda en un fichero temporal. Devuelve la ruta."""
    # Eliminar prefijo data:image/...;base64, si existe
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    img_bytes = base64.b64decode(b64_string)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")

    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img.save(tmp.name, "JPEG")
    tmp.close()
    return tmp.name


@app.get("/health")
def health():
    """Endpoint de salud para comprobar que el servicio está vivo."""
    return {"status": "ok", "service": "face-recognition"}


@app.post("/compare", response_model=CompareResponse)
def compare_faces(payload: CompareRequest):
    """
    Compara dos rostros y devuelve el resultado técnico.
    Laravel interpreta este resultado y toma la decisión final.
    """
    ref_path = None
    cur_path = None

    try:
        ref_path = decode_base64_image(payload.image_reference)
        cur_path = decode_base64_image(payload.image_current)

        result = DeepFace.verify(
            img1_path=ref_path,
            img2_path=cur_path,
            model_name="Facenet",        # Buen balance velocidad/precisión
            detector_backend="opencv",   # Rápido, sin GPU necesaria
            enforce_detection=False,     # No lanzar error si no detecta cara
        )

        return CompareResponse(
            match=result["verified"],
            distance=round(result["distance"], 4),
            threshold=round(result["threshold"], 4),
            model=result.get("model", "Facenet"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en comparación: {str(e)}")

    finally:
        # Limpiar ficheros temporales siempre
        for path in [ref_path, cur_path]:
            if path and os.path.exists(path):
                os.unlink(path)
