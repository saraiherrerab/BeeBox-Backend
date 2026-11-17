import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { appUrl } from '../emails/layout.js';
import { passwordChangedEmail, passwordResetEmail } from '../emails/templates.js';
import { HttpError } from '../utils/http.js';
import { validatePassword } from './auth.service.js';
import { sendMail } from './mail.service.js';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const MAX_TOKENS_PER_HOUR = 3;
const INVALID_LINK = 'El enlace no es válido o ya venció.';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// El registro guarda el correo tal cual lo escribió el cliente, así que se busca sin
// distinguir mayúsculas. Se compara con lower() y no con `mode: 'insensitive'`, porque
// Prisma lo traduce a ILIKE y `%` o `_` funcionarían como comodines.
async function findUserByEmail(email: string) {
  const exact = await prisma.user.findUnique({ where: { email } });
  if (exact) return exact;
  const matches = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "User" WHERE lower(email) = lower(${email}) LIMIT 2`;
  // Si dos cuentas difieren solo en mayúsculas, no se adivina cuál es.
  if (matches.length !== 1) return null;
  return prisma.user.findUnique({ where: { id: matches[0].id } });
}

// Nunca revela si la cuenta existe: quien llama responde siempre lo mismo.
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = (email || '').trim();
  if (!normalized.includes('@')) return;

  const user = await findUserByEmail(normalized);
  if (!user || !user.active) return;

  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - TOKEN_TTL_MS) } },
  });
  if (recent >= MAX_TOKENS_PER_HOUR) return;

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const resetUrl = appUrl(`/restablecer-contrasena?token=${token}`);
  // Sin await: esperar a SMTP solo cuando la cuenta existe delataría por tiempo de respuesta
  // qué correos están registrados.
  void sendMail({ to: user.email, ...passwordResetEmail(user.name, resetUrl) });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (!token || typeof token !== 'string') throw new HttpError(400, INVALID_LINK);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.active) {
    throw new HttpError(400, INVALID_LINK);
  }

  try {
    validatePassword(password);
  } catch (error: any) {
    throw new HttpError(400, error.message);
  }

  const hashed = await bcrypt.hash(password, 10);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Reclamar el token de forma atómica: si dos pedidos llegan juntos, solo uno lo consigue.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new HttpError(400, INVALID_LINK);

    await tx.user.update({ where: { id: record.userId }, data: { password: hashed } });
    // Anula cualquier otro enlace pendiente del mismo usuario.
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    });
  });

  // Sin await: la contraseña ya cambió; un SMTP lento no debe mostrarle un error al cliente.
  void sendMail({ to: record.user.email, ...passwordChangedEmail(record.user.name) });
}
