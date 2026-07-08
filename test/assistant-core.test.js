const { test } = require('node:test');
const assert = require('node:assert');
const { buildSystemPrompt, sanitizeMessages, extractText, MAX_MESSAGES, MAX_MSG_LEN } = require('../lib/assistant-core');

test('buildSystemPrompt intègre la KB et les règles anti-fabrication', () => {
  const p = buildSystemPrompt('CONNAISSANCE_TEST_123');
  assert.match(p, /Razaki/);
  assert.match(p, /CONNAISSANCE_TEST_123/);
  assert.match(p, /invente/i);
  assert.match(p, /2250797388202|07 97 38 82 02/);
});

test('sanitizeMessages filtre, borne la longueur et le nombre', () => {
  const long = 'a'.repeat(MAX_MSG_LEN + 500);
  const many = Array.from({ length: MAX_MESSAGES + 10 }, (_, i) => ({ role: 'user', content: 'm' + i }));
  assert.strictEqual(sanitizeMessages([{ role: 'user', content: long }])[0].content.length, MAX_MSG_LEN);
  assert.strictEqual(sanitizeMessages(many).length, MAX_MESSAGES);
  assert.deepStrictEqual(sanitizeMessages([{ role: 'system', content: 'x' }, { role: 'bogus', content: 'y' }]), []);
  assert.deepStrictEqual(sanitizeMessages('pas un tableau'), []);
});

test('extractText récupère le texte d une réponse Anthropic', () => {
  assert.strictEqual(extractText({ content: [{ type: 'text', text: 'Bonjour' }, { type: 'text', text: ' !' }] }), 'Bonjour !');
  assert.strictEqual(extractText({}), '');
});
