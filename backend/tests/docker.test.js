const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { EFFECTIVE_JWT_SECRET } = require('../routes/auth');

const token = jwt.sign({ id: 'test-admin', email: 'admin@test.com', role: 'admin' }, EFFECTIVE_JWT_SECRET);
const authHeader = { 'Authorization': `Bearer ${token}` };

describe('Docker Containers API', () => {
  test('GET /api/docker/containers → array milna chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/docker/containers → 5 containers hone chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    expect(res.body.length).toBe(5);
  });

  test('GET /api/docker/containers → har container mein id, name, status hona chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    res.body.forEach(container => {
      expect(container).toHaveProperty('id');
      expect(container).toHaveProperty('name');
      expect(container).toHaveProperty('status');
      expect(container).toHaveProperty('health');
      expect(container).toHaveProperty('cpu');
      expect(container).toHaveProperty('memory');
    });
  });

  test('GET /api/docker/containers → payment-service crashed hona chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    const crashed = res.body.find(c => c.name === 'payment-service');
    expect(crashed).toBeDefined();
    expect(crashed.status).toBe('crashed');
    expect(crashed.health).toBe(0);
  });

  test('GET /api/docker/containers → web-app running hona chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    const webApp = res.body.find(c => c.name === 'web-app');
    expect(webApp).toBeDefined();
    expect(webApp.status).toBe('running');
    expect(webApp.health).toBeGreaterThan(90);
  });

  test('GET /api/docker/containers → cache-worker warning mein hona chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    const cacheWorker = res.body.find(c => c.name === 'cache-worker');
    expect(cacheWorker).toBeDefined();
    expect(cacheWorker.status).toBe('warning');
    expect(cacheWorker.memory).toBeGreaterThan(80);
  });

  test('GET /api/docker/containers → health 0-100 ke beech hona chahiye', async () => {
    const res = await request(app)
      .get('/api/docker/containers')
      .set(authHeader);
    res.body.forEach(c => {
      expect(c.health).toBeGreaterThanOrEqual(0);
      expect(c.health).toBeLessThanOrEqual(100);
    });
  });

  test('POST /api/docker/restart/:id → success true milna chahiye', async () => {
    const res = await request(app)
      .post('/api/docker/restart/abc123')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
  });

  test('POST /api/docker/restart/:id → message string hona chahiye', async () => {
    const res = await request(app)
      .post('/api/docker/restart/def456')
      .set(authHeader);
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message.length).toBeGreaterThan(0);
  });
});
