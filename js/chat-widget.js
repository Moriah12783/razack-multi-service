(function () {
  if (window.__razaki) return; window.__razaki = true;
  var NAVY = '#0A1F44', GOLD = '#C9A84C';
  var history = [];
  var greeting = "Bonjour 👋 Je suis Razaki, l'assistant de RAZAK Multi Service. Je peux vous aider à trouver un véhicule ou répondre à vos questions.";

  var css = '' +
    '#rz-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:' + NAVY + ';color:#fff;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:9998;font-size:26px;display:flex;align-items:center;justify-content:center}' +
    '#rz-btn:hover{background:' + GOLD + ';color:' + NAVY + '}' +
    '#rz-tip{position:fixed;bottom:32px;right:90px;background:#fff;color:' + NAVY + ';padding:8px 12px;border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.15);font:600 13px system-ui;z-index:9998;display:none}' +
    '#rz-panel{position:fixed;bottom:90px;right:20px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif}' +
    '#rz-head{background:' + NAVY + ';color:#fff;padding:14px 16px;font-weight:700;display:flex;justify-content:space-between;align-items:center}' +
    '#rz-head span{font-size:.72rem;font-weight:400;opacity:.7;display:block}' +
    '#rz-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}' +
    '#rz-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F8F7F4}' +
    '.rz-m{max-width:82%;padding:10px 13px;border-radius:14px;font-size:.9rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}' +
    '.rz-u{align-self:flex-end;background:' + NAVY + ';color:#fff;border-bottom-right-radius:4px}' +
    '.rz-a{align-self:flex-start;background:#fff;color:#111;border:1px solid #E5E7EB;border-bottom-left-radius:4px}' +
    '.rz-a a{color:' + NAVY + ';font-weight:600}' +
    '#rz-form{display:flex;gap:8px;padding:12px;border-top:1px solid #E5E7EB;background:#fff}' +
    '#rz-in{flex:1;border:1px solid #E5E7EB;border-radius:20px;padding:10px 14px;font-size:.9rem;outline:none}' +
    '#rz-in:focus{border-color:' + GOLD + '}' +
    '#rz-send{background:' + NAVY + ';color:#fff;border:none;border-radius:20px;padding:0 16px;cursor:pointer;font-weight:700}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (kids) kids.forEach(function (c) { e.appendChild(c); });
    return e;
  }

  var btn = el('button', { id: 'rz-btn', 'aria-label': 'Ouvrir le chat', text: '💬' });
  var tip = el('div', { id: 'rz-tip', text: '👋 Une question ?' });
  var closeBtn = el('button', { id: 'rz-close', 'aria-label': 'Fermer', text: '×' });
  var head = el('div', { id: 'rz-head' }, [
    el('div', {}, [el('strong', { text: 'Razaki' }), el('span', { text: 'Assistant RAZAK Multi Service' })]),
    closeBtn
  ]);
  var msgs = el('div', { id: 'rz-msgs' });
  var input = el('input', { id: 'rz-in', placeholder: 'Écrivez votre question…', autocomplete: 'off', maxlength: '1000' });
  var form = el('form', { id: 'rz-form' }, [input, el('button', { id: 'rz-send', type: 'submit', text: '➤' })]);
  var panel = el('div', { id: 'rz-panel' }, [head, msgs, form]);
  document.body.appendChild(btn); document.body.appendChild(tip); document.body.appendChild(panel);

  var opened = false;

  // Rend le texte assistant en construisant des noeuds DOM (liens markdown -> <a>), sans insertion HTML brute
  function appendRich(container, text) {
    var parts = text.split(/(\[[^\]]+\]\((?:https?:\/\/[^)\s]+|\/[^)\s]+)\))/g);
    parts.forEach(function (part) {
      var m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)$/);
      if (m) {
        var a = document.createElement('a'); a.href = m[2]; a.textContent = m[1];
        if (/^https?:/.test(m[2])) { a.target = '_blank'; a.rel = 'noopener'; }
        container.appendChild(a);
      } else if (part) {
        container.appendChild(document.createTextNode(part));
      }
    });
  }
  function clearNode(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function add(role, text) {
    var d = el('div', { class: 'rz-m ' + (role === 'user' ? 'rz-u' : 'rz-a') });
    if (role === 'user') d.textContent = text; else appendRich(d, text);
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function openPanel() {
    panel.style.display = 'flex'; tip.style.display = 'none';
    if (!opened) { opened = true; add('assistant', greeting); input.focus(); }
  }
  btn.addEventListener('click', function () { if (panel.style.display === 'flex') panel.style.display = 'none'; else openPanel(); });
  closeBtn.addEventListener('click', function () { panel.style.display = 'none'; });
  setTimeout(function () { if (!opened) tip.style.display = 'block'; }, 4000);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var text = input.value.trim(); if (!text) return;
    input.value = ''; add('user', text); history.push({ role: 'user', content: text });
    var typing = add('assistant', '…');
    try {
      var r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      var data = await r.json();
      var reply = data.reply || data.error || 'Désolé, une erreur est survenue.';
      clearNode(typing); appendRich(typing, reply);
      if (data.reply) history.push({ role: 'assistant', content: data.reply });
      msgs.scrollTop = msgs.scrollHeight;
    } catch (err) {
      clearNode(typing); typing.textContent = 'Connexion impossible. Contactez-nous sur WhatsApp au +225 07 97 38 82 02.';
    }
  });
})();
