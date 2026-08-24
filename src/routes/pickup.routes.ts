import { Router } from 'express';
import {
  getPickupsController,
  createPickupController,
  updatePickupController,
} from '../controllers/pickup.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getPickupsController as any);
router.post('/', authenticateToken as any, createPickupController as any);
router.patch('/:id', authenticateToken as any, requireRole(['admin']) as any, updatePickupController as any);

export default router;
