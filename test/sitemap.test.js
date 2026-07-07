const { test } = require('node:test');
const assert = require('node:assert');
const { buildSitemap } = require('../lib/sitemap');

test('buildSitemap wraps urls in valid xml with absolute www loc', () => {
  const xml = buildSitemap([{ path: '/', priority: '1.0' }, { path: '/vehicules-vente/x', priority: '0.8' }], '2026-06-14');
  assert.match(xml, /^<\?xml/);
  assert.match(xml, /<loc>https:\/\/www\.razak-multiservices\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.razak-multiservices\.com\/vehicules-vente\/x<\/loc>/);
  assert.match(xml, /<lastmod>2026-06-14<\/lastmod>/);
});
