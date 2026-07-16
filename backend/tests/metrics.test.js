const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { EFFECTIVE_JWT_SECRET } = require('../routes/auth');

const token = jwt.sign({ id: 'test-admin', email: 'admin@test.com', role: 'admin' }, EFFECTIVE_JWT_SECRET);
const authHeader = { 'Authorization': `Bearer ${token}` };

describe('Metrics & AI Prediction API', () => {
  test('GET /api/metrics/predictions → array milna chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/metrics/predictions → har prediction mein containerName aur prediction hona chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    res.body.forEach(p => {
      expect(p).toHaveProperty('containerName');
      expect(p).toHaveProperty('prediction');
      expect(p.prediction).toHaveProperty('probability');
      expect(p.prediction).toHaveProperty('risk');
    });
  });

  test('GET /api/metrics/predictions → payment-service ka risk high/critical hona chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const payment = res.body.find(p => p.containerName === 'payment-service');
    expect(payment).toBeDefined();
    expect(['high', 'critical']).toContain(payment.prediction.risk);
  });

  test('GET /api/metrics/predictions → web-app ka risk low hona chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const webApp = res.body.find(p => p.containerName === 'web-app');
    expect(webApp).toBeDefined();
    expect(webApp.prediction.risk).toBe('low');
  });

  test('GET /api/metrics/predictions → probability 0-100 ke beech honi chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    res.body.forEach(p => {
      expect(p.prediction.probability).toBeGreaterThanOrEqual(0);
      expect(p.prediction.probability).toBeLessThanOrEqual(100);
    });
  });

  test('GET /api/metrics/predictions → high/critical risk wale ko timeTocrash milna chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const atRisk = res.body.find(p => ['high', 'critical'].includes(p.prediction.risk) && p.prediction.timeTocrash !== null);
    expect(atRisk).toBeDefined();
    expect(atRisk.prediction.timeTocrash).toBeGreaterThanOrEqual(5);
  });

  test('GET /api/metrics/cost → totalSavedToday milna chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/cost')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalSavedToday');
    expect(res.body.totalSavedToday).toBe(12500);
    expect(res.body.currency).toBe('INR');
  });

  test('GET /api/metrics/cost → optimizations array milna chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/cost')
      .set(authHeader);
    expect(Array.isArray(res.body.optimizations)).toBe(true);
    expect(res.body.optimizations.length).toBeGreaterThan(0);
    res.body.optimizations.forEach(o => {
      expect(o).toHaveProperty('container');
      expect(o).toHaveProperty('saving');
      expect(o.saving).toBeGreaterThan(0);
    });
  });

  test('GET /api/metrics/cost → securityIssues array milna chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/cost')
      .set(authHeader);
    expect(Array.isArray(res.body.securityIssues)).toBe(true);
    expect(res.body.securityIssues.length).toBe(2);
  });

  test('GET /api/metrics/cost → security issues mein severity hona chahiye', async () => {
    const res = await request(app)
      .get('/api/metrics/cost')
      .set(authHeader);
    res.body.securityIssues.forEach(issue => {
      expect(issue).toHaveProperty('severity');
      expect(['high', 'critical', 'medium', 'low']).toContain(issue.severity);
    });
  });
});

describe('AI Crash Prediction Logic', () => {
  // Test the predictCrash function directly via API responses
  test('High memory (90%) → high/critical risk prediction', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const cacheWorker = res.body.find(p => p.containerName === 'cache-worker');
    expect(['high', 'critical']).toContain(cacheWorker.prediction.risk);
    expect(cacheWorker.prediction.probability).toBeGreaterThanOrEqual(40);
  });

  test('Low CPU + Low memory → low risk prediction', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const webApp = res.body.find(p => p.containerName === 'web-app');
    expect(webApp.prediction.risk).toBe('low');
    expect(webApp.prediction.probability).toBeLessThan(20);
  });

  test('7 restarts wala container → high crash probability', async () => {
    const res = await request(app)
      .get('/api/metrics/predictions')
      .set(authHeader);
    const payment = res.body.find(p => p.containerName === 'payment-service');
    expect(payment.prediction.probability).toBeGreaterThanOrEqual(25);
  });
});
