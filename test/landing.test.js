const { test } = require('node:test');
const assert = require('node:assert');
const { renderLanding, landingUrl } = require('../lib/render/landing');

const items = [
  { slug: 'a', url: '/vehicules-vente/a', category: 'vente', brand: 'Toyota', model: 'Hilux', year: 2021, price: 18900000, type: 'Pick-up', photos: ['/images/annonces/a.jpg'] }
];

test('landingUrl builds a slugged path under the category', () => {
  assert.strictEqual(landingUrl('vente', 'type', 'Pick-up'), '/voitures/pick-up');
  assert.strictEqual(landingUrl('immobilier', 'quartier', 'Cocody'), '/immobilier/cocody');
});

test('renderLanding lists items and includes intro + h1', () => {
  const html = renderLanding('vente', 'type', 'Pick-up', items);
  assert.match(html, /<h1[^>]*>.*Pick-up.*<\/h1>/i);
  assert.match(html, /vehicules-vente\/a/);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/voitures\/pick-up"/);
});

test('renderLanding throws on empty group (no thin pages)', () => {
  assert.throws(() => renderLanding('vente', 'type', 'Pick-up', []), /empty/i);
});
