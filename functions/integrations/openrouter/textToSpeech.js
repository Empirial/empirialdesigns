// OpenRouter text-to-speech — powers the "read this reply aloud" speaker
// button in the builder's assistant chat (AssistantPanel.tsx). Shares
// OPENROUTER_API_KEY with ./imageGeneration.js; same "dormant until the key
// is set" contract.
//
// Model: fish-audio/s2.1-pro-free:free — the $0.00 tier of Fish Audio's S2.1
// Pro TTS on OpenRouter. "Free" here means no per-request cost, not
// unlimited: free OpenRouter models carry their own daily rate cap
// (see functions/.env.example's note on the account-wide free-model cap
// that made the free chat model unworkable beyond solo testing) — expect
// the same class of limit here, not a real production guarantee.
//
// Docs: https://openrouter.ai/docs/guides/overview/multimodal/tts
const fetch = require('node-fetch');

const DEFAULT_MODEL = 'fish-audio/s2.1-pro-free:free';

function assertEnabled() {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('Text-to-speech is not enabled yet (no OpenRouter budget configured).');
    err.ttsDisabled = true;
    throw err;
  }
}

// Raw OpenRouter `/audio/speech` request. Unlike image generation this
// endpoint returns the audio bytes directly (not JSON+base64) — the caller
// (exports.textToSpeech in ../../index.js) streams that straight back to
// the browser instead of uploading to Storage first; unlike generated
// images, spoken chat replies aren't meant to be a durable, reusable asset.
async function generateSpeech({ text, voice }) {
  assertEnabled();

  const model = process.env.OPENROUTER_TTS_MODEL || DEFAULT_MODEL;
  // `voice` is a Fish Audio reference_id (a voice picked from
  // https://fish.audio/discovery) — omit it entirely rather than send a
  // guessed value, so the model falls back to its own built-in default
  // voice when no project-level choice has ever been saved.
  const resolvedVoice = voice || process.env.OPENROUTER_TTS_VOICE || undefined;

  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://empirialdesigns.web.app',
      'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME || 'Empirial AI Website Builder',
    },
    body: JSON.stringify({
      model,
      input: text,
      ...(resolvedVoice ? { voice: resolvedVoice } : {}),
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Text-to-speech failed: ${res.status} ${errorText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mimeType: 'audio/mpeg', model, voice: resolvedVoice };
}

module.exports = { DEFAULT_MODEL, generateSpeech };
