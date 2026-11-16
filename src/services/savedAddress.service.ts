import prisma from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

export interface SavedAddressInput {
  label?: string | null;
  address: string;
  city: string;
  contactName?: string | null;
  contactPhone?: string | null;
}

function normalize(input: SavedAddressInput) {
  return {
    label: input.label?.trim() || 'Dirección',
    address: input.address.trim(),
    city: input.city.trim(),
    contactName: input.contactName?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
  };
}

export class SavedAddressService {
  async list(userId: string) {
    return prisma.savedAddress.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }

  async create(userId: string, input: SavedAddressInput) {
    return prisma.savedAddress.create({ data: { ...normalize(input), userId } });
  }

  async update(id: string, userId: string, input: SavedAddressInput, isAdmin = false) {
    const found = await prisma.savedAddress.findFirst({
      where: isAdmin ? { id } : { id, userId },
    });
    if (!found) throw new HttpError(404, 'Dirección no encontrada.');
    const updated = await prisma.savedAddress.update({ where: { id }, data: normalize(input) });

    if (isAdmin && found.userId !== userId) {
      await notificationService.createNotification(
        found.userId,
        'Dirección actualizada por Administración',
        `El administrador actualizó tu dirección guardada "${updated.label}" (${updated.address}, ${updated.city}).`,
        'info'
      );
    }

    return updated;
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const { count } = await prisma.savedAddress.deleteMany({
      where: isAdmin ? { id } : { id, userId },
    });
    if (count === 0) throw new HttpError(404, 'Dirección no encontrada.');
  }
}
