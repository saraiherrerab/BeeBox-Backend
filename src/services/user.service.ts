import prisma from '../config/db.js';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

export class UserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
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
      role: (u.role && u.role.toLowerCase() === 'admin') ? 'admin' : 'client',
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
      role: (user.role && user.role.toLowerCase() === 'admin') ? 'admin' : 'client',
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
      role: (updated.role && updated.role.toLowerCase() === 'admin') ? 'admin' : 'client',
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
      active: updated.active ?? true,
      disabledReason: updated.disabledReason || null,
    };
  }

  async updateUserRole(id: string, role: string) {
    const normalizedRole = role.toLowerCase() === 'admin' ? 'admin' : 'client';
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
      role: (updated.role && updated.role.toLowerCase() === 'admin') ? 'admin' : 'client',
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
      role: (updated.role && updated.role.toLowerCase() === 'admin') ? 'admin' : 'client',
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
      active: updated.active,
      disabledReason: updated.disabledReason || null,
    };
  }
}
