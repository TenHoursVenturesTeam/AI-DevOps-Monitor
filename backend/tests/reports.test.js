const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { EFFECTIVE_JWT_SECRET } = require('../routes/auth');

const token = jwt.sign({ id: 'test-admin', email: 'admin@test.com', role: 'admin' }, EFFECTIVE_JWT_SECRET);
const authHeader = { 'Authorization': `Bearer ${token}` };

describe('Reports API', () => {
  test('POST /api/reports/send → should fail without token', async () => {
    const res = await request(app)
      .post('/api/reports/send');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/reports/send → should succeed with valid admin token', async () => {
    const res = await request(app)
      .post('/api/reports/send')
      .set(authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.previewUrl).toBeDefined();
    expect(res.body.targetEmail).toBe('admin@test.com');
  });

  test('POST /api/reports/send → should succeed with viewer token', async () => {
    const viewerToken = jwt.sign({ id: 'test-viewer', email: 'viewer@test.com', role: 'viewer' }, EFFECTIVE_JWT_SECRET);
    const res = await request(app)
      .post('/api/reports/send')
      .set({ 'Authorization': `Bearer ${viewerToken}` });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.previewUrl).toBeDefined();
    expect(res.body.targetEmail).toBe('viewer@test.com');
  });
});
