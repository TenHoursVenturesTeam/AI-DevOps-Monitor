# 🤖 AI DevOps Monitor

> Predict Docker container crashes **5-10 minutes early** using Machine Learning

[![Live Demo](https://img.shields.io/badge/Live-GitHub%20Pages-cyan)](https://YOUR_USERNAME.github.io/ai-devops-monitor)

## 🖥️ Dashboard Preview

- 📊 Real-time container monitoring
- 🤖 AI crash prediction (scikit-learn)
- ⚡ One-click auto-restart
- 💰 Cost optimization reports
- 🛡️ Security issue scanner
- 🔔 Crash alerts

## 🚀 Quick Start

### Option 1: Frontend Only (GitHub Pages)
```bash
cd frontend
npm install
npm start          # localhost:3001
npm run deploy     # → GitHub Pages
```

### Option 2: Full Stack (Local)
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start          # localhost:3000

# Terminal 2 - AI Server
cd ai
pip install -r requirements.txt
python train_model.py   # Train model first
python predict_server.py  # localhost:5001

# Terminal 3 - Frontend
cd frontend
npm install
npm start          # localhost:3001
```

## 📁 Structure
```
ai-devops-monitor/
├── frontend/         React + Tailwind (GitHub Pages)
├── backend/          Node.js + Express (localhost:3000)
└── ai/               Python scikit-learn (localhost:5001)
```

## 💰 Pricing
| Plan | Price | Containers |
|------|-------|-----------|
| Free Trial | ₹0 (14 days) | 5 |
| Starter | ₹5,000/mo | 20 |
| Professional | ₹10,000/mo | 100 |
| Enterprise | ₹25,000/mo | Unlimited |

## 🛠️ Tech Stack
- **Frontend**: React.js, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js, Dockerode
- **AI/ML**: Python, scikit-learn, Flask
- **Database**: MongoDB (optional)
- **Deploy**: GitHub Pages (frontend), Render.com (backend)
