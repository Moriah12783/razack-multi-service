function fmtPrice(n) {
  if (n == null || n === '') return 'Prix sur demande';
  // Intl fr-FR uses a narrow no-break space (U+202F) as the group separator;
  // normalise every space-like separator to a plain ASCII space for stable output.
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[\s  ]/g, ' ') + ' FCFA';
}

const CATEGORIES = {
  vente: {
    key: 'vente', urlBase: 'vehicules-vente', label: 'Véhicules à vendre',
    dataFile: 'vehicules-vente.json', schemaType: 'Vehicle', groupBy: 'type',
    title: (i) => `${i.brand} ${i.model} ${i.year} à vendre à Abidjan — ${fmtPrice(i.price)}`,
    description: (i) => `${i.brand} ${i.model} ${i.year}, ${i.type}, ${i.fuel}, ${i.transmission}, ${i.km} km. Prix ${fmtPrice(i.price)}. Contactez RAZAK Multi Service sur WhatsApp.`,
    h1: (i) => `${i.brand} ${i.model} ${i.year}`,
    specs: (i) => [
      { label: 'Marque', value: i.brand }, { label: 'Modèle', value: i.model },
      { label: 'Année', value: i.year }, { label: 'Kilométrage', value: `${i.km} km` },
      { label: 'Carburant', value: i.fuel }, { label: 'Boîte', value: i.transmission },
      { label: 'Type', value: i.type }, { label: 'Moteur', value: i.engine },
      { label: 'Couleur', value: i.color }, { label: 'Portes', value: i.doors },
      { label: 'Prix', value: fmtPrice(i.price) }
    ].filter(s => s.value != null && s.value !== '')
  },
  location: {
    key: 'location', urlBase: 'vehicules-location', label: 'Location de véhicules',
    dataFile: 'vehicules-location.json', schemaType: 'Vehicle', groupBy: 'type',
    title: (i) => `Location ${i.brand} ${i.model} à Abidjan — dès ${fmtPrice(i.priceDay)}/jour`,
    description: (i) => `Louez ${i.brand} ${i.model} ${i.year} à Abidjan (${i.formule}). Dès ${fmtPrice(i.priceDay)}/jour. Réservation WhatsApp RAZAK Multi Service.`,
    h1: (i) => `Location ${i.brand} ${i.model} ${i.year}`,
    specs: (i) => [
      { label: 'Marque', value: i.brand }, { label: 'Modèle', value: i.model },
      { label: 'Année', value: i.year }, { label: 'Formule', value: i.formule },
      { label: 'Places', value: i.places }, { label: 'Carburant', value: i.fuel },
      { label: 'Boîte', value: i.transmission },
      { label: 'Prix / jour', value: fmtPrice(i.priceDay) },
      { label: 'Prix / semaine', value: fmtPrice(i.priceWeek) },
      { label: 'Prix / mois', value: fmtPrice(i.priceMonth) }
    ].filter(s => s.value != null && s.value !== '')
  },
  immobilier: {
    key: 'immobilier', urlBase: 'immobilier', label: 'Immobilier',
    dataFile: 'immobilier.json', schemaType: 'RealEstateListing', groupBy: 'quartier',
    title: (i) => `${i.titre} à ${i.quartier}, Abidjan — ${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}`,
    description: (i) => `${i.titre} à ${i.quartier}. ${i.chambres} chambres, ${i.surface} m². ${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}. RAZAK Multi Service — visite sur WhatsApp.`,
    h1: (i) => i.titre,
    specs: (i) => [
      { label: 'Type', value: i.type }, { label: 'Mode', value: i.mode },
      { label: 'Quartier', value: i.quartier }, { label: 'Chambres', value: i.chambres },
      { label: 'Salles de bain', value: i.sdb }, { label: 'Surface', value: i.surface ? `${i.surface} m²` : null },
      { label: 'Prix', value: `${fmtPrice(i.prix)}${i.unite ? '/' + i.unite : ''}` }
    ].filter(s => s.value != null && s.value !== '')
  },
  ameublement: {
    key: 'ameublement', urlBase: 'ameublement', label: 'Ameublement',
    dataFile: 'ameublement.json', schemaType: 'Product', groupBy: 'room',
    title: (i) => `${i.titre} à Abidjan — ${fmtPrice(i.prix)} | RAZAK Multi Service`,
    description: (i) => `${i.titre} (${i.cat}). ${fmtPrice(i.prix)}. Livraison et installation à Abidjan. Commande WhatsApp RAZAK Multi Service.`,
    h1: (i) => i.titre,
    specs: (i) => [
      { label: 'Pièce', value: i.room }, { label: 'Catégorie', value: i.cat },
      { label: 'Prix', value: fmtPrice(i.prix) }
    ].filter(s => s.value != null && s.value !== '')
  }
};

module.exports = { CATEGORIES, fmtPrice };
