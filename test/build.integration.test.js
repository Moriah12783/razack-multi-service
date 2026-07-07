const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

test('build.js generates dist with detail pages + sitemap', () => {
  execFileSync('node', ['build.js'], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  const dist = path.join(__dirname, '..', 'dist');
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'copies existing pages');
  const vente = fs.readdirSync(path.join(dist, 'vehicules-vente'));
  assert.ok(vente.filter(f => f.endsWith('.html')).length >= 40, 'generated ~42 vehicle pages');
  const sm = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  assert.match(sm, /vehicules-vente\//);
});
