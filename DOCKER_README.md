# PersonalFit - Docker Setup Guide

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v2.0+
- 4GB+ available RAM

### First Time Setup

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd PersonalFit
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** with your actual values:
   ```env
   MONGO_ROOT_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret-32-chars-min
   JWT_REFRESH_SECRET=your-refresh-secret-32-chars-min
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Check services are running**
   ```bash
   docker-compose ps
   ```

## 📡 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | REST API endpoints |
| Health Check | http://localhost:5000/health | API health status |
| MongoDB | mongodb://localhost:27017 | Database (use MongoDB Compass) |

## 🔧 Common Commands

### Start Services
```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild Services
```bash
# Rebuild after code changes
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

## 🔍 Health Checks

### Check Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T..."
}
```

### Check MongoDB Connection
```bash
docker exec -it personalfit-mongodb mongosh \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  personalfit \
  --eval "db.runCommand('ping')"
```

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**
```bash
# Find process using the port (Windows)
netstat -ano | findstr :5000

# Kill the process (Windows - run as admin)
taskkill /PID <process-id> /F

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different host port
```

### MongoDB Connection Failed

**Error:** Backend can't connect to MongoDB

**Solution:**
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Not Starting

**Solution:**
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose config

# Rebuild backend
docker-compose up -d --build backend
```

### Hot Reload Not Working

**Solution:**
```bash
# Ensure volume mounts are correct in docker-compose.yml
# Stop and restart with fresh mount
docker-compose down
docker-compose up -d
```

## 📊 Database Management

### Access MongoDB Shell
```bash
docker exec -it personalfit-mongodb mongosh \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  personalfit
```

### Backup Database
```bash
docker exec personalfit-mongodb mongodump \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  -d personalfit \
  -o /data/backup

# Copy backup to host
docker cp personalfit-mongodb:/data/backup ./backup
```

### Restore Database
```bash
# Copy backup to container
docker cp ./backup personalfit-mongodb:/data/backup

# Restore
docker exec personalfit-mongodb mongorestore \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  -d personalfit \
  /data/backup/personalfit
```

### View Database Contents
```bash
# Using MongoDB Compass (GUI)
# Connection string:
mongodb://admin:your-password@localhost:27017/personalfit?authSource=admin
```

## 🧪 Running Tests

### Run Tests in Docker
```bash
docker-compose exec backend npm test
```

### Run Tests Locally
```bash
cd backend
npm test
```

## 🔐 Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default passwords** - Use strong, unique passwords
3. **Rotate JWT secrets** - Regularly update JWT secrets in production
4. **OpenAI API Key** - Keep your API key secure and monitor usage
5. **Database access** - MongoDB is accessible from host for development only

## 📦 Production Deployment

For production deployment:

1. **Use production Dockerfile target:**
   ```yaml
   target: production
   ```

2. **Set NODE_ENV:**
   ```env
   NODE_ENV=production
   ```

3. **Use secrets management** (Docker Swarm, Kubernetes, etc.)

4. **Enable HTTPS** with reverse proxy (nginx, Traefik)

5. **Disable MongoDB host port** (only internal network)

6. **Configure proper backups** and monitoring

## 🆘 Getting Help

- Check service logs: `docker-compose logs -f <service>`
- View container status: `docker-compose ps`
- Inspect container: `docker inspect <container-name>`
- Review architecture: See `DOCKER_ARCHITECTURE.md`

## 🛠️ Development Workflow

### Making Backend Changes

1. Edit files in `backend/src/`
2. Changes auto-reload (nodemon)
3. Check logs: `docker-compose logs -f backend`
4. Run tests: `docker-compose exec backend npm test`

### Adding Dependencies

```bash
# Add to package.json
cd backend
npm install <package>

# Rebuild container
docker-compose up -d --build backend
```

### Clean Slate

```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

## Port Reference

| Port | Service | Purpose |
|------|---------|---------|
| 27017 | MongoDB | Database |
| 5000 | Backend | REST API |
| 3000 | Frontend | React App (future) |

**No port conflicts** - All services use standard ports that don't conflict with typical development environments.
