#!/bin/sh
set -e

cd /app/backend

echo "[entrypoint] Démarrage du backend SUP'ONE AI..."

# Attendre PostgreSQL si DATABASE_URL contient postgres
if echo "$DATABASE_URL" | grep -q "postgres"; then
  echo "[entrypoint] Attente de PostgreSQL..."
  python - <<'PY'
import os, sys, time
url = os.environ.get("DATABASE_URL", "")
try:
    import psycopg2
except ImportError:
    sys.exit(0)
for attempt in range(60):
    try:
        psycopg2.connect(url).close()
        print("[entrypoint] PostgreSQL prêt.")
        sys.exit(0)
    except Exception as exc:
        print(f"[entrypoint] Postgres ({attempt + 1}/60): {exc}")
        time.sleep(2)
print("[entrypoint] Timeout PostgreSQL.")
sys.exit(1)
PY
fi

# Migrations
echo "[entrypoint] Exécution des migrations..."
python manage.py migrate --noinput

# Static files
echo "[entrypoint] Collecte des fichiers statiques..."
python manage.py collectstatic --noinput 2>/dev/null || true

# Bootstrap (premier lancement)
if [ "$RUN_BOOTSTRAP" = "1" ]; then
  echo "[entrypoint] Bootstrap des données..."
  python manage.py setup_demo 2>/dev/null || true
fi

echo "[entrypoint] Démarrage de Gunicorn..."
exec "$@"
