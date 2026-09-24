import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export interface WarehouseItem {
  id: string;
  warehouseCode: string;
  clientName: string;
  clientSuite?: string;
  clientPhone?: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destination: string;
  serviceType: 'Aéreo Express' | 'Marítimo Estándar';
  pieces: number;
  weightKg: number;
  dimensions?: string;
  declaredValue: number;
  contentDescription: string;
  containElectronics: boolean;
  electronicsDetails?: string;
  status: 'DISPONIBLE' | 'EN_GUIA_SALIDA' | 'DESPACHADO' | 'ENTREGADO';
  assignedGuiaCode?: string | null;
  trackingOrigin?: string;
  notes?: string;
  createdAt: string;
}

// In-memory persistent storage initialized with realistic initial data
export const warehousesStore: WarehouseItem[] = [
  {
    id: 'wh_1001',
    warehouseCode: 'WR-89210',
    clientName: 'Roberto Mendoza',
    clientSuite: 'BBX-1042',
    clientPhone: '+1 918 555 0192',
    recipientName: 'Mariana Mendoza',
    recipientPhone: '+58 412 889 1234',
    recipientAddress: 'Av. Francisco de Miranda, Edif. Parque Cristal, Piso 8, Chacao',
    destination: 'Caracas, Venezuela',
    serviceType: 'Aéreo Express',
    pieces: 2,
    weightKg: 4.8,
    dimensions: '35x25x20 cm',
    declaredValue: 240,
    contentDescription: 'Prendas de vestir deportivas y calzado Nike',
    containElectronics: false,
    status: 'DISPONIBLE',
    assignedGuiaCode: null,
    trackingOrigin: '1Z99999999281726',
    notes: 'Revisado y pesado en almacén de Broken Arrow, OK',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'wh_1002',
    warehouseCode: 'WR-89211',
    clientName: 'Elena Villarreal',
    clientSuite: 'BBX-2089',
    clientPhone: '+1 918 555 0831',
    recipientName: 'Carlos Villarreal',
    recipientPhone: '+58 424 771 9043',
    recipientAddress: 'Urb. Las Mercedes, Calle París, Qta. Los Robles',
    destination: 'Caracas, Venezuela',
    serviceType: 'Aéreo Express',
    pieces: 1,
    weightKg: 2.2,
    dimensions: '30x20x15 cm',
    declaredValue: 750,
    contentDescription: 'Laptop HP Pavilion 15 pulg y accesorios',
    containElectronics: true,
    electronicsDetails: '1 Laptop HP Pavilion 15 pulg Core i7',
    status: 'DISPONIBLE',
    assignedGuiaCode: null,
    trackingOrigin: 'TBA309182391000',
    notes: 'Caja con precinto de seguridad e inspección técnica',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'wh_1003',
    warehouseCode: 'WR-89212',
    clientName: 'Andrés Gil',
    clientSuite: 'BBX-3150',
    clientPhone: '+1 918 555 0411',
    recipientName: 'Beatriz Gil',
    recipientPhone: '+58 414 332 5590',
    recipientAddress: 'Av. Bolívar Norte, Sector La Alegría, Res. Araguaney',
    destination: 'Valencia, Venezuela',
    serviceType: 'Marítimo Estándar',
    pieces: 3,
    weightKg: 18.5,
    dimensions: '50x40x40 cm',
    declaredValue: 410,
    contentDescription: 'Repuestos automotrices, herramientas mecánicas y filtros',
    containElectronics: false,
    status: 'DISPONIBLE',
    assignedGuiaCode: null,
    trackingOrigin: 'FEDEX-901829102',
    notes: 'Bultos agrupados sobre palet estándar',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export async function getWarehousesController(req: Request, res: Response) {
  try {
    const { status, destination, search } = req.query;

    let result = [...warehousesStore];

    if (status && typeof status === 'string' && status !== 'TODOS') {
      result = result.filter((w) => w.status === status);
    }

    if (destination && typeof destination === 'string' && destination !== 'TODOS') {
      result = result.filter((w) => w.destination.toLowerCase().includes(destination.toLowerCase()));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.warehouseCode.toLowerCase().includes(q) ||
          w.clientName.toLowerCase().includes(q) ||
          w.recipientName.toLowerCase().includes(q) ||
          w.contentDescription.toLowerCase().includes(q) ||
          (w.trackingOrigin && w.trackingOrigin.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, warehouses: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener almacén.' });
  }
}

export async function createWarehouseController(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      warehouseCode,
      clientName,
      clientSuite,
      clientPhone,
      recipientName,
      recipientPhone,
      recipientAddress,
      destination,
      serviceType,
      pieces,
      weightKg,
      dimensions,
      declaredValue,
      contentDescription,
      containElectronics,
      electronicsDetails,
      trackingOrigin,
      notes,
    } = req.body;

    if (!clientName || !recipientName || !destination || !contentDescription) {
      res.status(400).json({
        error: true,
        message: 'Faltan campos obligatorios para generar el Warehouse (Cliente, Destinatario, Destino y Descripción).',
      });
      return;
    }

    const generatedCode =
      warehouseCode && warehouseCode.trim()
        ? warehouseCode.trim().toUpperCase()
        : `WR-${Math.floor(10000 + Math.random() * 90000)}`;

    const newWarehouse: WarehouseItem = {
      id: req.body.id || `wh_${Date.now()}`,
      warehouseCode: generatedCode,
      clientName: clientName.trim(),
      clientSuite: clientSuite ? clientSuite.trim() : undefined,
      clientPhone: clientPhone ? clientPhone.trim() : undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone ? recipientPhone.trim() : '',
      recipientAddress: recipientAddress ? recipientAddress.trim() : '',
      destination: destination.trim(),
      serviceType: serviceType || 'Aéreo Express',
      pieces: Number(pieces) > 0 ? Number(pieces) : 1,
      weightKg: Number(weightKg) > 0 ? Number(weightKg) : 1.0,
      dimensions: dimensions ? dimensions.trim() : 'Estándar',
      declaredValue: Number(declaredValue) >= 0 ? Number(declaredValue) : 0,
      contentDescription: contentDescription.trim(),
      containElectronics: Boolean(containElectronics),
      electronicsDetails: containElectronics ? electronicsDetails?.trim() : undefined,
      status: 'DISPONIBLE',
      assignedGuiaCode: null,
      trackingOrigin: trackingOrigin ? trackingOrigin.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    warehousesStore.unshift(newWarehouse);

    res.status(201).json({
      success: true,
      warehouse: newWarehouse,
      message: `Warehouse ${newWarehouse.warehouseCode} creado exitosamente.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear Warehouse.' });
  }
}

export async function updateWarehouseController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idx = warehousesStore.findIndex((w) => w.id === id || w.warehouseCode === id);

    if (idx === -1) {
      res.status(404).json({ error: true, message: 'Warehouse no encontrado.' });
      return;
    }

    const current = warehousesStore[idx];
    const updated: WarehouseItem = {
      ...current,
      ...req.body,
      id: current.id, // preserve id
      warehouseCode: req.body.warehouseCode || current.warehouseCode,
    };

    warehousesStore[idx] = updated;

    res.json({ success: true, warehouse: updated, message: 'Warehouse actualizado exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar Warehouse.' });
  }
}

export async function deleteWarehouseController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idx = warehousesStore.findIndex((w) => w.id === id || w.warehouseCode === id);

    if (idx === -1) {
      res.status(404).json({ error: true, message: 'Warehouse no encontrado.' });
      return;
    }

    const removed = warehousesStore.splice(idx, 1)[0];
    res.json({ success: true, warehouse: removed, message: 'Warehouse eliminado exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al eliminar Warehouse.' });
  }
}
