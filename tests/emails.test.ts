import { afterEach, describe, expect, it } from 'vitest';
import { appUrl, escapeHtml } from '../src/emails/layout.js';
import { notificationEmail, passwordResetEmail } from '../src/emails/templates.js';
import { sendMail } from '../src/services/mail.service.js';

const originalAppUrl = process.env.APP_URL;
afterEach(() => {
  process.env.APP_URL = originalAppUrl;
});

describe('plantillas de correo', () => {
  it('escapeHtml neutraliza caracteres HTML', () => {
    expect(escapeHtml('<b>"x"&</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;');
  });

  it('appUrl no duplica la barra cuando APP_URL termina en /', () => {
    process.env.APP_URL = 'http://x/';
    expect(appUrl('/login')).toBe('http://x/login');
  });

  it('notificationEmail escapa el contenido y lleva la identidad de BeeBox', () => {
    const mail = notificationEmail('Ana <script>', 'Hola', 'msg');
    expect(mail.subject).toBe('BeeBox: Hola');
    expect(mail.html).toContain('Ana &lt;script&gt;');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('#F5C242');
    expect(mail.html).toContain('beebox-logo.jpg');
    expect(mail.html).toContain('/dashboard/notificaciones');
    expect(mail.text).toContain('msg');
  });

  it('passwordResetEmail incluye el enlace y el vencimiento', () => {
    const url = 'http://x/restablecer-contrasena?token=abc';
    const mail = passwordResetEmail('Ana', url);
    expect(mail.subject).toBe('Restablece tu contraseña de BeeBox');
    expect(mail.html).toContain(url);
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('1 hora');
  });
});

describe('sendMail', () => {
  it('sin SMTP_HOST no lanza', async () => {
    const original = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    await expect(sendMail({ to: 'a@b.c', subject: 's', html: '<p>h</p>', text: 't' })).resolves.toBeUndefined();
    process.env.SMTP_HOST = original;
  });
});
