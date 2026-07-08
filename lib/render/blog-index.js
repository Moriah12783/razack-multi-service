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
