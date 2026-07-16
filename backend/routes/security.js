const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const { authMiddleware } = require('./auth');

const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// GET security summary for dashboard cards — all values computed from real Docker inspection
router.get('/scan', authMiddleware, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const filtered = containers.filter(c => c.Labels && c.Labels['ai-monitor.ignore'] !== 'true');
    
    let summary = {
      criticalVulnerabilities: 0,
      openPorts: 0,
      rootContainers: 0,
      missingLimits: 0,
      latestTagCount: 0
    };

    await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();
      
      // Open Ports check
      const ports = c.Ports.map(p => p.PublicPort).filter(Boolean);
      summary.openPorts += ports.length;

      // Root Container check
      if (!info.Config.User || info.Config.User === '0' || info.Config.User === 'root') {
        summary.rootContainers++;
      }

      // Critical Vulnerabilities: Privileged or Host Network
      if (info.HostConfig.Privileged || info.HostConfig.HostNetwork) {
        summary.criticalVulnerabilities++;
      }

      // Exposed Docker socket
      const hasSocket = (info.Mounts || []).some(m => m.Source.includes('docker.sock') || m.Destination.includes('docker.sock'));
      if (hasSocket) {
        summary.criticalVulnerabilities++;
      }

      // Latest image tag usage
      if (info.Config.Image.includes(':latest') || !info.Config.Image.includes(':')) {
        summary.latestTagCount++;
      }

      // Missing resource limits
      if (info.HostConfig.Memory === 0 && info.HostConfig.NanoCpus === 0) {
        summary.missingLimits++;
      }
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Security scan failed', message: err.message });
  }
});

// GET detailed vulnerabilities list — computed from real Docker inspection
router.get('/vulnerabilities', authMiddleware, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const filtered = containers.filter(c => c.Labels && c.Labels['ai-monitor.ignore'] !== 'true');
    const vulnerabilities = [];
    let idCounter = 1;

    await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();
      const name = c.Names[0].replace('/', '');

      // Root user
      if (!info.Config.User || info.Config.User === '0' || info.Config.User === 'root') {
        vulnerabilities.push({ id: idCounter++, type: 'Config', name: 'Running as root', severity: 'high', container: name, status: 'open' });
      }

      // Privileged mode
      if (info.HostConfig.Privileged) {
        vulnerabilities.push({ id: idCounter++, type: 'Config', name: 'Privileged container', severity: 'critical', container: name, status: 'open' });
      }

      // Host network
      if (info.HostConfig.HostNetwork) {
        vulnerabilities.push({ id: idCounter++, type: 'Network', name: 'Host network mode', severity: 'high', container: name, status: 'open' });
      }

      // Exposed Docker socket
      const hasSocket = (info.Mounts || []).some(m => m.Source.includes('docker.sock') || m.Destination.includes('docker.sock'));
      if (hasSocket) {
        vulnerabilities.push({ id: idCounter++, type: 'Config', name: 'Docker socket exposed', severity: 'critical', container: name, status: 'open' });
      }

      // Database ports exposed publicly
      const exposedPorts = c.Ports.map(p => p.PublicPort).filter(Boolean);
      if (exposedPorts.includes(5432) || exposedPorts.includes(3306) || exposedPorts.includes(27017)) {
        vulnerabilities.push({ id: idCounter++, type: 'Network', name: 'Database port exposed publicly', severity: 'critical', container: name, status: 'open' });
      }

      // Latest image tag
      if (info.Config.Image.includes(':latest') || !info.Config.Image.includes(':')) {
        vulnerabilities.push({ id: idCounter++, type: 'Config', name: 'Using :latest image tag', severity: 'medium', container: name, status: 'open' });
      }

      // No resource limits
      if (info.HostConfig.Memory === 0 && info.HostConfig.NanoCpus === 0) {
        vulnerabilities.push({ id: idCounter++, type: 'Config', name: 'No CPU/Memory limits', severity: 'low', container: name, status: 'open' });
      }
    }));

    res.json(vulnerabilities);
  } catch (err) {
    res.status(500).json({ error: 'Vulnerability scan failed', message: err.message });
  }
});

// GET compliance status — computed from real container checks
router.get('/compliance', authMiddleware, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const filtered = containers.filter(c => c.Labels && c.Labels['ai-monitor.ignore'] !== 'true');

    let totalChecks = 0;
    let passedChecks = 0;

    await Promise.all(filtered.map(async (c) => {
      const container = docker.getContainer(c.Id);
      const info = await container.inspect();

      // Check 1: Not running as root
      totalChecks++;
      if (info.Config.User && info.Config.User !== '0' && info.Config.User !== 'root') {
        passedChecks++;
      }

      // Check 2: Not privileged
      totalChecks++;
      if (!info.HostConfig.Privileged) {
        passedChecks++;
      }

      // Check 3: Not using host network
      totalChecks++;
      if (!info.HostConfig.HostNetwork) {
        passedChecks++;
      }

      // Check 4: Has resource limits
      totalChecks++;
      if (info.HostConfig.Memory > 0 || info.HostConfig.NanoCpus > 0) {
        passedChecks++;
      }

      // Check 5: Not using :latest tag
      totalChecks++;
      if (info.Config.Image.includes(':') && !info.Config.Image.includes(':latest')) {
        passedChecks++;
      }

      // Check 6: No Docker socket mounted
      totalChecks++;
      const hasSocket = (info.Mounts || []).some(m => m.Source.includes('docker.sock') || m.Destination.includes('docker.sock'));
      if (!hasSocket) {
        passedChecks++;
      }
    }));

    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
    let status = 'Fully Compliant';
    if (score < 100) status = 'Compliant with Warnings';
    if (score < 70) status = 'Non-Compliant';
    if (score < 50) status = 'Critical Non-Compliance';

    res.json({
      score,
      status,
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      containersScanned: filtered.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Compliance check failed', message: err.message });
  }
});

module.exports = router;