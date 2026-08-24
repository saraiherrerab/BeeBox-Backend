import prisma from '../config/db.js';

export class RetiroService {
  async getRetiros(userId?: string, isRoleAdmin?: boolean) {
    const whereClause: any = {};
    if (!isRoleAdmin && userId) {
      whereClause.userId = userId;
    }

    const retiros = await prisma.branchPickup.findMany({
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
        shipment: {
          select: {
            trackingCode: true,
            currentStatus: true,
            recipientName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return retiros;
  }

  async createRetiro(
    userId: string,
    data: {
      shipmentId: string;
      branchName: string;
      scheduledDate: string;
      scheduledTime: string;
    }
  ) {
    // Generar PIN único de 6 dígitos
    const pinCode = String(Math.floor(100000 + Math.random() * 900000));

    const retiro = await prisma.branchPickup.create({
      data: {
        pinCode,
        userId,
        shipmentId: data.shipmentId,
        branchName: data.branchName,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: 'PROGRAMADO',
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
        shipment: true,
      },
    });

    return retiro;
  }

  async verifyRetiroPIN(pinCode: string) {
    const retiro = await prisma.branchPickup.findUnique({
      where: { pinCode },
      include: {
        user: true,
        shipment: true,
      },
    });

    if (!retiro) {
      throw new Error('Código PIN inválido o no encontrado.');
    }

    if (retiro.status === 'ENTREGADO') {
      throw new Error('Este retiro ya fue entregado previamente.');
    }

    // Actualizar estado del retiro y del envío
    const updatedRetiro = await prisma.branchPickup.update({
      where: { id: retiro.id },
      data: {
        status: 'ENTREGADO',
        deliveredAt: new Date(),
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
        shipment: true,
      },
    });

    await prisma.shipment.update({
      where: { trackingCode: retiro.shipmentId },
      data: { currentStatus: 'entregado' },
    });

    await prisma.trackingEvent.create({
      data: {
        shipmentId: retiro.shipmentId,
        location: retiro.branchName,
        status: 'entregado',
        title: 'Entregado en Sucursal',
        description: `El paquete fue entregado exitosamente al cliente mediante verificación de PIN ${pinCode}.`,
      },
    });

    return updatedRetiro;
  }
}
