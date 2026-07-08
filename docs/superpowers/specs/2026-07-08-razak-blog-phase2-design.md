# Spéc — Blog / guides (Phase 2, SEO programmatique)

**Projet :** razak-multiservices.com
**Date :** 2026-07-08
**Statut :** Design validé, en attente de relecture avant plan d'implémentation.
**Prérequis :** Phase 1 livrée en prod (moteur `build.js` + `lib/` générant fiches/landing/sitemap sur Cloudflare Pages, build command `npm run build`, output `dist`). Voir `2026-06-14-razak-seo-pages-design.md`.

---

## 1. Contexte & objectif

La Phase 1 a mis en ligne ~86 fiches + 21 landing + sitemap, servies par un générateur Node au build Cloudflare. La Phase 2 ajoute un **blog de guides** (rédigés par l'assistant) qui répondent à de vraies recherches Google à Abidjan et **renvoient vers les fiches** — pour capter du trafic informationnel et le convertir en contacts WhatsApp.

**Objectif :** publier des pages `/blog` + `/blog/<slug>` indexables, du contenu réel et utile, maillé vers le catalogue, en priorité **automobile**.

**Non-objectifs :** pas de commentaires, pas de CMS, pas de pagination complexe au premier lot, pas de catégories multiples au départ (tags simples optionnels). Pas de fabrication de données (prix/démarches/taxes exacts).

## 2. Décisions validées

- **Priorité contenu : automobile** (plus gros catalogue → plus de fiches à lier).
- **Format d'écriture : Markdown** (`content/blog/*.md` + en-tête frontmatter), converti via **`marked`** (une dépendance de build, légère et éprouvée). Tradeoff accepté : le build n'est plus 100 % hermétique, mais l'édition des articles devient confortable. `marked` est build-time uniquement (non expédié au navigateur).

## 3. Types de pages générées

1. **Index blog** `/blog` : liste des articles (carte titre + extrait + date + image), du plus récent au plus ancien.
2. **Article** `/blog/<slug>` : contenu complet, image de couverture, fil d'Ariane, CTA WhatsApp, **2-4 liens internes** vers fiches/landing pertinentes.

## 4. Format des articles (Markdown + frontmatter)

Chaque `content/blog/<slug>.md` commence par un en-tête :

```
---
title: Acheter une voiture d'occasion à Abidjan — le guide complet
description: Vérifications, papiers, pièges à éviter... (meta description SEO)
date: 2026-07-08
cover: /images/blog/voiture-occasion-abidjan.jpg
tags: [automobile, achat, occasion]
---
Corps de l'article en Markdown...
```

- `slug` = nom du fichier (figé → URL stable).
- Parsing frontmatter : mini-parseur maison (bloc `---` en tête, clés simples `key: value`, listes `[a, b]`) — pas de dépendance YAML.
- Corps Markdown → HTML via `marked`.

## 5. Architecture (extension du moteur Phase 1)

Nouveaux fichiers :
| Fichier | Responsabilité |
|---|---|
| `lib/blog.js` | charge tous les `content/blog/*.md`, parse frontmatter + corps (`marked`), calcule `slug`/`url`/`date`, trie par date desc |
| `lib/render/article.js` | page article (layout + HTML corps + Article JSON-LD + fil d'Ariane + cover + CTA) |
| `lib/render/blog-index.js` | page `/blog` (liste des cartes articles) |
| `content/blog/*.md` | les articles (contenu) |
| `images/blog/*` | images de couverture |

Modifications :
- `build.js` : générer `/blog` + `/blog/<slug>` + entrées sitemap (priority ~0.6, changefreq monthly).
- `lib/render/layout.js` : ajouter un lien **« Blog »** dans `NAV`.
- `package.json` : ajouter `marked` en `dependencies` + committer `package-lock.json` (installs reproductibles au build CF).

## 6. SEO

- Par article : title / meta description / canonical (www) / OpenGraph (title, description, url, **image=cover**) ; **Schema.org `Article`** (`headline`, `datePublished`, `author` = Organization RAZAK, `image`) ; `BreadcrumbList`.
- Index `/blog` : title/description/canonical propres.
- Sitemap régénéré incluant `/blog` + tous les articles.
- Images : `alt` explicite, lazy-loading.

## 7. Maillage interne (le carburant)

- Chaque article contient **2-4 liens contextuels** vers des fiches ou landing réelles pertinentes (ex. guide « SUV vs pick-up » → landing `/voitures/suv` et `/voitures/pick-up`) + un **CTA WhatsApp**.
- Lien **« Blog »** dans la nav globale (toutes pages).
- (Optionnel, plus tard) bloc « Guides utiles » sur les catalogues.

## 8. Contenu — premier lot (8 guides, automobile)

Rédigés en français, ~800-1500 mots, utiles **et honnêtes** :
1. Acheter une voiture d'occasion à Abidjan — le guide complet (vérifications, papiers, pièges)
2. SUV, berline, pick-up ou 4×4 : quel véhicule choisir en Côte d'Ivoire ?
3. Louer une voiture à Abidjan, avec ou sans chauffeur : comment choisir
4. Vendre sa voiture rapidement à Abidjan : étapes et bon prix
5. Combien coûte une voiture à Abidjan ? Repères de prix par type
6. Les papiers d'un véhicule en Côte d'Ivoire (carte grise, mutation, assurance)
7. Importer un véhicule vs acheter local : avantages et coûts
8. Bien entretenir sa voiture d'occasion à Abidjan

**Règle anti-fabrication (stricte) :** aucun prix exact, taux de taxe, ou démarche administrative précise ne sera inventé. Les montants/procédures sont donnés en fourchettes prudentes ou renvoyés vers RAZAK / sources officielles. Le contenu reste des conseils fiables et généraux.

## 9. Garde-fous & méthode

- Articles substantiels (jamais de remplissage / bourrage de mots-clés).
- URLs figées (slug = nom de fichier).
- TDD sur le moteur ; validation en **preview Cloudflare avant prod** (branche dédiée), comme la Phase 1. Un build échoué ne remplace jamais le live.

## 10. Phasage (dans la Phase 2)

1. **Moteur blog** : `lib/blog.js` + `lib/render/article.js` + `lib/render/blog-index.js` + build wiring + nav + `marked`, avec 1-2 articles témoins, en TDD.
2. **Rédaction** des articles restants (les 8 au total).
3. **Preview → prod → GSC** (resoumettre sitemap).

## 11. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Dépendance `marked` casse un build | lockfile committé ; un build échoué ne remplace pas le live ; testé en preview |
| Contenu perçu comme mince/dupliqué | articles longs, uniques, maillés ; pas de génération auto de texte |
| Fabrication d'infos (prix/démarches) | règle anti-fabrication §8 ; fourchettes + renvoi sources |
| Frontmatter mal parsé | mini-parseur testé (TDD) sur cas réels |

## 12. Succès

- GSC : `/blog/*` indexées + impressions/clics sur requêtes informationnelles auto.
- Analytics : trafic blog + clics sortants vers fiches / WhatsApp.

## 13. Questions ouvertes

- Images de couverture : générées/illustratives libres de droits, ou fournies par Razak ? (à défaut, placeholder sobre au départ).
- Cadence après le premier lot (ex. 2/semaine) — à définir.
- Ordre de rédaction des 8 (proposé : #1, #2, #3 en premier, plus fort potentiel).
