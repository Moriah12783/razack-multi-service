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

test('renderPage emits og:image when image is provided', () => {
  const html = renderPage({
    title: 'T', description: 'd',
    canonical: 'https://www.razak-multiservices.com/x',
    image: 'https://www.razak-multiservices.com/images/annonces/a.jpg',
    main: '<h1>x</h1>'
  });
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.razak-multiservices\.com\/images\/annonces\/a\.jpg">/);
});

test('renderPage omits og:image when no image is provided', () => {
  const html = renderPage({
    title: 'T', description: 'd',
    canonical: 'https://www.razak-multiservices.com/x',
    main: '<h1>x</h1>'
  });
  assert.ok(!/og:image/.test(html), 'no og:image tag when image absent');
});

test('renderPage defaults og:type to website', () => {
  const html = renderPage({
    title: 'T', description: 'd',
    canonical: 'https://www.razak-multiservices.com/x',
    main: '<h1>x</h1>'
  });
  assert.match(html, /<meta property="og:type" content="website">/);
});

test('renderPage emits og:type=article when ogType is article', () => {
  const html = renderPage({
    title: 'T', description: 'd',
    canonical: 'https://www.razak-multiservices.com/blog/x',
    ogType: 'article', main: '<h1>x</h1>'
  });
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.ok(!/content="website"/.test(html), 'no leftover website og:type');
});
