import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';
import { HttpError } from '../utils/http.js';

export const GUIA_STATUSES = ['EN_PREPARACION', 'DESPACHADA', 'EN_TRANSITO', 'ARRIBADA', 'COMPLETADA'];

export interface DispatchedShipmentItem {
  pieces?: number;
  weightKg?: number;
  declaredValue?: number;
  [key: string]: unknown;
}

export interface GuiaSalidaInput {
  guiaCode?: string;
  description?: string;
  destination?: string;
  departureDate?: string;
  serviceType?: string;
  carrier?: string | null;
  status?: string;
  warehouses?: DispatchedShipmentItem[];
  notes?: string | null;
}

export interface GuiaSalidaFilters {
  status?: string;
  destination?: string;
  search?: string;
}

const UPDATABLE_FIELDS = ['description', 'destination', 'departureDate', 'serviceType', 'carrier', 'status', 'notes'] as const;

function computeTotals(warehouses: DispatchedShipmentItem[]) {
  const sum = (pick: (w: DispatchedShipmentItem) => number) =>
    Number(warehouses.reduce((acc, w) => acc + pick(w), 0).toFixed(2));
  return {
    warehousesCount: warehouses.length,
    totalPieces: warehouses.reduce((acc, w) => acc + (w.pieces || 1), 0),
    totalWeightKg: sum((w) => (typeof w.weightKg === 'number' ? w.weightKg : 0)),
    totalDeclaredValue: sum((w) => (typeof w.declaredValue === 'number' ? w.declaredValue : 0)),
  };
}

function matchesSearch(guia: { guiaCode: string; description: string; destination: string; carrier: string | null; warehouses: Prisma.JsonValue }, q: string) {
  const items = Array.isArray(guia.warehouses) ? (guia.warehouses as Record<string, unknown>[]) : [];
  const texts = [
    guia.guiaCode,
    guia.description,
    guia.destination,
    guia.carrier ?? '',
    ...items.flatMap((w) => [w.trackingCode, w.warehouseCode, w.contentDescription, w.recipientName]),
  ];
  return texts.some((text) => typeof text === 'string' && text.toLowerCase().includes(q));
}

export class DispatchService {
  async list(filters: GuiaSalidaFilters) {
    const where: Prisma.GuiaSalidaWhereInput = {};
    if (filters.status && filters.status !== 'TODOS') where.status = filters.status;
    if (filters.destination && filters.destination !== 'TODOS') {
      where.destination = { contains: filters.destination, mode: 'insensitive' };
    }

    const guias = await prisma.guiaSalida.findMany({ where, orderBy: { createdAt: 'desc' } });
    if (!filters.search) return guias;
    const q = filters.search.toLowerCase();
    return guias.filter((g) => matchesSearch(g, q));
  }

  async create(input: GuiaSalidaInput) {
    const warehouses = input.warehouses ?? [];
    const guiaCode =
      input.guiaCode?.trim().toUpperCase() ||
      `GS-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    if (await prisma.guiaSalida.findUnique({ where: { guiaCode } })) {
      throw new HttpError(409, `Ya existe una Guía de Salida con el código ${guiaCode}.`);
    }

    // Validar coincidencia de tipo de envío: solo warehouses que coincidan con la modalidad de la guía
    const targetServiceType = (input.serviceType || 'Aéreo').toLowerCase();
    const guiaIsAereo = targetServiceType.includes('aér') || targetServiceType.includes('aer');
    const guiaIsMaritimo = targetServiceType.includes('marít') || targetServiceType.includes('marit');

    for (const w of warehouses) {
      const wService = String(w.serviceType || '').toLowerCase();
      const isAereo = wService.includes('aér') || wService.includes('aer');
      const isMaritimo = wService.includes('marít') || wService.includes('marit');
      const code = String(w.trackingCode || w.warehouseCode || 'WR');

      if (guiaIsAereo && !isAereo && isMaritimo) {
        throw new HttpError(400, `El Warehouse ${code} es de modalidad Marítima y no puede agregarse a una Guía de Salida Aérea.`);
      }
      if (guiaIsMaritimo && !isMaritimo && isAereo) {
        throw new HttpError(400, `El Warehouse ${code} es de modalidad Aérea y no puede agregarse a una Guía de Salida Marítima.`);
      }
    }

    const guia = await prisma.guiaSalida.create({
      data: {
        guiaCode,
        description: input.description!.trim(),
        destination: input.destination!.trim(),
        departureDate: input.departureDate!.trim(),
        serviceType: input.serviceType || 'Aéreo',
        carrier: input.carrier?.trim() || 'Consolidado General Beebox',
        notes: input.notes?.trim() || null,
        warehouses: warehouses as Prisma.InputJsonValue,
        ...computeTotals(warehouses),
      },
    });

    if (input.status === 'DESPACHADA' || input.status === 'EN_TRANSITO') {
      const codes = warehouses.map((w: any) => w.trackingCode || w.warehouseCode).filter(Boolean);
      if (codes.length > 0) {
        await prisma.shipment.updateMany({
          where: { trackingCode: { in: codes } },
          data: { currentStatus: 'En camino' },
        });
      }
    }

    return guia;
  }

  async update(idOrCode: string, input: GuiaSalidaInput) {
    const current = await this.findByIdOrCode(idOrCode);
    if (input.status !== undefined && !GUIA_STATUSES.includes(input.status)) {
      throw new HttpError(400, 'Estado de Guía de Salida inválido.');
    }

    const data: Record<string, unknown> = {};
    for (const field of UPDATABLE_FIELDS) {
      if (input[field] !== undefined) data[field] = input[field];
    }
    if (Array.isArray(input.warehouses)) {
      Object.assign(data, { warehouses: input.warehouses, ...computeTotals(input.warehouses) });
    }

    const updated = await prisma.guiaSalida.update({ where: { id: current.id }, data: data as Prisma.GuiaSalidaUpdateInput });

    // Sincronizar estado en PostgreSQL con los envíos que forman parte de la salida
    if (input.status === 'DESPACHADA' || input.status === 'EN_TRANSITO') {
      const items = Array.isArray(updated.warehouses) ? (updated.warehouses as any[]) : [];
      const codes = items.map((w: any) => w.trackingCode || w.warehouseCode).filter(Boolean);
      if (codes.length > 0) {
        await prisma.shipment.updateMany({
          where: { trackingCode: { in: codes } },
          data: { currentStatus: 'En camino' },
        });
      }
    } else if (input.status === 'ARRIBADA' || input.status === 'COMPLETADA') {
      const items = Array.isArray(updated.warehouses) ? (updated.warehouses as any[]) : [];
      const codes = items.map((w: any) => w.trackingCode || w.warehouseCode).filter(Boolean);
      if (codes.length > 0) {
        await prisma.shipment.updateMany({
          where: { trackingCode: { in: codes } },
          data: { currentStatus: 'Llegó a su destino' },
        });
      }
    }

    return updated;
  }

  async remove(idOrCode: string) {
    const current = await this.findByIdOrCode(idOrCode);
    return prisma.guiaSalida.delete({ where: { id: current.id } });
  }

  private async findByIdOrCode(idOrCode: string) {
    const guia = await prisma.guiaSalida.findFirst({ where: { OR: [{ id: idOrCode }, { guiaCode: idOrCode }] } });
    if (!guia) throw new HttpError(404, 'Guía de Salida no encontrada.');
    return guia;
  }
}
