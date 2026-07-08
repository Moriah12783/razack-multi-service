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
