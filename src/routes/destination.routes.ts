import { Router } from 'express';
import { getCountries, createCountry, createCity, updateCountry, updateCity, deleteCountry, deleteCity } from '../controllers/destination.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/countries', getCountries);
router.post('/countries', authenticateToken, requireRole(['admin']), createCountry);
router.patch('/countries/:id', authenticateToken, requireRole(['admin']), updateCountry);
router.delete('/countries/:id', authenticateToken, requireRole(['admin']), deleteCountry);
router.post('/cities', authenticateToken, requireRole(['admin']), createCity);
router.patch('/cities/:id', authenticateToken, requireRole(['admin']), updateCity);
router.delete('/cities/:id', authenticateToken, requireRole(['admin']), deleteCity);

export default router;
