# 🤖 AI DevOps Monitor

> Predict Docker container crashes **5-10 minutes early** using Machine Learning

## 📸 [See Live Demo Screenshots →](DEMO.md)

> Real screenshots from monitoring 28 Docker containers in production. See the dashboard, security scanner, cost optimizer, and performance analytics in action.

## 🖥️ Features

- 📊 Real-time container monitoring (CPU, Memory, Health)
- 🤖 AI crash prediction (scikit-learn)
- ⚡ One-click container restart (Admin only)
- 🛡️ Security scanner (root users, privileged containers, exposed ports)
- 💰 Cost optimization reports
- 🔔 Automated crash alerts
- 📧 Email reports via SMTP
- 🔐 JWT authentication with role-based access

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **Docker Desktop** running
- **Python 3.9+** (optional, for AI predictions)

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # Edit with your settings
npm start                # http://localhost:5003
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                # http://localhost:3001
```

### 3. AI Server (Optional)
```bash
cd ai
pip install -r requirements.txt
python train_model.py       # Train model once
python predict_server.py    # http://localhost:5001
```

## 📁 Project Structure
```
ai-devops-monitor/
├── frontend/         React + Tailwind CSS (Dashboard UI)
├── backend/          Node.js + Express (API Server)
│   ├── routes/       API endpoints (docker, metrics, auth, security, alerts, reports)
│   ├── data/         Local JSON storage (auto-created, no DB needed)
│   └── store.js      File-based storage engine
└── ai/               Python + scikit-learn (Crash prediction)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js, Dockerode |
| AI/ML | Python, scikit-learn, Flask |
| Storage | File-based JSON (no database required) |
| Auth | JWT + bcrypt |
| Security | Helmet, CORS, Rate Limiting |

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
PORT=5003
JWT_SECRET=your_secret_here
CORS_ORIGINS=http://localhost:3001
AI_API_KEY=your_ai_key
INTERNAL_SECRET=your_internal_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="AI DevOps Monitor <your_email@gmail.com>"
```

## 🔐 Security Features

- JWT token authentication
- bcrypt password hashing (12 salt rounds)
- Role-based access control (admin/viewer)
- Rate limiting on all endpoints
- Helmet security headers
- CORS origin whitelist
- Input validation on all routes
- Audit logging for sensitive actions
- No hardcoded secrets

## 📊 How It Works

1. Backend connects to Docker via local socket and collects container metrics
2. Metrics are analyzed using threshold-based rules (or ML model if AI server is running)
3. Frontend displays real-time stats, predictions, and security findings
4. Cron job monitors containers every 30 seconds and creates alerts for crashed containers

## 🧪 Running Tests

```bash
cd backend
npm test
```

## 📝 License

MIT
