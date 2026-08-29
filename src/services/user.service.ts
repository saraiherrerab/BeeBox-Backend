import prisma from '../config/db.js';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

function normalizeRole(role?: string): string {
  if (!role) return 'client';
  const lower = role.toLowerCase();
  if (lower === 'super_admin') return 'super_admin';
  if (lower === 'admin') return 'admin';
  return 'client';
}

export class UserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shipments: true,
            prealertas: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((u) => ({
      ...u,
      role: 'client',
      phone: u.phone || '',
      suiteCode: u.suiteCode || '',
      active: u.active ?? true,
      disabledReason: u.disabledReason || null,
    }));
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shipments: true,
            prealertas: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      role: normalizeRole(user.role),
      phone: user.phone || '',
      suiteCode: user.suiteCode || '',
      active: user.active ?? true,
      disabledReason: user.disabledReason || null,
    };
  }

  async updateUser(id: string, data: { name?: string; phone?: string }) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      role: normalizeRole(updated.role),
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
      active: updated.active ?? true,
      disabledReason: updated.disabledReason || null,
    };
  }

  async updateUserRole(id: string, role: string) {
    const normalizedRole = normalizeRole(role);
    const updated = await prisma.user.update({
      where: { id },
      data: { role: normalizedRole },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      role: normalizeRole(updated.role),
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
      active: updated.active ?? true,
      disabledReason: updated.disabledReason || null,
    };
  }

  async updateUserStatus(id: string, active: boolean, disabledReason?: string) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        active,
        disabledReason: active ? null : (disabledReason || 'Inhabilitado por administración'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If disabled, generate automatic notification for the client (generic text as requested)
    if (!active) {
      await notificationService.createNotification(
        id,
        'Cuenta Inhabilitada',
        'Tu cuenta se encuentra inhabilitada hasta nuevo aviso.',
        'account_status'
      );
    }

    return {
      ...updated,
      role: normalizeRole(updated.role),
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
      active: updated.active,
      disabledReason: updated.disabledReason || null,
    };
  }

  async getAdminUsers() {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'super_admin'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((u) => ({
      ...u,
      role: u.role.toLowerCase(),
      phone: u.phone || '',
      suiteCode: u.suiteCode || '',
      active: u.active ?? true,
    }));
  }

  async createAdminUser(data: { name: string; email: string; password: string; phone?: string }) {
    const bcrypt = (await import('bcryptjs')).default;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const suiteCode = `CAS-ADM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdmin = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        phone: data.phone || null,
        role: 'admin',
        suiteCode,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        suiteCode: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return newAdmin;
  }
}
