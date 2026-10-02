import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { SavedAddressInput, SavedAddressService } from '../services/savedAddress.service.js';
import { HttpError, isFilledString, sendError } from '../utils/http.js';

const savedAddressService = new SavedAddressService();

function parseAddress(body: any): SavedAddressInput {
  const { label, address, city, contactName, contactPhone } = body ?? {};
  if (!isFilledString(address) || !isFilledString(city)) {
    throw new HttpError(400, 'La dirección y la ciudad son obligatorias.');
  }
  return { label, address, city, contactName, contactPhone };
}

const paramId = (req: AuthenticatedRequest) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

export async function getSavedAddressesController(req: AuthenticatedRequest, res: Response) {
  try {
    const addresses = await savedAddressService.list(req.user!.userId);
    res.json({ success: true, addresses });
  } catch (error: any) {
    sendError(res, error, 'Error al obtener direcciones.');
  }
}

export async function createSavedAddressController(req: AuthenticatedRequest, res: Response) {
  try {
    const savedAddress = await savedAddressService.create(req.user!.userId, parseAddress(req.body));
    res.status(201).json({ success: true, savedAddress, message: 'Dirección guardada.' });
  } catch (error: any) {
    sendError(res, error, 'Error al guardar dirección.');
  }
}

export async function updateSavedAddressController(req: AuthenticatedRequest, res: Response) {
  try {
    const savedAddress = await savedAddressService.update(paramId(req), req.user!.userId, parseAddress(req.body));
    res.json({ success: true, savedAddress, message: 'Dirección actualizada.' });
  } catch (error: any) {
    sendError(res, error, 'Error al actualizar dirección.');
  }
}

export async function deleteSavedAddressController(req: AuthenticatedRequest, res: Response) {
  try {
    await savedAddressService.remove(paramId(req), req.user!.userId);
    res.json({ success: true, message: 'Dirección eliminada.' });
  } catch (error: any) {
    sendError(res, error, 'Error al eliminar dirección.');
  }
}
