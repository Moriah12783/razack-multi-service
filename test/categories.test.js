const { test } = require('node:test');
const assert = require('node:assert');
const { CATEGORIES, fmtPrice } = require('../lib/categories');

test('fmtPrice formats FCFA', () => {
  assert.strictEqual(fmtPrice(32000000), '32 000 000 FCFA');
});

test('vente category builds title and specs', () => {
  const c = CATEGORIES.vente;
  const item = { brand: 'JETOUR', model: 'T2', year: 2026, km: 92, fuel: 'Essence', transmission: 'Automatique', type: 'Pick-up', price: 32000000, color: 'NOIR', engine: '2.0L TURBO', doors: 4 };
  assert.match(c.title(item), /JETOUR T2 2026/);
  assert.strictEqual(c.urlBase, 'vehicules-vente');
  const specs = c.specs(item);
  assert.ok(specs.some(s => s.label === 'Kilométrage' && /92/.test(s.value)));
  assert.ok(specs.some(s => s.label === 'Prix'));
});

test('immobilier category exists with quartier grouping key', () => {
  assert.strictEqual(CATEGORIES.immobilier.urlBase, 'immobilier');
  assert.strictEqual(CATEGORIES.immobilier.groupBy, 'quartier');
});
