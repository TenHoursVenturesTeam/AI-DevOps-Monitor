const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../User'); // Assuming User model is defined
const AuditLog = require('../AuditLog');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable must be defined.");
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn("WARNING: JWT_SECRET not set. Using a random secret for this session (tokens won't persist across restarts).");
  }
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

// Middleware to verify Token
const authMiddleware = (req, res, next) => {
  // Allow preflight requests to pass through authentication
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Internal request bypass: only allow if request truly originates from this machine
  // and there's an internal secret header for cron jobs
  const isInternal = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  const internalSecret = req.header('X-Internal-Secret');
  const expectedSecret = process.env.INTERNAL_SECRET;
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  // Only bypass auth for internal requests if they provide the internal secret
  if (!token && isInternal && expectedSecret && internalSecret === expectedSecret) return next();
  
  // Test mode mein agar token nahi hai, tabhi mock user dein, warna token verify hone dein
  if (!token) {
    if (process.env.NODE_ENV === 'test') {
      req.user = { id: 'test-user-id', email: 'test@example.com', role: 'admin' };
      return next();
    }
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Create a separate router for public authentication routes
const publicAuthRouter = express.Router();

// Public route: Register a new user
publicAuthRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    const allowedRoles = ['admin', 'viewer'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed: admin, viewer' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({ name, email, password: hashedPassword, role: role || 'viewer' });
    await user.save();

    if (process.env.NODE_ENV !== 'test') {
      await new AuditLog({
        userEmail: email,
        action: 'User Registration',
        target: 'Auth System',
        ip: req.ip
      }).save();
    }

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public route: Login an existing user
publicAuthRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, EFFECTIVE_JWT_SECRET, { expiresIn: '1d' });

    if (process.env.NODE_ENV !== 'test') {
      await new AuditLog({
        userEmail: user.email,
        action: 'User Login',
        target: 'Auth System',
        ip: req.ip
      }).save();
    }

    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a separate router for protected authentication routes
const protectedAuthRouter = express.Router();

// Apply authMiddleware to all routes in the protectedAuthRouter
protectedAuthRouter.use(authMiddleware);

// Protected route: Get all users (Admin Only)
protectedAuthRouter.get('/users', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  const users = await User.find().select('-password');
  res.json(users);
});

module.exports = { publicAuthRouter, protectedAuthRouter, authMiddleware, EFFECTIVE_JWT_SECRET };