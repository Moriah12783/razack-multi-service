# Spéc — Passage à un site à centaines de pages indexables (SEO programmatique)

**Projet :** razak-multiservices.com
**Date :** 2026-06-14
**Statut :** Design validé (sections 1-3 approuvées), en attente de relecture avant plan d'implémentation.

---

## 1. Contexte & état actuel

- Site **100 % statique** (HTML/CSS/JS à la main), déployé sur **Cloudflare Pages** (Git auto-deploy depuis `Moriah12783/razack-multi-service`, branche `main`). Migration Vercel→Cloudflare terminée le 2026-06-14.
- **4 pages catalogue** (vente, location, immobilier, ameublement) qui chargent des JSON et affichent les fiches **en JavaScript côté navigateur** → les articles individuels **ne sont PAS des pages indexables** (ils vivent dans une seule page, invisibles pour Google en tant qu'URLs distinctes).
- **Données existantes riches** : `data/*.json`
  - `vehicules-vente.json` : **42** articles (champs : brand, model, year, km, fuel, transmission, type, price, status, color, engine, doors, desc multi-ligne, photo, photos[]).
  - `ameublement.json` : 24 · `immobilier.json` : 12 · `vehicules-location.json` : 8. **Total ~86 articles**, tous avec descriptions + plusieurs photos (`/images/annonces/*.jpg`).
- **Saisie déjà en place** : `admin.html` (login + token GitHub) édite les JSON et **publie en committant directement sur GitHub** via l'API Contents (`commitFile`) → déclenche un déploiement Cloudflare. Les photos sont aussi commitées via l'admin.
- **Banque de photos fournie par le client** : dossier Google Drive, ~45 photos téléphone (style WhatsApp, noms génériques `PHOTO-2026-06-22-*.jpg`), **sans aucune donnée ni classement**. Représente un nombre inconnu (probablement bien < 45) d'articles distincts.

## 2. Objectif & non-objectifs

**Objectif :** faire passer le site d'une dizaine de pages à **des centaines de pages indexables**, avec du **contenu 100 % réel**, pour augmenter le trafic organique — sans jamais tomber dans le « contenu mince » que Google pénalise.

**Non-objectifs :**
- Pas de fabrication de données (prix, km, specs inventés = interdit). Les données produits viennent de Razack.
- Pas de CMS/base de données dynamique (surdimensionné, ne règle pas le vrai goulot = la saisie).
- Pas de changement d'outil pour Razack (il garde `admin.html`).

**Contrainte clé identifiée :** le vrai goulot d'étranglement n'est pas la technique mais la **saisie des données** de chaque article. Les photos seules ne suffisent pas à faire une page.

## 3. Types de pages générées (validé — Section 1)

1. **Fiches produits** (1 page / article). URL SEO : `/<catégorie>/<marque-modèle-année>` (ex. `/vehicules-vente/jetour-t2-xwd-travel-2026`). Contenu : titre optimisé, specs, prix, description complète, galerie photos, CTA WhatsApp, fil d'Ariane, articles similaires, Schema.org. **Source des « centaines » à terme.**
2. **Pages catégories & quartiers** (landing). Ex. `/voitures/suv`, `/immobilier/cocody`, `/ameublement/salon`. Intro SEO unique + liste des vrais articles + FAQ. **Générées uniquement si ≥1 article réel.**
3. **Blog / guides** (rédigés par l'assistant). Ex. `/blog/acheter-voiture-occasion-abidjan`. Vrais articles utiles, maillés vers fiches/landing.
4. **Pages existantes** (accueil, catalogues, contact…) : conservées, enrichies de liens vers les nouvelles pages.

## 4. Le moteur (validé — Section 2)

**Générateur `build.js` (Node, sans framework)** exécuté au **build Cloudflare Pages**. Flux automatique :

```
admin.html (ajout article + photos) → « Publier » → commit JSON+images sur GitHub
   → Cloudflare lance le build → build.js :
        • lit les 4 JSON
        • génère 1 fiche/article (template)
        • génère landing pages (celles avec ≥1 article)
        • génère pages blog (depuis fichiers de contenu rédigés)
        • régénère sitemap.xml
        • copie les fichiers statiques existants (css, js, images, pages actuelles)
        → sortie dans `dist/`
   → Cloudflare publie `dist/` → pages en ligne
```

**Décisions :**
- **Génération au build, jamais en JS client** (condition SEO absolue : vrai HTML servi).
- **Léger** : Node + templates simples, pas d'Astro/Next. Build en secondes, gratuit.
- **URLs stables à vie** : slug figé par article (basé sur marque-modèle-année + id), inchangé même si la description évolue. Table de correspondance id→slug pour garantir la stabilité.
- **Sortie `dist/`** : séparation source (données+templates) / build. `docs/` et fichiers internes exclus du build (pas servis publiquement).
- Config Cloudflare Pages : build command = `node build.js` (ou `npm run build`), output dir = `dist`, + `package.json` minimal.

**Sécurité de déploiement :** développement et validation sur une **branche → preview Cloudflare Pages**. La production n'est basculée sur le build qu'après vérification complète (nouvelles pages + site actuel intacts). Le site live n'est pas touché pendant le développement.

## 5. SEO & garde-fous (validé — Section 3)

- **Par page** : title/meta/canonical(www)/OpenGraph uniques, auto-générés depuis les données.
- **Schema.org** : `Vehicle`+`Offer` (véhicules), `RealEstateListing` (immo), `Product`+`Offer` (meubles), `Article` (blog), `BreadcrumbList`, `FAQPage` (landing).
- **Maillage interne** : catalogues→fiches, fiches→similaires+catégorie, blog→fiches. Fil d'Ariane partout.
- **Sitemap** régénéré à chaque build, resoumis à GSC.
- **Images** : alt auto depuis les données, lazy-loading.
- **Garde-fous anti-thin-content :**
  - Fiches riches par nature (specs+desc+photos+schema).
  - Landing : seulement si ≥1 article + intro unique par quartier/catégorie. Jamais de page vide/dupliquée.
  - Articles vendus (`status: sold`) : page conservée, marquée « Vendu » + articles similaires dispo (pas de suppression → pas de 404).

## 6. Phasage

- **Phase 1 — Moteur + récolte immédiate.** Générateur + templates + pipeline (testé preview) → ~86 fiches + landing pages de l'inventaire existant + sitemap + maillage. Soumission GSC.
- **Phase 2 — Blog.** Moteur blog + premier lot ~8-10 guides rédigés, puis cadence.
- **Phase 3 — Inventaire du Drive.** Razack saisit ses articles (données+photos) via `admin.html` → chaque ajout crée sa page. Montée vers les centaines à son rythme.

## 7. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Le build casse le déploiement live | Développement sur branche + preview ; bascule prod après validation |
| Contenu mince → pénalité Google | Landing seulement si ≥1 article ; intros uniques ; fiches riches |
| URLs qui changent → perte SEO | Slugs figés par id dès la création |
| Pénurie de données (photos sans specs) | Phase 3 dépend de la saisie Razack ; Phases 1-2 n'en dépendent pas |
| Articles vendus → 404 | Pages conservées + marquées « Vendu » |

## 8. Mesure du succès

- GSC : pages indexées (actuel ~9 → objectif 100+), impressions, clics.
- Analytics : trafic organique.

## 9. Questions ouvertes

- Nombre réel d'articles distincts que représente la banque Drive (les ~45 photos = combien de vrais articles ?). À confirmer avec Razack.
- Y a-t-il d'autres dossiers de photos que celui partagé ?
- Liste initiale des quartiers/catégories à couvrir en landing (dérivée de l'inventaire réel).
- Sujets prioritaires des premiers guides blog.
