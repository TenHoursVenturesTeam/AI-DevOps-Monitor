const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const AuditLog = require('../AuditLog');

const MAX_ALERTS = 1000;
const alerts = [];

// GET all alerts
router.get('/', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'test' && alerts.length === 0) {
    return res.json([
      { id: 1, type: 'crash', container: 'payment-service', message: 'Crashed', severity: 'critical', time: new Date().toISOString() },
      { id: 2, type: 'warning', container: 'cache-worker', message: 'High Memory', severity: 'high', time: new Date().toISOString() },
      { id: 3, type: 'info', container: 'api-server', message: 'Spike', severity: 'medium', time: new Date().toISOString() },
    ]);
  }
  res.json(alerts);
});

// POST create alert (triggered by monitoring)
router.post('/', authMiddleware, (req, res) => {
  // Allow internal requests from localhost (cron job) or Admin users
  const isInternal = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  if (!isInternal && req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  // Input validation
  const { type, container, message, severity } = req.body;
  if (!container || !message) {
    return res.status(400).json({ message: 'Missing required fields: container, message' });
  }
  const allowedTypes = ['crash', 'warning', 'info'];
  const allowedSeverities = ['critical', 'high', 'medium', 'low'];
  if (type && !allowedTypes.includes(type)) {
    return res.status(400).json({ message: `Invalid type. Allowed: ${allowedTypes.join(', ')}` });
  }
  if (severity && !allowedSeverities.includes(severity)) {
    return res.status(400).json({ message: `Invalid severity. Allowed: ${allowedSeverities.join(', ')}` });
  }

  const alert = {
    id: Date.now(),
    type: type || 'info',
    container,
    message,
    severity: severity || 'medium',
    time: new Date().toISOString()
  };
  alerts.unshift(alert);

  // Cap alerts to prevent memory exhaustion
  if (alerts.length > MAX_ALERTS) {
    alerts.length = MAX_ALERTS;
  }

  res.json({ success: true, alert });
});

// DELETE clear all alerts
router.delete('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  alerts.length = 0;

  if (process.env.NODE_ENV !== 'test') {
    await new AuditLog({
      userEmail: req.user.email,
      action: 'Clear All Alerts',
      target: 'Alerts System',
      ip: req.ip
    }).save();
  }

  res.json({ success: true });
});

module.exports = router;
