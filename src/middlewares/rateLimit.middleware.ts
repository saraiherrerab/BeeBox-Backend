import rateLimit from 'express-rate-limit';

// Limita intentos por dirección IP. Requiere `trust proxy` en la app para ver la IP real
// del cliente detrás de Nginx; sin eso todos compartirían la IP del proxy.
export function createIpRateLimiter(opts: { max: number; windowMs: number }) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: true,
      message: 'Demasiados intentos desde esta conexión. Espera unos minutos e intenta de nuevo.',
    },
  });
}

// 10 intentos cada 15 minutos por IP para recuperar/restablecer contraseña. En los tests se
// desactiva porque todas las peticiones salen de la misma IP.
export const passwordResetLimiter =
  process.env.NODE_ENV === 'test'
    ? (_req: unknown, _res: unknown, next: () => void) => next()
    : createIpRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
