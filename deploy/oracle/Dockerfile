# ============================================================================
# Dockerfile — Backend SUP'ONE AI pour Oracle Cloud (ARM64)
# ============================================================================
# Build: docker build -t supone-api -f deploy/oracle/Dockerfile .
# Run:   docker run -p 8001:8001 --env-file .env supone-api
# ============================================================================

FROM python:3.13-slim-bookworm

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_BREAK_SYSTEM_PACKAGES=1 \
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    HF_HUB_OFFLINE=1

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copier le code
COPY backend ./backend
COPY data ./data

WORKDIR /app/backend

# Créer les répertoires nécessaires
RUN mkdir -p /app/backend/rag_data /app/.cache/huggingface /app/backend/staticfiles

# Fichier d'entrée
COPY deploy/oracle/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8001/api/health/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8001", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
