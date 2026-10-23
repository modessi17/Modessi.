import type { Request, Response } from 'express';
import { sendEmail } from '../../email';
import { getSecret } from '#airo/secrets';

type DesignChoice = {
  id?: string;
  name?: string;
  image?: string;
  description?: string;
  finish?: string;
  category?: string;
  quantity?: number;
};

type ShowerSubmission = {
  name?: string;
  email?: string;
  phone?: string;
  selections?: Record<string, DesignChoice>;
  hardware?: DesignChoice[];
  accessories?: DesignChoice[];
  bathroomAccessories?: DesignChoice[];
  compositeImageDataUrl?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function readSecret(name: string): string | undefined {
  const value = getSecret(name);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export default async function handler(req: Request, res: Response) {
  const body = (req.body ?? {}) as ShowerSubmission;
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  if (!name || !email || !phone) {
    res.status(400).json({ error: 'Please enter your name, email address, and phone number.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const recipient = readSecret('SHOWER_RECIPIENT_EMAIL');
  const resendKey = readSecret('RESEND_API_KEY');
  const resendFrom = readSecret('RESEND_FROM_EMAIL');
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    res.status(503).json({ error: 'Email is not set up yet. Add your inbox to SHOWER_RECIPIENT_EMAIL in .env.' });
    return;
  }
  if (resendKey && !resendFrom) {
    res.status(503).json({ error: 'Add a verified sender address to RESEND_FROM_EMAIL in .env.' });
    return;
  }

  const choices = Object.entries(body.selections ?? {}).map(([group, choice]) => ({
    group,
    name: choice?.name ?? choice?.id ?? 'Selected item',
    finish: choice?.finish ?? choice?.category,
  }));
  const addGroup = (group: string, entries?: DesignChoice[]) => {
    for (const item of entries ?? []) {
      choices.push({
        group,
        name: `${item.name ?? item.id ?? 'Selected item'}${item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}`,
        finish: item.finish ?? item.category,
      });
    }
  };
  addGroup('Shower Hardware', body.hardware);
  addGroup('Shower Accessories', body.accessories);
  addGroup('Bathroom Accessories', body.bathroomAccessories);

  const rows = choices.map(({ group, name: itemName, finish }) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(group)}</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(itemName)}${finish ? ` (${escapeHtml(finish)})` : ''}</td></tr>`,
  ).join('');

  const imageMatch = typeof body.compositeImageDataUrl === 'string'
    ? /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.compositeImageDataUrl)
    : null;
  const imageBytes = imageMatch ? Buffer.from(imageMatch[2], 'base64') : null;
  const imageAttachment = imageMatch && imageBytes && imageBytes.length > 0 && imageBytes.length <= 2 * 1024 * 1024
    ? { filename: 'modessi-bathroom-selections.png', content: imageMatch[2], contentType: `image/${imageMatch[1]}` }
    : null;

  const html = `<div style="font-family:Arial,sans-serif;color:#222"><h1>New Modessi bathroom design request</h1><p><b>Name:</b> ${escapeHtml(name)}<br><b>Email:</b> ${escapeHtml(email)}<br><b>Phone:</b> ${escapeHtml(phone)}</p><h2>Selected items</h2><table style="border-collapse:collapse;width:100%">${rows || '<tr><td>No selections were included.</td></tr>'}</table>${imageAttachment ? '<p>The selected design board is attached.</p>' : ''}</div>`;
  const text = [
    'New Modessi bathroom design request', '', `Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, '',
    'Selected items:',
    ...choices.map((choice) => `- ${choice.group}: ${choice.name}${choice.finish ? ` (${choice.finish})` : ''}`),
    ...(imageAttachment ? ['', 'The selected design board is attached.'] : []),
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
          subject: `New bathroom design request — ${name}`,
          html,
          text,
          ...(imageAttachment ? { attachments: [{ filename: imageAttachment.filename, content: imageAttachment.content }] } : {}),
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
        const detail = String(payload.message ?? payload.error ?? '').replace(/[\r\n]/g, ' ').slice(0, 180);
        console.error('shower_design.resend_failed', { status: response.status });
        const error = response.status === 401
          ? 'Email provider rejected RESEND_API_KEY. Check that the key is valid.'
          : response.status === 403
            ? 'Email provider rejected the sender. Verify RESEND_FROM_EMAIL in Resend.'
            : `Email provider could not send the request${detail ? `: ${detail}` : '.'}`;
        res.status(502).json({ error });
        return;
      }
    } else {
      // Airo supplies this gateway in its own containers. For a downloaded
      // local project, configure Resend above instead of relying on localhost.
      await sendEmail({
        to: recipient,
        replyTo: email,
        subject: `New bathroom design request — ${name}`,
        html,
        text,
        fromName: 'Modessi Design Requests',
        ...(imageAttachment ? {
          attachments: [{
            filename: imageAttachment.filename,
            content: imageBytes!,
            contentType: imageAttachment.contentType,
          }],
        } : {}),
      });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    console.error('shower_design.email_failed', { reason: detail.slice(0, 160) });
    const localGateway = /email gateway unreachable/i.test(detail);
    res.status(503).json({
      error: localGateway
        ? 'Local email sending needs Resend settings. Add RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the app.'
        : 'Could not connect to the email provider. Check the email settings and try again.',
    });
  }
}
