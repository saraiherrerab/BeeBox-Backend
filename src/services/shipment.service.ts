import prisma from '../config/db.js';
import { TrackingEvent } from '@prisma/client';
import { NotificationService } from './notification.service.js';
import { emitSocketEvent } from '../socket.js';

const notificationService = new NotificationService();

export class ShipmentService {
  async getByTrackingCode(trackingCode: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingCode },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!shipment) return null;

    return {
      trackingCode: shipment.trackingCode,
      sender: {
        name: shipment.senderName,
        city: shipment.senderCity,
      },
      recipient: {
        name: shipment.recipientName,
        city: shipment.recipientCity,
        address: shipment.recipientAddress,
      },
      serviceType: shipment.serviceType,
      weightKg: shipment.weightKg,
      dimensions: shipment.dimensions,
      estimatedDelivery: shipment.estimatedDelivery,
      currentStatus: shipment.currentStatus,
      events: shipment.events.map((evt: TrackingEvent) => ({
        id: evt.id,
        timestamp: evt.timestamp.toISOString(),
        location: evt.location,
        status: evt.status,
        title: evt.title,
        description: evt.description,
      })),
    };
  }

  async getAll(userId?: string, isRoleAdmin?: boolean, search?: string) {
    // Auto-sincronizar: asegurar que toda prealerta confirmada tenga un registro Shipment en la base de datos
    try {
      const confirmedWithoutShipment = await prisma.prealerta.findMany({
        where: {
          status: { in: ['Confirmado', 'Vinculado'] },
          shipmentId: null,
        },
        include: { user: true },
      });

      for (const p of confirmedWithoutShipment) {
        const guideCode = p.warehouseGuide || `BBX-${Math.floor(10000 + Math.random() * 90000)}`;
        let existingShipment = await prisma.shipment.findUnique({
          where: { trackingCode: guideCode },
        });

        if (!existingShipment) {
          existingShipment = await prisma.shipment.create({
            data: {
              trackingCode: guideCode,
              providerWarehouseReceipt: p.providerWarehouseReceipt || null,
              userId: p.userId,
              senderName: p.store || 'Oklahoma Warehouse',
              senderCity: 'Broken Arrow, OK',
              recipientName: p.user?.name || 'Cliente BeeBox',
              recipientCity: p.destination || 'Caracas, Venezuela',
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
              shipmentId: guideCode,
              location: 'Almacén Central - Broken Arrow, OK',
              status: 'En el origen',
              title: 'Paquete Recibido y Confirmado en Almacén',
              description: `El paquete proveniente de ${p.store} fue recibido y confirmado en el almacén de origen.`,
            },
          });
        }

        await prisma.prealerta.update({
          where: { id: p.id },
          data: {
            warehouseGuide: guideCode,
            shipmentId: existingShipment.trackingCode,
          },
        });
      }
    } catch (err) {
      console.error('Error auto-sincronizando prealertas a envíos:', err);
    }

    const whereClause: any = {};
    if (!isRoleAdmin && userId) {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause.OR = [
        { trackingCode: { contains: search } },
        { providerWarehouseReceipt: { contains: search } },
        { recipientName: { contains: search } },
        { recipientCity: { contains: search } },
        { senderName: { contains: search } },
      ];
    }

    return prisma.shipment.findMany({
      where: whereClause,
      include: {
        events: { orderBy: { timestamp: 'desc' } },
        user: { select: { id: true, name: true, email: true, suiteCode: true } },
        prealerta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createShipment(data: {
    trackingCode: string;
    userId?: string;
    senderName: string;
    senderCity: string;
    recipientName: string;
    recipientCity: string;
    recipientAddress: string;
    serviceType: string;
    weightKg: number;
    dimensions: string;
    estimatedDelivery: string;
  }) {
    const shipment = await prisma.shipment.create({
      data: {
        ...data,
        currentStatus: 'En el origen',
        events: {
          create: [
            {
              location: data.senderCity,
              status: 'En el origen',
              title: 'Recibido en Origen',
              description: 'El envío ha sido ingresado en el almacén de origen.',
            },
          ],
        },
      },
      include: { events: true },
    });

    if (data.userId) {
      await notificationService.createNotification(
        data.userId,
        'Envío Creado / Recibido en Origen',
        `Tu paquete con guía ${data.trackingCode} ha sido recibido en el almacén de origen.`,
        'origen'
      );
    }

    emitSocketEvent('shipment:updated', shipment);
    emitSocketEvent('metrics:updated');

    return shipment;
  }

  async addTrackingEvent(
    trackingCode: string,
    event: {
      location: string;
      status: string;
      title: string;
      description: string;
    }
  ) {
    const updatedShipment = await prisma.shipment.update({
      where: { trackingCode },
      data: {
        currentStatus: event.status,
        events: {
          create: event,
        },
      },
      include: { events: true },
    });

    if (updatedShipment.userId) {
      let notifTitle = `Actualización de Envío (${event.status})`;
      let notifType = 'info';

      if (event.status === 'En el origen') {
        notifTitle = 'Recibido en Origen';
        notifType = 'origen';
      } else if (event.status === 'En camino') {
        notifTitle = 'Envío En Camino';
        notifType = 'en_camino';
      } else if (event.status === 'Llegó a su destino') {
        notifTitle = '¡Llegó a su Destino!';
        notifType = 'destino';
      }

      await notificationService.createNotification(
        updatedShipment.userId,
        notifTitle,
        `Tu paquete ${trackingCode}: ${event.description || event.title}`,
        notifType
      );

      emitSocketEvent('notification:new', { userId: updatedShipment.userId });
    }

    emitSocketEvent('shipment:updated', updatedShipment);
    emitSocketEvent('metrics:updated');

    return updatedShipment;
  }

  async updateStatus(trackingCode: string, status: string) {
    let title = 'Actualización de Estado';
    let description = `El estado del paquete con guía ${trackingCode} ha sido actualizado a: ${status}.`;
    let location = 'Almacén / Tránsito';

    if (status === 'En el origen') {
      title = 'Recibido en Origen';
      description = `El paquete ha sido ingresado y preparado en el almacén de origen (Broken Arrow, OK).`;
      location = 'Broken Arrow, OK';
    } else if (status === 'En camino') {
      title = 'Envío En Camino';
      description = `El paquete se encuentra en tránsito aéreo/marítimo hacia su ciudad de destino.`;
      location = 'En Ruta Internacional';
    } else if (status === 'Llegó a su destino') {
      title = '¡Llegó a su Destino!';
      description = `El paquete ha arribado exitosamente al centro de distribución en su ciudad de destino.`;
      location = 'Centro de Distribución Destino';
    }

    return this.addTrackingEvent(trackingCode, {
      status,
      title,
      description,
      location,
    });
  }
}
