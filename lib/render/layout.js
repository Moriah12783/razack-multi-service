function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const NAV = `
<nav id="navbar"><div class="container"><div class="nav-inner">
  <a href="/" class="nav-logo"><img src="/images/logo-razack-transparent.png" alt="RAZAK Multi Service" style="height:75px;width:auto;object-fit:contain"></a>
  <ul class="nav-menu">
    <li class="nav-item"><a href="/" class="nav-link">Accueil</a></li>
    <li class="nav-item"><a href="/vehicules-vente" class="nav-link">Véhicules à vendre</a></li>
    <li class="nav-item"><a href="/vehicules-location" class="nav-link">Location</a></li>
    <li class="nav-item"><a href="/immobilier" class="nav-link">Immobilier</a></li>
    <li class="nav-item"><a href="/ameublement" class="nav-link">Ameublement</a></li>
    <li class="nav-item"><a href="/contact" class="nav-link">Contact</a></li>
  </ul>
  <button class="hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
</div></div></nav>`;

const FOOTER = `
<footer class="footer"><div class="container">
  <p class="footer-desc" style="text-align:center;padding:24px 0">© RAZAK Multi Service — Abidjan, Côte d'Ivoire · WhatsApp +225 07 97 38 82 02</p>
</div></footer>`;

function renderPage({ title, description, canonical, image, headExtra = '', main }) {
  return `<!DOCTYPE html>
<html lang="fr"><head>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KP7FCM8K');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="${esc(canonical)}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">\n` : ''}<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/responsive.css">
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
${headExtra}
</head><body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KP7FCM8K" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
${NAV}
${main}
${FOOTER}
<script src="/js/main.js"></script>
</body></html>`;
}

module.exports = { renderPage, esc };
