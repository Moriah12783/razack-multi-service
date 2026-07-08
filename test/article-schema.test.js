const { test } = require('node:test');
const assert = require('node:assert');
const { articleSchema } = require('../lib/schema');

test('articleSchema produit un Article valide avec auteur RAZAK', () => {
  const a = { title: 'Guide', description: 'desc', date: '2026-07-08', cover: '/images/blog/x.jpg' };
  const j = JSON.parse(articleSchema(a, 'https://www.razak-multiservices.com/blog/guide'));
  assert.strictEqual(j['@type'], 'Article');
  assert.strictEqual(j.headline, 'Guide');
  assert.strictEqual(j.datePublished, '2026-07-08');
  assert.strictEqual(j.author.name, 'RAZAK Multi Service');
  assert.strictEqual(j.image, 'https://www.razak-multiservices.com/images/blog/x.jpg');
});

test('articleSchema retombe sur og-image par défaut si pas de cover', () => {
  const j = JSON.parse(articleSchema({ title: 'G', description: 'd', date: '2026-07-08', cover: '' }, 'https://www.razak-multiservices.com/blog/g'));
  assert.strictEqual(j.image, 'https://www.razak-multiservices.com/images/og-image.jpg');
});
