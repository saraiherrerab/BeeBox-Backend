import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { sendMail } from '../src/services/mail.service.js';
import { cleanupTestUsers } from './helpers.js';

vi.mock('../src/services/mail.service.js', () => ({ sendMail: vi.fn() }));

const sendMailMock = vi.mocked(sendMail);
const GENERIC = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
const INVALID = 'El enlace no es válido o ya venció.';
const OLD_PASSWORD = 'Vieja123!';

async function createUserWithPassword() {
  return prisma.user.create({
    data: {
      name: 'Usuario Reset',
      email: `test-libreta-${randomUUID()}@beebox.test`,
      password: await bcrypt.hash(OLD_PASSWORD, 10),
      role: 'client',
    },
  });
}

async function requestToken(email: string): Promise<string> {
  sendMailMock.mockClear();
  await request(app).post('/api/auth/forgot-password').send({ email });
  const text = sendMailMock.mock.calls[0][0].text;
  return text.match(/token=([a-f0-9]{64})/)![1];
}

beforeEach(() => {
  sendMailMock.mockReset();
});

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

describe('POST /api/auth/forgot-password', () => {
  it('responde igual exista o no la cuenta y solo envía correo si existe', async () => {
    const user = await createUserWithPassword();
    const missing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: `test-libreta-${randomUUID()}@beebox.test` });
    expect(sendMailMock).not.toHaveBeenCalled();
    const existing = await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    expect(missing.status).toBe(200);
    expect(existing.status).toBe(200);
    expect(missing.body.message).toBe(GENERIC);
    expect(existing.body.message).toBe(GENERIC);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe(user.email);
  });

  it('encuentra la cuenta aunque el correo venga con mayúsculas y espacios', async () => {
    const user = await createUserWithPassword();
    await request(app).post('/api/auth/forgot-password').send({ email: `  ${user.email.toUpperCase()} ` });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it('no crea más de 3 tokens por hora', async () => {
    const user = await createUserWithPassword();
    for (let i = 0; i < 4; i++) {
      await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    }
    expect(await prisma.passwordResetToken.count({ where: { userId: user.id } })).toBe(3);
  });

  it('el enlace vence a los 30 minutos y el correo lo dice', async () => {
    const user = await createUserWithPassword();
    await requestToken(user.email);
    const stored = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });
    const minutes = (stored.expiresAt.getTime() - stored.createdAt.getTime()) / 60000;
    expect(minutes).toBeCloseTo(30, 0);
    expect(sendMailMock.mock.calls[0][0].text).toContain('30 minutos');
  });

  it('guarda solo el hash del token', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    const stored = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('trata % y _ como texto, no como comodines', async () => {
    await createUserWithPassword();
    for (const email of ['%', '%@beebox.test', 'test-libreta-%', '_%']) {
      await request(app).post('/api/auth/forgot-password').send({ email });
    }
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('no envía enlace a una cuenta inactiva', async () => {
    const user = await createUserWithPassword();
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    expect(res.body.message).toBe(GENERIC);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('cambia la contraseña, permite iniciar sesión y avisa por correo', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'Nueva123!' });
    expect(res.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Nueva123!' });
    expect(login.status).toBe(200);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, subject: 'Tu contraseña de BeeBox fue cambiada' })
    );
  });

  it('rechaza reutilizar el mismo token', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    await request(app).post('/api/auth/reset-password').send({ token, password: 'Nueva123!' });
    const again = await request(app).post('/api/auth/reset-password').send({ token, password: 'Otra456!' });
    expect(again.status).toBe(400);
    expect(again.body.message).toBe(INVALID);
  });

  it('acepta el token una sola vez aunque lleguen dos pedidos simultáneos', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    const [a, b] = await Promise.all([
      request(app).post('/api/auth/reset-password').send({ token, password: 'Primera123!' }),
      request(app).post('/api/auth/reset-password').send({ token, password: 'Segunda456!' }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 400]);
  });

  it('responde sin esperar a que salga el correo de confirmación', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    sendMailMock.mockImplementation(() => new Promise<void>(() => {})); // SMTP colgado
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'Nueva123!' }).timeout(3000);
    expect(res.status).toBe(200);
  });

  it('rechaza un token vencido', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'Nueva123!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(INVALID);
  });

  it('rechaza una contraseña débil sin cambiarla', async () => {
    const user = await createUserWithPassword();
    const token = await requestToken(user.email);
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'corta' });
    expect(res.status).toBe(400);
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: OLD_PASSWORD });
    expect(login.status).toBe(200);
  });

  it('responde 400 con body vacío', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
  });

  it('invalida los demás tokens pendientes tras el cambio', async () => {
    const user = await createUserWithPassword();
    const first = await requestToken(user.email);
    await requestToken(user.email);
    await request(app).post('/api/auth/reset-password').send({ token: first, password: 'Nueva123!' });
    const pending = await prisma.passwordResetToken.count({ where: { userId: user.id, usedAt: null } });
    expect(pending).toBe(0);
  });
});
