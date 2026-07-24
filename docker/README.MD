# Kitchen Ledger - Docker Setup

## Struktur Folder
```
docker/
├── Dockerfile.server          # Production backend
├── Dockerfile.client          # Production frontend (Nginx)
├── Dockerfile.server.dev      # Development backend
├── Dockerfile.client.dev      # Development frontend
├── docker-compose.yml         # Production
├── docker-compose.dev.yml     # Development
├── nginx.conf                 # Nginx config untuk production
├── .env.example               # Template environment variables
├── deploy.sh                  # Deploy script
└── .dockerignore              # Files to exclude from build
```

---

## Quick Start (Production)

### 1. Clone & Setup
```bash
git clone https://github.com/faruqputraaa/kitchen-ledger.git
cd kitchen-ledger/docker
cp .env.example .env
# Edit .env dengan nilai asli (JWT_SECRET, GOOGLE_CLIENT_ID, dll)
```

### 2. Generate Secrets
```bash
# Generate JWT secrets
openssl rand -base64 32
# Copy output ke JWT_SECRET dan JWT_REFRESH_SECRET di .env
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh prod
```

Atau manual:
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 4. Akses
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000/api/v1/health
- **MongoDB**: mongodb://localhost:27017

---

## Development Mode

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f server

# Stop
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

**Akses Development:**
- **Frontend (Vite HMR)**: http://localhost:5173
- **Backend (Nodemon)**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (32+ chars) |
| `SESSION_SECRET` | ✅ | Session secret for Google OAuth (32+ chars) |
| `CLIENT_URL` | ✅ | Frontend URL (CORS & OAuth redirect) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `MONGODB_URI` | ❌ | External MongoDB URI (default: internal) |

---

## Google OAuth Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Buat **OAuth 2.0 Client ID** (Web application)
3. **Authorized redirect URIs**:
   - Production: `https://yourdomain.com/api/v1/auth/google/callback`
   - Development: `http://localhost:5000/api/v1/auth/google/callback`
4. Copy `Client ID` & `Client Secret` ke `.env`

---

## Production Deployment (VPS)

### Prerequisites
- Docker & Docker Compose installed
- Domain pointing to VPS IP
- SSL certificates (Let's Encrypt recommended)

### Setup Reverse Proxy (Nginx/Caddy)
```nginx
# /etc/nginx/sites-available/kitchen-ledger
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;  # Docker client container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:5000;  # Docker server container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Let's Encrypt
```bash
certbot --nginx -d yourdomain.com
```

---

## Common Commands

```bash
# View logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb

# Restart single service
docker-compose restart server

# Rebuild & restart
docker-compose build server && docker-compose up -d server

# Database backup
docker exec kitchen-ledger-db mongodump --uri="mongodb://localhost:27017/kitchen_ledger" --out=/data/backup

# Database restore
docker exec -i kitchen-ledger-db mongorestore --uri="mongodb://localhost:27017/kitchen_ledger" /data/backup/kitchen_ledger

# Shell into container
docker exec -it kitchen-ledger-server sh
docker exec -it kitchen-ledger-client sh
docker exec -it kitchen-ledger-db mongosh

# Clean up
docker-compose down -v  # Remove volumes too
docker system prune -a  # Remove unused images
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port
lsof -i :80
lsof -i :5000
lsof -i :5173

# Kill or change ports in docker-compose.yml
```

### MongoDB Connection Failed
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string
docker exec kitchen-ledger-db mongosh "mongodb://localhost:27017/kitchen_ledger" --eval "db.runCommand({ping: 1})"
```

### Frontend Not Loading (404 on Refresh)
- Check nginx.conf has `try_files $uri $uri/ /index.html;`
- Verify nginx is reloading config

### CORS Error
- Verify `CLIENT_URL` in `.env` matches frontend URL exactly (including protocol)
- Check server CORS config allows the URL

---

## Folder Structure Mapping (Docker Context)

Build context adalah **root project** (`..`), sehingga:
```
docker/
├── Dockerfile.server          # COPY server/... 
├── Dockerfile.client          # COPY client/...
└── nginx.conf                 # COPY docker/nginx.conf
```

---

## Notes

- **Production**: `docker-compose.yml` (nginx serves static files, proxies API)
- **Development**: `docker-compose.yml` + `docker-compose.dev.yml` (Vite HMR + Nodemon)
- **Volumes**: MongoDB data persisted in named volumes
- **Network**: All services on same Docker network
- **Health Checks**: Server & MongoDB have healthchecks