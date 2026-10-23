import type { Request, Response } from 'express';
import { getSecret } from '#airo/secrets';

type RenderRequest = {
  prompt?: string;
  selectionBoard?: string;
  roomPhoto?: string | null;
};

function decodeDataUrl(value: string, field: string): Blob {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error(`${field} must be a PNG, JPEG, or WebP image.`);
  const mime = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error(`${field} is too large.`);
  return new Blob([Uint8Array.from(bytes)], { type: mime });
}

export default async function handler(req: Request, res: Response) {
  const apiKey = getSecret('OPENAI_API_KEY');
  if (!apiKey) {
    res.status(503).json({ error: 'AI image rendering is not configured. Add OPENAI_API_KEY to the server environment.' });
    return;
  }

  const body = req.body as RenderRequest;
  if (!body.prompt || !body.selectionBoard) {
    res.status(400).json({ error: 'A selection list and product image board are required.' });
    return;
  }

  try {
    const references = [decodeDataUrl(body.selectionBoard, 'Selection board')];
    if (body.roomPhoto) references.unshift(decodeDataUrl(body.roomPhoto, 'Bathroom photo'));

    const form = new FormData();
    form.set('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5');
    form.set('prompt', body.prompt.slice(0, 12000));
    form.set('size', '1536x1024');
    form.set('quality', 'medium');
    references.forEach((blob, index) => form.append('image[]', blob, `reference-${index + 1}.jpg`));

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await response.json() as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
    const encoded = payload.data?.[0]?.b64_json;
    if (!response.ok || !encoded) {
      console.error('bathroom_render.openai_failed', { status: response.status });
      res.status(502).json({ error: 'The bathroom picture could not be generated. Please try again.' });
      return;
    }
    res.set('Cache-Control', 'no-store').json({ image: `data:image/png;base64,${encoded}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Render request failed.';
    res.status(400).json({ error: message });
  }
}
