import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { warehousesStore, WarehouseItem } from './warehouse.controller.js';

export interface GuiaSalidaItem {
  id: string;
  guiaCode: string;
  description: string;
  destination: string;
  departureDate: string;
  serviceType: 'Aéreo' | 'Marítimo' | 'Terrestre';
  carrier?: string;
  status: 'EN_PREPARACION' | 'DESPACHADA' | 'EN_TRANSITO' | 'ARRIBADA' | 'COMPLETADA';
  warehousesCount: number; // NRO de Warehouse
  warehouses: WarehouseItem[]; // listado de ellos
  totalPieces: number;
  totalWeightKg: number;
  totalDeclaredValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store initialized with an existing consolidated dispatch for demonstration
export const guiasSalidaStore: GuiaSalidaItem[] = [
  {
    id: 'gs_101',
    guiaCode: 'GS-2026-001',
    description: 'Despacho Aéreo Consolidado - Destino Caracas Maiquetía',
    destination: 'Caracas, Venezuela',
    departureDate: new Date().toISOString().split('T')[0],
    serviceType: 'Aéreo',
    carrier: 'Laser Cargo - Vuelo LC-402',
    status: 'EN_PREPARACION',
    warehousesCount: 2,
    warehouses: [
      {
        id: 'wh_sample_1',
        warehouseCode: 'WR-89190',
        clientName: 'Carlos Zambrano',
        clientSuite: 'BBX-1090',
        recipientName: 'Sofía Zambrano',
        recipientPhone: '+58 414 112 3456',
        recipientAddress: 'Av. Libertador, Edif. La Línea, PH',
        destination: 'Caracas, Venezuela',
        serviceType: 'Aéreo Express',
        pieces: 2,
        weightKg: 5.4,
        declaredValue: 320,
        contentDescription: 'Calzado deportivo y ropa casual',
        containElectronics: false,
        status: 'EN_GUIA_SALIDA',
        assignedGuiaCode: 'GS-2026-001',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'wh_sample_2',
        warehouseCode: 'WR-89191',
        clientName: 'Daniela Morales',
        clientSuite: 'BBX-2144',
        recipientName: 'Alejandro Morales',
        recipientPhone: '+58 412 990 7654',
        recipientAddress: 'Altamira Sur, Res. Avila Sol, Apt 4-B',
        destination: 'Caracas, Venezuela',
        serviceType: 'Aéreo Express',
        pieces: 1,
        weightKg: 3.1,
        declaredValue: 580,
        contentDescription: 'Consola PlayStation 5 y mando dual',
        containElectronics: true,
        electronicsDetails: '1 Consola PlayStation 5 Digital',
        status: 'EN_GUIA_SALIDA',
        assignedGuiaCode: 'GS-2026-001',
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      },
    ],
    totalPieces: 3,
    totalWeightKg: 8.5,
    totalDeclaredValue: 900,
    notes: 'Salida coordinada con precintos de seguridad aeroportuaria.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getGuiasSalidaController(req: Request, res: Response) {
  try {
    const { status, destination, search } = req.query;

    let result = [...guiasSalidaStore];

    if (status && typeof status === 'string' && status !== 'TODOS') {
      result = result.filter((g) => g.status === status);
    }

    if (destination && typeof destination === 'string' && destination !== 'TODOS') {
      result = result.filter((g) => g.destination.toLowerCase().includes(destination.toLowerCase()));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.guiaCode.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.destination.toLowerCase().includes(q) ||
          (g.carrier && g.carrier.toLowerCase().includes(q)) ||
          g.warehouses.some(
            (w) =>
              w.warehouseCode.toLowerCase().includes(q) ||
              w.contentDescription.toLowerCase().includes(q) ||
              w.recipientName.toLowerCase().includes(q)
          )
      );
    }

    res.json({ success: true, guias: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener guías de salida.' });
  }
}

export async function createGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      guiaCode,
      description,
      destination,
      departureDate,
      serviceType,
      carrier,
      warehouseIds, // array of warehouse IDs or codes
      warehouses: directWarehouses, // optional direct array of warehouse objects
      notes,
    } = req.body;

    if (!description || !destination || !departureDate) {
      res.status(400).json({
        error: true,
        message: 'Faltan campos obligatorios para la Guía de Salida (Descripción, Destino y Fecha de Salida).',
      });
      return;
    }

    const generatedCode =
      guiaCode && guiaCode.trim()
        ? guiaCode.trim().toUpperCase()
        : `GS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // Resolve included warehouses
    let selectedWarehouses: WarehouseItem[] = [];

    if (Array.isArray(directWarehouses) && directWarehouses.length > 0) {
      selectedWarehouses = directWarehouses;
    } else if (Array.isArray(warehouseIds) && warehouseIds.length > 0) {
      selectedWarehouses = warehousesStore.filter((w) => warehouseIds.includes(w.id) || warehouseIds.includes(w.warehouseCode));
    }

    // Mark matched warehouses in the store as EN_GUIA_SALIDA
    for (const w of selectedWarehouses) {
      const storeItem = warehousesStore.find((sw) => sw.id === w.id || sw.warehouseCode === w.warehouseCode);
      if (storeItem) {
        storeItem.status = 'EN_GUIA_SALIDA';
        storeItem.assignedGuiaCode = generatedCode;
      }
      w.status = 'EN_GUIA_SALIDA';
      w.assignedGuiaCode = generatedCode;
    }

    const totalPieces = selectedWarehouses.reduce((acc, w) => acc + (w.pieces || 1), 0);
    const totalWeightKg = Number(
      selectedWarehouses.reduce((acc, w) => acc + (typeof w.weightKg === 'number' ? w.weightKg : 0), 0).toFixed(2)
    );
    const totalDeclaredValue = Number(
      selectedWarehouses.reduce((acc, w) => acc + (typeof w.declaredValue === 'number' ? w.declaredValue : 0), 0).toFixed(2)
    );

    const newGuia: GuiaSalidaItem = {
      id: req.body.id || `gs_${Date.now()}`,
      guiaCode: generatedCode,
      description: description.trim(),
      destination: destination.trim(),
      departureDate: departureDate.trim(),
      serviceType: serviceType || 'Aéreo',
      carrier: carrier ? carrier.trim() : 'Consolidado General Beebox',
      status: 'EN_PREPARACION',
      warehousesCount: selectedWarehouses.length,
      warehouses: selectedWarehouses,
      totalPieces,
      totalWeightKg,
      totalDeclaredValue,
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    guiasSalidaStore.unshift(newGuia);

    res.status(201).json({
      success: true,
      guia: newGuia,
      message: `Guía de Salida ${newGuia.guiaCode} creada exitosamente con ${selectedWarehouses.length} Warehouse(s).`,
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear Guía de Salida.' });
  }
}

export async function updateGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idx = guiasSalidaStore.findIndex((g) => g.id === id || g.guiaCode === id);

    if (idx === -1) {
      res.status(404).json({ error: true, message: 'Guía de Salida no encontrada.' });
      return;
    }

    const current = guiasSalidaStore[idx];
    const { status, warehouses, warehouseIds, ...rest } = req.body;

    let updatedWarehouses = current.warehouses;

    if (Array.isArray(warehouses)) {
      updatedWarehouses = warehouses;
    } else if (Array.isArray(warehouseIds)) {
      updatedWarehouses = warehousesStore.filter((w) => warehouseIds.includes(w.id) || warehouseIds.includes(w.warehouseCode));
    }

    const newStatus = status || current.status;

    // Propagate status change to attached warehouses
    if (newStatus === 'DESPACHADA' || newStatus === 'EN_TRANSITO') {
      for (const w of updatedWarehouses) {
        w.status = 'DESPACHADO';
        const inStore = warehousesStore.find((sw) => sw.id === w.id || sw.warehouseCode === w.warehouseCode);
        if (inStore) inStore.status = 'DESPACHADO';
      }
    } else if (newStatus === 'ARRIBADA' || newStatus === 'COMPLETADA') {
      for (const w of updatedWarehouses) {
        w.status = 'ENTREGADO';
        const inStore = warehousesStore.find((sw) => sw.id === w.id || sw.warehouseCode === w.warehouseCode);
        if (inStore) inStore.status = 'ENTREGADO';
      }
    }

    const totalPieces = updatedWarehouses.reduce((acc, w) => acc + (w.pieces || 1), 0);
    const totalWeightKg = Number(
      updatedWarehouses.reduce((acc, w) => acc + (typeof w.weightKg === 'number' ? w.weightKg : 0), 0).toFixed(2)
    );
    const totalDeclaredValue = Number(
      updatedWarehouses.reduce((acc, w) => acc + (typeof w.declaredValue === 'number' ? w.declaredValue : 0), 0).toFixed(2)
    );

    const updated: GuiaSalidaItem = {
      ...current,
      ...rest,
      status: newStatus,
      warehouses: updatedWarehouses,
      warehousesCount: updatedWarehouses.length,
      totalPieces,
      totalWeightKg,
      totalDeclaredValue,
      updatedAt: new Date().toISOString(),
    };

    guiasSalidaStore[idx] = updated;

    res.json({
      success: true,
      guia: updated,
      message: `Guía de Salida ${updated.guiaCode} actualizada exitosamente.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar Guía de Salida.' });
  }
}

export async function deleteGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idx = guiasSalidaStore.findIndex((g) => g.id === id || g.guiaCode === id);

    if (idx === -1) {
      res.status(404).json({ error: true, message: 'Guía de Salida no encontrada.' });
      return;
    }

    const removed = guiasSalidaStore.splice(idx, 1)[0];

    // Release attached warehouses back to DISPONIBLE
    for (const w of removed.warehouses) {
      const inStore = warehousesStore.find((sw) => sw.id === w.id || sw.warehouseCode === w.warehouseCode);
      if (inStore && inStore.assignedGuiaCode === removed.guiaCode) {
        inStore.status = 'DISPONIBLE';
        inStore.assignedGuiaCode = null;
      }
    }

    res.json({ success: true, guia: removed, message: 'Guía de Salida eliminada y Warehouses liberados.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al eliminar Guía de Salida.' });
  }
}
