import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { getRecipientsController, createRecipientController } from '../controllers/recipient.controller.js';

const recipientRouter = Router();

recipientRouter.get('/', authenticateToken, getRecipientsController);
recipientRouter.post('/', authenticateToken, createRecipientController);

export default recipientRouter;
