/* ============================================================
   RAZAK MULTI SERVICE — main.js
   Navigation, utils, composants globaux
   ============================================================ */

// === NAVBAR ===
const navbar = document.getElementById('navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  const backToTop = document.getElementById('backToTop');
  if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
});

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    }
  });
}

// Active nav link
document.querySelectorAll('.nav-link').forEach(link => {
  if (link.href === window.location.href) link.classList.add('active');
});

// === BACK TO TOP ===
const backToTop = document.getElementById('backToTop');
if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// === ACCORDION ===
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const body = item.querySelector('.accordion-body');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.accordion-body').classList.remove('open');
    });
    if (!isOpen) { item.classList.add('open'); body.classList.add('open'); }
  });
});

// === TABS ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('[data-tabs]') || btn.parentElement;
    group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    document.querySelectorAll(`[data-tab-content]`).forEach(panel => {
      panel.style.display = panel.dataset.tabContent === target ? 'block' : 'none';
    });
  });
});

// === FORMAT FCFA ===
window.fmt = (n) => new Intl.NumberFormat('fr-CI').format(n) + ' FCFA';
window.fmtShort = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(0) + 'M FCFA';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K FCFA';
  return fmt(n);
};

// === WHATSAPP HELPERS ===
window.waLink = (phone, msg) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
window.WA = '2250797388202';

// === CONTACT FORM → WHATSAPP ===
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('cf-nom')?.value || '';
    const tel = document.getElementById('cf-tel')?.value || '';
    const sujet = document.getElementById('cf-sujet')?.value || '';
    const msg = document.getElementById('cf-message')?.value || '';
    const text = `Bonjour RAZAK Multi Service !\n\nNom : ${nom}\nTél : ${tel}\nSujet : ${sujet}\n\nMessage : ${msg}`;
    window.open(waLink(WA, text), '_blank');
  });
}

// === SELL FORM → WHATSAPP ===
const sellForm = document.getElementById('sellForm');
if (sellForm) {
  sellForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('sf-nom')?.value || '';
    const tel = document.getElementById('sf-tel')?.value || '';
    const marque = document.getElementById('sf-marque')?.value || '';
    const modele = document.getElementById('sf-modele')?.value || '';
    const annee = document.getElementById('sf-annee')?.value || '';
    const km = document.getElementById('sf-km')?.value || '';
    const etat = document.getElementById('sf-etat')?.value || '';
    const prix = document.getElementById('sf-prix')?.value || '';
    const localisation = document.getElementById('sf-localisation')?.value || '';
    const commentaire = document.getElementById('sf-commentaire')?.value || '';
    const text = `Bonjour RAZAK, je souhaite vendre mon véhicule.\n\n👤 Nom : ${nom}\n📱 WhatsApp : ${tel}\n\n🚗 Véhicule\nMarque : ${marque}\nModèle : ${modele}\nAnnée : ${annee}\nKilométrage : ${km} km\nÉtat : ${etat}\nPrix souhaité : ${prix} FCFA\nLocalisation : ${localisation}\n\n💬 Commentaire : ${commentaire}`;
    window.open(waLink(WA, text), '_blank');
  });
}

// === VISITE FORM ===
const visiteForm = document.getElementById('visiteForm');
if (visiteForm) {
  visiteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('vf-nom')?.value || '';
    const tel = document.getElementById('vf-tel')?.value || '';
    const date = document.getElementById('vf-date')?.value || '';
    const heure = document.getElementById('vf-heure')?.value || '';
    const bien = document.getElementById('vf-bien')?.value || 'Non précisé';
    const msg = `Bonjour RAZAK, je souhaite réserver une visite.\n\n👤 Nom : ${nom}\n📱 WhatsApp : ${tel}\n📅 Date souhaitée : ${date}\n🕐 Heure : ${heure}\n🏠 Bien : ${bien}`;
    window.open(waLink(WA, msg), '_blank');
  });
}

// === COOKIE CONSENT BANNER ===
(function() {
  if (localStorage.getItem('razak_cookies_accepted')) return;
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <p style="margin:0;flex:1;min-width:220px;font-size:.88rem;color:#ccc;line-height:1.5">
        🍪 Ce site utilise des cookies pour améliorer votre expérience (Google Analytics, Microsoft Clarity).
        <a href="confidentialite.html" style="color:#C9A84C;text-decoration:underline">En savoir plus</a>
      </p>
      <div style="display:flex;gap:10px;flex-shrink:0">
        <button id="cookie-decline" style="padding:9px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#ccc;font-size:.85rem;cursor:pointer">Refuser</button>
        <button id="cookie-accept" style="padding:9px 20px;border-radius:6px;border:none;background:#C9A84C;color:#0A1F44;font-weight:700;font-size:.85rem;cursor:pointer">Accepter</button>
      </div>
    </div>`;
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(6,15,34,.97);backdrop-filter:blur(8px);padding:16px 24px;z-index:9999;box-shadow:0 -4px 20px rgba(0,0,0,.3);border-top:1px solid rgba(201,168,76,.25)';
  document.body.appendChild(banner);
  function hideBanner() { banner.style.transform = 'translateY(100%)'; banner.style.transition = 'transform .3s ease'; setTimeout(() => banner.remove(), 350); }
  document.getElementById('cookie-accept').addEventListener('click', () => { localStorage.setItem('razak_cookies_accepted', '1'); hideBanner(); });
  document.getElementById('cookie-decline').addEventListener('click', () => { localStorage.setItem('razak_cookies_accepted', '0'); hideBanner(); });
})();

// === SMOOTH REVEAL ON SCROLL ===
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.pole-card, .listing-card, .mission-card, .value-card, .process-step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
