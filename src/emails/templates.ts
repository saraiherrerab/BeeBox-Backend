import { appUrl, escapeHtml, renderLayout } from './layout.js';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const FOOTER_TEXT = '\n\n—\nBeeBox Empresa de Transporte\nEste es un correo automático, no respondas a este mensaje.';

export function passwordResetEmail(name: string, resetUrl: string): EmailContent {
  const title = 'Restablece tu contraseña';
  return {
    subject: 'Restablece tu contraseña de BeeBox',
    html: renderLayout({
      title,
      bodyHtml: `<p style="margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta BeeBox. Haz clic en el botón para crear una nueva.</p>
        <p style="margin:0 0 12px;">El enlace vence en <strong>30 minutos</strong> y solo puede usarse una vez.</p>
        <p style="margin:0;font-size:13px;color:#64748B;">Si no lo pediste, ignora este correo: tu contraseña no cambiará.</p>
        <p style="margin:16px 0 0;font-size:12px;color:#64748B;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador:<br>${escapeHtml(resetUrl)}</p>`,
      button: { label: 'Restablecer contraseña', url: resetUrl },
    }),
    text: `Hola ${name},\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta BeeBox.\nAbre este enlace para crear una nueva (vence en 30 minutos y solo puede usarse una vez):\n${resetUrl}\n\nSi no lo pediste, ignora este correo: tu contraseña no cambiará.${FOOTER_TEXT}`,
  };
}

export function passwordChangedEmail(name: string): EmailContent {
  const loginUrl = appUrl('/login');
  return {
    subject: 'Tu contraseña de BeeBox fue cambiada',
    html: renderLayout({
      title: 'Tu contraseña fue cambiada',
      bodyHtml: `<p style="margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px;">La contraseña de tu cuenta BeeBox se cambió correctamente. Ya puedes iniciar sesión con la nueva.</p>
        <p style="margin:0;font-size:13px;color:#64748B;">Si no fuiste tú, contacta de inmediato a soporte de BeeBox.</p>`,
      button: { label: 'Iniciar sesión', url: loginUrl },
    }),
    text: `Hola ${name},\n\nLa contraseña de tu cuenta BeeBox se cambió correctamente. Ya puedes iniciar sesión: ${loginUrl}\n\nSi no fuiste tú, contacta de inmediato a soporte de BeeBox.${FOOTER_TEXT}`,
  };
}

export function notificationEmail(name: string, title: string, message: string): EmailContent {
  const url = appUrl('/dashboard/notificaciones');
  return {
    subject: `BeeBox: ${title}`,
    html: renderLayout({
      title,
      bodyHtml: `<p style="margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
        <p style="margin:0;white-space:pre-line;">${escapeHtml(message)}</p>`,
      button: { label: 'Ver en BeeBox', url },
    }),
    text: `Hola ${name},\n\n${title}\n${message}\n\nVer en BeeBox: ${url}${FOOTER_TEXT}`,
  };
}
