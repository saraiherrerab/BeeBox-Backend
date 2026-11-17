import nodemailer, { Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Los valores por defecto de nodemailer (2 y 10 min) dejan envíos colgados demasiado tiempo.
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return transporter;
}

// Nunca lanza: un correo que no sale no debe romper la operación que lo originó.
export async function sendMail(msg: MailMessage): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(`[mail] SMTP no configurado; no se envía. Para: ${msg.to} | Asunto: ${msg.subject}\n${msg.text}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
  } catch (error) {
    console.error(`[mail] Error enviando "${msg.subject}" a ${msg.to}:`, error);
  }
}
