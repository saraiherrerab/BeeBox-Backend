import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { PrealertaService } from '../services/prealerta.service.js';

const prealertaService = new PrealertaService();

export async function getPrealertasController(req: AuthenticatedRequest, res: Response) {
  try {
    const isRoleAdmin = req.user?.role === 'admin';
    const userId = req.user?.userId;
    const search = req.query.search ? String(req.query.search) : undefined;

    const prealertas = await prealertaService.getPrealertas(userId, isRoleAdmin, search);
    res.json({ success: true, prealertas });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener prealertas.' });
  }
}

export async function createPrealertaController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const { store, trackingNumber, description, amountPaid, receiptFileName, destination } = req.body;

    if (!store || !trackingNumber || !description || amountPaid === undefined) {
      res.status(400).json({ error: true, message: 'Faltan campos obligatorios para la prealerta.' });
      return;
    }

    const prealerta = await prealertaService.createPrealerta(userId, {
      store,
      trackingNumber,
      description,
      amountPaid: Number(amountPaid),
      receiptFileName,
      destination,
    });

    res.status(201).json({ success: true, prealerta, message: 'Prealerta registrada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear prealerta.' });
  }
}

export async function linkPrealertaController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { warehouseGuide, destination } = req.body;

    if (!warehouseGuide) {
      res.status(400).json({ error: true, message: 'El número de guía de almacén es requerido.' });
      return;
    }

    const confirmed = await prealertaService.linkPrealerta(id, warehouseGuide, destination);
    res.json({ success: true, prealerta: confirmed, message: 'Prealerta confirmada exitosamente con la guía de almacén y destino.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al confirmar prealerta.' });
  }
}

export async function updateStatusController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: true, message: 'El estado es requerido.' });
      return;
    }

    const updated = await prealertaService.updateStatus(id, status);
    res.json({ success: true, prealerta: updated, message: 'Estado de prealerta actualizado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar estado de prealerta.' });
  }
}
