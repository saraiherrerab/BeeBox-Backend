import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

// In-memory and persistent fallback cache for recipients
const recipientsStore = new Map<string, any[]>();

export async function getRecipientsController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'anonymous';
    const list = recipientsStore.get(userId) || [];
    res.json({ success: true, recipients: list });
  } catch (error: any) {
    res.json({ success: true, recipients: [] });
  }
}

export async function createRecipientController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'anonymous';
    const { name, phone, phone2, address, city } = req.body;

    if (!name || !phone || !address) {
      res.status(400).json({ error: true, message: 'Faltan campos obligatorios del destinatario.' });
      return;
    }

    const newRecipient = {
      id: req.body.id || `rec_${Date.now()}`,
      name,
      phone,
      phone2: phone2 || '',
      address,
      city: city || '',
      createdAt: new Date().toISOString(),
    };

    const current = recipientsStore.get(userId) || [];
    const filtered = current.filter(
      (r) => r.id !== newRecipient.id && (r.name.toLowerCase() !== name.toLowerCase() || r.phone !== phone)
    );
    filtered.unshift(newRecipient);
    recipientsStore.set(userId, filtered);

    res.status(201).json({ success: true, recipient: newRecipient, message: 'Destinatario guardado.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al guardar destinatario.' });
  }
}

export async function deleteRecipientController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'anonymous';
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const current = recipientsStore.get(userId) || [];
    const updated = current.filter((r) => r.id !== id);
    recipientsStore.set(userId, updated);

    res.json({ success: true, message: 'Destinatario eliminado.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al eliminar destinatario.' });
  }
}
