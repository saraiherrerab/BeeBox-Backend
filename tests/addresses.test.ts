import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { cleanupTestUsers, createTestUser } from './helpers.js';

const sample = {
  label: 'Casa / Domicilio',
  address: 'Calle 1, Casa 5',
  city: 'Guayana, Bolívar',
  contactName: 'Sofía Salas',
  contactPhone: '0414-3333333',
};

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

describe('/api/addresses', () => {
  it('rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/addresses');
    expect(res.status).toBe(401);
  });

  it('crea una dirección, la persiste y la lista', async () => {
    const { user, auth } = await createTestUser();
    const res = await request(app).post('/api/addresses').set(auth).send(sample);
    expect(res.status).toBe(201);
    expect(res.body.savedAddress).toMatchObject({ ...sample, userId: user.id });

    expect(await prisma.savedAddress.count({ where: { userId: user.id } })).toBe(1);

    const list = await request(app).get('/api/addresses').set(auth);
    expect(list.body.addresses.map((a: any) => a.id)).toEqual([res.body.savedAddress.id]);
  });

  it('un usuario nuevo no ve las direcciones de otro', async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await request(app).post('/api/addresses').set(a.auth).send(sample);

    const res = await request(app).get('/api/addresses').set(b.auth);
    expect(res.status).toBe(200);
    expect(res.body.addresses).toEqual([]);
  });

  it('usa "Dirección" como etiqueta por defecto', async () => {
    const { auth } = await createTestUser();
    const res = await request(app)
      .post('/api/addresses')
      .set(auth)
      .send({ address: 'Av. 2', city: 'Maracay', label: '  ' });
    expect(res.body.savedAddress.label).toBe('Dirección');
  });

  it('responde 400 si faltan dirección o ciudad', async () => {
    const { auth } = await createTestUser();
    const res = await request(app).post('/api/addresses').set(auth).send({ label: 'Casa' });
    expect(res.status).toBe(400);
  });

  it('actualiza solo direcciones propias', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const created = await request(app).post('/api/addresses').set(owner.auth).send(sample);
    const id = created.body.savedAddress.id;

    const forbidden = await request(app)
      .put(`/api/addresses/${id}`)
      .set(other.auth)
      .send({ ...sample, city: 'Otra' });
    expect(forbidden.status).toBe(404);

    const ok = await request(app)
      .put(`/api/addresses/${id}`)
      .set(owner.auth)
      .send({ ...sample, label: 'Oficina' });
    expect(ok.status).toBe(200);
    expect(ok.body.savedAddress.label).toBe('Oficina');
  });

  it('elimina solo direcciones propias', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const created = await request(app).post('/api/addresses').set(owner.auth).send(sample);
    const id = created.body.savedAddress.id;

    expect((await request(app).delete(`/api/addresses/${id}`).set(other.auth)).status).toBe(404);
    expect((await request(app).delete(`/api/addresses/${id}`).set(owner.auth)).status).toBe(200);
    expect(await prisma.savedAddress.count({ where: { id } })).toBe(0);
  });
});
