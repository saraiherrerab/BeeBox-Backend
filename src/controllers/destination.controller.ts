import { Request, Response, NextFunction } from 'express';
import { DestinationService } from '../services/destination.service.js';

const destinationService = new DestinationService();

export async function getCountries(req: Request, res: Response, next: NextFunction) {
  try {
    const countries = await destinationService.getCountries();
    res.json(countries);
  } catch (error) {
    next(error);
  }
}

export async function createCountry(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, flagEmoji } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del país es obligatorio' });
    }
    const country = await destinationService.createCountry({ name, code, flagEmoji });
    res.status(201).json(country);
  } catch (error) {
    next(error);
  }
}

export async function createCity(req: Request, res: Response, next: NextFunction) {
  try {
    const { countryId, name } = req.body;
    if (!countryId || !name) {
      return res.status(400).json({ error: 'El ID del país y el nombre de la ciudad son obligatorios' });
    }
    const city = await destinationService.createCity({ countryId, name });
    res.status(201).json(city);
  } catch (error) {
    next(error);
  }
}

export async function updateCountry(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { name, code, flagEmoji, active } = req.body;
    const updated = await destinationService.updateCountry(id, { name, code, flagEmoji, active });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function updateCity(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { name, active } = req.body;
    const updated = await destinationService.updateCity(id, { name, active });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteCountry(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await destinationService.deleteCountry(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function deleteCity(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await destinationService.deleteCity(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
