import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'beebox_super_secret_jwt_key';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const suiteCode = `CAS-${Math.floor(10000 + Math.random() * 90000)}-MIAMI`;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        suiteCode,
        role: Role.CLIENT,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
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
        role: user.role.toLowerCase() as 'client' | 'admin',
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

    const roleString = user.role === Role.ADMIN ? 'admin' : 'client';

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
        role: roleString as 'client' | 'admin',
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const roleString = user.role === Role.ADMIN ? 'admin' : 'client';

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      suiteCode: user.suiteCode || '',
      role: roleString as 'client' | 'admin',
    };
  }
}
