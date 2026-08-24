import { Request, Response } from 'express';
import { CMSService } from '../services/cms.service.js';

const cmsService = new CMSService();

export async function getCMSContentController(req: Request, res: Response) {
  try {
    const items = await cmsService.getCMSContent();
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener contenidos CMS.' });
  }
}

export async function createCMSContentController(req: Request, res: Response) {
  try {
    const { type, title, description, imageUrl, linkUrl } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: true, message: 'El título y la descripción son obligatorios.' });
      return;
    }

    const item = await cmsService.createCMSContent({ type, title, description, imageUrl, linkUrl });
    res.status(201).json({ success: true, item, message: 'Contenido de CMS creado exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear contenido CMS.' });
  }
}

export async function deleteCMSContentController(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await cmsService.deleteCMSContent(id);
    res.json({ success: true, message: 'Contenido deshabilitado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al eliminar contenido CMS.' });
  }
}
