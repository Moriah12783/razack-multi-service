const { test } = require('node:test');
const assert = require('node:assert');
const { slugify, baseSlug, assignSlugs } = require('../lib/slugify');

test('slugify strips accents, lowercases, hyphenates', () => {
  assert.strictEqual(slugify('JETOUR T2 XWD Travel 2026'), 'jetour-t2-xwd-travel-2026');
  assert.strictEqual(slugify('Villa à Cocody — Angré'), 'villa-a-cocody-angre');
});

test('baseSlug for vehicles uses brand-model-year', () => {
  assert.strictEqual(baseSlug({ brand: 'Toyota', model: 'Hilux', year: 2021 }, 'vente'), 'toyota-hilux-2021');
});

test('baseSlug for immobilier uses titre', () => {
  assert.strictEqual(baseSlug({ titre: 'Appartement 3 pièces Marcory', id: 5 }, 'immobilier'), 'appartement-3-pieces-marcory');
});

test('assignSlugs disambiguates duplicates by id', () => {
  const out = assignSlugs([
    { id: 1, brand: 'Toyota', model: 'Corolla', year: 2020 },
    { id: 2, brand: 'Toyota', model: 'Corolla', year: 2020 }
  ], 'vente');
  assert.strictEqual(out[0].slug, 'toyota-corolla-2020');
  assert.strictEqual(out[1].slug, 'toyota-corolla-2020-2');
});
