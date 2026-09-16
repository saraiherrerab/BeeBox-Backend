import prisma from '../config/db.js';
import { emitSocketEvent } from '../socket.js';

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
      containLithium?: boolean;
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
        containLithium: Boolean(data.containLithium),
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

    emitSocketEvent('pickup:created', pickup);
    emitSocketEvent('metrics:updated');

    return pickup;
  }

  async updatePickup(
    id: string,
    data: {
      status?: string;
      vehicleId?: string;
      warehouseGuide?: string;
      estimatedDelivery?: string;
      verifiedWeight?: number;
      verifiedDimensions?: string;
      verifiedBoxes?: number;
      inspectionNotes?: string;
    }
  ) {
    const current = await prisma.pickup.findUnique({
      where: { id },
      include: { shipment: true, vehicle: true, user: true },
    });

    if (!current) throw new Error('Solicitud de pickup no encontrada');

    const updated = await prisma.pickup.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId } : {}),
        ...(data.verifiedWeight ? { totalWeightKg: Number(data.verifiedWeight) } : {}),
        ...(data.verifiedBoxes ? { boxCount: Number(data.verifiedBoxes) } : {}),
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
        shipment: true,
      },
    });

    // Si el operativo confirma o asigna el pickup (EN_PROCESO, CONFIRMADO, EN RUTA o APROBADO) y aún no existe el Shipment:
    const isEnProceso =
      data.status === 'EN_PROCESO' ||
      data.status === 'CONFIRMADO' ||
      data.status === 'EN RUTA' ||
      data.status === 'APROBADO';

    const isCompletadoEnOrigen =
      data.status === 'COMPLETADO' ||
      data.status === 'EN_ORIGEN' ||
      data.status === 'RECOLECTADO' ||
      data.status === 'RECIBIDO_ALMACEN';

    const finalWeight = data.verifiedWeight ? Number(data.verifiedWeight) : (current.totalWeightKg || 1.0);
    const finalBoxes = data.verifiedBoxes ? Number(data.verifiedBoxes) : (current.boxCount || 1);
    const finalDimensions = data.verifiedDimensions || `${finalBoxes} caja(s) (30x20x15 cm)`;
    const guide = data.warehouseGuide || current.pickupCode;
    const vehicleName = updated.vehicle?.name || 'Unidad de Flota Asignada';

    if (!current.shipment && (isEnProceso || isCompletadoEnOrigen)) {
      try {
        const initialStatus = isCompletadoEnOrigen ? 'En el origen' : 'Pick up en proceso';
        const initialEventTitle = isCompletadoEnOrigen
          ? 'Paquete Recolectado e Ingresado en Almacén'
          : 'Recolección a Domicilio Asignada y en Proceso';
        const initialEventDesc = isCompletadoEnOrigen
          ? `El paquete fue recolectado en domicilio por ${vehicleName} e ingresado al almacén de origen para su posterior envío. Peso: ${finalWeight} kg (${finalDimensions}). ${data.inspectionNotes ? `Inspección: ${data.inspectionNotes}` : ''}`
          : `Solicitud asignada a ${vehicleName} para recolección en domicilio (${current.pickupDate} - ${current.timeSlot}). Peso: ${finalWeight} kg (${finalDimensions}). ${data.inspectionNotes ? `Inspección: ${data.inspectionNotes}` : ''}`;

        const shipment = await prisma.shipment.create({
          data: {
            trackingCode: guide,
            userId: current.userId,
            senderName: current.senderName,
            senderCity: current.senderCity || 'Ciudad de Origen',
            recipientName: current.recipientName,
            recipientCity: current.recipientCity || 'Caracas, Venezuela',
            recipientAddress: current.recipientAddress,
            serviceType: 'Pickup a Domicilio + Aéreo Exprés',
            weightKg: finalWeight,
            dimensions: finalDimensions,
            estimatedDelivery: data.estimatedDelivery || '3-5 días hábiles',
            currentStatus: initialStatus,
            hasPickup: true,
            pickupId: current.id,
            events: {
              create: [
                {
                  location: `${current.senderAddress}, ${current.senderCity || 'Ciudad de Origen'}`,
                  status: initialStatus,
                  title: initialEventTitle,
                  description: initialEventDesc,
                },
              ],
            },
          },
        });

        emitSocketEvent('shipment:updated', shipment);
      } catch (err) {
        console.error('Error al crear envío desde pickup:', err);
      }
    } else if (current.shipment) {
      // Si el shipment ya existe, actualizar sus dimensiones, peso y estado si corresponde
      try {
        const updateShipmentData: any = {};
        if (data.verifiedDimensions) updateShipmentData.dimensions = data.verifiedDimensions;
        if (data.verifiedWeight) updateShipmentData.weightKg = Number(data.verifiedWeight);

        if (isCompletadoEnOrigen) {
          updateShipmentData.currentStatus = 'En el origen';
        }

        const updatedShipment = await prisma.shipment.update({
          where: { trackingCode: current.shipment.trackingCode },
          data: updateShipmentData,
        });

        if (isCompletadoEnOrigen && current.shipment.currentStatus !== 'En el origen') {
          await prisma.trackingEvent.create({
            data: {
              shipmentId: current.shipment.trackingCode,
              location: 'Almacén Central',
              status: 'En el origen',
              title: 'Paquete Recolectado e Ingresado en Almacén',
              description: `El paquete fue recolectado en domicilio por ${vehicleName} e ingresado al almacén de origen para su posterior despacho. Peso: ${finalWeight} kg (${finalDimensions}). ${data.inspectionNotes ? `Inspección: ${data.inspectionNotes}` : ''}`,
            },
          });
        }

        emitSocketEvent('shipment:updated', updatedShipment);
      } catch (err) {
        console.error('Error al actualizar envío existente desde pickup:', err);
      }
    }

    emitSocketEvent('pickup:updated', updated);
    emitSocketEvent('metrics:updated');

    return updated;
  }
}
