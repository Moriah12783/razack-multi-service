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
