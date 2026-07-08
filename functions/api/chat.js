import { buildSystemPrompt, sanitizeMessages, extractText } from '../../lib/assistant-core.js';

const MODEL = 'claude-haiku-4-5-20251001';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const messages = sanitizeMessages(body && body.messages);
    if (!messages.length) return json({ error: 'Message vide.' }, 400);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Assistant non configuré.' }, 500);

    let kb = '';
    try {
      const kbRes = await env.ASSETS.fetch(new URL('/assistant-kb.txt', request.url));
      if (kbRes && kbRes.ok) kb = await kbRes.text();
    } catch (_) { /* KB indisponible → l'assistant restera prudent */ }

    const anth = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: buildSystemPrompt(kb), messages })
    });

    if (!anth.ok) {
      return json({ error: "L'assistant est momentanément indisponible. Contactez-nous sur WhatsApp au +225 07 97 38 82 02." }, 502);
    }
    const data = await anth.json();
    const reply = extractText(data);
    return json({ reply: reply || "Je n'ai pas de réponse pour le moment. Contactez RAZAK sur WhatsApp au +225 07 97 38 82 02." });
  } catch (e) {
    return json({ error: 'Erreur serveur.' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, service: 'razaki' });
}
