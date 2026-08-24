import prisma from '../config/db.js';

export class PickupService {
  async getPickups(userId?: string, isRoleAdmin?: boolean) {
    const whereClause: any = {};
    if (!isRoleAdmin && userId) {
      whereClause.userId = userId;
    }

    const pickups = await prisma.pickup.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            suiteCode: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pickups;
  }

  async createPickup(
    userId: string,
    data: {
      senderName: string;
      senderPhone: string;
      senderAddress: string;
      senderCity: string;
      boxCount?: number;
      totalWeightKg?: number;
      containElectronics?: boolean;
      recipientName: string;
      recipientPhone: string;
      recipientAddress: string;
      recipientCity: string;
      pickupDate: string;
      timeSlot: string;
    }
  ) {
    const pickupCode = `PK-${Math.floor(1000 + Math.random() * 9000)}-DOM`;

    const pickup = await prisma.pickup.create({
      data: {
        pickupCode,
        userId,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        senderAddress: data.senderAddress,
        senderCity: data.senderCity,
        boxCount: data.boxCount ? Number(data.boxCount) : 1,
        totalWeightKg: data.totalWeightKg ? Number(data.totalWeightKg) : 1.0,
        containElectronics: Boolean(data.containElectronics),
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        recipientAddress: data.recipientAddress,
        recipientCity: data.recipientCity,
        pickupDate: data.pickupDate,
        timeSlot: data.timeSlot,
        status: 'PENDIENTE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            suiteCode: true,
          },
        },
      },
    });

    return pickup;
  }

  async updatePickup(id: string, data: { status?: string; vehicleId?: string }) {
    const updated = await prisma.pickup.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            suiteCode: true,
          },
        },
        vehicle: true,
      },
    });

    return updated;
  }
}
