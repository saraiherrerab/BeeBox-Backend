import prisma from '../config/db.js';

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
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      role: (updated.role && updated.role.toLowerCase() === 'admin') ? 'admin' : 'client',
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      role: (updated.role && updated.role.toLowerCase() === 'admin') ? 'admin' : 'client',
      phone: updated.phone || '',
      suiteCode: updated.suiteCode || '',
    };
  }
}
