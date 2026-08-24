import { Router } from 'express';
import { getFleet, addVehicle, updateVehicleController, deleteVehicleController } from '../controllers/fleet.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getFleet);
router.post('/', authenticateToken as any, requireRole(['admin']) as any, addVehicle);
router.put('/:id', authenticateToken as any, requireRole(['admin']) as any, updateVehicleController);
router.delete('/:id', authenticateToken as any, requireRole(['admin']) as any, deleteVehicleController);

export default router;

