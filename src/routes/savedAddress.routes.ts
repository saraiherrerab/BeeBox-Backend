import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getSavedAddressesController,
  createSavedAddressController,
  updateSavedAddressController,
  deleteSavedAddressController,
} from '../controllers/savedAddress.controller.js';

const savedAddressRouter = Router();

savedAddressRouter.get('/', authenticateToken, getSavedAddressesController);
savedAddressRouter.post('/', authenticateToken, createSavedAddressController);
savedAddressRouter.put('/:id', authenticateToken, updateSavedAddressController);
savedAddressRouter.delete('/:id', authenticateToken, deleteSavedAddressController);

export default savedAddressRouter;
