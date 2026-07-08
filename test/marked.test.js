const { test } = require('node:test');
const assert = require('node:assert');
const { marked } = require('marked');

test('marked convertit du markdown en HTML', () => {
  const html = marked.parse('# Titre\n\nUn **para**.');
  assert.match(html, /<h1[^>]*>Titre<\/h1>/);
  assert.match(html, /<strong>para<\/strong>/);
});
