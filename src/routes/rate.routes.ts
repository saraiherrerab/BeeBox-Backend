import { Router } from 'express';
import { getRatesController, upsertRateController } from '../controllers/rate.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getRatesController as any);
router.put('/', authenticateToken as any, requireRole(['admin']) as any, upsertRateController as any);

export default router;
