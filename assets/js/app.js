/* =====================================================================
   PAINEL COMO APLICATIVO (PWA)
   - registra o service worker (sw.js) para o painel abrir rápido e funcionar sem internet
   - botão "Instalar app" (Android/Chrome/Edge) e passo a passo no iPhone (Safari)
   - barra de abas embaixo no celular: Início, Leads, Estoque, Agenda e Menu
   Funciona igual em qualquer loja: escuta os eventos 'loja:shell' e 'telma:shell'.
   ===================================================================== */
(function () {
  'use strict';
  var mqStandalone = window.matchMedia('(display-mode: standalone)');
  function isApp() { return mqStandalone.matches || window.navigator.standalone === true; }
  if (isApp()) document.documentElement.classList.add('is-app');

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        // versão nova publicada: avisa e recarrega quando o usuário quiser
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) bar('Tem uma versão nova do painel.', 'Atualizar', function () { location.reload(); });
          });
        });
      }).catch(function () { /* sem SW: o painel funciona normalmente */ });
    });
  }

  /* ---------- instalação ---------- */
  var deferred = null;
  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isSafari = isIOS && !/crios|fxios|edgios/i.test(ua);
  function canInstall() { return !isApp() && (!!deferred || isIOS); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; refresh(); });
  window.addEventListener('appinstalled', function () { deferred = null; try { localStorage.setItem('app_instalado', '1'); } catch (e) { /* ok */ } refresh(); bar('Pronto! O painel agora é um app no seu aparelho.'); });
  function install() {
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; refresh(); }, function () { deferred = null; refresh(); }); return; }
    iosHelp();
  }
  function iosHelp() {
    var o = document.createElement('div'); o.className = 'app-sheet-bg';
    o.innerHTML = '<div class="app-sheet" role="dialog" aria-modal="true" aria-labelledby="app-sheet-t"><button class="app-x" aria-label="Fechar">×</button>' +
      '<b id="app-sheet-t">Instalar o painel no iPhone</b>' +
      (isSafari ? '' : '<p class="app-warn">Abra este endereço no <b>Safari</b> para instalar.</p>') +
      '<ol><li>Toque em <span class="app-ico">' + ICO.share + '</span> <b>Compartilhar</b>, na barra do Safari.</li><li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>. O ícone da loja aparece junto dos seus apps.</li></ol>' +
      '<p class="app-note">Depois é só abrir pelo ícone: o painel abre em tela cheia, como um aplicativo.</p></div>';
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('on'); });
    function close() { o.classList.remove('on'); setTimeout(function () { o.remove(); }, 250); }
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('.app-x')) close(); });
  }

  /* ---------- avisos curtos ---------- */
  function bar(msg, label, fn) {
    var old = document.querySelector('.app-bar'); if (old) old.remove();
    var b = document.createElement('div'); b.className = 'app-bar'; b.setAttribute('role', 'status');
    b.innerHTML = '<span>' + msg + '</span>' + (label ? '<button type="button">' + label + '</button>' : '');
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('on'); });
    if (label) b.querySelector('button').onclick = fn;
    else setTimeout(function () { b.classList.remove('on'); setTimeout(function () { b.remove(); }, 300); }, 4200);
  }
  /* ---------- camadas (menu, janelas, assistente) e botão "voltar" do celular ----------
     Cada coisa que abre por cima da tela vira uma "camada". No celular, o botão voltar
     (Android) ou o gesto de voltar fecha a camada de cima em vez de sair do painel. */
  var layers = [], backTimer = null, skipPop = 0;
  var mqTouch = window.matchMedia('(pointer: coarse)');
  function touchUI() { return mqTouch.matches || window.innerWidth <= 1024; }
  function hasLayer(id) { return layers.some(function (l) { return l.id === id; }); }
  function openLayer(id, close) {
    layers = layers.filter(function (l) { return l.id !== id; });
    layers.push({ id: id, close: close });
    if (!touchUI()) return;
    clearTimeout(backTimer); backTimer = null;
    if (!(history.state && history.state.painelLayer)) { try { history.pushState({ painelLayer: 1 }, ''); } catch (e) { /* ok */ } }
  }
  function closeLayer(id) {
    if (!hasLayer(id)) return;
    layers = layers.filter(function (l) { return l.id !== id; });
    if (!touchUI() || layers.length || !(history.state && history.state.painelLayer)) return;
    clearTimeout(backTimer);
    backTimer = setTimeout(function () {
      backTimer = null;
      if (!layers.length && history.state && history.state.painelLayer) { skipPop++; history.back(); }
    }, 40);
  }
  window.addEventListener('popstate', function () {
    if (skipPop) { skipPop--; return; }
    var top = layers.pop();
    if (!top) return;
    try { top.close(); } catch (e) { /* ok */ }
    if (layers.length && touchUI()) { try { history.pushState({ painelLayer: 1 }, ''); } catch (e) { /* ok */ } }
  });

  /* menu lateral e janelas: acompanhados sozinhos, sem mexer no resto do código */
  function watchLayers() {
    if (!('MutationObserver' in window) || watchLayers.on) return; watchLayers.on = true;
    var sync = function () {
      var b = document.body; if (!b) return;
      var side = b.classList.contains('side-open');
      if (side && !hasLayer('side')) openLayer('side', function () { b.classList.remove('side-open'); });
      else if (!side && hasLayer('side')) closeLayer('side');
      var n = document.querySelectorAll('.modal-bg').length;
      document.documentElement.classList.toggle('modal-open', n > 0);
      if (n && !hasLayer('modal')) openLayer('modal', function () { var all = document.querySelectorAll('.modal-bg'); var m = all[all.length - 1]; if (m) m.remove(); });
      else if (!n && hasLayer('modal')) closeLayer('modal');
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true });
    sync();
  }

  /* ---------- gesto de arrastar para fechar (assistente e menu) ---------- */
  function swipe(el, dir, fn) {
    if (!el || el._swipe) return; el._swipe = true;
    var x0 = 0, y0 = 0, t0 = 0, ok = false;
    el.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      ok = e.touches.length === 1 && !e.target.closest('input, textarea, select, .ia-tw, .no-swipe');
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!ok) return; ok = false;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dy) > 60 || Date.now() - t0 > 700) return;
      if ((dir === 'right' && dx > 80) || (dir === 'left' && dx < -80)) fn();
    }, { passive: true });
  }

  /* ---------- teclado aberto no celular: esconde a barra de abas para não cobrir o campo ---------- */
  function isField(el) { return el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|file|range|color)$/i.test(el.type))); }
  document.addEventListener('focusin', function (e) { if (window.innerWidth <= 760 && isField(e.target)) document.documentElement.classList.add('kb-open'); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (!isField(document.activeElement)) document.documentElement.classList.remove('kb-open'); }, 120); });

  window.addEventListener('offline', function () { document.documentElement.classList.add('offline'); bar('Sem internet. Você continua usando o painel; os dados ficam salvos neste aparelho.'); });
  window.addEventListener('online', function () { document.documentElement.classList.remove('offline'); bar('Internet de volta.'); });

  /* ---------- ícones ---------- */
  var ICO = {
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 0L8 7m4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    leads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16l-6 8v6l-4 2v-8z"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14M3 17v-4l2-5h14l2 5v4"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  /* ---------- montagem no painel ---------- */
  function refresh() {
    var b = document.getElementById('app-install'); if (b) b.hidden = !canInstall();
    var bn = document.getElementById('app-banner'); if (bn && !canInstall()) bn.remove();
  }
  function tabbar() {
    var old = document.querySelector('.app-tabs'); if (old) old.remove();
    var nav = document.createElement('nav'); nav.className = 'app-tabs'; nav.setAttribute('aria-label', 'Atalhos do painel');
    var tabs = [['dashboard', 'Início', ICO.home], ['leads', 'Leads', ICO.leads], ['estoque', 'Estoque', ICO.car], ['agenda', 'Agenda', ICO.cal]];
    nav.innerHTML = tabs.map(function (t) { return '<a href="#' + t[0] + '" data-tab="' + t[0] + '">' + t[2] + '<span>' + t[1] + '</span><i class="app-badge" hidden></i></a>'; }).join('') +
      '<button type="button" data-tab-menu>' + ICO.menu + '<span>Menu</span></button>';
    document.body.appendChild(nav); document.body.classList.add('has-tabbar');
    nav.querySelector('[data-tab-menu]').onclick = function () { document.body.classList.add('side-open'); };
    sync();
    var side = document.getElementById('nav');
    if (side && 'MutationObserver' in window) new MutationObserver(sync).observe(side, { childList: true, subtree: true });
  }
  function sync() {
    var id = (location.hash || '#dashboard').slice(1).split('?')[0];
    document.querySelectorAll('.app-tabs [data-tab]').forEach(function (a) {
      var on = a.getAttribute('data-tab') === id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      var src = document.querySelector('#nav a[href="#' + a.getAttribute('data-tab') + '"] .badge'), bd = a.querySelector('.app-badge');
      if (src && src.textContent.trim()) { bd.textContent = src.textContent.trim(); bd.hidden = false; } else bd.hidden = true;
    });
  }
  function onDashboard() { var id = (location.hash || '#dashboard').slice(1).split('?')[0]; return !id || id === 'dashboard'; }
  function banner() {
    var off = false; try { off = localStorage.getItem('app_banner_off') === '1'; } catch (e) { /* ok */ }
    var old = document.getElementById('app-banner');
    if (old && !onDashboard()) { old.remove(); return; }   // o convite aparece só na Visão geral
    if (off || !canInstall() || window.innerWidth > 1024 || old || !onDashboard()) return;
    var c = document.getElementById('content'); if (!c) return;
    var b = document.createElement('div'); b.id = 'app-banner'; b.className = 'app-banner';
    b.innerHTML = '<img src="' + (document.querySelector('link[rel="apple-touch-icon"]') || {}).href + '" alt=""><div><b>Use o painel como aplicativo</b><small>Ícone na tela inicial, tela cheia e abre na hora.</small></div><button type="button" class="b sm gold" data-i>Instalar</button><button type="button" class="b sm icon ghost" data-x aria-label="Agora não">×</button>';
    c.parentNode.insertBefore(b, c);
    b.querySelector('[data-i]').onclick = install;
    b.querySelector('[data-x]').onclick = function () { try { localStorage.setItem('app_banner_off', '1'); } catch (e) { /* ok */ } b.remove(); };
  }
  function mount() {
    var top = document.querySelector('.top');
    if (top && !document.getElementById('app-install')) {
      var bt = document.createElement('button'); bt.id = 'app-install'; bt.type = 'button'; bt.className = 'b'; bt.title = 'Instalar o painel como aplicativo';
      bt.innerHTML = ICO.dl + '<span>Instalar app</span>'; bt.onclick = install;
      var sp = top.querySelector('.sp'); if (sp) sp.after(bt); else top.appendChild(bt);
    }
    tabbar(); refresh(); banner(); watchLayers();
    var side = document.querySelector('.side'); swipe(side, 'left', function () { document.body.classList.remove('side-open'); });
  }
  document.addEventListener('loja:shell', mount);
  document.addEventListener('telma:shell', mount);
  window.addEventListener('hashchange', function () { sync(); banner(); });
  window.PainelApp = { install: install, canInstall: canInstall, isApp: isApp, openLayer: openLayer, closeLayer: closeLayer, swipe: swipe, touchUI: touchUI };
})();
