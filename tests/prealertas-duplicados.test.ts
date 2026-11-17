import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { cleanupTestUsers, createTestUser } from './helpers.js';

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

const prealerta = (trackingNumber: string, store = 'Amazon US') => ({
  store,
  trackingNumber,
  description: `Compra en ${store}`,
  amountPaid: 100,
  destination: 'Caracas, Venezuela',
});

describe('rastreo único por cliente (OBS-04)', () => {
  it('otro cliente puede registrar el mismo rastreo', async () => {
    const tracking = `TRK-${randomUUID()}`;
    const a = await createTestUser();
    const b = await createTestUser();
    expect((await request(app).post('/api/prealertas').set(a.auth).send(prealerta(tracking))).status).toBe(201);
    const res = await request(app).post('/api/prealertas').set(b.auth).send(prealerta(tracking));
    expect(res.status).toBe(201);
  });

  it('el mismo cliente no puede repetir su rastreo, aunque cambie mayúsculas', async () => {
    const tracking = `trk-${randomUUID()}`;
    const a = await createTestUser();
    await request(app).post('/api/prealertas').set(a.auth).send(prealerta(tracking, 'Apple Store'));
    const res = await request(app).post('/api/prealertas').set(a.auth).send(prealerta(tracking.toUpperCase()));
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Apple Store');
  });

  it('% y _ en el rastreo no actúan como comodines', async () => {
    const a = await createTestUser();
    await request(app).post('/api/prealertas').set(a.auth).send(prealerta(`TRK-${randomUUID()}`));
    const res = await request(app).post('/api/prealertas').set(a.auth).send(prealerta('%'));
    expect(res.status).toBe(201);
  });

  it('al editar, solo choca con rastreos del mismo cliente', async () => {
    const tracking = `TRK-${randomUUID()}`;
    const a = await createTestUser();
    const b = await createTestUser();
    await request(app).post('/api/prealertas').set(a.auth).send(prealerta(tracking, 'Apple Store'));
    const own = await request(app).post('/api/prealertas').set(a.auth).send(prealerta(`TRK-${randomUUID()}`));
    const other = await request(app).post('/api/prealertas').set(b.auth).send(prealerta(`TRK-${randomUUID()}`));

    const otherEdit = await request(app)
      .patch(`/api/prealertas/${other.body.prealerta?.id ?? other.body.id}`)
      .set(b.auth)
      .send({ trackingNumber: tracking });
    expect(otherEdit.status).toBe(200);

    const ownEdit = await request(app)
      .patch(`/api/prealertas/${own.body.prealerta?.id ?? own.body.id}`)
      .set(a.auth)
      .send({ trackingNumber: tracking });
    expect(ownEdit.status).toBe(400);
    expect(ownEdit.body.message).toContain('Apple Store');
  });
});
