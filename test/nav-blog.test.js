const { test } = require('node:test');
const assert = require('node:assert');
const { renderPage } = require('../lib/render/layout');

test('la navigation contient un lien Blog', () => {
  const html = renderPage({ title: 't', description: 'd', canonical: 'https://www.razak-multiservices.com/x', main: '<p>x</p>' });
  assert.match(html, /<a href="\/blog"[^>]*>Blog<\/a>/);
});
