# PersonalFit 🏋️

**AI-Powered Personal Fitness Platform with Gamification**

Self-hosted • Privacy-first • Full control over your data

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-PolyForm%20NC-red)](LICENSE)

---

## ⚠️ License Notice

> **This software is NOT free for commercial use.**
>
> PersonalFit is licensed under the **PolyForm Noncommercial License 1.0.0**.
>
> ✅ **Allowed**: Personal use, learning, research, non-profit organizations
> ❌ **Not Allowed**: Commercial use, SaaS integration, reselling
>
> **For commercial licensing, contact:** phillipjuanvanderberg@gmail.com

See the [LICENSE](LICENSE) file for full terms.

---

## 🎯 What is PersonalFit?

PersonalFit is a comprehensive, self-hosted fitness tracking application that combines **AI-powered workout generation** with **gamification** to keep you motivated. Built with a modern TypeScript stack, it offers a complete solution for tracking workouts, progress, and maintaining accountability—all while keeping your data private.

### Why PersonalFit?

| Feature | Benefit |
|---------|---------|
| 🔒 **Privacy-First** | Your fitness data stays on YOUR server |
| 💰 **No Subscriptions** | Host it yourself, no monthly fees |
| 🎮 **Gamification** | XP, levels, streaks, 42 achievements |
| 🤖 **Multi-AI Support** | OpenAI, Anthropic Claude, or OpenRouter |
| 📱 **Responsive** | Works beautifully on desktop, tablet, mobile |
| 🛡️ **Production-Ready** | Rate limiting, security headers, error boundaries |

---

## ✨ Features

### 🎮 Gamification System
- **XP & Leveling** — Earn experience points for every workout completed
- **42 Achievements** — Unlock badges for milestones (First Workout, Week Warrior, Century Club, etc.)
- **Streak Tracking** — Build daily workout streaks with freeze protection
- **Daily Challenges** — Fresh challenges every day for bonus XP
- **Personal Records** — Track PRs with automatic detection
- **Gems Currency** — Earn gems to purchase streak freezes

### 🤖 AI Workout Generation
- **Multi-Provider** — OpenAI GPT-4, Anthropic Claude, or OpenRouter
- **Personalized Plans** — Based on goals, equipment, experience, injuries
- **Multi-Agent Orchestration** — Planner → Worker → Reviewer pipeline
- **Token Management** — Smart token counting and budget optimization
- **Retry Logic** — Exponential backoff with jitter for reliability
- **Response Validation** — Zod schemas ensure valid AI responses

### 📅 Smart Scheduling
- **Visual Calendar** — Week and month views
- **Workout Details** — Click any day for full exercise breakdown
- **Progress Tracking** — Completed vs planned at a glance
- **Missed Workout Detection** — Automated accountability

### 💪 Workout Management
- **Multiple Plans** — Generate and save multiple workout programs
- **Active Plan System** — One active plan at a time
- **Plan Preview** — Weekly schedule with XP forecasts
- **Session Logging** — Track sets, reps, weight, RPE, notes

### 📊 Progress Tracking
- **Body Metrics** — Weight, body fat, measurements over time
- **Progress Photos** — Front/side/back with S3-compatible storage
- **Charts & Trends** — Visualize your journey with Recharts
- **Equipment Inventory** — Track your home gym

### 🔔 Accountability
- **Streak Penalties** — Gamified consequences for missed workouts
- **Makeup Workouts** — Clear penalties by completing extra sessions
- **Partner System** — Invite accountability partners (coming soon)

### 🛡️ Security & Performance
- **3-Tier Rate Limiting** — Auth (10/min), AI (10/hr), General (100/min)
- **Helmet Security Headers** — XSS, HSTS, CSP protection
- **API Key Encryption** — User keys encrypted at rest
- **Error Boundaries** — Graceful crash recovery
- **Optimistic Updates** — Instant UI feedback

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 22 | Runtime |
| Express 5.1 | Web framework |
| TypeScript 5.9 | Type safety |
| MongoDB 8.x | Database |
| Mongoose 8.x | ODM |
| OpenAI SDK | AI integration |
| Anthropic SDK | Claude support |
| tiktoken | Token counting |
| Zod | Schema validation |
| Jest | Testing (170+ tests) |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite 7 | Build tool |
| TypeScript 5.9 | Type safety |
| TailwindCSS 3 | Styling |
| TanStack Query | Server state |
| Zustand | Client state |
| React Hook Form | Form handling |
| Zod | Validation |
| Framer Motion | Animations |
| Recharts | Data visualization |
| Playwright | E2E testing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| Nginx | Reverse proxy |
| MinIO | S3-compatible storage |

---

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- (Optional) Node.js 22+ for local development

### 1. Clone & Configure

```bash
git clone https://github.com/Poolchaos/PersonalFit.git
cd PersonalFit

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Set Environment Variables

**backend/.env:**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/personalfit
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_SECRET=your-32-char-encryption-key
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env:**
```bash
VITE_API_URL=http://localhost:5000
```

### 3. Launch

```bash
docker-compose up -d
```

### 4. Access

| Service | URL |
|---------|-----|
| 🌐 Web App | http://localhost:3000 |
| 🔌 API | http://localhost:5000 |
| 🗄️ MinIO Console | http://localhost:9003 |

---

## 🧪 Development

### Run Backend Locally
```bash
cd backend
npm install
npm run dev
```

### Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
# Backend tests
cd backend && npm test

# Frontend E2E tests
cd frontend && npm run test:e2e
```

---

## 📁 Project Structure

```
PersonalFit/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   │   └── ai/          # AI orchestration layer
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── validators/      # Request validation
│   │   └── __tests__/       # Jest tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route components
│   │   ├── components/      # Reusable UI
│   │   ├── design-system/   # Component library
│   │   ├── hooks/           # Custom React hooks
│   │   ├── api/             # API client & query keys
│   │   ├── store/           # Zustand stores
│   │   └── utils/           # Helpers & validation
│   ├── e2e/                 # Playwright tests
│   └── Dockerfile
├── docs/                    # Documentation
├── docker-compose.yml
└── LICENSE
```

---

## 📜 Legal

### Copyright
Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.

### License
This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

**What this means:**
- ✅ You CAN use this for personal fitness tracking
- ✅ You CAN study and learn from the code
- ✅ You CAN use this at non-profit organizations
- ❌ You CANNOT use this in a commercial product
- ❌ You CANNOT sell this or offer it as a service
- ❌ You CANNOT use this within a for-profit company

### Commercial Use
If you want to use PersonalFit commercially, you need a paid license.

**Contact:** phillipjuanvanderberg@gmail.com

Available license tiers:
- **Startup License** — For companies with < $1M annual revenue
- **Enterprise License** — For larger organizations
- **OEM License** — For embedding in your products

---

## 🤝 Contributing

Contributions are welcome! Please note that by contributing, you agree that your contributions will be licensed under the same PolyForm Noncommercial License.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## 🐛 Found a Bug?

If you're using PersonalFit and encounter any issues, please help us improve by reporting them!

**How to report:**
1. Check if the issue already exists in [GitHub Issues](https://github.com/Poolchaos/PersonalFit/issues)
2. If not, [create a new issue](https://github.com/Poolchaos/PersonalFit/issues/new)
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Docker version, browser)
   - Any error messages or screenshots

**Your feedback helps make PersonalFit better for everyone!**

---

## 📧 Contact

**Phillip-Juan van der Berg**
📧 phillipjuanvanderberg@gmail.com

---

<p align="center">
  <strong>Built with ❤️ for fitness enthusiasts who value privacy</strong>
</p>
