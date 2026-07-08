const { test, before } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const htmlCount = dir => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(f => f.endsWith('.html')).length
  : 0;

// Build exactly once for the whole suite. execFileSync throws if build.js exits
// non-zero, so the collision guard in writePage firing on current data would
// surface here as a failed run before any assertion.
before(() => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'inherit' });
});

test('build.js copies existing static pages + generates vehicle detail pages', () => {
  assert.ok(fs.existsSync(path.join(DIST, 'index.html')), 'copies existing pages');
  assert.ok(htmlCount(path.join(DIST, 'vehicules-vente')) >= 40, 'generated ~42 vehicle pages');
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  assert.match(sm, /vehicules-vente\//);
});

test('landing pages live under distinct namespaces and do not collide with details', () => {
  assert.ok(htmlCount(path.join(DIST, 'immobilier', 'quartier')) >= 1, 'immobilier/quartier landings');
  assert.ok(htmlCount(path.join(DIST, 'ameublement', 'piece')) >= 1, 'ameublement/piece landings');
  // Detail files sit at the top of each dir; landings are now in the
  // quartier/piece subdirs and are NOT counted by htmlCount (non-recursive).
  const detailTotal = htmlCount(path.join(DIST, 'vehicules-vente'))
    + htmlCount(path.join(DIST, 'vehicules-location'))
    + htmlCount(path.join(DIST, 'immobilier'))
    + htmlCount(path.join(DIST, 'ameublement'));
  assert.strictEqual(detailTotal, 86, 'exactly 86 detail pages');
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  assert.match(sm, /\/immobilier\/quartier\//, 'sitemap has immobilier landing namespace');
  assert.match(sm, /\/ameublement\/piece\//, 'sitemap has ameublement landing namespace');
});

test('build.js génère /blog et les pages articles + sitemap', () => {
  assert.ok(fs.existsSync(path.join(DIST, 'blog.html')), 'index /blog généré');
  const arts = fs.readdirSync(path.join(DIST, 'blog')).filter(f => f.endsWith('.html'));
  assert.ok(arts.length >= 1, 'au moins 1 article généré');
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  assert.match(sm, /\/blog<\/loc>/);
  assert.match(sm, /\/blog\//);
});
