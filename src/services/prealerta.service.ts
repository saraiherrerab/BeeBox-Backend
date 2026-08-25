import prisma from '../config/db.js';
import { NotificationService } from './notification.service.js';
import { emitSocketEvent } from '../socket.js';

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
        { destination: { contains: search } },
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
      destination?: string;
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
        destination: data.destination || 'Caracas, Venezuela',
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

    emitSocketEvent('prealerta:updated', prealerta);
    emitSocketEvent('metrics:updated');

    return prealerta;
  }

  async linkPrealerta(id: string, warehouseGuide: string, destination?: string) {
    let existing = await prisma.prealerta.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      existing = await prisma.prealerta.findFirst({
        where: { trackingNumber: id },
        include: { user: true },
      });
    }

    if (!existing) {
      throw new Error(`Prealerta '${id}' no encontrada en la base de datos.`);
    }

    const targetDestination = destination || existing.destination || 'Caracas, Venezuela';

    let shipment = await prisma.shipment.findUnique({
      where: { trackingCode: warehouseGuide },
    });

    if (!shipment) {
      shipment = await prisma.shipment.create({
        data: {
          trackingCode: warehouseGuide,
          userId: existing.userId,
          senderName: existing.store || 'Oklahoma Warehouse',
          senderCity: 'Broken Arrow, OK',
          recipientName: existing.user.name,
          recipientCity: targetDestination,
          recipientAddress: 'Dirección Registrada del Cliente',
          serviceType: 'Aéreo Exprés Internacional',
          weightKg: 1.0,
          dimensions: '25x20x15 cm',
          estimatedDelivery: '3-5 días hábiles',
          currentStatus: 'En el origen',
        },
      });

      await prisma.trackingEvent.create({
        data: {
          shipmentId: warehouseGuide,
          location: 'Almacén Central - Broken Arrow, OK',
          status: 'En el origen',
          title: 'Paquete Recibido y Confirmado en Almacén',
          description: `El paquete proveniente de ${existing.store} ha sido confirmado en el almacén con la guía ${warehouseGuide} y preparado para despacho hacia ${targetDestination}.`,
        },
      });
    }

    const updatedPrealerta = await prisma.prealerta.update({
      where: { id: existing.id },
      data: {
        warehouseGuide,
        destination: targetDestination,
        status: 'Confirmado',
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

    // Send notification to user
    await notificationService.createNotification(
      existing.userId,
      '¡Prealerta Confirmada! Recibido en Almacén',
      `Tu prealerta de ${existing.store} (${existing.trackingNumber}) fue recepcionada en el almacén de Oklahoma (Guía: ${warehouseGuide}) y confirmada para envío a ${targetDestination}.`,
      'origen'
    );

    emitSocketEvent('prealerta:updated', updatedPrealerta);
    emitSocketEvent('shipment:updated', shipment);
    emitSocketEvent('notification:new', { userId: existing.userId });
    emitSocketEvent('metrics:updated');

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

    emitSocketEvent('prealerta:updated', updated);
    emitSocketEvent('metrics:updated');

    return updated;
  }
}
