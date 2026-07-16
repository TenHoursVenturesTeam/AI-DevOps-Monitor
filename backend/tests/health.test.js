const request = require('supertest');
const app = require('../server');

describe('Health Check API', () => {
  test('GET /api/health → status ok milna chahiye', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /api/health → timestamp valid date hona chahiye', async () => {
    const res = await request(app).get('/api/health');
    const date = new Date(res.body.timestamp);
    expect(date).toBeInstanceOf(Date);
    expect(isNaN(date.getTime())).toBe(false);
  });

  test('GET /api/unknown-route → 404 milna chahiye', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
  });
});
