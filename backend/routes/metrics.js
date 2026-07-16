const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const { authMiddleware } = require('./auth');

const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// AI crash prediction based on weighted thresholds
function predictCrash(container) {
  const { cpu, memory, restarts, health } = container;
  let crashProbability = 0;
  let timeTocrash = null;
  let reasons = [];

  if (memory > 85) { crashProbability += 40; reasons.push(`High memory: ${memory}%`); }
  if (cpu > 80) { crashProbability += 30; reasons.push(`High CPU: ${cpu}%`); }
  if (restarts > 5) { crashProbability += 25; reasons.push(`High restarts: ${restarts}`); }
  if (health < 70) { crashProbability += 20; reasons.push(`Low health: ${health}%`); }

  crashProbability = Math.min(crashProbability, 100);

  // Deterministic time-to-crash based on probability severity
  if (crashProbability >= 70) {
    timeTocrash = Math.max(3, Math.round(10 - (crashProbability - 70) * 0.2));
  } else if (crashProbability >= 40) {
    timeTocrash = Math.round(30 - (crashProbability - 40) * 0.5);
  }

  return {
    probability: crashProbability,
    timeTocrash,
    risk: crashProbability >= 70 ? 'critical' : crashProbability >= 40 ? 'high' : crashProbability >= 20 ? 'medium' : 'low',
    reasons,
  };
}

// GET AI predictions for all containers
router.get('/predictions', authMiddleware, async (req, res) => {
  if (process.env.NODE_ENV === 'test') {
    const mockContainers = [
      { id: 'abc123', name: 'web-app', cpu: 12, memory: 45, restarts: 0, health: 98 },
      { id: 'def456', name: 'api-server', cpu: 28, memory: 62, restarts: 1, health: 95 },
      { id: 'ghi789', name: 'database', cpu: 8, memory: 78, restarts: 0, health: 92 },
      { id: 'jkl012', name: 'cache-worker', cpu: 45, memory: 90, restarts: 3, health: 65 },
      { id: 'mno345', name: 'payment-service', cpu: 88, memory: 92, restarts: 7, health: 0 },
    ];
    const predictions = mockContainers.map(c => ({
      containerId: c.id,
      containerName: c.name,
      prediction: predictCrash(c),
    }));

    return res.json(predictions);
  }

  try {
    const containers = await docker.listContainers({ all: true });
    // Filter out ignored containers
    const filtered = containers.filter(c => c.Labels['ai-monitor.ignore'] !== 'true');

    const predictions = await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();
      let stats = { cpu: 0, memory: 0 };
      try {
        const s = await container.stats({ stream: false });
        const cpuDelta = (s.cpu_stats?.cpu_usage?.total_usage || 0) - (s.precpu_stats?.cpu_usage?.total_usage || 0);
        const sysDelta = (s.cpu_stats?.system_cpu_usage || 0) - (s.precpu_stats?.system_cpu_usage || 0);
        stats.cpu = sysDelta > 0 ? Math.round((cpuDelta / sysDelta) * 100) : 0;
        stats.memory = s.memory_stats?.limit ? Math.round((s.memory_stats.usage / s.memory_stats.limit) * 100) : 0;
      } catch (_) {}

      const healthScore = c.State === 'running' ? Math.max(100 - stats.memory * 0.3 - stats.cpu * 0.2, 50) : 0;
      
      const containerData = {
        cpu: stats.cpu,
        memory: stats.memory,
        restarts: info.RestartCount || 0,
        health: Math.round(healthScore)
      };

      return {
        containerId: c.Id.slice(0, 12),
        containerName: c.Names[0].replace('/', ''),
        prediction: predictCrash(containerData),
      };
    }));
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch real-time predictions' });
  }
});

// GET dynamic cost and security report
router.get('/cost', authMiddleware, async (req, res) => {
  if (process.env.NODE_ENV === 'test') {
    return res.json({
      totalSavedToday: 12500,
      currency: 'INR',
      optimizations: [{ container: 'cache-worker', issue: 'Over-allocated', saving: 4000 }],
      securityIssues: [
        { container: 'api-server', issue: 'Exposed port', severity: 'high' },
        { container: 'database', issue: 'Weak password', severity: 'critical' }
      ],
    });
  }

  try {
    let totalSaved = 0;
    const optimizations = [];
    const securityIssues = [];
    const containers = await docker.listContainers({ all: true });
    const filtered = containers.filter(c => c.Labels && c.Labels['ai-monitor.ignore'] !== 'true');

    await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();
      const name = c.Names[0].replace('/', '');

      // Logic: If container is exited but still exists, it's wasting storage/resources
      if (c.State === 'exited') {
        const saving = 500; // Estimated saving in INR for cleaning up idle resources
        totalSaved += saving;
        optimizations.push({ container: name, issue: 'Container is exited but not removed', saving });
      }

      // --- NEW SECURITY CHECKS ---

      // Logic: Simple Security Check - look for common database ports exposed
      const exposedPorts = c.Ports.map(p => p.PublicPort).filter(Boolean);
      if (exposedPorts.includes(5432) || exposedPorts.includes(3306)) {
        securityIssues.push({ container: name, issue: 'Database port exposed to public network', severity: 'critical' });
      }

      // 1. Check if running as root
      if (!info.Config.User || info.Config.User === '0' || info.Config.User === 'root') {
        securityIssues.push({ container: name, issue: 'Container running as root user', severity: 'high' });
      }

      // 2. Check for Privileged mode
      if (info.HostConfig.Privileged) {
        securityIssues.push({ container: name, issue: 'Privileged container detected (Security Risk)', severity: 'critical' });
      }

      // 3. Check for Exposed Docker Socket
      const hasSocket = (info.Mounts || []).some(m => m.Source.includes('docker.sock') || m.Destination.includes('docker.sock'));
      if (hasSocket) {
        securityIssues.push({ container: name, issue: 'Docker socket exposed to container', severity: 'critical' });
      }

      // 4. Check for Latest image tags
      if (info.Config.Image.includes(':latest') || !info.Config.Image.includes(':')) {
        securityIssues.push({ container: name, issue: 'Using "latest" image tag (unpredictable)', severity: 'medium' });
      }

      // 5. Check for missing resource limits
      if (info.HostConfig.Memory === 0 || info.HostConfig.NanoCpus === 0) {
        securityIssues.push({ container: name, issue: 'No CPU/Memory limits defined', severity: 'low' });
      }

      // 6. Kubernetes-specific (Placeholder if labels detected)
      if (c.Labels['io.kubernetes.pod.name']) {
        if (info.HostConfig.HostNetwork) {
          securityIssues.push({ container: name, issue: 'K8s Pod using host network', severity: 'high' });
        }
      }
    }));

    res.json({
      totalSavedToday: totalSaved,
      currency: 'INR',
      optimizations,
      securityIssues,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
