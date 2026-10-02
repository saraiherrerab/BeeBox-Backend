import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import prisma from '../src/config/db.js';

const TEST_EMAIL_PREFIX = 'test-libreta-';
const JWT_SECRET = process.env.JWT_SECRET || 'beebox_super_secret_jwt_key';

export async function createTestUser(role: 'client' | 'admin' = 'client') {
  const user = await prisma.user.create({
    data: {
      name: 'Usuario Test',
      email: `${TEST_EMAIL_PREFIX}${randomUUID()}@beebox.test`,
      password: 'no-se-usa',
      role,
    },
  });
  const token = jwt.sign({ userId: user.id, email: user.email, role }, JWT_SECRET);
  return { user, auth: { Authorization: `Bearer ${token}` } };
}

// Borra los usuarios de prueba; sus direcciones y destinatarios caen por onDelete: Cascade
export async function cleanupTestUsers() {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
}
