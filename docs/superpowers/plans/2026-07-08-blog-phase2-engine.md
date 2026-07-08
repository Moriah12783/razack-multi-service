# Blog Phase 2 — Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un moteur de blog au générateur existant : générer `/blog` (index) + `/blog/<slug>` (articles Markdown) avec Schema.org Article, maillage vers les fiches, et un premier article témoin — le tout au build Cloudflare, sans casser l'existant.

**Architecture:** Extension du moteur Phase 1 (Node natif). Articles = fichiers Markdown `content/blog/*.md` avec frontmatter ; `lib/blog.js` les charge (mini-parseur frontmatter + `marked` pour le corps) ; `lib/render/article.js` et `lib/render/blog-index.js` produisent les pages via le `layout` partagé ; `build.js` génère les pages + entrées sitemap ; un lien « Blog » est ajouté à la nav.

**Tech Stack:** Node.js ≥18, `node:test`, **`marked`** (1 dépendance build-time, MD→HTML).

**Prérequis d'exécution :** branche dédiée `feat/blog` (pas `main`). Environnement : Windows, Node v24, npm 11.

## À LIRE AVANT DE CODER (aligner sur la Phase 1)
Lire ces fichiers existants et réutiliser leurs signatures **exactes** :
- `lib/render/layout.js` — `renderPage({ title, description, canonical, headExtra, main, image })` : le param `image` (ajouté en Phase 1) émet déjà `<meta property="og:image">` quand fourni. La constante `NAV` contient les liens de navigation.
- `lib/render/detail.js` — modèle de référence pour : passer `image` à `renderPage`, mettre le JSON-LD (`productSchema`/`breadcrumbSchema`) dans `headExtra`, utiliser `esc()`.
- `lib/schema.js` — exporte `SITE` (= `https://www.razak-multiservices.com`) et `breadcrumbSchema(crumbs)`. **Réutiliser** ces exports.
- `build.js` — la fonction `writePage(urlPath, html)` et le tableau `sitemap` existent déjà ; on s'y greffe.

---

## Structure des fichiers (ce plan)

| Fichier | Responsabilité |
|---|---|
| `lib/blog.js` | parse frontmatter + charge/trie les articles (`marked` pour le corps) |
| `lib/render/article.js` | page article (cover/gradient + corps + Article JSON-LD + CTA) |
| `lib/render/blog-index.js` | page `/blog` (liste des cartes) |
| `lib/schema.js` (modif) | ajouter `articleSchema(article, url)` |
| `lib/render/layout.js` (modif) | ajouter le lien « Blog » à `NAV` |
| `build.js` (modif) | générer `/blog` + `/blog/<slug>` + entrées sitemap |
| `content/blog/*.md` | les articles (1 témoin ici) |
| `package.json` / `package-lock.json` (modif) | dépendance `marked` |
| `test/*.test.js` | tests unitaires + intégration |

---

## Task 0: Dépendance `marked`

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `test/marked.test.js`

- [ ] **Step 1: Créer la branche & installer marked**

```bash
git checkout -b feat/blog
npm install marked@^12
```
Expected: `package.json` gagne `"dependencies": { "marked": "^12..." }` et un `package-lock.json` est créé/à jour.

- [ ] **Step 2: Écrire le test** — `test/marked.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { marked } = require('marked');

test('marked convertit du markdown en HTML', () => {
  const html = marked.parse('# Titre\n\nUn **para**.');
  assert.match(html, /<h1[^>]*>Titre<\/h1>/);
  assert.match(html, /<strong>para<\/strong>/);
});
```

- [ ] **Step 3: Lancer le test**

Run: `node --test test/marked.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json test/marked.test.js
git commit -m "chore: add marked (build-time markdown->html)"
```

---

## Task 1: Chargement des articles (`lib/blog.js`)

**Files:**
- Create: `lib/blog.js`, `test/blog.test.js`

- [ ] **Step 1: Écrire les tests** — `test/blog.test.js`

```js
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
```

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/blog.test.js`
Expected: FAIL — Cannot find module '../lib/blog'.

- [ ] **Step 3: Implémenter `lib/blog.js`**

```js
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const BLOG_DIR = path.join(__dirname, '..', 'content', 'blog');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

function excerptOf(meta, body) {
  if (meta.description) return meta.description;
  return body.replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function loadArticles(dir = BLOG_DIR) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const arts = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = f.replace(/\.md$/, '');
    return {
      slug, url: `/blog/${slug}`,
      title: meta.title || slug,
      description: meta.description || '',
      date: meta.date || '',
      cover: meta.cover || '',
      tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
      html: marked.parse(body),
      excerpt: excerptOf(meta, body)
    };
  });
  return arts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

module.exports = { parseFrontmatter, loadArticles, excerptOf, BLOG_DIR };
```

- [ ] **Step 4: Lancer → succès**

Run: `node --test test/blog.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/blog.js test/blog.test.js
git commit -m "feat: blog article loader (frontmatter + marked + sort)"
```

---

## Task 2: `articleSchema` (`lib/schema.js`)

**Files:**
- Modify: `lib/schema.js` (ajouter la fonction + l'exporter)
- Create: `test/article-schema.test.js`

- [ ] **Step 1: Écrire le test** — `test/article-schema.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { articleSchema } = require('../lib/schema');

test('articleSchema produit un Article valide avec auteur RAZAK', () => {
  const a = { title: 'Guide', description: 'desc', date: '2026-07-08', cover: '/images/blog/x.jpg' };
  const j = JSON.parse(articleSchema(a, 'https://www.razak-multiservices.com/blog/guide'));
  assert.strictEqual(j['@type'], 'Article');
  assert.strictEqual(j.headline, 'Guide');
  assert.strictEqual(j.datePublished, '2026-07-08');
  assert.strictEqual(j.author.name, 'RAZAK Multi Service');
  assert.strictEqual(j.image, 'https://www.razak-multiservices.com/images/blog/x.jpg');
});

test('articleSchema retombe sur og-image par défaut si pas de cover', () => {
  const j = JSON.parse(articleSchema({ title: 'G', description: 'd', date: '2026-07-08', cover: '' }, 'https://www.razak-multiservices.com/blog/g'));
  assert.strictEqual(j.image, 'https://www.razak-multiservices.com/images/og-image.jpg');
});
```

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/article-schema.test.js`
Expected: FAIL — `articleSchema` is not a function.

- [ ] **Step 3: Ajouter à `lib/schema.js`** (à côté de `breadcrumbSchema`, avant `module.exports`)

```js
function articleSchema(a, url) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date || undefined,
    dateModified: a.date || undefined,
    image: a.cover ? SITE + a.cover : SITE + '/images/og-image.jpg',
    author: { '@type': 'Organization', name: 'RAZAK Multi Service' },
    publisher: {
      '@type': 'Organization', name: 'RAZAK Multi Service',
      logo: { '@type': 'ImageObject', url: SITE + '/images/logo-razack-transparent.png' }
    },
    mainEntityOfPage: url
  });
}
```
Et l'ajouter à l'export : `module.exports = { productSchema, breadcrumbSchema, articleSchema, SITE };`

- [ ] **Step 4: Lancer → succès**

Run: `node --test test/article-schema.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/schema.js test/article-schema.test.js
git commit -m "feat: Article JSON-LD schema"
```

---

## Task 3: Page article (`lib/render/article.js`)

**Files:**
- Create: `lib/render/article.js`, `test/article.test.js`

- [ ] **Step 1: Écrire les tests** — `test/article.test.js`

```js
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
```

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/article.test.js`
Expected: FAIL — Cannot find module '../lib/render/article'.

- [ ] **Step 3: Implémenter `lib/render/article.js`** (réutiliser `renderPage`, `esc`, `SITE`, `breadcrumbSchema`, `articleSchema` — cf. section « À LIRE AVANT DE CODER »)

```js
const { renderPage, esc } = require('./layout');
const { articleSchema, breadcrumbSchema, SITE } = require('../schema');

function renderArticle(a) {
  const canonical = SITE + a.url;
  const img = a.cover ? SITE + a.cover : SITE + '/images/og-image.jpg';
  const crumbs = [
    { name: 'Accueil', url: SITE + '/' },
    { name: 'Blog', url: SITE + '/blog' },
    { name: a.title, url: canonical }
  ];
  const headExtra = `<meta property="article:published_time" content="${esc(a.date)}">
<script type="application/ld+json">${articleSchema(a, canonical)}</script>
<script type="application/ld+json">${breadcrumbSchema(crumbs)}</script>`;
  const header = a.cover
    ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" style="width:100%;max-height:420px;object-fit:cover;border-radius:var(--radius-md)" loading="eager" width="1200" height="480">
       <h1 style="font-family:var(--font-display);color:var(--navy);margin-top:24px">${esc(a.title)}</h1>`
    : `<div style="background:linear-gradient(135deg,var(--navy),var(--gold));color:#fff;padding:56px 32px;border-radius:var(--radius-md)">
         <h1 style="color:#fff;font-family:var(--font-display);margin:0">${esc(a.title)}</h1></div>`;
  const main = `
<section class="section"><div class="container" style="max-width:820px">
  <div class="page-breadcrumb"><a href="/">Accueil</a> › <a href="/blog">Blog</a> › <span class="current">${esc(a.title)}</span></div>
  ${header}
  ${a.date ? `<p style="color:var(--gray-400);font-size:.85rem;margin:12px 0 24px">Publié le ${esc(a.date)}</p>` : ''}
  <div class="article-body" style="line-height:1.8;color:var(--gray-700,#374151)">${a.html}</div>
  <div style="margin-top:40px;padding:28px;background:var(--off-white);border-radius:var(--radius-md);text-align:center">
    <p style="margin-bottom:14px;font-weight:600;color:var(--navy)">Un projet auto à Abidjan ? RAZAK Multi Service vous accompagne.</p>
    <a href="https://wa.me/2250797388202" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg">📱 Contacter sur WhatsApp</a>
  </div>
</div></section>`;
  return renderPage({ title: `${a.title} | RAZAK Multi Service`, description: a.description, canonical, image: img, headExtra, main });
}

module.exports = { renderArticle };
```

> Note : `renderPage` accepte `image` (Phase 1) et émet `og:image`. Si la signature réelle diffère, s'aligner sur `lib/render/detail.js`.

- [ ] **Step 4: Lancer → succès**

Run: `node --test test/article.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/render/article.js test/article.test.js
git commit -m "feat: article page renderer (schema, breadcrumb, CTA, cover/gradient)"
```

---

## Task 4: Index blog (`lib/render/blog-index.js`)

**Files:**
- Create: `lib/render/blog-index.js`, `test/blog-index.test.js`

- [ ] **Step 1: Écrire les tests** — `test/blog-index.test.js`

```js
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
```

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/blog-index.test.js`
Expected: FAIL — Cannot find module '../lib/render/blog-index'.

- [ ] **Step 3: Implémenter `lib/render/blog-index.js`**

```js
const { renderPage, esc } = require('./layout');
const { SITE } = require('../schema');

function card(a) {
  const media = a.cover
    ? `<div class="listing-image"><img src="${esc(a.cover)}" alt="${esc(a.title)}" loading="lazy" style="width:100%"></div>`
    : `<div class="listing-image" style="background:linear-gradient(135deg,var(--navy),var(--gold))"></div>`;
  return `<a class="listing-card" href="${esc(a.url)}">
    ${media}
    <div class="listing-body">
      <div class="listing-title">${esc(a.title)}</div>
      ${a.date ? `<div style="font-size:.78rem;color:var(--gray-400);margin:4px 0">${esc(a.date)}</div>` : ''}
      <p style="font-size:.88rem;color:var(--gray-600);line-height:1.5">${esc(a.excerpt)}</p>
    </div></a>`;
}

function renderBlogIndex(arts) {
  const canonical = SITE + '/blog';
  const main = `
<section class="page-hero" style="min-height:auto;padding:40px 0"><div class="container">
  <div class="page-breadcrumb"><a href="/">Accueil</a> › <span class="current">Blog</span></div>
  <h1>Blog — conseils auto, immobilier & ameublement à Abidjan</h1>
  <p>Guides pratiques de RAZAK Multi Service pour acheter, louer, vendre et s'équiper à Abidjan en toute confiance.</p>
</div></section>
<section class="section"><div class="container"><div class="listing-grid">${arts.map(card).join('')}</div></div></section>`;
  return renderPage({
    title: 'Blog RAZAK Multi Service — conseils auto, immobilier & ameublement à Abidjan',
    description: 'Guides pratiques pour acheter, louer, vendre un véhicule, un bien immobilier ou des meubles à Abidjan. Conseils fiables par RAZAK Multi Service.',
    canonical, main
  });
}

module.exports = { renderBlogIndex };
```

- [ ] **Step 4: Lancer → succès**

Run: `node --test test/blog-index.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/render/blog-index.js test/blog-index.test.js
git commit -m "feat: blog index page renderer"
```

---

## Task 5: Lien « Blog » dans la navigation (`lib/render/layout.js`)

**Files:**
- Modify: `lib/render/layout.js` (constante `NAV`)
- Create: `test/nav-blog.test.js`

- [ ] **Step 1: Écrire le test** — `test/nav-blog.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { renderPage } = require('../lib/render/layout');

test('la navigation contient un lien Blog', () => {
  const html = renderPage({ title: 't', description: 'd', canonical: 'https://www.razak-multiservices.com/x', main: '<p>x</p>' });
  assert.match(html, /<a href="\/blog"[^>]*>Blog<\/a>/);
});
```

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/nav-blog.test.js`
Expected: FAIL — pas de lien Blog.

- [ ] **Step 3: Modifier `NAV` dans `lib/render/layout.js`** — ajouter, juste avant l'item Contact, la ligne :

```html
<li class="nav-item"><a href="/blog" class="nav-link">Blog</a></li>
```
(insérer dans la liste `<ul class="nav-menu">` de la constante `NAV`, avant `<li class="nav-item"><a href="/contact" ...>`)

- [ ] **Step 4: Lancer → succès**

Run: `node --test test/nav-blog.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/render/layout.js test/nav-blog.test.js
git commit -m "feat: add Blog link to global nav"
```

---

## Task 6: Génération dans `build.js` + intégration

**Files:**
- Modify: `build.js`
- Modify: `test/build.integration.test.js` (ajouter des assertions blog)

- [ ] **Step 1: Ajouter les assertions blog au test d'intégration** — dans `test/build.integration.test.js`, ajouter un test (après le build déjà déclenché) :

```js
test('build.js génère /blog et les pages articles + sitemap', () => {
  const dist = path.join(__dirname, '..', 'dist');
  assert.ok(fs.existsSync(path.join(dist, 'blog.html')), 'index /blog généré');
  const arts = fs.readdirSync(path.join(dist, 'blog')).filter(f => f.endsWith('.html'));
  assert.ok(arts.length >= 1, 'au moins 1 article généré');
  const sm = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  assert.match(sm, /\/blog<\/loc>/);
  assert.match(sm, /\/blog\//);
});
```
> Note : si le test d'intégration construit via un hook `before`, ajouter cette assertion dans le même fichier après le build.

- [ ] **Step 2: Lancer → échec**

Run: `node --test test/build.integration.test.js`
Expected: FAIL — `dist/blog.html` absent.

- [ ] **Step 3: Modifier `build.js`** — importer les modules blog en tête :

```js
const { loadArticles } = require('./lib/blog');
const { renderArticle } = require('./lib/render/article');
const { renderBlogIndex } = require('./lib/render/blog-index');
```

Puis, dans la fonction de build, **après** la génération des catégories et **avant** l'écriture du sitemap, ajouter :

```js
  // Blog
  const articles = loadArticles();
  if (articles.length) {
    writePage('/blog', renderBlogIndex(articles));
    sitemap.push({ path: '/blog', priority: '0.6', changefreq: 'weekly' });
    for (const a of articles) {
      writePage(a.url, renderArticle(a));
      sitemap.push({ path: a.url, priority: '0.6', changefreq: 'monthly' });
    }
    console.log(`[build] blog: ${articles.length} articles + /blog`);
  }
```

- [ ] **Step 4: Lancer la suite complète → succès**

Run: `node --test`
Expected: PASS (toutes les suites). Note : tant qu'aucun article n'existe, `/blog` n'est pas généré — la Task 7 crée le 1er article, donc lancer ce test APRÈS la Task 7, ou créer d'abord un article témoin minimal. **Pour ne pas bloquer :** exécuter la Task 7 avant de relancer ce test d'intégration.

- [ ] **Step 5: Commit**

```bash
git add build.js test/build.integration.test.js
git commit -m "feat: generate blog index + article pages + sitemap entries"
```

---

## Task 7: Premier article témoin (contenu)

**Files:**
- Create: `content/blog/acheter-voiture-occasion-abidjan.md`

Brief de rédaction (l'implémenteur RÉDIGE le contenu français, ~1000-1400 mots) :
- **Frontmatter :**
  ```
  ---
  title: Acheter une voiture d'occasion à Abidjan : le guide complet
  description: Vérifications mécaniques, papiers, pièges à éviter et bons réflexes pour acheter une voiture d'occasion à Abidjan en toute sérénité.
  date: 2026-07-08
  cover:
  tags: [automobile, achat, occasion, abidjan]
  ---
  ```
  (laisser `cover:` vide → header dégradé auto)
- **Plan (titres H2) :** Pourquoi l'occasion à Abidjan · Définir son budget et son usage · Les vérifications essentielles (carrosserie, moteur, kilométrage, historique) · Les papiers à contrôler (voir §maillage) · Négocier le prix · Les pièges fréquents · Où acheter en confiance (transition RAZAK).
- **Maillage OBLIGATOIRE (liens vers des pages RÉELLES et stables — pas des fiches individuelles qui peuvent être vendues)** : au moins 3 liens markdown vers :
  - `/vehicules-vente` (« notre catalogue de véhicules à vendre »)
  - une landing catégorie, ex. `/voitures/suv` ou `/voitures/pick-up`
  - `/vehicules-location` (alternative location) OU `/vendre-vehicule`
  Terminer par une phrase renvoyant au catalogue.
- **Règle anti-fabrication (STRICTE) :** aucun prix chiffré précis, aucun taux de taxe, aucune démarche administrative détaillée inventée. Rester sur des conseils généraux fiables ; pour les montants/démarches exactes, renvoyer vers RAZAK ou les administrations compétentes.
- **Ton :** clair, utile, rassurant, français d'Afrique de l'Ouest neutre.

- [ ] **Step 1: Écrire l'article** dans `content/blog/acheter-voiture-occasion-abidjan.md` selon le brief ci-dessus.

- [ ] **Step 2: Vérifier la génération**

Run: `npm run build`
Expected: log `[build] blog: 1 articles + /blog` ; `dist/blog.html` et `dist/blog/acheter-voiture-occasion-abidjan.html` existent.

- [ ] **Step 3: Vérifier les liens internes pointent vers des pages générées**

Run (PowerShell) :
```powershell
$h = Get-Content dist/blog/acheter-voiture-occasion-abidjan.html -Raw
foreach ($u in @('/vehicules-vente','/voitures/suv','/voitures/pick-up','/vehicules-location')) {
  if ($h -match [regex]::Escape("href=""$u""")) {
    $f = "dist" + $u + ".html"
    "$u -> lien présent, page existe: " + (Test-Path $f)
  }
}
```
Expected : chaque lien présent correspond à un fichier `dist/...html` existant (True). Corriger tout lien mort.

- [ ] **Step 4: Lancer la suite complète**

Run: `node --test`
Expected: PASS — toutes les suites (l'intégration blog voit maintenant 1 article).

- [ ] **Step 5: Commit**

```bash
git add content/blog/acheter-voiture-occasion-abidjan.md
git commit -m "content: premier guide blog (acheter voiture occasion Abidjan)"
```

---

## Task 8: Déploiement (preview → prod)

La config build Cloudflare (`npm run build` / `dist`) est **déjà en place** (Phase 1). Il suffit de pousser la branche puis merger.

- [ ] **Step 1: Pousser la branche → preview**

```bash
git push -u origin feat/blog
```

- [ ] **Step 2: Vérifier la preview** (URL `https://feat-blog.razack-multi-service.pages.dev`) :

Run (PowerShell) :
```powershell
$b='https://feat-blog.razack-multi-service.pages.dev'
foreach($u in @('/blog','/blog/acheter-voiture-occasion-abidjan','/sitemap.xml','/')){
  try{$r=Invoke-WebRequest -Uri ($b+$u) -UseBasicParsing -TimeoutSec 25; "{0,-45} {1}" -f $u,$r.StatusCode}catch{"{0} ERR" -f $u}
}
```
Expected : `/blog` 200, l'article 200, sitemap 200 (contient `/blog`), accueil 200 (nav montre « Blog »).

- [ ] **Step 3: Vérifier le contenu de l'article sur la preview** (canonical www, Article schema, liens internes, CTA) via `Invoke-WebRequest` + `-match`.

- [ ] **Step 4: Merger en prod**

```bash
git checkout main
git pull origin main
git merge feat/blog
git push origin main
```

- [ ] **Step 5: Vérifier la prod** (attendre ~1 min) :

Run (PowerShell) :
```powershell
$b='https://www.razak-multiservices.com'
foreach($u in @('/blog','/blog/acheter-voiture-occasion-abidjan','/sitemap.xml')){
  $r=Invoke-WebRequest -Uri ($b+$u) -UseBasicParsing -TimeoutSec 25; "{0,-45} {1} | {2}" -f $u,$r.StatusCode,$r.Headers['Server']
}
```
Expected : 200, `serveur cloudflare`, sitemap inclut `/blog` + l'article.

- [ ] **Step 6: Nettoyer la branche**

```bash
git branch -d feat/blog
git push origin --delete feat/blog
```

- [ ] **Step 7: GSC** — resoumettre le sitemap ; demander l'indexation de `/blog` et de l'article. (Action utilisateur.)

---

## Self-Review (couverture spéc)

- Index `/blog` + article `/blog/<slug>` (spéc §3) → Tasks 4, 3, 6. ✅
- Markdown + frontmatter + `marked` (spéc §2, §4) → Tasks 0, 1. ✅
- Modules `lib/blog.js`, `article.js`, `blog-index.js` (spéc §5) → Tasks 1, 3, 4. ✅
- `build.js` + sitemap + nav Blog + `marked` dep (spéc §5) → Tasks 6, 5, 0. ✅
- SEO : canonical/OG(image)/Article schema/BreadcrumbList/sitemap (spéc §6) → Tasks 2, 3, 6. ✅
- Maillage 2-4 liens + CTA + nav Blog (spéc §7) → Task 7 (brief) + Tasks 3, 5. ✅
- Contenu 1er article auto + anti-fabrication (spéc §8) → Task 7. ✅
- Garde-fous + preview→prod (spéc §9, §10) → Task 8. ✅
- Images : cover optionnel → header dégradé par défaut (option A validée) → Tasks 1, 3. ✅

Types cohérents : l'objet `article` (`slug/url/title/description/date/cover/tags/html/excerpt`) défini en Task 1, consommé Tasks 3, 4, 6 ; `articleSchema` (Task 2) consommé Task 3 ; `renderArticle`/`renderBlogIndex`/`loadArticles` importés dans `build.js` Task 6. Aucun placeholder.

**Hors périmètre de ce plan (plan suivant) :** rédaction des 7 autres articles (contenu, parallélisable) ; bloc « Guides utiles » sur les catalogues ; cadence de publication.
