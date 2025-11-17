# PersonalFit 🏋️

**AI-Powered Personal Fitness Platform with Gamification**

Self-hosted • Privacy-first • Zero subscription fees • Full control

[![Tests](https://img.shields.io/badge/tests-172%2F172%20passing-success)](backend/tests)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🎯 Overview

PersonalFit is a comprehensive, self-hosted fitness tracking application that combines AI-powered workout generation with gamification elements to keep you motivated. Built with modern web technologies, it offers a complete solution for tracking workouts, progress, and maintaining accountability—all while keeping your data private and under your control.

### Why PersonalFit?

- 🔒 **Complete Privacy**: Your fitness data stays on your server
- 💰 **Zero Cost**: No monthly subscriptions, just hosting costs
- 🎮 **Gamification**: XP, levels, streaks, and achievements keep you motivated
- 🤖 **AI-Powered**: Generate personalized workouts using OpenAI, Anthropic, or OpenRouter
- 📱 **Responsive Design**: Beautiful UI that works on desktop, tablet, and mobile
- 🏠 **Self-Hosted**: Full control over your data and customization

---

## ✨ Key Features

### 🎮 Gamification System
- **XP & Leveling**: Earn experience points for completing workouts
- **Streak Tracking**: Build daily workout streaks with visual indicators
- **Achievements**: Unlock badges for hitting milestones
- **Progress Visualization**: XP progress bars and level indicators throughout the app

### 🤖 AI Workout Generation
- **Multi-Provider Support**: OpenAI, Anthropic Claude, or OpenRouter
- **Personalized Plans**: Based on your goals, equipment, and experience level
- **Structured Programs**: 4+ week programs with progressive overload
- **Detailed Instructions**: Every exercise includes form cues and modifications

### 📅 Smart Scheduling
- **Visual Calendar**: Week and month views of your workout schedule
- **Workout Details Modal**: Click any day to see full exercise details
- **Current Day Highlighting**: Always know what workout is today
- **Progress Tracking**: See completed vs planned workouts at a glance

### 💪 Workout Management
- **Multiple Plans**: Generate and save multiple workout plans
- **Active Plan System**: Set one plan as active at a time
- **Plan Preview**: View weekly schedule with XP forecasts
- **Delete with Confirmation**: Modern modal dialogs for safety

### 📊 Comprehensive Tracking
- **Body Metrics**: Weight, body fat percentage, measurements
- **Progress Photos**: Upload front/side/back photos with S3-compatible storage
- **Workout Sessions**: Log sets, reps, and notes for every workout
- **Equipment Inventory**: Track your gym equipment and prevent duplicates

### 🎨 Modern User Experience
- **Responsive Navigation**: Hamburger menu on mobile, horizontal nav on desktop
- **Modal Dialogs**: Professional confirmation dialogs instead of browser alerts
- **Visual Feedback**: Loading states, success toasts, error handling
- **Smooth Animations**: Framer Motion for delightful transitions
- **Design System**: Consistent components with TailwindCSS

### 🔔 Accountability Features
- **Daily Check-ins**: Automated detection of missed workouts
- **Streak Penalties**: Gamified consequences for breaking streaks
- **Penalty System**: Complete makeup workouts to clear penalties
- **Visual Indicators**: See your streak status on the dashboard

---

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 with TypeScript 5
- **Framework**: Express 5 with modern async/await patterns
- **Database**: MongoDB 7.0 with Mongoose ODM
- **Authentication**: JWT with refresh tokens and bcrypt hashing
- **Storage**: MinIO (S3-compatible) for progress photos
- **AI Integration**: Multi-provider support (OpenAI, Anthropic, OpenRouter)
- **Validation**: Joi schema validation
- **Testing**: Jest with 172/172 tests passing
- **Scheduling**: Node-cron for automated tasks

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: TailwindCSS 3 with custom design system
- **Routing**: React Router 6 with protected routes
- **State Management**: Zustand for global state, TanStack Query for server state
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for consistent iconography
- **Testing**: Playwright for E2E tests
- **Forms**: React Hook Form with validation

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx for frontend serving
- **Storage**: MinIO for S3-compatible object storage
- **Database**: MongoDB with persistent volumes

---

## 📦 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** (required for backend services)
- **Node.js 20+** (optional, for local frontend development)
- **Git** (for cloning the repository)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Poolchaos/PersonalFit.git
cd PersonalFit
```

#### 2. Set Up Environment Variables

**Backend** (`backend/.env`):
```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://mongodb:27017/personalfit

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# Encryption (for API keys)
ENCRYPTION_SECRET=your-32-character-encryption-key

# CORS
CORS_ORIGIN=http://localhost:5173

# AI Provider (choose one)
OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
# OPENROUTER_API_KEY=sk-or-your-openrouter-key-here

# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_EXTERNAL_URL=http://localhost:9002
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:5000
```

#### 3. Start All Services
```bash
# Start MongoDB, MinIO, Backend, and Frontend
docker-compose up -d

# View logs
docker-compose logs -f
```

#### 4. Access the Application

- **🌐 Web App**: http://localhost:3000
- **🔌 API**: http://localhost:5000
- **🗄️ MinIO Console**: http://localhost:9003
  - Username: `minioadmin`
  - Password: `minioadmin123`

### Alternative: Local Frontend Development

If you prefer hot-reload during frontend development:

```bash
# Start only backend services
docker-compose up -d backend mongodb minio

# In a separate terminal, run frontend locally
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173

---

## 🎯 Getting Started Guide

### First Time Setup

1. **Create Account**
   - Navigate to http://localhost:3000/signup
   - Enter email and password
   - Click "Sign Up"

2. **Complete Onboarding**
   - Add personal details (name, date of birth, height, weight)
   - Set fitness goals (muscle gain, fat loss, endurance, etc.)
   - Select experience level (beginner, intermediate, advanced)
   - List available equipment
   - Add current activities and injury information

3. **Configure AI Provider** (Optional but recommended)
   - Go to Profile → AI Configuration
   - Enter your OpenAI/Anthropic/OpenRouter API key
   - Select provider and model
   - Test connection

4. **Generate Your First Workout**
   - Navigate to Workouts
   - Click "Generate AI Workout"
   - Review the generated plan
   - Set it as active

5. **Start Training**
   - View today's workout on Dashboard
   - Click "Start Workout" to begin session
   - Log sets and reps
   - Complete workout to earn XP and build streaks

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/personalfit

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_SECRET=your-encryption-key-here

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# AI Provider (Optional - for workout generation)
OPENAI_API_KEY=sk-your-key-here
# Or use Anthropic:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# Or use OpenRouter:
# OPENROUTER_API_KEY=sk-or-your-key-here

# MinIO Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_EXTERNAL_URL=http://localhost:9002
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Current Status**: ✅ **172/172 tests passing**

Test coverage includes:
- Authentication & JWT tokens
- Profile management
- Equipment CRUD with duplicate prevention
- Workout plan generation (AI integration)
- Gamification (XP, levels, streaks)
- Body metrics tracking
- Session logging
- Accountability system
- Photo upload/download
- Error handling

### Frontend E2E Testing

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test auth.spec.ts
```

E2E test suites:
- Authentication flow
- Onboarding wizard
- Profile management
- Equipment management
- Workout generation
- Workout plan management
- Metrics tracking
- Accountability system

### Manual API Testing

PowerShell test script included:

```powershell
# Windows
.\test-api.ps1

# Or test individual endpoints
curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

---

## 🏗️ Project Structure

```
PersonalFit/
├── backend/                          # Node.js/Express API
│   ├── src/
│   │   ├── __tests__/               # Jest test suites (172 tests)
│   │   ├── config/                  # Database and app configuration
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── workoutController.ts
│   │   │   ├── gamificationController.ts
│   │   │   └── ...
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.ts              # User with gamification fields
│   │   │   ├── WorkoutPlan.ts       # Nested plan_data structure
│   │   │   ├── Equipment.ts         # With unique constraints
│   │   │   └── ...
│   │   ├── routes/                  # API route definitions
│   │   ├── services/                # Business logic
│   │   │   ├── aiProviderService.ts # Multi-provider AI
│   │   │   ├── gamificationService.ts
│   │   │   └── openaiService.ts
│   │   ├── middleware/              # Auth, validation, error handling
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── utils/                   # Helper functions
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # Server entry point
│   ├── Dockerfile                   # Backend container
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # React/Vite application
│   ├── src/
│   │   ├── api/                     # API client functions
│   │   │   ├── index.ts             # Main API client
│   │   │   └── gamification.ts
│   │   ├── assets/                  # Images and static files
│   │   ├── components/              # Reusable components
│   │   │   ├── calendar/            # Week/Month calendar views
│   │   │   ├── charts/              # Progress visualizations
│   │   │   ├── dashboard/           # Dashboard cards
│   │   │   ├── gamification/        # XP, streaks, achievements
│   │   │   ├── navigation/          # Mobile bottom nav
│   │   │   ├── onboarding/          # Multi-step wizard
│   │   │   ├── workout/             # Workout components
│   │   │   └── Layout.tsx           # Main layout with nav
│   │   ├── design-system/           # Design system components
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx       # Variant-based button
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx        # Modal & ConfirmModal
│   │   │   │   └── Skeleton.tsx
│   │   │   ├── tokens/              # Design tokens
│   │   │   └── utils/
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── pages/                   # Page components
│   │   │   ├── DashboardPage.tsx    # Today's workout & stats
│   │   │   ├── WorkoutsPage.tsx     # Manage workout plans
│   │   │   ├── SchedulePage.tsx     # Calendar view with modal
│   │   │   ├── WorkoutSessionPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── ...
│   │   ├── store/                   # Zustand state management
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── utils/                   # Helper functions
│   │   ├── App.tsx                  # App entry point
│   │   ├── main.tsx                 # React DOM render
│   │   └── index.css                # Global styles
│   ├── e2e/                         # Playwright E2E tests
│   ├── Dockerfile                   # Frontend container
│   ├── nginx.conf                   # Nginx configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docs/                            # Documentation
│   ├── _rules/                      # Project rules
│   ├── plan/                        # Project planning
│   └── UX-improvements/             # UX design docs
│
├── mongo-init/                      # MongoDB initialization
│   └── init-db.js
│
├── docker-compose.yml               # Multi-container orchestration
├── test-api.ps1                     # PowerShell API testing script
├── README.md                        # This file
└── .env.example                     # Environment template
```

---

## 🐳 Docker Guide

### Container Architecture

| Service | Container Name | Port(s) | Description |
|---------|---------------|---------|-------------|
| Frontend | `personalfit-frontend` | 3000 | React app served by Nginx |
| Backend | `personalfit-backend` | 5000 | Node.js/Express API |
| MongoDB | `personalfit-mongodb` | 27017 | Database with persistent volume |
| MinIO | `personalfit-minio` | 9000, 9002, 9003 | S3-compatible object storage |

### Common Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d backend mongodb

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Check service status
docker-compose ps

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose stop

# Stop and remove containers (data persists)
docker-compose down

# Remove everything including volumes (⚠️ DELETES DATA)
docker-compose down -v

# Rebuild a service
docker-compose build backend
docker-compose up -d backend

# Execute command in running container
docker-compose exec backend npm test
docker-compose exec mongodb mongosh

# View resource usage
docker stats
```

### Volumes

Data is persisted in Docker volumes:
- `mongodb-data`: Database files
- `minio-data`: Progress photos

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect personalfit_mongodb-data

# Backup database
docker-compose exec mongodb mongodump --out=/dump
docker cp personalfit-mongodb:/dump ./backup

# Restore database
docker cp ./backup personalfit-mongodb:/dump
docker-compose exec mongodb mongorestore /dump
```

---

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev        # Hot reload with nodemon
npm test          # Run tests
npm run build     # Build for production
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev       # Dev server on :5173
npm run build     # Production build
npm run preview   # Preview production build
```

---

## 📊 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login and get tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Profile & Preferences

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get user profile | Yes |
| PUT | `/api/profile` | Update profile | Yes |
| PUT | `/api/profile/preferences` | Update preferences | Yes |

### Gamification

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/gamification/status` | Get XP, level, streak | Yes |
| POST | `/api/gamification/complete-workout` | Award XP for workout | Yes |
| GET | `/api/gamification/achievements` | List achievements | Yes |

### Workout Plans

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/workouts/generate` | Generate AI workout plan | Yes |
| GET | `/api/workouts` | List all workout plans | Yes |
| GET | `/api/workouts/:id` | Get specific plan | Yes |
| PATCH | `/api/workouts/:id/activate` | Set plan as active | Yes |
| PATCH | `/api/workouts/:id/deactivate` | Deactivate plan | Yes |
| DELETE | `/api/workouts/:id` | Delete workout plan | Yes |

### Workout Sessions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sessions` | List workout sessions | Yes |
| POST | `/api/sessions` | Log new session | Yes |
| GET | `/api/sessions/:id` | Get session details | Yes |
| PUT | `/api/sessions/:id` | Update session | Yes |
| DELETE | `/api/sessions/:id` | Delete session | Yes |

### Equipment Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/equipment` | List equipment | Yes |
| POST | `/api/equipment` | Add equipment | Yes |
| PUT | `/api/equipment/:id` | Update equipment | Yes |
| DELETE | `/api/equipment/:id` | Delete equipment | Yes |
| POST | `/api/equipment/clean-duplicates` | Remove duplicates | Yes |

### Body Metrics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/metrics` | List body metrics | Yes |
| POST | `/api/metrics` | Add new metric entry | Yes |
| PUT | `/api/metrics/:id` | Update metric | Yes |
| DELETE | `/api/metrics/:id` | Delete metric | Yes |

### Progress Photos

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/photos/upload` | Upload photo to MinIO | Yes |
| GET | `/api/photos` | List user photos | Yes |
| GET | `/api/photos/:userId/:type/:timestamp` | Get signed URL | Yes |
| DELETE | `/api/photos/:userId/:type/:timestamp` | Delete photo | Yes |

### Accountability

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/accountability/status` | Get streak & penalties | Yes |
| GET | `/api/accountability/penalties` | List all penalties | Yes |
| PUT | `/api/accountability/penalties/:id/complete` | Complete penalty | Yes |

### AI Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ai-config` | Get AI settings | Yes |
| PUT | `/api/ai-config` | Update AI provider | Yes |
| POST | `/api/ai-config/test` | Test AI connection | Yes |
| DELETE | `/api/ai-config/api-key` | Delete API key | Yes |

---

## � Production Deployment

### Pre-Deployment Checklist

- [ ] Update all environment variables for production
- [ ] Change default passwords (MongoDB, MinIO)
- [ ] Generate strong JWT secrets (use `openssl rand -base64 32`)
- [ ] Configure production domain in CORS settings
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Set up monitoring and logging
- [ ] Review and remove test data
- [ ] Test all critical flows

### Environment Configuration

**Production Backend** (`.env`):
```bash
NODE_ENV=production
PORT=5000

# Use strong secrets!
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_SECRET=<generate-with-openssl-rand-base64-32>

# Production database
MONGODB_URI=mongodb://username:password@mongodb:27017/personalfit?authSource=admin

# Production domain
CORS_ORIGIN=https://yourdomain.com

# AI Provider
OPENAI_API_KEY=sk-prod-your-real-key-here

# MinIO with SSL
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<strong-access-key>
MINIO_SECRET_KEY=<strong-secret-key>
MINIO_EXTERNAL_URL=https://minio.yourdomain.com
```

### Deployment Options

#### Option A: Single Server (Recommended for Self-Hosting)

1. **Clone repository on your VPS**
   ```bash
   git clone https://github.com/Poolchaos/PersonalFit.git
   cd PersonalFit
   ```

2. **Set up production environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit files with production values
   ```

3. **Update docker-compose.yml for production**
   - Add restart policies
   - Configure networks
   - Set up SSL with Let's Encrypt
   - Add nginx reverse proxy

4. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### Option B: Separate Hosting

**Backend Options:**
- Render.com (free tier available)
- Railway.app
- Heroku
- DigitalOcean App Platform
- AWS ECS/EC2
- Any VPS with Docker

**Frontend Options:**
- Netlify (recommended for React apps)
- Vercel
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

**Database:**
- MongoDB Atlas (free tier available)
- Self-hosted on VPS

**Storage:**
- MinIO on VPS
- AWS S3
- DigitalOcean Spaces
- Wasabi
- Backblaze B2

### SSL/TLS Setup

Using Certbot with Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

### Database Backup Strategy

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

# Create backup
docker-compose exec -T mongodb mongodump --archive=/tmp/dump_${DATE}.gz --gzip

# Copy to host
docker cp personalfit-mongodb:/tmp/dump_${DATE}.gz ${BACKUP_DIR}/

# Keep only last 30 days
find ${BACKUP_DIR} -name "dump_*.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Monitoring

Recommended monitoring tools:
- **Application**: PM2, New Relic, Datadog
- **Infrastructure**: Prometheus + Grafana
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Papertrail, Loggly, ELK Stack

---

## 🔒 Security Features

- Bcrypt password hashing
- JWT with automatic refresh
- Protected API routes
- CORS configuration
- Input validation (Joi)
- File type validation
- XSS protection
- SQL injection protection (Mongoose)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is a personal project, but suggestions and issues are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📚 Documentation

- **Backend Tests**: See `backend/tests/`
- **API Testing**: See `DOCKER_TESTING.md`
- **Test Results**: See `DOCKER_TEST_RESULTS.md`
- **Frontend Guide**: See `FRONTEND_COMPLETE.md`

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Application Won't Start

**Problem**: Docker containers fail to start
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs

# Common fixes
docker-compose down
docker-compose up -d --build
```

#### CORS Errors in Browser Console

**Problem**: `Access-Control-Allow-Origin` errors

**Solution**:
1. Check `CORS_ORIGIN` in `backend/.env` matches frontend URL
2. Restart backend: `docker-compose restart backend`
3. Clear browser cache and cookies
4. Verify frontend URL is correct

#### Authentication Issues

**Problem**: Login fails or token expired errors

**Solutions**:
- Clear browser localStorage: `localStorage.clear()` in console
- Verify JWT secrets are set in backend `.env`
- Check backend is running: `curl http://localhost:5000/api/auth/login`
- Ensure MongoDB is running: `docker-compose ps mongodb`

#### Database Connection Failed

**Problem**: Backend can't connect to MongoDB

**Solutions**:
```bash
# Check MongoDB status
docker-compose ps mongodb
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check connection string in backend/.env
MONGODB_URI=mongodb://mongodb:27017/personalfit
```

#### Photos Not Uploading

**Problem**: MinIO upload failures

**Solutions**:
```bash
# Check MinIO status
docker-compose ps minio
docker-compose logs minio

# Verify MinIO credentials in backend/.env
# Access MinIO console to check buckets
# http://localhost:9003 (minioadmin/minioadmin123)

# Recreate MinIO bucket
docker-compose exec backend npm run init-minio
```

#### AI Workout Generation Fails

**Problem**: "Failed to generate workout" error

**Solutions**:
1. Check AI provider API key is set in backend `.env`
2. Verify API key is valid (test in provider dashboard)
3. Check API quota/limits haven't been exceeded
4. View backend logs: `docker-compose logs backend`
5. Try different AI provider (OpenAI, Anthropic, OpenRouter)

#### Frontend Can't Connect to Backend

**Problem**: Network errors, "Failed to fetch"

**Solutions**:
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check VITE_API_URL in frontend/.env
VITE_API_URL=http://localhost:5000

# Restart frontend
cd frontend
npm run dev

# Check browser console for exact error
# Check browser network tab for failed requests
```

#### Port Already in Use

**Problem**: `Port 5000 is already allocated`

**Solutions**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -i :5000
kill -9 <process_id>

# Or change port in docker-compose.yml and backend/.env
```

#### Docker Out of Space

**Problem**: `no space left on device`

**Solutions**:
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

#### Negative XP or Level Issues

**Problem**: XP shows -100 or incorrect level

**Solution**:
- This was a bug fixed in latest version
- Pull latest code: `git pull origin main`
- Rebuild: `docker-compose up -d --build`

#### Equipment Duplicates

**Problem**: Same equipment appearing multiple times

**Solution**:
```bash
# Run cleanup endpoint
curl -X POST http://localhost:5000/api/equipment/clean-duplicates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or use the UI: Profile → Equipment → Clean Duplicates
```

### Getting Help

If issues persist:

1. **Check Logs**:
   ```bash
   docker-compose logs --tail=100 backend
   docker-compose logs --tail=100 mongodb
   ```

2. **Check Documentation**:
   - Review this README
   - Check `docs/` folder
   - Read inline code comments

3. **Debug Mode**:
   - Set `NODE_ENV=development` in backend
   - Enable verbose logging
   - Use browser DevTools

4. **Create GitHub Issue**:
   - Include error messages
   - Share relevant logs
   - Describe steps to reproduce
   - Include environment details (OS, Docker version)

---

## 🗺️ Roadmap

### ✅ Completed (v1.0)
- [x] User authentication with JWT
- [x] Profile and preferences management
- [x] Equipment inventory tracking
- [x] AI-powered workout generation
- [x] Gamification system (XP, levels, streaks)
- [x] Workout session logging
- [x] Body metrics tracking
- [x] Progress photo uploads
- [x] Accountability system with penalties
- [x] Interactive calendar views
- [x] Responsive mobile design
- [x] Modal dialogs and confirmations
- [x] Comprehensive test coverage
- [x] Docker containerization

### 🚧 In Progress (v1.1)
- [ ] Workout session timer with rest periods
- [ ] Exercise video demonstrations
- [ ] Social features (friend workouts, leaderboards)
- [ ] Advanced analytics and insights
- [ ] Nutrition tracking integration

### 🔮 Future Plans (v2.0+)
- [ ] Mobile apps (iOS/Android with React Native)
- [ ] Progressive Web App (PWA) support
- [ ] Wearable device integration (Apple Watch, Fitbit)
- [ ] Custom exercise library builder
- [ ] Workout plan marketplace
- [ ] AI form check with camera
- [ ] Voice commands during workouts
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Export data to CSV/PDF
- [ ] Integration with MyFitnessPal, Strava
- [ ] Advanced workout programs (periodization)
- [ ] Rest day recovery recommendations
- [ ] Injury prevention insights

### Want to Contribute?

Check out our [Contributing Guidelines](CONTRIBUTING.md) or open an issue to discuss new features!

---

## 🎓 Learning Resources

### Tech Stack Documentation
- [React](https://react.dev/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/docs/) - Database
- [Docker](https://docs.docker.com/) - Containerization
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool

### Related Projects
- [Workout.lol](https://workout.lol/) - AI workout generator
- [Strong](https://www.strong.app/) - Commercial workout tracker
- [FitNotes](https://www.fitnotes.co.uk/) - Android workout app
- [Hevy](https://www.hevyapp.com/) - Social workout tracker

---

## 💡 Use Cases

### For Individuals
- **Home Gym Owners**: Track equipment and generate workouts
- **Privacy Enthusiasts**: Keep fitness data on your own server
- **Developers**: Learn full-stack development with real project
- **Cost-Conscious**: Avoid $10-20/month fitness app subscriptions

### For Families
- **Multiple Profiles**: Each family member has their own account
- **Shared Equipment**: Track what equipment is available at home
- **Accountability**: Family streak challenges and goals

### For Personal Trainers
- **Client Management**: Create accounts for clients
- **Custom Workouts**: Generate personalized workout plans
- **Progress Tracking**: Monitor client progress and metrics
- **Data Privacy**: Keep client data secure and private

### For Developers
- **Portfolio Project**: Full-stack application with modern tech
- **Learning**: Understanding authentication, APIs, Docker
- **Customization**: Modify and extend features
- **Open Source**: Contribute to the community

---

## 🔐 Security & Privacy

### Data Privacy
- **Self-Hosted**: All data stays on your infrastructure
- **No Analytics**: No tracking, no telemetry
- **No Ads**: Clean, focused experience
- **No Third-Party**: Data never shared with external services

### Security Features
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Short-lived access tokens with refresh mechanism
- **API Key Encryption**: Symmetric encryption for stored API keys
- **Input Validation**: Joi schema validation on all inputs
- **File Upload Validation**: Type and size restrictions
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: Prevent brute force attacks (recommended in production)
- **SQL Injection**: Mongoose ORM prevents SQL injection
- **XSS Protection**: React escapes user input automatically

### Best Practices
- Change all default passwords immediately
- Use strong, unique JWT secrets (32+ characters)
- Keep dependencies updated: `npm audit`
- Regular database backups
- Enable HTTPS in production
- Set up firewall rules
- Monitor logs for suspicious activity
- Implement rate limiting in production

---

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, improving documentation, or adding new features, your help is appreciated.

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PersonalFit.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test Your Changes**
   ```bash
   # Run backend tests
   cd backend && npm test

   # Run E2E tests
   cd frontend && npm run test:e2e
   ```

5. **Commit Your Changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include screenshots for UI changes

### Development Guidelines

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused
- Test edge cases

### Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to learn and build together.

---

## 📞 Support & Community

### Get Help

- 📖 **Documentation**: Start with this README and docs folder
- 🐛 **Bug Reports**: [Open an issue](https://github.com/Poolchaos/PersonalFit/issues)
- 💬 **Questions**: Use GitHub Discussions
- 📧 **Email**: Contact via GitHub profile

### Stay Updated

- ⭐ **Star this repo** to receive updates
- 👀 **Watch releases** for new versions
- 🔄 **Pull latest code**: `git pull origin main`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means

✅ **You CAN**:
- Use this software for personal or commercial purposes
- Modify and create derivative works
- Distribute the software
- Use it privately

❌ **You CANNOT**:
- Hold the author liable for damages
- Use the author's name for endorsement

📝 **You MUST**:
- Include the original license and copyright notice

---

## 🙏 Acknowledgments

### Technologies
- Built with [React](https://react.dev/), [Express](https://expressjs.com/), and [MongoDB](https://www.mongodb.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

### Inspiration
- MyFitnessPal, Strong, Hevy, and other fitness tracking apps
- Open source community and self-hosting movement
- Privacy-focused development principles

### Contributors
Thanks to everyone who has contributed to this project!

---

## 📊 Project Stats

- **Language**: TypeScript
- **Backend**: Node.js 20 + Express 5
- **Frontend**: React 18 + Vite
- **Database**: MongoDB 7.0
- **Tests**: 172/172 passing ✅
- **Lines of Code**: 10,000+
- **Docker Images**: 4 services
- **API Endpoints**: 50+

---

## 🌟 Show Your Support

If you find PersonalFit helpful, please consider:

- ⭐ **Starring the repository**
- 🐛 **Reporting bugs**
- 💡 **Suggesting features**
- 🤝 **Contributing code**
- 📢 **Sharing with others**

---

## 📚 Additional Documentation

- [`DOCKER_TESTING.md`](docs/DOCKER_TESTING.md) - Docker testing guide
- [`DOCKER_ARCHITECTURE.md`](docs/DOCKER_ARCHITECTURE.md) - Architecture details
- [`IMPLEMENTATION_SUMMARY.md`](backend/IMPLEMENTATION_SUMMARY.md) - Backend implementation
- [`UX-improvements/`](docs/UX-improvements/) - UX design documentation
- [`docs/plan/`](docs/plan/) - Project planning documents

---

<div align="center">

**Built with ❤️ by fitness enthusiasts, for fitness enthusiasts**

**Status**: ✅ Production Ready | 🧪 172/172 Tests Passing | 🎨 Full UI | 🎮 Gamified

[⬆ Back to Top](#personalfit-)

</div>
