import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { RecipientInput, RecipientService } from '../services/recipient.service.js';
import { HttpError, isFilledString, sendError } from '../utils/http.js';

const recipientService = new RecipientService();

function parseRecipient(body: any): RecipientInput {
  const { name, phone, phone2, address, city } = body ?? {};
  if (!isFilledString(name) || !isFilledString(phone) || !isFilledString(address)) {
    throw new HttpError(400, 'Faltan campos obligatorios del destinatario.');
  }
  return { name, phone, phone2, address, city };
}

const paramId = (req: AuthenticatedRequest) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

export async function getRecipientsController(req: AuthenticatedRequest, res: Response) {
  try {
    const recipients = await recipientService.list(req.user!.userId);
    res.json({ success: true, recipients });
  } catch (error: any) {
    sendError(res, error, 'Error al obtener destinatarios.');
  }
}

export async function createRecipientController(req: AuthenticatedRequest, res: Response) {
  try {
    const recipient = await recipientService.create(req.user!.userId, parseRecipient(req.body));
    res.status(201).json({ success: true, recipient, message: 'Destinatario guardado.' });
  } catch (error: any) {
    sendError(res, error, 'Error al guardar destinatario.');
  }
}

export async function updateRecipientController(req: AuthenticatedRequest, res: Response) {
  try {
    const recipient = await recipientService.update(paramId(req), req.user!.userId, parseRecipient(req.body));
    res.json({ success: true, recipient, message: 'Destinatario actualizado.' });
  } catch (error: any) {
    sendError(res, error, 'Error al actualizar destinatario.');
  }
}

export async function deleteRecipientController(req: AuthenticatedRequest, res: Response) {
  try {
    await recipientService.remove(paramId(req), req.user!.userId);
    res.json({ success: true, message: 'Destinatario eliminado.' });
  } catch (error: any) {
    sendError(res, error, 'Error al eliminar destinatario.');
  }
}
