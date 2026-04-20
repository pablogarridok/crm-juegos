FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema necesarias para OpenCV y DeepFace
# Nota: libgl1-mesa-glx fue renombrado a libgl1 en Debian Trixie
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-descargar los modelos de DeepFace para que el contenedor arranque rápido
RUN python -c "from deepface import DeepFace; DeepFace.build_model('Facenet')" || true

COPY main.py .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
