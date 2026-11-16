import prisma from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

export interface RecipientInput {
  name: string;
  phone: string;
  phone2?: string | null;
  address: string;
  city?: string | null;
}

function normalize(input: RecipientInput) {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    phone2: input.phone2?.trim() || null,
    address: input.address.trim(),
    city: input.city?.trim() || '',
  };
}

export class RecipientService {
  async list(userId: string) {
    return prisma.savedRecipient.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }

  // Un destinatario con el mismo nombre (sin distinguir mayúsculas) y teléfono se actualiza en vez de duplicarse
  async create(userId: string, input: RecipientInput) {
    const data = normalize(input);
    const existing = await prisma.savedRecipient.findFirst({
      where: { userId, phone: data.phone, name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) {
      return prisma.savedRecipient.update({ where: { id: existing.id }, data });
    }
    return prisma.savedRecipient.create({ data: { ...data, userId } });
  }

  async update(id: string, userId: string, input: RecipientInput, isAdmin = false) {
    const found = await prisma.savedRecipient.findFirst({
      where: isAdmin ? { id } : { id, userId },
    });
    if (!found) throw new HttpError(404, 'Destinatario no encontrado.');
    const updated = await prisma.savedRecipient.update({ where: { id }, data: normalize(input) });

    if (isAdmin && found.userId !== userId) {
      await notificationService.createNotification(
        found.userId,
        'Dirección de entrega actualizada por Administración',
        `El administrador actualizó los datos de entrega del destinatario "${updated.name}" (${updated.address}, ${updated.city}).`,
        'info'
      );
    }

    return updated;
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const { count } = await prisma.savedRecipient.deleteMany({
      where: isAdmin ? { id } : { id, userId },
    });
    if (count === 0) throw new HttpError(404, 'Destinatario no encontrado.');
  }
}
