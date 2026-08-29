import { Router } from 'express';
import { getCountries, createCountry, createCity, updateCountry, updateCity, deleteCountry, deleteCity } from '../controllers/destination.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/countries', getCountries);
router.post('/countries', authenticateToken, requireRole(['super_admin']), createCountry);
router.patch('/countries/:id', authenticateToken, requireRole(['super_admin']), updateCountry);
router.delete('/countries/:id', authenticateToken, requireRole(['super_admin']), deleteCountry);
router.post('/cities', authenticateToken, requireRole(['super_admin']), createCity);
router.patch('/cities/:id', authenticateToken, requireRole(['super_admin']), updateCity);
router.delete('/cities/:id', authenticateToken, requireRole(['super_admin']), deleteCity);

export default router;
