const { test } = require('node:test');
const assert = require('node:assert');
const { buildKb } = require('../lib/kb');

const data = {
  vente: [{ brand: 'JETOUR', model: 'T2', year: 2026, type: 'Pick-up', km: 92, price: 32000000, status: 'available', url: '/vehicules-vente/jetour-t2-2026' }],
  location: [{ brand: 'Toyota', model: 'Corolla', year: 2022, type: 'Berline', formule: 'sans-chauffeur', priceDay: 30000, status: 'available', url: '/vehicules-location/toyota-corolla-2022' }],
  immobilier: [{ titre: 'Villa Cocody', type: 'Villa', quartier: 'Cocody', prix: 250000, unite: 'mois', status: 'available', url: '/immobilier/villa-cocody' }],
  ameublement: [{ titre: 'Canapé 3 places', cat: 'Salon', prix: 350000, status: 'available', url: '/ameublement/canape-3-places' }],
  articles: [{ title: 'Acheter une voiture à Abidjan', url: '/blog/acheter-voiture-occasion-abidjan' }]
};

test('buildKb contient les faits entreprise', () => {
  const kb = buildKb(data);
  assert.match(kb, /RAZAK Multi Service/);
  assert.match(kb, /07 97 38 82 02/);
  assert.match(kb, /Angré Caféier 5/);
});

test('buildKb liste le catalogue avec prix et url', () => {
  const kb = buildKb(data);
  assert.match(kb, /JETOUR T2 2026/);
  assert.match(kb, /32 000 000 FCFA/);
  assert.match(kb, /\/vehicules-vente\/jetour-t2-2026/);
  assert.match(kb, /Villa Cocody/);
  assert.match(kb, /Canapé 3 places/);
});

test('buildKb liste les guides blog', () => {
  const kb = buildKb(data);
  assert.match(kb, /Acheter une voiture à Abidjan/);
  assert.match(kb, /\/blog\/acheter-voiture-occasion-abidjan/);
});
