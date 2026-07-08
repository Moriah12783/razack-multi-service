const fs = require('node:fs');
const path = require('node:path');
const { CATEGORIES } = require('./lib/categories');
const { loadCategory, groupItems } = require('./lib/data');
const { renderDetail } = require('./lib/render/detail');
const { renderLanding, landingUrl } = require('./lib/render/landing');
const { loadArticles } = require('./lib/blog');
const { renderArticle } = require('./lib/render/article');
const { renderBlogIndex } = require('./lib/render/blog-index');
const { buildSitemap } = require('./lib/sitemap');
const { copyStatic } = require('./lib/copy-static');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const TODAY = new Date().toISOString().slice(0, 10);

const writtenPaths = new Set();

function writePage(urlPath, html) {
  const file = path.join(DIST, urlPath.replace(/^\//, '') + '.html');
  // Collision guard: fail loudly if two pages resolve to the same output file
  // (e.g. a detail slug colliding with a landing slug) rather than silently
  // overwriting one with the other.
  if (writtenPaths.has(file)) {
    throw new Error(`page collision: two pages map to the same output file: ${file} (url ${urlPath})`);
  }
  writtenPaths.add(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
}

function rmDist() {
  // Windows: a watcher/dev server holding a handle inside dist/ can make a
  // single rmSync throw EBUSY/ENOTEMPTY/EPERM. Retry with a short backoff so a
  // transient lock (e.g. a live-reload watcher) has time to release.
  if (!fs.existsSync(DIST)) return;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.rmSync(DIST, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 });
      return;
    } catch (err) {
      if (attempt === 7) throw err;
      // brief synchronous backoff before retrying
      const until = Date.now() + 150;
      while (Date.now() < until) { /* spin */ }
    }
  }
}

function run() {
  rmDist();
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
      writePage(item.url, renderDetail(item, key, related));
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

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(sitemap, TODAY), 'utf8');
  console.log(`[build] sitemap: ${sitemap.length} URLs → dist/`);
}

run();
