const { fmtPrice } = require('./categories');

const FACTS = `RAZAK Multi Service — entreprise ivoirienne à Abidjan (Côte d'Ivoire).
Activités : vente de véhicules, location de véhicules (avec ou sans chauffeur), reprise/achat de véhicules, immobilier, ameublement.
Adresse : Angré Caféier 5, Cocody, Abidjan. Horaires : 8h à 20h, du lundi au samedi.
Contact WhatsApp : +225 07 97 38 82 02.
Zones couvertes : Cocody, Plateau, Marcory, Yopougon, Riviera, Angré, Abobo, Bingerville, Treichville, Grand-Bassam.`;

function vLine(v) {
  const st = v.status === 'sold' ? 'VENDU' : 'disponible';
  const km = v.km != null ? `${v.km} km, ` : '';
  return `- ${v.brand} ${v.model} ${v.year} (${v.type}, ${km}${st}) — ${fmtPrice(v.price)} — fiche: ${v.url}`;
}
function locLine(v) {
  const st = v.status === 'sold' ? 'indisponible' : 'disponible';
  return `- ${v.brand} ${v.model} ${v.year} (${v.type}, ${v.formule}, ${st}) — dès ${fmtPrice(v.priceDay)}/jour — fiche: ${v.url}`;
}
function immoLine(b) {
  const st = b.status === 'sold' ? 'indisponible' : 'disponible';
  return `- ${b.titre} (${b.type}, ${b.quartier}, ${st}) — ${fmtPrice(b.prix)}${b.unite ? '/' + b.unite : ''} — fiche: ${b.url}`;
}
function meubleLine(m) {
  return `- ${m.titre} (${m.cat}) — ${fmtPrice(m.prix)} — fiche: ${m.url}`;
}

function buildKb(data) {
  const parts = [FACTS];
  parts.push('\n## VÉHICULES À VENDRE\n' + (data.vente || []).map(vLine).join('\n'));
  parts.push('\n## VÉHICULES EN LOCATION\n' + (data.location || []).map(locLine).join('\n'));
  parts.push('\n## BIENS IMMOBILIERS\n' + (data.immobilier || []).map(immoLine).join('\n'));
  parts.push('\n## AMEUBLEMENT\n' + (data.ameublement || []).map(meubleLine).join('\n'));
  parts.push('\n## GUIDES (blog)\n' + (data.articles || []).map(a => `- ${a.title} — ${a.url}`).join('\n'));
  return parts.join('\n');
}

module.exports = { buildKb };
