import type { Request, Response } from 'express';
import { sendEmail } from '../../email';
import { getSecret } from '#airo/secrets';

type ContactSubmission = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  message?: string;
};

function readSecret(name: string): string | undefined {
  const value = getSecret(name);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export default async function handler(req: Request, res: Response) {
  const body = (req.body ?? {}) as ContactSubmission;
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const city = String(body.city ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Please enter your name, email address, and project details.' });
    return;
  }
  if (name.length > 200 || email.length > 320 || phone.length > 80 || city.length > 120 || message.length > 6000) {
    res.status(400).json({ error: 'Some fields are too long. Please shorten your message and try again.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const recipient = readSecret('CONTACT_RECIPIENT_EMAIL') ?? readSecret('SHOWER_RECIPIENT_EMAIL');
  const resendKey = readSecret('RESEND_API_KEY');
  const resendFrom = readSecret('RESEND_FROM_EMAIL');
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    res.status(503).json({ error: 'Email is not set up yet. Add CONTACT_RECIPIENT_EMAIL=jwatson@modessi.ca to .env.' });
    return;
  }
  if (resendKey && !resendFrom) {
    res.status(503).json({ error: 'Add your verified sender address to RESEND_FROM_EMAIL in .env.' });
    return;
  }

  const subjectName = name.replace(/[\r\n]+/g, ' ').slice(0, 100);
  const html = `<div style="font-family:Arial,sans-serif;color:#222"><h1>New Modessi website contact request</h1><p><b>Name:</b> ${escapeHtml(name)}<br><b>Email:</b> ${escapeHtml(email)}<br><b>Phone:</b> ${escapeHtml(phone || 'Not provided')}<br><b>City:</b> ${escapeHtml(city || 'Not provided')}</p><h2>Project details</h2><p style="white-space:pre-wrap">${escapeHtml(message)}</p></div>`;
  const text = [
    'New Modessi website contact request', '',
    `Name: ${name}`, `Email: ${email}`, `Phone: ${phone || 'Not provided'}`, `City: ${city || 'Not provided'}`, '',
    'Project details:', message,
  ].join('\n');

  try {
    if (resendKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [recipient],
          reply_to: email,
          subject: `Website contact request — ${subjectName}`,
          html,
          text,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
        const detail = String(payload.message ?? payload.error ?? '').replace(/[\r\n]/g, ' ').slice(0, 180);
        console.error('contact.resend_failed', { status: response.status });
        const error = response.status === 401
          ? 'Resend rejected the API key. Check RESEND_API_KEY in .env.'
          : response.status === 403
            ? 'Resend rejected the sender. Verify RESEND_FROM_EMAIL in Resend.'
            : `Resend could not send the message${detail ? `: ${detail}` : '.'}`;
        res.status(502).json({ error });
        return;
      }
    } else {
      await sendEmail({
        to: recipient,
        replyTo: email,
        subject: `Website contact request — ${subjectName}`,
        html,
        text,
        fromName: 'Modessi Website Contact',
      });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    console.error('contact.email_failed', { reason: detail.slice(0, 160) });
    res.status(503).json({
      error: /email gateway unreachable/i.test(detail)
        ? 'Local email sending needs Resend settings. Add RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the app.'
        : 'Could not connect to the email provider. Check your email settings and try again.',
    });
  }
}
