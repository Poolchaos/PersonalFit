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

Self-hosted fitness tracking with **AI-powered workout generation** and **gamification**. Keep your data private, earn XP while working out, and get personalized plans based on your goals and equipment.

---

## 📸 Screenshots

**Onboarding Setup**

![OpenAI API Key Setup](docs/screenshots/1.openai.png)

![User Profile Setup](docs/screenshots/2.get-to-know-you.png)

**Workout Generation & Dashboard**

![Generated Workout Plan](docs/screenshots/3.generated-plan.png)

![Dashboard with Stats](docs/screenshots/4.%20dashboard.png)

---

## ✨ Key Features

- **🎮 Gamification** — XP, levels, 42 achievements, daily challenges, streak tracking
- **🤖 AI Workout Generation** — OpenAI, Claude, or OpenRouter with multi-agent orchestration
- **📅 Smart Scheduling** — Visual calendar, weekly preview, progress tracking
- **💪 Workout Management** — Multiple plans, session logging, active plan system
- **📊 Progress Tracking** — Body metrics, charts, progress photos with S3 storage
- **� Medicine & Supplement Manager** — Track medications, dosages, frequencies, health impacts
- **🔐 Privacy-First** — Self-hosted, your data on your server
- **🛡️ Production-Ready** — Rate limiting, security headers, 170+ tests

---

## 🆕 Medicine & Supplement Manager (Phase 1 & 2)

**Phase 1 (Complete):**
- 📋 Add medications/supplements with dosage, frequency, inventory tracking
- 🏥 Support for prescriptions, OTC, and supplements
- ❤️ Map medications to fitness metrics (heart rate, blood pressure, sleep, energy, etc.)
- ⚠️ Track warnings and contraindications
- 📅 Adherence logging with mood/energy tracking before/after doses
- 🔄 Plan regeneration with medications context in AI prompts
- 🧅 Onboarding integration — collect medications during signup

**Phase 2 (AI Vision - In Progress):**
- 📸 Scan medication bottle labels with camera or photo upload
- 🤖 Claude Vision API for automatic label OCR extraction
- 📊 Confidence scoring for extracted data with manual review/correction flow
- 🔗 Correlation analysis dashboard showing medication impact on fitness metrics
- 💡 Smart insights: "Vitamin D appears to improve sleep by 23%"
- 🎯 Use extracted data to auto-fill medication forms

---

## 🛠️ Tech Stack

**Backend:** Node.js 22, Express 5.1, TypeScript 5.9, MongoDB 8.x, OpenAI/Anthropic SDKs, Jest

**Frontend:** React 19, Vite 7, TypeScript 5.9, TailwindCSS 3, Recharts, Playwright

**Infrastructure:** Docker, Docker Compose, Nginx, MinIO

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
OPENAI_API_KEY=sk-... # Required for AI workout generation
ANTHROPIC_API_KEY=sk-ant-... # Required for Phase 2 bottle label OCR
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

## 📜 License

PersonalFit is licensed under **PolyForm Noncommercial License 1.0.0**.

✅ **Allowed:** Personal use, learning, research, non-profit organizations
❌ **Not Allowed:** Commercial use, SaaS, reselling

**For commercial licensing:** phillipjuanvanderberg@gmail.com

See [LICENSE](LICENSE) for full terms.

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
