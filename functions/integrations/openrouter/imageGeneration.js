// OpenRouter image generation — PDF sections 24-32. Dormant by design: every
// call in here throws immediately if OPENROUTER_API_KEY isn't set, and that
// var is intentionally left unset in functions/.env.example/deployed config
// until there's a funded budget to spend. Wiring this up (generateImage in
// ../../index.js) is otherwise complete — flipping it on later is a one-line
// env var change, not a code change.
const fetch = require('node-fetch');

const MAX_IMAGES_PER_SITE = 5;

function assertEnabled() {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('Image generation is not enabled yet (no OpenRouter budget configured).');
    err.imagesDisabled = true;
    throw err;
  }
}

// PDF section 29 — turns a bare asset request into a real, specific prompt
// instead of letting the calling agent send something vague like "make pool
// picture". No LLM call: deterministic templating is cheaper and, per the
// PDF, avoids visible text in the image (left to real HTML instead).
function buildImagePrompt({ businessType, asset, brandTone, locationContext }) {
  const shot = {
    hero: 'wide composition with negative space for a website headline, no text, no logos, no watermark',
    service: 'clean product/service-focused composition, no text',
    about: 'natural, candid composition suggesting the people/place behind the business, no text',
    background: 'subtle, low-contrast texture suitable as a page background, no text',
    logo: 'simple, iconographic mark on a transparent-friendly plain background, no text',
  }[asset] || 'clean, professional composition, no text';

  return [
    `Professional commercial photography for a ${businessType} website.`,
    brandTone ? `Mood: ${brandTone}.` : '',
    locationContext ? `Setting: ${locationContext}.` : '',
    shot,
    'no watermark',
  ].filter(Boolean).join(' ');
}

// PDF section 26/27 — raw OpenRouter request + base64 decode. Returns the
// decoded buffer + mime type; the caller (generateImage in ../../index.js)
// owns uploading it to Firebase Storage and recording cost/asset metadata.
async function generateImage({ prompt, aspectRatio = '16:9', resolution = '1K' }) {
  assertEnabled();

  const model = process.env.OPENROUTER_IMAGE_MODEL || 'black-forest-labs/flux.2-klein-4b';
  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://empirialdesigns.web.app',
      'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME || 'Empirial AI Website Builder',
    },
    body: JSON.stringify({
      model,
      prompt,
      resolution,
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      n: 1,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter image generation failed: ${res.status} ${errorText}`);
  }

  const body = await res.json();
  const image = body.data && body.data[0];
  if (!image || !image.b64_json) throw new Error('OpenRouter returned no image data');

  return {
    buffer: Buffer.from(image.b64_json, 'base64'),
    mimeType: image.media_type || 'image/webp',
    costUsd: (body.usage && body.usage.cost) || undefined,
    model,
  };
}

module.exports = { MAX_IMAGES_PER_SITE, buildImagePrompt, generateImage };
