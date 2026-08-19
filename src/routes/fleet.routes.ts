import { Router } from 'express';
import { getFleet, addVehicle } from '../controllers/fleet.controller.js';

const router = Router();

router.get('/', getFleet);
router.post('/', addVehicle);

export default router;
