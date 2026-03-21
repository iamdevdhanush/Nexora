import nodemailer from 'nodemailer';
import { logger } from './logger';

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('[Mail] SMTP not configured — emails skipped');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

export const sendOtpEmail = async (to: string, code: string): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) { logger.info(`[Mail] DEV skip OTP for ${to}: ${code}`); return; }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@nexora.dev',
      to,
      subject: 'Your Nexora OTP Code',
      html: `<h2>Your OTP Code</h2><p>Your verification code is:</p><h1 style="letter-spacing:0.25em;font-size:36px;">${code}</h1><p>This code expires in 10 minutes.</p>`,
    });
    logger.info(`[Mail] OTP sent to ${to}`);
  } catch (err) { logger.error(`[Mail] Failed to send to ${to}: ${err}`); throw err; }
};
