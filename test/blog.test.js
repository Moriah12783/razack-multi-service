const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { parseFrontmatter, loadArticles } = require('../lib/blog');

test('parseFrontmatter extrait meta (dont listes) et corps', () => {
  const raw = '---\ntitle: Mon Titre\ndate: 2026-07-08\ntags: [auto, achat]\n---\n# Corps\n\nTexte.';
  const { meta, body } = parseFrontmatter(raw);
  assert.strictEqual(meta.title, 'Mon Titre');
  assert.strictEqual(meta.date, '2026-07-08');
  assert.deepStrictEqual(meta.tags, ['auto', 'achat']);
  assert.match(body, /# Corps/);
});

test('loadArticles lit un dossier, calcule slug/url/html et trie par date desc', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-'));
  fs.writeFileSync(path.join(dir, 'ancien.md'), '---\ntitle: Ancien\ndate: 2026-01-01\ndescription: d1\n---\nA');
  fs.writeFileSync(path.join(dir, 'recent.md'), '---\ntitle: Recent\ndate: 2026-06-01\ndescription: d2\n---\n**B**');
  const arts = loadArticles(dir);
  assert.strictEqual(arts.length, 2);
  assert.strictEqual(arts[0].slug, 'recent');           // plus récent d'abord
  assert.strictEqual(arts[0].url, '/blog/recent');
  assert.match(arts[0].html, /<strong>B<\/strong>/);
  assert.strictEqual(arts[1].title, 'Ancien');
});
