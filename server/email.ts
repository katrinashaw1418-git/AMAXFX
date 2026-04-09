import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

export const emailConfigured = !!(GMAIL_USER && GMAIL_PASS);

function createTransport() {
  if (!emailConfigured) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string,
  baseUrl: string
): Promise<{ sent: boolean; preview?: string }> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  if (!emailConfigured) {
    console.log(`[email] Verification URL (not sent — GMAIL not configured): ${verifyUrl}`);
    return { sent: false, preview: verifyUrl };
  }

  const transport = createTransport()!;
  await transport.sendMail({
    from: '"AMAX Global" <info@amaxglobal.com.au>',
    replyTo: "info@amaxglobal.com.au",
    to,
    subject: "Confirm your AMAX Global account",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden">
        <tr><td style="padding:32px 40px 0;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="width:36px;height:36px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center">
              <span style="font-size:20px">🪙</span>
            </div>
            <span style="font-size:22px;font-weight:700;color:#fff">AMAX Global</span>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px">
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px">Verify your email address</h1>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px">
            Hi ${firstName}, welcome to AMAX Global. Click the button below to confirm your email address and activate your account.
          </p>
          <div style="text-align:center;margin:0 0 28px">
            <a href="${verifyUrl}" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px">
              Verify my email →
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 8px">Or copy this link into your browser:</p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all;background:#0f172a;padding:10px 14px;border-radius:8px;margin:0 0 24px">${verifyUrl}</p>
          <p style="color:#64748b;font-size:12px;margin:0">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;text-align:center">
          <p style="color:#475569;font-size:11px;margin:0">
            AMAX Global Pty Ltd &nbsp;·&nbsp; ABN 54 690 827 608 &nbsp;·&nbsp; AUSTRAC Registered<br>
            Level 2, 8-12 King Street, Rockdale NSW 2216
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${firstName},\n\nVerify your AMAX Global account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nAMAX Global Pty Ltd`,
  });

  return { sent: true };
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
  baseUrl: string
): Promise<{ sent: boolean; preview?: string }> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  if (!emailConfigured) {
    console.log(`[email] Reset URL (not sent — GMAIL not configured): ${resetUrl}`);
    return { sent: false, preview: resetUrl };
  }

  const transport = createTransport()!;
  await transport.sendMail({
    from: '"AMAX Global" <info@amaxglobal.com.au>',
    replyTo: "info@amaxglobal.com.au",
    to,
    subject: "Reset your AMAX Global password",
    html: `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden">
        <tr><td style="padding:32px 40px 24px">
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px">Reset your password</h1>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px">
            Hi ${firstName}, click the button below to reset your password. This link expires in 1 hour.
          </p>
          <div style="text-align:center;margin:0 0 24px">
            <a href="${resetUrl}" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px">
              Reset password →
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;margin:0">If you didn't request a password reset, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${firstName},\n\nReset your AMAX Global password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nAMAX Global Pty Ltd`,
  });

  return { sent: true };
}
