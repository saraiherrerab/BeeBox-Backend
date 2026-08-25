import { Router } from 'express';
import {
  getShipmentByCode,
  getAllShipments,
  createShipment,
  addEvent,
} from '../controllers/shipment.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getAllShipments);
router.get('/:trackingCode', getShipmentByCode);
router.post('/', authenticateToken as any, requireRole(['admin']) as any, createShipment);
router.post('/:trackingCode/events', authenticateToken as any, requireRole(['admin']) as any, addEvent);

export default router;
