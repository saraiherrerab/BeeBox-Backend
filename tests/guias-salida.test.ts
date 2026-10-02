import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { cleanupTestUsers, createTestUser } from './helpers.js';

const CODE_PREFIX = 'TEST-GS-';
const newCode = () => `${CODE_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const warehouses = [
  { warehouseCode: 'WR-1', recipientName: 'Sofía', contentDescription: 'Calzado', pieces: 2, weightKg: 5.4, declaredValue: 320 },
  { warehouseCode: 'WR-2', recipientName: 'Alejandro', contentDescription: 'Consola', pieces: 1, weightKg: 3.1, declaredValue: 580 },
];

const newGuia = () => ({
  guiaCode: newCode(),
  description: 'Despacho aéreo consolidado',
  destination: 'Caracas, Venezuela',
  departureDate: '2026-10-05',
  serviceType: 'Aéreo',
  warehouses,
});

afterAll(async () => {
  await prisma.guiaSalida.deleteMany({ where: { guiaCode: { startsWith: CODE_PREFIX } } });
  await cleanupTestUsers();
  await prisma.$disconnect();
});

describe('/api/guias-salida', () => {
  it('rechaza peticiones sin token', async () => {
    expect((await request(app).get('/api/guias-salida')).status).toBe(401);
  });

  it('rechaza a usuarios cliente', async () => {
    const { auth } = await createTestUser('client');
    expect((await request(app).get('/api/guias-salida').set(auth)).status).toBe(403);
  });

  it('crea una guía, calcula totales y la persiste', async () => {
    const { auth } = await createTestUser('admin');
    const body = newGuia();
    const res = await request(app).post('/api/guias-salida').set(auth).send(body);

    expect(res.status).toBe(201);
    expect(res.body.guia).toMatchObject({
      guiaCode: body.guiaCode,
      status: 'EN_PREPARACION',
      warehousesCount: 2,
      totalPieces: 3,
      totalWeightKg: 8.5,
      totalDeclaredValue: 900,
    });
    expect(await prisma.guiaSalida.findUnique({ where: { guiaCode: body.guiaCode } })).not.toBeNull();
  });

  it('lista y filtra por estado', async () => {
    const { auth } = await createTestUser('admin');
    const body = newGuia();
    await request(app).post('/api/guias-salida').set(auth).send(body);

    const enPreparacion = await request(app).get('/api/guias-salida?status=EN_PREPARACION').set(auth);
    expect(enPreparacion.body.guias.map((g: any) => g.guiaCode)).toContain(body.guiaCode);

    const completadas = await request(app).get('/api/guias-salida?status=COMPLETADA').set(auth);
    expect(completadas.body.guias.map((g: any) => g.guiaCode)).not.toContain(body.guiaCode);
  });

  it('responde 409 si el código ya existe', async () => {
    const { auth } = await createTestUser('admin');
    const body = newGuia();
    await request(app).post('/api/guias-salida').set(auth).send(body);
    expect((await request(app).post('/api/guias-salida').set(auth).send(body)).status).toBe(409);
  });

  it('responde 400 si faltan campos obligatorios', async () => {
    const { auth } = await createTestUser('admin');
    const res = await request(app).post('/api/guias-salida').set(auth).send({ description: 'Solo descripción' });
    expect(res.status).toBe(400);
  });

  it('actualiza el estado, lo persiste y rechaza estados inválidos', async () => {
    const { auth } = await createTestUser('admin');
    const created = await request(app).post('/api/guias-salida').set(auth).send(newGuia());
    const id = created.body.guia.id;

    const ok = await request(app).patch(`/api/guias-salida/${id}`).set(auth).send({ status: 'DESPACHADA' });
    expect(ok.status).toBe(200);
    expect((await prisma.guiaSalida.findUnique({ where: { id } }))?.status).toBe('DESPACHADA');

    const invalid = await request(app).patch(`/api/guias-salida/${id}`).set(auth).send({ status: 'PERDIDA' });
    expect(invalid.status).toBe(400);
  });

  it('recalcula los totales al cambiar los envíos', async () => {
    const { auth } = await createTestUser('admin');
    const created = await request(app).post('/api/guias-salida').set(auth).send(newGuia());

    const res = await request(app)
      .patch(`/api/guias-salida/${created.body.guia.guiaCode}`)
      .set(auth)
      .send({ warehouses: [warehouses[0]] });

    expect(res.body.guia).toMatchObject({
      warehousesCount: 1,
      totalPieces: 2,
      totalWeightKg: 5.4,
      totalDeclaredValue: 320,
    });
  });

  it('elimina la guía', async () => {
    const { auth } = await createTestUser('admin');
    const created = await request(app).post('/api/guias-salida').set(auth).send(newGuia());
    const id = created.body.guia.id;

    expect((await request(app).delete(`/api/guias-salida/${id}`).set(auth)).status).toBe(200);
    expect((await request(app).delete(`/api/guias-salida/${id}`).set(auth)).status).toBe(404);
  });
});
