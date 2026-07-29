require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const dockerRoutes = require('./routes/docker');
const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const { publicAuthRouter, protectedAuthRouter } = require('./routes/auth');
const securityRoutes = require('./routes/security');
const reportsRoutes = require('./routes/reports');
const Docker = require('dockerode');
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5002;

app.set('trust proxy', 1); // Trust first proxy (Nginx)

// Request Logger Middleware - Taake terminal mein har request dikhe
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

// 1. CORS - Restricted to allowed origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:3001,http://localhost:3001').split(',').map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.options(/.*/, cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false, // Development mein CSP block kar sakta hai fetches ko
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiter: Ek IP se 15 min mein sirf 100 requests allow karein
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Monitoring dashboard ke liye limit thodi zyada rakhi hai
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Strict Limiter for Auth: Brute-force se bachne ke liye
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Generous for development
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  skip: (req) => req.method === 'OPTIONS' // Skip preflight requests
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter); // Fix trailing slash for consistency
  app.use('/api', limiter); 
}
app.use(express.json());
app.use(cookieParser());


// Routes
app.use('/api/docker', dockerRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/auth', publicAuthRouter); // Public auth routes (register, login)
app.use('/api/auth', protectedAuthRouter); // Protected auth routes (e.g., /users)
app.use('/api/security', securityRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: '127.0.0.1', timestamp: new Date().toISOString() });
});

// Root path ke liye basic response
app.get('/', (req, res) => {
  res.send(`
    <body style="background: #0F172A; color: #F8FAFC; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <h1 style="color: #2496ED; margin-bottom: 8px;">AI DevOps Monitor API</h1>
      <p style="color: #94A3B8;">Enterprise Infrastructure Monitoring Engine</p>
      <a href="http://127.0.0.1:3001" style="margin-top: 20px; padding: 10px 20px; background: #2496ED; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Launch Dashboard</a>
    </body>
  `);
});

// Auto-monitor every 30 seconds
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const containers = await docker.listContainers({ all: true });
      for (const c of containers) {
        // Skip if the container is marked to be ignored
        if (c.Labels && c.Labels['ai-monitor.ignore'] === 'true') continue;

        // Agar container stopped hai toh alert bhejien
        if (c.State === 'exited' || c.State === 'dead') {
          const headers = { 'Content-Type': 'application/json' };
          if (process.env.INTERNAL_SECRET) {
            headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET;
          }
          await fetch(`http://127.0.0.1:${PORT}/api/alerts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              type: 'crash',
              container: c.Names[0].replace('/', ''),
              message: `Container ${c.State} detected! Please check logs.`,
              severity: 'critical'
            })
          }).catch(() => {});
        }
      }
      console.log(`Auto-monitoring: Checked ${containers.length} containers.`);
    } catch (err) {
      console.error('Monitoring Error:', err.message);
    }
  });
}

function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server: http://127.0.0.1:${PORT}`);
    console.log('💾 Using file-based storage (no database required)');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
