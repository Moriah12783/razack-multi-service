const { test } = require('node:test');
const assert = require('node:assert');
const { productSchema, breadcrumbSchema } = require('../lib/schema');

test('productSchema for a vehicle includes Offer with price', () => {
  const item = { brand: 'JETOUR', model: 'T2', year: 2026, price: 32000000, status: 'available', photos: ['/images/annonces/x.jpg'] };
  const json = JSON.parse(productSchema(item, 'vente', 'https://www.razak-multiservices.com/vehicules-vente/jetour-t2-2026'));
  assert.strictEqual(json['@type'], 'Vehicle');
  assert.strictEqual(json.offers.price, 32000000);
  assert.strictEqual(json.offers.priceCurrency, 'XOF');
  assert.strictEqual(json.offers.availability, 'https://schema.org/InStock');
});

test('breadcrumbSchema builds an ordered list', () => {
  const json = JSON.parse(breadcrumbSchema([
    { name: 'Accueil', url: 'https://x/' }, { name: 'Véhicules', url: 'https://x/vehicules-vente' }
  ]));
  assert.strictEqual(json['@type'], 'BreadcrumbList');
  assert.strictEqual(json.itemListElement[0].position, 1);
  assert.strictEqual(json.itemListElement[1].position, 2);
});
