import type { Request, Response } from "express";
import { getSecret } from "#airo/secrets";

interface PreviewSelection {
  id?: string;
  label?: string;
  name?: string;
  image?: string;
}

interface PreviewRequest {
  roomImageDataUrl?: string;
  baseImagePath?: string;
  selections?: PreviewSelection[];
}

interface ImageFile {
  bytes: Buffer;
  contentType: string;
  filename: string;
  label: string;
}

const MAX_REF_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 24 * 1024 * 1024;
const MAX_REFERENCE_IMAGES = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
// Automatic redraws can follow several quick selection changes. Keep a limit
// for abuse protection while allowing a normal design session to update.
const RATE_LIMIT = 15;
const renderAttempts = new Map<string, { startedAt: number; count: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const previous = renderAttempts.get(ip);
  if (!previous || now - previous.startedAt >= RATE_WINDOW_MS) {
    renderAttempts.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  previous.count += 1;
  return previous.count <= RATE_LIMIT;
}

function decodeDataUrl(value: string): ImageFile | null {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_REF_BYTES) return null;
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return { bytes, contentType: match[1], filename: `uploaded-bathroom.${extension}`, label: "Uploaded bathroom photo" };
}

function safeSiteBase(req: Request): URL {
  const configured = getSecret("PUBLIC_BASE_URL");
  if (typeof configured === "string" && configured.trim()) return new URL(configured);
  const local = process.env.NODE_ENV !== "production";
  if (local) return new URL(`${req.protocol}://${req.get("host")}`);
  return new URL("https://modessi.ca");
}

function allowedImageUrl(source: string, req: Request): URL | null {
  if (!source || source.length > 2000) return null;
  try {
    const base = safeSiteBase(req);
    const url = new URL(source, base);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    const sameSite = url.hostname === base.hostname;
    const moenImageHost = url.hostname === "moen.widen.net";
    if (!sameSite && !moenImageHost) return null;
    if (sameSite && !url.pathname.startsWith("/assets/") && !url.pathname.startsWith("/airo-assets/")) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchImage(source: string, label: string, req: Request): Promise<ImageFile | null> {
  const url = allowedImageUrl(source, req);
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_REF_BYTES) return null;
    const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    return { bytes, contentType, filename: `selection-${extension}`, label };
  } catch {
    return null;
  }
}

function sanitizeText(value: unknown, maxLength = 140): string {
  return typeof value === "string" ? value.replace(/[<>\r\n]/g, " ").trim().slice(0, maxLength) : "";
}

export default async function handler(req: Request, res: Response) {
  const key = getSecret("OPENAI_API_KEY");
  if (typeof key !== "string" || !key.trim()) {
    res.status(503).json({ error: "AI preview is not configured. Add OPENAI_API_KEY to the server environment." });
    return;
  }

  if (!checkRateLimit(req.ip || "unknown")) {
    res.status(429).json({ error: "Please wait a few minutes before generating another preview." });
    return;
  }

  const body = (req.body ?? {}) as PreviewRequest;
  const chosen = Array.isArray(body.selections) ? body.selections.slice(0, 24) : [];
  const roomImage = typeof body.roomImageDataUrl === "string" ? decodeDataUrl(body.roomImageDataUrl) : null;
  if (body.roomImageDataUrl && !roomImage) {
    res.status(400).json({ error: "The bathroom photo must be a PNG, JPG, or WebP image under 8 MB after resizing." });
    return;
  }

  const baseReference = roomImage ?? await fetchImage(
    sanitizeText(body.baseImagePath, 2000) || "/assets/uploads/realistic-bathroom-base.png",
    "Standard bathroom reference",
    req,
  );
  if (!baseReference) {
    res.status(500).json({ error: "Could not load the standard bathroom image. Check PUBLIC_BASE_URL and try again." });
    return;
  }

  const promptLines = chosen
    .map((item) => {
      const label = sanitizeText(item.label, 48);
      const name = sanitizeText(item.name, 120);
      return label && name ? `- ${label}: ${name}` : "";
    })
    .filter(Boolean);
  if (promptLines.length === 0) {
    res.status(400).json({ error: "Choose bathroom items before creating the image." });
    return;
  }

  const referenceImages = await Promise.all(
    chosen
      .filter((item) => typeof item.image === "string" && item.image.trim())
      .slice(0, MAX_REFERENCE_IMAGES)
      .map((item) => fetchImage(item.image!, `${sanitizeText(item.label, 48)}: ${sanitizeText(item.name, 120)}`, req)),
  );
  const usableReferences = referenceImages.filter((image): image is ImageFile => image !== null);
  const allImages = [baseReference, ...usableReferences];
  const totalBytes = allImages.reduce((sum, image) => sum + image.bytes.length, 0);
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    res.status(413).json({ error: "The selected product images are too large. Please try again with fewer selections." });
    return;
  }

  const referenceMap = usableReferences.map((image, index) => `Image ${index + 2} shows the selected ${image.label}.`).join("\n");
  const prompt = [
    "Create one photorealistic, finished bathroom renovation image for a contractor's customer preview.",
    "Image 1 is the bathroom scene. Preserve its room layout, camera viewpoint, proportions, and natural perspective. If it is an uploaded customer photo, keep the existing room recognizable and edit only the bathroom finishes and fixtures needed for this design.",
    "Use each following reference image for the selected product listed in its matching description. Integrate the products into the room at realistic scale, installed in the right place, with matching perspective, contact shadows, reflections, and lighting. Do not paste product photos or their backgrounds into the scene.",
    referenceMap,
    "Apply the selected shower wall tile to the shower walls, selected floor finish to the bathroom floor, selected base or tub to the shower, selected metal finish to the taps and shower hardware, selected door style to the enclosure, and selected vanity, mirror, shelves, bench, and grab bars where applicable.",
    "Selections to show:",
    ...promptLines,
    "The output must be a single wide, complete bathroom photograph, not a collage, product board, diagram, or screenshot. No text, labels, logos, or people. Keep all chosen objects inside the room and make the result look like professional interior photography.",
  ].join("\n\n");

  const form = new FormData();
  form.append("model", "gpt-image-2.5-sunburst");
  form.append("prompt", prompt);
  form.append("size", "1536x1024");
  form.append("quality", "medium");
  form.append("output_format", "jpeg");
  for (const image of allImages) {
    const imageCopy = new Uint8Array(image.bytes.byteLength);
    imageCopy.set(image.bytes);
    form.append("image[]", new Blob([imageCopy.buffer], { type: image.contentType }), image.filename);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(180_000),
    });
    if (!response.ok) {
      const requestId = response.headers.get("x-request-id") || undefined;
      const payload = await response.json().catch(() => ({})) as {
        error?: { message?: string; code?: string; type?: string };
      };
      const code = (payload.error?.code || payload.error?.type || "").toLowerCase();
      const providerMessage = sanitizeText(payload.error?.message, 240)
        .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted API key]")
        .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
      console.error("bathroom.preview.provider-failed", {
        status: response.status,
        code: code || undefined,
        requestId,
      });

      let error = "OpenAI could not generate the bathroom image.";
      if (response.status === 401) {
        error = "OpenAI rejected the API key. Replace OPENAI_API_KEY in the project’s .env file with a valid API key, then restart the app.";
      } else if (response.status === 403) {
        error = "The API key’s project does not have access to this image model. Check API project access and organization verification.";
      } else if (response.status === 429 && /rate_limit/.test(code)) {
        error = "OpenAI’s image rate limit was reached. Wait a few minutes before trying again.";
      } else if (response.status === 429 && /quota|billing|credit|spend|usage_limit/.test(`${code} ${providerMessage.toLowerCase()}`)) {
        error = "OpenAI stopped the image request because an API credit, billing, or usage limit was reached. Check API Billing and Limits.";
      } else if (response.status === 429) {
        error = providerMessage
          ? `OpenAI returned a 429 image error: ${providerMessage}`
          : "OpenAI returned a 429 image error. Check API usage limits, then try again.";
      } else if (response.status >= 500) {
        error = providerMessage
          ? `OpenAI’s image service returned an error: ${providerMessage}`
          : "OpenAI’s image service returned an error. Please try again in a few minutes.";
      } else if (providerMessage) {
        error = `OpenAI image error (${response.status}): ${providerMessage}`;
      }
      if (requestId) error += ` (Request ID: ${requestId})`;
      res.status(response.status === 429 ? 429 : 502).json({ error });
      return;
    }
    const result = await response.json() as { data?: Array<{ b64_json?: string }> };
    const image = result.data?.[0]?.b64_json;
    if (!image) {
      res.status(502).json({ error: "The image service returned no preview. Please try again." });
      return;
    }
    res.json({ imageDataUrl: `data:image/jpeg;base64,${image}` });
  } catch (error) {
    console.error("bathroom.preview.request-failed", { name: error instanceof Error ? error.name : typeof error });
    res.status(502).json({ error: "The image service could not be reached. Please try again." });
  }
}
