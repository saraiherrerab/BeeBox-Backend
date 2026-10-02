import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { DispatchService, GuiaSalidaInput } from '../services/dispatch.service.js';
import { HttpError, isFilledString, sendError } from '../utils/http.js';

const dispatchService = new DispatchService();

const paramId = (req: AuthenticatedRequest) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

const queryString = (value: unknown) => (typeof value === 'string' ? value : undefined);

function parseGuia(body: any): GuiaSalidaInput {
  const { guiaCode, description, destination, departureDate, serviceType, carrier, warehouses, notes } = body ?? {};
  if (!isFilledString(description) || !isFilledString(destination) || !isFilledString(departureDate)) {
    throw new HttpError(
      400,
      'Faltan campos obligatorios para la Guía de Salida (Descripción, Destino y Fecha de Salida).'
    );
  }
  return {
    guiaCode,
    description,
    destination,
    departureDate,
    serviceType,
    carrier,
    notes,
    warehouses: Array.isArray(warehouses) ? warehouses : [],
  };
}

export async function getGuiasSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const guias = await dispatchService.list({
      status: queryString(req.query.status),
      destination: queryString(req.query.destination),
      search: queryString(req.query.search),
    });
    res.json({ success: true, guias, total: guias.length });
  } catch (error: any) {
    sendError(res, error, 'Error al obtener guías de salida.');
  }
}

export async function createGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const guia = await dispatchService.create(parseGuia(req.body));
    res.status(201).json({
      success: true,
      guia,
      message: `Guía de Salida ${guia.guiaCode} creada exitosamente con ${guia.warehousesCount} envío(s) consolidado(s).`,
    });
  } catch (error: any) {
    sendError(res, error, 'Error al crear Guía de Salida.');
  }
}

export async function updateGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const guia = await dispatchService.update(paramId(req), req.body ?? {});
    res.json({ success: true, guia, message: `Guía de Salida ${guia.guiaCode} actualizada exitosamente.` });
  } catch (error: any) {
    sendError(res, error, 'Error al actualizar Guía de Salida.');
  }
}

export async function deleteGuiaSalidaController(req: AuthenticatedRequest, res: Response) {
  try {
    const guia = await dispatchService.remove(paramId(req));
    res.json({ success: true, guia, message: 'Guía de Salida eliminada.' });
  } catch (error: any) {
    sendError(res, error, 'Error al eliminar Guía de Salida.');
  }
}
