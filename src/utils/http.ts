import { Response } from 'express';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const isFilledString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function sendError(res: Response, error: any, fallbackMessage: string) {
  res.status(error?.statusCode || 500).json({ error: true, message: error?.message || fallbackMessage });
}
