import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { PickupService } from '../services/pickup.service.js';

const pickupService = new PickupService();

export async function getPickupsController(req: AuthenticatedRequest, res: Response) {
  try {
    const isRoleAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const userId = req.user?.userId;

    const pickups = await pickupService.getPickups(userId, isRoleAdmin);
    res.json({ success: true, pickups });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener recolecciones.' });
  }
}

export async function createPickupController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const {
      senderName,
      senderPhone,
      senderAddress,
      senderCity,
      boxCount,
      totalWeightKg,
      containElectronics,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      pickupDate,
      timeSlot,
    } = req.body;

    if (!senderName || !senderAddress || !recipientName || !recipientAddress || !pickupDate) {
      res.status(400).json({ error: true, message: 'Faltan campos obligatorios para el pickup.' });
      return;
    }

    const pickup = await pickupService.createPickup(userId, {
      senderName,
      senderPhone: senderPhone || '',
      senderAddress,
      senderCity: senderCity || 'Ciudad de Origen',
      boxCount: boxCount || 1,
      totalWeightKg: totalWeightKg || 1.0,
      containElectronics: Boolean(containElectronics),
      recipientName,
      recipientPhone: recipientPhone || '',
      recipientAddress,
      recipientCity: recipientCity || 'Ciudad de Destino',
      pickupDate,
      timeSlot: timeSlot || 'mañana',
    });

    res.status(201).json({ success: true, pickup, message: 'Solicitud de pickup creada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear solicitud de pickup.' });
  }
}

export async function updatePickupController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, vehicleId } = req.body;

    const updated = await pickupService.updatePickup(id, { status, vehicleId });
    res.json({ success: true, pickup: updated, message: 'Solicitud de pickup actualizada correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar pickup.' });
  }
}
