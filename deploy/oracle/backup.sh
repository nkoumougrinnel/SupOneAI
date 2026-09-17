#!/bin/bash
# ============================================================================
# backup.sh — Sauvegarde automatique SUP'ONE AI (Oracle Cloud)
# ============================================================================
# Crée une sauvegarde compressée du projet (code + base de données + données)
# Usage: bash deploy/oracle/backup.sh
# Crontab: 0 2 * * * /home/ubuntu/SupOneAI/deploy/oracle/backup.sh >> /home/ubuntu/backup.log 2>&1
# ============================================================================

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
PROJECT_DIR="/home/ubuntu/SupOneAI"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="supone-backup-${DATE}"
MAX_BACKUPS=7  # Garder les 7 dernières sauvegardes

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Début de la sauvegarde..."

# --- Sauvegarder la base de données -----------------------------------------
echo "[$(date)] Sauvegarde de la base de données..."
cd "$PROJECT_DIR"

if docker compose -f deploy/oracle/docker-compose.yml ps db | grep -q "Up"; then
    # PostgreSQL via Docker
    docker compose -f deploy/oracle/docker-compose.yml exec -T db \
        pg_dump -U supone supone > "$BACKUP_DIR/${BACKUP_NAME}_db.sql" 2>/dev/null
    echo "[$(date)] Base PostgreSQL sauvegardée"
else
    # SQLite (fichier local)
    cp "$PROJECT_DIR/backend/db.sqlite3" "$BACKUP_DIR/${BACKUP_NAME}_db.sqlite3" 2>/dev/null || true
    echo "[$(date)] Base SQLite sauvegardée"
fi

# --- Sauvegarder le code source (sans .git, node_modules, etc.) -------------
echo "[$(date)] Sauvegarde du code source..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_code.tar.gz" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='android/app/build' \
    -C "$(dirname "$PROJECT_DIR")" \
    "$(basename "$PROJECT_DIR")" 2>/dev/null

# --- Sauvegarder les données RAG (index FAISS, etc.) ------------------------
echo "[$(date)] Sauvegarde des données RAG..."
if [ -d "$PROJECT_DIR/backend/rag_data" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_rag.tar.gz" \
        -C "$PROJECT_DIR/backend" rag_data 2>/dev/null || true
fi

# --- Sauvegarder le cache Hugging Face (modèles) ----------------------------
echo "[$(date)] Sauvegarde du cache HF..."
if [ -d "/home/ubuntu/.cache/huggingface" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_hf_cache.tar.gz" \
        -C /home/ubuntu/.cache huggingface 2>/dev/null || true
fi

# --- Compresser tout en un seul fichier -------------------------------------
echo "[$(date)] Création de l'archive finale..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" \
    ${BACKUP_NAME}_db.sql* \
    ${BACKUP_NAME}_code.tar.gz \
    ${BACKUP_NAME}_rag.tar.gz \
    ${BACKUP_NAME}_hf_cache.tar.gz \
    2>/dev/null

# Nettoyer les fichiers intermédiaires
rm -f ${BACKUP_NAME}_db.sql* ${BACKUP_NAME}_code.tar.gz ${BACKUP_NAME}_rag.tar.gz ${BACKUP_NAME}_hf_cache.tar.gz

# --- Garder uniquement les N dernières sauvegardes --------------------------
echo "[$(date)] Nettoyage des anciennes sauvegardes..."
cd "$BACKUP_DIR"
ls -t supone-backup-*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f

# --- Résumé -----------------------------------------------------------------
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "[$(date)] ✅ Sauvegarde terminée : ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
echo ""
ls -lh "$BACKUP_DIR"/supone-backup-*.tar.gz 2>/dev/null
