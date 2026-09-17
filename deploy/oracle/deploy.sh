#!/bin/bash
# ============================================================================
# deploy.sh — Script de déploiement automatique Oracle Cloud
# ============================================================================
# Usage: bash deploy/oracle/deploy.sh
# ============================================================================

set -e

echo "============================================="
echo "  SUP'ONE AI — Déploiement Oracle Cloud"
echo "============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Vérifications préalables -----------------------------------------------
echo -e "${BLUE}[1/8] Vérifications préalables...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker non installé. Installation...${NC}"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installé. Déconnexion requise pour le groupe docker.${NC}"
    echo -e "${YELLOW}Exécute ce script après t'être déconnecté et reconnecté.${NC}"
    exit 0
fi

if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose non installé. Installation...${NC}"
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

echo -e "${GREEN}Docker OK${NC}"

# --- Vérifier le fichier .env -----------------------------------------------
echo -e "${BLUE}[2/8] Vérification du fichier .env...${NC}"

PROJET_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJET_ROOT"

if [ ! -f .env ]; then
    echo -e "${YELLOW}Fichier .env non trouvé. Copie depuis deploy/oracle/.env.example${NC}"
    cp deploy/oracle/.env.example .env
    echo -e "${RED}⚠️  Édite .env avant de continuer : nano .env${NC}"
    echo -e "${RED}    Au minimum : SECRET_KEY, GEMINI_API_KEY, ALLOWED_HOSTS${NC}"
    exit 1
fi

# Vérifier que SECRET_KEY est défini
if grep -q "CHANGE_ME" .env; then
    echo -e "${RED}⚠️  SECRET_KEY n'a pas été modifié dans .env${NC}"
    echo -e "${RED}    Édite .env et remplace CHANGE_ME par une vraie clé${NC}"
    echo -e "${RED}    Génération : python3 -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\"${NC}"
    exit 1
fi

echo -e "${GREEN}.env OK${NC}"

# --- Arrêter les anciens conteneurs ----------------------------------------
echo -e "${BLUE}[3/8] Arrêt des anciens conteneurs...${NC}"
docker compose -f deploy/oracle/docker-compose.yml down 2>/dev/null || true
echo -e "${GREEN}Anciens conteneurs arrêtés${NC}"

# --- Build et démarrage -----------------------------------------------------
echo -e "${BLUE}[4/8] Build et démarrage des conteneurs...${NC}"
docker compose -f deploy/oracle/docker-compose.yml up -d --build

# --- Attendre que le backend soit prêt --------------------------------------
echo -e "${BLUE}[5/8] Attente du démarrage du backend (jusqu'à 3 min)...${NC}"

MAX_WAIT=180
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose -f deploy/oracle/docker-compose.yml exec -T api curl -fsS http://127.0.0.1:8001/api/health/ > /dev/null 2>&1; then
        echo -e "${GREEN}Backend prêt !${NC}"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
    echo -ne "  Attendu ${WAITED}s/${MAX_WAIT}s\r"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}⚠️  Backend pas encore prêt. Vérifie les logs :${NC}"
    echo -e "  docker compose -f deploy/oracle/docker-compose.yml logs api"
    exit 1
fi

# --- Vérifier le health check -----------------------------------------------
echo -e "${BLUE}[6/8] Vérification du health check...${NC}"

HEALTH=$(curl -s http://localhost/api/health/ 2>/dev/null || echo "erreur")
if echo "$HEALTH" | grep -q "ok\|online\|status"; then
    echo -e "${GREEN}Health check OK${NC}"
else
    echo -e "${YELLOW}Health check : $HEALTH${NC}"
    echo -e "${YELLOW}Le serveur tourne peut-être encore au démarrage...${NC}"
fi

# --- Afficher le statut -----------------------------------------------------
echo -e "${BLUE}[7/8] Statut des conteneurs...${NC}"
docker compose -f deploy/oracle/docker-compose.yml ps

# --- Informations finales ---------------------------------------------------
echo -e "${BLUE}[8/8] Déploiement terminé !${NC}"
echo ""

IP=$(curl -s ifconfig.me 2>/dev/null || echo "IP_INCONNUE")
echo -e "============================================="
echo -e "  ${GREEN}✅ DÉPLOIEMENT RÉUSSI${NC}"
echo -e "============================================="
echo ""
echo -e "  API URL : http://${IP}/api/health/"
echo -e "  Logs    : docker compose -f deploy/oracle/docker-compose.yml logs -f"
echo -e "  Restart : docker compose -f deploy/oracle/docker-compose.yml restart"
echo -e "  Stop    : docker compose -f deploy/oracle/docker-compose.yml down"
echo ""
echo -e "  ${YELLOW}Prochaine étape :${NC}"
echo -e "  1. Configurer un domaine (voir docs/ORACLE_DEPLOYMENT.md)"
echo -e "  2. Activer HTTPS avec Certbot"
echo -e "  3. Mettre à jour l'APK avec la nouvelle URL"
echo ""
