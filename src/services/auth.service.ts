import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beebox_super_secret_jwt_key';

export function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new Error('La contraseña debe contener al menos una letra.');
  }
  if (!/\d/.test(password)) {
    throw new Error('La contraseña debe contener al menos un número.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new Error('La contraseña debe contener al menos un carácter especial (ej. !@#$%^&*).');
  }
}

function normalizeRole(role?: string): 'client' | 'admin' | 'super_admin' {
  if (!role) return 'client';
  const lower = role.toLowerCase();
  if (lower === 'super_admin') return 'super_admin';
  if (lower === 'admin') return 'admin';
  return 'client';
}

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    validatePassword(data.password);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const suiteCode = `CAS-${Math.floor(10000 + Math.random() * 90000)}-TULSA`;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        suiteCode,
        role: 'CLIENT',
        active: true,
      } as any,
    });

    const userRecord = user as any;
    const roleString = normalizeRole(user.role);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: roleString },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        suiteCode: user.suiteCode || '',
        role: roleString,
        active: userRecord.active ?? true,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas.');
    }

    const userRecord = user as any;
    const roleString = normalizeRole(user.role);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: roleString },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        suiteCode: user.suiteCode || '',
        role: roleString,
        active: userRecord.active ?? true,
        ...(roleString !== 'client' ? { disabledReason: userRecord.disabledReason || null } : {}),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const userRecord = user as any;
    const roleString = normalizeRole(user.role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      suiteCode: user.suiteCode || '',
      role: roleString,
      active: userRecord.active ?? true,
      ...(roleString !== 'client' ? { disabledReason: userRecord.disabledReason || null } : {}),
    };
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado.');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('La contraseña actual es incorrecta.');

    validatePassword(newPassword);

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { success: true, message: 'Contraseña actualizada exitosamente.' };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
    });

    return this.getUserById(updated.id);
  }
}
