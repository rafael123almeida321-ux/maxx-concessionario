/* =====================================================================
   PAINEL DE GESTÃO DA LOJA (painel.js) — marca, cores e textos vêm de config (store.js)
   Abas: Visão geral · Estoque · Entradas e saídas · Leads · Vendas ·
         Clientes · Financeiro · Comissões · Equipe · Comunicados ·
         Configurações
   Permissões: diretora (tudo) · gerente (operação, sem custos/financeiro)
               vendedor (só o que é dele, sem custos)
   ===================================================================== */
(() => {
  'use strict';
  const D = window.LojaDB;
  document.addEventListener('error', e => {   // foto externa fora do ar → cartão provisório
    const im = e.target; if (!im || im.tagName !== 'IMG' || im.dataset.fb || !/^https?:/.test(im.getAttribute('src') || '')) return;
    im.dataset.fb = '1'; im.src = D.PLACEHOLDER;
  }, true);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = D.esc, brl = D.brl;
  const db = () => D.load();
  const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  const today = D.today();

  /* ---------- ícones ---------- */
  const sv = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  const IC = {
    home: sv('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    car: sv('<path d="M3 15l2-5c.5-1.3 1.4-2 2.8-2h8.4c1.4 0 2.3.7 2.8 2l2 5v3H3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>'),
    swap: sv('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
    funnel: sv('<path d="M3 4h18l-7 9v6l-4 2v-8z"/>'),
    tag: sv('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
    users: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.4 2.6 4 5.5"/>'),
    wallet: sv('<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.3"/>'),
    percent: sv('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
    team: sv('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c1-4 3.8-6 7-6s6 2 7 6"/>'),
    mega: sv('<path d="M3 10v4h4l7 4V6L7 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>'),
    gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    left: sv('<path d="M15 6l-6 6 6 6"/>'), right: sv('<path d="M9 6l6 6-6 6"/>'),
    x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
    clip: sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>'),
    edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    eye: sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    out: sv('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>'),
    menu: sv('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    ext: sv('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    alert: sv('<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>'),
    info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    money: sv('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/>'),
    trend: sv('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
    target: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    star: sv('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    download: sv('<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>'),
    upload: sv('<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>'),
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41"/></svg>',
    camera: sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    check: sv('<path d="M20 6L9 17l-5-5"/>'),
    cal: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>'),
    print: sv('<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>'),
    image: sv('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
    more: sv('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
    link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    msg: sv('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
    pin: sv('<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>')
  };

  /* ---------- estado ---------- */
  const S = { user: null, view: 'dashboard', mk: D.monthKey(today), f: {} };
  const ALL = ['diretora', 'gerente', 'vendedor'];
  const VIEWS = [
    { id: 'dashboard', label: 'Visão geral', icon: 'home', roles: ALL, month: true, grp: 'Principal' },
    { id: 'estoque', label: 'Estoque', icon: 'car', roles: ALL, grp: 'Operação' },
    { id: 'avaliacoes', label: 'Avaliações', icon: 'clip', roles: ALL },
    { id: 'movimentacao', label: 'Entradas e saídas', icon: 'swap', roles: ['diretora', 'gerente'], month: true },
    { id: 'leads', label: 'Leads e atendimento', icon: 'funnel', roles: ALL },
    { id: 'agenda', label: 'Agenda', icon: 'cal', roles: ALL },
    { id: 'vendas', label: 'Vendas', icon: 'tag', roles: ALL, month: true },
    { id: 'clientes', label: 'Clientes', icon: 'users', roles: ALL },
    { id: 'financeiro', label: 'Financeiro', icon: 'wallet', roles: ['diretora'], month: true, grp: 'Gestão' },
    { id: 'comissoes', label: 'Comissões', icon: 'percent', roles: ALL, month: true, grp: 'Gestão' },
    { id: 'equipe', label: 'Equipe', icon: 'team', roles: ['diretora', 'gerente'] },
    { id: 'marketing', label: 'Site e marketing', icon: 'globe', roles: ['diretora', 'gerente'] },
    { id: 'comunicados', label: 'Comunicados', icon: 'mega', roles: ALL },
    { id: 'config', label: 'Configurações', icon: 'gear', roles: ['diretora'] }
  ];
  const isDir = () => S.user && S.user.cargo === 'diretora';
  const isVend = () => S.user && S.user.cargo === 'vendedor';
  const money = () => isDir();            // só a diretora vê custo, lucro e financeiro
  const canView = v => v.roles.includes(S.user.cargo);
  const me = () => S.user.id;

  /* ---------- formatação ---------- */
  const kbrl = n => { n = Number(n) || 0; const a = Math.abs(n); if (a >= 1e6) return 'R$ ' + (n / 1e6).toFixed(2).replace('.', ',') + ' mi'; if (a >= 1e4) return 'R$ ' + Math.round(n / 1e3) + ' mil'; return brl(n); };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const delta = (a, b, parcial) => { if (!b) return ''; const d = (a - b) / Math.abs(b) * 100; return `<span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)}%</span> vs ${parcial ? 'mesmo período do mês anterior' : 'mês anterior'}`; };
  /* vendas do mês anterior; se o mês atual ainda está em andamento, compara só até o mesmo dia */
  const prevVendas = (mk, uid) => { const pv = vendasDo(D.monthAdd(mk, -1), uid); if (mk !== D.monthKey(today)) return pv; const dia = +today.slice(8, 10); return pv.filter(v => +v.data.slice(8, 10) <= dia); };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const initials = n => String(n || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const av = (u, cls = '') => !u ? `<span class="av ${cls}" style="--c:#555">?</span>` : (u.cargo === 'diretora' && db().config.donoFoto ? `<span class="av ${cls}"><img src="${esc(db().config.donoFoto)}" alt=""></span>` : `<span class="av ${cls}" style="--c:${esc(u.cor || '#D40000')}" title="${esc(u.nome)}">${initials(u.nome)}</span>`);
  const STATUS = { preparacao: 'Em preparação', venda: 'À venda', reservado: 'Reservado', vendido: 'Vendido' };
  const ETAPAS = [['novo', 'Novo'], ['atendimento', 'Em atendimento'], ['qualificado', 'Qualificado'], ['proposta', 'Proposta'], ['visita', 'Visita agendada'], ['vendido', 'Vendido'], ['perdido', 'Perdido']];
  const etapaLabel = e => (ETAPAS.find(x => x[0] === e) || [e, e])[1];
  const NEXT = { novo: 'atendimento', atendimento: 'qualificado', qualificado: 'proposta', proposta: 'visita', visita: 'vendido' };
  const PAG = { avista: 'À vista', financiado: 'Financiado', troca_financiado: 'Troca + financiamento', troca_avista: 'Troca + à vista' };
  const CARGOS = { diretora: 'Diretora', gerente: 'Gerente', vendedor: 'Vendedor(a)' };
  const CAT_SAIDA = ['Compra de veículo', 'Preparação de veículo', 'Comissões', 'Salários', 'Aluguel', 'Marketing', 'Contas', 'Serviços', 'Impostos e taxas', 'Documentação', 'Outros'];
  const CAT_ENTRADA = ['Venda de veículo', 'Retorno de financiamento', 'Serviços / despachante', 'Aporte', 'Outros'];
  const AG_STATUS = { agendado: 'Agendado', confirmado: 'Confirmado', realizado: 'Realizado', faltou: 'Não veio', cancelado: 'Cancelado' };
  const AG_PILL = { agendado: 'gold', confirmado: 'info', realizado: 'ok', faltou: 'bad', cancelado: 'no-dot' };
  const ATIVAS = ['novo', 'atendimento', 'qualificado', 'proposta', 'visita'];
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const leadLate = l => l.etapa === 'novo' && String(l.criadoEm).length > 10 && D.diffHours(l.criadoEm, D.nowISO()) > 2;
  const COLORS = ['#D40000', '#7FB3D5', '#82E0AA', '#E59866', '#C39BD3', '#F7DC6F', '#F1948A', '#76D7C4', '#AAB7B8', '#BB8FCE', '#85C1E9'];

  /* ---------- consultas ---------- */
  const vendasDo = (mk, uid) => db().vendas.filter(v => (!mk || D.monthKey(v.data) === mk) && (!uid || v.vendedorId === uid));
  const leadsDo = (mk, uid) => db().leads.filter(l => (!mk || D.monthKey(l.criadoEm) === mk) && (!uid || l.vendedorId === uid));
  const vendedores = (all) => db().usuarios.filter(u => (all || u.ativo) && (u.cargo === 'vendedor' || u.cargo === 'gerente'));
  const lancDo = mk => db().lancamentos.filter(l => D.monthKey(l.data) === mk);
  const meses = (n, ate = S.mk) => Array.from({ length: n }, (_, i) => D.monthAdd(ate, i - n + 1));

  /* ---------- salvar / toast ---------- */
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3000); }
  function persist(msg, acao) {
    if (acao) D.log(me(), acao);
    const ok = D.save();
    if (!ok) toast('Armazenamento do navegador cheio. Remova fotos grandes ou exporte um backup.');
    else if (msg) toast(msg);
    return ok;
  }
  function download(name, content, type = 'text/csv;charset=utf-8') {
    const blob = new Blob([type.startsWith('text/csv') ? '﻿' + content : content], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const csv = rows => rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\n');
  function openWa(tel, msg, demo) {
    if (demo) return toast('Número fictício de demonstração — com clientes reais abre o WhatsApp.');
    const n = D.onlyDigits(tel); if (n.length < 10) return toast('Telefone inválido.');
    window.open('https://wa.me/' + (n.length <= 11 ? '55' + n : n) + '?text=' + encodeURIComponent(msg || ''), '_blank');
  }

  /* ---------- gráficos SVG ---------- */
  function bars(labels, series, { h = 240, fmt = kbrl } = {}) {
    const W = 680, H = h, pl = 64, pr = 10, pt = 14, pb = 34;
    const max = Math.max(1, ...series.flatMap(s => s.values)) * 1.12;
    const gw = (W - pl - pr) / labels.length, bw = Math.min(26, (gw - 16) / series.length);
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * i / 4; const v = max * (1 - i / 4); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.06)"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6F6B64">${fmt(v)}</text>`; }
    labels.forEach((lb, i) => {
      const x0 = pl + gw * i + (gw - bw * series.length - 4 * (series.length - 1)) / 2;
      series.forEach((s, j) => { const v = s.values[i] || 0; const bh = (H - pt - pb) * Math.max(0, v) / max; const x = x0 + j * (bw + 4); g += `<rect x="${x}" y="${H - pb - bh}" width="${bw}" height="${bh}" rx="4" fill="${s.color}"><title>${esc(s.name)} · ${esc(lb)}: ${brl(v)}</title></rect>`; });
      g += `<text x="${pl + gw * i + gw / 2}" y="${H - 12}" text-anchor="middle" font-size="11.5" fill="#9C978E">${esc(lb)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico">${g}</svg><div class="legend" style="margin-top:8px">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function donut(items) {
    const tot = sum(items, x => x.value) || 1; const R = 54, C = 2 * Math.PI * R; let off = 0;
    const arcs = items.map(it => { const len = C * it.value / tot; const a = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${it.color}" stroke-width="18" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(it.label)}: ${it.value}</title></circle>`; off += len; return a; }).join('');
    return `<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Distribuição"><circle r="${R}" cx="70" cy="70" fill="none" stroke="#232326" stroke-width="18"/>${arcs}<text x="70" y="68" text-anchor="middle" font-size="22" font-weight="800" fill="#F2EEE7">${tot}</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="#9C978E">TOTAL</text></svg><div class="legend">${items.map(it => `<span><i style="background:${it.color}"></i>${esc(it.label)}<b>${it.value}</b></span>`).join('')}</div></div>`;
  }
  const hbars = (items, fmt = brl) => { const mx = Math.max(1, ...items.map(i => i.value)); return items.map((it, i) => `<div class="hbar"><span>${esc(it.label)}</span><div class="bar"><i style="width:${it.value / mx * 100}%;--c:${it.color || COLORS[i % COLORS.length]}"></i></div><span class="v">${fmt(it.value)}</span></div>`).join('') || '<div class="empty">Sem dados</div>'; };

  const kpi = (label, value, sub = '', icon = 'trend', hl = false) => `<div class="kpi ${hl ? 'hl' : ''}"><small>${IC[icon] || ''}${label}</small><b>${value}</b><div class="d">${sub}</div></div>`;
  const pill = (cls, txt) => `<span class="pill ${cls}">${esc(txt)}</span>`;

  /* =====================================================================
     LOGIN
     ===================================================================== */
  function login() {
    const us = db().usuarios.filter(u => u.ativo);
    const demo = db().config.modoDemo, cfgL = db().config;
    document.body.innerHTML = `<div class="login">
      <div class="login-art">${cfgL.loginFoto ? `<img src="${esc(cfgL.loginFoto)}" alt="">` : `<div class="login-mark"><img src="${esc(cfgL.logoRodape || cfgL.logo)}" alt=""></div>`}<div class="cap"><p>“${esc(cfgL.slogan)}”</p><small>${esc(cfgL.loja)} · Sistema de gestão</small></div></div>
      <form class="login-box" id="lg">
        <img src="${esc(cfgL.logoRodape || cfgL.logo)}" alt="${esc(cfgL.loja)}">
        <h1>Área da equipe</h1><p>Escolha seu usuário e entre com sua senha.</p>
        <div class="users">${us.map(u => `<button type="button" class="user-pick" data-u="${u.id}">${av(u)}<span><b>${esc(u.nome)}</b><small>${CARGOS[u.cargo]}</small></span></button>`).join('')}</div>
        <label class="fl"><span>Senha</span><input class="in" type="password" id="pw" autocomplete="current-password" placeholder="Sua senha"></label>
        <button class="b gold" style="height:48px;margin-top:16px" type="submit">Entrar no painel</button>
        ${demo ? `<p class="small muted" style="margin-top:14px">Demonstração: senha da Diretoria <b>${esc((D.getUser('u_dir') || {}).senha || '')}</b> · demais usuários <b>1234</b>.</p>` : ''}
        <a href="index.html" class="small muted" style="margin-top:18px">← Voltar para o site</a>
      </form></div>`;
    let pick = us[0] && us[0].id;
    const mark = () => $$('.user-pick').forEach(b => b.classList.toggle('on', b.dataset.u === pick));
    mark();
    $$('.user-pick').forEach(b => b.onclick = () => { pick = b.dataset.u; mark(); const u = D.getUser(pick); if (demo) $('#pw').value = u.senha; $('#pw').focus(); });
    if (demo) $('#pw').value = D.getUser(pick).senha;
    $('#lg').onsubmit = e => {
      e.preventDefault(); const u = D.getUser(pick);
      if (!u || u.senha !== $('#pw').value) return toast('Senha incorreta.');
      D.session(u); S.user = u; D.log(u.id, 'Entrou no painel'); D.save();
      location.hash = '#dashboard'; boot();
    };
  }

  /* =====================================================================
     SHELL
     ===================================================================== */
  function shell() {
    const u = S.user;
    document.body.innerHTML = `<div class="app">
      <aside class="side">
        <div class="side-logo"><img src="${esc(db().config.logoRodape || db().config.logo)}" alt="${esc(db().config.loja)}"><small>Painel de gestão</small><button class="b icon ghost side-x" id="side-x" type="button" aria-label="Fechar menu">${IC.x}</button></div>
        <nav id="nav"></nav>
        <div class="side-user">${av(u)}<div><b>${esc(u.nome)}</b><small>${CARGOS[u.cargo]}</small></div><button class="b sm icon ghost" id="logout" title="Sair" aria-label="Sair">${IC.out}</button></div>
      </aside>
      <div class="scrim" id="scrim"></div>
      <div class="main">
        <header class="top"><button class="b icon burger" id="burger" aria-label="Menu">${IC.menu}</button><h1 id="title"></h1><div id="month"></div><span class="sp"></span><a class="b" href="index.html" target="_blank" rel="noopener">${IC.ext}<span>Ver site</span></a></header>
        <div class="content" id="content"></div>
      </div></div>`;
    $('#logout').onclick = () => { D.session(null); S.user = null; location.hash = ''; login(); };
    $('#burger').onclick = () => document.body.classList.add('side-open');
    $('#scrim').onclick = () => document.body.classList.remove('side-open');
    $('#side-x').onclick = () => document.body.classList.remove('side-open');
    $('#content').addEventListener('click', onAction);
    if (!shell.keys) { shell.keys = true; document.addEventListener('keydown', e => { if (e.key === 'Escape') { const all = $$('.modal-bg'); if (all.length) all[all.length - 1].remove(); else document.body.classList.remove('side-open'); } }); }
    document.dispatchEvent(new CustomEvent('loja:shell'));   // a assistente de IA (ia.js) se monta aqui
  }
  function navHTML() {
    const unread = db().comunicados.filter(c => !(c.leituras || []).includes(me()) && c.autorId !== me()).length;
    const novos = db().leads.filter(l => l.etapa === 'novo' && (!isVend() || !l.vendedorId || l.vendedorId === me())).length;
    let html = '', grp = '';
    VIEWS.filter(canView).forEach(v => {
      if (v.grp && v.grp !== grp) { grp = v.grp; html += `<div class="grp">${v.grp}</div>`; }
      const b = v.id === 'comunicados' && unread ? `<span class="badge">${unread}</span>` : v.id === 'leads' && novos ? `<span class="badge">${novos}</span>` : '';
      html += `<a class="nav-i ${S.view === v.id ? 'on' : ''}" href="#${v.id}">${IC[v.icon]}<span>${v.label}</span>${b}</a>`;
    });
    $('#nav').innerHTML = html;
  }
  function monthHTML() {
    const v = VIEWS.find(x => x.id === S.view);
    $('#month').innerHTML = v && v.month ? `<div class="month"><button class="b" data-m="-1" aria-label="Mês anterior">${IC.left}</button><span>${cap(D.monthLabel(S.mk))}</span><button class="b" data-m="1" aria-label="Próximo mês" ${S.mk >= D.monthKey(today) ? 'disabled' : ''}>${IC.right}</button></div>` : '';
    $$('#month [data-m]').forEach(b => b.onclick = () => { S.mk = D.monthAdd(S.mk, +b.dataset.m); render(); });
  }
  function render() {
    const id = (location.hash || '#dashboard').slice(1).split('?')[0];
    let v = VIEWS.find(x => x.id === id && canView(x)); if (!v) v = VIEWS[0];
    S.view = v.id;
    document.body.classList.remove('side-open');
    $('#title').textContent = v.label;
    navHTML(); monthHTML();
    const demo = db().config.modoDemo ? `<div class="demo-bar">${IC.info}<span><b>Modo demonstração:</b> vendas, equipe e valores são fictícios para apresentação. Em Configurações você limpa tudo e começa com os dados reais.</span></div>` : '';
    $('#content').innerHTML = demo + `<div class="fade-in">${V[v.id]()}</div>`;
    if (AFTER[v.id]) AFTER[v.id]();
    window.scrollTo(0, 0);
  }

  /* =====================================================================
     VISÃO GERAL
     ===================================================================== */
  const V = {}, AFTER = {};
  V.dashboard = () => {
    if (isVend()) return dashVendedor();
    const mk = S.mk, cfg = db().config;
    const vs = vendasDo(mk);
    const fat = sum(vs, v => v.valor), lucro = sum(vs, v => v.lucro);
    const lm = leadsDo(mk);
    const est = db().carros.filter(c => c.status === 'venda' || c.status === 'reservado');
    const ms = meses(6);
    const chart = bars(ms.map(m => D.monthLabel(m, true)), [
      { name: 'Faturamento', color: '#D40000', values: ms.map(m => sum(vendasDo(m), v => v.valor)) },
      ...(money() ? [{ name: 'Lucro bruto', color: '#82E0AA', values: ms.map(m => sum(vendasDo(m), v => v.lucro)) }] : [])
    ]);
    const rank = vendedores().map(u => ({ u, n: vendasDo(mk, u.id).length, f: sum(vendasDo(mk, u.id), v => v.valor) })).sort((a, b) => b.n - a.n || b.f - a.f);
    /* alertas */
    const al = [];
    db().carros.filter(c => (c.status === 'venda' || c.status === 'reservado') && D.diasEstoque(c) > 60).forEach(c => al.push(['warn', 'alert', `${D.carroTitulo(c)} parado há ${D.diasEstoque(c)} dias`, 'Considere ajustar o preço ou destacar no Instagram', '#estoque']));
    const semV = db().leads.filter(l => l.etapa === 'novo' && !l.vendedorId).length;
    if (semV) al.push(['info', 'funnel', `${semV} lead(s) novos sem vendedor`, 'Distribua para a equipe responder rápido', '#leads']);
    const pend = sum(db().vendas.filter(v => !v.comissaoPaga), v => v.comissao);
    if (pend && money()) al.push(['warn', 'percent', `${brl(pend)} em comissões a pagar`, 'Veja o detalhe por vendedor', '#comissoes']);
    const prep = db().carros.filter(c => c.status === 'preparacao').length;
    if (prep) al.push(['info', 'car', `${prep} carro(s) em preparação`, 'Cadastre fotos e publique no site quando ficarem prontos', '#estoque']);
    const apv = db().vendas.filter(v => v.aprovacao === 'pendente').length;
    if (apv && isDir()) al.unshift(['bad', 'alert', `${apv} venda(s) abaixo do preço mínimo aguardando você`, 'Aprove ou recuse em "Precisa de você"', '#dashboard']);
    const contasV = db().lancamentos.filter(l => l.pago === false && l.vencimento <= D.addDays(today, 3)).length;
    if (contasV && money()) al.push(['warn', 'wallet', `${contasV} conta(s) vencendo em até 3 dias`, 'Veja em Financeiro → Contas a pagar', '#financeiro']);
    const lentos = db().leads.filter(leadLate).length;
    if (lentos) al.unshift(['bad', 'clock', `${lentos} lead(s) esperando resposta há mais de 2h`, 'Cliente respondido rápido compra muito mais', '#leads']);
    const docsP = db().vendas.filter(v => { const s = D.docStatus(v); return s && !s.completo && !s.comunicada && s.restam <= 10; });
    if (docsP.length) al.push([docsP.some(v => D.docStatus(v).restam < 0) ? 'bad' : 'warn', 'alert', `${docsP.length} venda(s) com a comunicação ao Detran perto do prazo`, 'São 30 dias depois da venda. Veja em Vendas → Documentos', '#vendas']);
    const avA = avs().filter(a => a.status === 'aberta').length;
    if (avA) al.push(['info', 'clip', `${avA} avaliação(ões) esperando o valor da loja`, 'Defina a oferta e mande a proposta ao cliente', '#avaliacoes']);
    if (!al.length) al.push(['info', 'check', 'Tudo em dia por aqui', 'Nenhum alerta no momento', '#dashboard']);
    const orig = {}; lm.forEach(l => { const k = D.origemLabel(l.origem); orig[k] = (orig[k] || 0) + 1; });
    const origItems = Object.keys(orig).map((k, i) => ({ label: k, value: orig[k], color: COLORS[i % COLORS.length] })).sort((a, b) => b.value - a.value);
    return `${dashTop()}<div class="kpis">
        ${kpi('Faturamento do mês', brl(fat), delta(fat, sum(prevVendas(mk), v => v.valor), mk === D.monthKey(today)), 'money', true)}
        ${money() ? kpi('Lucro bruto', brl(lucro), 'Margem de ' + pct(lucro, fat) + '% sobre as vendas', 'trend') : ''}
        ${kpi('Carros vendidos', vs.length + ' <span class="muted" style="font-size:15px">/ ' + cfg.metaLoja + '</span>', `<div class="progress ${vs.length >= cfg.metaLoja ? 'ok' : ''}" style="margin-top:6px"><i style="width:${Math.min(100, pct(vs.length, cfg.metaLoja))}%"></i></div>`, 'target')}
        ${kpi('Ticket médio', brl(vs.length ? fat / vs.length : 0), vs.length + ' vendas no mês', 'tag')}
        ${kpi('Leads no mês', lm.length, 'Conversão de ' + pct(vs.length, lm.length || 1) + '%', 'funnel')}
        ${kpi('Estoque à venda', est.length + ' carros', kbrl(sum(est, c => c.preco)) + ' em preço de venda', 'car')}
      </div>
      ${hojeHTML()}
      <div class="cols c-2-1">
        <div class="card"><div class="card-h"><div><h3>Faturamento dos últimos 6 meses</h3><p>Soma das vendas registradas por mês</p></div><a class="b sm" href="#vendas">Ver vendas</a></div>${chart}</div>
        <div class="card"><div class="card-h"><div><h3>Ranking de vendedores</h3><p>${D.monthLabel(mk)} · carros vendidos x meta</p></div></div>
          ${rank.map((r, i) => `<div class="rank"><span class="pos">${i + 1}º</span>${av(r.u)}<div class="grow"><b>${esc(r.u.nome)}</b><small>${r.n} de ${r.u.meta} carros · ${kbrl(r.f)}</small><div class="progress ${r.n >= r.u.meta ? 'ok' : ''}"><i style="width:${Math.min(100, pct(r.n, r.u.meta || 1))}%"></i></div></div><b>${r.n}</b></div>`).join('')}
        </div>
      </div>
      <div class="cols c-3">
        <div class="card"><div class="card-h"><h3>Alertas</h3></div>${al.map(a => `<div class="alert-li ${a[0]}" data-go="${a[4]}">${IC[a[1]]}<div><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div></div>`).join('')}</div>
        <div class="card"><div class="card-h"><div><h3>De onde vêm os leads</h3><p>${D.monthLabel(mk)}</p></div></div>${origItems.length ? donut(origItems) : '<div class="empty">Nenhum lead neste mês</div>'}</div>
        <div class="card"><div class="card-h"><h3>Últimas vendas</h3><a class="b sm" href="#vendas">Todas</a></div><div class="list">${vs.slice().sort((a, b) => a.data < b.data ? 1 : -1).slice(0, 6).map(v => { const c = D.getCarro(v.carroId); return `<div class="li click" data-act="venda-ver" data-id="${v.id}" style="cursor:pointer"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div class="grow"><b>${esc(D.carroTitulo(c))} ${c.anoMod}</b><small>${D.dateBR(v.data)} · ${esc((D.getUser(v.vendedorId) || {}).nome || '—')}</small></div><b>${kbrl(v.valor)}</b></div>`; }).join('') || '<div class="empty">Nenhuma venda neste mês</div>'}</div></div>
      </div>${extraDashHTML()}`;
  };
  function dashVendedor() {
    const u = S.user, mk = S.mk, vs = vendasDo(mk, u.id);
    const meus = db().leads.filter(l => l.vendedorId === u.id);
    const ativos = meus.filter(l => !['vendido', 'perdido'].includes(l.etapa));
    const nao = db().comunicados.filter(c => !(c.leituras || []).includes(u.id));
    return `${dashTop()}<div class="kpis">
      ${kpi('Minhas vendas', vs.length + ' <span class="muted" style="font-size:15px">/ ' + u.meta + '</span>', `<div class="progress ${vs.length >= u.meta ? 'ok' : ''}" style="margin-top:6px"><i style="width:${Math.min(100, pct(vs.length, u.meta || 1))}%"></i></div>`, 'target', true)}
      ${kpi('Valor vendido', brl(sum(vs, v => v.valor)), D.monthLabel(mk), 'money')}
      ${kpi('Minha comissão', brl(sum(vs, v => v.comissao)), D.comissaoRegra(u), 'percent')}
      ${kpi('Leads em andamento', ativos.length, db().leads.filter(l => l.etapa === 'novo' && !l.vendedorId).length + ' novos aguardando alguém assumir', 'funnel')}
    </div>
    ${hojeHTML(u.id)}
    <div class="cols c-3">
      <div class="card"><div class="card-h"><h3>Meus leads por etapa</h3><a class="b sm" href="#leads">Abrir</a></div>${hbars(ETAPAS.map(e => ({ label: e[1], value: meus.filter(l => l.etapa === e[0]).length })), x => x)}</div>
      <div class="card"><div class="card-h"><h3>Comunicados da diretoria</h3><a class="b sm" href="#comunicados">Ver</a></div>${nao.slice(0, 3).map(c => `<div class="alert-li info" data-go="#comunicados">${IC.mega}<div><b>${esc(c.titulo)}</b><small>${D.dateBR(c.data)} · não lido</small></div></div>`).join('') || '<div class="empty">Tudo lido ✓</div>'}</div>
      <div class="card"><div class="card-h"><h3>Minhas últimas vendas</h3></div><div class="list">${vs.slice().reverse().slice(0, 5).map(v => { const c = D.getCarro(v.carroId); return `<div class="li"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div class="grow"><b>${esc(D.carroTitulo(c))}</b><small>${D.dateBR(v.data)} · comissão ${brl(v.comissao)}</small></div><b>${kbrl(v.valor)}</b></div>`; }).join('') || '<div class="empty">Nenhuma venda neste mês ainda. Bora!</div>'}</div></div>
    </div>`;
  }

  /* =====================================================================
     ESTOQUE
     ===================================================================== */
  V.estoque = () => {
    const f = S.f.estoque || (S.f.estoque = { st: 'ativos', q: '' });
    if (f.st === 'giro' && isVend()) f.st = 'ativos';
    const all = db().carros;
    const ativos = all.filter(c => c.status !== 'vendido');
    const cnt = k => k === 'ativos' ? ativos.length : k === 'giro' ? all.filter(c => (c.status === 'venda' || c.status === 'reservado') && sugestaoPreco(c).alvo).length : all.filter(c => c.status === k).length;
    const venda = all.filter(c => c.status === 'venda' || c.status === 'reservado');
    const q = D.slug(f.q).replace(/-/g, ' ');
    let list = (f.st === 'ativos' ? ativos : all.filter(c => c.status === f.st)).filter(c => !q || D.slug([D.carroNome(c), c.cor, c.placa, c.carroceria, c.combustivel, c.cambio].join(' ')).replace(/-/g, ' ').includes(q)).filter(c => !+f.ate || c.preco <= +f.ate);
    if (f.pt) list = list.filter(c => f.pt === '_none' ? !portaisN(c) : D.portaisAtivos(c).some(p => p[0] === f.pt));
    list = list.sort((a, b) => (a.status === 'vendido' ? (a.dataSaida < b.dataSaida ? 1 : -1) : (a.dataEntrada < b.dataEntrada ? 1 : -1)));
    if (f.st === 'vendido') list = list.slice(0, 80);
    return `<div class="kpis">
        ${kpi('À venda', cnt('venda'), 'publicados no site: ' + all.filter(c => c.publicado && c.status === 'venda').length, 'car', true)}
        ${kpi('Reservados', cnt('reservado'), 'aguardando fechamento', 'clock')}
        ${kpi('Em preparação', cnt('preparacao'), 'ainda não estão no site', 'gear')}
        ${money() ? (ativos.some(D.temCusto) ? kpi('Capital no estoque', kbrl(sum(ativos.filter(D.temCusto), D.custoCarro)), ativos.every(D.temCusto) ? 'compra + preparação' : `${ativos.filter(c => !D.temCusto(c)).length} carros ainda sem valor de compra`, 'money') : kpi('Valor anunciado', kbrl(sum(venda, c => c.preco)), 'carros à venda', 'money')) : ''}
        ${money() ? (venda.some(D.temCusto) ? kpi('Lucro previsto', kbrl(sum(venda.filter(D.temCusto), D.lucroPrevisto)), venda.every(D.temCusto) ? 'se vender tudo pelo preço anunciado' : `só dos ${venda.filter(D.temCusto).length} carros com valor de compra`, 'trend') : kpi('Lucro previsto', '—', 'preencha o valor de compra dos carros', 'trend')) : kpi('Valor anunciado', kbrl(sum(venda, c => c.preco)), 'carros à venda', 'money')}
        ${kpi('Tempo médio em estoque', Math.round(sum(venda, D.diasEstoque) / (venda.length || 1)) + ' dias', 'carros à venda', 'clock')}
      </div>
      <div class="toolbar">
        <div class="tabs" id="st-tabs">${[['ativos', 'Ativos'], ['venda', 'À venda'], ['reservado', 'Reservados'], ['preparacao', 'Preparação'], ['vendido', 'Vendidos']].concat(isVend() ? [] : [['giro', 'Giro e preço']]).map(t => `<button class="${f.st === t[0] ? 'on' : ''}" data-st="${t[0]}">${t[1]}<i>${cnt(t[0])}</i></button>`).join('')}</div>
        <input class="in" id="est-q" placeholder="Buscar marca, modelo, placa, cor…" value="${esc(f.q)}">
        <select class="sel" id="est-pt" aria-label="Portal"><option value="">Todos os portais</option><option value="_none" ${f.pt === '_none' ? 'selected' : ''}>Sem anúncio em portal</option>${D.PORTAIS.map(p => `<option value="${p[0]}" ${f.pt === p[0] ? 'selected' : ''}>No ${p[1]}</option>`).join('')}</select>
        <select class="sel" id="est-ate" aria-label="Preço até"><option value="0">Qualquer preço</option>${[60000, 80000, 100000, 130000, 160000, 200000].map(v => `<option value="${v}" ${+f.ate === v ? 'selected' : ''}>Até ${kbrl(v)}</option>`).join('')}</select>
        <span class="sp"></span>
        ${!isVend() ? `<button class="b" data-act="importar">${IC.upload}Importar planilha</button><button class="b gold" data-act="carro-novo">${IC.plus}Cadastrar carro</button>` : ''}
      </div>
      ${f.st === 'giro' ? giroHTML() : `<div class="tw est-t"><table class="t"><thead><tr><th>Carro</th><th>Ano</th><th class="num">KM</th><th class="num">Preço</th>${money() ? '<th class="num">Custo total</th><th class="num">Lucro prev.</th>' : ''}<th class="num">Dias</th><th>Preparo</th><th>Status</th>${!isVend() ? '<th>No site</th>' : ''}<th></th></tr></thead><tbody>
      ${list.map(c => {
        const lp = c.status === 'vendido' ? ((db().vendas.find(v => v.id === c.vendaId) || {}).lucro || 0) : D.lucroPrevisto(c), semCusto = c.status !== 'vendido' && !D.temCusto(c);
        return `<tr>
          <td><div class="car-cell"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div><b>${esc(D.carroTitulo(c))}</b><small>${esc(c.versao)}${c.valoresIlustrativos ? '<span class="dot-warn" title="Valores ilustrativos — confirmar com a loja"></span>' : ''}${c.status !== 'vendido' && (c.fipe || portaisN(c)) ? `<span class="tchips">${c.fipe ? `<i class="${fipePct(c) > 105 ? 'warn' : ''}">${fipePct(c)}% FIPE</i>` : ''}${portaisN(c) ? `<i>${portaisN(c)} portal${portaisN(c) > 1 ? 'is' : ''}</i>` : ''}</span>` : ''}</small></div></div></td>
          <td>${String(c.anoFab).slice(2)}/${String(c.anoMod).slice(2)}</td><td class="num">${D.num(c.km)}</td><td class="num"><b>${brl(c.preco)}</b>${D.emOferta(c) && c.status !== 'vendido' ? `<br><small class="muted" style="text-decoration:line-through">${brl(c.precoAnterior)}</small>` : ''}</td>
          ${money() ? (semCusto ? `<td class="num muted">—</td><td class="num muted">—</td>` : `<td class="num">${brl(D.custoCarro(c))}</td><td class="num ${lp >= 0 ? 'up' : 'down'}">${brl(lp)}</td>`) : ''}
          <td class="num ${D.diasEstoque(c) > 60 && c.status !== 'vendido' ? 'down' : ''}">${D.diasEstoque(c)}</td>
          <td>${c.status === 'vendido' ? '<span class="muted small">—</span>' : prepMini(c)}</td>
          <td>${c.status === 'vendido' || isVend() ? pill(c.status, STATUS[c.status]) : `<select class="sel status-sel" data-status="${c.id}">${['preparacao', 'venda', 'reservado'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}</select>`}</td>
          ${!isVend() ? `<td>${c.status === 'vendido' ? '<span class="muted small">—</span>' : `<label class="switch" title="Publicar no site"><input type="checkbox" data-pub="${c.id}" ${c.publicado ? 'checked' : ''}><i></i></label>`}</td>` : ''}
          <td style="white-space:nowrap;text-align:right">
            ${c.status !== 'vendido' ? `<button class="b sm green" data-act="venda-nova" data-id="${c.id}" title="Registrar venda">Vender</button>` : ''}
            ${isVend() && c.status === 'venda' ? `<button class="b sm" data-act="reservar" data-id="${c.id}">Reservar</button>` : ''}
            ${c.publicado && c.status !== 'vendido' && c.status !== 'preparacao' ? `<a class="b sm icon" href="carro.html?id=${encodeURIComponent(c.id)}" target="_blank" rel="noopener" title="Ver no site">${IC.eye}</a>` : ''}
            ${c.status !== 'vendido' ? `<button class="b sm icon" data-act="carro-acoes" data-id="${c.id}" title="Proposta, arte p/ Instagram, link">${IC.more}</button>` : ''}
            ${!isVend() ? `<button class="b sm icon" data-act="carro-editar" data-id="${c.id}" title="Editar">${IC.edit}</button>` : ''}
          </td></tr>`;
      }).join('') || `<tr><td colspan="10"><div class="empty">Nenhum carro aqui.</div></td></tr>`}
      </tbody></table></div>
      <div class="mcards">${list.map(carCardM).join('') || '<div class="empty">Nenhum carro aqui.</div>'}</div>`}`;
  };
  /* estoque no celular: cartões grandes, fáceis de tocar, no lugar da tabela */
  function carCardM(c) {
    const vend = c.status === 'vendido', d = D.diasEstoque(c);
    return `<div class="mcard">
      <div class="mcard-top" data-act="${vend ? 'venda-ver' : isVend() ? 'carro-acoes' : 'carro-editar'}" data-id="${vend ? esc(c.vendaId || '') : c.id}">
        <img class="mthumb" src="${esc(D.carroFoto(c))}" alt="" loading="lazy">
        <div class="grow"><b>${esc(D.carroTitulo(c))} <span class="muted">${String(c.anoMod)}</span></b><small>${esc(c.versao || '')}${c.versao ? ' · ' : ''}${D.num(c.km)} km</small>
          <div class="mprice">${brl(c.preco)}${D.emOferta(c) && !vend ? ` <s>${brl(c.precoAnterior)}</s>` : ''}</div>
          <div class="mtags">${pill(c.status, STATUS[c.status])}${!vend ? `<span class="pill no-dot ${d > 60 ? 'bad' : ''}">${d} dias</span>` : ''}${!vend && c.fipe ? `<span class="pill no-dot ${fipePct(c) > 105 ? 'warn' : ''}">${fipePct(c)}% FIPE</span>` : ''}${!vend && portaisN(c) ? `<span class="pill no-dot info">${portaisN(c)} portal${portaisN(c) > 1 ? 'is' : ''}</span>` : ''}${!vend && !isVend() && !c.publicado ? '<span class="pill no-dot">fora do site</span>' : ''}</div></div>
      </div>
      ${!vend ? `<div class="mcard-acts">
        <button class="b sm green" data-act="venda-nova" data-id="${c.id}">${IC.tag}Vender</button>
        ${isVend() && c.status === 'venda' ? `<button class="b sm" data-act="reservar" data-id="${c.id}">Reservar</button>` : ''}
        <button class="b sm" data-act="carro-acoes" data-id="${c.id}">${IC.more}Divulgar</button>
        ${!isVend() ? `<button class="b sm" data-act="carro-editar" data-id="${c.id}">${IC.edit}Editar</button>` : ''}
      </div>` : ''}
    </div>`;
  }
  AFTER.estoque = () => {
    const f = S.f.estoque;
    $$('#st-tabs button').forEach(b => b.onclick = () => { f.st = b.dataset.st; render(); });
    $('#est-ate').onchange = e => { f.ate = e.target.value; render(); };
    $('#est-pt').onchange = e => { f.pt = e.target.value; render(); };
    const q = $('#est-q'); q.oninput = () => { f.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { render(); const n = $('#est-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
    $$('[data-status]').forEach(s => s.onchange = () => { const c = D.getCarro(s.dataset.status); c.status = s.value; if (s.value === 'preparacao') c.publicado = false; persist('Status atualizado: ' + STATUS[s.value], `Status de ${D.carroTitulo(c)} → ${STATUS[s.value]}`); render(); });
    $$('[data-pub]').forEach(s => s.onchange = () => { const c = D.getCarro(s.dataset.pub); if (s.checked && c.status === 'preparacao') { c.status = 'venda'; } c.publicado = s.checked; persist(s.checked ? 'Publicado no site ✓' : 'Removido do site', `${s.checked ? 'Publicou' : 'Despublicou'} ${D.carroTitulo(c)}`); render(); });
  };

  /* sincroniza lançamentos de compra/preparação do carro com o financeiro */
  function syncCarLanc(c) {
    const L = db().lancamentos;
    const find = cat => L.find(l => l.ref && l.ref.tipo === 'carro' && l.ref.id === c.id && l.categoria === cat);
    const rm = l => { const i = L.indexOf(l); if (i > -1) L.splice(i, 1); };
    const comp = find('Compra de veículo');
    if (c.origem === 'compra' && c.precoCompra > 0) {
      if (comp) { comp.valor = +c.precoCompra; comp.data = c.dataEntrada; comp.descricao = 'Compra — ' + D.carroTitulo(c) + ' ' + c.anoMod; }
      else L.push({ id: D.uid('l'), data: c.dataEntrada, tipo: 'saida', categoria: 'Compra de veículo', descricao: 'Compra — ' + D.carroTitulo(c) + ' ' + c.anoMod, valor: +c.precoCompra, ref: { tipo: 'carro', id: c.id } });
    } else if (comp) rm(comp);
    const prep = find('Preparação de veículo'), ct = D.custoTotal(c);
    if (ct > 0) { if (prep) prep.valor = ct; else L.push({ id: D.uid('l'), data: today, tipo: 'saida', categoria: 'Preparação de veículo', descricao: 'Preparação — ' + D.carroTitulo(c) + ' ' + c.anoMod, valor: ct, ref: { tipo: 'carro', id: c.id } }); }
    else if (prep) rm(prep);
  }

  function compress(file) {
    return new Promise((ok, no) => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1280 / img.width); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); ok(cv.toDataURL('image/jpeg', 0.78)); }; img.onerror = no; img.src = fr.result; };
      fr.onerror = no; fr.readAsDataURL(file);
    });
  }

  function carModal(id) {
    const novo = !id;
    const c = novo ? { marca: '', modelo: '', versao: '', anoFab: 2022, anoMod: 2022, km: 0, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'Hatch', portas: 4, placa: '', preco: 0, precoCompra: 0, fipe: 0, custos: [], opcionais: [], descricao: '', fotos: [], destaque: false, publicado: false, status: 'preparacao', dataEntrada: today, origem: 'compra', fornecedor: '', precoAnterior: 0, precoMinimo: 0, comentarioLoja: '', videoUrl: '', checklist: {} } : JSON.parse(JSON.stringify(D.getCarro(id)));
    const opt = (arr, v) => arr.map(o => `<option ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('');
    const body = `<form id="cf">
      <div class="sec-t">Dados do carro</div>
      <div class="grid-form">
        <label class="fl"><span>Marca *</span><input class="in" name="marca" required value="${esc(c.marca)}" list="dl-marcas"></label>
        <label class="fl"><span>Modelo *</span><input class="in" name="modelo" required value="${esc(c.modelo)}"></label>
        <label class="fl c2"><span>Versão</span><input class="in" name="versao" value="${esc(c.versao)}" placeholder="Ex.: Highline 200 TSI"></label>
        <label class="fl"><span>Ano fabricação</span><input class="in" type="number" name="anoFab" value="${c.anoFab}"></label>
        <label class="fl"><span>Ano modelo</span><input class="in" type="number" name="anoMod" value="${c.anoMod}"></label>
        <label class="fl"><span>Quilometragem</span><input class="in" type="number" name="km" value="${c.km}"></label>
        <label class="fl"><span>Cor</span><input class="in" name="cor" value="${esc(c.cor)}"></label>
        <label class="fl"><span>Câmbio</span><select class="sel" name="cambio">${opt(['Automático', 'Automático (CVT)', 'Automatizado', 'Manual'], c.cambio)}</select></label>
        <label class="fl"><span>Combustível</span><select class="sel" name="combustivel">${opt(['Flex', 'Gasolina', 'Diesel', 'Híbrido', 'Elétrico'], c.combustivel)}</select></label>
        <label class="fl"><span>Carroceria</span><select class="sel" name="carroceria">${opt(['Hatch', 'Sedã', 'SUV', 'Picape', 'Minivan', 'Utilitário', 'Esportivo'], c.carroceria)}</select></label>
        <label class="fl"><span>Placa (interno)</span><input class="in" name="placa" value="${esc(c.placa || '')}" placeholder="Não aparece no site"></label>
      </div>
      <div class="sec-t">Valores</div>
      <div class="grid-form">
        <label class="fl"><span>Preço de venda (site) *</span><input class="in" type="number" name="preco" required value="${c.preco}"></label>
        ${money() ? `<label class="fl"><span>Valor de compra</span><input class="in" type="number" name="precoCompra" value="${c.precoCompra}"></label>` : ''}
        <label class="fl"><span>Tabela FIPE</span><input class="in" type="number" name="fipe" value="${c.fipe}"></label>
        <label class="fl"><span>Preço anterior (mostra “de/por”)</span><input class="in" type="number" name="precoAnterior" value="${c.precoAnterior || ''}" placeholder="Opcional"></label>
        ${money() ? `<label class="fl"><span>Preço mínimo (só você vê)</span><input class="in" type="number" name="precoMinimo" value="${c.precoMinimo || ''}" placeholder="Abaixo disso precisa da sua aprovação"></label>` : ''}
        <label class="fl"><span>Origem</span><select class="sel" name="origem">${[['compra', 'Compra'], ['troca', 'Troca'], ['consignado', 'Consignado']].map(o => `<option value="${o[0]}" ${c.origem === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <label class="fl"><span>Data de entrada</span><input class="in" type="date" name="dataEntrada" value="${c.dataEntrada}"></label>
        <label class="fl c3"><span>Fornecedor / de quem comprou (interno)</span><input class="in" name="fornecedor" value="${esc(c.fornecedor || '')}"></label>
      </div>
      ${money() ? `<div class="sec-t">Custos de preparação</div><div id="costs">${(c.custos.length ? c.custos : [{ desc: '', valor: '' }]).map(costRow).join('')}</div><button type="button" class="b sm" id="add-cost">${IC.plus}Adicionar custo</button>
      <div class="preview" id="cprev"></div>` : ''}
      <div class="sec-t">Checklist de preparação e documentos</div>
      <div class="checks">${D.CHECKLIST.map(k => `<label class="check"><input type="checkbox" name="ck_${k[0]}" ${c.checklist && c.checklist[k[0]] ? 'checked' : ''}>${k[1]}</label>`).join('')}</div>
      <div class="sec-t">Fotos <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">— a primeira é a capa</span></div>
      <div class="photos" id="photos"></div>
      <input type="file" id="ph-file" accept="image/*" multiple hidden>
      <div class="sec-t">Anúncios em portais <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">— onde este carro está anunciado</span></div>
      ${portaisForm(c)}
      <div class="sec-t">Site</div>
      <div class="grid-form">
        <label class="fl c4"><span>Opcionais (um por linha)</span><textarea class="ta" name="opcionais" placeholder="Central multimídia&#10;Câmera de ré">${esc((c.opcionais || []).join('\n'))}</textarea></label>
        <label class="fl c4"><span>Descrição do anúncio</span><textarea class="ta" name="descricao">${esc(c.descricao || '')}</textarea></label>
        <label class="fl c4"><span>“A loja recomenda” — comentário que aparece na página do carro</span><textarea class="ta" name="comentarioLoja" placeholder="Ex.: Esse é pra quem quer SUV completo sem pagar preço de concessionária.">${esc(c.comentarioLoja || '')}</textarea></label>
        <label class="fl c4"><span>Vídeo do carro (link do YouTube ou arquivo .mp4)</span><input class="in" name="videoUrl" value="${esc(c.videoUrl || '')}" placeholder="https://youtube.com/shorts/..."></label>
        <label class="fl"><span>Status</span><select class="sel" name="status">${['preparacao', 'venda', 'reservado'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}</select></label>
        <label class="check" style="align-self:end;height:42px"><input type="checkbox" name="publicado" ${c.publicado ? 'checked' : ''}>Publicar no site</label>
        <label class="check" style="align-self:end;height:42px"><input type="checkbox" name="destaque" ${c.destaque ? 'checked' : ''}>Destaque na home</label>
      </div>
      <datalist id="dl-marcas">${['Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Toyota', 'Honda', 'Jeep', 'Renault', 'Nissan', 'Ford', 'CAOA Chery', 'Peugeot', 'Citroën', 'Mitsubishi', 'BYD', 'Kia'].map(m => `<option>${m}</option>`).join('')}</datalist>
    </form>`;
    modal({
      title: novo ? 'Cadastrar carro' : 'Editar ' + D.carroTitulo(c), size: 'lg', body,
      left: !novo && c.status !== 'vendido' && isDir() ? `<button class="b danger" id="del-car">${IC.trash}Excluir</button>` : '',
      ok: novo ? 'Cadastrar carro' : 'Salvar alterações',
      mount: el => {
        const photos = c.fotos.slice();
        const drawPh = () => {
          $('#photos', el).innerHTML = photos.map((p, i) => `<div class="photo"><img src="${esc(p)}" alt="">${i === 0 ? '<span class="cover">CAPA</span>' : ''}<div class="acts">${i ? `<button type="button" data-cover="${i}" title="Tornar capa">${IC.star}</button>` : ''}<button type="button" data-rm="${i}" title="Remover">${IC.trash}</button></div></div>`).join('') + `<div class="photo-add" id="ph-add">${IC.camera}Adicionar fotos</div>`;
          $('#ph-add', el).onclick = () => $('#ph-file', el).click();
          $$('[data-rm]', el).forEach(b => b.onclick = () => { photos.splice(+b.dataset.rm, 1); drawPh(); });
          $$('[data-cover]', el).forEach(b => b.onclick = () => { const p = photos.splice(+b.dataset.cover, 1)[0]; photos.unshift(p); drawPh(); });
        };
        drawPh();
        $('#ph-file', el).onchange = async e => { for (const f of e.target.files) { try { photos.push(await compress(f)); } catch (x) { toast('Não consegui ler ' + f.name); } } e.target.value = ''; drawPh(); };
        const prev = () => {
          if (!money()) return; const f = $('#cf', el);
          const custos = $$('.cost-row', el).reduce((s, r) => s + (+$('[name=cv]', r).value || 0), 0);
          const tot = (+f.precoCompra.value || 0) + custos, lp = (+f.preco.value || 0) - tot;
          const fipe = +f.fipe.value || 0, vs = fipe ? Math.round(((+f.preco.value || 0) - fipe) / fipe * 100) : null;
          $('#cprev', el).innerHTML = `<div><small>Custo total</small><b>${brl(tot)}</b></div><div><small>Lucro previsto</small><b class="${lp >= 0 ? 'up' : 'down'}">${brl(lp)}</b></div><div><small>Margem</small><b>${pct(lp, +f.preco.value || 1)}%</b></div><div><small>Preço x FIPE</small><b class="${vs > 0 ? 'down' : 'up'}">${vs == null ? '—' : (vs > 0 ? '+' : '') + vs + '%'}</b></div>`;
        };
        if (money()) {
          $('#add-cost', el).onclick = () => { $('#costs', el).insertAdjacentHTML('beforeend', costRow({ desc: '', valor: '' })); prev(); };
          $('#costs', el).addEventListener('click', e => { const b = e.target.closest('[data-rmc]'); if (b) { b.closest('.cost-row').remove(); prev(); } });
          el.addEventListener('input', prev); prev();
        }
        const del = $('#del-car', el);
        if (del) del.onclick = () => confirmBox('Excluir este carro e os lançamentos de compra/preparação dele?', () => {
          const d = db(); d.carros = d.carros.filter(x => x.id !== c.id); d.lancamentos = d.lancamentos.filter(l => !(l.ref && l.ref.tipo === 'carro' && l.ref.id === c.id));
          persist('Carro excluído', 'Excluiu ' + D.carroTitulo(c)); closeModal(); render();
        });
        el._photos = photos;
      },
      onOk: el => {
        const f = $('#cf', el); if (!f.reportValidity()) return false;
        const g = n => f[n] ? f[n].value : undefined;
        const precoAntigo = novo ? 0 : D.getCarro(c.id).preco;
        Object.assign(c, {
          marca: g('marca').trim(), modelo: g('modelo').trim(), versao: g('versao').trim(), anoFab: +g('anoFab'), anoMod: +g('anoMod'), km: +g('km'), cor: g('cor').trim(),
          cambio: g('cambio'), combustivel: g('combustivel'), carroceria: g('carroceria'), placa: g('placa').trim(), preco: +g('preco'), fipe: +g('fipe'), origem: g('origem'),
          dataEntrada: g('dataEntrada') || today, fornecedor: g('fornecedor').trim(), opcionais: g('opcionais').split('\n').map(s => s.trim()).filter(Boolean), descricao: g('descricao').trim(),
          status: g('status'), publicado: f.publicado.checked, destaque: f.destaque.checked, fotos: el._photos, valoresIlustrativos: false,
          precoAnterior: +g('precoAnterior') || 0, comentarioLoja: g('comentarioLoja').trim(), videoUrl: g('videoUrl').trim(),
          checklist: D.CHECKLIST.reduce((o, k) => { o[k[0]] = f['ck_' + k[0]].checked; return o; }, {})
        });
        /* baixou o preço? o site mostra "de/por" sozinho */
        if (!novo && !c.precoAnterior && precoAntigo && c.preco < precoAntigo) c.precoAnterior = precoAntigo;
        if (c.precoAnterior && c.precoAnterior <= c.preco) c.precoAnterior = 0;
        if (money()) c.precoMinimo = +g('precoMinimo') || 0;
        if (money()) { c.precoCompra = +g('precoCompra') || 0; c.custos = $$('.cost-row', el).map(r => ({ desc: $('[name=cd]', r).value.trim(), valor: +$('[name=cv]', r).value || 0 })).filter(x => x.desc || x.valor); }
        if (c.status === 'preparacao') c.publicado = false;
        portaisSave(c, f);
        const d = db();
        if (novo) { c.id = 'c_' + D.slug(c.marca + '-' + c.modelo + '-' + c.anoMod) + '-' + Math.random().toString(36).slice(2, 6); c.dataSaida = null; c.vendaId = null; d.carros.push(c); }
        else { const i = d.carros.findIndex(x => x.id === c.id); d.carros[i] = c; }
        syncCarLanc(c);
        if (!persist(novo ? 'Carro cadastrado ✓' : 'Alterações salvas ✓', (novo ? 'Cadastrou ' : 'Editou ') + D.carroTitulo(c))) return false;
        render();
      }
    });
  }
  const costRow = x => `<div class="cost-row"><input class="in" name="cd" placeholder="Ex.: Funilaria, pneus, documentação" value="${esc(x.desc)}"><input class="in" type="number" name="cv" placeholder="R$" value="${esc(x.valor)}"><button type="button" class="b icon sm danger" data-rmc title="Remover" style="height:42px;width:32px">${IC.x}</button></div>`;

  /* =====================================================================
     ENTRADAS E SAÍDAS DE CARROS
     ===================================================================== */
  V.movimentacao = () => {
    const mk = S.mk;
    const ent = db().carros.filter(c => D.monthKey(c.dataEntrada) === mk).sort((a, b) => a.dataEntrada < b.dataEntrada ? 1 : -1);
    const sai = vendasDo(mk).sort((a, b) => a.data < b.data ? 1 : -1);
    const giro = sai.length ? Math.round(sum(sai, v => D.diasEstoque(D.getCarro(v.carroId))) / sai.length) : 0;
    const ms = meses(6);
    return `<div class="kpis">
      ${kpi('Carros que entraram', ent.length, money() ? kbrl(sum(ent, D.custoCarro)) + ' investidos' : D.monthLabel(mk), 'upload', true)}
      ${kpi('Carros que saíram', sai.length, kbrl(sum(sai, v => v.valor)) + ' em vendas', 'download')}
      ${kpi('Saldo de estoque', (ent.length - sai.length > 0 ? '+' : '') + (ent.length - sai.length), 'entradas menos saídas', 'swap')}
      ${kpi('Giro médio', giro + ' dias', 'da entrada até a venda', 'clock')}
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><div><h3>Entradas x saídas — 6 meses</h3><p>Quantidade de carros</p></div></div>${bars(ms.map(m => D.monthLabel(m, true)), [{ name: 'Entraram', color: '#7FB3D5', values: ms.map(m => db().carros.filter(c => D.monthKey(c.dataEntrada) === m).length) }, { name: 'Saíram (vendidos)', color: '#D40000', values: ms.map(m => vendasDo(m).length) }], { h: 220, fmt: v => Math.round(v) })}</div>
    <div class="cols c-1-1">
      <div class="card"><div class="card-h"><h3>Entraram em ${D.monthLabel(mk)}</h3></div><div class="list">${ent.map(c => `<div class="li"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div class="grow"><b>${esc(D.carroTitulo(c))} ${c.anoMod}</b><small>${D.dateBR(c.dataEntrada)} · ${c.origem === 'troca' ? 'Troca' : c.origem === 'consignado' ? 'Consignado' : 'Compra'} · ${pill(c.status, STATUS[c.status])}</small></div>${money() ? `<b>${brl(c.precoCompra)}</b>` : ''}</div>`).join('') || '<div class="empty">Nenhuma entrada neste mês</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Saíram em ${D.monthLabel(mk)}</h3></div><div class="list">${sai.map(v => { const c = D.getCarro(v.carroId); return `<div class="li" data-act="venda-ver" data-id="${v.id}" style="cursor:pointer"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div class="grow"><b>${esc(D.carroTitulo(c))} ${c.anoMod}</b><small>${D.dateBR(v.data)} · ${esc((D.getUser(v.vendedorId) || {}).nome || '—')} · ${D.diasEstoque(c)} dias em estoque</small></div><b>${brl(v.valor)}</b></div>`; }).join('') || '<div class="empty">Nenhuma venda neste mês</div>'}</div></div>
    </div>`;
  };

  /* =====================================================================
     LEADS (funil kanban)
     ===================================================================== */
  V.leads = () => {
    const f = S.f.leads || (S.f.leads = { v: '', o: '', q: '' });
    let ls = db().leads.slice();
    if (isVend()) ls = ls.filter(l => !l.vendedorId || l.vendedorId === me());
    if (f.v) ls = ls.filter(l => f.v === '_none' ? !l.vendedorId : l.vendedorId === f.v);
    if (f.o) ls = ls.filter(l => l.origem === f.o);
    if (f.q) { const q = f.q.toLowerCase(); ls = ls.filter(l => (l.nome + ' ' + l.telefone + ' ' + D.carroNome(D.getCarro(l.carroId))).toLowerCase().includes(q)); }
    const origens = Array.from(new Set(db().leads.map(l => l.origem)));
    const semV = db().leads.filter(l => l.etapa === 'novo' && !l.vendedorId).length;
    return `<div class="toolbar">
      <input class="in" id="ld-q" placeholder="Buscar nome, telefone, carro…" value="${esc(f.q)}">
      ${!isVend() ? `<select class="sel" id="ld-v"><option value="">Todos os vendedores</option><option value="_none" ${f.v === '_none' ? 'selected' : ''}>Sem vendedor</option>${vendedores().map(u => `<option value="${u.id}" ${f.v === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select>` : ''}
      <select class="sel" id="ld-o"><option value="">Todas as origens</option>${origens.map(o => `<option value="${o}" ${f.o === o ? 'selected' : ''}>${D.origemLabel(o)}</option>`).join('')}</select>
      <span class="sp"></span>
      ${!isVend() && semV ? `<button class="b" data-act="distribuir">${IC.users}Distribuir ${semV} novos</button>` : ''}
      <button class="b gold" data-act="lead-novo">${IC.plus}Novo lead</button>
    </div>
    <p class="small muted" style="margin:-6px 0 12px"><span class="only-desk">Arraste os cartões entre as colunas para mudar a etapa.</span><span class="only-mob">Toque na etapa para ver os leads dela. O botão de seta no cartão passa o lead para a próxima etapa.</span> Leads do site entram sozinhos em “Novo”. <span class="late-key">Borda vermelha</span> = esperando resposta há mais de 2h · ⏰ = retorno marcado vencido.</p>
    <div class="kstages" id="kstages" role="tablist" aria-label="Etapas">${ETAPAS.map(e => `<button type="button" role="tab" data-et="${e[0]}" class="${(f.et || 'novo') === e[0] ? 'on' : ''}" aria-selected="${(f.et || 'novo') === e[0]}">${e[1]}<i>${ls.filter(l => l.etapa === e[0]).length}</i></button>`).join('')}</div>
    <div class="kanban">${ETAPAS.map(e => { const col = ls.filter(l => l.etapa === e[0]).sort((a, b) => a.criadoEm < b.criadoEm ? 1 : -1); return `<div class="kcol ${(f.et || 'novo') === e[0] ? 'sel' : ''}" data-col="${e[0]}"><div class="kcol-h"><b>${e[1]}</b>${pill(e[0] + ' no-dot', col.length)}</div>${col.map(l => { const c = D.getCarro(l.carroId); const u = D.getUser(l.vendedorId); const d = D.diffDays(l.criadoEm, today); return `<div class="kcard ${leadLate(l) ? 'late' : ''}" draggable="true" data-lead="${l.id}"><b>${esc(l.nome)}${l.etapa !== 'novo' && ATIVAS.includes(l.etapa) && l.proximoContato && l.proximoContato <= today ? ' <span class="due" title="Retorno marcado para ' + D.dateBR(l.proximoContato) + '">⏰</span>' : ''}</b><div class="car">${c ? esc(D.carroTitulo(c) + ' ' + c.anoMod) : esc(l.mensagem || 'Sem carro definido').slice(0, 60)}</div><div class="row"><span class="pill no-dot">${esc(D.origemLabel(l.origem))}</span><small>${d === 0 ? 'hoje' : d + 'd'}</small>${u ? av(u, 'sm') : '<span class="av sm" style="--c:#333;color:#999" title="Sem vendedor">—</span>'}</div>${leadExtras(l)}${NEXT[l.etapa] ? `<button type="button" class="knext" data-next="${l.id}" aria-label="Passar para ${etapaLabel(NEXT[l.etapa])}">${etapaLabel(NEXT[l.etapa])} ${IC.right}</button>` : ''}</div>`; }).join('') || '<div class="kempty">Nenhum lead nesta etapa</div>'}</div>`; }).join('')}</div>`;
  };
  AFTER.leads = () => {
    const f = S.f.leads;
    const q = $('#ld-q'); q.oninput = () => { f.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { render(); const n = $('#ld-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 350); };
    if ($('#ld-v')) $('#ld-v').onchange = e => { f.v = e.target.value; render(); };
    $('#ld-o').onchange = e => { f.o = e.target.value; render(); };
    $$('#kstages [data-et]').forEach(b => b.onclick = () => { f.et = b.dataset.et; $$('#kstages [data-et]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); $$('.kcol').forEach(c => c.classList.toggle('sel', c.dataset.col === f.et)); });
    $$('[data-next]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const l = db().leads.find(x => x.id === b.dataset.next); if (!l) return; const et = NEXT[l.etapa]; if (!et) return;
      if (et === 'vendido') { if (!l.vendidoVendaId) { leadMove(l, 'vendido'); persist(); render(); return saleModal({ leadId: l.id, carroId: l.carroId }); } }
      leadMove(l, et); if (isVend() && !l.vendedorId) l.vendedorId = me();
      persist('Lead passou para ' + etapaLabel(et)); render();
    });
    let drag = null, moved = false;
    $$('.kcard').forEach(k => {
      k.ondragstart = e => { drag = k.dataset.lead; moved = true; k.classList.add('dragging'); e.dataTransfer.setData('text/plain', drag); };
      k.ondragend = () => { k.classList.remove('dragging'); setTimeout(() => moved = false, 50); };
      k.onclick = () => { if (!moved) leadModal(k.dataset.lead); };
    });
    $$('.kcol').forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = e => {
        e.preventDefault(); col.classList.remove('over');
        const l = db().leads.find(x => x.id === (e.dataTransfer.getData('text/plain') || drag)); if (!l || l.etapa === col.dataset.col) return;
        if (col.dataset.col === 'vendido' && !l.vendidoVendaId) { leadMove(l, 'vendido'); persist(); render(); return saleModal({ leadId: l.id, carroId: l.carroId }); }
        leadMove(l, col.dataset.col); if (isVend() && !l.vendedorId) l.vendedorId = me();
        persist('Lead movido para ' + etapaLabel(col.dataset.col)); render();
      };
    });
  };
  function leadMove(l, et) { l.historico = l.historico || []; l.historico.push({ data: D.nowISO(), texto: 'Etapa: ' + etapaLabel(l.etapa) + ' → ' + etapaLabel(et), autor: S.user.nome }); if (l.etapa === 'novo' && et !== 'novo' && !l.primeiroContatoEm) l.primeiroContatoEm = D.nowISO(); l.etapa = et; }

  function leadModal(id) {
    const novo = !id;
    const l = novo ? { nome: '', telefone: '', carroId: '', origem: 'loja', mensagem: '', etapa: 'novo', vendedorId: isVend() ? me() : '', criadoEm: D.nowISO(), historico: [], proximoContato: null } : db().leads.find(x => x.id === id);
    const resp = l.primeiroContatoEm && String(l.criadoEm).length > 10 ? D.diffHours(l.criadoEm, l.primeiroContatoEm) : null;
    const carros = db().carros.filter(c => c.status !== 'vendido' || c.id === l.carroId);
    const body = `<form id="lf"><div class="grid-form">
      <label class="fl c2"><span>Nome *</span><input class="in" name="nome" required value="${esc(l.nome)}"></label>
      <label class="fl c2"><span>WhatsApp / telefone</span><input class="in" name="telefone" value="${esc(l.telefone)}" placeholder="(11) 9 0000-0000"></label>
      <label class="fl c2"><span>Carro de interesse</span><select class="sel" name="carroId"><option value="">— nenhum ainda —</option>${carros.map(c => `<option value="${c.id}" ${l.carroId === c.id ? 'selected' : ''}>${esc(D.carroNome(c))}</option>`).join('')}</select></label>
      <label class="fl"><span>Origem</span><select class="sel" name="origem">${['loja', 'instagram', 'facebook', 'telefone', 'indicacao', 'site-whatsapp', 'site-financiamento', 'site-venda-seu-carro', 'site-contato', 'google', 'gmn', 'olx', 'webmotors', 'icarros', 'mercadolivre', 'mobiauto', 'marketplace', 'outro'].concat(['loja', 'instagram', 'facebook', 'telefone', 'indicacao', 'site-whatsapp', 'site-financiamento', 'site-venda-seu-carro', 'site-contato', 'google', 'gmn', 'olx', 'webmotors', 'icarros', 'mercadolivre', 'mobiauto', 'marketplace', 'outro'].includes(l.origem) ? [] : [l.origem]).map(o => `<option value="${o}" ${l.origem === o ? 'selected' : ''}>${D.origemLabel(o)}</option>`).join('')}</select></label>
      <label class="fl"><span>Etapa</span><select class="sel" name="etapa">${ETAPAS.map(e => `<option value="${e[0]}" ${l.etapa === e[0] ? 'selected' : ''}>${e[1]}</option>`).join('')}</select></label>
      <label class="fl c2"><span>Vendedor responsável</span><select class="sel" name="vendedorId" ${isVend() ? 'disabled' : ''}><option value="">— sem vendedor —</option>${vendedores().map(u => `<option value="${u.id}" ${l.vendedorId === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
      <label class="fl"><span>Próximo contato</span><input class="in" type="date" name="proximoContato" value="${esc(l.proximoContato || '')}"></label>
      <label class="fl"><span>Observação</span><input class="in" name="mensagem" value="${esc(l.mensagem)}"></label>
      <label class="fl"><span>Como vai pagar</span><select class="sel" name="pagamento">${['', 'À vista', 'Financiado', 'Financiado sem entrada', 'Troca + diferença', 'Ainda não sabe'].map(o => `<option value="${o}" ${(l.qualif || {}).pagamento === o ? 'selected' : ''}>${o || '—'}</option>`).join('')}</select></label>
      <label class="fl"><span>Prazo de compra</span><select class="sel" name="prazo">${['', 'Esta semana', 'Este mês', 'Até 3 meses', 'Só pesquisando'].map(o => `<option value="${o}" ${(l.qualif || {}).prazo === o ? 'selected' : ''}>${o || '—'}</option>`).join('')}</select></label>
      <label class="fl c2"><span>Carro na troca (modelo, ano, km)</span><input class="in" name="troca" value="${esc((l.qualif || {}).troca || '')}" placeholder="ex.: Onix 2016, 90 mil km"></label>
      <label class="fl c2"><span>Motivo da perda <small style="color:var(--muted)">(obrigatório em “Perdido”)</small></span><select class="sel" name="motivoPerda">${['', 'Sem resposta', 'Crédito não aprovado', 'Preço ou parcela acima do que pode', 'Troca avaliada abaixo do esperado', 'Comprou em outro lugar', 'Carro de interesse foi vendido', 'Só pesquisando / adiou', 'Fora da região', 'Contato inválido', 'Não quer contato'].map(o => `<option value="${o}" ${l.motivoPerda === o ? 'selected' : ''}>${o || '—'}</option>`).join('')}</select></label>
    </div>
    ${credHTML(l)}
    ${!novo ? `<div class="lead-meta">${l.utm ? `<span>${IC.globe} Campanha: <b>${esc([l.utm.source, l.utm.campaign].filter(Boolean).join(' · '))}</b></span>` : ''}<span>${IC.clock} Chegou ${D.dateBR(l.criadoEm)} ${D.timeOf(l.criadoEm)}</span>${resp != null ? `<span>Primeira resposta em <b class="${resp > 2 ? 'down' : 'up'}">${resp < 1 ? Math.max(1, Math.round(resp * 60)) + ' min' : resp.toFixed(1).replace('.', ',') + ' h'}</b></span>` : ''}</div>` : ''}
    ${!novo ? `<div class="sec-t">Histórico</div><div class="timeline">${(l.historico || []).slice().reverse().map(h => `<div>${esc(h.texto)}<small>${D.dateBR(h.data)} ${D.timeOf(h.data)} · ${esc(h.autor)}</small></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:6px"><input class="in" id="nota" placeholder="Adicionar anotação (ex.: cliente pediu para ligar sábado)"><button type="button" class="b" id="add-nota">Anotar</button></div>` : ''}
    </form>`;
    modal({
      title: novo ? 'Novo lead' : l.nome, body,
      left: novo ? '' : `${(!isVend() || l.vendedorId === me()) ? `<button class="b danger" id="del-lead">${IC.trash}</button>` : ''}<select class="sel" id="lead-script" style="width:auto;min-width:160px" title="Mensagem pronta">${scriptsOpts()}</select><button class="b green" id="wa-lead">${IC.wa}Enviar</button><button class="b" id="ag-lead" title="Agendar visita/test drive">${IC.cal}</button><button class="b" id="prop-lead" title="Gerar proposta" aria-label="Gerar proposta">${IC.print}</button><button class="b" id="av-lead" title="Avaliar o carro do cliente (troca ou compra)" aria-label="Avaliar o carro do cliente">${IC.clip}</button>${l.etapa !== 'vendido' ? `<button class="b" id="sell-lead">${IC.tag}Vendeu</button>` : ''}`,
      ok: novo ? 'Criar lead' : 'Salvar',
      mount: el => {
        credMount(el);
        if (novo) return;
        $('#av-lead', el).onclick = () => { const ex = avs().find(x => x.leadId === l.id && x.status !== 'recusado'); closeModal(); if (ex) return avModal(ex.id); const pa = l.preAval || {}; avModal(null, Object.assign({ leadId: l.id, clienteNome: l.nome, telefone: l.telefone, tipo: l.origem === 'site-venda-seu-carro' ? 'compra' : 'troca', obs: [(l.qualif || {}).troca || l.mensagem || '', pa.estado ? 'Estado informado pelo cliente: ' + pa.estado : ''].filter(Boolean).join(' · ') }, pa.marca ? { marca: pa.marca, modelo: pa.modelo, versao: pa.versao || '', anoFab: pa.ano || 2018, anoMod: pa.ano || 2018, km: pa.km || 0, pedido: pa.pedido || 0 } : {})); };
        $('#add-nota', el).onclick = () => { const t = $('#nota', el).value.trim(); if (!t) return; l.historico.push({ data: D.nowISO(), texto: t, autor: S.user.nome }); persist('Anotação salva'); closeModal(); leadModal(l.id); };
        $('#wa-lead', el).onclick = () => { const txt = scriptText($('#lead-script', el).value, l); if (l.etapa === 'novo') { leadMove(l, 'atendimento'); if (!l.vendedorId) l.vendedorId = me(); } l.historico.push({ data: D.nowISO(), texto: 'WhatsApp enviado: ' + ((db().config.scripts || []).find(x => x.id === $('#lead-script', el).value) || {}).titulo, autor: S.user.nome }); persist(); openWa(l.telefone, txt, l.demo); };
        $('#ag-lead', el).onclick = () => { closeModal(); agendaModal(null, { leadId: l.id, clienteNome: l.nome, telefone: l.telefone, carroId: l.carroId, vendedorId: l.vendedorId || me(), tipo: l.carroId ? 'test-drive' : 'visita' }); };
        $('#prop-lead', el).onclick = () => { const c = D.getCarro(l.carroId); if (!c) return toast('Escolha o carro de interesse do lead primeiro.'); printProposta(c, l.nome); };
        const s = $('#sell-lead', el); if (s) s.onclick = () => { closeModal(); saleModal({ leadId: l.id, carroId: l.carroId }); };
        const d = $('#del-lead', el); if (d) d.onclick = () => confirmBox('Excluir este lead?', () => { const dd = db(); dd.leads = dd.leads.filter(x => x.id !== l.id); persist('Lead excluído'); closeModal(); render(); });
      },
      onOk: el => {
        const f = $('#lf', el); if (!f.reportValidity()) return false;
        const et = f.etapa.value;
        if (et === 'perdido' && !f.motivoPerda.value) { toast('Escolha o motivo da perda.'); f.motivoPerda.focus(); return false; }
        if (!novo && et !== l.etapa) leadMove(l, et);
        l.qualif = { pagamento: f.pagamento.value, prazo: f.prazo.value, troca: f.troca.value.trim() };
        credSave(l, f, el);
        l.motivoPerda = et === 'perdido' ? f.motivoPerda.value : (f.motivoPerda.value || null);
        Object.assign(l, { nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), carroId: f.carroId.value || null, origem: f.origem.value, mensagem: f.mensagem.value.trim(), etapa: et, proximoContato: f.proximoContato.value || null, vendedorId: isVend() ? (l.vendedorId || me()) : (f.vendedorId.value || null) });
        if (novo) { l.id = D.uid('ld'); l.historico = [{ data: D.nowISO(), texto: 'Lead cadastrado (' + D.origemLabel(l.origem) + ')', autor: S.user.nome }]; db().leads.unshift(l); }
        persist(novo ? 'Lead criado ✓' : 'Lead atualizado ✓', (novo ? 'Criou' : 'Atualizou') + ' lead ' + l.nome); render();
        if (et === 'vendido' && !l.vendidoVendaId) setTimeout(() => saleModal({ leadId: l.id, carroId: l.carroId }), 0);
      }
    });
  }

  /* =====================================================================
     VENDAS
     ===================================================================== */
  V.vendas = () => {
    const f = S.f.vendas || (S.f.vendas = { v: '' });
    const uid = isVend() ? me() : f.v;
    const vs = vendasDo(S.mk, uid).sort((a, b) => a.data < b.data ? 1 : -1);
    const fat = sum(vs, v => v.valor);
    return `<div class="kpis">
      ${kpi('Vendas', vs.length, D.monthLabel(S.mk), 'tag', true)}
      ${kpi('Faturamento', brl(fat), delta(fat, sum(prevVendas(S.mk, uid), v => v.valor), S.mk === D.monthKey(today)), 'money')}
      ${money() ? kpi('Lucro bruto', brl(sum(vs, v => v.lucro)), 'margem ' + pct(sum(vs, v => v.lucro), fat) + '%', 'trend') : ''}
      ${kpi('Ticket médio', brl(vs.length ? fat / vs.length : 0), 'por carro', 'target')}
      ${kpi(isVend() ? 'Minha comissão' : 'Comissões geradas', brl(sum(vs, v => v.comissao)), 'pagas: ' + brl(sum(vs.filter(v => v.comissaoPaga), v => v.comissao)), 'percent')}
      ${(() => { const pend = db().vendas.filter(v => (!isVend() || v.vendedorId === me()) && D.docStatus(v) && !D.docStatus(v).completo); const atr = pend.filter(v => D.docStatus(v).restam < 0 && !D.docStatus(v).comunicada).length; return kpi('Documentação aberta', pend.length, atr ? `<span class="down">${atr} com a comunicação atrasada</span>` : 'transferências em andamento', 'clip'); })()}
      ${kpi('Financiadas', pct(vs.filter(v => v.formaPagamento.includes('financiado')).length, vs.length || 1) + '%', vs.filter(v => v.formaPagamento.includes('financiado') && !v.entrada).length + ' sem entrada', 'wallet')}
    </div>
    <div class="toolbar">
      ${!isVend() ? `<select class="sel" id="vd-v"><option value="">Todos os vendedores</option>${vendedores(true).map(u => `<option value="${u.id}" ${f.v === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select>` : ''}
      <span class="sp"></span>
      <button class="b" data-act="csv-vendas">${IC.download}Exportar planilha</button>
      <button class="b gold" data-act="venda-nova">${IC.plus}Registrar venda</button>
    </div>
    <div class="tw"><table class="t"><thead><tr><th>Data</th><th>Carro</th><th>Cliente</th><th>Vendedor</th><th>Pagamento</th><th>Documentos</th><th class="num">Valor</th>${money() ? '<th class="num">Lucro</th>' : ''}<th class="num">Comissão</th></tr></thead><tbody>
    ${vs.map(v => { const c = D.getCarro(v.carroId), cl = D.getCliente(v.clienteId), u = D.getUser(v.vendedorId); return `<tr class="click" data-act="venda-ver" data-id="${v.id}"><td>${D.dateBR(v.data)}</td><td><div class="car-cell"><img class="thumb" src="${esc(D.carroFoto(c))}" alt=""><div><b>${esc(D.carroTitulo(c))}</b><small>${c.anoFab}/${c.anoMod} · ${esc(c.cor)}</small></div></div></td><td>${esc(cl ? cl.nome : '—')}</td><td><span style="display:flex;gap:8px;align-items:center">${av(u, 'sm')}${esc(u ? u.nome.split(' ')[0] : '—')}</span></td><td>${PAG[v.formaPagamento] || v.formaPagamento}${v.banco ? '<br><small class="muted">' + esc(v.banco) + (v.formaPagamento !== 'avista' && !v.entrada ? ' · sem entrada' : '') + '</small>' : ''}</td><td>${docPill(v)}</td><td class="num"><b>${brl(v.valor)}</b>${v.aprovacao === 'pendente' ? '<br>' + pill('bad no-dot', 'aguardando aprovação') : ''}</td>${money() ? `<td class="num ${v.lucro >= 0 ? 'up' : 'down'}">${brl(v.lucro)}</td>` : ''}<td class="num">${brl(v.comissao)} ${v.comissaoPaga ? pill('ok no-dot', 'paga') : pill('warn no-dot', 'a pagar')}</td></tr>`; }).join('') || `<tr><td colspan="8"><div class="empty">Nenhuma venda em ${D.monthLabel(S.mk)}.</div></td></tr>`}
    </tbody>${vs.length ? `<tfoot><tr><td colspan="6">Total · ${vs.length} carros</td><td class="num">${brl(fat)}</td>${money() ? `<td class="num">${brl(sum(vs, v => v.lucro))}</td>` : ''}<td class="num">${brl(sum(vs, v => v.comissao))}</td></tr></tfoot>` : ''}</table></div>`;
  };
  AFTER.vendas = () => { if ($('#vd-v')) $('#vd-v').onchange = e => { S.f.vendas.v = e.target.value; render(); }; };

  function saleModal(o = {}) {
    const disp = db().carros.filter(c => c.status === 'venda' || c.status === 'reservado' || c.status === 'preparacao');
    if (!disp.length) return toast('Nenhum carro disponível no estoque.');
    const lead = o.leadId ? db().leads.find(l => l.id === o.leadId) : null;
    const c0 = D.getCarro(o.carroId) && D.getCarro(o.carroId).status !== 'vendido' ? D.getCarro(o.carroId) : disp[0];
    const vend0 = isVend() ? me() : (lead && lead.vendedorId) || (vendedores()[0] || {}).id;
    const body = `<form id="sf">
      <div class="sec-t">Carro e vendedor</div>
      <div class="grid-form">
        <label class="fl c2"><span>Carro *</span><select class="sel" name="carroId">${disp.map(c => `<option value="${c.id}" ${c.id === c0.id ? 'selected' : ''}>${esc(D.carroNome(c))} — ${brl(c.preco)}</option>`).join('')}</select></label>
        <label class="fl"><span>Vendedor *</span><select class="sel" name="vendedorId" ${isVend() ? 'disabled' : ''}>${vendedores().map(u => `<option value="${u.id}" ${u.id === vend0 ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
        <label class="fl"><span>Data da venda</span><input class="in" type="date" name="data" value="${today}"></label>
      </div>
      <div class="sec-t">Cliente</div>
      <div class="grid-form">
        <label class="fl c2"><span>Nome do cliente *</span><input class="in" name="cliente" required value="${esc(lead ? lead.nome : '')}"></label>
        <label class="fl"><span>Telefone</span><input class="in" name="telefone" value="${esc(lead ? lead.telefone : '')}"></label>
        <label class="fl"><span>E-mail</span><input class="in" name="email" type="email"></label>
      </div>
      <div class="sec-t">Negociação</div>
      <div class="grid-form">
        <label class="fl"><span>Valor da venda *</span><input class="in" type="number" name="valor" required value="${c0.preco}"></label>
        <label class="fl"><span>Forma de pagamento</span><select class="sel" name="forma">${Object.keys(PAG).map(k => `<option value="${k}" ${k === 'financiado' ? 'selected' : ''}>${PAG[k]}</option>`).join('')}</select></label>
        <label class="fl"><span>Entrada (R$)</span><input class="in" type="number" name="entrada" value="0"></label>
        <label class="fl"><span>Banco</span><select class="sel" name="banco"><option value="">—</option>${['Santander', 'BV', 'Itaú', 'Bradesco', 'Omni', 'Pan', 'Safra', 'C6', 'Outro'].map(b => `<option>${b}</option>`).join('')}</select></label>
      </div>
      <div id="troca-box" style="display:none"><div class="sec-t">Carro na troca</div><div class="grid-form">
        <label class="fl"><span>Marca</span><input class="in" name="tMarca"></label><label class="fl"><span>Modelo</span><input class="in" name="tModelo"></label>
        <label class="fl"><span>Ano</span><input class="in" type="number" name="tAno" value="2018"></label><label class="fl"><span>KM</span><input class="in" type="number" name="tKm" value="0"></label>
        <label class="fl"><span>Valor da troca (R$)</span><input class="in" type="number" name="tValor" value="0"></label>
        <label class="check c3" style="align-self:end;height:42px"><input type="checkbox" name="tAdd" checked>Adicionar o carro da troca ao estoque (em preparação)</label>
      </div></div>
      <label class="fl" style="margin-top:14px"><span>Observações</span><input class="in" name="obs" placeholder="Ex.: entrega com tanque cheio, garantia de motor e câmbio"></label>
      <div class="preview" id="sprev"></div>
    </form>`;
    modal({
      title: 'Registrar venda', size: 'lg', body, ok: 'Confirmar venda',
      mount: el => {
        const f = $('#sf', el);
        const upd = () => {
          const c = D.getCarro(f.carroId.value), u = D.getUser(isVend() ? me() : f.vendedorId.value);
          const tv = f.forma.value.startsWith('troca') ? (+f.tValor.value || 0) : 0;
          $('#troca-box', el).style.display = f.forma.value.startsWith('troca') ? 'block' : 'none';
          const valor = +f.valor.value || 0, lucro = valor - D.custoCarro(c);
          const com = D.calcComissao({ valor, lucro }, u);
          const fin = f.forma.value.includes('financiado') ? Math.max(0, valor - (+f.entrada.value || 0) - tv) : 0;
          const abaixo = c.precoMinimo && valor < c.precoMinimo;
          $('#sprev', el).innerHTML = (abaixo ? `<div style="grid-column:1/-1" class="${isDir() ? 'muted' : 'down'}"><b style="font-size:13px">${isDir() ? 'Abaixo do preço mínimo que você definiu.' : 'Valor abaixo do mínimo: a venda fica aguardando aprovação da diretoria (a comissão só libera depois).'}</b></div>` : '') + (money() ? `<div><small>Lucro da venda</small><b class="${lucro >= 0 ? 'up' : 'down'}">${brl(lucro)}</b></div>` : '') + `<div><small>Comissão de ${esc(u ? u.nome.split(' ')[0] : '—')}</small><b>${brl(com)}</b></div><div><small>${fin ? 'Valor financiado' : 'Recebido no caixa'}</small><b>${brl(fin || valor - tv)}</b></div>`;
        };
        f.carroId.onchange = () => { f.valor.value = D.getCarro(f.carroId.value).preco; upd(); };
        f.forma.onchange = () => { if (f.forma.value === 'avista') f.entrada.value = f.valor.value; upd(); };
        el.addEventListener('input', upd); upd();
      },
      onOk: el => {
        const f = $('#sf', el); if (!f.reportValidity()) return false;
        const d = db(), c = D.getCarro(f.carroId.value), u = D.getUser(isVend() ? me() : f.vendedorId.value);
        const tel = f.telefone.value.trim();
        let cli = tel ? d.clientes.find(x => D.onlyDigits(x.telefone) === D.onlyDigits(tel)) : null;
        if (!cli) { cli = { id: D.uid('cl'), nome: f.cliente.value.trim(), telefone: tel, email: f.email.value.trim(), cidade: '', criadoEm: f.data.value, obs: '' }; d.clientes.push(cli); }
        const troca = f.forma.value.startsWith('troca');
        const tv = troca ? (+f.tValor.value || 0) : 0;
        const valor = +f.valor.value || 0, ent = f.forma.value === 'avista' ? valor : (+f.entrada.value || 0);
        const v = {
          id: D.uid('v'), carroId: c.id, clienteId: cli.id, vendedorId: u.id, data: f.data.value || today, valor, formaPagamento: f.forma.value, entrada: ent,
          banco: f.forma.value === 'avista' ? '' : f.banco.value, valorFinanciado: f.forma.value.includes('financiado') ? Math.max(0, valor - ent - tv) : 0,
          trocaValor: tv, trocaDescricao: troca ? [f.tMarca.value, f.tModelo.value, f.tAno.value].join(' ').trim() : '', lucro: valor - D.custoCarro(c), comissao: 0, comissaoPaga: false, comissaoPagaEm: null, obs: f.obs.value.trim(), leadId: lead ? lead.id : null,
          aprovacao: !isDir() && c.precoMinimo && valor < c.precoMinimo ? 'pendente' : 'aprovada', docs: {}
        };
        v.comissao = D.calcComissao(v, u);
        d.vendas.push(v);
        Object.assign(c, { status: 'vendido', dataSaida: v.data, vendaId: v.id, destaque: false });
        d.lancamentos.push({ id: D.uid('l'), data: v.data, tipo: 'entrada', categoria: 'Venda de veículo', descricao: 'Venda — ' + D.carroTitulo(c) + ' ' + c.anoMod + (tv ? ' (troca abatida: ' + brl(tv) + ')' : ''), valor: valor - tv, ref: { tipo: 'venda', id: v.id } });
        if (troca && f.tAdd.checked && f.tModelo.value.trim()) {
          const t = { id: 'c_' + D.slug(f.tMarca.value + '-' + f.tModelo.value + '-' + f.tAno.value) + '-' + Math.random().toString(36).slice(2, 6), marca: f.tMarca.value.trim(), modelo: f.tModelo.value.trim(), versao: '', anoFab: +f.tAno.value, anoMod: +f.tAno.value, km: +f.tKm.value || 0, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', portas: 4, preco: Math.round(tv * 1.18 / 1000) * 1000 - 100, precoCompra: tv, fipe: 0, custos: [], opcionais: [], descricao: '', fotos: [], destaque: false, publicado: false, status: 'preparacao', dataEntrada: v.data, dataSaida: null, origem: 'troca', fornecedor: cli.nome, vendaId: null };
          d.carros.push(t); v.trocaCarroId = t.id;
        }
        if (lead) { if (lead.etapa !== 'vendido') leadMove(lead, 'vendido'); lead.vendidoVendaId = v.id; lead.historico.push({ data: today, texto: 'Venda registrada: ' + D.carroTitulo(c) + ' por ' + brl(valor), autor: S.user.nome }); }
        if (persist(v.aprovacao === 'pendente' ? 'Venda registrada — aguardando aprovação da diretoria' : 'Venda registrada! Comissão de ' + brl(v.comissao) + ' para ' + u.nome.split(' ')[0], `Registrou venda de ${D.carroTitulo(c)} (${brl(valor)})${v.aprovacao === 'pendente' ? ' — abaixo do mínimo' : ''}`)) { S.mk = D.monthKey(v.data); render(); }
      }
    });
  }

  function saleView(id) {
    const v = db().vendas.find(x => x.id === id); if (!v) return;
    const c = D.getCarro(v.carroId), cl = D.getCliente(v.clienteId), u = D.getUser(v.vendedorId);
    const rows = [['Data', D.dateBR(v.data)], ['Vendedor', u ? u.nome : '—'], ['Cliente', cl ? cl.nome : '—'], ['Telefone', cl ? cl.telefone || '—' : '—'], ['Pagamento', PAG[v.formaPagamento]], ['Banco', v.banco || '—'], ['Entrada', brl(v.entrada)], ['Financiado', brl(v.valorFinanciado)], ['Troca', v.trocaValor ? v.trocaDescricao + ' · ' + brl(v.trocaValor) : '—'], ['Valor da venda', brl(v.valor)],
      ...(money() ? [['Custo do carro', brl(D.custoCarro(c))], ['Lucro', brl(v.lucro)]] : []), ['Comissão', brl(v.comissao) + (v.comissaoPaga ? ' (paga em ' + D.dateBR(v.comissaoPagaEm) + ')' : ' (a pagar)')], ['Dias em estoque', D.diasEstoque(c)], ['Aprovação', v.aprovacao === 'pendente' ? 'Aguardando a diretoria' : 'Aprovada']];
    modal({
      title: D.carroNome(c), size: 'lg',
      body: `<div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;flex-wrap:wrap"><img src="${esc(D.carroFoto(c))}" alt="" style="width:180px;border-radius:12px;aspect-ratio:4/3;object-fit:cover"><div><div class="muted small">Venda</div><div style="font-size:30px;font-weight:800">${brl(v.valor)}</div>${v.obs ? `<div class="muted small">${esc(v.obs)}</div>` : ''}</div></div><div class="kv">${rows.map(r => `<div><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div><div class="sec-t">Documentação da transferência</div><div id="docs-box">${docsHTML(v)}</div>`,
      left: `${isDir() ? `<button class="b danger" id="cancel-sale">${IC.trash}Cancelar venda</button>` : ''}<button class="b" id="recibo">${IC.print}Recibo / ficha</button>${isDir() && v.aprovacao === 'pendente' ? `<button class="b green" id="aprova">${IC.check}Aprovar</button>` : ''}`,
      ok: 'Fechar', okOnly: true,
      mount: el => {
        $('#recibo', el).onclick = () => printRecibo(v);
        const docsMount = () => {
          const st = $('#doc-start', el); if (st) st.onclick = () => { v.docs = {}; persist('Documentação em controle ✓'); $('#docs-box', el).innerHTML = docsHTML(v); docsMount(); };
          $$('[data-doc]', el).forEach(i => i.onchange = () => { v.docs[i.dataset.doc] = i.checked ? today : null; persist(null, `Documentação ${D.carroTitulo(c)}: ${i.parentElement.textContent.trim()} ${i.checked ? '✓' : '✗'}`); $('#docs-box', el).innerHTML = docsHTML(v); docsMount(); });
        };
        docsMount();
        const ap = $('#aprova', el); if (ap) ap.onclick = () => { aprovarVenda(v.id, true); closeModal(); };
        const b = $('#cancel-sale', el); if (!b) return;
        b.onclick = () => confirmBox('Cancelar esta venda? O carro volta para o estoque e o lançamento financeiro é removido.' + (v.comissaoPaga ? ' Atenção: a comissão já foi paga.' : ''), () => { cancelSale(v); closeModal(); render(); });
      }
    });
  }

  /* =====================================================================
     CLIENTES
     ===================================================================== */
  V.clientes = () => {
    const f = S.f.clientes || (S.f.clientes = { q: '' });
    let vs = db().vendas; if (isVend()) vs = vs.filter(v => v.vendedorId === me());
    const map = {};
    vs.forEach(v => { const k = v.clienteId; (map[k] = map[k] || []).push(v); });
    let cls = Object.keys(map).map(id => ({ c: D.getCliente(id), vs: map[id].sort((a, b) => a.data < b.data ? 1 : -1) })).filter(x => x.c);
    if (f.q) { const q = f.q.toLowerCase(); cls = cls.filter(x => (x.c.nome + ' ' + x.c.telefone).toLowerCase().includes(q)); }
    cls.sort((a, b) => a.vs[0].data < b.vs[0].data ? 1 : -1);
    const pos = vs.filter(v => { const d = D.diffDays(v.data, today); return d >= 90 && d <= 180; }).sort((a, b) => a.data > b.data ? 1 : -1).slice(0, 8);
    return `<div class="cols c-2-1"><div>
      <div class="toolbar"><input class="in" id="cl-q" placeholder="Buscar cliente…" value="${esc(f.q)}"><span class="sp"></span><span class="muted small">${cls.length} clientes</span><button class="b" data-act="csv-clientes">${IC.download}Exportar</button></div>
      <div class="tw"><table class="t" style="min-width:600px"><thead><tr><th>Cliente</th><th>Telefone</th><th>Último carro</th><th>Data</th><th class="num">Compras</th><th class="num">Total</th></tr></thead><tbody>
      ${cls.slice(0, 150).map(x => { const c = D.getCarro(x.vs[0].carroId); return `<tr class="click" data-act="venda-ver" data-id="${x.vs[0].id}"><td><b>${esc(x.c.nome)}</b></td><td>${esc(x.c.telefone || '—')}</td><td>${esc(D.carroTitulo(c))} ${c.anoMod}</td><td>${D.dateBR(x.vs[0].data)}</td><td class="num">${x.vs.length}</td><td class="num">${brl(sum(x.vs, v => v.valor))}</td></tr>`; }).join('') || '<tr><td colspan="6"><div class="empty">Nenhum cliente encontrado</div></td></tr>'}
      </tbody></table></div></div>
      <div class="card"><div class="card-h"><div><h3>Pós-venda</h3><p>Compraram há 3 a 6 meses: hora de ligar, pedir indicação e oferecer a próxima troca</p></div></div>
      ${pos.map(v => { const cl = D.getCliente(v.clienteId), c = D.getCarro(v.carroId); return `<div class="li"><div class="grow"><b>${esc(cl.nome)}</b><small>${esc(D.carroTitulo(c))} · há ${D.diffDays(v.data, today)} dias</small></div><button class="b sm green" data-act="wa-cli" data-id="${cl.id}">${IC.wa}</button></div>`; }).join('') || '<div class="empty">Ninguém nessa janela agora</div>'}</div>
    </div>`;
  };
  AFTER.clientes = () => { const q = $('#cl-q'); q.oninput = () => { S.f.clientes.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { render(); const n = $('#cl-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 350); }; };

  /* =====================================================================
     FINANCEIRO
     ===================================================================== */
  V.financeiro = () => {
    const f = S.f.fin || (S.f.fin = { tipo: '', cat: '' });
    const mk = S.mk, L = lancDo(mk), LP = L.filter(l => l.pago !== false);
    const ent = sum(LP.filter(l => l.tipo === 'entrada'), l => l.valor), sai = sum(LP.filter(l => l.tipo === 'saida'), l => l.valor);
    const aPagar = sum(L.filter(l => l.pago === false && l.tipo === 'saida'), l => l.valor);
    const vs = vendasDo(mk);
    const rec = sum(vs, v => v.valor), cmv = sum(vs, v => D.getCarro(v.carroId).precoCompra), prep = sum(vs, v => D.custoTotal(D.getCarro(v.carroId))), com = sum(vs, v => v.comissao);
    const fixas = sum(L.filter(l => l.tipo === 'saida' && !['Compra de veículo', 'Preparação de veículo', 'Comissões'].includes(l.categoria)), l => l.valor);
    const res = rec - cmv - prep - com - fixas;
    const ms = meses(6);
    const cats = {}; L.filter(l => l.tipo === 'saida').forEach(l => cats[l.categoria] = (cats[l.categoria] || 0) + l.valor);
    let list = L.slice().sort((a, b) => a.data < b.data ? 1 : -1);
    if (f.tipo) list = list.filter(l => l.tipo === f.tipo);
    if (f.cat) list = list.filter(l => l.categoria === f.cat);
    const allCats = Array.from(new Set(L.map(l => l.categoria))).sort();
    const dre = [['Receita de vendas', rec, ''], ['(−) Custo de compra dos carros vendidos', -cmv, ''], ['(−) Preparação dos carros vendidos', -prep, ''], ['= Lucro bruto', rec - cmv - prep, 'b'], ['(−) Comissões', -com, ''], ['(−) Despesas fixas e operacionais', -fixas, ''], ['= Resultado do mês', res, 'b']];
    return `<div class="kpis">
      ${kpi('Entradas no caixa', brl(ent), D.monthLabel(mk), 'download', false)}
      ${kpi('Saídas do caixa', brl(sai), 'inclui compra de carros', 'upload')}
      ${kpi('Saldo do caixa', `<span class="${ent - sai >= 0 ? 'up' : 'down'}">${brl(ent - sai)}</span>`, 'entradas − saídas', 'wallet', true)}
      ${kpi('Resultado do mês', `<span class="${res >= 0 ? 'up' : 'down'}">${brl(res)}</span>`, 'lucro das vendas − comissões − despesas', 'trend')}
      ${kpi('A pagar no mês', `<span class="${aPagar ? 'down' : ''}">${brl(aPagar)}</span>`, 'contas lançadas e ainda não pagas', 'clock')}
    </div>
    <div class="cols c-2-1">
      <div class="card"><div class="card-h"><div><h3>Entradas x saídas — 6 meses</h3><p>Fluxo de caixa (dinheiro que entrou e saiu)</p></div></div>${bars(ms.map(m => D.monthLabel(m, true)), [{ name: 'Entradas', color: '#82E0AA', values: ms.map(m => sum(lancDo(m).filter(l => l.tipo === 'entrada' && l.pago !== false), l => l.valor)) }, { name: 'Saídas', color: '#F1948A', values: ms.map(m => sum(lancDo(m).filter(l => l.tipo === 'saida' && l.pago !== false), l => l.valor)) }])}</div>
      <div class="card"><div class="card-h"><div><h3>Resultado (DRE simplificado)</h3><p>${D.monthLabel(mk)} · com base nas vendas</p></div></div>
        <div class="list">${dre.map(r => `<div class="li" style="${r[2] ? 'font-weight:800' : ''}"><span class="grow">${r[0]}</span><span class="${r[1] < 0 ? 'down' : r[2] ? 'up' : ''}" style="font-variant-numeric:tabular-nums">${brl(r[1])}</span></div>`).join('')}</div></div>
    </div>
    <div class="cols c-1-1">${contasHTML()}
      <div class="card"><div class="card-h"><h3>Para onde foi o dinheiro</h3></div>${hbars(Object.keys(cats).map(k => ({ label: k, value: cats[k] })).sort((a, b) => b.value - a.value), kbrl)}</div></div>
      <div class="card" style="padding:0;overflow:hidden"><div class="card-h" style="padding:18px 18px 0"><h3>Lançamentos</h3><div class="toolbar" style="margin:0">
        <select class="sel" id="fn-t" style="min-width:120px"><option value="">Todos</option><option value="entrada" ${f.tipo === 'entrada' ? 'selected' : ''}>Entradas</option><option value="saida" ${f.tipo === 'saida' ? 'selected' : ''}>Saídas</option></select>
        <select class="sel" id="fn-c"><option value="">Todas as categorias</option>${allCats.map(c => `<option ${f.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <button class="b" data-act="relatorio" title="Relatório do mês">${IC.print}</button><button class="b" data-act="csv-fin" title="Exportar planilha">${IC.download}</button><button class="b gold" data-act="lanc-novo">${IC.plus}Lançamento</button></div></div>
        <div style="overflow-x:auto;max-height:520px;margin-top:12px"><table class="t" style="min-width:640px"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="num">Valor</th><th></th></tr></thead><tbody>
        ${list.map(l => `<tr><td>${D.dateBR(l.data)}${l.pago === false ? '<br>' + pill(l.vencimento < today ? 'bad no-dot' : 'warn no-dot', l.vencimento < today ? 'vencida' : 'a pagar') : ''}</td><td>${esc(l.descricao)}</td><td><span class="pill no-dot">${esc(l.categoria)}</span></td><td class="num ${l.tipo === 'entrada' ? 'up' : 'down'}"><b>${l.tipo === 'entrada' ? '+' : '−'} ${brl(l.valor)}</b></td><td>${!l.ref ? `<button class="b sm icon ghost" data-act="lanc-del" data-id="${l.id}" title="Excluir">${IC.trash}</button>` : '<span class="muted small" title="Lançamento automático">auto</span>'}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Nenhum lançamento</div></td></tr>'}
        </tbody></table></div></div>`;
  };
  AFTER.financeiro = () => { $('#fn-t').onchange = e => { S.f.fin.tipo = e.target.value; render(); }; $('#fn-c').onchange = e => { S.f.fin.cat = e.target.value; render(); }; };
  function lancModal() {
    modal({
      title: 'Novo lançamento', size: 'sm',
      body: `<form id="lnf"><div class="grid-form" style="grid-template-columns:1fr 1fr">
        <label class="fl"><span>Tipo</span><select class="sel" name="tipo"><option value="saida">Saída (despesa)</option><option value="entrada">Entrada (receita)</option></select></label>
        <label class="fl"><span>Data</span><input class="in" type="date" name="data" value="${today}"></label>
        <label class="fl c4"><span>Categoria</span><select class="sel" name="categoria">${CAT_SAIDA.map(c => `<option>${c}</option>`).join('')}</select></label>
        <label class="fl c4"><span>Descrição *</span><input class="in" name="descricao" required placeholder="Ex.: Conta de luz de outubro"></label>
        <label class="fl c4"><span>Valor (R$) *</span><input class="in" type="number" step="0.01" name="valor" required></label>
        <label class="check c4"><input type="checkbox" name="pago" checked>Já foi pago / recebido</label>
        <label class="fl c4" id="venc-box" style="display:none"><span>Vencimento</span><input class="in" type="date" name="vencimento" value="${D.addDays(today, 7)}"></label>
      </div></form>`,
      ok: 'Lançar',
      mount: el => { const f = $('#lnf', el); f.tipo.onchange = () => { f.categoria.innerHTML = (f.tipo.value === 'saida' ? CAT_SAIDA : CAT_ENTRADA).map(c => `<option>${c}</option>`).join(''); }; f.pago.onchange = () => { $('#venc-box', el).style.display = f.pago.checked ? 'none' : ''; }; },
      onOk: el => { const f = $('#lnf', el); if (!f.reportValidity()) return false; const pago = f.pago.checked; const venc = pago ? f.data.value : (f.vencimento.value || f.data.value); db().lancamentos.push({ id: D.uid('l'), data: pago ? f.data.value : venc, tipo: f.tipo.value, categoria: f.categoria.value, descricao: f.descricao.value.trim(), valor: +f.valor.value, ref: null, pago, vencimento: venc }); S.mk = D.monthKey(f.data.value); persist('Lançamento registrado ✓', 'Lançou ' + f.descricao.value); render(); }
    });
  }

  /* =====================================================================
     COMISSÕES
     ===================================================================== */
  V.comissoes = () => {
    const mk = S.mk;
    let us = vendedores(true).filter(u => u.ativo || vendasDo(mk, u.id).length); if (isVend()) us = us.filter(u => u.id === me());
    const rows = us.map(u => { const vs = vendasDo(mk, u.id).filter(v => v.aprovacao !== 'pendente'); return { u, vs, fat: sum(vs, v => v.valor), luc: sum(vs, v => v.lucro), com: sum(vs, v => v.comissao), pago: sum(vs.filter(v => v.comissaoPaga), v => v.comissao) }; });
    const tot = sum(rows, r => r.com), pago = sum(rows, r => r.pago);
    return `<div class="kpis">
      ${kpi('Comissões do mês', brl(tot), D.monthLabel(mk), 'percent', true)}
      ${kpi('Já pagas', brl(pago), '', 'check')}
      ${kpi('A pagar', `<span class="${tot - pago > 0 ? 'down' : ''}">${brl(tot - pago)}</span>`, '', 'clock')}
      ${!isVend() ? kpi('Pendentes de outros meses', brl(sum(db().vendas.filter(v => !v.comissaoPaga && D.monthKey(v.data) !== mk && (!isVend() || v.vendedorId === me())), v => v.comissao)), 'acumulado', 'alert') : ''}
    </div>
    <div class="tw" style="margin-bottom:16px"><table class="t"><thead><tr><th>Vendedor</th><th>Regra de comissão</th><th class="num">Carros</th><th class="num">Vendido</th>${money() ? '<th class="num">Lucro gerado</th>' : ''}<th class="num">Comissão</th><th class="num">Pago</th><th class="num">A pagar</th><th></th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><span style="display:flex;gap:10px;align-items:center">${av(r.u, 'sm')}<b>${esc(r.u.nome)}</b></span></td><td class="muted">${esc(D.comissaoRegra(r.u))}</td><td class="num">${r.vs.length}</td><td class="num">${brl(r.fat)}</td>${money() ? `<td class="num">${brl(r.luc)}</td>` : ''}<td class="num"><b>${brl(r.com)}</b></td><td class="num up">${brl(r.pago)}</td><td class="num ${r.com - r.pago > 0 ? 'down' : ''}"><b>${brl(r.com - r.pago)}</b></td><td style="text-align:right">${isDir() && r.com - r.pago > 0 ? `<button class="b sm gold" data-act="pagar" data-id="${r.u.id}">Pagar</button>` : r.com && r.com === r.pago ? pill('ok', 'Quitado') : ''}</td></tr>`).join('') || '<tr><td colspan="9"><div class="empty">Sem vendedores</div></td></tr>'}
    </tbody><tfoot><tr><td colspan="${money() ? 5 : 4}">Total</td><td class="num">${brl(tot)}</td><td class="num">${brl(pago)}</td><td class="num">${brl(tot - pago)}</td><td></td></tr></tfoot></table></div>
    <div class="card"><div class="card-h"><div><h3>Detalhe por venda</h3><p>Como cada comissão foi calculada</p></div></div>
    <div style="overflow-x:auto"><table class="t" style="min-width:700px"><thead><tr><th>Data</th><th>Vendedor</th><th>Carro</th><th class="num">Valor</th>${money() ? '<th class="num">Lucro</th>' : ''}<th>Cálculo</th><th class="num">Comissão</th><th>Status</th></tr></thead><tbody>
    ${rows.flatMap(r => r.vs.map(v => ({ v, u: r.u }))).sort((a, b) => a.v.data < b.v.data ? 1 : -1).map(({ v, u }) => `<tr><td>${D.dateBR(v.data)}</td><td>${esc(u.nome.split(' ')[0])}</td><td>${esc(D.carroTitulo(D.getCarro(v.carroId)))}</td><td class="num">${brl(v.valor)}</td>${money() ? `<td class="num">${brl(v.lucro)}</td>` : ''}<td class="muted small">${esc(D.comissaoRegra(u))}</td><td class="num"><b>${brl(v.comissao)}</b></td><td>${v.comissaoPaga ? pill('ok', 'Paga ' + D.dateBR(v.comissaoPagaEm)) : pill('warn', 'A pagar')}</td></tr>`).join('') || '<tr><td colspan="8"><div class="empty">Nenhuma venda neste mês</div></td></tr>'}
    </tbody></table></div></div>`;
  };
  function pagar(uid) {
    const u = D.getUser(uid), vs = vendasDo(S.mk, uid).filter(v => !v.comissaoPaga && v.aprovacao !== 'pendente'), tot = sum(vs, v => v.comissao);
    confirmBox(`Confirmar pagamento de ${brl(tot)} para ${u.nome} (${vs.length} venda(s) de ${D.monthLabel(S.mk)})? O valor entra como saída no financeiro.`, () => {
      vs.forEach(v => { v.comissaoPaga = true; v.comissaoPagaEm = today; });
      db().lancamentos.push({ id: D.uid('l'), data: today, tipo: 'saida', categoria: 'Comissões', descricao: 'Comissão ' + D.monthLabel(S.mk, true) + ' — ' + u.nome, valor: tot, ref: { tipo: 'comissao', id: uid + ':' + S.mk + ':' + Date.now() } });
      persist('Comissão paga ✓', `Pagou comissão de ${brl(tot)} para ${u.nome}`); render();
    }, 'Confirmar pagamento');
  }

  /* =====================================================================
     EQUIPE
     ===================================================================== */
  V.equipe = () => {
    const mk = S.mk = D.monthKey(today);
    const us = db().usuarios.slice().sort((a, b) => (b.ativo - a.ativo) || (a.cargo === 'diretora' ? -1 : 1));
    const ms = meses(6);
    const vend = vendedores(true);
    return `<div class="toolbar"><span class="muted">${us.filter(u => u.ativo).length} pessoas ativas · desempenho de ${D.monthLabel(mk)}</span><span class="sp"></span>${isDir() ? `<button class="b gold" data-act="membro-novo">${IC.plus}Adicionar funcionário</button>` : ''}</div>
    <div class="team" style="margin-bottom:16px">${us.map(u => { const vs = vendasDo(mk, u.id); return `<div class="member ${u.ativo ? '' : 'off'}"><div class="member-h">${av(u, 'lg')}<div style="flex:1"><b>${esc(u.nome)}</b><small>${CARGOS[u.cargo]}${u.ativo ? '' : ' · inativo'}</small></div>${isDir() ? `<button class="b sm icon" data-act="membro-editar" data-id="${u.id}" title="Editar">${IC.edit}</button>` : ''}</div>
      ${u.cargo === 'diretora' ? `<div class="muted small">Acesso total: estoque, vendas, financeiro, comissões, equipe e configurações.</div>` : `<div class="member-stats"><div><small>Vendas</small><b>${vs.length}/${u.meta}</b></div><div><small>Vendido</small><b>${kbrl(sum(vs, v => v.valor))}</b></div><div><small>Comissão</small><b>${kbrl(sum(vs, v => v.comissao))}</b></div></div>
      <div class="progress ${vs.length >= u.meta ? 'ok' : ''}"><i style="width:${Math.min(100, pct(vs.length, u.meta || 1))}%"></i></div>
      <div class="small muted">${esc(D.comissaoRegra(u))} · ${esc(u.telefone || '')}</div>`}</div>`; }).join('')}</div>
    <div class="card"><div class="card-h"><div><h3>Carros vendidos por vendedor — 6 meses</h3><p>Histórico para acompanhar evolução</p></div></div><div style="overflow-x:auto"><table class="t" style="min-width:600px"><thead><tr><th>Vendedor</th>${ms.map(m => `<th class="num">${D.monthLabel(m, true)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
    ${vend.map(u => `<tr><td><span style="display:flex;gap:8px;align-items:center">${av(u, 'sm')}${esc(u.nome)}</span></td>${ms.map(m => `<td class="num">${vendasDo(m, u.id).length || '<span class="muted">–</span>'}</td>`).join('')}<td class="num"><b>${sum(ms, m => vendasDo(m, u.id).length)}</b></td></tr>`).join('')}
    </tbody></table></div></div>`;
  };
  function memberModal(id) {
    const novo = !id;
    const u = novo ? { nome: '', cargo: 'vendedor', email: '', senha: '', telefone: '', comissaoTipo: 'pct_lucro', comissaoValor: 10, meta: 4, ativo: true, admissao: today, cor: COLORS[Math.floor(Math.random() * COLORS.length)] } : D.getUser(id);
    const self = u.id === me();
    modal({
      title: novo ? 'Novo funcionário' : 'Editar ' + u.nome,
      body: `<form id="mf"><div class="grid-form">
        <label class="fl c2"><span>Nome *</span><input class="in" name="nome" required value="${esc(u.nome)}"></label>
        <label class="fl"><span>Cargo</span><select class="sel" name="cargo" ${self ? 'disabled' : ''}>${Object.keys(CARGOS).map(k => `<option value="${k}" ${u.cargo === k ? 'selected' : ''}>${CARGOS[k]}</option>`).join('')}</select></label>
        <label class="fl"><span>Admissão</span><input class="in" type="date" name="admissao" value="${esc(u.admissao || today)}"></label>
        <label class="fl c2"><span>E-mail (login)</span><input class="in" type="email" name="email" value="${esc(u.email)}"></label>
        <label class="fl"><span>Senha *</span><input class="in" name="senha" required value="${esc(u.senha)}"></label>
        <label class="fl"><span>Telefone</span><input class="in" name="telefone" value="${esc(u.telefone)}"></label>
      </div>
      <div class="sec-t">Comissão e meta</div>
      <div class="grid-form">
        <label class="fl c2"><span>Tipo de comissão</span><select class="sel" name="comissaoTipo"><option value="pct_lucro" ${u.comissaoTipo === 'pct_lucro' ? 'selected' : ''}>% sobre o lucro do carro</option><option value="pct_venda" ${u.comissaoTipo === 'pct_venda' ? 'selected' : ''}>% sobre o valor da venda</option><option value="fixo" ${u.comissaoTipo === 'fixo' ? 'selected' : ''}>Valor fixo por carro (R$)</option><option value="nenhuma" ${u.comissaoTipo === 'nenhuma' ? 'selected' : ''}>Sem comissão</option></select></label>
        <label class="fl"><span>Valor (% ou R$)</span><input class="in" type="number" step="0.1" name="comissaoValor" value="${u.comissaoValor}"></label>
        <label class="fl"><span>Meta (carros/mês)</span><input class="in" type="number" name="meta" value="${u.meta}"></label>
        <label class="check c4" ${self ? 'hidden' : ''}><input type="checkbox" name="ativo" ${u.ativo ? 'checked' : ''}>Ativo (pode entrar no painel e receber leads)</label>
      </div><p class="small muted" style="margin-top:12px">A regra vale para as próximas vendas. Vendas já registradas mantêm a comissão calculada na época.</p></form>`,
      ok: novo ? 'Adicionar' : 'Salvar',
      onOk: el => {
        const f = $('#mf', el); if (!f.reportValidity()) return false;
        Object.assign(u, { nome: f.nome.value.trim(), cargo: self ? u.cargo : f.cargo.value, admissao: f.admissao.value, email: f.email.value.trim(), senha: f.senha.value, telefone: f.telefone.value.trim(), comissaoTipo: f.comissaoTipo.value, comissaoValor: +f.comissaoValor.value || 0, meta: +f.meta.value || 0, ativo: self ? true : f.ativo.checked });
        if (novo) { u.id = D.uid('u'); db().usuarios.push(u); }
        persist(novo ? 'Funcionário adicionado ✓' : 'Dados salvos ✓', (novo ? 'Adicionou ' : 'Editou ') + u.nome); render();
      }
    });
  }

  /* =====================================================================
     COMUNICADOS
     ===================================================================== */
  V.comunicados = () => {
    const cs = db().comunicados.slice().sort((a, b) => (b.fixado - a.fixado) || (a.data < b.data ? 1 : -1));
    const equipe = db().usuarios.filter(u => u.ativo && u.cargo !== 'diretora');
    return `<div class="toolbar"><span class="muted">Recados e orientações da diretoria para toda a equipe</span><span class="sp"></span>${isDir() ? `<button class="b gold" data-act="aviso-novo">${IC.plus}Novo comunicado</button>` : ''}</div>
    ${cs.map(c => { const lido = (c.leituras || []).includes(me()); const autor = D.getUser(c.autorId); return `<div class="notice-card ${c.fixado ? 'fix' : ''}">
      <div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between"><div><h3>${c.fixado ? '📌 ' : ''}${esc(c.titulo)}</h3></div>${isDir() ? `<div style="display:flex;gap:6px"><button class="b sm icon" data-act="aviso-fixar" data-id="${c.id}" title="${c.fixado ? 'Desafixar' : 'Fixar no topo'}">${IC.pin}</button><button class="b sm icon danger" data-act="aviso-del" data-id="${c.id}" title="Excluir">${IC.trash}</button></div>` : ''}</div>
      <p>${esc(c.texto)}</p>
      <div class="notice-meta">${av(autor, 'sm')}<span>${esc(autor ? autor.nome : '')} · ${D.dateBR(c.data)}</span><span class="sp" style="flex:1"></span>
      ${isDir() ? `<span>Lido por ${(c.leituras || []).length} de ${equipe.length}${(c.leituras || []).length ? ': ' + c.leituras.map(id => esc((D.getUser(id) || {}).nome || '').split(' ')[0]).join(', ') : ''}</span>` : lido ? pill('ok', 'Lido') : `<button class="b sm gold" data-act="aviso-ler" data-id="${c.id}">${IC.check}Li e entendi</button>`}</div></div>`; }).join('') || '<div class="empty">Nenhum comunicado ainda.</div>'}`;
  };

  /* =====================================================================
     CONFIGURAÇÕES
     ===================================================================== */
  V.config = () => {
    const c = db().config;
    const inp = (k, l, cls = 'c2', t = 'text', ph = '') => `<label class="fl ${cls}"><span>${l}</span><input class="in" type="${t}" name="${k}" value="${esc(c[k])}" placeholder="${esc(ph)}"${t === 'number' ? ' step="0.01"' : ''}></label>`;
    return `<form id="cfg"><div class="cols c-1-1">
      <div class="card"><div class="card-h"><h3>Dados da loja</h3></div><div class="grid-form">
        ${inp('loja', 'Nome da loja')}${inp('cnpj', 'CNPJ (rodapé do site)', 'c2', 'text', '00.000.000/0001-00')}
        ${inp('whatsapp', 'WhatsApp que recebe os leads (com DDD)', 'c2', 'text', '5511947316038')}${inp('whatsappExibicao', 'WhatsApp como aparece no site')}
        ${inp('telefone', 'Telefone fixo')}${inp('instagram', 'Instagram (sem @)')}
        ${inp('endereco', 'Endereço')}${inp('cidade', 'Cidade / UF')}
        ${inp('horario', 'Horário de funcionamento', 'c4')}
      </div></div>
      <div class="card"><div class="card-h"><h3>Site e vendas</h3></div><div class="grid-form">
        ${inp('heroTitulo', 'Título principal da home', 'c4')}
        <label class="fl c4"><span>Texto de apresentação da home</span><textarea class="ta" name="heroSub">${esc(c.heroSub)}</textarea></label>
        ${inp('videoHero', 'Vídeo do topo da home (arquivo .mp4 do Google Flow)', 'c4', 'text', 'assets/video/hero.mp4')}
        ${inp('taxaJuros', 'Taxa do simulador (% ao mês)', 'c2', 'number')}${inp('metaLoja', 'Meta da loja (carros/mês)', 'c2', 'number')}
        ${inp('avMargem', 'Margem na compra de usados (% abaixo da FIPE, já descontando o preparo)', 'c4', 'number')}
        <label class="check c4"><input type="checkbox" name="mostrarIntro" ${c.mostrarIntro ? 'checked' : ''}>Mostrar a animação da logo ao abrir o site</label>
      </div></div></div>
      <div class="cols c-1-1">
      <div class="card"><div class="card-h"><div><h3>A cara da loja</h3><p>Textos que aparecem no site</p></div></div><div class="grid-form">
        <label class="fl c4"><span>Carta da loja (home e página “A loja”)</span><textarea class="ta" name="cartaLoja" style="min-height:150px">${esc(c.cartaLoja)}</textarea></label>
        ${inp('versiculo', 'Versículo / frase de fé (rodapé do site)', 'c3')}${inp('versiculoRef', 'Referência', 'c1')}
      </div></div>
      <div class="card"><div class="card-h"><div><h3>Integrações e atendimento</h3><p>Medição de anúncios e distribuição de leads</p></div></div><div class="grid-form">
        ${inp('gaId', 'Google Analytics 4 (ID de medição)', 'c2', 'text', 'G-XXXXXXXXXX')}${inp('pixelId', 'Pixel da Meta (ID)', 'c2', 'text', '000000000000000')}
        ${inp('googleReviewUrl', 'Link para avaliar no Google (perfil da loja)', 'c4', 'text', 'https://g.page/r/...')}
        <label class="check c4"><input type="checkbox" name="distribuicaoAuto" ${c.distribuicaoAuto ? 'checked' : ''}>Distribuir leads do site automaticamente entre os vendedores (roleta)</label>
      </div></div></div>
      <div class="toolbar"><span class="sp"></span><button class="b gold" type="submit">Salvar configurações</button></div></form>
      ${scriptsHTML()}
      ${window.LojaIA ? window.LojaIA.configCard() : ''}
      <div class="cols c-1-1">
        <div class="card"><div class="card-h"><div><h3>Backup dos dados</h3><p>Baixe uma cópia de tudo ou restaure de um arquivo</p></div></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="b" data-act="backup">${IC.download}Baixar backup</button><button class="b" data-act="restore">${IC.upload}Restaurar backup</button><input type="file" id="restore-file" accept="application/json" hidden></div>
          <div class="sec-t" style="margin-top:26px">Zona de cuidado</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="b" data-act="demo-reset">Recarregar dados de demonstração</button><button class="b danger" data-act="wipe">Começar do zero (dados reais)</button></div>
          <p class="small muted" style="margin-top:10px">“Começar do zero” apaga carros, vendas, leads, equipe e financeiro de demonstração. Fica só o usuário da diretoria e as configurações.</p></div>
        <div class="card"><div class="card-h"><div><h3>Histórico de alterações</h3><p>Quem fez o quê no sistema</p></div></div><div class="list" style="max-height:340px;overflow:auto">${db().auditoria.slice(0, 40).map(a => `<div class="li"><div class="grow"><b style="font-weight:600">${esc(a.acao)}</b><small>${esc((D.getUser(a.userId) || {}).nome || '—')} · ${new Date(a.data).toLocaleString('pt-BR')}</small></div></div>`).join('') || '<div class="empty">Nenhuma alteração registrada ainda</div>'}</div></div>
      </div>`;
  };
  AFTER.config = () => {
    if (window.LojaIA) window.LojaIA.configMount();
    $('#cfg').onsubmit = e => { e.preventDefault(); const c = db().config; $$('#cfg [name]').forEach(i => { c[i.name] = i.type === 'number' ? +i.value : i.type === 'checkbox' ? i.checked : i.value.trim(); }); persist('Configurações salvas ✓', 'Alterou configurações'); render(); };
    $('#scripts-form').onsubmit = e => { e.preventDefault(); db().config.scripts = $$('.script-row').map(r => ({ id: r.dataset.id, titulo: $('[name=st]', r).value.trim(), texto: $('[name=sx]', r).value.trim() })).filter(x => x.titulo && x.texto); persist('Mensagens salvas ✓', 'Editou mensagens prontas'); render(); };
    $('#restore-file').onchange = e => {
      const file = e.target.files[0]; if (!file) return; const fr = new FileReader();
      fr.onload = () => { try { const data = JSON.parse(fr.result); if (!data.version || !data.carros || !data.usuarios) throw 0; localStorage.setItem('loja_db_v1', JSON.stringify(data)); toast('Backup restaurado. Recarregando…'); setTimeout(() => location.reload(), 800); } catch (x) { toast('Arquivo de backup inválido.'); } };
      fr.readAsText(file);
    };
  };

  /* =====================================================================
     HOJE NA LOJA · ATIVIDADE · CARROS MAIS PROCURADOS
     ===================================================================== */
  function dashTop() {
    const c = db().config, nome = S.user.nome.split(' ')[0];
    return `<div class="hello"><div><h2>${greet()}, ${esc(nome)}!</h2><p>${cap(D.weekday(today))}, ${D.dateBR(today)}${c.versiculo ? ' · <i>“' + esc(c.versiculo.replace(/[“”"]/g, '')) + '”</i>' : ''}</p></div>${!isVend() ? `<button class="b" data-act="relatorio">${IC.print}Relatório do mês</button>` : ''}<button class="b gold" data-act="agenda-novo">${IC.cal}Agendar</button></div>`;
  }
  function hojeHTML(uid) {
    const ag = (db().agenda || []).filter(a => a.data === today && a.status !== 'cancelado' && (!uid || a.vendedorId === uid)).sort((a, b) => a.hora > b.hora ? 1 : -1);
    const fu = db().leads.filter(l => l.etapa !== 'novo' && ATIVAS.includes(l.etapa) && l.proximoContato && l.proximoContato <= today && (!uid || l.vendedorId === uid)).sort((a, b) => a.proximoContato > b.proximoContato ? 1 : -1);
    const agHTML = ag.map(a => `<div class="li click" data-act="agenda-ver" data-id="${a.id}"><span class="time">${esc(a.hora)}</span><div class="grow"><b>${esc(a.clienteNome)}</b><small>${esc(D.AGENDA_TIPOS[a.tipo] || a.tipo)}${a.carroId && D.getCarro(a.carroId) ? ' · ' + esc(D.carroTitulo(D.getCarro(a.carroId))) : ''}</small></div>${pill(AG_PILL[a.status], AG_STATUS[a.status])}</div>`).join('') || '<div class="empty">Nada agendado para hoje</div>';
    const fuHTML = fu.slice(0, 6).map(l => { const d = D.diffDays(l.proximoContato, today); return `<div class="li click" data-act="lead-ver" data-id="${l.id}"><div class="grow"><b>${esc(l.nome)}</b><small>${esc(l.carroId && D.getCarro(l.carroId) ? D.carroTitulo(D.getCarro(l.carroId)) : etapaLabel(l.etapa))} · ${d > 0 ? `<span class="down">atrasado ${d} dia${d > 1 ? 's' : ''}</span>` : 'hoje'}</small></div><button class="b sm green icon" data-act="lead-wa" data-id="${l.id}" title="Mandar follow-up no WhatsApp">${IC.wa}</button></div>`; }).join('') + (fu.length > 6 ? `<a class="small muted" href="#leads">+ ${fu.length - 6} retornos</a>` : '') || '<div class="empty">Nenhum retorno pendente 👏</div>';
    let third;
    if (isDir()) {
      const apv = db().vendas.filter(v => v.aprovacao === 'pendente');
      const contas = db().lancamentos.filter(l => l.pago === false && l.vencimento <= D.addDays(today, 7)).sort((a, b) => a.vencimento > b.vencimento ? 1 : -1);
      third = `<div class="card"><div class="card-h"><div><h3>Precisa de você</h3><p>Aprovações e contas dos próximos 7 dias</p></div></div>
        ${apv.map(v => { const c = D.getCarro(v.carroId), u = D.getUser(v.vendedorId); return `<div class="alert-li bad" style="cursor:default">${IC.alert}<div class="grow"><b>${esc(D.carroTitulo(c))} por ${brl(v.valor)}</b><small>${esc(u ? u.nome : '')} · mínimo era ${brl(c.precoMinimo)} · lucro ${brl(v.lucro)}</small><div style="display:flex;gap:6px;margin-top:8px"><button class="b sm green" data-act="aprovar" data-id="${v.id}">Aprovar</button><button class="b sm danger" data-act="recusar" data-id="${v.id}">Recusar</button></div></div></div>`; }).join('')}
        ${contas.map(l => `<div class="li"><div class="grow"><b>${esc(l.descricao)}</b><small>${l.vencimento < today ? '<span class="down">venceu ' + D.dateBR(l.vencimento) + '</span>' : 'vence ' + D.dateBR(l.vencimento)}</small></div><b>${brl(l.valor)}</b><button class="b sm" data-act="conta-paga" data-id="${l.id}">Pagar</button></div>`).join('')}
        ${!apv.length && !contas.length ? '<div class="empty">Nada pendente com você ✓</div>' : ''}</div>`;
    } else {
      const novos = db().leads.filter(l => l.etapa === 'novo' && (!uid || l.vendedorId === uid || !l.vendedorId)).sort((a, b) => a.criadoEm > b.criadoEm ? 1 : -1);
      third = `<div class="card"><div class="card-h"><div><h3>Leads novos esperando</h3><p>Quem responde primeiro, vende</p></div></div>${novos.slice(0, 6).map(l => `<div class="li ${leadLate(l) ? 'late-li' : ''}"><div class="grow"><b>${esc(l.nome)}</b><small>${esc(D.origemLabel(l.origem))} · ${D.dateBR(l.criadoEm)} ${D.timeOf(l.criadoEm)}</small></div>${!l.vendedorId ? `<button class="b sm gold" data-act="lead-assumir" data-id="${l.id}">Assumir</button>` : `<button class="b sm" data-act="lead-ver" data-id="${l.id}">Abrir</button>`}</div>`).join('') || '<div class="empty">Nenhum lead novo agora</div>'}</div>`;
    }
    return `<div class="cols c-3 hoje"><div class="card"><div class="card-h"><div><h3>Agenda de hoje</h3><p>${ag.length} compromisso${ag.length === 1 ? '' : 's'}</p></div><a class="b sm" href="#agenda">Agenda</a></div><div class="list">${agHTML}</div></div><div class="card"><div class="card-h"><div><h3>Retornos para hoje</h3><p>Clientes que você combinou de chamar</p></div></div><div class="list">${fuHTML}</div></div>${third}</div>`;
  }
  function extraDashHTML() {
    const st = db().stats || { views: {}, wa: {} };
    const cars = D.vitrine().map(c => ({ c, v: st.views[c.id] || 0, w: st.wa[c.id] || 0, l: db().leads.filter(l => l.carroId === c.id && D.diffDays(l.criadoEm, today) <= 30).length })).sort((a, b) => (b.v + b.w * 5) - (a.v + a.w * 5)).slice(0, 6);
    const ac = db().auditoria.slice(0, 8);
    return `<div class="cols c-1-1"><div class="card"><div class="card-h"><div><h3>Carros mais procurados no site</h3><p>Visualizações, cliques no WhatsApp e leads (30 dias)</p></div><a class="b sm" href="#marketing">Marketing</a></div>
      <div class="list">${cars.map(x => `<div class="li"><img class="thumb" src="${esc(D.carroFoto(x.c))}" alt=""><div class="grow"><b>${esc(D.carroTitulo(x.c))} ${x.c.anoMod}</b><small>${D.num(x.v)} visualizações · ${D.num(x.w)} WhatsApp · ${x.l} leads</small></div><span class="pill no-dot">${D.diasEstoque(x.c)}d</span></div>`).join('') || '<div class="empty">Sem dados ainda</div>'}</div></div>
      <div class="card"><div class="card-h"><div><h3>Atividade da equipe</h3><p>O que aconteceu no sistema</p></div>${isDir() ? '<a class="b sm" href="#config">Histórico</a>' : ''}</div><div class="list">${ac.map(a => { const u = D.getUser(a.userId); return `<div class="li">${av(u, 'sm')}<div class="grow"><b style="font-weight:600">${esc(a.acao)}</b><small>${esc(u ? u.nome : '—')} · ${new Date(a.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div></div>`; }).join('') || '<div class="empty">As ações da equipe vão aparecer aqui (vendas, cadastros, pagamentos…)</div>'}</div></div></div>`;
  }
  function prepMini(c) { const p = D.checklistPct(c); const w = Math.round(p.ok / p.total * 100); return `<span class="mini-prog ${w === 100 ? 'ok' : ''}" title="Checklist: ${p.ok} de ${p.total}"><i style="width:${w}%"></i></span><small class="muted">${p.ok}/${p.total}</small>`; }

  /* ---------- mensagens prontas (scripts de WhatsApp) ---------- */
  const scriptsOpts = () => (db().config.scripts || D.SCRIPTS_PADRAO).map(s => `<option value="${s.id}">${esc(s.titulo)}</option>`).join('');
  function scriptText(id, l) {
    const cfg = db().config, s = (cfg.scripts || D.SCRIPTS_PADRAO).find(x => x.id === id) || D.SCRIPTS_PADRAO[0];
    const c = l && D.getCarro(l.carroId);
    const ag = l && (db().agenda || []).filter(a => a.leadId === l.id && a.data >= today).sort((a, b) => a.data > b.data ? 1 : -1)[0];
    return D.fillTemplate(s.texto, { loja: cfg.loja, nome: l ? String(l.nome || '').split(' ')[0] : '', carro: c ? D.carroTitulo(c) + ' ' + c.anoMod : 'carro', vendedor: S.user.nome.split(' ')[0], endereco: cfg.endereco + ', ' + cfg.cidade, google: cfg.googleReviewUrl || '(link do Google)', quando: ag ? D.weekday(ag.data) + ', ' + D.dateBR(ag.data) + ' às ' + ag.hora : '' });
  }
  const scriptRow = s => `<div class="script-row" data-id="${esc(s.id)}"><input class="in" name="st" value="${esc(s.titulo)}" placeholder="Título"><textarea class="ta" name="sx" placeholder="Texto — use {nome}, {carro}, {vendedor}, {endereco}, {google}, {quando}">${esc(s.texto)}</textarea><button type="button" class="b sm icon danger" data-act="script-del" title="Remover">${IC.trash}</button></div>`;
  function scriptsHTML() {
    return `<form id="scripts-form" class="card" style="margin-bottom:16px"><div class="card-h"><div><h3>Mensagens prontas do WhatsApp</h3><p>A equipe escolhe no lead e envia com um clique. Variáveis: {nome} {carro} {vendedor} {endereco} {google} {quando}</p></div><div style="display:flex;gap:8px"><button type="button" class="b" data-act="script-add">${IC.plus}Nova mensagem</button><button class="b gold" type="submit">Salvar mensagens</button></div></div><div id="scripts-list">${(db().config.scripts || D.SCRIPTS_PADRAO).map(scriptRow).join('')}</div></form>`;
  }

  /* ---------- vendas: cancelar e aprovar ---------- */
  function cancelSale(v) {
    const d = db(), c = D.getCarro(v.carroId);
    d.vendas = d.vendas.filter(x => x.id !== v.id); d.lancamentos = d.lancamentos.filter(l => !(l.ref && l.ref.tipo === 'venda' && l.ref.id === v.id));
    Object.assign(c, { status: 'venda', dataSaida: null, vendaId: null });
    if (v.trocaCarroId) { const t = D.getCarro(v.trocaCarroId); if (t && t.status !== 'vendido') d.carros = d.carros.filter(x => x.id !== t.id); }
    persist('Venda cancelada', 'Cancelou venda de ' + D.carroTitulo(c));
  }
  function aprovarVenda(id, ok) {
    const v = db().vendas.find(x => x.id === id); if (!v) return;
    const c = D.getCarro(v.carroId), u = D.getUser(v.vendedorId);
    if (ok) { v.aprovacao = 'aprovada'; persist('Venda aprovada ✓ — comissão liberada para ' + (u ? u.nome.split(' ')[0] : ''), `Aprovou venda de ${D.carroTitulo(c)} abaixo do mínimo (${brl(v.valor)})`); }
    else { cancelSale(v); D.log(me(), `Recusou venda de ${D.carroTitulo(c)} por ${brl(v.valor)}`); D.save(); toast('Venda recusada. O carro voltou para o estoque.'); }
    render();
  }

  /* ---------- financeiro: contas a pagar ---------- */
  function contasHTML() {
    const cs = db().lancamentos.filter(l => l.pago === false).sort((a, b) => a.vencimento > b.vencimento ? 1 : -1);
    return `<div class="card"><div class="card-h"><div><h3>Contas a pagar</h3><p>${cs.length ? brl(sum(cs, l => l.valor)) + ' em aberto' : 'Tudo pago'}</p></div><button class="b sm" data-act="lanc-novo">${IC.plus}Conta</button></div><div class="list">${cs.slice(0, 8).map(l => `<div class="li"><div class="grow"><b>${esc(l.descricao)}</b><small>${esc(l.categoria)} · ${l.vencimento < today ? '<span class="down">venceu ' + D.dateBR(l.vencimento) + '</span>' : 'vence ' + D.dateBR(l.vencimento)}</small></div><b>${brl(l.valor)}</b><button class="b sm" data-act="conta-paga" data-id="${l.id}">Pagar</button></div>`).join('') || '<div class="empty">Nenhuma conta em aberto ✓</div>'}</div></div>`;
  }

  /* =====================================================================
     AGENDA (visitas, test drives, entregas, avaliações)
     ===================================================================== */
  const weekStart = d => { const dw = D.parse(d).getDay(); return D.addDays(d, dw === 0 ? -6 : 1 - dw); };
  V.agenda = () => {
    const f = S.f.agenda || (S.f.agenda = { ini: weekStart(today), v: '' });
    let items = (db().agenda || []).slice();
    if (isVend()) items = items.filter(a => a.vendedorId === me() || !a.vendedorId);
    else if (f.v) items = items.filter(a => a.vendedorId === f.v);
    const dias = Array.from({ length: 7 }, (_, i) => D.addDays(f.ini, i));
    const semana = items.filter(a => a.data >= dias[0] && a.data <= dias[6] && a.status !== 'cancelado');
    const ult30 = items.filter(a => a.data < today && D.diffDays(a.data, today) <= 30);
    const real = ult30.filter(a => a.status === 'realizado').length, falt = ult30.filter(a => a.status === 'faltou').length;
    return `<div class="kpis">
      ${kpi('Hoje', items.filter(a => a.data === today && a.status !== 'cancelado').length, 'compromissos', 'cal', true)}
      ${kpi('Nesta semana', semana.length, semana.filter(a => a.tipo === 'test-drive').length + ' test drives · ' + semana.filter(a => a.tipo === 'entrega').length + ' entregas', 'clock')}
      ${kpi('Comparecimento', (real + falt ? pct(real, real + falt) : 0) + '%', 'últimos 30 dias · ' + falt + ' não vieram', 'check')}
      ${kpi('Vieram do site', semana.filter(a => a.origem === 'site').length, 'agendados pelo próprio cliente', 'globe')}
    </div>
    <div class="toolbar">
      <div class="month"><button class="b" data-wk="-7" aria-label="Semana anterior">${IC.left}</button><span>${D.dateBR(dias[0]).slice(0, 5)} a ${D.dateBR(dias[6]).slice(0, 5)}</span><button class="b" data-wk="7" aria-label="Próxima semana">${IC.right}</button></div>
      <button class="b" data-wk="0">Hoje</button>
      ${!isVend() ? `<select class="sel" id="ag-v"><option value="">Toda a equipe</option>${vendedores().map(u => `<option value="${u.id}" ${f.v === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select>` : ''}
      <span class="sp"></span><button class="b gold" data-act="agenda-novo">${IC.plus}Novo agendamento</button>
    </div>
    <div class="week">${dias.map(d => { const its = items.filter(a => a.data === d).sort((a, b) => a.hora > b.hora ? 1 : -1); return `<div class="day ${d === today ? 'today' : ''} ${d < today ? 'past' : ''}"><div class="day-h"><span>${cap(D.weekday(d, true))}</span><b>${d.slice(8)}</b></div>${its.map(a => { const u = D.getUser(a.vendedorId), c = D.getCarro(a.carroId); return `<button class="ag-card t-${a.tipo} s-${a.status}" data-act="agenda-ver" data-id="${a.id}"><span class="h">${esc(a.hora)}</span><b>${esc(a.clienteNome)}</b><small>${esc(D.AGENDA_TIPOS[a.tipo] || a.tipo)}${c ? ' · ' + esc(D.carroTitulo(c)) : ''}</small><span class="row">${pill(AG_PILL[a.status], AG_STATUS[a.status])}${u ? av(u, 'sm') : ''}</span></button>`; }).join('') || '<div class="day-empty">—</div>'}</div>`; }).join('')}</div>`;
  };
  AFTER.agenda = () => {
    const f = S.f.agenda;
    $$('[data-wk]').forEach(b => b.onclick = () => { const n = +b.dataset.wk; f.ini = n ? D.addDays(f.ini, n) : weekStart(today); render(); });
    if ($('#ag-v')) $('#ag-v').onchange = e => { f.v = e.target.value; render(); };
  };
  function agendaModal(id, preset = {}) {
    const novo = !id;
    const a = novo ? Object.assign({ tipo: 'visita', data: today, hora: '10:00', clienteNome: '', telefone: '', carroId: '', leadId: null, vendedorId: isVend() ? me() : '', status: 'agendado', obs: '', origem: 'painel' }, preset) : (db().agenda || []).find(x => x.id === id);
    if (!a) return;
    const carros = db().carros.filter(c => c.status !== 'vendido' || c.id === a.carroId);
    modal({
      title: novo ? 'Novo agendamento' : (D.AGENDA_TIPOS[a.tipo] || 'Agendamento') + ' · ' + a.clienteNome,
      body: `<form id="agf"><div class="grid-form">
        <label class="fl c2"><span>Tipo</span><select class="sel" name="tipo">${Object.keys(D.AGENDA_TIPOS).map(k => `<option value="${k}" ${a.tipo === k ? 'selected' : ''}>${D.AGENDA_TIPOS[k]}</option>`).join('')}</select></label>
        <label class="fl"><span>Dia</span><input class="in" type="date" name="data" required value="${esc(a.data)}"></label>
        <label class="fl"><span>Hora</span><input class="in" type="time" name="hora" required value="${esc(a.hora)}"></label>
        <label class="fl c2"><span>Cliente *</span><input class="in" name="clienteNome" required value="${esc(a.clienteNome)}"></label>
        <label class="fl c2"><span>WhatsApp</span><input class="in" name="telefone" value="${esc(a.telefone)}"></label>
        <label class="fl c2"><span>Carro</span><select class="sel" name="carroId"><option value="">—</option>${carros.map(c => `<option value="${c.id}" ${a.carroId === c.id ? 'selected' : ''}>${esc(D.carroNome(c))}</option>`).join('')}</select></label>
        <label class="fl"><span>Responsável</span><select class="sel" name="vendedorId" ${isVend() ? 'disabled' : ''}><option value="">—</option>${vendedores().map(u => `<option value="${u.id}" ${a.vendedorId === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
        <label class="fl"><span>Status</span><select class="sel" name="status">${Object.keys(AG_STATUS).map(k => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${AG_STATUS[k]}</option>`).join('')}</select></label>
        <label class="fl c4"><span>Observação</span><input class="in" name="obs" value="${esc(a.obs)}" placeholder="Ex.: vem com a esposa, quer ver o porta-malas"></label>
      </div>${a.origem === 'site' ? '<p class="small muted" style="margin-top:12px">Agendado pelo próprio cliente no site.</p>' : ''}</form>`,
      left: novo ? '' : `<button class="b danger icon" id="ag-del" title="Excluir">${IC.trash}</button><button class="b green" id="ag-wa">${IC.wa}Confirmar no WhatsApp</button>`,
      ok: novo ? 'Agendar' : 'Salvar',
      mount: el => {
        if (novo) return;
        $('#ag-del', el).onclick = () => confirmBox('Excluir este agendamento?', () => { const d = db(); d.agenda = d.agenda.filter(x => x.id !== a.id); persist('Agendamento excluído'); closeModal(); render(); });
        $('#ag-wa', el).onclick = () => { const cfg = db().config; const s = (cfg.scripts || D.SCRIPTS_PADRAO).find(x => x.id === 's_confirmacao') || D.SCRIPTS_PADRAO[3]; const c = D.getCarro(a.carroId); openWa(a.telefone, D.fillTemplate(s.texto, { nome: a.clienteNome.split(' ')[0], carro: c ? D.carroTitulo(c) : 'carro', vendedor: S.user.nome.split(' ')[0], endereco: cfg.endereco + ', ' + cfg.cidade, quando: D.weekday(a.data) + ', ' + D.dateBR(a.data) + ' às ' + a.hora, google: cfg.googleReviewUrl }), a.demo); if (a.status === 'agendado') { a.status = 'confirmado'; persist(); render(); } };
      },
      onOk: el => {
        const f = $('#agf', el); if (!f.reportValidity()) return false;
        Object.assign(a, { tipo: f.tipo.value, data: f.data.value, hora: f.hora.value, clienteNome: f.clienteNome.value.trim(), telefone: f.telefone.value.trim(), carroId: f.carroId.value || null, vendedorId: isVend() ? me() : (f.vendedorId.value || null), status: f.status.value, obs: f.obs.value.trim() });
        const d = db(); if (!d.agenda) d.agenda = [];
        if (novo) { a.id = D.uid('ag'); d.agenda.push(a); }
        if (a.leadId) { const l = d.leads.find(x => x.id === a.leadId); if (l && ATIVAS.includes(l.etapa) && l.etapa !== 'visita') leadMove(l, 'visita'); if (l && novo) l.historico.push({ data: D.nowISO(), texto: (D.AGENDA_TIPOS[a.tipo] || 'Agendamento') + ' marcado para ' + D.dateBR(a.data) + ' às ' + a.hora, autor: S.user.nome }); }
        persist(novo ? 'Agendado ✓' : 'Agendamento salvo ✓', (novo ? 'Agendou ' : 'Atualizou agenda de ') + a.clienteNome + ' (' + D.dateBR(a.data) + ' ' + a.hora + ')');
        if (novo && S.view === 'agenda') S.f.agenda.ini = weekStart(a.data);
        render();
      }
    });
  }

  /* =====================================================================
     SITE E MARKETING
     ===================================================================== */
  V.marketing = () => {
    const st = db().stats || { dias: {}, views: {}, wa: {} };
    const dias = Array.from({ length: 14 }, (_, i) => D.addDays(today, i - 13));
    const vis = dias.map(d => (st.dias[d] || {}).visitas || 0), wa = dias.map(d => (st.dias[d] || {}).wa || 0);
    const leadsSite = db().leads.filter(l => String(l.origem).indexOf('site') === 0 && D.diffDays(l.criadoEm, today) < 14);
    const tv = sum(vis, x => x), tw = sum(wa, x => x);
    const camp = {};
    db().leads.filter(l => D.diffDays(l.criadoEm, today) <= 30).forEach(l => { const k = l.utm ? [l.utm.source, l.utm.campaign].filter(Boolean).join(' · ') : (String(l.origem).indexOf('site') === 0 ? 'Site (direto)' : D.origemLabel(l.origem)); camp[k] = camp[k] || { n: 0, v: 0 }; camp[k].n++; if (l.etapa === 'vendido') camp[k].v++; });
    const cars = D.vitrine().map(c => ({ c, v: st.views[c.id] || 0, w: st.wa[c.id] || 0, l: db().leads.filter(l => l.carroId === c.id).length })).sort((a, b) => b.v - a.v);
    const ent = db().entregas || [], dep = db().depoimentos || [];
    return `<div class="kpis">
      ${kpi('Visitas no site', D.num(tv), 'últimos 14 dias', 'globe', true)}
      ${kpi('Cliques no WhatsApp', D.num(tw), pct(tw, tv || 1) + '% das visitas', 'wa')}
      ${kpi('Leads do site', leadsSite.length, 'formulários, agendamentos e WhatsApp', 'funnel')}
      ${kpi('Conversão', (tv ? (leadsSite.length / tv * 100).toFixed(1).replace('.', ',') : 0) + '%', 'visita → lead', 'trend')}
    </div>
    <div class="cols c-2-1">
      <div class="card"><div class="card-h"><div><h3>Visitas e cliques no WhatsApp</h3><p>Por dia, últimos 14 dias</p></div></div>${bars(dias.map(d => d.slice(8) + '/' + d.slice(5, 7)), [{ name: 'Visitas', color: '#D40000', values: vis }, { name: 'Cliques no WhatsApp', color: '#4ADE80', values: wa }], { h: 230, fmt: v => Math.round(v) })}</div>
      <div class="card"><div class="card-h"><div><h3>De onde vêm os leads</h3><p>Campanhas e canais · 30 dias</p></div></div><div class="list">${Object.keys(camp).sort((a, b) => camp[b].n - camp[a].n).map(k => `<div class="li"><div class="grow"><b>${esc(k)}</b><small>${camp[k].v} venda(s)</small></div><b>${camp[k].n}</b></div>`).join('') || '<div class="empty">Sem leads ainda</div>'}</div>
      <p class="small muted" style="margin-top:12px">Use links com <b>?utm_source=instagram&utm_campaign=nome</b> nos anúncios para saber qual campanha vende mais.</p></div>
    </div>
    <div class="tw" style="margin-bottom:16px"><table class="t"><thead><tr><th>Carro no site</th><th class="num">Visualizações</th><th class="num">Cliques WhatsApp</th><th class="num">Leads</th><th class="num">Dias no estoque</th><th></th></tr></thead><tbody>
      ${cars.map(x => `<tr><td><div class="car-cell"><img class="thumb" src="${esc(D.carroFoto(x.c))}" alt=""><div><b>${esc(D.carroTitulo(x.c))}</b><small>${brl(x.c.preco)}</small></div></div></td><td class="num">${D.num(x.v)}</td><td class="num">${D.num(x.w)}</td><td class="num">${x.l}</td><td class="num ${D.diasEstoque(x.c) > 60 ? 'down' : ''}">${D.diasEstoque(x.c)}</td><td style="text-align:right"><button class="b sm" data-act="carro-acoes" data-id="${x.c.id}">${IC.image}Divulgar</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Nenhum carro publicado</div></td></tr>'}
    </tbody></table></div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><div><h3>Galeria de entregas (home do site)</h3><p>Fotos dos clientes com o carro e o laço. Peça autorização antes de publicar.</p></div><button class="b gold" data-act="entrega-add">${IC.plus}Adicionar foto</button></div>
      <div class="ent-grid">${ent.map(e => `<div class="ent ${e.publicado ? '' : 'off'}"><img src="${esc(e.foto)}" alt=""><div><b>${esc(e.legenda)}</b><small>${D.dateBR(e.data)}</small></div><div class="acts"><label class="switch" title="Mostrar no site"><input type="checkbox" data-act="entrega-pub" data-id="${e.id}" ${e.publicado ? 'checked' : ''}><i></i></label><button class="b sm icon danger" data-act="entrega-del" data-id="${e.id}" title="Remover">${IC.trash}</button></div></div>`).join('') || '<div class="empty">Nenhuma foto ainda</div>'}</div></div>
    <div class="card"><div class="card-h"><div><h3>Depoimentos de clientes</h3><p>Só aparecem no site quando houver pelo menos um publicado. Use apenas depoimentos reais, com autorização.</p></div><button class="b gold" data-act="dep-novo">${IC.plus}Novo depoimento</button></div>
      <div class="list">${dep.map(x => `<div class="li"><div class="grow"><b>${esc(x.nome)}${x.carro ? ' · ' + esc(x.carro) : ''}</b><small>“${esc(x.texto.slice(0, 120))}${x.texto.length > 120 ? '…' : ''}”</small></div><label class="switch" title="Publicar"><input type="checkbox" data-act="dep-pub" data-id="${x.id}" ${x.publicado ? 'checked' : ''}><i></i></label><button class="b sm icon" data-act="dep-edit" data-id="${x.id}">${IC.edit}</button><button class="b sm icon danger" data-act="dep-del" data-id="${x.id}">${IC.trash}</button></div>`).join('') || '<div class="empty">Nenhum depoimento cadastrado. Dica: depois de cada entrega, mande a mensagem “Pedir avaliação no Google” e copie aqui os melhores comentários.</div>'}</div></div>`;
  };
  function entregaModal() {
    let foto = '';
    modal({
      title: 'Nova foto de entrega', size: 'sm',
      body: `<form id="enf"><div class="photo-add" id="en-add" style="aspect-ratio:4/3">${IC.camera}Escolher foto</div><input type="file" id="en-file" accept="image/*" hidden><label class="fl" style="margin-top:12px"><span>Legenda *</span><input class="in" name="legenda" required placeholder="Ex.: Família Souza com o Nivus 2025"></label></form>`,
      ok: 'Publicar no site',
      mount: el => { $('#en-add', el).onclick = () => $('#en-file', el).click(); $('#en-file', el).onchange = async e => { const f = e.target.files[0]; if (!f) return; foto = await compress(f); $('#en-add', el).innerHTML = `<img src="${foto}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`; }; },
      onOk: el => { const f = $('#enf', el); if (!f.reportValidity()) return false; if (!foto) { toast('Escolha a foto.'); return false; } const d = db(); if (!d.entregas) d.entregas = []; d.entregas.unshift({ id: D.uid('e'), foto, legenda: f.legenda.value.trim(), data: today, publicado: true }); if (!persist('Foto publicada na home ✓', 'Publicou foto de entrega')) return false; render(); }
    });
  }
  function depModal(id) {
    const novo = !id; const x = novo ? { nome: '', carro: '', texto: '', foto: '', publicado: true } : db().depoimentos.find(y => y.id === id);
    let foto = x.foto;
    modal({
      title: novo ? 'Novo depoimento' : 'Editar depoimento',
      body: `<form id="dpf"><div class="grid-form"><label class="fl c2"><span>Nome do cliente *</span><input class="in" name="nome" required value="${esc(x.nome)}"></label><label class="fl c2"><span>Carro que comprou</span><input class="in" name="carro" value="${esc(x.carro)}" placeholder="Ex.: Nivus 2025"></label><label class="fl c4"><span>Depoimento *</span><textarea class="ta" name="texto" required>${esc(x.texto)}</textarea></label><label class="check c4"><input type="checkbox" name="publicado" ${x.publicado ? 'checked' : ''}>Publicar no site</label><label class="check c4"><input type="checkbox" name="autorizado" required ${novo ? '' : 'checked'}>O cliente autorizou usar o nome e o depoimento no site</label></div><div style="display:flex;gap:10px;align-items:center;margin-top:12px"><button type="button" class="b" id="dp-ph">${IC.camera}${foto ? 'Trocar foto' : 'Foto (opcional)'}</button><input type="file" id="dp-file" accept="image/*" hidden>${foto ? `<img src="${esc(foto)}" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover">` : ''}</div></form>`,
      ok: 'Salvar',
      mount: el => { $('#dp-ph', el).onclick = () => $('#dp-file', el).click(); $('#dp-file', el).onchange = async e => { const f = e.target.files[0]; if (f) { foto = await compress(f); toast('Foto pronta ✓'); } }; },
      onOk: el => { const f = $('#dpf', el); if (!f.reportValidity()) return false; Object.assign(x, { nome: f.nome.value.trim(), carro: f.carro.value.trim(), texto: f.texto.value.trim(), publicado: f.publicado.checked, foto }); const d = db(); if (!d.depoimentos) d.depoimentos = []; if (novo) { x.id = D.uid('dp'); x.data = today; d.depoimentos.unshift(x); } persist('Depoimento salvo ✓', 'Salvou depoimento de ' + x.nome); render(); }
    });
  }

  /* =====================================================================
     AÇÕES DO CARRO: proposta, arte para Instagram, link, checklist
     ===================================================================== */
  function carActions(id) {
    const c = D.getCarro(id); if (!c) return;
    const url = new URL('carro.html?id=' + encodeURIComponent(c.id), location.href).href;
    const p = D.checklistPct(c);
    modal({
      title: D.carroNome(c), size: 'sm',
      body: `<label class="fl" style="margin-bottom:14px"><span>Nome do cliente (para a proposta, opcional)</span><input class="in" id="ac-cli" placeholder="Ex.: Mariana"></label><div class="act-grid">
        <button class="act" id="ac-prop">${IC.print}<b>Gerar proposta</b><small>PDF bonito pro cliente, com parcelas</small></button>
        <button class="act" id="ac-art">${IC.image}<b>Arte p/ Instagram</b><small>Feed e story prontos pra postar</small></button>
        <button class="act" id="ac-link">${IC.link}<b>Copiar link</b><small>Mandar a página do carro</small></button>
        <button class="act" id="ac-port">${IC.globe}<b>Texto p/ portais</b><small>${portaisN(c) ? 'No ar em: ' + esc(D.portaisAtivos(c).map(p => p[1]).join(', ')) : 'OLX, Webmotors, iCarros…'}</small></button>
        <a class="act" href="${esc(url)}" target="_blank" rel="noopener">${IC.eye}<b>Ver no site</b><small>Como o cliente vê</small></a>
      </div>
      ${!isVend() ? `<div class="sec-t">Checklist de preparação · ${p.ok}/${p.total}</div><div class="checks">${D.CHECKLIST.map(k => `<label class="check"><input type="checkbox" data-ck="${k[0]}" ${c.checklist && c.checklist[k[0]] ? 'checked' : ''}>${k[1]}</label>`).join('')}</div>` : ''}`,
      ok: 'Fechar', okOnly: true,
      mount: el => {
        $('#ac-prop', el).onclick = () => { const n = $('#ac-cli', el).value.trim(); printProposta(c, n); };
        $('#ac-art', el).onclick = () => { closeModal(); instaArt(c); };
        $('#ac-port', el).onclick = () => copiar(anuncioTexto(c), 'Texto do anúncio copiado ✓ Cole no portal');
        $('#ac-link', el).onclick = () => { const fb = () => { const i = $('#ac-cli', el); i.value = url; i.select(); toast('Link no campo acima: copie com Ctrl+C'); }; if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copiado ✓'), fb); else fb(); };
        $$('[data-ck]', el).forEach(i => i.onchange = () => { c.checklist = c.checklist || {}; c.checklist[i.dataset.ck] = i.checked; persist(null, `Checklist ${D.carroTitulo(c)}: ${i.parentElement.textContent.trim()} ${i.checked ? '✓' : '✗'}`); render(); });
      }
    });
  }

  /* ---------- documentos para imprimir / salvar em PDF ---------- */
  const PRINT_CSS = `@font-face{font-family:Saira;src:url(assets/fonts/saira-latin-800-normal.woff2)}@font-face{font-family:Manrope;src:url(assets/fonts/manrope-latin-500-normal.woff2)}@font-face{font-family:Manrope;font-weight:800;src:url(assets/fonts/manrope-latin-800-normal.woff2)}
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:12.5px/1.5 Manrope,Arial,sans-serif;color:#1b1b1b;margin:0;padding:24px;background:#fff}
  .top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #D40000;padding-bottom:14px;margin-bottom:20px}.top img{height:60px}.top .r{text-align:right;font-size:11px;color:#555}
  h1{font-family:Saira,Arial,sans-serif;font-weight:600;font-size:24px;margin:0 0 4px}h2{font-family:Saira,Arial,sans-serif;font-weight:600;font-size:16px;margin:22px 0 10px;color:#A80000;border-bottom:1px solid #F0D4D2;padding-bottom:6px}
  .muted{color:#666}.grid{display:grid;grid-template-columns:1.1fr 1fr;gap:20px;align-items:start}.photo{width:100%;border-radius:10px;aspect-ratio:4/3;object-fit:cover}
  table{width:100%;border-collapse:collapse}td,th{padding:7px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}th{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#A80000}.num{text-align:right;white-space:nowrap}
  .price{font-size:30px;font-weight:800;margin:6px 0}.gold{color:#B80000}.box{border:1px solid #F0D4D2;border-radius:10px;padding:14px;background:#FBF5F5}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.kpis div{border:1px solid #F0D4D2;border-radius:10px;padding:10px;background:#FBF5F5}.kpis small{display:block;color:#666;font-size:10.5px}.kpis b{font-size:17px}
  .sign{font-family:Saira,Arial,sans-serif;font-style:italic;font-weight:800;font-size:26px;color:#A80000;line-height:1}.lines{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px}.lines div{border-top:1px solid #333;padding-top:6px;text-align:center;font-size:11px}
  .note{font-size:10.5px;color:#777;margin-top:22px;border-top:1px solid #eee;padding-top:10px}.quote{font-family:Saira,Arial,sans-serif;font-size:14px;line-height:1.5;border-left:3px solid #D40000;padding:6px 12px;margin:12px 0}
  @media print{body{padding:0}}`;
  function docModal(title, inner) {
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><base href="${esc(location.href.split('#')[0].split('?')[0])}"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${inner}</body></html>`;
    modal({
      title, size: 'lg', ok: 'Imprimir / salvar PDF',
      body: `<iframe class="doc-frame" title="${esc(title)}"></iframe><p class="small muted" style="margin-top:10px">Na janela de impressão escolha “Salvar como PDF” para mandar pelo WhatsApp.</p>`,
      mount: el => { const fr = $('.doc-frame', el); fr.srcdoc = html; el._fr = fr; },
      onOk: el => { try { el._fr.contentWindow.focus(); el._fr.contentWindow.print(); } catch (e) { toast('Seu navegador bloqueou a impressão aqui. Abra o painel numa aba própria.'); } return false; }
    });
  }
  const docTop = (sub) => { const cfg = db().config; return `<div class="top"><img src="${esc(cfg.logoEscuro)}" alt="${esc(cfg.loja)}"><div class="r"><b>${esc(cfg.loja)}</b><br>${esc(cfg.endereco)} · ${esc(cfg.cidade)}<br>WhatsApp ${esc(cfg.whatsappExibicao)} · ${esc(cfg.telefone)}<br>@${esc(cfg.instagram)}${cfg.cnpj ? '<br>CNPJ ' + esc(cfg.cnpj) : ''}${sub ? '<br>' + sub : ''}</div></div>`; };
  function printProposta(c, cliente) {
    const cfg = db().config, u = S.user;
    const linhas = [0, 0.2].map(pe => { const ent = Math.round(c.preco * pe / 100) * 100; return `<tr><td>${ent ? 'Entrada de ' + brl(ent) : '<b>Sem entrada</b>'}</td>${[24, 36, 48, 60].map(m => `<td class="num">${m}x ${brl(D.parcela(c.preco, ent, m), true)}</td>`).join('')}</tr>`; }).join('');
    const ficha = [['Ano', c.anoFab + '/' + c.anoMod], ['Quilometragem', D.km(c.km)], ['Câmbio', c.cambio], ['Combustível', c.combustivel], ['Cor', c.cor], ['Carroceria', c.carroceria]];
    docModal('Proposta · ' + D.carroTitulo(c), `${docTop('Proposta emitida em ' + D.dateBR(today))}
      <h1>Proposta${cliente ? ' para ' + esc(cliente) : ''}</h1><div class="muted">Válida por 3 dias, até ${D.dateBR(D.addDays(today, 3))} · sujeita à disponibilidade do veículo</div>
      <div class="grid" style="margin-top:18px"><img class="photo" src="${esc(D.carroFoto(c))}" alt=""><div><h1 style="font-size:22px">${esc(D.carroTitulo(c))}</h1><div class="muted">${esc(c.versao)}</div>
      ${D.emOferta(c) ? `<div class="muted" style="text-decoration:line-through;margin-top:10px">de ${brl(c.precoAnterior)}</div>` : ''}<div class="price gold">${brl(c.preco)}</div>
      <table>${ficha.map(f => `<tr><td class="muted">${f[0]}</td><td><b>${esc(f[1])}</b></td></tr>`).join('')}</table></div></div>
      ${c.comentarioLoja ? `<div class="quote">“${esc(c.comentarioLoja)}”<div class="sign">${esc(cfg.dono || cfg.marcaCurta)}</div></div>` : ''}
      <h2>Condições de pagamento simuladas</h2><table><tr><th>Entrada</th><th class="num">24x</th><th class="num">36x</th><th class="num">48x</th><th class="num">60x</th></tr>${linhas}</table>
      <p class="muted" style="margin-top:8px">Taxa simulada de ${String(cfg.taxaJuros).replace('.', ',')}% a.m. Aceitamos seu usado na troca: o valor da avaliação abate do saldo.</p>
      ${c.opcionais && c.opcionais.length ? `<h2>Opcionais</h2><div>${c.opcionais.map(esc).join(' · ')}</div>` : ''}
      <h2>Seu atendimento</h2><div class="box"><b>${esc(u.nome)}</b> · ${esc(u.telefone || cfg.whatsappExibicao)}<br>Venha fazer o seu test drive. Será uma alegria te receber!</div>
      <div class="note">*Parcelas simuladas, sujeitas à análise e aprovação de crédito pela instituição financeira. Valores podem mudar sem aviso prévio. Esta proposta não constitui reserva do veículo.</div>`);
  }
  function printRecibo(v) {
    const c = D.getCarro(v.carroId), cl = D.getCliente(v.clienteId) || {}, u = D.getUser(v.vendedorId) || {};
    docModal('Ficha de venda · ' + D.carroTitulo(c), `${docTop('Ficha nº ' + esc(v.id.slice(-6).toUpperCase()))}
      <h1>Ficha de venda / recibo</h1><div class="muted">Data da venda: ${D.dateBR(v.data)} · Vendedor(a): ${esc(u.nome || '')}</div>
      <h2>Comprador</h2><table><tr><td class="muted">Nome</td><td><b>${esc(cl.nome || '')}</b></td></tr><tr><td class="muted">Telefone</td><td>${esc(cl.telefone || '')}</td></tr><tr><td class="muted">E-mail</td><td>${esc(cl.email || '')}</td></tr></table>
      <h2>Veículo</h2><table><tr><td class="muted">Veículo</td><td><b>${esc(D.carroNome(c))}</b></td></tr><tr><td class="muted">Cor / KM</td><td>${esc(c.cor)} · ${D.km(c.km)}</td></tr>${c.placa ? `<tr><td class="muted">Placa</td><td>${esc(c.placa)}</td></tr>` : ''}</table>
      <h2>Pagamento</h2><table><tr><td class="muted">Valor total</td><td class="num"><b>${brl(v.valor, true)}</b></td></tr><tr><td class="muted">Forma</td><td class="num">${esc(PAG[v.formaPagamento] || v.formaPagamento)}${v.banco ? ' · ' + esc(v.banco) : ''}</td></tr><tr><td class="muted">Entrada</td><td class="num">${brl(v.entrada, true)}</td></tr>${v.trocaValor ? `<tr><td class="muted">Veículo na troca</td><td class="num">${esc(v.trocaDescricao)} · ${brl(v.trocaValor, true)}</td></tr>` : ''}${v.valorFinanciado ? `<tr><td class="muted">Valor financiado</td><td class="num">${brl(v.valorFinanciado, true)}</td></tr>` : ''}</table>
      ${v.obs ? `<h2>Observações</h2><div>${esc(v.obs)}</div>` : ''}
      <div class="lines"><div>Comprador</div><div>${esc(db().config.loja)}</div></div>
      <div class="note">Documento interno de registro da venda. Não substitui o contrato de compra e venda nem a documentação oficial de transferência do veículo.</div>`);
  }
  function printRelatorio(mk) {
    const vs = vendasDo(mk).filter(v => v.aprovacao !== 'pendente'), L = lancDo(mk).filter(l => l.pago !== false);
    const fat = sum(vs, v => v.valor), luc = sum(vs, v => v.lucro), com = sum(vs, v => v.comissao);
    const desp = sum(L.filter(l => l.tipo === 'saida' && !['Compra de veículo', 'Preparação de veículo', 'Comissões'].includes(l.categoria)), l => l.valor);
    const rank = vendedores(true).map(u => ({ u, vs: vs.filter(v => v.vendedorId === u.id) })).filter(r => r.vs.length).sort((a, b) => b.vs.length - a.vs.length);
    const cats = {}; L.filter(l => l.tipo === 'saida').forEach(l => cats[l.categoria] = (cats[l.categoria] || 0) + l.valor);
    const est = db().carros.filter(c => c.status === 'venda' || c.status === 'reservado');
    docModal('Relatório · ' + D.monthLabel(mk), `${docTop('Relatório gerado em ' + D.dateBR(today))}
      <h1>Relatório de ${D.monthLabel(mk)}</h1><div class="muted">Resumo da loja para a diretoria</div>
      <div class="kpis" style="margin-top:16px"><div><small>Carros vendidos</small><b>${vs.length}</b></div><div><small>Faturamento</small><b>${brl(fat)}</b></div>${money() ? `<div><small>Lucro bruto</small><b>${brl(luc)}</b></div><div><small>Resultado</small><b>${brl(luc - com - desp)}</b></div>` : `<div><small>Ticket médio</small><b>${brl(vs.length ? fat / vs.length : 0)}</b></div><div><small>Estoque à venda</small><b>${est.length}</b></div>`}</div>
      <h2>Vendas por vendedor</h2><table><tr><th>Vendedor</th><th class="num">Carros</th><th class="num">Meta</th><th class="num">Vendido</th><th class="num">Comissão</th></tr>${rank.map(r => `<tr><td>${esc(r.u.nome)}</td><td class="num">${r.vs.length}</td><td class="num">${r.u.meta}</td><td class="num">${brl(sum(r.vs, v => v.valor))}</td><td class="num">${brl(sum(r.vs, v => v.comissao))}</td></tr>`).join('')}</table>
      ${money() ? `<h2>Resultado</h2><table><tr><td>Faturamento</td><td class="num">${brl(fat)}</td></tr><tr><td>Lucro bruto dos carros</td><td class="num">${brl(luc)}</td></tr><tr><td>(−) Comissões</td><td class="num">${brl(com)}</td></tr><tr><td>(−) Despesas fixas e operacionais pagas</td><td class="num">${brl(desp)}</td></tr><tr><td><b>Resultado</b></td><td class="num"><b>${brl(luc - com - desp)}</b></td></tr></table>
      <h2>Saídas por categoria</h2><table>${Object.keys(cats).sort((a, b) => cats[b] - cats[a]).map(k => `<tr><td>${esc(k)}</td><td class="num">${brl(cats[k])}</td></tr>`).join('')}</table>` : ''}
      <h2>Carros vendidos</h2><table><tr><th>Data</th><th>Carro</th><th>Vendedor</th><th class="num">Valor</th>${money() ? '<th class="num">Lucro</th>' : ''}</tr>${vs.slice().sort((a, b) => a.data > b.data ? 1 : -1).map(v => { const c = D.getCarro(v.carroId); return `<tr><td>${D.dateBR(v.data)}</td><td>${esc(D.carroTitulo(c))} ${c.anoMod}</td><td>${esc((D.getUser(v.vendedorId) || {}).nome || '')}</td><td class="num">${brl(v.valor)}</td>${money() ? `<td class="num">${brl(v.lucro)}</td>` : ''}</tr>`; }).join('')}</table>
      <h2>Estoque hoje</h2><div>${est.length} carros à venda · ${kbrl(sum(est, c => c.preco))} em preço anunciado · ${est.filter(c => D.diasEstoque(c) > 60).length} parados há mais de 60 dias</div>`);
  }

  /* ---------- arte para Instagram (canvas) ---------- */
  function loadImg(src, cors) { return new Promise(ok => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }
  async function drawArt(cv, c, fmt) {
    const W = 1080, H = fmt === 'story' ? 1920 : 1350; cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), cfg = db().config;
    try { await Promise.all(['italic 800 80px Saira', '800 80px Saira', '800 80px Manrope', '600 40px Manrope'].map(f => document.fonts.load(f))); } catch (e) { /* ok */ }
    x.fillStyle = '#0B0B0C'; x.fillRect(0, 0, W, H);
    const src = D.carroFoto(c), ext = /^https?:/.test(src) && !src.startsWith(location.origin);
    const ph = (await loadImg(src, ext)) || (ext ? await loadImg(D.placeholderFor(c)) : null);
    const pH = Math.round(H * (fmt === 'story' ? 0.56 : 0.5));
    if (ph) { const r = Math.max(W / ph.width, pH / ph.height); const w = ph.width * r, h = ph.height * r; x.save(); x.beginPath(); x.rect(0, 0, W, pH); x.clip(); x.drawImage(ph, (W - w) / 2, (pH - h) / 2, w, h); x.restore(); }
    let g = x.createLinearGradient(0, pH * 0.45, 0, pH); g.addColorStop(0, 'rgba(11,11,12,0)'); g.addColorStop(1, 'rgba(11,11,12,1)'); x.fillStyle = g; x.fillRect(0, 0, W, pH + 2);
    g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(11,11,12,.88)'); g.addColorStop(1, 'rgba(11,11,12,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 300);
    const logo = await loadImg(db().config.logoRodape || db().config.logo); if (logo) x.drawImage(logo, 50, 36, 300, 300 * logo.height / logo.width);
    const tag = D.emOferta(c) ? 'BAIXOU ' + brl(c.precoAnterior - c.preco) : D.diasEstoque(c) <= 7 ? 'CHEGOU AGORA' : 'ESCOLHA DA ' + String(db().config.marcaCurta || 'LOJA').toUpperCase();
    x.font = '800 30px Manrope'; const tw = x.measureText(tag).width + 48;
    x.fillStyle = D.emOferta(c) ? '#FFC21A' : '#D40000'; roundRect(x, W - tw - 50, 60, tw, 58, 29); x.fill();
    x.fillStyle = D.emOferta(c) ? '#141416' : '#fff'; x.textAlign = 'center'; x.fillText(tag, W - 50 - tw / 2, 100); x.textAlign = 'left';
    let y = pH + (fmt === 'story' ? 40 : 0);
    const gold = x.createLinearGradient(0, y, 0, y + 260); gold.addColorStop(0, '#FF5A50'); gold.addColorStop(.5, '#E10600'); gold.addColorStop(1, '#D40000');
    x.fillStyle = '#F4EFE6'; x.font = 'italic 800 84px Saira'; x.fillText(fitText(x, D.carroTitulo(c), W - 120), 60, y + 70);
    x.fillStyle = '#A7A196'; x.font = '600 36px Manrope'; x.fillText(fitText(x, c.versao + ' · ' + c.anoFab + '/' + c.anoMod + ' · ' + D.km(c.km), W - 120), 60, y + 128);
    if (D.emOferta(c)) { x.fillStyle = '#77736B'; x.font = '600 34px Manrope'; const t = 'de ' + brl(c.precoAnterior); x.fillText(t, 60, y + 196); const m = x.measureText(t).width; x.fillRect(60, y + 184, m, 3); y += 40; }
    x.fillStyle = gold; x.font = '800 112px Manrope'; x.fillText(brl(c.preco), 56, y + 290);
    x.fillStyle = '#FF5A50'; x.font = '600 38px Manrope'; x.fillText('ou 60x de ' + brl(D.parcela(c.preco, 0, 60)) + '*', 60, y + 350);
    const by = H - (fmt === 'story' ? 300 : 190);
    x.strokeStyle = 'rgba(227,32,27,.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(60, by); x.lineTo(W - 60, by); x.stroke();
    x.fillStyle = '#F4EFE6'; x.font = 'italic 800 50px Saira'; x.fillText(fitText(x, cfg.slogan, W - 120), 60, by + 72);
    x.fillStyle = '#A7A196'; x.font = '600 30px Manrope'; x.fillText('WhatsApp ' + cfg.whatsappExibicao + '  ·  @' + cfg.instagram, 60, by + 124);
    x.font = '500 22px Manrope'; x.fillStyle = '#77736B'; x.fillText('*Sujeito à aprovação de crédito. ' + cfg.endereco + ', ' + cfg.cidade, 60, by + 160);
  }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function fitText(x, t, max) { while (x.measureText(t).width > max && t.length > 4) t = t.slice(0, -2) + '…'; return t; }
  function instaArt(c) {
    let fmt = 'feed';
    modal({
      title: 'Arte para Instagram · ' + D.carroTitulo(c),
      body: `<div class="tabs" id="art-fmt" style="margin-bottom:14px"><button class="on" data-f="feed">Feed 4:5</button><button data-f="story">Story 9:16</button></div><div class="art-wrap"><canvas id="art"></canvas></div><p class="small muted" style="margin-top:10px">No celular: toque e segure na imagem para salvar. Legenda sugerida: “${esc(D.carroNome(c))} por ${brl(c.preco)} ou em até 60x*. Chama no direct ou no WhatsApp! 🚗✨”</p>`,
      ok: 'Baixar imagem',
      mount: el => {
        const cv = $('#art', el); drawArt(cv, c, fmt);
        $$('#art-fmt button', el).forEach(b => b.onclick = () => { fmt = b.dataset.f; $$('#art-fmt button', el).forEach(x => x.classList.toggle('on', x === b)); drawArt(cv, c, fmt); });
        el._cv = cv;
      },
      onOk: el => { el._cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = D.slug(D.carroNome(c)) + '-' + fmt + '.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png'); D.log(me(), 'Gerou arte de Instagram: ' + D.carroTitulo(c)); D.save(); return false; }
    });
  }


  /* =====================================================================
     IMPORTAR ESTOQUE POR PLANILHA (Excel .xlsx ou .csv)
     ===================================================================== */
  const COLS_MODELO = ['Marca', 'Modelo', 'Versão', 'Ano', 'KM', 'Preço', 'Cor', 'Câmbio', 'Combustível', 'Carroceria', 'Valor de compra', 'FIPE', 'Placa', 'Opcionais', 'Descrição', 'Status', 'Destaque', 'Fotos'];
  const EX_MODELO = ['Volkswagen', 'Polo', 'Highline 200 TSI', '2022/2023', '28000', '94900', 'Branco', 'Automático', 'Flex', 'Hatch', '82000', '96500', 'ABC1D23', 'Central multimídia; Câmera de ré; Rodas de liga leve', 'Único dono, revisado.', 'À venda', 'Sim', 'https://link-da-foto-1.jpg; https://link-da-foto-2.jpg'];
  const norm = s => D.slug(String(s == null ? '' : s)).replace(/-/g, '');
  const ALIAS = {
    marca: ['marca', 'fabricante', 'montadora'], modelo: ['modelo', 'carro', 'veiculo'], versao: ['versao', 'versão', 'motor'],
    ano: ['ano', 'anofabmod', 'anofabricacaomodelo', 'anomodelo'], anoFab: ['anofab', 'anofabricacao'], km: ['km', 'quilometragem', 'kilometragem', 'kms'],
    preco: ['preco', 'preço', 'valor', 'precovenda', 'valorvenda', 'precodevenda', 'valordevenda'], cor: ['cor'], cambio: ['cambio', 'câmbio', 'transmissao'],
    combustivel: ['combustivel', 'combustível'], carroceria: ['carroceria', 'tipo', 'categoria'], precoCompra: ['valordecompra', 'compra', 'precocompra', 'precodecompra', 'custo', 'valorcompra'],
    fipe: ['fipe', 'tabelafipe'], placa: ['placa'], opcionais: ['opcionais', 'itens', 'acessorios'], descricao: ['descricao', 'descrição', 'obs', 'observacao'],
    status: ['status', 'situacao'], destaque: ['destaque'], fotos: ['fotos', 'foto', 'imagens', 'imagem', 'links']
  };
  function colKey(h) { const n = norm(h); for (const k in ALIAS) if (ALIAS[k].map(norm).includes(n)) return k; return null; }
  function toNum(v) {
    if (typeof v === 'number') return v;
    let s = String(v || '').replace(/[^\d,.-]/g, ''); if (!s) return 0;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return Math.round(parseFloat(s) || 0);
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '', sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; continue; }
      if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(c => String(c).trim()));
  }
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    const add = (src, next) => { const s = document.createElement('script'); s.src = src; s.onload = () => window.XLSX ? next(null) : next(1); s.onerror = () => next(1); document.head.appendChild(s); };
    return new Promise((ok, no) => add('assets/js/vendor/xlsx.full.min.js', e => e ? add('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', e2 => e2 ? no(new Error('xlsx')) : ok(window.XLSX)) : ok(window.XLSX)));
  }
  async function readSheet(file) {
    if (/\.csv$|\.txt$/i.test(file.name)) return parseCSV(await file.text());
    const X = await loadXLSX(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });
  }
  const STATUS_MAP = s => { const n = norm(s); if (!n) return null; if (n.includes('prep')) return 'preparacao'; if (n.includes('reserv')) return 'reservado'; if (n.includes('vend') && !n.includes('avenda') && n !== 'venda') return 'vendido'; return 'venda'; };
  const SIM = s => /^(s|sim|x|1|true|yes)$/i.test(String(s || '').trim());
  function rowsToCars(rows) {
    const head = rows[0].map(colKey); const out = [];
    rows.slice(1).forEach((r, i) => {
      const o = {}; head.forEach((k, j) => { if (k && r[j] != null && String(r[j]).trim() !== '') o[k] = String(r[j]).trim(); });
      if (!Object.keys(o).length) return;
      const anos = String(o.ano || '').match(/\d{4}/g) || [];
      const anoFab = +(o.anoFab || anos[0] || 0), anoMod = +(anos[1] || anos[0] || o.anoFab || 0);
      const c = {
        linha: i + 2, marca: o.marca || '', modelo: o.modelo || '', versao: o.versao || '', anoFab, anoMod, km: toNum(o.km), preco: toNum(o.preco),
        cor: o.cor || '', cambio: o.cambio || 'Automático', combustivel: o.combustivel || 'Flex', carroceria: o.carroceria || 'Hatch',
        precoCompra: toNum(o.precoCompra), fipe: toNum(o.fipe), placa: (o.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
        opcionais: (o.opcionais || '').split(/[;|\n]/).map(x => x.trim()).filter(Boolean), descricao: o.descricao || '',
        statusPlan: STATUS_MAP(o.status), destaque: SIM(o.destaque), fotos: (o.fotos || '').split(/[;\s]+/).map(x => x.trim()).filter(x => /^https?:\/\//.test(x))
      };
      c.erros = []; if (!c.marca) c.erros.push('sem marca'); if (!c.modelo) c.erros.push('sem modelo'); if (!c.preco) c.erros.push('sem preço'); if (!c.anoMod) c.erros.push('sem ano');
      const ex = db().carros.find(x => x.status !== 'vendido' && ((c.placa && (x.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === c.placa) || (!c.placa && D.slug(x.marca + x.modelo) === D.slug(c.marca + c.modelo) && +x.anoMod === c.anoMod && +x.km === c.km)));
      c.existente = ex ? ex.id : null;
      out.push(c);
    });
    return out;
  }
  function modeloCSV() { return csv([COLS_MODELO, EX_MODELO]); }
  function importModal() {
    let lidos = [];
    modal({
      title: 'Importar estoque por planilha', size: 'lg', ok: 'Importar carros',
      body: `<div class="imp-steps"><div><b>1</b>Baixe o modelo ou use a sua planilha do Excel / Google Planilhas</div><div><b>2</b>Uma linha por carro. A 1ª linha tem os nomes das colunas</div><div><b>3</b>Envie o arquivo (.xlsx ou .csv), confira e importe</div></div>
        <p class="small muted" style="margin:12px 0 6px">Colunas aceitas (só <b>Marca, Modelo, Ano e Preço</b> são obrigatórias): ${COLS_MODELO.join(' · ')}. Ano pode ser “2022/2023”. Valores podem ter R$ e pontos. Opcionais e fotos separados por ponto e vírgula.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0"><button type="button" class="b gold" id="imp-pick">${IC.upload}Escolher planilha</button><button type="button" class="b" id="imp-model">${IC.download}Baixar modelo</button><input type="file" id="imp-file" accept=".xlsx,.xls,.csv,.txt" hidden></div>
        <div class="grid-form" style="margin-bottom:12px"><label class="fl c2"><span>Carros novos entram como</span><select class="sel" id="imp-status"><option value="venda">À venda e publicados no site</option><option value="preparacao">Em preparação (não aparecem no site ainda)</option></select></label>
        <label class="check c2" style="align-self:end;height:42px"><input type="checkbox" id="imp-update" checked>Atualizar preço e km dos carros que já existem</label></div>
        <div id="imp-prev"><div class="empty" style="border:1px dashed var(--line-gold);border-radius:12px">Nenhuma planilha escolhida ainda</div></div>`,
      mount: el => {
        $('#imp-pick', el).onclick = () => $('#imp-file', el).click();
        $('#imp-model', el).onclick = () => download('modelo-estoque.csv', modeloCSV());
        $('#imp-file', el).onchange = async e => {
          const f = e.target.files[0]; if (!f) return;
          $('#imp-prev', el).innerHTML = '<div class="empty">Lendo planilha…</div>';
          try {
            const rows = await readSheet(f);
            if (rows.length < 2) throw new Error('vazia');
            if (!rows[0].map(colKey).some(Boolean)) throw new Error('colunas');
            lidos = rowsToCars(rows);
          } catch (x) { lidos = []; $('#imp-prev', el).innerHTML = `<div class="empty down">Não consegui ler essa planilha${x.message === 'colunas' ? ': a primeira linha precisa ter os nomes das colunas (Marca, Modelo, Ano, Preço…)' : x.message === 'xlsx' ? ': sem internet para abrir .xlsx. Salve como .csv e tente de novo' : ''}.</div>`; return; }
          const ok = lidos.filter(c => !c.erros.length), novos = ok.filter(c => !c.existente).length, atual = ok.length - novos, err = lidos.length - ok.length;
          $('#imp-prev', el).innerHTML = `<div class="imp-sum"><span class="pill ok">${novos} novos</span><span class="pill info">${atual} já existem</span>${err ? `<span class="pill bad">${err} com erro (serão ignorados)</span>` : ''}<span class="muted small">${esc(f.name)}</span></div>
            <div class="tw" style="max-height:340px;overflow:auto"><table class="t" style="min-width:760px"><thead><tr><th>Linha</th><th>Carro</th><th>Ano</th><th class="num">KM</th><th class="num">Preço</th>${money() ? '<th class="num">Compra</th>' : ''}<th>Fotos</th><th>Situação</th></tr></thead><tbody>
            ${lidos.map(c => `<tr><td class="muted">${c.linha}</td><td><b>${esc(c.marca + ' ' + c.modelo)}</b><br><small class="muted">${esc(c.versao)} ${c.cor ? '· ' + esc(c.cor) : ''} ${c.placa ? '· ' + esc(c.placa) : ''}</small></td><td>${c.anoFab || '—'}/${c.anoMod || '—'}</td><td class="num">${D.num(c.km)}</td><td class="num"><b>${brl(c.preco)}</b></td>${money() ? `<td class="num">${c.precoCompra ? brl(c.precoCompra) : '—'}</td>` : ''}<td>${c.fotos.length || '—'}</td><td>${c.erros.length ? pill('bad', c.erros.join(', ')) : c.existente ? pill('info', 'atualizar') : pill('ok', 'novo')}</td></tr>`).join('')}
            </tbody></table></div>`;
        };
      },
      onOk: el => {
        const ok = lidos.filter(c => !c.erros.length);
        if (!ok.length) { toast('Escolha uma planilha com pelo menos um carro válido.'); return false; }
        const d = db(), st = $('#imp-status', el).value, upd = $('#imp-update', el).checked;
        let n = 0, u = 0;
        ok.forEach(c => {
          if (c.existente) {
            if (!upd) return;
            const x = D.getCarro(c.existente);
            if (c.preco && c.preco < x.preco && !x.precoAnterior) x.precoAnterior = x.preco;
            Object.assign(x, { preco: c.preco || x.preco, km: c.km || x.km, fipe: c.fipe || x.fipe, valoresIlustrativos: false });
            if (x.precoAnterior && x.precoAnterior <= x.preco) x.precoAnterior = 0;
            if (money() && c.precoCompra) { x.precoCompra = c.precoCompra; syncCarLanc(x); }
            if (c.fotos.length) x.fotos = c.fotos.concat((x.fotos || []).filter(f => !c.fotos.includes(f)));
            if (c.opcionais.length) x.opcionais = c.opcionais;
            if (c.descricao) x.descricao = c.descricao;
            u++; return;
          }
          const status = c.statusPlan && c.statusPlan !== 'vendido' ? c.statusPlan : st;
          const car = {
            id: 'c_' + D.slug(c.marca + '-' + c.modelo + '-' + c.anoMod) + '-' + Math.random().toString(36).slice(2, 6),
            marca: c.marca, modelo: c.modelo, versao: c.versao, anoFab: c.anoFab || c.anoMod, anoMod: c.anoMod, km: c.km, cambio: c.cambio, combustivel: c.combustivel, cor: c.cor, carroceria: c.carroceria, portas: 4, placa: c.placa,
            preco: c.preco, precoAnterior: 0, precoMinimo: 0, precoCompra: money() ? c.precoCompra : 0, fipe: c.fipe, custos: [], opcionais: c.opcionais,
            descricao: c.descricao || (c.marca + ' ' + c.modelo + ' ' + c.versao + ' ' + (c.anoFab || c.anoMod) + '/' + c.anoMod + (c.cor ? ', ' + c.cor.toLowerCase() : '') + ', ' + D.num(c.km) + ' km. Aceitamos seu usado na troca e facilitamos o financiamento, inclusive sem entrada (sujeito à aprovação de crédito).'),
            comentarioLoja: '', videoUrl: '', fotos: c.fotos, destaque: c.destaque, publicado: status !== 'preparacao', status, dataEntrada: today, dataSaida: null, origem: 'compra', fornecedor: '', vendaId: null, checklist: {}
          };
          d.carros.push(car); syncCarLanc(car); n++;
        });
        if (!persist(`Importação concluída: ${n} carro(s) novo(s)${u ? ', ' + u + ' atualizado(s)' : ''} ✓`, `Importou planilha de estoque (${n} novos, ${u} atualizados)`)) return false;
        S.f.estoque = { st: 'ativos', q: '' }; location.hash = '#estoque'; render();
      }
    });
  }

  /* =====================================================================
     AÇÕES (cliques)
     ===================================================================== */
  function onAction(e) {
    const go = e.target.closest('[data-go]'); if (go) { location.hash = go.dataset.go; return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const id = a.dataset.id, d = db();
    switch (a.dataset.act) {
      case 'relatorio': return printRelatorio(S.mk);
      case 'agenda-ver': return agendaModal(id);
      case 'agenda-novo': return agendaModal();
      case 'lead-ver': return leadModal(id);
      case 'lead-wa': { const l = d.leads.find(x => x.id === id); l.historico.push({ data: D.nowISO(), texto: 'Retorno pelo WhatsApp (follow-up)', autor: S.user.nome }); persist(); return openWa(l.telefone, scriptText('s_followup', l), l.demo); }
      case 'lead-assumir': { const l = d.leads.find(x => x.id === id); l.vendedorId = me(); l.historico.push({ data: D.nowISO(), texto: 'Assumido por ' + S.user.nome, autor: S.user.nome }); persist('Lead é seu! Responda rápido 💪'); return leadModal(id); }
      case 'aprovar': return aprovarVenda(id, true);
      case 'recusar': return confirmBox('Recusar esta venda? Ela será cancelada e o carro volta ao estoque.', () => aprovarVenda(id, false), 'Recusar venda');
      case 'conta-paga': { const l = d.lancamentos.find(x => x.id === id); l.pago = true; l.data = today; persist('Conta marcada como paga ✓', 'Pagou ' + l.descricao); return render(); }
      case 'carro-acoes': return carActions(id);
      case 'av-nova': return avModal();
      case 'av-ver': return avModal(id);
      case 'preco-aplicar': { const c = D.getCarro(id), v = +a.dataset.v; if (!c || !v) return; return confirmBox(`Baixar ${D.carroTitulo(c)} de ${brl(c.preco)} para ${brl(v)}? O site passa a mostrar “de/por”.`, () => { if (!c.precoAnterior || c.precoAnterior < c.preco) c.precoAnterior = c.preco; c.preco = v; persist('Preço atualizado ✓', `Baixou ${D.carroTitulo(c)} para ${brl(v)} (giro do estoque)`); render(); }, 'Baixar preço'); }
      case 'entrega-add': return entregaModal();
      case 'entrega-pub': { const e2 = d.entregas.find(x => x.id === id); e2.publicado = !e2.publicado; persist(e2.publicado ? 'Aparece no site ✓' : 'Escondida do site'); return render(); }
      case 'entrega-del': return confirmBox('Remover esta foto da galeria?', () => { d.entregas = d.entregas.filter(x => x.id !== id); persist('Foto removida'); render(); });
      case 'dep-novo': return depModal();
      case 'dep-edit': return depModal(id);
      case 'dep-pub': { const x = d.depoimentos.find(y => y.id === id); x.publicado = !x.publicado; persist(x.publicado ? 'Depoimento no site ✓' : 'Depoimento escondido'); return render(); }
      case 'dep-del': return confirmBox('Excluir este depoimento?', () => { d.depoimentos = d.depoimentos.filter(x => x.id !== id); persist('Depoimento excluído'); render(); });
      case 'script-add': { $('#scripts-list').insertAdjacentHTML('beforeend', scriptRow({ id: D.uid('s'), titulo: '', texto: '' })); return; }
      case 'script-del': { a.closest('.script-row').remove(); return; }
      case 'importar': return importModal();
      case 'carro-novo': return carModal();
      case 'carro-editar': return carModal(id);
      case 'venda-nova': return saleModal({ carroId: id });
      case 'venda-ver': return saleView(id);
      case 'reservar': { const c = D.getCarro(id); c.status = 'reservado'; persist('Carro reservado para você', `${S.user.nome} reservou ${D.carroTitulo(c)}`); return render(); }
      case 'lead-novo': return leadModal();
      case 'distribuir': {
        const vs = vendedores().filter(u => u.cargo === 'vendedor'); const ls = d.leads.filter(l => l.etapa === 'novo' && !l.vendedorId);
        ls.forEach((l, i) => { const u = vs[i % vs.length]; l.vendedorId = u.id; l.historico.push({ data: today, texto: 'Distribuído para ' + u.nome, autor: S.user.nome }); });
        persist(ls.length + ' leads distribuídos entre ' + vs.length + ' vendedores', 'Distribuiu leads'); return render();
      }
      case 'lanc-novo': return lancModal();
      case 'lanc-del': return confirmBox('Excluir este lançamento?', () => { d.lancamentos = d.lancamentos.filter(l => l.id !== id); persist('Lançamento excluído'); render(); });
      case 'pagar': return pagar(id);
      case 'membro-novo': return memberModal();
      case 'membro-editar': return memberModal(id);
      case 'aviso-novo': return noticeModal();
      case 'aviso-ler': { const c = d.comunicados.find(x => x.id === id); c.leituras = c.leituras || []; c.leituras.push(me()); persist('Confirmado ✓'); return render(); }
      case 'aviso-fixar': { const c = d.comunicados.find(x => x.id === id); c.fixado = !c.fixado; persist(); return render(); }
      case 'aviso-del': return confirmBox('Excluir este comunicado?', () => { d.comunicados = d.comunicados.filter(x => x.id !== id); persist('Comunicado excluído'); render(); });
      case 'wa-cli': { const c = D.getCliente(id); return openWa(c.telefone, `Olá, ${c.nome.split(' ')[0]}! Aqui é da ${db().config.loja}. Passando para saber como está o carro e se podemos ajudar em algo 😊`, c.demo); }
      case 'csv-vendas': { const vs = vendasDo(S.mk, isVend() ? me() : S.f.vendas.v); return download('vendas-' + S.mk + '.csv', csv([['Data', 'Carro', 'Ano', 'Cliente', 'Vendedor', 'Pagamento', 'Banco', 'Entrada', 'Valor', ...(money() ? ['Lucro'] : []), 'Comissão', 'Comissão paga'], ...vs.map(v => { const c = D.getCarro(v.carroId); return [D.dateBR(v.data), D.carroTitulo(c) + ' ' + c.versao, c.anoMod, (D.getCliente(v.clienteId) || {}).nome, (D.getUser(v.vendedorId) || {}).nome, PAG[v.formaPagamento], v.banco, v.entrada, v.valor, ...(money() ? [v.lucro] : []), v.comissao, v.comissaoPaga ? 'sim' : 'não']; })])); }
      case 'csv-fin': return download('financeiro-' + S.mk + '.csv', csv([['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'], ...lancDo(S.mk).sort((a, b) => a.data > b.data ? 1 : -1).map(l => [D.dateBR(l.data), l.tipo, l.categoria, l.descricao, (l.tipo === 'saida' ? -1 : 1) * l.valor])]));
      case 'csv-clientes': return download('clientes.csv', csv([['Nome', 'Telefone', 'E-mail', 'Desde'], ...d.clientes.map(c => [c.nome, c.telefone, c.email, D.dateBR(c.criadoEm)])]));
      case 'backup': return download('backup-loja-' + today + '.json', JSON.stringify(d, null, 1), 'application/json');
      case 'restore': return $('#restore-file').click();
      case 'demo-reset': return confirmBox('Recarregar os dados de demonstração? Tudo o que foi alterado será substituído.', () => { D.reset(); S.user = D.getUser('u_dir'); D.session(S.user); toast('Demonstração recarregada'); render(); });
      case 'wipe': return confirmBox('Apagar TODOS os dados de demonstração e começar com a loja real? Faça um backup antes se quiser guardar algo.', () => { D.wipe(); S.user = D.getUser('u_dir'); D.session(S.user); toast('Pronto! Sistema zerado para os dados reais.'); location.hash = '#estoque'; render(); }, 'Apagar e começar');
    }
  }
  function noticeModal() {
    modal({
      title: 'Novo comunicado',
      body: `<form id="nf"><label class="fl"><span>Título *</span><input class="in" name="titulo" required></label><label class="fl" style="margin-top:12px"><span>Mensagem *</span><textarea class="ta" name="texto" required style="min-height:140px"></textarea></label><label class="check" style="margin-top:12px"><input type="checkbox" name="fixado">Fixar no topo</label></form>`,
      ok: 'Publicar para a equipe',
      onOk: el => { const f = $('#nf', el); if (!f.reportValidity()) return false; db().comunicados.unshift({ id: D.uid('cm'), titulo: f.titulo.value.trim(), texto: f.texto.value.trim(), data: today, autorId: me(), fixado: f.fixado.checked, leituras: [] }); persist('Comunicado publicado ✓', 'Publicou comunicado'); render(); }
    });
  }

  /* =====================================================================
     MODAL
     ===================================================================== */
  function modal({ title, body, size = '', ok = 'Salvar', okOnly = false, left = '', mount, onOk }) {
    closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h2>${esc(title)}</h2><button class="b icon ghost" data-close aria-label="Fechar">${IC.x}</button></div><div class="modal-b">${body}</div><div class="modal-f">${left ? `<div class="mf-left">${left}</div>` : ''}<span class="sp"></span>${okOnly ? '' : '<button class="b" data-close>Cancelar</button>'}<button class="b gold" data-ok>${esc(ok)}</button></div></div>`;
    document.body.appendChild(bg);
    const el = $('.modal', bg);
    bg.addEventListener('mousedown', e => { if (e.target === bg) closeModal(); });
    $$('[data-close]', bg).forEach(b => b.onclick = closeModal);
    $('[data-ok]', bg).onclick = () => { if (!onOk || onOk(el) !== false) closeModal(); };
    $$('form', el).forEach(f => f.addEventListener('submit', e => { e.preventDefault(); $('[data-ok]', bg).click(); }));
    if (mount) mount(el);
    const first = $('input:not([type=hidden]):not([disabled]), select, textarea', el); if (first && window.innerWidth > 760) first.focus();
  }
  function closeModal() { $$('.modal-bg').forEach(m => m.remove()); }
  function confirmBox(msg, yes, okLabel = 'Confirmar') {
    const bg = document.createElement('div'); bg.className = 'modal-bg mb-center'; bg.style.zIndex = 150;
    bg.innerHTML = `<div class="modal sm" role="alertdialog" aria-modal="true"><div class="modal-b" style="padding-top:26px"><p style="margin:0;font-size:15px">${esc(msg)}</p></div><div class="modal-f"><button class="b" data-n>Cancelar</button><button class="b gold" data-y>${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(bg);
    $('[data-n]', bg).onclick = () => bg.remove();
    $('[data-y]', bg).onclick = () => { bg.remove(); yes(); };
  }

  /* =====================================================================
     v5 · PACOTE CRM (inspirado nos sistemas de revenda como o Autoconf)
     1. Avaliação de usados (compra e troca) com checklist 360º e oferta pela FIPE
     2. Giro e preço do estoque (tempo de pátio, % da FIPE, sugestão de preço)
     3. Anúncios em portais (onde cada carro está + texto pronto)
     4. Documentação depois da venda (prazo de 30 dias da comunicação ao Detran)
     5. Crédito no lead (bancos, status, valor aprovado)
     ===================================================================== */
  const AV_STATUS = { aberta: 'Em avaliação', proposta: 'Proposta enviada', comprado: 'Comprado', recusado: 'Não fechou' };
  const AV_PILL = { aberta: 'info', proposta: 'warn', comprado: 'ok', recusado: 'no-dot' };
  const MARCAS = ['Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Toyota', 'Honda', 'Jeep', 'Renault', 'Nissan', 'Ford', 'CAOA Chery', 'Peugeot', 'Citroën', 'Mitsubishi', 'BYD', 'Kia'];
  const avs = () => db().avaliacoes || (db().avaliacoes = []);
  const avVisiveis = () => isVend() ? avs().filter(a => !a.avaliadorId || a.avaliadorId === me()) : avs();
  const fipePct = c => D.fipePct(c) || 0;
  const portaisN = c => D.portaisAtivos(c).length;
  const podeOfertar = () => !isVend();                       // diretora e gerente definem o valor da proposta
  const ofertaVisivel = a => podeOfertar() || a.status !== 'aberta';
  const ativaAv = a => a.status === 'aberta' || a.status === 'proposta';

  /* ---------- 1. AVALIAÇÕES ---------- */
  V.avaliacoes = () => {
    const f = S.f.av || (S.f.av = { st: 'ativas', q: '' });
    const all = avVisiveis();
    const cnt = k => k === 'ativas' ? all.filter(ativaAv).length : k === 'todas' ? all.length : all.filter(a => a.status === k).length;
    let list = f.st === 'ativas' ? all.filter(ativaAv) : f.st === 'todas' ? all.slice() : all.filter(a => a.status === f.st);
    if (f.q) { const q = D.slug(f.q).replace(/-/g, ' '); list = list.filter(a => D.slug([a.marca, a.modelo, a.versao, a.clienteNome, a.placa, a.telefone].join(' ')).replace(/-/g, ' ').includes(q)); }
    list.sort((a, b) => a.criadoEm < b.criadoEm ? 1 : -1);
    const fech = all.filter(a => a.status === 'comprado' || a.status === 'recusado'), comp = all.filter(a => a.status === 'comprado');
    const ofs = all.filter(a => a.oferta && a.fipe);
    return `<div class="kpis">
        ${kpi('Em avaliação', cnt('aberta'), 'esperando o valor da loja', 'clip', true)}
        ${kpi('Propostas enviadas', cnt('proposta'), 'esperando resposta do cliente', 'clock')}
        ${kpi('Compradas', comp.length, comp.filter(a => D.monthKey((a.historico || []).slice(-1)[0] ? a.historico.slice(-1)[0].data : a.criadoEm) === D.monthKey(today)).length + ' neste mês', 'car')}
        ${kpi('Taxa de compra', pct(comp.length, fech.length || 1) + '%', 'das avaliações que fecharam', 'target')}
        ${podeOfertar() ? kpi('Oferta média', ofs.length ? Math.round(sum(ofs, a => a.oferta / a.fipe * 100) / ofs.length) + '% da FIPE' : '—', 'alvo: ' + (db().config.avMargem || 12) + '% abaixo da FIPE − preparo', 'percent') : ''}
      </div>
      <div class="toolbar">
        <div class="tabs" id="av-tabs">${[['ativas', 'Em andamento'], ['aberta', 'Em avaliação'], ['proposta', 'Proposta'], ['comprado', 'Comprados'], ['recusado', 'Não fechou'], ['todas', 'Todas']].map(t => `<button class="${f.st === t[0] ? 'on' : ''}" data-st="${t[0]}">${t[1]}<i>${cnt(t[0])}</i></button>`).join('')}</div>
        <input class="in" id="av-q" placeholder="Buscar carro, cliente, placa…" value="${esc(f.q)}">
        <span class="sp"></span>
        <button class="b gold" data-act="av-nova">${IC.plus}Nova avaliação</button>
      </div>
      <p class="small muted" style="margin:-6px 0 14px">Checklist de ${D.AV_ITENS.length} itens, custo de preparação estimado e oferta sugerida pela FIPE. Fechou a compra? Um toque e o carro entra no estoque em preparação.</p>
      <div class="av-grid">${list.map(avCard).join('') || '<div class="empty">Nenhuma avaliação aqui. Toque em “Nova avaliação” quando um cliente quiser vender ou dar o carro na troca.</div>'}</div>`;
  };
  AFTER.avaliacoes = () => {
    const f = S.f.av;
    $$('#av-tabs button').forEach(b => b.onclick = () => { f.st = b.dataset.st; render(); });
    const q = $('#av-q'); q.oninput = () => { f.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { render(); const n = $('#av-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
  };
  function avCard(a) {
    const nota = D.avNota(a), custo = D.avCusto(a), u = D.getUser(a.avaliadorId), sug = D.avSugestao(a);
    return `<div class="av-card" data-act="av-ver" data-id="${a.id}" role="button" tabindex="0">
      <img class="av-ph" src="${esc((a.fotos || [])[0] || D.PLACEHOLDER)}" alt="" loading="lazy">
      <div class="av-bd">
        <div class="av-t"><b>${esc(a.marca + ' ' + a.modelo)} <span class="muted">${esc(a.anoMod || '')}</span></b>${pill(AV_PILL[a.status] + ' no-dot', AV_STATUS[a.status])}</div>
        <small>${esc(a.clienteNome || 'Cliente')} · ${a.tipo === 'troca' ? 'Troca' : 'Compra'} · ${D.num(a.km || 0)} km · ${D.dateBR(a.criadoEm)}</small>
        <div class="av-nums">
          <div><small>FIPE</small><b>${a.fipe ? kbrl(a.fipe) : '—'}</b></div>
          <div><small>Pede</small><b>${a.pedido ? kbrl(a.pedido) : '—'}</b></div>
          <div><small>${a.oferta ? 'Oferta' : 'Sugestão'}</small><b class="gold-t">${ofertaVisivel(a) ? (a.oferta ? kbrl(a.oferta) : sug ? kbrl(sug) : '—') : 'aguarda'}</b></div>
        </div>
        <div class="av-meta">${nota != null ? `<span class="av-nota ${nota >= 80 ? 'ok' : nota >= 55 ? 'mid' : 'low'}"><i style="width:${nota}%"></i></span><small>Estado ${nota}/100${custo ? ' · preparo ~' + kbrl(custo) : ''}</small>` : '<small class="muted">Checklist ainda não preenchido</small>'}${u ? av(u, 'sm') : ''}</div>
      </div></div>`;
  }
  function avModal(id, preset = {}) {
    const novo = !id;
    const a = novo ? Object.assign({ tipo: 'troca', status: 'aberta', clienteNome: '', telefone: '', leadId: null, avaliadorId: me(), marca: '', modelo: '', versao: '', anoFab: 2018, anoMod: 2018, km: 0, cor: '', placa: '', cambio: 'Manual', combustivel: 'Flex', fipe: 0, pedido: 0, oferta: 0, itens: {}, custos: {}, fotos: [], obs: '', historico: [] }, preset) : avs().find(x => x.id === id);
    if (!a) return;
    const trava = a.status === 'comprado';       // depois de comprado vira registro
    const edita = !trava && (!isVend() || ((!a.avaliadorId || a.avaliadorId === me()) && a.status === 'aberta'));
    const dis = edita ? '' : 'disabled';
    const opt = (arr, v) => arr.map(o => `<option ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('');
    const itemRow = k => { const v = (a.itens || {})[k[0]] || ''; const cv = (a.custos || {})[k[0]] || ''; return `<div class="av-item" data-k="${k[0]}"><span>${esc(k[1])}</span><div class="seg" role="radiogroup" aria-label="${esc(k[1])}">${[['ok', 'OK'], ['atencao', 'Atenção'], ['ruim', 'Ruim']].map(o => `<label class="seg-${o[0]}"><input type="radio" name="it_${k[0]}" value="${o[0]}" ${v === o[0] ? 'checked' : ''} ${dis}><span>${o[1]}</span></label>`).join('')}</div><input class="in av-cost" type="number" inputmode="numeric" min="0" name="cu_${k[0]}" placeholder="R$ do reparo" value="${esc(cv)}" ${dis} ${v && v !== 'ok' ? '' : 'hidden'}></div>`; };
    const body = `<form id="avf">
      <div class="sec-t">Cliente</div>
      <div class="grid-form">
        <label class="fl"><span>Tipo</span><select class="sel" name="tipo" ${dis}><option value="troca" ${a.tipo === 'troca' ? 'selected' : ''}>Troca (abate na venda)</option><option value="compra" ${a.tipo === 'compra' ? 'selected' : ''}>Compra (a loja compra)</option></select></label>
        <label class="fl"><span>Nome do cliente *</span><input class="in" name="clienteNome" required value="${esc(a.clienteNome)}" ${dis}></label>
        <label class="fl c2"><span>WhatsApp</span><input class="in" name="telefone" inputmode="tel" value="${esc(a.telefone)}" placeholder="(11) 9 0000-0000" ${dis}></label>
      </div>
      <div class="sec-t">Carro avaliado</div>
      <div class="grid-form">
        <label class="fl"><span>Marca *</span><input class="in" name="marca" required list="dl-marcas-av" value="${esc(a.marca)}" ${dis}></label>
        <label class="fl"><span>Modelo *</span><input class="in" name="modelo" required value="${esc(a.modelo)}" ${dis}></label>
        <label class="fl c2"><span>Versão</span><input class="in" name="versao" value="${esc(a.versao)}" placeholder="Ex.: LT 1.4" ${dis}></label>
        <label class="fl"><span>Ano de fabricação</span><input class="in" type="number" inputmode="numeric" name="anoFab" value="${esc(a.anoFab)}" ${dis}></label>
        <label class="fl"><span>Ano modelo</span><input class="in" type="number" inputmode="numeric" name="anoMod" value="${esc(a.anoMod)}" ${dis}></label>
        <label class="fl"><span>KM</span><input class="in" type="number" inputmode="numeric" name="km" value="${esc(a.km)}" ${dis}></label>
        <label class="fl"><span>Placa</span><input class="in" name="placa" value="${esc(a.placa)}" autocapitalize="characters" ${dis}></label>
        <label class="fl"><span>Cor</span><input class="in" name="cor" value="${esc(a.cor)}" ${dis}></label>
        <label class="fl"><span>Câmbio</span><select class="sel" name="cambio" ${dis}>${opt(['Manual', 'Automático', 'CVT', 'Automatizado'], a.cambio)}</select></label>
        <label class="fl"><span>Combustível</span><select class="sel" name="combustivel" ${dis}>${opt(['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'], a.combustivel)}</select></label>
      </div>
      <div class="sec-t">Valores</div>
      <div class="grid-form">
        <label class="fl"><span>Tabela FIPE (R$)</span><input class="in" type="number" inputmode="numeric" name="fipe" value="${a.fipe || ''}" ${dis}></label>
        <label class="fl"><span>Quanto o cliente pede (R$)</span><input class="in" type="number" inputmode="numeric" name="pedido" value="${a.pedido || ''}" ${dis}></label>
        <a class="b sm" style="align-self:end" href="https://veiculos.fipe.org.br/" target="_blank" rel="noopener">${IC.ext}Consultar a FIPE</a>
      </div>
      <div class="sec-t">Checklist 360º <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">— se não estiver OK, coloque quanto custa o reparo</span></div>
      <div class="av-items">${D.AV_ITENS.map(itemRow).join('')}</div>
      <div class="sec-t">Fotos do carro</div>
      <div class="photos" id="av-photos"></div><input type="file" id="av-file" accept="image/*" multiple hidden>
      <label class="fl" style="margin-top:12px"><span>Observações</span><textarea class="ta" name="obs" ${dis} placeholder="Ex.: único dono, revisões na concessionária, risco na porta traseira">${esc(a.obs || '')}</textarea></label>
      <div class="sec-t">Resultado</div>
      <div class="preview" id="av-res"></div>
      ${podeOfertar() ? `<div class="grid-form" style="margin-top:12px">
        <label class="fl"><span>Oferta da loja (R$)</span><input class="in" type="number" inputmode="numeric" name="oferta" value="${a.oferta || ''}" ${trava ? 'disabled' : ''} placeholder="use a sugestão ou ajuste"></label>
        <label class="fl"><span>Situação</span><select class="sel" name="status" ${trava ? 'disabled' : ''}>${['aberta', 'proposta', 'recusado'].concat(trava ? ['comprado'] : []).map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${AV_STATUS[s]}</option>`).join('')}</select></label>
        <label class="fl c2"><span>Avaliador(a)</span><select class="sel" name="avaliadorId" ${trava ? 'disabled' : ''}>${db().usuarios.filter(u => u.ativo).map(u => `<option value="${u.id}" ${a.avaliadorId === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
      </div>` : (a.oferta && a.status !== 'aberta' ? `<p class="small" style="margin-top:10px">Proposta aprovada pela loja: <b class="gold-t">${brl(a.oferta)}</b></p>` : '<p class="small muted" style="margin-top:10px">O valor da proposta é definido pela diretoria ou pelo gerente. Preencha o checklist e salve.</p>')}
      ${!novo && (a.historico || []).length ? `<div class="sec-t">Histórico</div><div class="timeline">${a.historico.slice().reverse().map(h => `<div>${esc(h.texto)}<small>${D.dateBR(h.data)} ${D.timeOf(h.data)} · ${esc(h.autor)}</small></div>`).join('')}</div>` : ''}
      <datalist id="dl-marcas-av">${MARCAS.map(m => `<option>${m}</option>`).join('')}</datalist>
    </form>`;
    const temOferta = a.oferta || D.avSugestao(a);
    modal({
      title: novo ? 'Nova avaliação' : a.marca + ' ' + a.modelo + ' ' + (a.anoMod || ''), size: 'lg', body,
      ok: trava ? 'Fechar' : novo ? 'Salvar avaliação' : 'Salvar', okOnly: trava,
      left: novo ? '' : `${!trava && (isDir() || (a.status === 'aberta' && a.avaliadorId === me())) ? `<button class="b danger" id="av-del" aria-label="Excluir avaliação">${IC.trash}</button>` : ''}<button class="b" id="av-laudo">${IC.print}Laudo</button>${a.telefone && ofertaVisivel(a) && temOferta && !trava ? `<button class="b green" id="av-wa">${IC.wa}Proposta</button>` : ''}${isDir() && !trava ? `<button class="b gold-o" id="av-comprar">${IC.car}Comprar → estoque</button>` : ''}${trava && a.carroId && D.getCarro(a.carroId) ? `<button class="b" id="av-carro">${IC.car}Ver no estoque</button>` : ''}`,
      mount: el => {
        const f = $('#avf', el), fotos = (a.fotos || []).slice(); el._fotos = fotos;
        const temp = () => { const it = {}, cu = {}; D.AV_ITENS.forEach(k => { const r = $(`[name=it_${k[0]}]:checked`, f); if (r) it[k[0]] = r.value; const c = f['cu_' + k[0]]; if (c && c.value) cu[k[0]] = +c.value; }); return { fipe: +f.fipe.value || 0, itens: it, custos: cu }; };
        const res = () => {
          const t = temp(), nota = D.avNota(t), custo = D.avCusto(t), sug = D.avSugestao(t), ped = +f.pedido.value || 0;
          const ofer = f.oferta ? (+f.oferta.value || 0) : a.oferta;
          $('#av-res', el).innerHTML = `<div><small>Estado do carro</small><b class="${nota == null ? '' : nota >= 80 ? 'up' : nota < 55 ? 'down' : ''}">${nota == null ? '—' : nota + '/100'}</b></div><div><small>Preparação estimada</small><b>${brl(custo)}</b></div>` +
            (podeOfertar() ? `<div><small>Oferta sugerida</small><b class="gold-t">${sug ? brl(sug) : 'informe a FIPE'}</b></div><div><small>${ofer ? 'Oferta = % da FIPE' : 'Cliente pede'}</small><b>${ofer && t.fipe ? Math.round(ofer / t.fipe * 100) + '%' : ped ? brl(ped) : '—'}</b></div>` : '') +
            (podeOfertar() && ped && sug ? `<div style="grid-column:1/-1" class="small ${ped > sug ? 'down' : 'up'}">${ped > sug ? 'O cliente pede ' + brl(ped - sug) + ' acima da sugestão. Negocie mostrando o laudo.' : 'O pedido do cliente cabe na sugestão: boa compra.'}</div>` : '');
        };
        $$('.av-item', el).forEach(row => $$('input[type=radio]', row).forEach(r => r.onchange = () => { const c = $('.av-cost', row); c.hidden = r.value === 'ok'; if (r.value !== 'ok' && edita) c.focus(); res(); }));
        el.addEventListener('input', res); res();
        const drawPh = () => {
          $('#av-photos', el).innerHTML = fotos.map((p, i) => `<div class="photo"><img src="${esc(p)}" alt="">${edita ? `<div class="acts"><button type="button" data-rm="${i}" aria-label="Remover foto">${IC.trash}</button></div>` : ''}</div>`).join('') + (edita ? `<div class="photo-add" id="av-ph-add" role="button" tabindex="0">${IC.camera}Tirar / escolher fotos</div>` : (fotos.length ? '' : '<div class="muted small">Sem fotos</div>'));
          const add = $('#av-ph-add', el); if (add) add.onclick = () => $('#av-file', el).click();
          $$('[data-rm]', el).forEach(b => b.onclick = () => { fotos.splice(+b.dataset.rm, 1); drawPh(); });
        };
        drawPh();
        $('#av-file', el).onchange = async e => { for (const fl of e.target.files) { try { fotos.push(await compress(fl)); } catch (x) { toast('Não consegui ler ' + fl.name); } } e.target.value = ''; drawPh(); };
        if (novo) return;
        $('#av-laudo', el).onclick = () => printLaudo(a);
        const del = $('#av-del', el); if (del) del.onclick = () => confirmBox('Excluir esta avaliação?', () => { db().avaliacoes = avs().filter(x => x.id !== a.id); persist('Avaliação excluída', 'Excluiu avaliação de ' + a.marca + ' ' + a.modelo); closeModal(); render(); });
        const wa = $('#av-wa', el); if (wa) wa.onclick = () => {
          const valor = (f.oferta && +f.oferta.value) || a.oferta || D.avSugestao(a); if (!valor) return toast('Defina a oferta primeiro.');
          const txt = `Olá, ${(a.clienteNome || '').split(' ')[0]}! Aqui é ${S.user.nome.split(' ')[0]}, da ${db().config.loja}. Avaliamos o seu ${a.marca} ${a.modelo} ${a.anoMod}: nossa proposta é de ${brl(valor)}${a.tipo === 'troca' ? ', abatendo direto no seu próximo carro' : ''}. A proposta vale por 3 dias e está sujeita à vistoria cautelar e à consulta de débitos. Vamos fechar?`;
          if (podeOfertar() && a.status === 'aberta') { a.status = 'proposta'; a.oferta = valor; a.historico = a.historico || []; a.historico.push({ data: D.nowISO(), texto: 'Proposta enviada pelo WhatsApp: ' + brl(valor), autor: S.user.nome }); persist(); }
          openWa(a.telefone, txt, a.demo);
        };
        const cp = $('#av-comprar', el); if (cp) cp.onclick = () => { if (f.oferta && +f.oferta.value) a.oferta = +f.oferta.value; comprarAval(a); };
        const vc = $('#av-carro', el); if (vc) vc.onclick = () => { closeModal(); carModal(a.carroId); };
      },
      onOk: el => {
        if (trava) return;
        const f = $('#avf', el); if (!f.reportValidity()) return false;
        const g = n => f[n] ? f[n].value.trim() : '';
        const antes = { status: a.status, oferta: a.oferta };
        if (edita) {
          Object.assign(a, { tipo: g('tipo'), clienteNome: g('clienteNome'), telefone: g('telefone'), marca: g('marca'), modelo: g('modelo'), versao: g('versao'), anoFab: +g('anoFab') || 0, anoMod: +g('anoMod') || 0, km: +g('km') || 0, placa: g('placa').toUpperCase(), cor: g('cor'), cambio: g('cambio'), combustivel: g('combustivel'), fipe: +g('fipe') || 0, pedido: +g('pedido') || 0, obs: g('obs'), fotos: el._fotos });
          a.itens = {}; a.custos = {};
          D.AV_ITENS.forEach(k => { const r = $(`[name=it_${k[0]}]:checked`, f); if (r) a.itens[k[0]] = r.value; const c = f['cu_' + k[0]]; if (r && r.value !== 'ok' && c && +c.value) a.custos[k[0]] = +c.value; });
        }
        if (podeOfertar() && f.oferta) { a.oferta = +f.oferta.value || 0; a.status = f.status.value; a.avaliadorId = f.avaliadorId.value; }
        a.historico = a.historico || [];
        if (novo) {
          a.id = D.uid('av'); a.criadoEm = D.nowISO(); a.historico.push({ data: a.criadoEm, texto: 'Avaliação iniciada' + (a.tipo === 'troca' ? ' (troca)' : ' (compra)'), autor: S.user.nome });
          avs().unshift(a);
          const l = a.leadId && db().leads.find(x => x.id === a.leadId); if (l) { l.historico = l.historico || []; l.historico.push({ data: D.nowISO(), texto: `Carro do cliente avaliado: ${a.marca} ${a.modelo} ${a.anoMod}`, autor: S.user.nome }); }
        }
        if (!novo && a.status !== antes.status) a.historico.push({ data: D.nowISO(), texto: 'Situação: ' + AV_STATUS[antes.status] + ' → ' + AV_STATUS[a.status] + (a.status === 'proposta' && a.oferta ? ' (' + brl(a.oferta) + ')' : ''), autor: S.user.nome });
        else if (!novo && a.oferta !== antes.oferta && a.oferta) a.historico.push({ data: D.nowISO(), texto: 'Oferta definida: ' + brl(a.oferta), autor: S.user.nome });
        if (!persist(novo ? 'Avaliação salva ✓' : 'Avaliação atualizada ✓', (novo ? 'Criou' : 'Atualizou') + ` avaliação ${a.marca} ${a.modelo}`)) return false;
        if (S.view === 'avaliacoes') render(); else if (novo) toast('Avaliação salva. Veja em Operação → Avaliações');
      }
    });
  }
  function comprarAval(a) {
    const valor = a.oferta || D.avSugestao(a);
    if (!valor) return toast('Defina a oferta da loja antes de comprar.');
    confirmBox(`Comprar o ${a.marca} ${a.modelo} ${a.anoMod} por ${brl(valor)}? Ele entra no estoque em preparação${a.tipo === 'compra' ? ' e a compra vai para o financeiro' : ' (troca: o valor abate na venda)'}.`, () => {
      const d = db();
      const c = { id: 'c_' + D.slug(a.marca + '-' + a.modelo + '-' + a.anoMod) + '-' + Math.random().toString(36).slice(2, 6), marca: a.marca, modelo: a.modelo, versao: a.versao || '', anoFab: +a.anoFab || +a.anoMod, anoMod: +a.anoMod, km: +a.km || 0, cambio: a.cambio || 'Manual', combustivel: a.combustivel || 'Flex', cor: a.cor || '', carroceria: 'Hatch', portas: 4, placa: a.placa || '', preco: Math.max(0, Math.round((a.fipe || valor * 1.18) / 1000) * 1000 - 100), precoCompra: valor, fipe: +a.fipe || 0, custos: [], opcionais: [], descricao: '', fotos: (a.fotos || []).slice(), destaque: false, publicado: false, status: 'preparacao', dataEntrada: today, dataSaida: null, origem: a.tipo === 'troca' ? 'troca' : 'compra', fornecedor: a.clienteNome || '', vendaId: null, precoAnterior: 0, precoMinimo: 0, checklist: {}, comentarioLoja: '', videoUrl: '', avaliacaoId: a.id, portais: {} };
      d.carros.push(c); syncCarLanc(c);
      a.status = 'comprado'; a.oferta = valor; a.carroId = c.id; a.historico = a.historico || [];
      a.historico.push({ data: D.nowISO(), texto: 'Comprado por ' + brl(valor) + ' · entrou no estoque em preparação', autor: S.user.nome });
      if (!persist('Carro no estoque em preparação ✓ Confira os dados e o preço', `Comprou ${a.marca} ${a.modelo} pela avaliação (${brl(valor)})`)) return;
      closeModal(); render(); setTimeout(() => carModal(c.id), 0);
    }, 'Comprar e pôr no estoque');
  }
  function printLaudo(a) {
    const nota = D.avNota(a), custo = D.avCusto(a), u = D.getUser(a.avaliadorId) || S.user;
    const st = { ok: 'OK', atencao: 'Atenção', ruim: 'Ruim' };
    const valor = a.oferta || (podeOfertar() ? D.avSugestao(a) : 0);
    docModal('Laudo de avaliação · ' + a.marca + ' ' + a.modelo, `${docTop('Avaliação nº ' + esc(String(a.id || '').slice(-6).toUpperCase()) + ' · ' + D.dateBR(a.criadoEm))}
      <h1>Laudo de avaliação</h1><div class="muted">${a.tipo === 'troca' ? 'Veículo na troca' : 'Compra de veículo'} · Avaliador(a): ${esc(u.nome || '')}</div>
      <h2>Proprietário</h2><table><tr><td class="muted">Nome</td><td><b>${esc(a.clienteNome)}</b></td></tr><tr><td class="muted">Telefone</td><td>${esc(a.telefone || '')}</td></tr></table>
      <h2>Veículo</h2><table><tr><td class="muted">Veículo</td><td><b>${esc([a.marca, a.modelo, a.versao].join(' '))} ${esc(a.anoFab)}/${esc(a.anoMod)}</b></td></tr><tr><td class="muted">KM · Cor · Câmbio</td><td>${D.km(a.km || 0)} · ${esc(a.cor || '—')} · ${esc(a.cambio || '')}</td></tr>${a.placa ? `<tr><td class="muted">Placa</td><td>${esc(a.placa)}</td></tr>` : ''}</table>
      <h2>Checklist 360º</h2><table><tr><th>Item</th><th>Situação</th><th class="num">Reparo estimado</th></tr>${D.AV_ITENS.map(k => { const v = (a.itens || {})[k[0]]; const cv = v && v !== 'ok' ? (a.custos || {})[k[0]] : 0; return `<tr><td>${esc(k[1])}</td><td>${v ? st[v] : '—'}</td><td class="num">${cv ? brl(cv) : '—'}</td></tr>`; }).join('')}</table>
      <div class="kpis" style="margin-top:16px"><div><small>Estado geral</small><b>${nota != null ? nota + '/100' : '—'}</b></div><div><small>Preparação estimada</small><b>${brl(custo)}</b></div><div><small>Tabela FIPE</small><b>${a.fipe ? brl(a.fipe) : '—'}</b></div><div><small>${a.oferta ? 'Proposta da loja' : 'Valor de referência'}</small><b class="gold">${valor ? brl(valor) : '—'}</b></div></div>
      ${a.obs ? `<h2>Observações</h2><div>${esc(a.obs)}</div>` : ''}
      ${(a.fotos || []).length ? `<h2>Fotos</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${a.fotos.slice(0, 6).map(p => `<img src="${esc(p)}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px">`).join('')}</div>` : ''}
      <div class="lines"><div>Proprietário</div><div>${esc(db().config.loja)}</div></div>
      <div class="note">Proposta válida por 3 dias. Valor sujeito a vistoria cautelar, consulta de débitos, multas, restrições e gravame e à conferência da documentação. Este laudo é a avaliação comercial da loja e não substitui a vistoria oficial.</div>`);
  }

  /* ---------- 2. GIRO E PREÇO DO ESTOQUE ---------- */
  function sugestaoPreco(c) {
    const d = D.diasEstoque(c), fp = D.fipePct(c), views = ((db().stats || {}).views || {})[c.id] || 0;
    const leads30 = db().leads.filter(l => l.carroId === c.id && D.diffDays(l.criadoEm, today) <= 30).length;
    const base = { d, fp, views, leads30, alvo: 0 };
    let alvo = 0, motivo = '';
    if (d > 90) { alvo = c.preco * 0.95; motivo = `${d} dias no pátio: baixar 5% para girar`; }
    else if (d > 60 && fp && fp > 100) { alvo = c.fipe; motivo = `${d} dias e ${fp}% da FIPE: alinhar com a tabela`; }
    else if (d > 60) { alvo = c.preco * 0.97; motivo = `${d} dias no pátio: baixar 3% ajuda a girar (ou destaque no Instagram)`; }
    else if (d > 45 && !leads30) { alvo = c.preco * 0.97; motivo = `${d} dias sem nenhum lead no último mês: baixar 3%`; }
    else if (fp && fp > 110) { alvo = c.fipe * 1.05; motivo = `${fp}% da FIPE: acima do mercado`; }
    if (!alvo) return Object.assign(base, { motivo: leads30 >= 3 ? `Muita procura (${leads30} leads no mês): manter o preço` : d <= 30 ? 'Chegou há pouco: manter' : 'Preço ok por enquanto' });
    alvo = Math.floor((alvo + 100) / 500) * 500 - 100;
    const piso = Math.max(+c.precoMinimo || 0, money() ? D.custoCarro(c) : 0);
    if (piso && alvo < piso) { alvo = Math.ceil(piso / 100) * 100; motivo += ' (parado no mínimo)'; }
    if (!piso && money()) motivo += ' · sem custo nem preço mínimo cadastrados: confira antes';
    if (alvo >= c.preco) return Object.assign(base, { motivo: 'No limite do preço mínimo: avalie outra ação (destaque, vídeo, anúncio)' });
    return Object.assign(base, { alvo, motivo });
  }
  function giroHTML() {
    const venda = db().carros.filter(c => c.status === 'venda' || c.status === 'reservado');
    const usaCusto = money() && venda.some(D.temCusto);
    const faixas = [['Até 30 dias', 0, 30], ['31 a 60 dias', 31, 60], ['61 a 90 dias', 61, 90], ['Mais de 90 dias', 91, 1e9]].map(fx => { const cs = venda.filter(c => { const d = D.diasEstoque(c); return d >= fx[1] && d <= fx[2]; }); return { label: fx[0], n: cs.length, v: sum(cs, usaCusto ? D.custoCarro : c => c.preco) }; });
    const rows = venda.map(c => ({ c, s: sugestaoPreco(c) })).sort((a, b) => (b.s.alvo ? 1 : 0) - (a.s.alvo ? 1 : 0) || b.s.d - a.s.d);
    const comFipe = venda.filter(c => c.fipe), semFipe = venda.length - comFipe.length;
    return `<div class="giro-band">${faixas.map((fx, i) => `<div class="gb gb${i}"><small>${fx.label}</small><b>${fx.n} carro${fx.n === 1 ? '' : 's'}</b><span>${kbrl(fx.v)} ${usaCusto ? 'investidos' : 'anunciados'}</span></div>`).join('')}</div>
      <p class="small muted" style="margin:0 0 12px">${comFipe.length ? `Preço médio do estoque: <b>${Math.round(sum(comFipe, D.fipePct) / comFipe.length)}% da FIPE</b>. ` : ''}Sugestões pelo tempo de pátio, pela procura no site e pela FIPE, nunca abaixo do preço mínimo${money() ? ' nem do custo do carro' : ''}. Ao baixar, o site mostra “de/por” sozinho.${semFipe ? ` <b>${semFipe} carro(s) sem FIPE cadastrada</b>: preencha na ficha do carro para comparar.` : ''}</p>
      <div class="giro-list">${rows.map(({ c, s }) => `<div class="giro-i ${s.alvo ? 'has' : ''}">
        <img class="thumb" src="${esc(D.carroFoto(c))}" alt="">
        <div class="grow"><b>${esc(D.carroTitulo(c))} ${c.anoMod}</b><small>${s.d} dias · ${brl(c.preco)}${s.fp ? ' · ' + s.fp + '% FIPE' : ''} · ${s.views} visitas · ${s.leads30} leads/30d${money() && D.temCusto(c) ? ' · margem ' + pct(D.lucroPrevisto(c), c.preco || 1) + '%' : ''}</small><div class="giro-m">${esc(s.motivo)}</div></div>
        ${s.alvo ? `<button class="b sm gold" data-act="preco-aplicar" data-id="${c.id}" data-v="${s.alvo}">Baixar p/ ${brl(s.alvo)}</button>` : `<button class="b sm icon" data-act="carro-editar" data-id="${c.id}" aria-label="Editar">${IC.edit}</button>`}
      </div>`).join('') || '<div class="empty">Nenhum carro à venda.</div>'}</div>`;
  }

  /* ---------- 3. PORTAIS ---------- */
  function portaisForm(c) {
    return `<div class="portais">${D.PORTAIS.map(p => { const x = (c.portais || {})[p[0]] || {}; return `<div class="portal-row"><label class="check"><input type="checkbox" name="pt_${p[0]}" ${x.on ? 'checked' : ''}>${p[1]}</label><input class="in" name="pl_${p[0]}" inputmode="url" placeholder="link do anúncio (opcional)" value="${esc(x.link || '')}"></div>`; }).join('')}</div>`;
  }
  function portaisSave(c, f) {
    const old = c.portais || {};
    c.portais = D.PORTAIS.reduce((o, p) => { const on = f['pt_' + p[0]].checked, link = f['pl_' + p[0]].value.trim(); if (on || link) o[p[0]] = { on, link, desde: on ? ((old[p[0]] || {}).desde || today) : null }; return o; }, {});
  }
  function anuncioTexto(c) {
    const cfg = db().config;
    return [`${D.carroNome(c)}`, [D.km(c.km), c.cambio, c.combustivel, c.cor].filter(Boolean).join(' · '), `Preço: ${brl(c.preco)}`,
      (c.opcionais || []).length ? 'Opcionais: ' + c.opcionais.join(', ') : '', c.descricao || '',
      D.textoCredito ? '✔ ' + D.textoCredito(c) : '✔ Aceitamos seu usado na troca. Financiamento sujeito à análise de crédito', '',
      `${cfg.loja} · ${cfg.endereco} – ${cfg.cidade}`, `WhatsApp ${cfg.whatsappExibicao}`].filter((x, i, arr) => x !== '' || (i > 0 && arr[i - 1] !== '')).join('\n');
  }
  function copiar(txt, ok) {
    const fb = () => modal({ title: 'Copie o texto', size: 'sm', okOnly: true, ok: 'Fechar', body: `<textarea class="ta" style="min-height:260px" readonly>${esc(txt)}</textarea><p class="small muted">Toque e segure para copiar.</p>` });
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(() => toast(ok || 'Copiado ✓'), fb); else fb();
  }

  /* ---------- 4. DOCUMENTAÇÃO DA VENDA ---------- */
  function docPill(v) {
    const s = D.docStatus(v); if (!s) return '<span class="muted small">—</span>';
    if (s.completo) return pill('ok no-dot', 'Concluída');
    if (s.restam < 0 && !s.comunicada) return pill('bad no-dot', 'Atrasada ' + (-s.restam) + 'd');
    return pill((s.restam <= 10 && !s.comunicada ? 'warn' : 'no-dot') + ' no-dot', `${s.feitos}/${s.total} · ${s.comunicada ? 'comunicada' : Math.max(0, s.restam) + 'd'}`);
  }
  function docsHTML(v) {
    const s = D.docStatus(v);
    if (!s) return `<div class="doc-box"><p class="small muted" style="margin:0 0 8px">Esta venda é de antes do controle de documentação.</p>${!isVend() ? '<button type="button" class="b sm" id="doc-start">Controlar documentação desta venda</button>' : ''}</div>`;
    return `<div class="doc-box"><div class="doc-h">${docPill(v)}<small>Prazo legal da comunicação de venda: ${D.dateBR(D.addDays(v.data, D.DOC_PRAZO))}</small></div>
      ${D.DOC_ITENS.map(k => `<label class="check"><input type="checkbox" data-doc="${k[0]}" ${v.docs[k[0]] ? 'checked' : ''} ${isVend() ? 'disabled' : ''}>${esc(k[1])}${v.docs[k[0]] ? ` <small class="muted">· ${D.dateBR(v.docs[k[0]])}</small>` : ''}</label>`).join('')}</div>`;
  }

  /* ---------- 5. CRÉDITO NO LEAD ---------- */
  function credPill(l) {
    const cs = D.creditoStatus(l); if (!cs) return '';
    return pill((cs === 'aprovado' ? 'ok' : cs === 'analise' ? 'warn' : 'bad') + ' no-dot', cs === 'aprovado' ? 'Crédito aprovado' : cs === 'analise' ? 'Crédito em análise' : 'Crédito recusado');
  }
  function bancoRow(b = {}) {
    return `<div class="bank-row"><select class="sel" name="bk_banco" aria-label="Banco">${D.BANCOS.map(x => `<option ${b.banco === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <select class="sel" name="bk_status" aria-label="Situação">${Object.keys(D.CRED_STATUS).map(k => `<option value="${k}" ${(b.status || 'enviado') === k ? 'selected' : ''}>${D.CRED_STATUS[k]}</option>`).join('')}</select>
      <input class="in" type="number" inputmode="numeric" name="bk_valor" placeholder="Valor aprovado" value="${esc(b.valor || '')}">
      <input class="in" type="number" inputmode="numeric" name="bk_parcela" placeholder="Parcela R$" value="${esc(b.parcela || '')}">
      <input class="in" type="number" inputmode="numeric" name="bk_prazo" placeholder="Nº parcelas" value="${esc(b.prazo || '')}">
      <button type="button" class="b icon ghost" data-bk-rm aria-label="Remover banco">${IC.trash}</button></div>`;
  }
  function credHTML(l) {
    const c = l.credito || {};
    return `<details class="cred" ${(c.bancos || []).length ? 'open' : ''}><summary>${IC.wallet}<span>Crédito / financiamento</span>${credPill(l)}</summary>
      <div class="grid-form" style="margin-top:12px">
        <label class="fl"><span>CPF</span><input class="in" name="cr_cpf" inputmode="numeric" value="${esc(c.cpf || '')}" placeholder="000.000.000-00"></label>
        <label class="fl"><span>Nascimento</span><input class="in" type="date" name="cr_nasc" value="${esc(c.nascimento || '')}"></label>
        <label class="fl"><span>Renda mensal (R$)</span><input class="in" type="number" inputmode="numeric" name="cr_renda" value="${esc(c.renda || '')}"></label>
        <label class="fl"><span>Entrada disponível (R$)</span><input class="in" type="number" inputmode="numeric" name="cr_entrada" value="${esc(c.entrada || '')}"></label>
      </div>
      <div class="cred-bancos" id="cred-bancos">${(c.bancos || []).map(bancoRow).join('')}</div>
      <button type="button" class="b sm" id="add-banco">${IC.plus}Enviar para um banco</button>
      <p class="small muted" style="margin:8px 0 0">Dados usados só para a análise de crédito deste cliente (LGPD).</p></details>`;
  }
  function credMount(el) {
    const box = $('#cred-bancos', el); if (!box) return;
    $('#add-banco', el).onclick = () => { box.insertAdjacentHTML('beforeend', bancoRow()); };
    box.addEventListener('click', e => { const b = e.target.closest('[data-bk-rm]'); if (b) b.closest('.bank-row').remove(); });
  }
  function credSave(l, f, el) {
    const antes = ((l.credito || {}).bancos || []).map(b => b.banco + ':' + b.status).join('|');
    const bancos = $$('.bank-row', el).map(r => ({ banco: $('[name=bk_banco]', r).value, status: $('[name=bk_status]', r).value, valor: +$('[name=bk_valor]', r).value || 0, parcela: +$('[name=bk_parcela]', r).value || 0, prazo: +$('[name=bk_prazo]', r).value || 0 }));
    l.credito = { cpf: f.cr_cpf.value.trim(), nascimento: f.cr_nasc.value || '', renda: +f.cr_renda.value || 0, entrada: +f.cr_entrada.value || 0, bancos };
    const depois = bancos.map(b => b.banco + ':' + b.status).join('|');
    if (antes !== depois && bancos.length) { l.historico = l.historico || []; l.historico.push({ data: D.nowISO(), texto: 'Crédito: ' + bancos.map(b => b.banco + ' ' + D.CRED_STATUS[b.status].toLowerCase() + (b.status === 'aprovado' && b.valor ? ' (' + brl(b.valor) + ')' : '')).join(', '), autor: S.user.nome }); }
  }
  function leadExtras(l) {
    const t = [], cp = credPill(l), a = avs().find(x => x.leadId === l.id);
    if (cp) t.push(cp);
    if (a) t.push(pill('info no-dot', a.status === 'comprado' ? 'Carro comprado' : 'Carro avaliado'));
    return t.length ? `<div class="krow2">${t.join('')}</div>` : '';
  }

  /* =====================================================================
     PONTE PARA A ASSISTENTE DE IA (assets/js/ia.js)
     A assistente usa as mesmas telas, regras e permissões do painel.
     ===================================================================== */
  window.LojaPainel = {
    get user() { return S.user; }, get view() { return S.view; },
    VIEWS, CARGOS, STATUS, ETAPAS, PAG, CAT_SAIDA, CAT_ENTRADA, AG_STATUS,
    isDir, isVend, money, canView, me, toast, persist, render, modal, closeModal, confirmBox, openWa,
    carModal, carActions, leadModal, leadMove, agendaModal, saleModal, printProposta, printRelatorio, instaArt, avModal, printLaudo
  };

  /* =====================================================================
     INÍCIO
     ===================================================================== */
  function boot() {
    S.user = D.session();
    if (!S.user || !S.user.ativo) return login();
    shell(); render();
  }
  window.addEventListener('hashchange', () => { if (S.user && $('#content')) render(); });
  document.addEventListener('loja:db-changed', () => { if (S.user && $('#content') && !$('.modal-bg')) render(); });
  document.addEventListener('DOMContentLoaded', boot);
})();
