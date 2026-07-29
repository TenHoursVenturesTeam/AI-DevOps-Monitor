const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const { authMiddleware } = require('./auth');
const AuditLog = require('../AuditLog');

const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// Mock data for tests only
const getMockContainers = () => [
  { id: 'abc123', name: 'web-app', status: 'running', health: 98, cpu: 12, memory: 45, uptime: '5 days', restarts: 0 },
  { id: 'def456', name: 'api-server', status: 'running', health: 95, cpu: 28, memory: 62, uptime: '5 days', restarts: 1 },
  { id: 'ghi789', name: 'database', status: 'running', health: 92, cpu: 8, memory: 78, uptime: '5 days', restarts: 0 },
  { id: 'jkl012', name: 'cache-worker', status: 'warning', health: 65, cpu: 45, memory: 90, uptime: '2 days', restarts: 3 },
  { id: 'mno345', name: 'payment-service', status: 'crashed', health: 0, cpu: 0, memory: 0, uptime: '0', restarts: 7 },
];

// GET all containers
router.get('/containers', authMiddleware, async (req, res) => {
  if (process.env.NODE_ENV === 'test') return res.json(getMockContainers());

  try {
    const containers = await docker.listContainers({ all: true });
    // Filter out containers that have the ignore label. Ensure Labels exist before checking.
    const filtered = containers.filter(c => c.Labels && c.Labels['ai-monitor.ignore'] !== 'true');

    const result = await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();
      let stats = { cpu: 0, memory: 0 };
      try {
        // Add a 2-second timeout for stats to keep the UI responsive
        const s = await Promise.race([
          container.stats({ stream: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Stats timeout')), 2000))
        ]).catch(() => null); // Graceful failure if stats fail
        
        if (!s || !s.cpu_stats) throw new Error('Invalid stats');

        const cpuDelta = s.cpu_stats.cpu_usage.total_usage - s.precpu_stats.cpu_usage.total_usage;
        const sysDelta = s.cpu_stats.system_cpu_usage - s.precpu_stats.system_cpu_usage;
        stats.cpu = sysDelta > 0 ? Math.round((cpuDelta / sysDelta) * 100) : 0;
        stats.memory = Math.round((s.memory_stats.usage / s.memory_stats.limit) * 100);
      } catch (_) {}

      const health = c.State === 'running' ? Math.max(100 - stats.memory * 0.3 - stats.cpu * 0.2, 50) : 0;
      return {
        id: c.Id.slice(0, 12),
        name: c.Names[0].replace('/', ''),
        status: c.State,
        health: Math.round(health),
        cpu: stats.cpu,
        memory: stats.memory,
        uptime: c.Status,
        restarts: info.RestartCount || 0,
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Docker connection failed', message: err.message });
  }
});

// POST restart container
router.post('/restart/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  if (process.env.NODE_ENV === 'test') {
    return res.json({ success: true, message: `Container ${req.params.id} restarted` });
  }

  try {
    const container = docker.getContainer(req.params.id);
    await container.restart();

    new AuditLog({
      userEmail: req.user.email,
      action: 'Restart Container',
      target: req.params.id,
      ip: req.ip
    }).save();

    res.json({ success: true, message: `Container ${req.params.id} restarted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST stop container
router.post('/stop/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  if (process.env.NODE_ENV === 'test') {
    return res.json({ success: true, message: `Container ${req.params.id} stopped` });
  }

  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();

    new AuditLog({
      userEmail: req.user.email,
      action: 'Stop Container',
      target: req.params.id,
      ip: req.ip
    }).save();

    res.json({ success: true, message: `Container ${req.params.id} stopped` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
