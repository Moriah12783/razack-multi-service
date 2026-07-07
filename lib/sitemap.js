const SITE = 'https://www.razak-multiservices.com';

function buildSitemap(entries, lastmod) {
  const urls = entries.map(e =>
    `  <url><loc>${SITE}${e.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${e.changefreq || 'weekly'}</changefreq><priority>${e.priority || '0.6'}</priority></url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

module.exports = { buildSitemap };
