from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

doc = SimpleDocTemplate(
    "C:/Users/Umme Hani/Desktop/Uzma Suroor/AI_DevOps_Monitor_Documentation.pdf",
    pagesize=A4,
    rightMargin=0.75*inch,
    leftMargin=0.75*inch,
    topMargin=0.75*inch,
    bottomMargin=0.75*inch
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, textColor=colors.HexColor('#0891b2'), spaceAfter=6, alignment=TA_CENTER)
h1_style = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#0891b2'), spaceBefore=14, spaceAfter=6)
h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#334155'), spaceBefore=10, spaceAfter=4)
h3_style = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#475569'), spaceBefore=8, spaceAfter=3)
body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
code_style = ParagraphStyle('Code', parent=styles['Code'], fontSize=8, backColor=colors.HexColor('#f1f5f9'), leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=4, leading=12)
bullet_style = ParagraphStyle('Bullet', parent=styles['Normal'], fontSize=10, leading=14, leftIndent=20, spaceAfter=2)
subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, spaceAfter=4)

def hr(): return HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=8, spaceBefore=8)
def sp(h=6): return Spacer(1, h)
def h1(t): return Paragraph(t, h1_style)
def h2(t): return Paragraph(t, h2_style)
def h3(t): return Paragraph(t, h3_style)
def p(t): return Paragraph(t, body_style)
def code(t): return Paragraph(t.replace('\n','<br/>').replace(' ','&nbsp;'), code_style)
def bullet(t): return Paragraph(f"&#8226; {t}", bullet_style)
def num(n,t): return Paragraph(f"{n}. {t}", bullet_style)

story = []

# ===================== COVER PAGE =====================
story.append(sp(60))
story.append(Paragraph("AI DevOps Monitor", title_style))
story.append(Paragraph("Complete Project Documentation", subtitle_style))
story.append(sp(8))
story.append(hr())
story.append(sp(8))
story.append(Paragraph("Docker Container Monitoring with AI Crash Prediction", subtitle_style))
story.append(sp(20))

cover_data = [
    ['Project Name', 'AI DevOps Monitor'],
    ['Version', '1.0.0'],
    ['Author', 'Uzma Suroor'],
    ['Tech Stack', 'React.js, Node.js, Python, scikit-learn, MongoDB'],
    ['Deployment', 'http://127.0.0.1:3001 (Frontend) + http://127.0.0.1:5002 (Backend)'],
    ['Date', 'June 2025'],
]
cover_table = Table(cover_data, colWidths=[2*inch, 4.5*inch])
cover_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#0891b2')),
    ('TEXTCOLOR', (0,0), (0,-1), colors.white),
    ('FONTSIZE', (0,0), (-1,-1), 10),
    ('ROWBACKGROUNDS', (1,0), (-1,-1), [colors.HexColor('#f8fafc'), colors.HexColor('#e2e8f0')]),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('PADDING', (0,0), (-1,-1), 8),
    ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
]))
story.append(cover_table)
story.append(sp(30))
story.append(Paragraph("AI-powered real-time Docker container monitoring system that predicts crashes 5-10 minutes before they happen, automatically fixes issues, and saves costs through intelligent resource optimization.", body_style))

# ===================== SECTION 1: WHAT IS THIS PROJECT =====================
story.append(sp(20))
story.append(h1("1. Project Kya Hai? (What Is This Project?)"))
story.append(hr())
story.append(p("AI DevOps Monitor ek aisa software tool hai jo aapke Docker containers ko 24/7 monitor karta hai. Yeh tool Machine Learning (AI) use karke predict karta hai ke koi container crash hone wala hai — aur aapko 5 se 10 minute pehle alert karta hai taa ke aap us problem ko fix kar sako before kuch galat ho."))
story.append(sp(6))
story.append(p("Simple words mein: Yeh ek 'smart watchman' hai aapke server ke liye. Jaise ek watchman building ki security rakhta hai, yeh tool aapke Docker containers ki health check karta rehta hai aur koi khatrah aane se pehle aapko batata hai."))
story.append(sp(8))

story.append(h2("Real-World Example:"))
story.append(p("Maan lo aapka online shopping website Docker pe chal rahi hai. Raat ke 2 baje payment-service container mein memory 90% ho jaati hai aur woh crash hone wali hai. Bina is tool ke: Website crash ho jaati, customers ka paisa stuck ho jaata. Is tool ke saath: 8 minute pehle aapko alert milta, aap container restart kar dete, koi customer affect nahi hota."))

# ===================== SECTION 2: WHY THIS PROJECT =====================
story.append(sp(10))
story.append(h1("2. Kyun Banaya? (Why This Project?)"))
story.append(hr())

reasons = [
    ("Problem 1 - Manual Monitoring", "DevOps engineers ko 24/7 screen dekhni padti thi containers check karne ke liye. Yeh exhausting aur impractical hai."),
    ("Problem 2 - Crash ke baad Fix", "Pehle crash hota tha, phir fix karte the. Is se business loss hota tha aur users frustrated hote the."),
    ("Problem 3 - High Cost", "Over-allocated resources waste hoti thi. Containers ko zaroorat se zyada CPU/Memory dedi jaati thi."),
    ("Problem 4 - No Prediction", "Koi system nahi tha jo pehle bata sake ke crash hone wala hai."),
    ("Problem 5 - Security Gaps", "Exposed ports aur weak passwords ka kisi ko pata nahi chalta tha jab tak koi hack na kar le."),
]
for title, desc in reasons:
    story.append(h3(title))
    story.append(p(desc))

story.append(sp(6))
story.append(h2("Solution:"))
story.append(p("AI DevOps Monitor in sab problems ko solve karta hai — real-time monitoring, AI prediction, auto-fix, cost optimization, aur security scanning ek hi dashboard mein."))

# ===================== SECTION 3: TECH STACK =====================
story.append(sp(10))
story.append(h1("3. Kya Use Kiya? (Tech Stack)"))
story.append(hr())

tech_data = [
    ['Component', 'Technology', 'Kya Karta Hai'],
    ['Frontend', 'React.js + Tailwind CSS', 'User Interface - jo screen pe dikh ta hai'],
    ['Backend', 'Node.js + Express.js', 'Server - APIs handle karta hai'],
    ['AI/ML', 'Python + scikit-learn', 'Crash predict karta hai (optional)'],
    ['Docker API', 'Dockerode (Node.js)', 'Docker containers se baat karta hai'],
    ['Charts', 'Recharts', 'Graphs aur charts dikhata hai'],
    ['Database', 'MongoDB (optional)', 'Data save karta hai'],
    ['HTTP Client', 'Axios', 'API calls karta hai'],
    ['Scheduler', 'node-cron', 'Har 30 sec monitoring karta hai'],
    ['Testing', 'Jest + Supertest + RTL', 'Automated tests run karta hai'],
]
tech_table = Table(tech_data, colWidths=[1.5*inch, 2*inch, 3*inch])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0891b2')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.HexColor('#e2e8f0')]),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('PADDING', (0,0), (-1,-1), 6),
]))
story.append(tech_table)

# ===================== SECTION 4: PROJECT STRUCTURE =====================
story.append(sp(10))
story.append(h1("4. Project Structure (Files aur Folders)"))
story.append(hr())
story.append(p("Poora project 3 main parts mein divided hai:"))
story.append(sp(4))
story.append(code("""ai-devops-monitor/
├── frontend/                  (React App - http://127.0.0.1:3001)
│   ├── src/
│   │   ├── App.js             (Main routing file)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    (Homepage)
│   │   │   ├── LoginPage.jsx      (Login/Signup)
│   │   │   ├── Dashboard.jsx      (Main Dashboard)
│   │   │   └── PricingPage.jsx    (Pricing Plans)
│   │   └── __tests__/
│   │       ├── LandingPage.test.jsx
│   │       ├── LoginPage.test.jsx
│   │       ├── Dashboard.test.jsx
│   │       └── PricingPage.test.jsx
│   └── package.json
│
├── backend/                   (Node.js Server - http://127.0.0.1:3000)
│   ├── server.js              (Main server file)
│   ├── routes/
│   │   ├── docker.js          (Container APIs)
│   │   ├── metrics.js         (AI Prediction APIs)
│   │   └── alerts.js          (Alerts APIs)
│   └── tests/
│       ├── health.test.js
│       ├── docker.test.js
│       ├── metrics.test.js
│       └── alerts.test.js
│
└── ai/                        (Python AI - http://127.0.0.1:5001, optional)
    ├── train_model.py         (ML Model training)
    ├── predict_server.py      (Flask API server)
    ├── test_model.py          (Python tests)
    └── requirements.txt"""))

print("Part 1 done")
story_part1 = story.copy()
print(f"Elements so far: {len(story)}")

# ===================== SECTION 5: FILE BY FILE EXPLANATION =====================
story.append(sp(10))
story.append(h1("5. Har File Ki Explanation (File-by-File)"))
story.append(hr())

# server.js
story.append(h2("5.1 backend/server.js — Main Server File"))
story.append(p("Yeh poore backend ka entry point hai. Jab aap 'npm start' run karte ho toh yeh file execute hoti hai."))
story.append(code("""require('dotenv').config();        // .env file se environment variables load karo
const express = require('express');  // Web framework
const cors = require('cors');        // Restricted CORS settings
const cookieParser = require('cookie-parser'); // CSRF support ke liye

const app = express();
app.use(cors({ origin: ['http://127.0.0.1:3001', 'http://localhost:3001'], credentials: true }));
app.use(express.json());             // JSON data parse karo
app.use(cookieParser());             // Cookies handle karne ke liye

app.use('/api/docker', dockerRoutes);    // Container routes
app.use('/api/metrics', metricsRoutes);  // AI prediction routes
app.use('/api/alerts', alertsRoutes);    // Alerts routes

app.get('/api/health', (req, res) => {   // Health check
  res.json({ status: 'ok' });
});

cron.schedule('*/30 * * * * *', async () => { // Har 30 sec monitoring
  // Containers ko check karta hai aur alerts generate karta hai
  // Ignored containers (label 'ai-monitor.ignore=true') ko skip karta hai
});

app.listen(5000, '0.0.0.0');  // Port 5000 pe start, 0.0.0.0 se sab interfaces pe listen"""))
story.append(p("Key Points: CORS sirf `localhost:3001` se requests allow karta hai. `node-cron` har 30 seconds mein auto-monitoring karta hai aur **un containers ko skip karta hai jin par `ai-monitor.ignore=true` label laga ho.**"))

# docker.js
story.append(h2("5.2 backend/routes/docker.js — Container Routes"))
story.append(p("Yeh file Docker containers ke saath directly baat karti hai. Dockerode library use karke real Docker containers ka data laati hai. **Ab yeh un containers ko filter out kar deti hai jin par `ai-monitor.ignore=true` label laga ho.**"))
story.append(p("<b>Naya Feature: Containers ko Monitor Hone se Rokna</b>"))
story.append(bullet("Agar aap kisi container ko dashboard par nahi dekhna chahte, toh use run karte waqt yeh label laga dein:"))
story.append(code("docker run -d --name my-ignored-container --label \"ai-monitor.ignore=true\" nginx"))
story.append(bullet("Yeh container system par chalta rahega, lekin AI DevOps Monitor ise ignore kar dega."))
story.append(sp(4))
story.append(code("""// GET /api/docker/containers
router.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    // Har container ka CPU, Memory, Health calculate karo
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Docker connection failed' }); // Docker nahi hai toh error
  }
});

// POST /api/docker/restart/:id
router.post('/restart/:id', async (req, res) => {
  const container = docker.getContainer(req.params.id);
  await container.restart();
  res.json({ success: true });
});"""))
story.append(p("Key Points: Ab yeh file sirf real Docker containers ka data laati hai. Agar Docker install nahi hai ya chal nahi raha, toh error return karti hai. **`ai-monitor.ignore=true` label wale containers ko list se hata diya jata hai.**"))

# metrics.js
story.append(h2("5.3 backend/routes/metrics.js — AI Prediction"))
story.append(p("Yeh file AI crash prediction logic contain karti hai. Machine Learning ke bina bhi basic rule-based prediction karta hai. **Predictions aur Cost reports generate karte waqt bhi `ai-monitor.ignore=true` label wale containers ko skip kiya jata hai.**"))
story.append(h3("Security Scanner Improvements:"))
story.append(p("Ab hamara scanner advanced security checks karta hai:"))
story.append(bullet("Running as Root: Check karta hai ke container root user se toh nahi chal raha."))
story.append(bullet("Privileged Mode: Detect karta hai agar container ke paas host ki saari permissions hain."))
story.append(bullet("Docker Socket Exposure: Socket mounting detect karta hai."))
story.append(bullet("Image Tags: ':latest' tags use karne par warning deta hai."))
story.append(bullet("Secure Dependencies: `npm audit` aur `pip-audit` se packages scan karta hai."))
story.append(bullet("Container Image Scan: `Trivy` jaise tools se Docker images scan karta hai."))
story.append(bullet("Resource Limits: Agar Memory ya CPU limits set nahi hain, toh alert deta hai."))
story.append(code("""function predictCrash(container) {
  let crashProbability = 0;

  if (memory > 85)   crashProbability += 40; // Memory high = danger
  if (cpu > 80)      crashProbability += 30; // CPU high = danger
  if (restarts > 5)  crashProbability += 25; // Zyada restarts = danger
  if (health < 70)   crashProbability += 20; // Health low = danger

  // 70%+ probability = crash in 5-10 minutes
  if (crashProbability >= 70) timeTocrash = 5-10 min;
  
  return { probability, risk: 'critical/high/medium/low' };
}"""))
story.append(p("Real Example: Agar koi container high memory ya CPU use kar raha hai, toh uski crash probability badh jati hai. **Ignored containers ke liye koi prediction ya cost analysis nahi ki jaati.**"))

# alerts.js
story.append(h2("5.4 backend/routes/alerts.js — Alerts System"))
story.append(p("Alerts store aur manage karta hai. In-memory storage use karta hai (MongoDB optional)."))
story.append(code("""const alerts = [];  // Memory mein alerts store

GET  /api/alerts     → Sab alerts return karo (ab koi mock alerts nahi hain)
POST /api/alerts     → Naya alert create karo
DELETE /api/alerts   → Sab alerts clear karo"""))
story.append(p("Key Points: Ab koi mock alerts nahi hain. Alerts sirf tab generate hote hain jab `backend/server.js` ka cron job kisi real container mein problem detect karta hai (jaise `exited` state)."))

# Dashboard.jsx
story.append(h2("5.5 frontend/src/pages/Dashboard.jsx — Main Dashboard"))
story.append(p("Yeh sabse important frontend file hai. 5 tabs contain karta hai: Dashboard, Containers, Alerts, Analytics, Cost."))
story.append(code("""// Real-time updates har 3 seconds
useEffect(() => {
  const interval = setInterval(() => {
    // Backend se data fetch karta hai
    // Avg CPU/Memory ko history mein add karta hai Analytics chart ke liye
  }, 3000);
}, []);

// Backend se data fetch (fallback to mock if offline)
useEffect(() => {
  fetch('http://localhost:3000/api/docker/containers')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setContainers(data);
    })
    .catch(error => console.error("Failed to fetch containers:", error));
}, []);

// Restart button
const handleRestart = (id, name) => {
  fetch('/api/docker/restart/' + id, { method: 'POST' });
  // UI update: status = running, health = 60
  showToast(name + ' restarted successfully!');
};"""))

# App.js
story.append(h2("5.6 frontend/src/App.js — Page Routing"))
story.append(p("Simple page router hai. URL ki jagah state use karta hai (GitHub Pages ke liye compatible)."))
story.append(code("""// Pages: landing, login, dashboard, pricing
const [page, setPage] = useState('landing');

if (page === 'landing')   return <LandingPage />;
if (page === 'login')     return <LoginPage />;
if (page === 'dashboard') return <Dashboard />;
if (page === 'pricing')   return <PricingPage />;"""))

# train_model.py
story.append(h2("5.7 ai/train_model.py — ML Model Training"))
story.append(p("Python scikit-learn use karke RandomForest model train karta hai. Input: CPU%, Memory%, Restarts, Health%. Output: Will crash? (0 ya 1)"))
story.append(code("""# Training data: [cpu, memory, restarts, health] -> crash?
X_train = [[90,95,8,10], [10,30,0,98], ...]
y_train = [1, 0, ...]  # 1=crash, 0=safe

model = RandomForestClassifier(n_estimators=50)
model.fit(X_scaled, y_train)

# Prediction
prob = model.predict_proba([[cpu,mem,restarts,health]])[0][1]
# prob=0.9 means 90% chance of crash"""))

doc.build(story)
print("PDF Part 1 generated successfully!")
