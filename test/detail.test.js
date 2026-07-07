const { test } = require('node:test');
const assert = require('node:assert');
const { renderDetail } = require('../lib/render/detail');

const item = {
  id: 1, brand: 'JETOUR', model: 'T2 XWD TRAVEL', year: 2026, km: 92, fuel: 'Essence',
  transmission: 'Automatique', type: 'Pick-up', price: 32000000, color: 'NOIR', engine: '2.0L TURBO',
  doors: 4, status: 'available', desc: 'FULL OPTIONS\nDCT 7 vitesses', slug: 'jetour-t2-xwd-travel-2026',
  url: '/vehicules-vente/jetour-t2-xwd-travel-2026', category: 'vente',
  photos: ['/images/annonces/a.jpg', '/images/annonces/b.jpg']
};

test('renderDetail produces indexable HTML with price, specs, gallery, schema', () => {
  const html = renderDetail(item, 'vente', []);
  assert.match(html, /<h1[^>]*>JETOUR T2 XWD TRAVEL 2026<\/h1>/);
  assert.match(html, /32 000 000 FCFA/);
  assert.match(html, /Kilométrage/);
  assert.match(html, /images\/annonces\/a\.jpg/);
  assert.match(html, /"@type":"Vehicle"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /wa\.me\/2250797388202/);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/vehicules-vente\/jetour-t2-xwd-travel-2026"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.razak-multiservices\.com\/images\/annonces\/a\.jpg">/);
});

test('renderDetail marks a sold item and does not show InStock', () => {
  const sold = { ...item, status: 'sold' };
  const html = renderDetail(sold, 'vente', []);
  assert.match(html, /Vendu/i);
  assert.match(html, /"availability":"https:\/\/schema\.org\/SoldOut"/);
});
