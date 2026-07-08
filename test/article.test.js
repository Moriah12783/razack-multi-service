const { test } = require('node:test');
const assert = require('node:assert');
const { renderArticle } = require('../lib/render/article');

const art = {
  slug: 'guide', url: '/blog/guide', title: 'Acheter une voiture à Abidjan',
  description: 'desc', date: '2026-07-08', cover: '', tags: ['auto'],
  html: '<h2>Section</h2><p>Contenu avec <a href="/voitures/suv">SUV</a>.</p>'
};

test('renderArticle produit une page indexable avec schema, canonical, corps, CTA', () => {
  const html = renderArticle(art);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/blog\/guide"/);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /\/voitures\/suv/);          // maillage préservé
  assert.match(html, /wa\.me\/2250797388202/);    // CTA
});

test('renderArticle affiche un header dégradé quand pas de cover', () => {
  const html = renderArticle(art);
  assert.match(html, /linear-gradient/);
  assert.match(html, /Acheter une voiture à Abidjan/);
});

test('renderArticle émet og:type=article', () => {
  const html = renderArticle(art);
  assert.match(html, /<meta property="og:type" content="article">/);
});
