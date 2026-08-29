import { Router } from 'express';
import { getRatesController, upsertRateController, deleteCustomRatesController } from '../controllers/rate.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getRatesController as any);
router.put('/', authenticateToken as any, requireRole(['super_admin']) as any, upsertRateController as any);
router.delete('/', authenticateToken as any, requireRole(['super_admin']) as any, deleteCustomRatesController as any);

export default router;
