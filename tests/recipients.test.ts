import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { cleanupTestUsers, createTestUser } from './helpers.js';

const sample = {
  name: 'María Pérez',
  phone: '0414-1111111',
  phone2: '0212-2222222',
  address: 'Av. Principal, Edif. Sol, Apto 3',
  city: 'Caracas',
};

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

describe('/api/recipients', () => {
  it('rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/recipients');
    expect(res.status).toBe(401);
  });

  it('un usuario nuevo no tiene destinatarios', async () => {
    const { auth } = await createTestUser();
    const res = await request(app).get('/api/recipients').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.recipients).toEqual([]);
  });

  it('crea un destinatario y lo persiste en la base', async () => {
    const { user, auth } = await createTestUser();
    const res = await request(app).post('/api/recipients').set(auth).send(sample);
    expect(res.status).toBe(201);
    expect(res.body.recipient).toMatchObject({ ...sample, userId: user.id });

    const inDb = await prisma.savedRecipient.findMany({ where: { userId: user.id } });
    expect(inDb).toHaveLength(1);

    const list = await request(app).get('/api/recipients').set(auth);
    expect(list.body.recipients.map((r: any) => r.id)).toEqual([res.body.recipient.id]);
  });

  it('no mezcla destinatarios entre usuarios', async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await request(app).post('/api/recipients').set(a.auth).send(sample);

    const res = await request(app).get('/api/recipients').set(b.auth);
    expect(res.body.recipients).toEqual([]);
  });

  it('responde 400 si faltan campos obligatorios', async () => {
    const { auth } = await createTestUser();
    const res = await request(app).post('/api/recipients').set(auth).send({ name: 'Solo nombre' });
    expect(res.status).toBe(400);
  });

  it('no duplica un destinatario con el mismo nombre y teléfono', async () => {
    const { user, auth } = await createTestUser();
    await request(app).post('/api/recipients').set(auth).send(sample);
    await request(app)
      .post('/api/recipients')
      .set(auth)
      .send({ ...sample, name: 'MARÍA PÉREZ', address: 'Nueva dirección' });

    const inDb = await prisma.savedRecipient.findMany({ where: { userId: user.id } });
    expect(inDb).toHaveLength(1);
    expect(inDb[0].address).toBe('Nueva dirección');
  });

  it('actualiza solo destinatarios propios', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const created = await request(app).post('/api/recipients').set(owner.auth).send(sample);
    const id = created.body.recipient.id;

    const forbidden = await request(app)
      .put(`/api/recipients/${id}`)
      .set(other.auth)
      .send({ ...sample, city: 'Hackeada' });
    expect(forbidden.status).toBe(404);

    const ok = await request(app)
      .put(`/api/recipients/${id}`)
      .set(owner.auth)
      .send({ ...sample, city: 'Valencia' });
    expect(ok.status).toBe(200);
    expect(ok.body.recipient.city).toBe('Valencia');
  });

  it('elimina solo destinatarios propios', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const created = await request(app).post('/api/recipients').set(owner.auth).send(sample);
    const id = created.body.recipient.id;

    const forbidden = await request(app).delete(`/api/recipients/${id}`).set(other.auth);
    expect(forbidden.status).toBe(404);

    const ok = await request(app).delete(`/api/recipients/${id}`).set(owner.auth);
    expect(ok.status).toBe(200);
    expect(await prisma.savedRecipient.count({ where: { id } })).toBe(0);
  });
});
