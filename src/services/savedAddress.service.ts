import prisma from '../config/db.js';
import { HttpError } from '../utils/http.js';

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

  async update(id: string, userId: string, input: SavedAddressInput) {
    const found = await prisma.savedAddress.findFirst({ where: { id, userId } });
    if (!found) throw new HttpError(404, 'Dirección no encontrada.');
    return prisma.savedAddress.update({ where: { id }, data: normalize(input) });
  }

  async remove(id: string, userId: string) {
    const { count } = await prisma.savedAddress.deleteMany({ where: { id, userId } });
    if (count === 0) throw new HttpError(404, 'Dirección no encontrada.');
  }
}
