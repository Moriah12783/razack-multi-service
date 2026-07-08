const { test } = require('node:test');
const assert = require('node:assert');
const { renderBlogIndex } = require('../lib/render/blog-index');

const arts = [
  { url: '/blog/a', title: 'Article A', excerpt: 'Extrait A', date: '2026-07-08', cover: '' },
  { url: '/blog/b', title: 'Article B', excerpt: 'Extrait B', date: '2026-06-01', cover: '/images/blog/b.jpg' }
];

test('renderBlogIndex liste les articles avec liens + canonical /blog', () => {
  const html = renderBlogIndex(arts);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/blog"/);
  assert.match(html, /\/blog\/a/);
  assert.match(html, /Article A/);
  assert.match(html, /\/blog\/b/);
  assert.match(html, /Extrait A/);
  assert.match(html, /<h1[^>]*>.*Blog.*<\/h1>/i);
});
