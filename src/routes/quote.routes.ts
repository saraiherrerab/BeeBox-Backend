import { Router } from 'express';
import { calculateQuote } from '../controllers/quote.controller.js';

const router = Router();

router.post('/calculate', calculateQuote);

export default router;
