import { APP_NAME } from '@tt/shared';
import { env } from '../config/env';

export interface Email {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
}

/** In tests, emails are collected here instead of being sent. */
export const testOutbox: Email[] = [];

/**
 * Sends an email through Brevo's free API (300 emails a day).
 * Without Brevo settings (development), it prints the email in the terminal instead,
 * so you can still click verification and reset links.
 * Never throws: a failed email must not break sign-up.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (env.isTest) {
    testOutbox.push(email);
    return;
  }

  if (!env.emailEnabled) {
    console.log(
      `\n──── Email (not sent: Brevo is not configured) ────\nTo: ${email.to.email}\nSubject: ${email.subject}\n\n${email.text}\n───────────────────────────────────────────────────\n`,
    );
    return;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY!,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM_ADDRESS },
        to: [email.to],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Brevo refused the email (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error('Could not reach Brevo to send an email:', err);
  }
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** A simple, email-client-safe layout in the app's colours. */
function layout(heading: string, intro: string, buttonText: string, url: string, outro: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#FBF7F0;font-family:Arial,Helvetica,sans-serif;color:#1F2A37">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFDF9;border:1px solid #E6DDCD;border-radius:20px;padding:32px">
          <tr><td>
            <p style="margin:0 0 24px;font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#C8492F">${APP_NAME}</p>
            <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;line-height:1.2">${heading}</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#5B6573">${intro}</p>
            <a href="${url}" style="display:inline-block;background:#C8492F;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px">${buttonText}</a>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5B6573">${outro}</p>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#5B6573;word-break:break-all">If the button does not work, copy this link:<br>${url}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verifyEmailMessage(to: { email: string; name: string }, token: string): Email {
  const url = `${env.APP_URL}/verify-email?token=${token}`;
  const name = escapeHtml(to.name.split(' ')[0] ?? to.name);
  return {
    to,
    subject: `Confirm your email for ${APP_NAME}`,
    html: layout(
      `Welcome aboard, ${name}!`,
      'Confirm your email to secure your account and earn your first 25 XP.',
      'Confirm my email',
      url,
      'This link works for 24 hours. If you did not sign up, you can ignore this email.',
    ),
    text: `Welcome aboard, ${to.name}!\n\nConfirm your email by opening this link (valid for 24 hours):\n${url}\n\nIf you did not sign up, ignore this email.`,
  };
}

export function resetPasswordMessage(to: { email: string; name: string }, token: string): Email {
  const url = `${env.APP_URL}/reset-password?token=${token}`;
  return {
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: layout(
      'Reset your password',
      'Someone asked to reset the password for your account. If it was you, choose a new one:',
      'Choose a new password',
      url,
      'This link works for 1 hour. If you did not ask for this, ignore this email: your password stays the same.',
    ),
    text: `Reset your password by opening this link (valid for 1 hour):\n${url}\n\nIf you did not ask for this, ignore this email.`,
  };
}
