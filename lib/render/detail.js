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

function renderDetail(item, key, related) {
  const cfg = CATEGORIES[key];
  const canonical = SITE + item.url;
  const img = (item.photos && item.photos[0]) || item.photo;
  const ogImage = img ? SITE + img : undefined;
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
  return renderPage({ title: cfg.title(item), description: cfg.description(item), canonical, image: ogImage, headExtra, main });
}

module.exports = { renderDetail };
