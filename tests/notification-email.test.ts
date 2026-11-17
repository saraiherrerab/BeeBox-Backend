import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '../src/config/db.js';
import { sendMail } from '../src/services/mail.service.js';
import { NotificationService } from '../src/services/notification.service.js';
import { cleanupTestUsers, createTestUser } from './helpers.js';

vi.mock('../src/services/mail.service.js', () => ({ sendMail: vi.fn() }));

const service = new NotificationService();
const sendMailMock = vi.mocked(sendMail);

beforeEach(() => {
  sendMailMock.mockReset();
});

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('createNotification envía correo', () => {
  it('envía correo al crear una notificación', async () => {
    const { user } = await createTestUser();
    await service.createNotification(user.id, 'Prueba', 'Tu paquete llegó');
    await vi.waitFor(() =>
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email, subject: 'BeeBox: Prueba' })
      )
    );
  });

  it('no envía a usuario inactivo', async () => {
    const { user } = await createTestUser();
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    await service.createNotification(user.id, 'Prueba', 'msg', 'info');
    await pause(200);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('sí avisa la inhabilitación a un usuario inactivo', async () => {
    const { user } = await createTestUser();
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    await service.createNotification(user.id, 'Cuenta Inhabilitada', 'msg', 'account_status');
    await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
  });

  it('si el envío falla la notificación se guarda igual', async () => {
    const { user } = await createTestUser();
    sendMailMock.mockRejectedValueOnce(new Error('smtp'));
    const notification = await service.createNotification(user.id, 'Prueba', 'msg');
    expect(notification.id).toBeDefined();
    await pause(100);
    const stored = await prisma.notification.findUnique({ where: { id: notification.id } });
    expect(stored).not.toBeNull();
  });
});
