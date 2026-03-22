import https from 'https';

interface BrevoEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

async function sendBrevoEmail(params: BrevoEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.SMTP_FROM || 'noreply@nexora.dev';

  if (!apiKey) {
    console.warn('[Mail] BREVO_API_KEY not set — skipping email send');
    return;
  }

  const body = JSON.stringify({
    sender: { email: from, name: 'Nexora' },
    to: [{ email: params.to }],
    subject: params.subject,
    htmlContent: params.htmlContent,
    ...(params.textContent && { textContent: params.textContent }),
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Accept': 'application/json',
        },
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.info(`[Mail] Email sent to ${params.to} — status ${res.statusCode}`);
            resolve();
          } else {
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Email request timed out'));
    });

    req.on('error', (err) => {
      reject(new Error(`Email request failed: ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await sendBrevoEmail({
    to,
    subject: `${code} — Your Nexora verification code`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0A0A0A;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:36px;">
      <div style="width:32px;height:32px;background:#1A1A1A;border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:16px;font-weight:700;">N</span>
      </div>
      <span style="color:#F2F2F2;font-weight:700;font-size:16px;letter-spacing:-0.02em;">Nexora</span>
    </div>

    <!-- Card -->
    <div style="background:#111111;border:1px solid #1F1F1F;border-radius:16px;padding:36px 32px;margin-bottom:24px;">
      <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">
        Verification Code
      </p>
      <h1 style="color:#F2F2F2;font-size:48px;font-weight:800;letter-spacing:0.12em;margin:0 0 20px;font-variant-numeric:tabular-nums;">
        ${code}
      </h1>
      <p style="color:#666;font-size:14px;margin:0;line-height:1.6;">
        This code expires in <strong style="color:#A0A0A0;">10 minutes</strong>.
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <p style="color:#404040;font-size:12px;text-align:center;margin:0;line-height:1.6;">
      Nexora · Hackathon Management Platform<br>
      This is an automated email — please do not reply.
    </p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Your Nexora verification code: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  hackathonName: string,
  inviteUrl: string
): Promise<void> {
  await sendBrevoEmail({
    to,
    subject: `You've been invited to join ${hackathonName} on Nexora`,
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0A0A0A;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="background:#111111;border:1px solid #1F1F1F;border-radius:16px;padding:36px 32px;">
      <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">
        Coordinator Invite
      </p>
      <h2 style="color:#F2F2F2;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">
        ${inviterName} invited you
      </h2>
      <p style="color:#A0A0A0;font-size:14px;margin:0 0 24px;line-height:1.6;">
        You've been invited to join <strong style="color:#F2F2F2;">${hackathonName}</strong> as a coordinator on Nexora.
      </p>
      <a
        href="${inviteUrl}"
        style="display:inline-block;background:#F2F2F2;color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;"
      >
        Accept invitation →
      </a>
    </div>
  </div>
</body>
</html>
    `.trim(),
    textContent: `${inviterName} has invited you to join ${hackathonName} on Nexora.\n\nAccept your invite: ${inviteUrl}`,
  });
}
