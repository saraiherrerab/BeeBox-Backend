import prisma from '../config/db.js';
import { VehicleCategory, FleetVehicle } from '@prisma/client';

export class FleetService {
  async getActiveVehicles() {
    const vehicles: FleetVehicle[] = await prisma.fleetVehicle.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return vehicles.map((v: FleetVehicle) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      capacity: v.capacity,
      volume: v.volume,
      features: v.features,
      imageUrl: v.imageUrl || undefined,
    }));
  }

  async createVehicle(data: {
    name: string;
    category: VehicleCategory;
    capacity: string;
    volume: string;
    features: string[];
    imageUrl?: string;
  }) {
    return prisma.fleetVehicle.create({ data });
  }
}
