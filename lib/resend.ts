import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const DEFAULT_FROM =
  process.env.DEFAULT_FROM ?? `me@${process.env.MAIL_DOMAIN ?? 'hax429.me'}`;
