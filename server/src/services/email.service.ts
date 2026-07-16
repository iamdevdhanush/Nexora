import fs from 'fs';
import { Resend } from 'resend';
import { logger } from '../lib/logger';

const FROM_ADDRESS = process.env.SMTP_FROM || 'Nexora <noreply@nexora.dev>';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || '');
  }
  return resendClient;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export interface EmailResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendCertificateEmail(
  to: string,
  participantName: string,
  pdfPath: string,
  certificateId: string,
  certificateType: string,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info(`[email] RESEND_API_KEY not set — skipping email to ${to} (dev mode)`);
    return { success: true, skipped: true };
  }

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const typeLabel = certificateType
      .toLowerCase()
      .replace(/_/g, ' ');

    const safeName = escapeHtml(participantName);
    const safeLabel = escapeHtml(typeLabel);
    const safeId = escapeHtml(certificateId);

    await getResendClient().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your ${typeLabel} certificate`,
      html: `<p>Dear ${safeName},</p>
<p>Please find your ${safeLabel} certificate attached.</p>
<p>Certificate ID: <code>${safeId}</code></p>
<p>You can verify this certificate by scanning the QR code on the PDF.</p>`,
      attachments: [
        { filename: `${certificateId}.pdf`, content: pdfBuffer },
      ],
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    return { success: false, error: message };
  }
}
