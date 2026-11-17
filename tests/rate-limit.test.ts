import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createIpRateLimiter } from '../src/middlewares/rateLimit.middleware.js';

function appWithLimit(max: number) {
  const app = express();
  app.set('trust proxy', 1); // igual que la app real detrás de Nginx
  app.post('/x', createIpRateLimiter({ max, windowMs: 60_000 }), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('límite de intentos por IP (OBS-09)', () => {
  it('responde 429 con mensaje en español al pasar el límite', async () => {
    const app = appWithLimit(2);
    const ip = { 'X-Forwarded-For': '10.0.0.1' };
    expect((await request(app).post('/x').set(ip)).status).toBe(200);
    expect((await request(app).post('/x').set(ip)).status).toBe(200);
    const blocked = await request(app).post('/x').set(ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/demasiados intentos/i);
  });

  it('cuenta cada IP por separado detrás del proxy', async () => {
    const app = appWithLimit(1);
    expect((await request(app).post('/x').set('X-Forwarded-For', '10.0.0.2')).status).toBe(200);
    expect((await request(app).post('/x').set('X-Forwarded-For', '10.0.0.3')).status).toBe(200);
  });
});
