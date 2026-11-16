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
        savedAddresses: {
          orderBy: { updatedAt: 'desc' },
        },
        savedRecipients: {
          orderBy: { updatedAt: 'desc' },
        },
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

  async updateUser(
    id: string,
    data: { name?: string; phone?: string; email?: string; suiteCode?: string },
    isAdminEdit = false
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Usuario no encontrado.');
    }

    const updatePayload: any = {};
    const changedFields: string[] = [];

    if (data.name !== undefined && data.name.trim()) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existing.name) {
        updatePayload.name = trimmedName;
        changedFields.push('nombre');
      }
    }

    if (data.phone !== undefined) {
      const trimmedPhone = data.phone.trim();
      if (trimmedPhone !== (existing.phone || '')) {
        updatePayload.phone = trimmedPhone || null;
        changedFields.push('teléfono de contacto');
      }
    }

    if (isAdminEdit && data.email !== undefined && data.email.trim()) {
      const trimmedEmail = data.email.trim().toLowerCase();
      if (trimmedEmail !== existing.email.toLowerCase()) {
        const duplicateEmail = await prisma.user.findFirst({
          where: {
            id: { not: id },
            email: { equals: trimmedEmail, mode: 'insensitive' },
          },
        });
        if (duplicateEmail) {
          throw new Error('El correo electrónico indicado ya pertenece a otra cuenta.');
        }
        updatePayload.email = trimmedEmail;
        changedFields.push('correo electrónico');
      }
    }

    if (isAdminEdit && data.suiteCode !== undefined && data.suiteCode.trim()) {
      const trimmedSuite = data.suiteCode.trim().toUpperCase();
      if (trimmedSuite !== (existing.suiteCode || '')) {
        const duplicateSuite = await prisma.user.findFirst({
          where: {
            id: { not: id },
            suiteCode: { equals: trimmedSuite, mode: 'insensitive' },
          },
        });
        if (duplicateSuite) {
          throw new Error('El código de casillero indicado ya está asignado a otro cliente.');
        }
        updatePayload.suiteCode = trimmedSuite;
        changedFields.push('código de casillero');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updatePayload,
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
        savedAddresses: {
          orderBy: { updatedAt: 'desc' },
        },
        savedRecipients: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (isAdminEdit && changedFields.length > 0) {
      await notificationService.createNotification(
        id,
        'Datos de perfil actualizados por Administración',
        `El equipo de soporte de BeeBox actualizó tu información (${changedFields.join(', ')}). Puedes verificar los datos en la sección Mi Perfil.`,
        'info'
      );
    }

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
