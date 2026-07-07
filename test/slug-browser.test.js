// Verifies the browser slug logic in js/slug.js produces URLs identical to the
// Node build (lib/data.loadCategory -> item.url). This guards the internal
// linking: every catalog "Voir la fiche" link must resolve to the exact
// generated detail page, including the -<id> duplicate disambiguation.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadCategory } = require('../lib/data');

function loadBrowserSlug() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'slug.js'), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}

// map from build category key -> catalog cat string used in the browser
const CAT = {
  vente: 'vehicules-vente',
  location: 'vehicules-location',
  immobilier: 'immobilier',
  ameublement: 'ameublement'
};

test('js/slug.js exposes slugify, baseSlug, assignSlugs', () => {
  const b = loadBrowserSlug();
  assert.strictEqual(typeof b.slugify, 'function');
  assert.strictEqual(typeof b.baseSlug, 'function');
  assert.strictEqual(typeof b.assignSlugs, 'function');
});

test('browser slugify matches Node lib/slugify for accents', () => {
  const b = loadBrowserSlug();
  const { slugify } = require('../lib/slugify');
  for (const s of ['JETOUR T2 XWD TRAVEL 2026', 'Villa à Cocody — Angré', 'Salon complet 7 places en L']) {
    assert.strictEqual(b.slugify(s), slugify(s));
  }
});

test('browser assignSlugs reproduces the build url for every item (incl. -id dedup)', () => {
  const b = loadBrowserSlug();
  for (const key of Object.keys(CAT)) {
    const cat = CAT[key];
    const built = loadCategory(key); // has .url from the Node build
    // Build the same input array the browser sees (raw JSON order), then run the
    // browser assignSlugs over the WHOLE array and compare urls one-to-one.
    const raw = built.map(({ slug, url, category, ...rest }) => rest);
    const browser = b.assignSlugs(raw, cat);
    assert.strictEqual(browser.length, built.length, `${key}: same length`);
    for (let i = 0; i < built.length; i++) {
      assert.strictEqual(browser[i].url, built[i].url, `${key}[${i}] (id ${built[i].id}) url mismatch`);
      assert.strictEqual(browser[i].slug, built[i].slug, `${key}[${i}] (id ${built[i].id}) slug mismatch`);
    }
  }
});

test('duplicate items get the -id suffix in the browser too', () => {
  const b = loadBrowserSlug();
  // vente id 29 (2nd Hyundai Tucson 2023) and ameublement ids 5/15/18 are dupes
  const vente = b.assignSlugs(loadCategory('vente').map(({ slug, url, category, ...r }) => r), 'vehicules-vente');
  const id29 = vente.find(v => v.id === 29);
  assert.strictEqual(id29.url, '/vehicules-vente/hyundai-tucson-2023-29');
  const meub = b.assignSlugs(loadCategory('ameublement').map(({ slug, url, category, ...r }) => r), 'ameublement');
  for (const id of [5, 15, 18]) {
    const it = meub.find(m => m.id === id);
    assert.ok(it.url.endsWith('-' + id), `ameublement id ${id} url ${it.url} should end with -${id}`);
  }
});
