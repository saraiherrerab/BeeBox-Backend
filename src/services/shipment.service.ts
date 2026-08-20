import prisma from '../config/db.js';
import { TrackingEvent } from '@prisma/client';

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

    // Adapt database enum/fields to API contract
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

  async getAll() {
    return prisma.shipment.findMany({
      include: { events: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createShipment(data: {
    trackingCode: string;
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
    return prisma.shipment.create({
      data: {
        ...data,
        events: {
          create: [
            {
              location: data.senderCity,
              status: 'recoleccion',
              title: 'Orden Creada',
              description: 'El envío ha sido ingresado en el sistema BeeBox.',
            },
          ],
        },
      },
      include: { events: true },
    });
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

    return updatedShipment;
  }
}
