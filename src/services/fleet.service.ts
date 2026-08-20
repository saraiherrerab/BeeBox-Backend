import prisma from '../config/db.js';
import { FleetVehicle } from '@prisma/client';

export class FleetService {
  async getActiveVehicles() {
    const vehicles: any[] = await prisma.fleetVehicle.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return vehicles.map((v: any) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      capacity: v.capacity,
      volume: v.volume,
      features: typeof v.features === 'string' ? JSON.parse(v.features) : v.features,
      imageUrl: v.imageUrl || undefined,
    }));
  }

  async createVehicle(data: {
    name: string;
    category: any;
    capacity: string;
    volume: string;
    features: string[];
    imageUrl?: string;
  }) {
    return prisma.fleetVehicle.create({
      data: {
        ...data,
        features: JSON.stringify(data.features),
      },
    });
  }
}
