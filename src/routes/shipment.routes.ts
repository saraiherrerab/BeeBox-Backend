import { Router } from 'express';
import {
  getShipmentByCode,
  getAllShipments,
  createShipment,
  addEvent,
} from '../controllers/shipment.controller.js';

const router = Router();

router.get('/', getAllShipments);
router.get('/:trackingCode', getShipmentByCode);
router.post('/', createShipment);
router.post('/:trackingCode/events', addEvent);

export default router;
