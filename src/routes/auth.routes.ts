import { Router } from 'express';
import { register, login, getMe, changePassword, updateProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken as any, getMe);
router.post('/change-password', authenticateToken as any, changePassword);
router.patch('/profile', authenticateToken as any, updateProfile);

export default router;
