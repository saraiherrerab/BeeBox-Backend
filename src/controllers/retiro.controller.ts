import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { RetiroService } from '../services/retiro.service.js';

const retiroService = new RetiroService();

export async function getRetirosController(req: AuthenticatedRequest, res: Response) {
  try {
    const isRoleAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const userId = req.user?.userId;

    const retiros = await retiroService.getRetiros(userId, isRoleAdmin);
    res.json({ success: true, retiros });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener retiros.' });
  }
}

export async function createRetiroController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const { shipmentId, branchName, scheduledDate, scheduledTime } = req.body;

    if (!shipmentId || !branchName || !scheduledDate || !scheduledTime) {
      res.status(400).json({ error: true, message: 'Faltan campos obligatorios para programar el retiro.' });
      return;
    }

    const retiro = await retiroService.createRetiro(userId, {
      shipmentId,
      branchName,
      scheduledDate,
      scheduledTime,
    });

    res.status(201).json({ success: true, retiro, message: 'Retiro programado exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al programar retiro.' });
  }
}

export async function verifyRetiroPINController(req: AuthenticatedRequest, res: Response) {
  try {
    const { pinCode } = req.body;

    if (!pinCode) {
      res.status(400).json({ error: true, message: 'El código PIN es requerido para la verificación.' });
      return;
    }

    const verified = await retiroService.verifyRetiroPIN(String(pinCode).trim());
    res.json({ success: true, retiro: verified, message: 'PIN verificado correctamente. Paquete entregado.' });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message || 'Error al verificar PIN.' });
  }
}
