# SEO Programmatic Pages — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Générer, au build Cloudflare Pages, une page HTML statique indexable par article (~86) + des landing pages catégorie/quartier + un sitemap, à partir des JSON existants, sans casser le site live.

**Architecture:** Un générateur Node natif (`build.js` + modules `lib/`) lit `data/*.json`, calcule des slugs stables, applique des templates (fonctions JS→HTML réutilisant le CSS existant), et écrit tout dans `dist/` (pages générées + copie des fichiers statiques actuels). Cloudflare Pages exécute `npm run build` et sert `dist/`. Développement sur branche `feat/seo-pages` → preview Cloudflare, bascule prod après validation.

**Tech Stack:** Node.js (≥18), test runner natif `node:test` + `node:assert` (zéro dépendance), templates en template-literals JS.

**Prérequis d'exécution :** travailler sur une branche dédiée `feat/seo-pages` (pas `main`), pour que Cloudflare produise une **preview** sans toucher la prod.

---

## Structure des fichiers (Phase 1)

| Fichier | Responsabilité |
|---|---|
| `package.json` | scripts `build` / `test`, moteur Node |
| `lib/slugify.js` | slugs SEO stables + dédup |
| `lib/categories.js` | config des 4 catégories (url, labels, champs, builders titre/desc/schema) |
| `lib/data.js` | charge les JSON, attache url/slug, regroupe par type/quartier |
| `lib/schema.js` | JSON-LD (Vehicle/Product/RealEstateListing/BreadcrumbList) |
| `lib/render/layout.js` | coquille HTML partagée (head SEO + nav + footer) |
| `lib/render/detail.js` | page fiche produit |
| `lib/render/landing.js` | page catégorie/quartier (+ garde ≥1 article) |
| `lib/sitemap.js` | génération sitemap.xml |
| `lib/copy-static.js` | copie des fichiers statiques vers `dist/` |
| `build.js` | orchestrateur (assemble tout, écrit `dist/`) |
| `test/*.test.js` | tests unitaires + intégration |

Tables existantes modifiées : `vehicules-vente.html`, `vehicules-location.html`, `immobilier.html`, `ameublement.html` (les cartes JS pointent vers les fiches).

---

## Task 0: Scaffolding & test runner

**Files:**
- Create: `package.json`, `.gitignore`, `test/smoke.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "razak-multiservices",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 3: Write a smoke test** — `test/smoke.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');

test('test runner works', () => {
  assert.strictEqual(1 + 1, 2);
});
```

- [ ] **Step 4: Run the test suite to verify the runner works**

Run: `node --test`
Expected: PASS — 1 test passed.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/seo-pages
git add package.json .gitignore test/smoke.test.js
git commit -m "chore: scaffolding + node:test runner for page generator"
```

---

## Task 1: Slugs SEO stables (`lib/slugify.js`)

**Files:**
- Create: `lib/slugify.js`, `test/slugify.test.js`

- [ ] **Step 1: Write the failing tests** — `test/slugify.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { slugify, baseSlug, assignSlugs } = require('../lib/slugify');

test('slugify strips accents, lowercases, hyphenates', () => {
  assert.strictEqual(slugify('JETOUR T2 XWD Travel 2026'), 'jetour-t2-xwd-travel-2026');
  assert.strictEqual(slugify('Villa à Cocody — Angré'), 'villa-a-cocody-angre');
});

test('baseSlug for vehicles uses brand-model-year', () => {
  assert.strictEqual(baseSlug({ brand: 'Toyota', model: 'Hilux', year: 2021 }, 'vente'), 'toyota-hilux-2021');
});

test('baseSlug for immobilier uses titre', () => {
  assert.strictEqual(baseSlug({ titre: 'Appartement 3 pièces Marcory', id: 5 }, 'immobilier'), 'appartement-3-pieces-marcory');
});

test('assignSlugs disambiguates duplicates by id', () => {
  const out = assignSlugs([
    { id: 1, brand: 'Toyota', model: 'Corolla', year: 2020 },
    { id: 2, brand: 'Toyota', model: 'Corolla', year: 2020 }
  ], 'vente');
  assert.strictEqual(out[0].slug, 'toyota-corolla-2020');
  assert.strictEqual(out[1].slug, 'toyota-corolla-2020-2');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/slugify.test.js`
Expected: FAIL — Cannot find module '../lib/slugify'.

- [ ] **Step 3: Implement `lib/slugify.js`**

```js
function slugify(str) {
  return String(str == null ? '' : str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function baseSlug(item, category) {
  if (category === 'vente' || category === 'location') {
    return slugify(`${item.brand} ${item.model} ${item.year}`);
  }
  return slugify(item.titre || `${item.type || ''} ${item.quartier || ''} ${item.id}`);
}

function assignSlugs(items, category) {
  const seen = new Map();
  return items.map((item) => {
    let s = baseSlug(item, category);
    if (seen.has(s)) {
      seen.set(s, seen.get(s) + 1);
      s = `${s}-${item.id}`;
    } else {
      seen.set(s, 1);
    }
    return { ...item, slug: s };
  });
}

module.exports = { slugify, baseSlug, assignSlugs };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/slugify.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/slugify.js test/slugify.test.js
git commit -m "feat: stable SEO slug generation"
```

---

## Task 2: Config des catégories (`lib/categories.js`)

Chaque catégorie déclare: `key`, `urlBase`, `label`, la fonction `title(item)`, `description(item)`, la liste `specs(item)` (paires label/valeur à afficher), et `schemaType`. Une seule structure de données → pas de duplication de template.

**Files:**
- Create: `lib/categories.js`, `test/categories.test.js`

- [ ] **Step 1: Write the failing tests** — `test/categories.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { CATEGORIES, fmtPrice } = require('../lib/categories');

test('fmtPrice formats FCFA', () => {
  assert.strictEqual(fmtPrice(32000000), '32 000 000 FCFA');
});

test('vente category builds title and specs', () => {
  const c = CATEGORIES.vente;
  const item = { brand: 'JETOUR', model: 'T2', year: 2026, km: 92, fuel: 'Essence', transmission: 'Automatique', type: 'Pick-up', price: 32000000, color: 'NOIR', engine: '2.0L TURBO', doors: 4 };
  assert.match(c.title(item), /JETOUR T2 2026/);
  assert.strictEqual(c.urlBase, 'vehicules-vente');
  const specs = c.specs(item);
  assert.ok(specs.some(s => s.label === 'Kilométrage' && /92/.test(s.value)));
  assert.ok(specs.some(s => s.label === 'Prix'));
});

test('immobilier category exists with quartier grouping key', () => {
  assert.strictEqual(CATEGORIES.immobilier.urlBase, 'immobilier');
  assert.strictEqual(CATEGORIES.immobilier.groupBy, 'quartier');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/categories.test.js`
Expected: FAIL — Cannot find module '../lib/categories'.

- [ ] **Step 3: Implement `lib/categories.js`**

```js
function fmtPrice(n) {
  if (n == null || n === '') return 'Prix sur demande';
  return new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ') + ' FCFA';
}

const CATEGORIES = {
  vente: {
    key: 'vente', urlBase: 'vehicules-vente', label: 'Véhicules à vendre',
    dataFile: 'vehicules-vente.json', schemaType: 'Vehicle', groupBy: 'type',
    title: (i) => `${i.brand} ${i.model} ${i.year} à vendre à Abidjan — ${fmtPrice(i.price)}`,
    description: (i) => `${i.brand} ${i.model} ${i.year}, ${i.type}, ${i.fuel}, ${i.transmission}, ${i.km} km. Prix ${fmtPrice(i.price)}. Contactez RAZAK Multi Service sur WhatsApp.`,
    h1: (i) => `${i.brand} ${i.model} ${i.year}`,
    specs: (i) => [
      { label: 'Marque', value: i.brand }, { label: 'Modèle', value: i.model },
      { label: 'Année', value: i.year }, { label: 'Kilométrage', value: `${i.km} km` },
      { label: 'Carburant', value: i.fuel }, { label: 'Boîte', value: i.transmission },
      { label: 'Type', value: i.type }, { label: 'Moteur', value: i.engine },
      { label: 'Couleur', value: i.color }, { label: 'Portes', value: i.doors },
      { label: 'Prix', value: fmtPrice(i.price) }
    ].filter(s => s.value != null && s.value !== '')
  },
  location: {
    key: 'location', urlBase: 'vehicules-location', label: 'Location de véhicules',
    dataFile: 'vehicules-location.json', schemaType: 'Vehicle', groupBy: 'type',
    title: (i) => `Location ${i.brand} ${i.model} à Abidjan — dès ${fmtPrice(i.priceDay)}/jour`,
    description: (i) => `Louez ${i.brand} ${i.model} ${i.year} à Abidjan (${i.formule}). Dès ${fmtPrice(i.priceDay)}/jour. Réservation WhatsApp RAZAK Multi Service.`,
    h1: (i) => `Location ${i.brand} ${i.model} ${i.year}`,
    specs: (i) => [
      { label: 'Marque', value: i.brand }, { label: 'Modèle', value: i.model },
      { label: 'Année', value: i.year }, { label: 'Formule', value: i.formule },
      { label: 'Places', value: i.places }, { label: 'Carburant', value: i.fuel },
      { label: 'Boîte', value: i.transmission },
      { label: 'Prix / jour', value: fmtPrice(i.priceDay) },
      { label: 'Prix / semaine', value: fmtPrice(i.priceWeek) },
      { label: 'Prix / mois', value: fmtPrice(i.priceMonth) }
    ].filter(s => s.value != null && s.value !== '')
  },
  immobilier: {
    key: 'immobilier', urlBase: 'immobilier', label: 'Immobilier',
    dataFile: 'immobilier.json', schemaType: 'RealEstateListing', groupBy: 'quartier',
    title: (i) => `${i.titre} à ${i.quartier}, Abidjan — ${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}`,
    description: (i) => `${i.titre} à ${i.quartier}. ${i.chambres} chambres, ${i.surface} m². ${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}. RAZAK Multi Service — visite sur WhatsApp.`,
    h1: (i) => i.titre,
    specs: (i) => [
      { label: 'Type', value: i.type }, { label: 'Mode', value: i.mode },
      { label: 'Quartier', value: i.quartier }, { label: 'Chambres', value: i.chambres },
      { label: 'Salles de bain', value: i.sdb }, { label: 'Surface', value: i.surface ? `${i.surface} m²` : null },
      { label: 'Prix', value: `${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}` }
    ].filter(s => s.value != null && s.value !== '')
  },
  ameublement: {
    key: 'ameublement', urlBase: 'ameublement', label: 'Ameublement',
    dataFile: 'ameublement.json', schemaType: 'Product', groupBy: 'room',
    title: (i) => `${i.titre} à Abidjan — ${fmtPrice(i.prix)} | RAZAK Multi Service`,
    description: (i) => `${i.titre} (${i.cat}). ${fmtPrice(i.prix)}. Livraison et installation à Abidjan. Commande WhatsApp RAZAK Multi Service.`,
    h1: (i) => i.titre,
    specs: (i) => [
      { label: 'Pièce', value: i.room }, { label: 'Catégorie', value: i.cat },
      { label: 'Prix', value: fmtPrice(i.prix) }
    ].filter(s => s.value != null && s.value !== '')
  }
};

module.exports = { CATEGORIES, fmtPrice };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/categories.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/categories.js test/categories.test.js
git commit -m "feat: category config (url, titles, specs, schema types)"
```

---

## Task 3: Chargement & regroupement des données (`lib/data.js`)

**Files:**
- Create: `lib/data.js`, `test/data.test.js`

- [ ] **Step 1: Write the failing tests** — `test/data.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { loadCategory, groupItems } = require('../lib/data');

test('loadCategory attaches url and slug to every item', () => {
  const items = loadCategory('vente');
  assert.ok(items.length >= 40, 'at least 40 vehicles for sale');
  for (const it of items) {
    assert.ok(it.slug && it.slug.length > 0, 'has slug');
    assert.match(it.url, /^\/vehicules-vente\/[a-z0-9-]+$/);
  }
});

test('groupItems groups by the category groupBy field, skipping empties', () => {
  const items = [
    { type: 'SUV', slug: 'a' }, { type: 'SUV', slug: 'b' }, { type: 'Pick-up', slug: 'c' }, { type: '', slug: 'd' }
  ];
  const groups = groupItems(items, 'type');
  assert.strictEqual(groups.get('SUV').length, 2);
  assert.strictEqual(groups.get('Pick-up').length, 1);
  assert.ok(!groups.has(''), 'empty group key is skipped');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/data.test.js`
Expected: FAIL — Cannot find module '../lib/data'.

- [ ] **Step 3: Implement `lib/data.js`**

```js
const fs = require('node:fs');
const path = require('node:path');
const { CATEGORIES } = require('./categories');
const { assignSlugs } = require('./slugify');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadCategory(key) {
  const cfg = CATEGORIES[key];
  const raw = fs.readFileSync(path.join(DATA_DIR, cfg.dataFile), 'utf8');
  const items = JSON.parse(raw);
  return assignSlugs(items, key).map((it) => ({ ...it, category: key, url: `/${cfg.urlBase}/${it.slug}` }));
}

function groupItems(items, field) {
  const groups = new Map();
  for (const it of items) {
    const k = it[field];
    if (k == null || String(k).trim() === '') continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  return groups;
}

module.exports = { loadCategory, groupItems, DATA_DIR };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/data.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/data.js test/data.test.js
git commit -m "feat: data loader with slug/url + grouping"
```

---

## Task 4: JSON-LD (`lib/schema.js`)

**Files:**
- Create: `lib/schema.js`, `test/schema.test.js`

- [ ] **Step 1: Write the failing tests** — `test/schema.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { productSchema, breadcrumbSchema } = require('../lib/schema');

test('productSchema for a vehicle includes Offer with price', () => {
  const item = { brand: 'JETOUR', model: 'T2', year: 2026, price: 32000000, status: 'available', photos: ['/images/annonces/x.jpg'] };
  const json = JSON.parse(productSchema(item, 'vente', 'https://www.razak-multiservices.com/vehicules-vente/jetour-t2-2026'));
  assert.strictEqual(json['@type'], 'Vehicle');
  assert.strictEqual(json.offers.price, 32000000);
  assert.strictEqual(json.offers.priceCurrency, 'XOF');
  assert.strictEqual(json.offers.availability, 'https://schema.org/InStock');
});

test('breadcrumbSchema builds an ordered list', () => {
  const json = JSON.parse(breadcrumbSchema([
    { name: 'Accueil', url: 'https://x/' }, { name: 'Véhicules', url: 'https://x/vehicules-vente' }
  ]));
  assert.strictEqual(json['@type'], 'BreadcrumbList');
  assert.strictEqual(json.itemListElement[0].position, 1);
  assert.strictEqual(json.itemListElement[1].position, 2);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/schema.test.js`
Expected: FAIL — Cannot find module '../lib/schema'.

- [ ] **Step 3: Implement `lib/schema.js`**

```js
const { CATEGORIES } = require('./categories');
const SITE = 'https://www.razak-multiservices.com';

function priceOf(item, key) {
  if (key === 'location') return item.priceDay;
  if (key === 'immobilier') return item.prix;
  if (key === 'ameublement') return item.prix;
  return item.price;
}

function productSchema(item, key, url) {
  const cfg = CATEGORIES[key];
  const price = priceOf(item, key);
  const img = (item.photos && item.photos[0]) || item.photo;
  const obj = {
    '@context': 'https://schema.org',
    '@type': cfg.schemaType,
    name: cfg.h1(item),
    description: cfg.description(item),
    url,
    image: img ? SITE + img : undefined,
    offers: {
      '@type': 'Offer',
      price: price == null ? undefined : price,
      priceCurrency: 'XOF',
      availability: item.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      url
    }
  };
  if (key === 'vente' || key === 'location') {
    obj.brand = { '@type': 'Brand', name: item.brand };
    obj.model = item.model;
    obj.vehicleModelDate = item.year;
  }
  return JSON.stringify(obj);
}

function breadcrumbSchema(crumbs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url }))
  });
}

module.exports = { productSchema, breadcrumbSchema, SITE };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/schema.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/schema.js test/schema.test.js
git commit -m "feat: Schema.org JSON-LD builders"
```

---

## Task 5: Coquille HTML partagée (`lib/render/layout.js`)

Réutilise le head SEO, GTM, la nav et le footer du site existant (repris de `vehicules-vente.html`). Le corps est injecté.

**Files:**
- Create: `lib/render/layout.js`, `test/layout.test.js`

- [ ] **Step 1: Write the failing tests** — `test/layout.test.js`

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/layout.test.js`
Expected: FAIL — Cannot find module '../lib/render/layout'.

- [ ] **Step 3: Implement `lib/render/layout.js`**

```js
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const NAV = `
<nav id="navbar"><div class="container"><div class="nav-inner">
  <a href="/" class="nav-logo"><img src="/images/logo-razack-transparent.png" alt="RAZAK Multi Service" style="height:75px;width:auto;object-fit:contain"></a>
  <ul class="nav-menu">
    <li class="nav-item"><a href="/" class="nav-link">Accueil</a></li>
    <li class="nav-item"><a href="/vehicules-vente" class="nav-link">Véhicules à vendre</a></li>
    <li class="nav-item"><a href="/vehicules-location" class="nav-link">Location</a></li>
    <li class="nav-item"><a href="/immobilier" class="nav-link">Immobilier</a></li>
    <li class="nav-item"><a href="/ameublement" class="nav-link">Ameublement</a></li>
    <li class="nav-item"><a href="/contact" class="nav-link">Contact</a></li>
  </ul>
  <button class="hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
</div></div></nav>`;

const FOOTER = `
<footer class="footer"><div class="container">
  <p class="footer-desc" style="text-align:center;padding:24px 0">© RAZAK Multi Service — Abidjan, Côte d'Ivoire · WhatsApp +225 07 97 38 82 02</p>
</div></footer>`;

function renderPage({ title, description, canonical, headExtra = '', main }) {
  return `<!DOCTYPE html>
<html lang="fr"><head>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KP7FCM8K');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="${esc(canonical)}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/responsive.css">
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
${headExtra}
</head><body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KP7FCM8K" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
${NAV}
${main}
${FOOTER}
<script src="/js/main.js"></script>
</body></html>`;
}

module.exports = { renderPage, esc };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/layout.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/render/layout.js test/layout.test.js
git commit -m "feat: shared HTML layout (SEO head + nav + footer)"
```

---

## Task 6: Page fiche produit (`lib/render/detail.js`)

**Files:**
- Create: `lib/render/detail.js`, `test/detail.test.js`

- [ ] **Step 1: Write the failing tests** — `test/detail.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { renderDetail } = require('../lib/render/detail');

const item = {
  id: 1, brand: 'JETOUR', model: 'T2 XWD TRAVEL', year: 2026, km: 92, fuel: 'Essence',
  transmission: 'Automatique', type: 'Pick-up', price: 32000000, color: 'NOIR', engine: '2.0L TURBO',
  doors: 4, status: 'available', desc: 'FULL OPTIONS\nDCT 7 vitesses', slug: 'jetour-t2-xwd-travel-2026',
  url: '/vehicules-vente/jetour-t2-xwd-travel-2026', category: 'vente',
  photos: ['/images/annonces/a.jpg', '/images/annonces/b.jpg']
};

test('renderDetail produces indexable HTML with price, specs, gallery, schema', () => {
  const html = renderDetail(item, 'vente', [], { available: true });
  assert.match(html, /<h1[^>]*>JETOUR T2 XWD TRAVEL 2026<\/h1>/);
  assert.match(html, /32 000 000 FCFA/);
  assert.match(html, /Kilométrage/);
  assert.match(html, /images\/annonces\/a\.jpg/);
  assert.match(html, /"@type":"Vehicle"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /wa\.me\/2250797388202/);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/vehicules-vente\/jetour-t2-xwd-travel-2026"/);
});

test('renderDetail marks a sold item and does not show InStock', () => {
  const sold = { ...item, status: 'sold' };
  const html = renderDetail(sold, 'vente', [], { available: false });
  assert.match(html, /Vendu/i);
  assert.match(html, /"availability":"https:\/\/schema\.org\/SoldOut"/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/detail.test.js`
Expected: FAIL — Cannot find module '../lib/render/detail'.

- [ ] **Step 3: Implement `lib/render/detail.js`**

```js
const { renderPage, esc } = require('./layout');
const { CATEGORIES } = require('../categories');
const { productSchema, breadcrumbSchema, SITE } = require('../schema');

const WA = 'https://wa.me/2250797388202?text=';

function gallery(item) {
  const photos = (item.photos && item.photos.length ? item.photos : [item.photo]).filter(Boolean);
  if (!photos.length) return '<div class="detail-noimg">Photo à venir</div>';
  return `<div class="detail-gallery">${photos.map((p, i) =>
    `<img src="${esc(p)}" alt="${esc(item.slug.replace(/-/g, ' '))} — photo ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" width="800" height="600" style="max-width:100%">`
  ).join('')}</div>`;
}

function renderDetail(item, key, related, opts) {
  const cfg = CATEGORIES[key];
  const canonical = SITE + item.url;
  const specs = cfg.specs(item).map(s => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join('');
  const sold = item.status === 'sold';
  const waMsg = encodeURIComponent(`Bonjour RAZAK, je suis intéressé par : ${cfg.h1(item)} (${canonical})`);
  const crumbs = [
    { name: 'Accueil', url: SITE + '/' },
    { name: cfg.label, url: SITE + '/' + cfg.urlBase },
    { name: cfg.h1(item), url: canonical }
  ];
  const relatedHtml = related.length
    ? `<section class="section"><div class="container"><h2>Articles similaires</h2><div class="listing-grid">${
        related.map(r => `<a class="listing-card" href="${esc(r.url)}"><div class="listing-body"><div class="listing-title">${esc(CATEGORIES[r.category].h1(r))}</div></div></a>`).join('')
      }</div></div></section>`
    : '';
  const headExtra = `<script type="application/ld+json">${productSchema(item, key, canonical)}</script>
<script type="application/ld+json">${breadcrumbSchema(crumbs)}</script>`;
  const main = `
<section class="page-hero" style="min-height:auto;padding:32px 0"><div class="container"><div class="page-breadcrumb">
  <a href="/">Accueil</a> › <a href="/${cfg.urlBase}">${esc(cfg.label)}</a> › <span class="current">${esc(cfg.h1(item))}</span>
</div></div></section>
<section class="section"><div class="container" style="display:grid;grid-template-columns:1.4fr 1fr;gap:32px;align-items:start">
  <div>${gallery(item)}</div>
  <div>
    <h1 style="font-family:var(--font-display);color:var(--navy)">${esc(cfg.h1(item))}</h1>
    ${sold ? '<p style="color:var(--red);font-weight:700">Vendu — voir les articles similaires ci-dessous</p>' : ''}
    <table class="detail-specs" style="width:100%;border-collapse:collapse;margin:16px 0">${specs}</table>
    ${item.desc ? `<div class="detail-desc">${esc(item.desc).replace(/\n/g, '<br>')}</div>` : ''}
    ${sold ? '' : `<a href="${WA}${waMsg}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg btn-full" style="margin-top:16px">📱 Contacter sur WhatsApp</a>`}
  </div>
</div></section>
${relatedHtml}`;
  return renderPage({ title: cfg.title(item), description: cfg.description(item), canonical, headExtra, main });
}

module.exports = { renderDetail };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/detail.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/render/detail.js test/detail.test.js
git commit -m "feat: product detail page renderer (specs, gallery, schema, WhatsApp)"
```

---

## Task 7: Landing pages avec garde-fou (`lib/render/landing.js`)

**Files:**
- Create: `lib/render/landing.js`, `test/landing.test.js`

- [ ] **Step 1: Write the failing tests** — `test/landing.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { renderLanding, landingUrl } = require('../lib/render/landing');

const items = [
  { slug: 'a', url: '/vehicules-vente/a', category: 'vente', brand: 'Toyota', model: 'Hilux', year: 2021, price: 18900000, type: 'Pick-up', photos: ['/images/annonces/a.jpg'] }
];

test('landingUrl builds a slugged path under the category', () => {
  assert.strictEqual(landingUrl('vente', 'type', 'Pick-up'), '/voitures/pick-up');
  assert.strictEqual(landingUrl('immobilier', 'quartier', 'Cocody'), '/immobilier/cocody');
});

test('renderLanding lists items and includes intro + h1', () => {
  const html = renderLanding('vente', 'type', 'Pick-up', items);
  assert.match(html, /<h1[^>]*>.*Pick-up.*<\/h1>/i);
  assert.match(html, /vehicules-vente\/a/);
  assert.match(html, /canonical" href="https:\/\/www\.razak-multiservices\.com\/voitures\/pick-up"/);
});

test('renderLanding throws on empty group (no thin pages)', () => {
  assert.throws(() => renderLanding('vente', 'type', 'Pick-up', []), /empty/i);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/landing.test.js`
Expected: FAIL — Cannot find module '../lib/render/landing'.

- [ ] **Step 3: Implement `lib/render/landing.js`**

```js
const { renderPage, esc } = require('./layout');
const { CATEGORIES, fmtPrice } = require('../categories');
const { SITE } = require('../schema');
const { slugify } = require('../slugify');

const URL_BASE = { vente: 'voitures', location: 'location', immobilier: 'immobilier', ameublement: 'ameublement' };

function landingUrl(key, field, value) {
  return `/${URL_BASE[key]}/${slugify(value)}`;
}

function card(item) {
  const cfg = CATEGORIES[item.category];
  const img = (item.photos && item.photos[0]) || item.photo || '';
  return `<a class="listing-card" href="${esc(item.url)}">
    ${img ? `<div class="listing-image"><img src="${esc(img)}" alt="${esc(cfg.h1(item))}" loading="lazy" style="width:100%"></div>` : ''}
    <div class="listing-body"><div class="listing-title">${esc(cfg.h1(item))}</div></div></a>`;
}

function renderLanding(key, field, value, items) {
  if (!items || !items.length) throw new Error('refuse to render empty landing page (thin content guard)');
  const cfg = CATEGORIES[key];
  const url = landingUrl(key, field, value);
  const canonical = SITE + url;
  const h1 = `${cfg.label} — ${value} à Abidjan`;
  const intro = `Découvrez notre sélection de <strong>${esc(cfg.label.toLowerCase())}</strong> catégorie « ${esc(value)} » à Abidjan chez RAZAK Multi Service. ${items.length} article${items.length > 1 ? 's' : ''} disponible${items.length > 1 ? 's' : ''}, prix transparents, contact direct WhatsApp au +225 07 97 38 82 02.`;
  const main = `
<section class="page-hero" style="min-height:auto;padding:40px 0"><div class="container">
  <div class="page-breadcrumb"><a href="/">Accueil</a> › <a href="/${cfg.urlBase}">${esc(cfg.label)}</a> › <span class="current">${esc(value)}</span></div>
  <h1>${esc(h1)}</h1></div></section>
<section class="section"><div class="container"><p style="max-width:820px;margin-bottom:24px">${intro}</p>
  <div class="listing-grid">${items.map(card).join('')}</div></div></section>`;
  return renderPage({
    title: `${h1} | RAZAK Multi Service`,
    description: `${cfg.label} « ${value} » à Abidjan — ${items.length} articles chez RAZAK Multi Service. Prix, photos, contact WhatsApp.`,
    canonical, main
  });
}

module.exports = { renderLanding, landingUrl, URL_BASE };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/landing.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/render/landing.js test/landing.test.js
git commit -m "feat: landing pages with thin-content guard"
```

---

## Task 8: Sitemap (`lib/sitemap.js`)

**Files:**
- Create: `lib/sitemap.js`, `test/sitemap.test.js`

- [ ] **Step 1: Write the failing tests** — `test/sitemap.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildSitemap } = require('../lib/sitemap');

test('buildSitemap wraps urls in valid xml with absolute www loc', () => {
  const xml = buildSitemap([{ path: '/', priority: '1.0' }, { path: '/vehicules-vente/x', priority: '0.8' }], '2026-06-14');
  assert.match(xml, /^<\?xml/);
  assert.match(xml, /<loc>https:\/\/www\.razak-multiservices\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.razak-multiservices\.com\/vehicules-vente\/x<\/loc>/);
  assert.match(xml, /<lastmod>2026-06-14<\/lastmod>/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/sitemap.test.js`
Expected: FAIL — Cannot find module '../lib/sitemap'.

- [ ] **Step 3: Implement `lib/sitemap.js`**

```js
const SITE = 'https://www.razak-multiservices.com';

function buildSitemap(entries, lastmod) {
  const urls = entries.map(e =>
    `  <url><loc>${SITE}${e.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${e.changefreq || 'weekly'}</changefreq><priority>${e.priority || '0.6'}</priority></url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

module.exports = { buildSitemap };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/sitemap.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sitemap.js test/sitemap.test.js
git commit -m "feat: sitemap builder"
```

---

## Task 9: Copie des fichiers statiques (`lib/copy-static.js`)

Copie tout le repo vers `dist/` SAUF les dossiers de dev/génération. Les pages générées seront écrites par-dessus par `build.js`.

**Files:**
- Create: `lib/copy-static.js`, `test/copy-static.test.js`

- [ ] **Step 1: Write the failing tests** — `test/copy-static.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { copyStatic, EXCLUDES } = require('../lib/copy-static');

test('EXCLUDES contains dev/build dirs', () => {
  for (const d of ['.git', 'node_modules', 'dist', 'docs']) assert.ok(EXCLUDES.has(d));
});

test('copyStatic copies files but skips excluded dirs', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'dst-'));
  fs.writeFileSync(path.join(src, 'index.html'), 'hi');
  fs.mkdirSync(path.join(src, 'node_modules'));
  fs.writeFileSync(path.join(src, 'node_modules', 'x.js'), 'nope');
  copyStatic(src, dst);
  assert.ok(fs.existsSync(path.join(dst, 'index.html')));
  assert.ok(!fs.existsSync(path.join(dst, 'node_modules')));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/copy-static.test.js`
Expected: FAIL — Cannot find module '../lib/copy-static'.

- [ ] **Step 3: Implement `lib/copy-static.js`**

```js
const fs = require('node:fs');
const path = require('node:path');

const EXCLUDES = new Set(['.git', 'node_modules', 'dist', 'docs', '.vercel']);

function copyStatic(srcDir, dstDir, root = true) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (root && EXCLUDES.has(name)) continue;
    const s = path.join(srcDir, name);
    const d = path.join(dstDir, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyStatic(s, d, false);
    else fs.copyFileSync(s, d);
  }
}

module.exports = { copyStatic, EXCLUDES };
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/copy-static.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/copy-static.js test/copy-static.test.js
git commit -m "feat: static file copier for dist output"
```

---

## Task 10: Orchestrateur (`build.js`) + test d'intégration

**Files:**
- Create: `build.js`, `test/build.integration.test.js`

- [ ] **Step 1: Write the failing integration test** — `test/build.integration.test.js`

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/build.integration.test.js`
Expected: FAIL — Cannot find module 'build.js' / dist missing.

- [ ] **Step 3: Implement `build.js`**

```js
const fs = require('node:fs');
const path = require('node:path');
const { CATEGORIES } = require('./lib/categories');
const { loadCategory, groupItems } = require('./lib/data');
const { renderDetail } = require('./lib/render/detail');
const { renderLanding, landingUrl } = require('./lib/render/landing');
const { buildSitemap } = require('./lib/sitemap');
const { copyStatic } = require('./lib/copy-static');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const TODAY = new Date().toISOString().slice(0, 10);

function writePage(urlPath, html) {
  const file = path.join(DIST, urlPath.replace(/^\//, '') + '.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
}

function run() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  copyStatic(ROOT, DIST);

  const sitemap = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/vehicules-vente', priority: '0.9' }, { path: '/vehicules-location', priority: '0.8' },
    { path: '/immobilier', priority: '0.9' }, { path: '/ameublement', priority: '0.8' },
    { path: '/vendre-vehicule', priority: '0.6' }, { path: '/about', priority: '0.5' },
    { path: '/directeur', priority: '0.5' }, { path: '/contact', priority: '0.7' }
  ];

  for (const key of Object.keys(CATEGORIES)) {
    const cfg = CATEGORIES[key];
    const items = loadCategory(key);

    // detail pages
    for (const item of items) {
      const related = items.filter(r => r.slug !== item.slug && r[cfg.groupBy] === item[cfg.groupBy] && r.status !== 'sold').slice(0, 3);
      writePage(item.url, renderDetail(item, key, related, { available: item.status !== 'sold' }));
      sitemap.push({ path: item.url, priority: '0.7', changefreq: 'weekly' });
    }

    // landing pages (only groups with >=1 item)
    for (const [value, group] of groupItems(items, cfg.groupBy)) {
      const url = landingUrl(key, cfg.groupBy, value);
      writePage(url, renderLanding(key, cfg.groupBy, value, group));
      sitemap.push({ path: url, priority: '0.7', changefreq: 'weekly' });
    }
    console.log(`[build] ${key}: ${items.length} fiches + ${groupItems(items, cfg.groupBy).size} landing`);
  }

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(sitemap, TODAY), 'utf8');
  console.log(`[build] sitemap: ${sitemap.length} URLs → dist/`);
}

run();
```

- [ ] **Step 4: Run the full suite to verify pass**

Run: `node --test`
Expected: PASS — all suites (including the integration build).

- [ ] **Step 5: Manually inspect one generated page**

Run: `node -e "console.log(require('fs').readFileSync('dist/vehicules-vente/'+require('fs').readdirSync('dist/vehicules-vente')[0]).toString().slice(0,600))"`
Expected: valid HTML `<!DOCTYPE html>` with `<title>`, canonical, `<h1>`.

- [ ] **Step 6: Commit**

```bash
git add build.js test/build.integration.test.js
git commit -m "feat: build orchestrator generating detail + landing pages + sitemap"
```

---

## Task 11: Maillage — les cartes des catalogues pointent vers les fiches

Les pages catalogue rendent les cartes en JS. On rend chaque carte cliquable vers `item.url`. Comme les JSON n'ont pas encore `slug`/`url`, on calcule le slug côté client avec la même logique.

**Files:**
- Create: `js/slug.js` (copie navigateur de la logique slug)
- Modify: `vehicules-vente.html`, `vehicules-location.html`, `immobilier.html`, `ameublement.html` (fonctions de rendu des cartes)

- [ ] **Step 1: Create `js/slug.js`** (chargée avant le script de chaque catalogue)

```js
function slugify(str){return String(str==null?'':str).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function itemUrl(v,cat){
  if(cat==='vehicules-vente'||cat==='vehicules-location') return '/'+cat+'/'+slugify(v.brand+' '+v.model+' '+v.year);
  return '/'+cat+'/'+slugify(v.titre||'');
}
```

- [ ] **Step 2: In `vehicules-vente.html`**, add `<script src="js/slug.js"></script>` before the inline catalog script, and wrap each rendered card so its title links to the detail page.

Find the card title render (in `renderCard`/grid map) and change the title line to a link. Concretely, wrap the card markup's title in:

```js
`<a href="${itemUrl(v,'vehicules-vente')}" class="listing-title-link">${v.brand} ${v.model}</a>`
```

and make the whole card's primary CTA include a "Voir la fiche" link:

```js
`<a href="${itemUrl(v,'vehicules-vente')}" class="btn btn-outline btn-sm btn-full">Voir la fiche</a>`
```

- [ ] **Step 3: Repeat Step 2 pattern** in `vehicules-location.html` (cat `'vehicules-location'`), `immobilier.html` (cat `'immobilier'`, title `v.titre`), `ameublement.html` (cat `'ameublement'`, title `m.titre`). Each: add `<script src="js/slug.js"></script>` and add a `Voir la fiche` link using `itemUrl(item, '<cat>')`.

- [ ] **Step 4: Verify the slug JS matches the build slug** — quick Node check:

Run: `node -e "const {slugify}=require('./lib/slugify'); console.log(slugify('JETOUR T2 XWD TRAVEL 2026'))"`
Expected: `jetour-t2-xwd-travel-2026` (must equal the browser `slugify` output — they use identical logic).

- [ ] **Step 5: Commit**

```bash
git add js/slug.js vehicules-vente.html vehicules-location.html immobilier.html ameublement.html
git commit -m "feat: catalog cards link to generated detail pages (internal linking)"
```

---

## Task 12: Config build Cloudflare Pages

Le build local marche. On configure Cloudflare Pages pour exécuter `npm run build` et servir `dist/`. Le `sitemap.xml` racine existant sera écrasé par la version générée (plus complète) — c'est voulu.

**Files:**
- Modify: `package.json` (déjà `build` défini) — s'assurer que `node >=18` via `engines`.

- [ ] **Step 1: Add `engines` to `package.json`**

```json
{
  "engines": { "node": ">=18" }
}
```
(fusionner dans le `package.json` existant)

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: pin node >=18 for Cloudflare build"
```

- [ ] **Step 3: Push the branch to trigger a Cloudflare PREVIEW build**

```bash
git push -u origin feat/seo-pages
```

- [ ] **Step 4: (Dashboard) Configure the build** — dans Cloudflare Pages → projet `razack-multi-service` → **Settings → Builds & deployments** :
  - Build command : `npm run build`
  - Build output directory : `dist`
  - (Production branch reste `main`.)
  Enregistrer. Cloudflare relance un déploiement (la branche `feat/seo-pages` produit une **preview** distincte de la prod).

> ⚠️ Tant que la config build n'est pas posée, la prod (`main`) continue de servir le site actuel sans build. La bascule prod se fait en Task 13 après validation.

---

## Task 13: Vérification preview + bascule production

- [ ] **Step 1: Récupérer l'URL de preview** de la branche `feat/seo-pages` (dashboard Pages → Deployments → le déploiement de la branche → `https://feat-seo-pages.razack-multi-service.pages.dev`).

- [ ] **Step 2: Vérifier les pages générées (HTTP brut)** — remplacer `<PREVIEW>` par l'URL :

Run (PowerShell):
```powershell
$b='<PREVIEW>'
foreach($u in @('/','/vehicules-vente/jetour-t2-xwd-travel-2026','/voitures/pick-up','/sitemap.xml')){
  try{$r=Invoke-WebRequest -Uri ($b+$u) -UseBasicParsing;("{0,-45} {1}" -f $u,$r.StatusCode)}catch{("{0} ERR {1}" -f $u,$_.Exception.Message)}
}
```
Expected: chaque URL → **200**. Vérifier qu'une fiche contient `<h1>`, prix, canonical, JSON-LD (ouvrir la source).

- [ ] **Step 3: Vérifier que le site existant est intact sur la preview** (accueil, catalogues chargent, images s'affichent). Comparer visuellement à la prod.

- [ ] **Step 4: Merge vers `main` pour basculer la prod**

```bash
git checkout main
git pull --rebase origin main
git merge feat/seo-pages
git push origin main
```

- [ ] **Step 5: Vérifier la prod après déploiement** (attendre ~1-2 min) :

Run (PowerShell):
```powershell
$b='https://www.razak-multiservices.com'
foreach($u in @('/vehicules-vente/jetour-t2-xwd-travel-2026','/voitures/pick-up','/sitemap.xml')){
  $r=Invoke-WebRequest -Uri ($b+$u) -UseBasicParsing; "{0,-45} {1} | serveur {2}" -f $u,$r.StatusCode,$r.Headers['Server']
}
```
Expected: 200, `serveur cloudflare`, sitemap contenant les nouvelles URLs.

- [ ] **Step 6: Google Search Console** — resoumettre `https://www.razak-multiservices.com/sitemap.xml` ; demander l'indexation de 3-4 fiches phares. (Action manuelle utilisateur.)

- [ ] **Step 7: Commit final de doc** (mettre à jour la spéc statut = livré Phase 1) — optionnel.

---

## Self-Review (couverture spéc)

- Fiches produits (spéc §3.1) → Tasks 5-6, 10. ✅
- Landing catégorie/quartier + garde ≥1 (spéc §3.2, §5) → Task 7, 10. ✅
- Blog (spéc §3.3) → **hors Phase 1** (plan séparé Phase 2). Noté.
- Moteur build.js / dist / Cloudflare (spéc §4) → Tasks 9-10, 12. ✅
- URLs stables (spéc §4) → Task 1 (slugs figés + dédup). ✅
- Schema.org / canonical / OG / sitemap / maillage (spéc §5) → Tasks 4, 5-6, 8, 11. ✅
- Garde-fous anti-thin + vendus (spéc §5) → Task 7 (throw si vide), Task 6 (SoldOut + page conservée). ✅
- Sécurité preview→prod (spéc §4) → Tasks 12-13. ✅

Types cohérents : `item.url`/`item.slug` posés en Task 3, consommés Tasks 6-7-10 ; `CATEGORIES[key]` (Task 2) consommé partout ; `landingUrl` (Task 7) réutilisé Task 10. Aucun placeholder.

**Hors périmètre Phase 1 (plans suivants) :** blog (Phase 2) ; saisie de l'inventaire Drive par Razack via admin.html (Phase 3, opérationnel).
