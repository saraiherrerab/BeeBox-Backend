import prisma from '../config/db.js';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

export class PrealertaService {
  async getPrealertas(userId?: string, isRoleAdmin?: boolean, search?: string) {
    const whereClause: any = {};

    if (!isRoleAdmin && userId) {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause.OR = [
        { store: { contains: search } },
        { trackingNumber: { contains: search } },
        { description: { contains: search } },
        { warehouseGuide: { contains: search } },
      ];
    }

    const prealertas = await prisma.prealerta.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            suiteCode: true,
          },
        },
        shipment: {
          select: {
            trackingCode: true,
            currentStatus: true,
            estimatedDelivery: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prealertas;
  }

  async createPrealerta(
    userId: string,
    data: {
      store: string;
      trackingNumber: string;
      description: string;
      amountPaid: number;
      receiptFileName?: string;
    }
  ) {
    const prealerta = await prisma.prealerta.create({
      data: {
        userId,
        store: data.store,
        trackingNumber: data.trackingNumber,
        description: data.description,
        amountPaid: Number(data.amountPaid),
        receiptFileName: data.receiptFileName || null,
        status: 'Prealertado',
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

    return prealerta;
  }

  async linkPrealerta(id: string, warehouseGuide: string) {
    const existing = await prisma.prealerta.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new Error('Prealerta no encontrada.');
    }

    let shipment = await prisma.shipment.findUnique({
      where: { trackingCode: warehouseGuide },
    });

    if (!shipment) {
      shipment = await prisma.shipment.create({
        data: {
          trackingCode: warehouseGuide,
          userId: existing.userId,
          senderName: existing.store || 'Tulsa Warehouse',
          senderCity: 'Tulsa, OK',
          recipientName: existing.user.name,
          recipientCity: 'Ciudad de México',
          recipientAddress: 'Dirección Registrada del Cliente',
          serviceType: 'Aéreo Exprés',
          weightKg: 1.0,
          dimensions: '25x20x15 cm',
          estimatedDelivery: '3-5 días hábiles',
          currentStatus: 'En el origen',
        },
      });

      await prisma.trackingEvent.create({
        data: {
          shipmentId: warehouseGuide,
          location: 'Almacén Central - Tulsa, OK',
          status: 'En el origen',
          title: 'Paquete Recibido y Registrado',
          description: `El paquete proveniente de ${existing.store} ha sido recibido en el almacén de Tulsa, OK con guía ${warehouseGuide}.`,
        },
      });
    }

    const updatedPrealerta = await prisma.prealerta.update({
      where: { id },
      data: {
        warehouseGuide,
        status: 'Vinculado',
        shipmentId: shipment.trackingCode,
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

    // Send origin notification to user
    await notificationService.createNotification(
      existing.userId,
      'Prealerta Vinculada / Recibido en Tulsa, OK',
      `Tu prealerta de ${existing.store} (${existing.trackingNumber}) fue recibida en Tulsa, OK y se le asignó la guía ${warehouseGuide}.`,
      'origen'
    );

    return updatedPrealerta;
  }

  async updateStatus(id: string, status: string) {
    const updated = await prisma.prealerta.update({
      where: { id },
      data: { status },
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

    return updated;
  }
}
