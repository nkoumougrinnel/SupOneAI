# 🆓 Guide de déploiement — Oracle Cloud Free Tier (GRATUIT à vie)

Ce guide te permet de déployer **SUP'ONE AI** sur Oracle Cloud Free Tier pour **$0/mois, pour toujours**.

---

## Table des matières

1. [Ce que tu obtiens](#1-ce-que-tu-obtiens)
2. [Créer le compte Oracle Cloud](#2-créer-le-compte-oracle-cloud)
3. [Créer l'instance VM](#3-créer-linstance-vm)
4. [Configurer le firewall](#4-configurer-le-firewall)
5. [Se connecter au serveur](#5-se-connecter-au-serveur)
6. [Déployer avec Docker (recommandé)](#6-déployer-avec-docker)
7. [Déployer sans Docker](#7-déployer-sans-docker)
8. [Configurer un nom de domaine](#8-configurer-un-nom-de-domaine)
9. [Activer HTTPS](#9-activer-https)
10. [Mettre à jour l'APK](#10-mettre-à-jour-lapk)
11. [Sauvegardes automatiques](#11-sauvegardes-automatiques)
12. [Monitoring et maintenance](#12-monitoring-et-maintenance)
13. [Dépannage](#13-dépannage)

---

## 1. Ce que tu obtiens

| Ressource | Quantité | Prix |
|-----------|----------|------|
| CPU ARM (Ampere A1) | 2 OCPU | $0 |
| RAM | 12 GB | $0 |
| Stockage | 200 GB | $0 |
| Bandwidth sortante | 10 TB/mois | $0 |
| IPv4 publique | 1 | $0 |
| PostgreSQL managed | Inclus | $0 |

**Coût total : $0/mois, pour toujours.**

---

## 2. Créer le compte Oracle Cloud

1. Va sur **https://cloud.oracle.com/free**
2. Clique **"Start for Free"**
3. Remplis le formulaire :
   - Pays : Cameroun (ou France)
   - Email : ton email
   - Mot de passe : choisis un mot de passe fort
4. Vérifie ton email (code à 6 chiffres)
5. Remplis les infos du compte :
   - **Cloud Account Name** : `supone-ai`
   - **Home Region** : **Germany Central (Frankfurt)** — le plus proche
6. Ajoute une **carte bancaire** (bound de $1 temporaire, pas de charge)
7. Clique **"Start My Free Tier"**

> ⏳ Attends 2-5 minutes que le compte soit activé

---

## 3. Créer l'instance VM

1. Connecte-toi à **https://cloud.oracle.com**
2. Menu hamburger → **Compute** → **Instances**
3. Clique **"Create Instance"**

### Configuration de l'instance

| Champ | Valeur |
|-------|--------|
| **Name** | `supone-backend` |
| **Image** | Canonical Ubuntu 24.04 (Always Free Eligible) |
| **Shape** | VM.Standard.A1.Flex |
| **OCPU** | 2 |
| **RAM** | 12 GB |
| **Boot Volume** | 50 GB (défaut) |
| **SSH Keys** | Génère une paire ou uploade la tienne |

> ⚠️ Si tu vois "Out of host capacity" :
> - Change de région (Paris, Amsterdam, Tokyo)
> - Ou attends quelques heures et réessaie

4. Clique **"Create"**
5. Note l'**IP publique** (ex: `129.154.xx.xx`)

---

## 4. Configurer le firewall

### Firewall cloud (Security Lists)

1. Menu hamburger → **Networking** → **Virtual Cloud Networks**
2. Clique sur le VCN créé automatiquement
3. **Security Lists** → **Default Security List**
4. **Add Ingress Rules** :

| Champ | Valeur |
|-------|--------|
| Source CIDR | `0.0.0.0/0` |
| Destination Port Range | `22,80,443` |
| Description | `HTTP, HTTPS, SSH` |

5. Clique **"Add Ingress Rules"**

---

## 5. Se connecter au serveur

### Sur Windows (PowerShell)

```powershell
# Si tu as généré une clé via Oracle
cd ~/Downloads
# Renommer le fichier en .pem si nécessaire
# puis :
ssh -i ton-cle.pem ubuntu@129.154.xx.xx
```

### Sur Mac/Linux

```bash
chmod 400 ~/Downloads/ton-cle.pem
ssh -i ~/Downloads/ton-cle.pem ubuntu@129.154.xx.xx
```

---

## 6. Déployer avec Docker (recommandé)

### Sur le serveur Oracle

```bash
# 1. Mettre à jour le serveur
sudo apt update && sudo apt upgrade -y

# 2. Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Se déconnecter et se reconnecter (pour le groupe docker)
exit
ssh -i ton-cle.pem ubuntu@129.154.xx.xx

# 4. Installer Docker Compose
sudo apt install -y docker-compose-plugin

# 5. Cloner le projet
cd /home/ubuntu
git clone https://github.com/nkoumougrinnel/SupOneAI.git
cd SupOneAI

# 6. Configurer l'environnement
cp deploy/oracle/.env.example .env
nano .env  # Édite les variables (voir ci-dessous)

# 7. Lancer le déploiement
bash deploy/oracle/deploy.sh
```

### Variables d'environnement à configurer

Édite le fichier `.env` :

```bash
# Générer une clé secrète Django
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

# Ta clé Gemini API
GEMINI_API_KEY=ta_cle_gemini_api

# IP publique ou domaine
ALLOWED_HOSTS=129.154.xx.xx,suponeapi.com
CORS_ALLOWED_ORIGINS=https://suponeai.netlify.app,https://suponeapi.com
```

---

## 7. Déployer sans Docker

Si tu préfères ne pas utiliser Docker :

```bash
# Sur le serveur Oracle
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.13 python3.13-venv python3-pip git nginx certbot python3-certbot-nginx build-essential libpq-dev

# Cloner le projet
cd /home/ubuntu
git clone https://github.com/nkoumougrinnel/SupOneAI.git
cd SupOneAI

# Environnement virtuel
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Configurer .env
cp deploy/oracle/.env.example backend/.env
nano backend/.env

# Initialiser la BDD
cd backend
python manage.py migrate
python manage.py collectstatic --noinput

# Lancer avec Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 3 --timeout 120
```

Puis configure Nginx et systemd (voir les fichiers dans `deploy/oracle/`).

---

## 8. Configurer un nom de domaine

### Option A — Domaine gratuit (Freenom)

1. Va sur **https://www.freenom.com**
2. Cherche un domaine (.tk, .ml, .ga, .cf)
3. Configure les DNS :

| Type | Name | Value |
|------|------|-------|
| A | @ | 129.154.xx.xx |
| A | www | 129.154.xx.xx |

### Option B — Cloudflare (recommandé)

1. Crée un compte **https://dash.cloudflare.com**
2. Ajoute ton domaine
3. Change les nameservers chez ton registrar
4. Cloudflare donne SSL gratuit + CDN + protection DDoS

### Option C — Domaine payant

Achète un domaine sur Namecheap, Google Domains, ou OVH (~$10/an).

---

## 9. Activer HTTPS

### Avec Certbot (Let's Encrypt — gratuit)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Générer le certificat (remplace par ton domaine)
sudo certbot --nginx -d suponeapi.com -d www.suponeapi.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run

# Le renouvellement est automatique via cron
```

### Vérifier que HTTPS fonctionne

```bash
curl -I https://suponeapi.com/api/health/
```

---

## 10. Mettre à jour l'APK

### Sur ton PC

```bash
cd frontend/app

# Modifier l'URL du backend
echo "VITE_API_URL=https://suponeapi.com" > .env
# ou sans domaine : echo "VITE_API_URL=http://129.154.xx.xx" > .env

# Rebuild
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

L'APK est dans : `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 11. Sauvegardes automatiques

Le script `deploy/oracle/backup.sh` crée des sauvegardes quotidiennes.

### Installer la sauvegarde automatique

```bash
# Rendre exécutable
chmod +x /home/ubuntu/SupOneAI/deploy/oracle/backup.sh

# Ajouter au crontab (tous les jours à 2h du matin)
crontab -e
# Ajouter cette ligne :
0 2 * * * /home/ubuntu/SupOneAI/deploy/oracle/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### Restaurer une sauvegarde

```bash
# Lister les sauvegardes
ls -la /home/ubuntu/backups/

# Restaurer
cd /home/ubuntu/SupOneAI
tar -xzf /home/ubuntu/backups/supone-backup-YYYYMMDD.tar.gz
```

---

## 12. Monitoring et maintenance

### Voir les logs

```bash
# Docker
docker compose logs -f api
docker compose logs -f nginx

# Sans Docker
sudo journalctl -u supone -f
sudo tail -f /var/log/nginx/access.log
```

### Vérifier l'état

```bash
# Docker
docker compose ps
docker stats

# Sans Docker
sudo systemctl status supone
htop
df -h
```

### Redémarrer

```bash
# Docker
docker compose restart api

# Sans Docker
sudo systemctl restart supone
```

### Mettre à jour

```bash
cd /home/ubuntu/SupOneAI
git pull origin main
docker compose up -d --build
# ou sans Docker :
source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart supone
```

---

## 13. Dépannage

| Problème | Solution |
|----------|----------|
| "Out of host capacity" | Change de région ou attends quelques heures |
| API ne répond pas | `docker compose logs api` ou `sudo systemctl status supone` |
| Erreur 502 Bad Gateway | Vérifie que Gunicorn tourne : `docker compose exec api ps aux` |
| SSL ne fonctionne pas | Vérifie les DNS : `dig suponeapi.com` |
| RAM pleine | `docker system prune -a` ou redémarre |
| APK ne connecte pas | Vérifie `VITE_API_URL` dans `.env` et rebuild l'APK |

---

## Architecture finale

```
┌──────────────────────────────────────────────────┐
│           ORACLE CLOUD (GRATUIT $0)              │
│                                                  │
│  ┌──────────┐    ┌──────────────┐               │
│  │  Nginx   │───▶│  Gunicorn    │               │
│  │  :443    │    │  (Django)    │               │
│  │  (HTTPS) │    │  :8001       │               │
│  └──────────┘    └──────┬───────┘               │
│                         │                        │
│                ┌────────▼────────┐               │
│                │  PostgreSQL     │               │
│                │  (Docker)       │               │
│                └────────┬────────┘               │
│                         │                        │
│                ┌────────▼────────┐               │
│                │  FAISS + spaCy  │               │
│                │  (en mémoire)   │               │
│                └─────────────────┘               │
└──────────────────────────────────────────────────┘
                       │
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────┐
│         APK Android (Téléphone)                  │
│    VITE_API_URL = https://suponeapi.com          │
└──────────────────────────────────────────────────┘
```

---

*Guide créé pour SUP'ONE AI — Club Informatique SUP'PTIC*
