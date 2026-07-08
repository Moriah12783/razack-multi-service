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

module.exports = { productSchema, breadcrumbSchema, articleSchema, SITE };
