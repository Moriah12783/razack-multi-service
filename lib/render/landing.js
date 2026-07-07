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
