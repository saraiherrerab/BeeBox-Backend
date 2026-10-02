import prisma from '../config/db.js';
import { HttpError } from '../utils/http.js';

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

  async update(id: string, userId: string, input: RecipientInput) {
    const found = await prisma.savedRecipient.findFirst({ where: { id, userId } });
    if (!found) throw new HttpError(404, 'Destinatario no encontrado.');
    return prisma.savedRecipient.update({ where: { id }, data: normalize(input) });
  }

  async remove(id: string, userId: string) {
    const { count } = await prisma.savedRecipient.deleteMany({ where: { id, userId } });
    if (count === 0) throw new HttpError(404, 'Destinatario no encontrado.');
  }
}
