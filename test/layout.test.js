const { test } = require('node:test');
const assert = require('node:assert');
const { renderPage } = require('../lib/render/layout');

test('renderPage injects SEO head and body', () => {
  const html = renderPage({
    title: 'Ma fiche', description: 'desc',
    canonical: 'https://www.razak-multiservices.com/vehicules-vente/x',
    headExtra: '<script>1</script>', main: '<h1>Contenu</h1>'
  });
  assert.match(html, /<title>Ma fiche<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.razak-multiservices\.com\/vehicules-vente\/x">/);
  assert.match(html, /<meta name="description" content="desc">/);
  assert.match(html, /<h1>Contenu<\/h1>/);
  assert.match(html, /GTM-KP7FCM8K/);
  assert.match(html, /<script>1<\/script>/);
});
