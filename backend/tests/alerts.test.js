const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { EFFECTIVE_JWT_SECRET } = require('../routes/auth');

const token = jwt.sign({ id: 'test-admin', email: 'admin@test.com', role: 'admin' }, EFFECTIVE_JWT_SECRET);
const authHeader = { 'Authorization': `Bearer ${token}` };

describe('Alerts API', () => {
  test('GET /api/alerts → array milna chahiye', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/alerts → kam se kam 3 mock alerts hone chahiye', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/alerts → har alert mein id, container, message, severity hona chahiye', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    res.body.forEach(alert => {
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('container');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('time');
    });
  });

  test('GET /api/alerts → payment-service ka critical alert hona chahiye', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    const critical = res.body.find(a => a.severity === 'critical');
    expect(critical).toBeDefined();
    expect(critical.container).toBe('payment-service');
  });

  test('GET /api/alerts → severity valid value honi chahiye', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    res.body.forEach(alert => {
      expect(validSeverities).toContain(alert.severity);
    });
  });

  test('POST /api/alerts → naya alert create hona chahiye', async () => {
    const newAlert = {
      container: 'test-container',
      message: 'Test alert message',
      severity: 'medium',
      type: 'warning'
    };
    const res = await request(app)
      .post('/api/alerts')
      .set(authHeader)
      .send(newAlert);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alert).toBeDefined();
    expect(res.body.alert.container).toBe('test-container');
    expect(res.body.alert.id).toBeDefined();
    expect(res.body.alert.time).toBeDefined();
  });

  test('POST /api/alerts → alert mein auto timestamp lagni chahiye', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set(authHeader)
      .send({ container: 'test', message: 'test', severity: 'low' });
    const alertTime = new Date(res.body.alert.time);
    expect(alertTime).toBeInstanceOf(Date);
    expect(isNaN(alertTime.getTime())).toBe(false);
  });

  test('POST /api/alerts ke baad GET → naya alert list mein hona chahiye', async () => {
    await request(app).post('/api/alerts').send({
      container: 'new-service',
      message: 'New service alert',
      severity: 'high'
    });
    const res = await request(app)
      .get('/api/alerts')
      .set(authHeader);
    const found = res.body.find(a => a.container === 'new-service');
    expect(found).toBeDefined();
  });

  test('DELETE /api/alerts → alerts clear hone chahiye', async () => {
    const res = await request(app)
      .delete('/api/alerts')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
