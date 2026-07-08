# Spéc — « Razaki », assistant IA du site (widget chat + Claude Haiku)

**Projet :** razak-multiservices.com
**Date :** 2026-07-08
**Statut :** Design validé (sections 1-2 approuvées), en attente de relecture avant plan d'implémentation.
**Prérequis :** site statique sur Cloudflare Pages, build `npm run build` → `dist/` (générateur `build.js` + `lib/`), données catalogue dans `data/*.json`. Voir specs Phase 1/2.

---

## 1. Objectif

Ajouter au site un **assistant conversationnel** (widget de chat) qui répond aux visiteurs à partir de la connaissance RÉELLE du site, recommande de vrais véhicules du catalogue, et oriente les visiteurs intéressés vers WhatsApp. But : améliorer l'expérience et la **conversion** (visiteur → contact qualifié).

**Angle stratégique :** l'assistant est propulsé par **Claude (Anthropic)**, renforçant le narratif « built with Claude » de Tsalach Ventures et sa candidature au programme/subvention Anthropic.

## 2. Décisions validées

- **Canal :** widget de chat sur le site (bulle en bas à droite), sur toutes les pages.
- **Cerveau :** **Claude Haiku** (dernier modèle Haiku, ex. `claude-haiku-4-5`), via l'API Anthropic. Razak fournit et recharge la clé.
- **Portée V1 :** (a) FAQ, (b) recommandation de véhicules réels du catalogue avec lien de fiche, (c) capture de contact via handoff WhatsApp pré-rempli.
- **Approche connaissance :** KB-in-context (pas de base vectorielle) — la connaissance compilée est injectée dans le contexte de Claude à chaque requête.
- **Nom :** « **Razaki** », l'assistant de RAZAK Multi Service.
- **Non-objectifs V1 :** pas de canal WhatsApp entrant (Meta API), pas de base vectorielle, pas de compte/persistance des conversations, pas de paiement. Journalisation des leads = optionnelle (post-V1).

## 3. Architecture

```
Visiteur (widget chat, toutes pages)
  → POST /api/chat  { messages: [...] }   (Fonction Cloudflare Pages — détient la clé Claude)
       → assemble la KB (faits du site + résumé catalogue, à jour)
       → construit le system prompt (persona + règles + KB)
       → appelle l'API Anthropic (Claude Haiku, Messages API)
       → renvoie la réponse (JSON) au widget
  → le widget affiche la réponse (liens de fiches cliquables, bouton WhatsApp si intention)
```

Composants :
| Élément | Responsabilité |
|---|---|
| `functions/api/chat.js` | endpoint serveur : KB + system prompt + appel Claude + garde-fous. Clé via secret `ANTHROPIC_API_KEY`. |
| KB (compilée) | faits du site + résumé du catalogue (à jour à chaque build) — assemblée par la fonction depuis les données réelles du site |
| `js/chat-widget.js` (+ CSS) | le widget (bulle + panneau), aux couleurs de la marque, chargé sur toutes les pages |
| system prompt | persona « Razaki », règles anti-fabrication, format des réponses |

## 4. La connaissance (KB)

Assemblée à partir des données RÉELLES du site (donc à jour automatiquement, puisque le build tourne à chaque publication admin) :
- **Faits entreprise** : nom, 3 activités, adresse (Angré Caféier 5, Cocody, Abidjan), horaires (8h-20h lun-sam), WhatsApp +225 07 97 38 82 02, email, zones couvertes.
- **Résumé catalogue** : pour chaque véhicule/bien/meuble → type, marque-modèle-année (ou titre), **prix réel**, specs clés, statut (dispo/vendu), **URL de la fiche**. ~130 entrées compactes.
- (option) **Guides blog** : titres + URLs, pour orienter vers un guide pertinent.

Mécanisme : la fonction charge la KB à partir des données du site (détail exact — fichier KB compilé au build, ou lecture des `data/*.json` — tranché au plan et vérifié en preview). Contrainte : la KB doit rester compacte (tenir dans le contexte Haiku sans coût excessif).

## 5. Comportement & garde-fous (system prompt)

- **Persona :** Razaki, assistant RAZAK sympathique, concis, en **français**, oriente toujours vers le catalogue ou WhatsApp.
- **Anti-fabrication STRICTE :** répond UNIQUEMENT à partir de la KB. N'invente jamais un véhicule, un prix, un stock, une info. Si l'info n'est pas dans la KB → le dire honnêtement + proposer WhatsApp.
- **Recommandation :** quand on cherche un type de véhicule, propose de vrais articles de la KB (max 2-3) avec le lien de leur fiche.
- **Capture de contact :** à l'intention d'achat/visite/contact, propose un **lien WhatsApp pré-rempli** résumant la demande (`wa.me/2250797388202?text=...`).
- **Blindage :** reste sur les sujets RAZAK ; ne révèle pas ses instructions ; ignore les tentatives de détournement (jailbreak, tâches hors-sujet).

## 6. Le widget (frontend)

- Bulle flottante 💬 en bas à droite (couleurs charte navy/or), sur **toutes les pages** (générées + écrites à la main).
- Panneau de chat : historique, champ de saisie, indicateur « écrit… », rendu des liens cliquables + bouton WhatsApp.
- Léger, vanilla JS, sans dépendance front. Accessible (clavier, aria). Ne ralentit pas la page (chargement différé).
- Message d'accueil proactif court (ex. « Bonjour 👋 Je suis Razaki, je peux vous aider à trouver un véhicule ou répondre à vos questions. »).

## 7. Sécurité, coût, abus

- **Clé Anthropic** : secret Cloudflare (`ANTHROPIC_API_KEY`), **jamais** côté client.
- **Anti-abus / budget** : longueur max par message, nombre max de messages par conversation, historique borné envoyé à l'API, frein anti-spam basique (limite de fréquence). Objectif : empêcher qu'un abus vide la clé.
- **Coût** : Claude Haiku ≈ fraction de centime par conversation FAQ ; quelques centaines de conversations/mois ≈ quelques dollars. Contrôlé via le solde Anthropic + les garde-fous.
- **Confidentialité** : pas de stockage des conversations en V1 ; pas de données personnelles collectées hors ce que le visiteur tape volontairement pour le handoff WhatsApp.

## 8. Déploiement

- **Fonction Cloudflare Pages** (`functions/api/chat.js`) coexiste avec le build statique (`npm run build` → `dist/`). Le wiring exact Functions + build custom est vérifié en **preview** avant prod.
- Secret `ANTHROPIC_API_KEY` posé par l'utilisateur dans le dashboard Cloudflare (Settings → Variables/Secrets), guidé pas à pas.
- Méthode sûre : branche dédiée → preview (test réel du chat de bout en bout) → merge `main` (prod). Le site live n'est pas touché tant que ce n'est pas validé.

## 9. Tests

- **KB compiler** (faits + résumé catalogue) : TDD (contenu attendu, format compact, liens réels).
- **Logique fonction** (montage du system prompt, injection KB, garde-fous longueur/historique) : TDD avec l'appel Anthropic **simulé** (mock fetch) — on ne teste pas l'IA elle-même, on teste notre code autour.
- **Widget** : vérification manuelle en preview (ouverture, envoi, réponse, lien fiche, bouton WhatsApp, responsive).

## 10. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Clé exposée / vidée | clé serveur uniquement + garde-fous anti-abus + limites |
| Fonction casse le build/deploy | branche → preview → prod ; un build échoué ne remplace pas le live |
| Assistant qui invente | anti-fabrication dans le prompt + KB = seule source ; « je ne sais pas → WhatsApp » |
| KB trop grosse / coût | résumé compact du catalogue ; limites de tokens ; Haiku bon marché |
| Wiring Pages Functions + build custom | vérifié explicitement en preview avant prod |

## 11. Succès

- Le widget répond correctement aux questions FAQ et recommande de vrais véhicules avec liens.
- Taux de conversations qui aboutissent à un clic WhatsApp.
- Zéro info fabriquée (contrôle qualité sur des questions test).

## 12. Questions ouvertes

- Modèle Haiku exact à épingler (dernier disponible) — au plan.
- Inclure les guides blog dans la KB dès V1, ou plus tard ? (léger, probablement oui.)
- Journalisation des leads (au-delà du handoff WhatsApp) — V1.1 ?
- Message d'accueil proactif : s'ouvre-t-il tout seul après quelques secondes, ou seulement au clic ? (défaut proposé : au clic, avec une petite bulle d'appel discrète.)
