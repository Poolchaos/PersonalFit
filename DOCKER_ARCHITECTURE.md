# Docker Architecture Plan

## Port Allocation (No Conflicts)

| Service | Internal Port | Host Port | Description |
|---------|--------------|-----------|-------------|
| MongoDB | 27017 | 27017 | Database |
| Backend API | 5000 | 5000 | Express.js REST API |
| Frontend | 3000 | 3000 | React (future) |

## Network Architecture

```
personalfit-network (bridge)
├── mongodb (container)
│   └── Port: 27017 (internal only, exposed to host)
├── backend (container)
│   ├── Port: 5000 (exposed to host)
│   └── Connects to: mongodb://mongodb:27017/personalfit
└── frontend (container - future)
    ├── Port: 3000 (exposed to host)
    └── Connects to: http://backend:5000/api
```

## Service Dependencies

1. **MongoDB** - No dependencies
2. **Backend** - Depends on MongoDB
3. **Frontend** - Depends on Backend

## Volume Mounts

- **mongodb-data**: Persistent database storage
- **backend/src**: Development hot-reload (optional)

## Environment Variables

### MongoDB
- `MONGO_INITDB_ROOT_USERNAME`: admin
- `MONGO_INITDB_ROOT_PASSWORD`: (from .env)
- `MONGO_INITDB_DATABASE`: personalfit

### Backend
- `NODE_ENV`: development
- `PORT`: 5000
- `MONGODB_URI`: mongodb://mongodb:27017/personalfit
- `JWT_SECRET`: (from .env)
- `JWT_REFRESH_SECRET`: (from .env)
- `OPENAI_API_KEY`: (from .env)
- `CORS_ORIGIN`: http://localhost:3000

## Health Checks

- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`
- **Backend**: `curl -f http://localhost:5000/health`

## Build Strategy

### Backend
- Multi-stage Dockerfile
- Stage 1: Dependencies install
- Stage 2: TypeScript build
- Stage 3: Production runtime (minimal image)

### Development Mode
- Hot-reload with nodemon
- Volume mount source code
- Skip production build

## Security Considerations

- MongoDB uses authentication
- Backend JWT secrets in environment variables (not in code)
- OpenAI API key stored securely
- No root user in containers
- Network isolation between containers
