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
