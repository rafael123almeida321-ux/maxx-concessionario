/* =====================================================================
   SITE DA LOJA (site.js) — nome, logo, contatos e textos vêm de config (store.js)
   Cabeçalho, rodapé, vitrine, página do carro, favoritos, agendamento,
   quiz de crédito, analytics/UTM, SEO e microinterações
   ===================================================================== */
(function () {
  'use strict';
  var D = window.LojaDB, db = D.load(), cfg = db.config;
  /* carro com foto aparece primeiro; se uma foto externa não carregar, entra o cartão provisório */
  function temFoto(c) { return c.fotos && c.fotos.length ? 1 : 0; }
  document.addEventListener('error', function (e) {
    var im = e.target; if (!im || im.tagName !== 'IMG' || im.dataset.fb || !/^https?:/.test(im.getAttribute('src') || '')) return;
    im.dataset.fb = '1'; im.src = D.PLACEHOLDER;
  }, true);
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = D.esc;

  /* ---------- ícones ---------- */
  var I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M7 8h10"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15l2-5c.5-1.3 1.4-2 2.8-2h8.4c1.4 0 2.3.7 2.8 2l2 5v3H3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>'
  };

  /* ---------- analytics (GA4 / Meta Pixel se configurados no painel) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    params = params || {};
    try { window.dataLayer.push(Object.assign({ event: event }, params)); } catch (e) { /* ok */ }
    try { if (window.gtag) window.gtag('event', event, params); } catch (e) { /* ok */ }
    try {
      if (window.fbq) {
        var map = { generate_lead: 'Lead', schedule: 'Schedule', view_item: 'ViewContent', add_to_wishlist: 'AddToWishlist', contact: 'Contact' };
        if (map[event]) window.fbq('track', map[event], params);
      }
    } catch (e) { /* ok */ }
  }
  function loadAnalytics() {
    if (cfg.gaId) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId); document.head.appendChild(s);
      window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag('js', new Date()); window.gtag('config', cfg.gaId);
    }
    if (cfg.pixelId) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', cfg.pixelId); window.fbq('track', 'PageView');
    }
  }

  /* ---------- LGPD: medição só depois do aceite ---------- */
  function consent() {
    var v = store('loja_cookies');
    if (v === 'ok') { loadAnalytics(); return; }
    if (v === 'nao') return;
    var bar = document.createElement('div'); bar.className = 'cookie-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.innerHTML = '<p>Usamos cookies para medir as visitas e melhorar o site. Saiba mais na nossa <a href="privacidade.html">política de privacidade</a>.</p><div><button type="button" class="btn btn-ghost btn-sm" data-ck="nao">Recusar</button><button type="button" class="btn btn-gold btn-sm" data-ck="ok">Aceitar</button></div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('on'); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var r = b.getAttribute('data-ck'); store('loja_cookies', r);
      if (r === 'ok') loadAnalytics();
      bar.classList.remove('on'); setTimeout(function () { bar.remove(); }, 400);
    });
  }

  /* ---------- utilidades ---------- */
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function sess(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function openUrl(url) {
    var w = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
    if (!w) { try { window.top.location.href = url; } catch (e2) { location.href = url; } }
  }
  function toast(msg) {
    var t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }
  function waCarro(c, extra) {
    var msg = 'Olá, ' + cfg.loja + '! Tenho interesse no ' + D.carroNome(c) + ' (' + D.brl(c.preco) + ').' + (extra ? ' ' + extra : '') + ' Vi no site.';
    D.addLead({ carroId: c.id, origem: 'site-whatsapp', mensagem: 'Clicou em WhatsApp no ' + D.carroNome(c) + (extra ? ' — ' + extra : '') });
    D.stat('wa', c.id);
    track('generate_lead', { method: 'whatsapp', item_id: c.id, item_name: D.carroNome(c) });
    openUrl(D.waLink(msg));
  }
  function waGeral(msg, origem) {
    D.addLead({ origem: origem || 'site-whatsapp', mensagem: msg }); D.stat('wa');
    track('contact', { method: 'whatsapp' });
    openUrl(D.waLink(msg));
  }
  function carUrl(c) { return 'carro.html?id=' + encodeURIComponent(c.id); }
  function parcelaTxt(c) { var p = D.parcela(c.preco, 0, 60); return '60x de ' + D.brl(p) + '*'; }
  /* condição de pagamento mostrada no card, conforme a idade do carro */
  function condTxt(c) { var n = D.creditoNivel(c); return n === 'facil' ? 'ou ' + parcelaTxt(c) : n === 'consulta' ? 'Financiamento sob consulta*' : 'À vista ou na troca'; }
  function isNovo(c) { return D.diasEstoque(c) <= 7; }
  function maskTel(el) {
    el.addEventListener('input', function () {
      var d = D.onlyDigits(el.value).slice(0, 11);
      el.value = d.length > 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7) : d.length > 6 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6) : d.length > 2 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) : d;
    });
  }

  /* ---------- favoritos ---------- */
  function favs() { return (store('loja_favs') || []).filter(function (id) { var c = D.getCarro(id); return c && c.status !== 'vendido' && c.publicado; }); }
  function isFav(id) { return favs().indexOf(id) > -1; }
  function toggleFav(id, btn) {
    var f = store('loja_favs') || []; var i = f.indexOf(id);
    if (i > -1) f.splice(i, 1); else { f.push(id); track('add_to_wishlist', { item_id: id }); }
    store('loja_favs', f);
    $$('[data-fav="' + id + '"]').forEach(function (b) { b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); if (b.querySelector('span')) b.querySelector('span').textContent = i < 0 ? 'Favoritado' : 'Favoritar'; });
    if (btn) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    favCount();
    toast(i < 0 ? 'Adicionado aos seus favoritos ♥' : 'Removido dos favoritos');
  }
  function favCount() { var n = favs().length; $$('.fav-count').forEach(function (e) { e.textContent = n || ''; e.setAttribute('data-n', n); }); }
  function favDrawer() {
    var dr = $('#fav-drawer');
    if (!dr) {
      dr = document.createElement('aside'); dr.id = 'fav-drawer'; dr.className = 'drawer'; dr.setAttribute('aria-label', 'Meus favoritos');
      document.body.appendChild(dr);
      var sc = document.createElement('div'); sc.className = 'scrim'; sc.id = 'fav-scrim'; document.body.appendChild(sc);
      sc.addEventListener('click', closeDrawer);
    }
    var list = favs().map(D.getCarro);
    dr.innerHTML = '<div class="drawer-h"><h3>Meus favoritos</h3><button class="x-btn" aria-label="Fechar">' + I.x + '</button></div>' +
      '<div class="drawer-b">' + (list.length ? list.map(function (c) {
        return '<div class="fav-item"><a href="' + carUrl(c) + '"><img src="' + esc(D.carroFoto(c)) + '" alt=""></a><a href="' + carUrl(c) + '"><b>' + esc(D.carroTitulo(c)) + '</b><span style="color:var(--muted);font-size:13px">' + c.anoFab + '/' + c.anoMod + ' · ' + D.km(c.km) + '</span><br><small>' + D.brl(c.preco) + '</small></a><button class="x-btn" data-unfav="' + esc(c.id) + '" aria-label="Remover">' + I.x + '</button></div>';
      }).join('') : '<div class="empty" style="padding:50px 10px"><h3>Nenhum favorito ainda</h3><p>Toque no ♥ dos carros que você gostou para guardar aqui e mostrar pra família.</p><a class="btn btn-gold" href="estoque.html" style="margin-top:10px">Ver estoque</a></div>') + '</div>' +
      (list.length ? '<div class="drawer-f"><button class="btn btn-wa btn-block" id="fav-send">' + I.wa + ' Enviar meus favoritos pelo WhatsApp</button></div>' : '');
    $('.drawer-h .x-btn', dr).onclick = closeDrawer;
    $$('[data-unfav]', dr).forEach(function (b) { b.onclick = function () { toggleFav(b.getAttribute('data-unfav')); favDrawer(); }; });
    var send = $('#fav-send', dr);
    if (send) send.onclick = function () {
      var txt = 'Olá, ' + cfg.marcaCurta + '! Separei estes carros no site e quero saber mais:\n' + list.map(function (c) { return '• ' + D.carroNome(c) + ' — ' + D.brl(c.preco); }).join('\n');
      D.addLead({ origem: 'site-favoritos', carroId: list[0].id, mensagem: 'Favoritos: ' + list.map(D.carroTitulo).join(', ') }); D.stat('wa');
      track('generate_lead', { method: 'favoritos' }); openUrl(D.waLink(txt));
    };
    requestAnimationFrame(function () { dr.classList.add('open'); $('#fav-scrim').classList.add('on'); });
  }
  function closeDrawer() { var d = $('#fav-drawer'); if (d) d.classList.remove('open'); var s = $('#fav-scrim'); if (s) s.classList.remove('on'); }

  /* ---------- modal genérico ---------- */
  function sModal(html, onMount) {
    closeModal();
    var bg = document.createElement('div'); bg.className = 's-modal-bg';
    bg.innerHTML = '<div class="s-modal" role="dialog" aria-modal="true"><button class="x-btn" aria-label="Fechar">' + I.x + '</button>' + html + '</div>';
    document.body.appendChild(bg); document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { bg.classList.add('on'); });
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) closeModal(); });
    $('.x-btn', bg).onclick = closeModal;
    if (onMount) onMount($('.s-modal', bg));
    return bg;
  }
  function closeModal() { $$('.s-modal-bg').forEach(function (m) { m.remove(); }); document.body.style.overflow = ''; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });

  /* ---------- agendamento (visita, test drive, avaliação) ---------- */
  function horarios(dia) { var dw = D.parse(dia).getDay(); var fim = dw === 6 ? 14 : 17; var h = []; for (var x = 9; x <= fim; x++) { h.push((x < 10 ? '0' : '') + x + ':00'); if (x < fim) h.push((x < 10 ? '0' : '') + x + ':30'); } return h; }
  function openAgendar(carro, tipo0) {
    var dias = []; var d = D.today(); var hNow = new Date().getHours();
    for (var i = 0; dias.length < 10 && i < 16; i++) { var dd = D.addDays(d, i); if (D.parse(dd).getDay() === 0) continue; if (i === 0 && hNow >= 16) continue; dias.push(dd); }
    var st = { tipo: tipo0 || (carro ? 'test-drive' : 'visita'), dia: dias[0], hora: '' };
    var tipos = [['visita', 'Visita + café'], ['test-drive', 'Test drive'], ['avaliacao', 'Avaliar minha troca']];
    sModal('<span class="eyebrow">Venha visitar a ' + esc(cfg.marcaCurta) + '</span><h3>Agende sua visita</h3><p class="sub">' + (carro ? 'Vamos deixar o <b style="color:var(--text)">' + esc(D.carroNome(carro)) + '</b> separado pra você.' : 'Escolha o melhor dia e horário. A gente confirma pelo WhatsApp.') + '</p>' +
      '<form id="ag-form"><div class="field"><label>O que você quer fazer?</label><div class="seg" id="ag-tipo">' + tipos.map(function (t) { return '<button type="button" data-v="' + t[0] + '" class="' + (st.tipo === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Dia</label><div class="chip-grid" id="ag-dia">' + dias.map(function (x, k) { return '<button type="button" data-v="' + x + '" class="' + (k === 0 ? 'on' : '') + '"><small>' + (k === 0 && x === d ? 'hoje' : D.weekday(x, true)) + '</small><b>' + x.slice(8) + '</b></button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Horário</label><div class="chip-grid time" id="ag-hora"></div></div>' +
      '<div class="form-grid"><div class="field"><label for="ag-n">Seu nome</label><input class="input" id="ag-n" required autocomplete="name"></div><div class="field"><label for="ag-t">WhatsApp</label><input class="input" id="ag-t" required inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000"></div></div>' +
      '<button class="btn btn-gold btn-block" type="submit">' + I.cal + ' Confirmar agendamento</button><p class="notice">Você recebe a confirmação no WhatsApp. Sem compromisso.</p></form>', function (m) {
      maskTel($('#ag-t', m));
      function drawHoras() {
        var hs = horarios(st.dia).filter(function (h) { return st.dia !== d || +h.slice(0, 2) > hNow; });
        if (hs.indexOf(st.hora) < 0) st.hora = '';
        $('#ag-hora', m).innerHTML = hs.map(function (h) { return '<button type="button" data-v="' + h + '" class="' + (st.hora === h ? 'on' : '') + '">' + h + '</button>'; }).join('');
      }
      function seg(id, key, cb) { $('#' + id, m).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; st[key] = b.getAttribute('data-v'); $$('#' + id + ' button', m).forEach(function (x) { x.classList.toggle('on', x === b); }); if (cb) cb(); }); }
      seg('ag-tipo', 'tipo'); seg('ag-dia', 'dia', drawHoras); seg('ag-hora', 'hora'); drawHoras();
      $('#ag-form', m).addEventListener('submit', function (e) {
        e.preventDefault();
        if (!st.hora) return toast('Escolha um horário 🙂');
        var nome = $('#ag-n', m).value.trim(), tel = $('#ag-t', m).value.trim();
        var tipoTxt = { visita: 'Visita', 'test-drive': 'Test drive', avaliacao: 'Avaliação de troca' }[st.tipo];
        var quando = D.weekday(st.dia) + ', ' + D.dateBR(st.dia) + ' às ' + st.hora;
        var lead = D.addLead({ nome: nome, telefone: tel, carroId: carro ? carro.id : null, origem: 'site-agendamento', etapa: 'visita', mensagem: tipoTxt + ' agendado(a) para ' + quando });
        D.addAgenda({ tipo: st.tipo, data: st.dia, hora: st.hora, clienteNome: nome, telefone: tel, carroId: carro ? carro.id : null, leadId: lead ? lead.id : null, vendedorId: lead ? lead.vendedorId : null, origem: 'site' });
        track('schedule', { tipo: st.tipo, item_id: carro ? carro.id : '' });
        var msg = 'Olá, ' + cfg.loja + '! Acabei de agendar pelo site:\n' + tipoTxt + (carro ? ' — ' + D.carroNome(carro) : '') + '\n' + quando + '\nNome: ' + nome;
        m.innerHTML = '<div class="success"><div class="ok">' + I.check + '</div><h3 style="padding:0">Agendado! ☕</h3><p class="sub">' + esc(tipoTxt) + ' ' + esc(quando) + '.<br>Toque abaixo para confirmar com a gente no WhatsApp.</p><button class="btn btn-wa btn-block" id="ag-wa">' + I.wa + ' Confirmar no WhatsApp</button><p class="notice">' + esc(cfg.endereco + ' · ' + cfg.cidade) + '</p></div>';
        $('#ag-wa', m).onclick = function () { openUrl(D.waLink(msg)); closeModal(); };
      });
    });
  }

  /* ---------- cabeçalho, rodapé, bolha do WhatsApp ---------- */
  var NAV = [['index.html', 'Início'], ['estoque.html', 'Estoque'], ['financiamento.html', 'Financiamento'], ['venda-seu-carro.html', 'Venda seu carro'], ['loja.html', 'Quem somos'], ['contato.html', 'Contato']];
  function header() {
    var page = (location.pathname.split('/').pop() || 'index.html');
    var links = NAV.map(function (n) { return '<a href="' + n[0] + '"' + (page === n[0] || (page === 'carro.html' && n[0] === 'estoque.html') ? ' class="active" aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('');
    var sk = document.createElement('a'); sk.className = 'skip-link'; sk.href = '#conteudo'; sk.textContent = 'Pular para o conteúdo'; document.body.prepend(sk);
    var main = $('main'); if (main) main.id = 'conteudo';
    var h = document.createElement('header'); h.className = 'site-header';
    h.innerHTML = '<div class="container nav"><a class="brand" href="index.html" aria-label="' + esc(cfg.loja) + ' — início"><img src="' + esc(cfg.logo) + '" alt="' + esc(cfg.loja) + '" width="150" height="50"></a>' +
      '<nav class="nav-links" aria-label="Principal">' + links + '</nav>' +
      '<div class="nav-cta"><button class="icon-btn" data-open-favs aria-label="Meus favoritos">' + I.heart + '<span class="cnt fav-count"></span></button><a class="btn btn-ghost btn-sm" href="#" data-agendar>' + I.cal + 'Agendar visita</a><a class="btn btn-wa btn-sm" href="#" data-wa-geral>' + I.wa + '<span>WhatsApp</span></a>' +
      '<button class="burger" aria-label="Abrir menu" aria-expanded="false"><span></span></button></div></div>';
    sk.after(h);
    var m = document.createElement('div'); m.className = 'mobile-menu';
    m.innerHTML = NAV.map(function (n, i) { return '<a class="m-link" style="transition-delay:' + (i * 0.05) + 's" href="' + n[0] + '">' + n[1] + '</a>'; }).join('') +
      '<a class="btn btn-ghost btn-block" href="#" data-agendar style="margin-top:24px">' + I.cal + ' Agendar visita</a><a class="btn btn-gold btn-block" href="#" data-wa-geral style="margin-top:10px">' + I.wa + ' Falar no WhatsApp</a>';
    document.body.appendChild(m);
    $('.burger', h).addEventListener('click', function () { var o = document.body.classList.toggle('menu-open'); this.setAttribute('aria-expanded', o); });
    var onScroll = function () { h.classList.toggle('scrolled', window.scrollY > 30); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function footer() {
    var f = document.createElement('footer'); f.className = 'site-footer';
    f.innerHTML = '<div class="container">' +
      (cfg.versiculo ? '<div class="foot-verse"><p class="gold-text">“' + esc(cfg.versiculo.replace(/[“”"]/g, '')) + '”</p><small>' + esc(cfg.versiculoRef || '') + '</small></div>' : '') +
      '<div class="foot-grid">' +
      '<div class="foot-brand"><img src="' + esc(cfg.logoRodape || cfg.logo) + '" alt="' + esc(cfg.loja) + '" width="170" height="56"><p>Compra · Venda · Troca · Consignado.<br>' + esc(cfg.slogan) + '</p>' +
      '<div class="socials"><a href="https://instagram.com/' + esc(cfg.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + I.ig + '</a><a href="https://facebook.com/' + esc(cfg.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + I.fb + '</a><a href="#" data-wa-geral aria-label="WhatsApp">' + I.wa + '</a></div></div>' +
      '<div><h4>Navegue</h4>' + NAV.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '</div>' +
      '<div><h4>Atendimento</h4><a href="#" data-wa-geral>WhatsApp ' + esc(cfg.whatsappExibicao) + '</a><a href="tel:' + D.onlyDigits(cfg.telefone) + '">Telefone ' + esc(cfg.telefone) + '</a><a href="https://instagram.com/' + esc(cfg.instagram) + '" target="_blank" rel="noopener">@' + esc(cfg.instagram) + '</a><a href="#" data-agendar>Agendar visita</a><p>' + esc(cfg.horario) + '</p></div>' +
      '<div><h4>Loja</h4><p>' + esc(cfg.enderecoCompleto || cfg.endereco) + '<br>' + esc((cfg.bairro ? cfg.bairro + ' · ' : '') + cfg.cidade) + '</p><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(cfg.mapsQuery || (cfg.endereco + ', ' + cfg.cidade)) + '" target="_blank" rel="noopener">Abrir no mapa →</a>' + (cfg.googleReviewUrl ? '<a href="' + esc(cfg.googleReviewUrl) + '" target="_blank" rel="noopener">Avalie no Google ★</a>' : '') + '<a href="painel.html" rel="nofollow">Área da equipe</a></div>' +
      '</div><div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(cfg.loja) + (cfg.cnpj ? ' · CNPJ ' + esc(cfg.cnpj) : '') + '. Todos os direitos reservados. · <a href="privacidade.html">Privacidade</a></span><span>*Parcelas simuladas, sujeitas à aprovação de crédito. · Site por <a href="#">CLYENT</a></span></div></div>';
    document.body.appendChild(f);
    /* bolha do WhatsApp */
    var b = document.createElement('div'); b.className = 'loja-bubble';
    b.innerHTML = '<div class="tip" role="status"><button class="close" aria-label="Fechar">×</button><b>' + (cfg.dono ? 'Oi! Eu sou ' + esc(cfg.dono) + ' 👋' : 'Oi! Fala com a ' + esc(cfg.marcaCurta) + ' 👋') + '</b>Posso te ajudar a encontrar o carro certo pra você?</div><button class="face" data-wa-geral aria-label="Falar com a loja no WhatsApp"><img src="' + esc(cfg.donoFoto || cfg.icone) + '" alt=""><span class="wa">' + I.wa + '</span></button>';
    document.body.appendChild(b);
    if (document.body.getAttribute('data-page') !== 'carro') {
      var mbar = document.createElement('nav'); mbar.className = 'mobile-bar'; mbar.setAttribute('aria-label', 'Atalhos');
      mbar.innerHTML = '<a href="estoque.html">' + I.car + '<span>Estoque</span></a><a href="venda-seu-carro.html">' + I.swap + '<span>Vender meu carro</span></a><a href="#" class="wa" data-wa-geral>' + I.wa + '<span>WhatsApp</span></a>';
      document.body.appendChild(mbar); document.body.classList.add('has-mobile-bar');
    }
    var tip = $('.tip', b);
    $('.close', tip).onclick = function () { tip.classList.remove('on'); sess('loja_tip', '1'); };
    if (!sess('loja_tip')) setTimeout(function () { if (!sess('loja_tip')) { tip.classList.add('on'); setTimeout(function () { tip.classList.remove('on'); }, 9000); sess('loja_tip', '1'); } }, 7000);
  }

  /* ---------- SEO: dados estruturados da loja ---------- */
  function jsonLD(obj) { var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(obj); document.head.appendChild(s); }
  function seoLoja() {
    var base = cfg.site ? 'https://' + cfg.site.replace(/^https?:\/\//, '') : location.origin;
    jsonLD({
      '@context': 'https://schema.org', '@type': 'AutoDealer', name: cfg.loja, slogan: cfg.slogan, url: base, image: base + '/assets/img/og.jpg', logo: base + '/assets/img/apple-touch-icon.png',
      telephone: '+55 ' + cfg.telefone, address: { '@type': 'PostalAddress', streetAddress: cfg.endereco, addressLocality: 'São Paulo', addressRegion: 'SP', addressCountry: 'BR' },
      sameAs: ['https://instagram.com/' + cfg.instagram, 'https://facebook.com/' + cfg.facebook]
    });
  }
  function setMeta(name, content, prop) {
    var sel = prop ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
    var m = $(sel); if (!m) { m = document.createElement('meta'); m.setAttribute(prop ? 'property' : 'name', name); document.head.appendChild(m); }
    m.setAttribute('content', content);
  }

  /* ---------- animação de entrada ---------- */
  function reveal() {
    var els = $$('.reveal:not(.in), .reveal-l:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function intro() {
    if (!cfg.mostrarIntro || sess('loja_intro') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sess('loja_intro', '1');
    var o = document.createElement('div'); o.className = 'intro'; o.innerHTML = '<img src="' + esc(cfg.logo) + '" alt="">';
    document.body.appendChild(o);
    setTimeout(function () { o.classList.add('out'); setTimeout(function () { o.remove(); }, 700); }, 1500);
  }

  /* ---------- card de carro ---------- */
  function card(c, i) {
    var res = c.status === 'reservado', of = D.emOferta(c);
    var tags = [];
    if (res) tags.push('<span class="tag res">Reservado</span>');
    else if (of) tags.push('<span class="tag oferta">Baixou ' + D.brl(c.precoAnterior - c.preco) + '</span>');
    if (!res && isNovo(c)) tags.push('<span class="tag novo">Chegou agora</span>');
    if (!res && !of && !isNovo(c) && c.destaque) tags.push('<span class="tag">Destaque</span>');
    return '<article class="car-card reveal" style="--d:' + ((i % 3) * 0.08) + 's" data-id="' + esc(c.id) + '">' +
      '<div class="car-media"><img src="' + esc(D.carroFoto(c)) + '" alt="' + esc(D.carroNome(c)) + '" loading="lazy" width="640" height="480">' +
      '<div class="tag-row">' + tags.join('') + '</div>' +
      '<span class="tag tag-year">' + c.anoFab + '/' + String(c.anoMod).slice(2) + '</span>' + (c.fotos && c.fotos.length > 1 ? '<span class="photo-count">' + I.camera + c.fotos.length + '</span>' : '') +
      '<button class="fav-btn ' + (isFav(c.id) ? 'on' : '') + '" data-fav="' + esc(c.id) + '" aria-pressed="' + isFav(c.id) + '" aria-label="Favoritar ' + esc(D.carroTitulo(c)) + '">' + I.heart + '</button></div>' +
      '<div class="car-body"><a class="car-title" href="' + carUrl(c) + '" data-car-link>' + esc(D.carroTitulo(c)) + '<small>' + esc(c.versao) + '</small></a>' +
      '<div class="car-specs">' + [D.km(c.km), c.cambio.split(' ')[0], c.combustivel, c.cor].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="car-foot"><div class="car-price">' + (of ? '<span class="price-old">de ' + D.brl(c.precoAnterior) + '</span>' : '<small>Preço</small>') + '<b>' + D.brl(c.preco) + '</b><em>' + condTxt(c) + '</em></div>' +
      '<button class="wa-mini" data-wa-car="' + esc(c.id) + '" aria-label="Chamar no WhatsApp sobre ' + esc(D.carroTitulo(c)) + '">' + I.wa + '</button></div></div></article>';
  }
  function bindCards(root) {
    root.addEventListener('click', function (e) {
      var fv = e.target.closest('[data-fav]');
      if (fv) { e.preventDefault(); e.stopPropagation(); toggleFav(fv.getAttribute('data-fav'), fv); return; }
      var wa = e.target.closest('[data-wa-car]');
      if (wa) { e.preventDefault(); e.stopPropagation(); var c = D.getCarro(wa.getAttribute('data-wa-car')); if (c) waCarro(c); return; }
      var cd = e.target.closest('.car-card');
      if (cd) { e.preventDefault(); var car = D.getCarro(cd.getAttribute('data-id')); if (car) openUrl(new URL(carUrl(car), location.href).href); }
    });
  }

  /* ---------- simulador ---------- */
  function setRange(el) { var p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); }
  function simulator(root, opts) {
    opts = opts || {};
    var st = { valor: opts.valor || 90000, entrada: 0, troca: 0, meses: 60 };
    var vEl = $('[data-sim-valor]', root), eEl = $('[data-sim-entrada]', root), tEl = $('[data-sim-troca]', root), out = $('[data-sim-out]', root), lbV = $('[data-sim-lv]', root), lbE = $('[data-sim-le]', root), lbT = $('[data-sim-lt]', root), info = $('[data-sim-info]', root);
    function draw() {
      if (eEl) { eEl.max = Math.round(st.valor * 0.7 / 1000) * 1000; if (st.entrada > +eEl.max) st.entrada = +eEl.max; eEl.value = st.entrada; setRange(eEl); }
      if (tEl) { tEl.max = Math.round(st.valor * 0.8 / 1000) * 1000; if (st.troca > +tEl.max) st.troca = +tEl.max; tEl.value = st.troca; setRange(tEl); }
      if (vEl) setRange(vEl);
      if (lbV) lbV.textContent = D.brl(st.valor);
      if (lbE) lbE.textContent = st.entrada ? D.brl(st.entrada) : 'Sem entrada';
      if (lbT) lbT.textContent = st.troca ? D.brl(st.troca) : 'Sem troca';
      var p = D.parcela(st.valor, st.entrada + st.troca, st.meses);
      out.textContent = D.brl(p);
      if (info) info.textContent = st.meses + 'x · ' + (st.entrada ? 'entrada de ' + D.brl(st.entrada) : 'sem entrada') + (st.troca ? ' · troca de ' + D.brl(st.troca) : '') + ' · taxa simulada de ' + String(cfg.taxaJuros).replace('.', ',') + '% a.m.';
    }
    if (vEl) { vEl.value = st.valor; vEl.addEventListener('input', function () { st.valor = +this.value; draw(); }); }
    if (eEl) eEl.addEventListener('input', function () { st.entrada = +this.value; draw(); });
    if (tEl) tEl.addEventListener('input', function () { st.troca = +this.value; draw(); });
    $$('[data-sim-meses] button', root).forEach(function (b) {
      b.addEventListener('click', function () { $$('[data-sim-meses] button', root).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.meses = +b.textContent.replace(/\D/g, ''); draw(); });
    });
    draw();
    return st;
  }
  function simHTML(withValor, withTroca) {
    return (withValor ? '<div class="field"><label>Valor do carro <b data-sim-lv></b></label><input type="range" min="30000" max="250000" step="1000" data-sim-valor aria-label="Valor do carro"></div>' : '') +
      '<div class="field"><label>Entrada <b data-sim-le></b></label><input type="range" min="0" max="50000" step="1000" value="0" data-sim-entrada aria-label="Valor da entrada"></div>' +
      (withTroca ? '<div class="field"><label>Meu carro na troca <b data-sim-lt></b></label><input type="range" min="0" max="80000" step="1000" value="0" data-sim-troca aria-label="Valor do carro na troca"></div>' : '') +
      '<div class="field"><label>Prazo</label><div class="seg" data-sim-meses><button type="button">24x</button><button type="button">36x</button><button type="button">48x</button><button type="button" class="on">60x</button></div></div>';
  }

  /* ---------- páginas ---------- */
  var pages = {};

  function reel() {
    var v = $('#reel-video'), bt = $('#reel-sound'); if (!v || !bt) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); }
    bt.addEventListener('click', function () {
      var on = v.muted; v.muted = !on; if (on) { v.currentTime = 0; v.play(); }
      bt.classList.toggle('on', on); bt.querySelector('b').textContent = on ? 'Som ligado' : 'Ouvir';
      bt.setAttribute('aria-label', on ? 'Desligar o som' : 'Ativar o som'); track('video_som');
    });
  }
  /* faixas do estoque: atalhos da home e do hero */
  var FAIXAS = [
    { t: 'Até R$ 40 mil', s: 'Primeiro carro e economia', q: 'ate=40000', f: function (c) { return c.preco <= 40000; } },
    { t: 'Automáticos até R$ 60 mil', s: 'Conforto sem pesar no bolso', q: 'ate=60000&cambio=Automático,Automatizado', f: function (c) { return c.preco <= 60000 && !/^manual/i.test(c.cambio); } },
    { t: 'SUVs', s: 'Espaço e posição de dirigir', q: 'carroceria=SUV', f: function (c) { return c.carroceria === 'SUV'; } },
    { t: 'De 2019 em diante', s: 'Os mais novos da loja', q: 'ano=2019', f: function (c) { return c.anoMod >= 2019; } }
  ];
  function faixasHome(v) {
    var fx = FAIXAS.map(function (f) { var l = v.filter(f.f).sort(function (a, b) { return a.preco - b.preco; }); return { f: f, l: l }; }).filter(function (x) { return x.l.length; });
    var qc = $('#quick-chips');
    if (qc) qc.innerHTML = fx.map(function (x) { return '<a href="estoque.html?' + x.f.q + '">' + esc(x.f.t) + '<small>' + x.l.length + '</small></a>'; }).join('');
    var g = $('#faixas'); if (!g) return;
    g.innerHTML = fx.map(function (x, i) {
      var comFoto = x.l.filter(function (c) { return c.fotos && c.fotos.length; }), cap = comFoto[0] || x.l[0];
      return '<a class="faixa reveal" style="--d:' + (i * 0.07) + 's" href="estoque.html?' + x.f.q + '"><div class="faixa-img"><img src="' + esc(D.carroFoto(cap)) + '" alt="" loading="lazy"></div>' +
        '<div class="faixa-body"><span class="faixa-n">' + x.l.length + (x.l.length === 1 ? ' carro' : ' carros') + '</span><h3>' + esc(x.f.t) + '</h3><p>' + esc(x.f.s) + '</p>' +
        '<div class="faixa-foot"><span>a partir de <b>' + D.brl(x.l[0].preco) + '</b></span>' + I.arrow + '</div></div></a>';
    }).join('');
  }
  pages.home = function () {
    intro();
    var v = D.vitrine();
    if (cfg.videoHero) { var bg = $('.hero-bg'); bg.innerHTML = '<video autoplay muted loop playsinline src="' + esc(cfg.videoHero) + '"></video>'; }
    var hd = cfg.heroDestaque || ''; $('[data-hero-title]').innerHTML = hd ? esc(cfg.heroTitulo).replace(esc(hd), '<em class="gold-text shine">' + esc(hd) + '</em>') : esc(cfg.heroTitulo);
    reel();
    $('[data-hero-sub]').textContent = cfg.heroSub;
    var marcas = Array.from(new Set(v.map(function (c) { return c.marca; }))).sort();
    $('#qs-marca').innerHTML = '<option value="">Todas as marcas</option>' + marcas.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');
    $('#qs-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = new URLSearchParams(); if ($('#qs-marca').value) q.set('marca', $('#qs-marca').value); if ($('#qs-preco').value) q.set('ate', $('#qs-preco').value);
      location.href = 'estoque.html' + (q.toString() ? '?' + q : '');
    });
    var dest = v.filter(function (c) { return c.destaque; }); if (dest.length < 3) dest = v;
    dest.sort(function (a, b) { return (temFoto(b) - temFoto(a)) || (isNovo(b) - isNovo(a)) || (D.emOferta(b) - D.emOferta(a)) || (b.preco - a.preco); });
    var g = $('#destaques'); g.innerHTML = dest.slice(0, 6).map(card).join(''); bindCards(g);
    $$('[data-count-estoque]').forEach(function (el) { el.textContent = v.length; el.setAttribute('data-counter', v.length); });
    faixasHome(v);
    /* carta da loja */
    var carta = $('#carta-texto'); if (carta) carta.innerHTML = cfg.cartaLoja.split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    /* galeria de entregas vinda do painel */
    var ent = (db.entregas || []).filter(function (e) { return e.publicado; }).slice(0, 5);
    var mz = $('#entregas');
    if (mz) { if (ent.length) mz.innerHTML = ent.map(function (e) { return '<figure><img src="' + esc(e.foto) + '" alt="' + esc(e.legenda) + '" loading="lazy"><figcaption>' + esc(e.legenda) + '</figcaption></figure>'; }).join(''); else mz.closest('section').remove(); }
    /* depoimentos reais (só aparece quando cadastrados no painel) */
    var dep = (db.depoimentos || []).filter(function (x) { return x.publicado; });
    var ds = $('#depoimentos');
    if (ds) {
      if (!dep.length) ds.remove();
      else $('#dep-grid').innerHTML = dep.slice(0, 6).map(function (x) { return '<figure class="reveal"><span class="stars">★★★★★</span><blockquote>“' + esc(x.texto) + '”</blockquote><figcaption>' + (x.foto ? '<img src="' + esc(x.foto) + '" alt="">' : '') + '<div><b>' + esc(x.nome) + '</b><small>' + esc(x.carro || '') + '</small></div></figcaption></figure>'; }).join('');
    }
    simulator($('#sim'));
    $('#sim-cta').addEventListener('click', function () {
      var s = $('#sim');
      waGeral('Olá! Fiz uma simulação no site: carro de ' + $('[data-sim-lv]', s).textContent + ', ' + $('[data-sim-le]', s).textContent.toLowerCase() + ', parcela estimada de ' + $('[data-sim-out]', s).textContent + '. Quero aprovar meu crédito!', 'site-financiamento');
    });
    faqSchema();
    exitIntent();
  };

  pages.estoque = function () {
    var all = D.vitrine();
    var qs = new URLSearchParams(location.search);
    var lst = function (k) { return qs.get(k) ? qs.get(k).split(',').filter(Boolean) : []; };
    var st = { q: qs.get('q') || '', marca: lst('marca'), carroceria: lst('carroceria'), cambio: lst('cambio'), comb: [], ate: +(qs.get('ate') || 0), anoMin: +(qs.get('ano') || 0), kmMax: 0, sort: 'destaque', ofertas: qs.get('ofertas') === '1' };
    function uniq(k) { return Array.from(new Set(all.map(function (c) { return k === 'cambio' ? c.cambio.split(' ')[0] : c[k]; }))).sort(); }
    function chips(id, key, vals) {
      var el = $('#' + id); el.innerHTML = vals.map(function (v) { return '<button type="button" class="' + (st[key].indexOf(v) > -1 ? 'on' : '') + '" data-v="' + esc(v) + '" aria-pressed="' + (st[key].indexOf(v) > -1) + '">' + esc(v) + '</button>'; }).join('');
      el.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var v = b.getAttribute('data-v'); var i = st[key].indexOf(v); if (i > -1) st[key].splice(i, 1); else st[key].push(v); b.classList.toggle('on'); b.setAttribute('aria-pressed', i < 0); render(); };
    }
    chips('f-marca', 'marca', uniq('marca')); chips('f-carroceria', 'carroceria', uniq('carroceria')); chips('f-cambio', 'cambio', uniq('cambio')); chips('f-comb', 'comb', uniq('combustivel'));
    var anos = Array.from(new Set(all.map(function (c) { return c.anoMod; }))).sort();
    $('#f-ano').innerHTML = '<option value="0">Qualquer ano</option>' + anos.map(function (a) { return '<option value="' + a + '">A partir de ' + a + '</option>'; }).join('');
    $('#f-ate').value = String(st.ate); if (st.anoMin) $('#f-ano').value = String(st.anoMin);
    $('#q').value = st.q;
    var of = $('#f-ofertas'); if (of) { of.checked = st.ofertas; of.onchange = function () { st.ofertas = of.checked; render(); }; }
    $('#q').addEventListener('input', function () { st.q = this.value; render(); });
    $('#f-ate').addEventListener('change', function () { st.ate = +this.value; render(); });
    $('#f-ano').addEventListener('change', function () { st.anoMin = +this.value; render(); });
    $('#f-km').addEventListener('change', function () { st.kmMax = +this.value; render(); });
    $('#sort').addEventListener('change', function () { st.sort = this.value; render(); });
    $('#f-clear').addEventListener('click', function () { st = { q: '', marca: [], carroceria: [], cambio: [], comb: [], ate: 0, anoMin: 0, kmMax: 0, sort: st.sort, ofertas: false }; $('#q').value = ''; $('#f-ate').value = '0'; $('#f-ano').value = '0'; $('#f-km').value = '0'; if (of) of.checked = false; $$('.chips button').forEach(function (b) { b.classList.remove('on'); }); render(); });
    var fl = $('.filters'), scrim = $('.scrim');
    function closeF() { fl.classList.remove('open'); scrim.classList.remove('on'); }
    $('.btn-filters').addEventListener('click', function () { fl.classList.add('open'); scrim.classList.add('on'); });
    scrim.addEventListener('click', closeF); $('#f-apply').addEventListener('click', closeF);
    var grid = $('#grid'); bindCards(grid);
    function norm(s) { return D.slug(s).replace(/-/g, ' '); }
    function render() {
      var q = norm(st.q);
      var list = all.filter(function (c) {
        if (q && norm(D.carroNome(c) + ' ' + c.cor + ' ' + c.carroceria).indexOf(q) < 0) return false;
        if (st.marca.length && st.marca.indexOf(c.marca) < 0) return false;
        if (st.carroceria.length && st.carroceria.indexOf(c.carroceria) < 0) return false;
        if (st.cambio.length && st.cambio.indexOf(c.cambio.split(' ')[0]) < 0) return false;
        if (st.comb.length && st.comb.indexOf(c.combustivel) < 0) return false;
        if (st.ate && c.preco > st.ate) return false;
        if (st.anoMin && c.anoMod < st.anoMin) return false;
        if (st.kmMax && c.km > st.kmMax) return false;
        if (st.ofertas && !D.emOferta(c)) return false;
        return true;
      });
      var s = st.sort;
      list.sort(function (a, b) {
        if (s === 'menor') return a.preco - b.preco; if (s === 'maior') return b.preco - a.preco;
        if (s === 'ano') return b.anoMod - a.anoMod; if (s === 'km') return a.km - b.km;
        if (s === 'novos') return a.dataEntrada < b.dataEntrada ? 1 : -1;
        return (temFoto(b) - temFoto(a)) || (b.destaque - a.destaque) || (b.preco - a.preco);
      });
      $('#count').textContent = list.length + (list.length === 1 ? ' carro encontrado' : ' carros encontrados');
      grid.innerHTML = list.length ? list.map(card).join('') : '<div class="empty" style="grid-column:1/-1"><h3>Nenhum carro com esses filtros</h3><p>Fala com a gente: a gente encontra o carro certo pra você, mesmo que ele ainda não esteja no site.</p><a class="btn btn-wa" href="#" data-wa-geral style="margin-top:12px">' + I.wa + ' Pedir pelo WhatsApp</a></div>';
      reveal();
    }
    render();
  };

  pages.carro = function () {
    var id = new URLSearchParams(location.search).get('id');
    var c = D.getCarro(id);
    var root = $('#car');
    if (!c || c.status === 'vendido' || !c.publicado) {
      root.innerHTML = '<div class="empty" style="margin-top:40px"><h3>' + (c && c.status === 'vendido' ? 'Esse carro já foi vendido 🎉' : 'Carro não encontrado') + '</h3><p>Mas temos outras ótimas opções esperando por você.</p><a class="btn btn-gold" href="estoque.html" style="margin-top:12px">Ver estoque completo</a></div>';
      setMeta('robots', 'noindex');
      return;
    }
    D.stat('view', c.id);
    track('view_item', { item_id: c.id, item_name: D.carroNome(c), value: c.preco, currency: 'BRL' });
    var titulo = D.carroNome(c) + ' · ' + D.brl(c.preco) + ' · ' + cfg.loja;
    var descr = [D.carroNome(c), D.km(c.km), c.cambio, c.cor].filter(Boolean).join(', ') + '. ' + D.brl(c.preco) + ' ou em até 60x*. Aceitamos troca. ' + cfg.loja + ', ' + cfg.endereco + '.';
    document.title = titulo; setMeta('description', descr); setMeta('og:title', titulo, true); setMeta('og:description', descr, true); setMeta('og:image', new URL(D.carroFoto(c), location.href).href, true);
    jsonLD({ '@context': 'https://schema.org', '@type': 'Car', name: D.carroNome(c), brand: { '@type': 'Brand', name: c.marca }, model: c.modelo, vehicleModelDate: String(c.anoMod), productionDate: String(c.anoFab), color: c.cor, fuelType: c.combustivel, vehicleTransmission: c.cambio, bodyType: c.carroceria, mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.km, unitCode: 'KMT' }, image: (c.fotos || []).map(function (f) { return new URL(f, location.href).href; }), description: c.descricao, offers: { '@type': 'Offer', price: c.preco, priceCurrency: 'BRL', availability: c.status === 'reservado' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock', itemCondition: 'https://schema.org/UsedCondition', seller: { '@type': 'AutoDealer', name: cfg.loja } } });

    var fotos = (c.fotos && c.fotos.length) ? c.fotos.slice() : [D.carroFoto(c)];
    var thumbs = fotos.map(function (f, i) { return '<button type="button" data-i="' + i + '" class="' + (i === 0 ? 'on' : '') + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(f) + '" alt=""></button>'; });
    for (var k = fotos.length; k < 5; k++) thumbs.push('<button type="button" class="thumb-soon" disabled>' + I.camera + 'Mais fotos<br>em breve</button>');
    var ficha = [['Marca', c.marca], ['Modelo', c.modelo], ['Versão', c.versao], ['Ano', c.anoFab + '/' + c.anoMod], ['Quilometragem', D.km(c.km)], ['Câmbio', c.cambio], ['Combustível', c.combustivel], ['Cor', c.cor], ['Carroceria', c.carroceria], ['Portas', c.portas || 4]];
    var parc = D.parcela(c.preco, 0, 60), of = D.emOferta(c), cred = D.creditoNivel(c);
    var video = '';
    if (c.videoUrl) {
      var yt = c.videoUrl.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
      video = '<div class="video-box reveal">' + (yt ? '<iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="Vídeo do carro" allowfullscreen loading="lazy"></iframe>' : '<video controls playsinline preload="metadata" src="' + esc(c.videoUrl) + '" poster="' + esc(fotos[0]) + '"></video>') + '</div>';
    }
    root.innerHTML =
      '<nav class="crumbs reveal" aria-label="Você está em"><a href="index.html">Início</a> / <a href="estoque.html">Estoque</a> / <span>' + esc(D.carroTitulo(c)) + '</span></nav>' +
      '<div class="car-layout"><div>' +
      '<div class="gallery-main reveal" id="gm"><img src="' + esc(fotos[0]) + '" alt="' + esc(D.carroNome(c)) + '">' +
      (fotos.length > 1 ? '<button class="gallery-nav prev" aria-label="Foto anterior">' + I.left + '</button><button class="gallery-nav next" aria-label="Próxima foto">' + I.right + '</button>' : '') +
      '<span class="gallery-count"><span id="gi">1</span> / ' + fotos.length + '</span>' +
      '<div class="tag-row">' + (c.status === 'reservado' ? '<span class="tag res">Reservado</span>' : '') + (of ? '<span class="tag oferta">Preço baixou</span>' : '') + (isNovo(c) ? '<span class="tag novo">Chegou agora</span>' : '') + '</div></div>' +
      '<div class="thumbs reveal" id="th">' + thumbs.join('') + '</div>' +
      (c.comentarioLoja ? '<div class="loja-note reveal"><img src="' + esc(cfg.donoFoto || cfg.icone) + '" alt=""><div><small>' + (cfg.dono ? esc(cfg.dono) + ' recomenda' : 'A ' + esc(cfg.marcaCurta) + ' recomenda') + '</small><p>“' + esc(c.comentarioLoja) + '”</p></div></div>' : '') +
      video +
      '<div class="panel reveal"><h3>Ficha técnica</h3><div class="ficha">' + ficha.map(function (f) { return '<div><span>' + f[0] + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div></div>' +
      (c.opcionais && c.opcionais.length ? '<div class="panel reveal"><h3>Opcionais</h3><div class="opc">' + c.opcionais.map(function (o) { return '<span>' + I.check + esc(o) + '</span>'; }).join('') + '</div></div>' : '') +
      (c.descricao ? '<div class="panel reveal"><h3>Sobre este carro</h3><p style="color:var(--muted);margin:0">' + esc(c.descricao) + '</p></div>' : '') +
      '</div>' +
      '<aside class="buy-box reveal" style="--d:.1s"><span class="eyebrow">' + esc(c.carroceria) + ' · ' + c.anoFab + '/' + c.anoMod + '</span>' +
      '<h1 style="margin-top:14px">' + esc(D.carroTitulo(c)) + '</h1><div class="ver">' + esc(c.versao) + '</div>' +
      (of ? '<span class="price-old" style="font-size:15px">de ' + D.brl(c.precoAnterior) + '</span>' : '') +
      '<div class="price-big">' + D.brl(c.preco) + (of ? '<span class="price-save">−' + D.brl(c.precoAnterior - c.preco) + '</span>' : '') + '</div><div class="price-sub">' + (cred === 'facil' ? 'ou 60x de ' + D.brl(parc) + '* · simulação sujeita à análise de crédito' : cred === 'consulta' ? 'Financiamento sob consulta* · aceitamos troca' : 'À vista ou com o seu carro na troca') + '</div>' +
      '<div class="spec-row"><div><small>Ano</small><b>' + String(c.anoMod) + '</b></div><div><small>KM</small><b>' + D.num(Math.round(c.km / 1000)) + ' mil</b></div><div><small>Câmbio</small><b>' + esc(c.cambio.split(' ')[0].slice(0, 4)) + '.</b></div><div><small>Comb.</small><b>' + esc(c.combustivel) + '</b></div></div>' +
      '<div class="buy-actions"><button class="btn btn-wa btn-block" id="b-wa">' + I.wa + ' Tenho interesse</button>' +
      (cred === 'avista' ? '<button class="btn btn-gold btn-block" id="b-cond">' + I.coin + ' Consultar condições</button>' : '<button class="btn btn-gold btn-block" id="b-fin">' + I.coin + ' Simular financiamento</button>') +
      '<button class="btn btn-ghost btn-block" id="b-ag">' + I.cal + ' Agendar test drive</button>' +
      '<button class="btn btn-ghost btn-block" id="b-troca">' + I.swap + ' Tenho um carro na troca</button></div>' +
      '<div class="share-row"><button type="button" data-fav="' + esc(c.id) + '" class="' + (isFav(c.id) ? 'on' : '') + '" aria-pressed="' + isFav(c.id) + '">' + I.heart + '<span>' + (isFav(c.id) ? 'Favoritado' : 'Favoritar') + '</span></button><button type="button" id="b-share">' + I.share + 'Compartilhar</button></div>' +
      '<div id="sim-car" style="display:none;margin-top:22px;padding-top:22px;border-top:1px solid var(--line-2)">' + simHTML(false, true) + '<div class="sim-result" style="text-align:center"><small>Parcela estimada</small><div class="big" data-sim-out style="font-size:40px"></div><p data-sim-info></p></div><button class="btn btn-wa btn-block" id="b-sim-wa">' + I.wa + ' Quero aprovar meu crédito</button></div>' +
      '<div class="trust"><img src="' + esc(cfg.icone) + '" alt=""><div><b>' + esc(cfg.slogan) + '</b><small>' + esc(cfg.endereco) + ' · ' + esc(cfg.bairro || cfg.cidade) + '</small></div></div>' +
      '<p class="notice">*Simulação com taxa de ' + String(cfg.taxaJuros).replace('.', ',') + '% a.m., sujeita à aprovação de crédito. Valores podem mudar sem aviso.</p></aside></div>' +
      '<section class="section" style="padding-bottom:20px"><div class="section-head"><div><span class="eyebrow">Você também pode gostar</span><h2>Carros parecidos</h2></div><a class="btn btn-ghost" href="estoque.html">Ver estoque ' + I.arrow + '</a></div><div class="car-grid" id="sim-grid"></div></section>';
    var mb = document.createElement('div'); mb.className = 'mobile-buy';
    mb.innerHTML = '<div><b>' + D.brl(c.preco) + '</b><small>' + (cred === 'facil' ? 'ou 60x de ' + D.brl(parc) + '*' : cred === 'consulta' ? 'Financiamento sob consulta*' : 'À vista ou na troca') + '</small></div><button class="btn btn-wa">' + I.wa + ' Tenho interesse</button>';
    document.body.appendChild(mb); document.body.classList.add('has-mobile-buy');
    $('.btn', mb).addEventListener('click', function () { waCarro(c); });
    var idx = 0, gm = $('#gm'), img = $('img', gm);
    function go(i) { idx = (i + fotos.length) % fotos.length; img.src = fotos[idx]; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; $('#gi').textContent = idx + 1; $$('#th button[data-i]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-i') === idx); }); }
    $('#th').addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) go(+b.getAttribute('data-i')); });
    if (fotos.length > 1) {
      $('.prev', gm).addEventListener('click', function () { go(idx - 1); }); $('.next', gm).addEventListener('click', function () { go(idx + 1); });
      var x0 = null; gm.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      gm.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); x0 = null; });
      document.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });
    }
    $('#b-wa').addEventListener('click', function () { waCarro(c); });
    $('#b-troca').addEventListener('click', function () { waCarro(c, 'Tenho um carro para dar na troca.'); });
    $('#b-ag').addEventListener('click', function () { openAgendar(c, 'test-drive'); });
    $$('.share-row [data-fav]').forEach(function (b) { b.addEventListener('click', function () { toggleFav(c.id); }); });
    $('#b-share').addEventListener('click', function () {
      var data = { title: D.carroNome(c), text: D.carroNome(c) + ' por ' + D.brl(c.preco) + ' na ' + cfg.loja, url: location.href };
      track('share', { item_id: c.id });
      if (navigator.share) navigator.share(data).catch(function () { });
      else openUrl('https://wa.me/?text=' + encodeURIComponent(data.text + ' ' + data.url));
    });
    var simOn = false;
    var bc = $('#b-cond'); if (bc) bc.addEventListener('click', function () { waCarro(c, 'Quero saber as condições de pagamento.'); });
    if ($('#b-fin')) $('#b-fin').addEventListener('click', function () { var s = $('#sim-car'); s.style.display = 'block'; if (!simOn) { simulator(s, { valor: c.preco }); simOn = true; } s.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    $('#b-sim-wa').addEventListener('click', function () {
      var s = $('#sim-car'); waCarro(c, 'Simulei ' + $('[data-sim-info]', s).textContent.split(' · taxa')[0] + ', parcela de ' + $('[data-sim-out]', s).textContent + '. Quero aprovar meu crédito.');
    });
    var sim = D.vitrine().filter(function (x) { return x.id !== c.id; }).sort(function (a, b) {
      var sa = (a.carroceria === c.carroceria ? 0 : 1) + (temFoto(a) ? 0 : 1) + Math.abs(a.preco - c.preco) / c.preco, sb = (b.carroceria === c.carroceria ? 0 : 1) + (temFoto(b) ? 0 : 1) + Math.abs(b.preco - c.preco) / c.preco; return sa - sb;
    }).slice(0, 3);
    var sg = $('#sim-grid'); sg.innerHTML = sim.map(card).join(''); bindCards(sg);
  };

  /* quiz de crédito (substitui o formulário longo) */
  pages.financiamento = function () {
    simulator($('#sim'));
    var q = $('#quiz'); if (!q) return;
    var ans = {}, steps = $$('.quiz-step', q), cur = 0;
    var carSel = $('#qz-carro');
    carSel.innerHTML = '<option value="">Ainda estou escolhendo</option>' + D.vitrine().map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(D.carroNome(c)) + ' — ' + D.brl(c.preco) + '</option>'; }).join('');
    var pre = new URLSearchParams(location.search).get('carro'); if (pre) carSel.value = pre;
    maskTel($('#qz-tel'));
    function show(i) {
      cur = i; steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      $('.quiz-bar i', q).style.width = Math.round(i / (steps.length - 1) * 100) + '%';
      $('#qz-count').textContent = i < steps.length - 1 ? 'Pergunta ' + (i + 1) + ' de ' + (steps.length - 1) : 'Pronto!';
      $('#qz-back').style.visibility = i > 0 && i < steps.length - 1 ? 'visible' : 'hidden';
      var f = $('input, select', steps[i]); if (f && window.innerWidth > 760) f.focus({ preventScroll: true });
    }
    q.addEventListener('click', function (e) {
      var b = e.target.closest('.opts button'); if (!b) return;
      var step = b.closest('.quiz-step'); $$('.opts button', step).forEach(function (x) { x.classList.toggle('on', x === b); });
      ans[step.getAttribute('data-k')] = b.getAttribute('data-v');
      setTimeout(function () { show(cur + 1); }, 220);
    });
    $('#qz-next-car').onclick = function () { ans.carro = carSel.value; show(cur + 1); };
    $('#qz-back').onclick = function () { show(Math.max(0, cur - 1)); };
    $('#qz-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var c = D.getCarro(ans.carro), nome = $('#qz-nome').value.trim(), tel = $('#qz-tel').value.trim();
      var resumo = 'Entrada: ' + ans.entrada + ' · Troca: ' + ans.troca + ' · Renda: ' + ans.renda + ' · CNH: ' + ans.cnh;
      D.addLead({ nome: nome, telefone: tel, carroId: c ? c.id : null, origem: 'site-financiamento', mensagem: 'Pré-análise · ' + resumo });
      track('generate_lead', { method: 'pre_analise', item_id: c ? c.id : '' });
      var msg = 'Olá, ' + cfg.marcaCurta + '! Quero fazer minha pré-análise de crédito.\nNome: ' + nome + '\nWhatsApp: ' + tel + (c ? '\nCarro: ' + D.carroNome(c) : '') + '\n' + resumo.replace(/ · /g, '\n');
      var p = c ? D.parcela(c.preco, 0, 60) : 0;
      $('#qz-result').innerHTML = '<div class="success"><div class="ok">' + I.check + '</div><h3>Recebemos, ' + esc(nome.split(' ')[0]) + '!</h3><p class="sub" style="max-width:480px;margin:0 auto 20px">A equipe da ' + esc(cfg.marcaCurta) + ' vai consultar os bancos parceiros e te chamar no WhatsApp.' + (p ? ' Pra esse carro, a parcela estimada fica em torno de <b style="color:var(--gold-hi)">' + D.brl(p) + '</b> em 60x sem entrada*.' : '') + '</p><button class="btn btn-wa" id="qz-wa">' + I.wa + ' Falar agora no WhatsApp</button><p class="notice">*Estimativa sujeita à análise de crédito.</p></div>';
      show(steps.length - 1);
      $('#qz-wa').onclick = function () { openUrl(D.waLink(msg)); };
    });
    show(0);
  };

  pages.venda = function () {
    reel();
    $$('input[name=tel]').forEach(maskTel);
    $('#venda-form').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target;
      var carro = f.marca.value + ' ' + f.modelo.value + ' ' + f.ano.value;
      var msg = 'Olá! Quero vender/trocar meu carro.\nCarro: ' + carro + ' ' + f.versao.value + '\nKM: ' + f.km.value + '\nEstado: ' + f.estado.value + '\nValor pretendido: ' + (f.valor.value || 'a combinar') + '\nNome: ' + f.nome.value + '\nWhatsApp: ' + f.tel.value + '\n(Vou enviar as fotos por aqui)';
      D.addLead({ nome: f.nome.value, telefone: f.tel.value, origem: 'site-venda-seu-carro', mensagem: 'Avaliação: ' + carro + ' · ' + f.km.value + ' km · ' + f.estado.value + (f.valor.value ? ' · pede ' + f.valor.value : ''),
        /* pré-avaliação: o painel já abre a avaliação preenchida com estes dados */
        preAval: { marca: f.marca.value.trim(), modelo: f.modelo.value.trim(), ano: +D.onlyDigits(f.ano.value).slice(0, 4) || 0, versao: f.versao.value.trim(), km: +D.onlyDigits(f.km.value) || 0, estado: f.estado.value, pedido: +D.onlyDigits(String(f.valor.value).split(',')[0]) || 0 } });
      track('generate_lead', { method: 'avaliacao_troca' });
      toast('Recebido! Envie as fotos do carro pelo WhatsApp.'); f.reset(); setTimeout(function () { openUrl(D.waLink(msg)); }, 600);
    });
    var ag = $('#venda-agendar'); if (ag) ag.onclick = function (e) { e.preventDefault(); openAgendar(null, 'avaliacao'); };
  };

  pages.contato = function () {
    $$('input[name=tel]').forEach(maskTel);
    $('[data-endereco]').textContent = (cfg.enderecoCompleto || cfg.endereco) + ' · ' + (cfg.bairro ? cfg.bairro + ' · ' : '') + cfg.cidade;
    $('[data-horario]').textContent = cfg.horario;
    $('#map').src = 'https://www.google.com/maps?q=' + encodeURIComponent(cfg.mapsQuery || (cfg.endereco + ', ' + cfg.cidade)) + '&output=embed';
    $('#ct-form').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target;
      D.addLead({ nome: f.nome.value, telefone: f.tel.value, origem: 'site-contato', mensagem: f.msg.value });
      track('generate_lead', { method: 'contato' });
      toast('Mensagem enviada! Abrindo o WhatsApp…'); var m = 'Olá! Sou ' + f.nome.value + '. ' + f.msg.value; f.reset();
      setTimeout(function () { openUrl(D.waLink(m)); }, 600);
    });
  };
  pages.loja = function () {
    reel();
    var carta = $('#carta-texto'); if (carta) carta.innerHTML = cfg.cartaLoja.split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var v = $('[data-versiculo]'); if (v) v.textContent = '“' + cfg.versiculo.replace(/[“”"]/g, '') + '”';
    var vr = $('[data-versiculo-ref]'); if (vr) vr.textContent = cfg.versiculoRef;
  };

  /* FAQ → dados estruturados (aparece no Google) */
  function faqSchema() {
    var items = $$('.faq details'); if (!items.length) return;
    jsonLD({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(function (d) { return { '@type': 'Question', name: $('summary', d).textContent.trim(), acceptedAnswer: { '@type': 'Answer', text: $('p', d).textContent.trim() } }; }) });
  }
  /* oferta ao sair (só computador, 1x por sessão) */
  function exitIntent() {
    if (window.matchMedia('(pointer: coarse)').matches || sess('loja_exit')) return;
    var armed = false; setTimeout(function () { armed = true; }, 12000);
    document.addEventListener('mouseout', function onOut(e) {
      if (!armed || e.relatedTarget || e.clientY > 8 || sess('loja_exit') || $('.s-modal-bg')) return;
      sess('loja_exit', '1'); document.removeEventListener('mouseout', onOut);
      sModal('<span class="eyebrow">Antes de você ir</span><h3>Descubra em 30 segundos quanto você consegue financiar</h3><p class="sub">Sem compromisso. A gente consulta os bancos parceiros pra você.</p><div style="display:grid;gap:10px"><a class="btn btn-gold btn-block" href="financiamento.html#quiz">' + I.coin + ' Fazer minha pré-análise</a><button class="btn btn-ghost btn-block" data-close-modal>Agora não</button></div>', function (m) { $('[data-close-modal]', m).onclick = closeModal; });
    });
  }

  function fillConfig() {
    $$('[data-cfg]').forEach(function (el) { var k = el.getAttribute('data-cfg'); if (cfg[k] != null) el.textContent = cfg[k]; });
    $$('[data-cfg-tel]').forEach(function (el) { el.href = 'tel:' + D.onlyDigits(cfg.telefone); });
    $$('[data-cfg-ig]').forEach(function (el) { el.href = 'https://instagram.com/' + cfg.instagram; });
    $$('[data-icon]').forEach(function (el) { var k = el.getAttribute('data-icon'); if (I[k]) el.insertAdjacentHTML('afterbegin', I[k]); });
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('sb-wait');
    D.ready().then(function () { db = D.load(); cfg = db.config; document.documentElement.classList.remove('sb-wait'); iniciar(); });
  });
  function iniciar() {
    header(); footer(); fillConfig(); favCount(); seoLoja(); consent();
    D.stat('visita');
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-wa-geral]');
      if (g) { e.preventDefault(); document.body.classList.remove('menu-open'); waGeral('Olá, ' + cfg.loja + '! Vim pelo site e quero mais informações.', 'site-whatsapp'); return; }
      var a = e.target.closest('[data-agendar]');
      if (a) { e.preventDefault(); document.body.classList.remove('menu-open'); openAgendar(D.getCarro(a.getAttribute('data-agendar'))); return; }
      var f = e.target.closest('[data-open-favs]');
      if (f) { e.preventDefault(); favDrawer(); }
    });
    var p = document.body.getAttribute('data-page');
    if (pages[p]) pages[p]();
    reveal();
    requestAnimationFrame(function () { document.documentElement.classList.add('loaded'); });
    $$('[data-counter]').forEach(function (el) {
      var end = +el.getAttribute('data-counter'), t0 = null;
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        (function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(performance.now());
      }); io.observe(el);
    });
  }
  document.addEventListener('loja:db-changed', function () { db = D.load(); cfg = db.config; });
  window.LojaSite = { icons: I, toast: toast, openUrl: openUrl, track: track, openAgendar: openAgendar };
})();
