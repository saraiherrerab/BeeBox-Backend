const BRAND_YELLOW = '#F5C242';
const BRAND_DARK = '#0F172A';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function appUrl(path: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

// Los clientes de correo solo respetan tablas y estilos en línea.
export function renderLayout(opts: {
  title: string;
  bodyHtml: string;
  button?: { label: string; url: string };
}): string {
  const button = opts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr><td style="background:${BRAND_YELLOW};border-radius:12px;">
          <a href="${escapeHtml(opts.button.url)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${BRAND_DARK};text-decoration:none;letter-spacing:0.5px;">${escapeHtml(opts.button.label)}</a>
        </td></tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="background:${BRAND_DARK};padding:24px;">
          <img src="${appUrl('/beebox-logo.jpg')}" alt="BeeBox" width="140" style="display:block;border:0;max-width:140px;height:auto;">
        </td></tr>
        <tr><td style="background:${BRAND_YELLOW};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 24px;font-family:Arial,Helvetica,sans-serif;color:${BRAND_DARK};">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(opts.title)}</h1>
          <div style="font-size:15px;line-height:1.6;color:#334155;">${opts.bodyHtml}</div>
          ${button}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748B;text-align:center;">
          <strong style="color:${BRAND_DARK};">BeeBox Empresa de Transporte</strong><br>
          Este es un correo automático, no respondas a este mensaje.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
