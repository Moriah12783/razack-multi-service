function slugify(str) {
  return String(str == null ? '' : str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function baseSlug(item, category) {
  if (category === 'vente' || category === 'location') {
    return slugify(`${item.brand} ${item.model} ${item.year}`);
  }
  return slugify(item.titre || `${item.type || ''} ${item.quartier || ''} ${item.id}`);
}

function assignSlugs(items, category) {
  const seen = new Map();
  return items.map((item) => {
    let s = baseSlug(item, category);
    if (seen.has(s)) {
      seen.set(s, seen.get(s) + 1);
      s = `${s}-${item.id}`;
    } else {
      seen.set(s, 1);
    }
    return { ...item, slug: s };
  });
}

module.exports = { slugify, baseSlug, assignSlugs };
