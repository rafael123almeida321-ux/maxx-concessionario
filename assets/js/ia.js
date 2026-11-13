/* =====================================================================
   Assistente de IA do painel (ia.js) — usa o nome e os dados da loja de config

   Como funciona:
   1. A pessoa escreve (ou fala) no chat.
   2. O painel manda a conversa para /api/ia (função da Netlify, que guarda
      a chave do Groq em segredo) junto com a lista de "ferramentas".
   3. A IA pede ferramentas: "consultar" (lê os dados) ou ações (mudar preço,
      agendar, salvar lead...). As ferramentas rodam AQUI no navegador,
      usando o LojaDB, respeitando o cargo de quem está logado.
   4. Toda ação que muda dados só acontece depois do clique em "Confirmar".

   Na Fase 2 (Supabase) nada aqui muda: as ferramentas usam o LojaDB.
   ===================================================================== */
(() => {
  'use strict';
  const D = window.LojaDB;
  const P = () => window.LojaPainel;
  const API = '/api/ia';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = D.esc, brl = D.brl;
  const db = () => D.load();
  const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  const today = () => D.today();
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  const ss = (k, v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };

  const sv = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    spark: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    send: sv('<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>'),
    x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
    neu: sv('<path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-7.4L4 10"/>'),
    mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    check: sv('<path d="M20 6L9 17l-5-5"/>'),
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.05 2a9.9 9.9 0 0 0-8.5 15l-1.5 5.3 5.4-1.4A9.9 9.9 0 1 0 12.05 2zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3z"/></svg>'
  };

  /* ---------- quem está usando ---------- */
  const U = () => P() && P().user;
  const cargo = () => (U() || {}).cargo;
  const isDir = () => cargo() === 'diretora';
  const isVend = () => cargo() === 'vendedor';
  const isGestao = () => cargo() === 'diretora' || cargo() === 'gerente';
  const me = () => (U() || {}).id;

  function ativa() {
    const c = db().config || {};
    if (c.iaAtiva === false) return false;
    const quem = c.iaCargos || 'todos';
    if (quem === 'diretora') return isDir();
    if (quem === 'gestao') return isGestao();
    return !!U();
  }

  /* =====================================================================
     DADOS → TEXTO CURTO (economiza o limite gratuito)
     ===================================================================== */
  const STATUS = { preparacao: 'em preparação', venda: 'à venda', reservado: 'reservado', vendido: 'vendido' };
  const ETAPA = { novo: 'novo', atendimento: 'em atendimento', qualificado: 'qualificado', proposta: 'proposta', visita: 'visita agendada', vendido: 'vendido', perdido: 'perdido' };
  const ATIVAS = ['novo', 'atendimento', 'qualificado', 'proposta', 'visita'];
  const nomeU = id => (D.getUser(id) || {}).nome || 'sem vendedor';
  const dm = s => s ? D.dateBR(s).slice(0, 5) : '—';
  const mesOk = m => /^\d{4}-\d{2}$/.test(String(m || '')) ? m : D.monthKey(today());
  const lim = (n, max = 25, pad = 12) => Math.max(1, Math.min(max, Number(n) || pad));
  const acharVendedor = nome => { if (!nome) return null; const n = norm(nome); return db().usuarios.find(u => norm(u.nome).includes(n) || n.includes(norm(u.nome.split(' ')[0]))); };
  const temTexto = (txt, ...campos) => { if (!txt) return true; const t = norm(txt).split(/\s+/).filter(Boolean); const h = norm(campos.join(' ')); return t.every(w => h.includes(w)); };

  function linhaCarro(c) {
    const p = D.checklistPct(c);
    let s = `id:${c.id} | ${D.carroNome(c)} | ${D.num(c.km)} km | ${c.cor || '—'} | ${c.cambio} | ${c.carroceria} | ${brl(c.preco)}`;
    if (D.emOferta(c)) s += ` (antes ${brl(c.precoAnterior)})`;
    s += ` | ${STATUS[c.status] || c.status}${c.status !== 'vendido' ? (c.publicado ? ' | no site' : ' | fora do site') : ''} | ${D.diasEstoque(c)} dias${c.status === 'vendido' ? ' até vender' : ' no estoque'}`;
    if (c.status !== 'vendido') s += ` | checklist ${p.ok}/${p.total}`;
    if (c.placa && !isVend()) s += ` | placa ${c.placa}`;
    if (isDir()) {
      s += D.temCusto(c) ? ` | custo ${brl(D.custoCarro(c))} | lucro previsto ${brl(D.lucroPrevisto(c))}` : ' | sem valor de compra cadastrado';
      if (c.precoMinimo) s += ' | mínimo ' + brl(c.precoMinimo);
    }
    if (c.opcionais && c.opcionais.length) s += ` | opcionais: ${c.opcionais.slice(0, 8).join(', ')}`;
    return s;
  }
  const leadsVisiveis = () => db().leads.filter(l => !isVend() || !l.vendedorId || l.vendedorId === me());
  const vendasVisiveis = () => db().vendas.filter(v => !isVend() || v.vendedorId === me());
  const atrasado = l => l.etapa === 'novo' && String(l.criadoEm).length > 10 && D.diffHours(l.criadoEm, D.nowISO()) > 2;

  const CONSULTAS = {
    resumo(a) {
      const mk = mesOk(a.mes), d = db(), cfg = d.config, out = [];
      const corrente = mk === D.monthKey(today());
      out.push(`Mês: ${D.monthLabel(mk)}${corrente ? ' (em andamento, hoje é dia ' + +today().slice(8) + ')' : ''}`);
      if (isVend()) {
        const vs = d.vendas.filter(v => D.monthKey(v.data) === mk && v.vendedorId === me());
        out.push(`Minhas vendas: ${vs.length} de meta ${U().meta || 0} | ${brl(sum(vs, v => v.valor))} | comissão ${brl(sum(vs, v => v.comissao))} (${brl(sum(vs.filter(v => !v.comissaoPaga), v => v.comissao))} a receber)`);
        const ls = leadsVisiveis().filter(l => ATIVAS.includes(l.etapa));
        out.push(`Meus leads ativos: ${ls.filter(l => l.vendedorId === me()).length} | leads livres sem vendedor: ${ls.filter(l => !l.vendedorId).length} | esperando há mais de 2h: ${ls.filter(atrasado).length}`);
        out.push(`Retornos combinados para hoje ou atrasados: ${ls.filter(l => l.vendedorId === me() && l.proximoContato && l.proximoContato <= today()).length}`);
        out.push(`Minha agenda hoje: ${(d.agenda || []).filter(x => x.data === today() && (x.vendedorId === me() || !x.vendedorId) && x.status !== 'cancelado').length}`);
        return out.join('\n');
      }
      const vs = d.vendas.filter(v => D.monthKey(v.data) === mk), fat = sum(vs, v => v.valor);
      let pv = d.vendas.filter(v => D.monthKey(v.data) === D.monthAdd(mk, -1)); if (corrente) pv = pv.filter(v => +v.data.slice(8) <= +today().slice(8));
      out.push(`Vendas: ${vs.length} carros (meta da loja ${cfg.metaLoja}) | faturamento ${brl(fat)} | ticket médio ${brl(vs.length ? fat / vs.length : 0)}`);
      if (isDir()) out.push(`Lucro bruto ${brl(sum(vs, v => v.lucro))} | margem ${fat ? Math.round(sum(vs, v => v.lucro) / fat * 100) : 0}%`);
      out.push(`Mês anterior${corrente ? ' até o mesmo dia' : ''}: ${pv.length} carros | ${brl(sum(pv, v => v.valor))}`);
      const lm = d.leads.filter(l => D.monthKey(l.criadoEm) === mk);
      out.push(`Leads no mês: ${lm.length} | conversão ${lm.length ? Math.round(vs.length / lm.length * 100) : 0}%`);
      const est = d.carros.filter(c => c.status === 'venda' || c.status === 'reservado');
      out.push(`Estoque à venda: ${est.length} carros (${brl(sum(est, c => c.preco))}) | em preparação: ${d.carros.filter(c => c.status === 'preparacao').length} | parados há 60+ dias: ${est.filter(c => D.diasEstoque(c) > 60).length}`);
      const novos = d.leads.filter(l => l.etapa === 'novo');
      out.push(`Leads novos: ${novos.length} | sem vendedor: ${novos.filter(l => !l.vendedorId).length} | esperando há mais de 2h: ${novos.filter(atrasado).length}`);
      out.push(`Agenda de hoje: ${(d.agenda || []).filter(x => x.data === today() && x.status !== 'cancelado').length} compromisso(s)`);
      if (isDir()) {
        const apv = d.vendas.filter(v => v.aprovacao === 'pendente');
        if (apv.length) out.push(`Vendas abaixo do mínimo esperando sua aprovação: ${apv.length}`);
        const contas = d.lancamentos.filter(l => l.pago === false && l.vencimento <= D.addDays(today(), 3));
        out.push(`Contas vencidas ou vencendo em 3 dias: ${contas.length} (${brl(sum(contas, l => l.valor))})`);
        out.push(`Comissões a pagar: ${brl(sum(d.vendas.filter(v => !v.comissaoPaga), v => v.comissao))}`);
      }
      const rank = d.usuarios.filter(u => u.ativo && (u.cargo === 'vendedor' || u.cargo === 'gerente')).map(u => ({ u, vs: vs.filter(v => v.vendedorId === u.id) })).sort((a, b) => b.vs.length - a.vs.length);
      out.push('Ranking: ' + rank.map(r => `${r.u.nome} ${r.vs.length}/${r.u.meta} (${brl(sum(r.vs, v => v.valor))})`).join('; '));
      return out.join('\n');
    },

    carros(a) {
      let cs = db().carros.slice(); const st = a.status || 'estoque';
      if (st === 'estoque') cs = cs.filter(c => c.status !== 'vendido');
      else if (st === 'parados') cs = cs.filter(c => (c.status === 'venda' || c.status === 'reservado') && D.diasEstoque(c) > 60);
      else if (st === 'oferta') cs = cs.filter(c => c.status !== 'vendido' && D.emOferta(c));
      else if (st !== 'todos') cs = cs.filter(c => c.status === st);
      cs = cs.filter(c => temTexto(a.texto, c.marca, c.modelo, c.versao, c.cor, c.placa, c.anoMod, c.carroceria, c.cambio, (c.opcionais || []).join(' ')));
      if (a.preco_min) cs = cs.filter(c => c.preco >= a.preco_min);
      if (a.preco_max) cs = cs.filter(c => c.preco <= a.preco_max);
      if (a.ano_min) cs = cs.filter(c => c.anoMod >= a.ano_min);
      if (a.cambio) cs = cs.filter(c => norm(c.cambio).startsWith(norm(a.cambio).slice(0, 4)));
      if (a.carroceria) cs = cs.filter(c => norm(c.carroceria) === norm(a.carroceria));
      if (st === 'vendido' && a.mes) cs = cs.filter(c => c.dataSaida && D.monthKey(c.dataSaida) === a.mes);
      const ord = { preco: (x, y) => x.preco - y.preco, '-preco': (x, y) => y.preco - x.preco, dias: (x, y) => D.diasEstoque(y) - D.diasEstoque(x), km: (x, y) => x.km - y.km, ano: (x, y) => y.anoMod - x.anoMod };
      cs.sort(ord[a.ordenar] || (st === 'vendido' ? (x, y) => (y.dataSaida || '') > (x.dataSaida || '') ? 1 : -1 : ord.preco));
      const n = lim(a.limite);
      return `${cs.length} carro(s) encontrado(s)${cs.length > n ? ', mostrando ' + n : ''}:\n` + (cs.slice(0, n).map(linhaCarro).join('\n') || 'nenhum');
    },

    vendas(a) {
      const mk = mesOk(a.mes); let vs = vendasVisiveis().filter(v => D.monthKey(v.data) === mk);
      const vd = !isVend() && acharVendedor(a.vendedor); if (vd) vs = vs.filter(v => v.vendedorId === vd.id);
      vs = vs.filter(v => { const c = D.getCarro(v.carroId) || {}, cl = D.getCliente(v.clienteId) || {}; return temTexto(a.texto, c.marca, c.modelo, cl.nome); });
      vs.sort((x, y) => x.data < y.data ? 1 : -1);
      const n = lim(a.limite, 30, 15);
      const head = `${vs.length} venda(s) em ${D.monthLabel(mk)}${vd ? ' de ' + vd.nome : ''} | total ${brl(sum(vs, v => v.valor))}${isDir() ? ' | lucro ' + brl(sum(vs, v => v.lucro)) : ''} | comissões ${brl(sum(vs, v => v.comissao))}`;
      return head + '\n' + vs.slice(0, n).map(v => { const c = D.getCarro(v.carroId); return `id:${v.id} | ${dm(v.data)} | ${D.carroNome(c)} | cliente ${(D.getCliente(v.clienteId) || {}).nome || '—'} | ${nomeU(v.vendedorId)} | ${brl(v.valor)} | ${v.formaPagamento}${v.trocaValor ? ' | troca ' + brl(v.trocaValor) : ''}${isDir() ? ' | lucro ' + brl(v.lucro) : ''} | comissão ${brl(v.comissao)} ${v.comissaoPaga ? 'paga' : 'a pagar'}${v.aprovacao === 'pendente' ? ' | AGUARDANDO APROVAÇÃO' : ''}`; }).join('\n');
    },

    leads(a) {
      let L = leadsVisiveis(); const st = a.status || 'ativos';
      if (st === 'ativos') L = L.filter(l => ATIVAS.includes(l.etapa));
      else if (st === 'atrasados') L = L.filter(atrasado);
      else if (st === 'retorno') L = L.filter(l => ATIVAS.includes(l.etapa) && l.proximoContato && l.proximoContato <= today());
      else if (st !== 'todos') L = L.filter(l => l.etapa === st);
      const vd = !isVend() && acharVendedor(a.vendedor); if (vd) L = L.filter(l => l.vendedorId === vd.id);
      if (a.mes) L = L.filter(l => D.monthKey(l.criadoEm) === a.mes);
      L = L.filter(l => { const c = D.getCarro(l.carroId) || {}; return temTexto(a.texto, l.nome, l.telefone, c.marca, c.modelo, l.mensagem); });
      L.sort((x, y) => x.criadoEm < y.criadoEm ? 1 : -1);
      const n = lim(a.limite, 30, 15);
      return `${L.length} lead(s)${L.length > n ? ', mostrando ' + n : ''}:\n` + (L.slice(0, n).map(l => { const c = D.getCarro(l.carroId); const h = (l.historico || []).slice(-1)[0]; return `id:${l.id} | ${l.nome} | ${l.telefone || 'sem telefone'} | ${c ? D.carroTitulo(c) + ' ' + c.anoMod : 'sem carro'} | ${D.origemLabel(l.origem)} | ${ETAPA[l.etapa] || l.etapa} | ${nomeU(l.vendedorId)} | chegou ${dm(l.criadoEm)} ${D.timeOf(l.criadoEm)}${atrasado(l) ? ' (ESPERANDO RESPOSTA)' : ''}${l.proximoContato ? ' | retorno ' + dm(l.proximoContato) : ''}${h ? ' | última nota: ' + String(h.texto).slice(0, 90) : ''}`; }).join('\n') || 'nenhum');
    },

    agenda(a) {
      const ini = /^\d{4}-\d{2}-\d{2}$/.test(a.data || '') ? a.data : today();
      const fim = D.addDays(ini, Math.max(0, Math.min(31, (a.dias == null ? 7 : a.dias) - 1)));
      let it = (db().agenda || []).filter(x => x.data >= ini && x.data <= fim);
      if (isVend()) it = it.filter(x => x.vendedorId === me() || !x.vendedorId);
      const vd = !isVend() && acharVendedor(a.vendedor); if (vd) it = it.filter(x => x.vendedorId === vd.id);
      it.sort((x, y) => (x.data + x.hora) > (y.data + y.hora) ? 1 : -1);
      return `${it.length} compromisso(s) de ${dm(ini)} a ${dm(fim)}:\n` + (it.slice(0, 40).map(x => { const c = D.getCarro(x.carroId); return `id:${x.id} | ${D.weekday(x.data, true)} ${dm(x.data)} ${x.hora} | ${D.AGENDA_TIPOS[x.tipo] || x.tipo} | ${x.clienteNome} | ${x.telefone || '—'} | ${c ? D.carroTitulo(c) : 'sem carro'} | ${nomeU(x.vendedorId)} | ${x.status}${x.obs ? ' | ' + x.obs : ''}`; }).join('\n') || 'nada agendado');
    },

    clientes(a) {
      const vs = vendasVisiveis(), map = {};
      vs.forEach(v => (map[v.clienteId] = map[v.clienteId] || []).push(v));
      let cs = db().clientes.filter(c => map[c.id] || (!isVend()));
      cs = cs.filter(c => temTexto(a.texto, c.nome, c.telefone, c.email, c.cidade));
      const n = lim(a.limite, 25, 12);
      return `${cs.length} cliente(s)${cs.length > n ? ', mostrando ' + n : ''}:\n` + (cs.slice(0, n).map(c => { const v = (map[c.id] || []).sort((x, y) => x.data < y.data ? 1 : -1); const car = v[0] && D.getCarro(v[0].carroId); return `id:${c.id} | ${c.nome} | ${c.telefone || '—'}${c.email ? ' | ' + c.email : ''} | compras: ${v.length}${car ? ' (última: ' + D.carroTitulo(car) + ' ' + car.anoMod + ' em ' + dm(v[0].data) + ')' : ''}`; }).join('\n') || 'nenhum');
    },

    financeiro(a) {
      if (!isDir()) return 'Sem permissão: só a diretora vê o financeiro.';
      const mk = mesOk(a.mes), L = db().lancamentos.filter(l => D.monthKey(l.data) === mk && l.pago !== false);
      const ent = L.filter(l => l.tipo === 'entrada'), sai = L.filter(l => l.tipo === 'saida');
      const cat = {}; sai.forEach(l => cat[l.categoria] = (cat[l.categoria] || 0) + l.valor);
      const abertas = db().lancamentos.filter(l => l.pago === false).sort((x, y) => x.vencimento > y.vencimento ? 1 : -1);
      return [`Financeiro de ${D.monthLabel(mk)} (só o que já foi pago/recebido)`, `Entradas: ${brl(sum(ent, l => l.valor))} | Saídas: ${brl(sum(sai, l => l.valor))} | Saldo: ${brl(sum(ent, l => l.valor) - sum(sai, l => l.valor))}`,
        'Saídas por categoria: ' + Object.keys(cat).sort((x, y) => cat[y] - cat[x]).map(k => `${k} ${brl(cat[k])}`).join('; '),
        `Contas a pagar em aberto: ${abertas.length} (${brl(sum(abertas, l => l.valor))})`,
        ...abertas.slice(0, 15).map(l => `id:${l.id} | ${l.descricao} | ${l.categoria} | vence ${dm(l.vencimento)}${l.vencimento < today() ? ' VENCIDA' : ''} | ${brl(l.valor)}`)].join('\n');
    },

    avaliacoes(a) {
      let L = (db().avaliacoes || []).slice(); const st = a.status || 'ativas';
      if (isVend()) L = L.filter(x => !x.avaliadorId || x.avaliadorId === me());
      if (st === 'ativas') L = L.filter(x => x.status === 'aberta' || x.status === 'proposta'); else if (st !== 'todas' && st !== 'todos') L = L.filter(x => x.status === st);
      L = L.filter(x => temTexto(a.texto, x.marca, x.modelo, x.clienteNome, x.placa));
      L.sort((x, y) => x.criadoEm < y.criadoEm ? 1 : -1);
      const ST = { aberta: 'em avaliação', proposta: 'proposta enviada', comprado: 'comprado', recusado: 'não fechou' };
      return `${L.length} avaliação(ões) de usados:\n` + (L.slice(0, lim(a.limite, 30, 15)).map(x => `id:${x.id} | ${x.marca} ${x.modelo} ${x.anoMod} | ${D.num(x.km || 0)} km | cliente ${x.clienteNome} | ${x.tipo} | ${ST[x.status]} | FIPE ${x.fipe ? brl(x.fipe) : '—'} | pede ${x.pedido ? brl(x.pedido) : '—'}${!isVend() || x.status !== 'aberta' ? ' | oferta ' + (x.oferta ? brl(x.oferta) : 'sugerida ' + brl(D.avSugestao(x))) : ''} | estado ${D.avNota(x) == null ? '—' : D.avNota(x) + '/100'} | preparo ~${brl(D.avCusto(x))}`).join('\n') || 'nenhuma');
    },

    comissoes(a) {
      const mk = mesOk(a.mes), vs = vendasVisiveis().filter(v => D.monthKey(v.data) === mk);
      const us = isVend() ? [U()] : db().usuarios.filter(u => u.cargo !== 'diretora');
      return `Comissões de ${D.monthLabel(mk)}:\n` + us.map(u => { const x = vs.filter(v => v.vendedorId === u.id); return `${u.nome} | ${x.length} venda(s) | comissão ${brl(sum(x, v => v.comissao))} | a pagar ${brl(sum(x.filter(v => !v.comissaoPaga), v => v.comissao))} | regra: ${D.comissaoRegra(u)}`; }).join('\n') + `\nPendentes de todos os meses: ${brl(sum(vendasVisiveis().filter(v => !v.comissaoPaga), v => v.comissao))}`;
    },

    equipe(a) {
      if (!isGestao()) return 'Sem permissão.';
      const mk = mesOk(a.mes);
      return db().usuarios.map(u => { const n = db().vendas.filter(v => v.vendedorId === u.id && D.monthKey(v.data) === mk).length; return `${u.nome} | ${P().CARGOS[u.cargo]} | ${u.ativo ? 'ativo' : 'inativo'} | ${u.telefone || '—'}${u.cargo !== 'diretora' ? ` | ${n}/${u.meta} vendas no mês` : ''}${isDir() && u.cargo !== 'diretora' ? ' | comissão: ' + D.comissaoRegra(u) : ''}`; }).join('\n');
    }
  };

  /* =====================================================================
     AÇÕES (sempre pedem confirmação)
     Cada uma: validar(args) → erro ou null · descrever(args) → texto do card
               executar(args) → resultado para a IA
     ===================================================================== */
  const carroDe = id => db().carros.find(c => c.id === id);
  const leadDe = id => db().leads.find(l => l.id === id);
  const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const horaOk = s => /^\d{2}:\d{2}$/.test(String(s || ''));

  const ACOES = {
    alterar_carro: {
      validar(a) {
        const c = carroDe(a.carro_id); if (!c) return 'Carro não encontrado. Consulte o estoque para pegar o id.';
        if (c.status === 'vendido') return 'Esse carro já foi vendido.';
        if (isVend()) { if (Object.keys(a).some(k => k !== 'carro_id' && k !== 'status') || (a.status && a.status !== 'reservado')) return 'Vendedor só pode reservar carro. Para outras mudanças, peça à gerência.'; }
        if (!isDir() && (a.preco_minimo != null || a.comentario_loja != null)) return 'Só a diretora muda preço mínimo e o comentário da loja.';
        if (a.status === 'vendido') return 'Venda se registra pela tela de vendas: use abrir com o_que=nova_venda.';
        if (a.status && !['venda', 'reservado', 'preparacao'].includes(a.status)) return 'Status inválido.';
        if (a.preco != null && !(a.preco > 1000)) return 'Preço inválido.';
        if (a.preco == null && a.status == null && a.publicado == null && a.destaque == null && a.preco_minimo == null && a.comentario_loja == null) return 'Nada para mudar.';
        return null;
      },
      descrever(a) {
        const c = carroDe(a.carro_id), m = [];
        if (a.preco != null) m.push(`preço de <b>${brl(c.preco)}</b> para <b>${brl(a.preco)}</b>${a.preco < c.preco ? ' (o site mostra “de/por”)' : ''}`);
        if (a.status) m.push(`status para <b>${STATUS[a.status]}</b>`);
        if (a.publicado != null) m.push(a.publicado ? '<b>publicar no site</b>' : '<b>tirar do site</b>');
        if (a.destaque != null) m.push(a.destaque ? '<b>colocar em destaque</b>' : 'tirar do destaque');
        if (a.preco_minimo != null) m.push(`preço mínimo para <b>${brl(a.preco_minimo)}</b>`);
        if (a.comentario_loja != null) m.push(`comentário da loja: “${esc(a.comentario_loja)}”`);
        return `<b>${esc(D.carroNome(c))}</b><br>Mudar ${m.join(', ')}.`;
      },
      executar(a) {
        const c = carroDe(a.carro_id), antes = c.preco;
        if (a.preco != null) { c.preco = Math.round(a.preco); if (c.preco < antes && !(c.precoAnterior > antes)) c.precoAnterior = antes; if (c.precoAnterior && c.precoAnterior <= c.preco) c.precoAnterior = 0; }
        if (a.status) c.status = a.status;
        if (a.publicado != null) c.publicado = !!a.publicado;
        if (c.status === 'preparacao') c.publicado = false;
        if (a.destaque != null) c.destaque = !!a.destaque;
        if (a.preco_minimo != null) c.precoMinimo = Math.round(a.preco_minimo);
        if (a.comentario_loja != null) c.comentarioLoja = String(a.comentario_loja).trim();
        P().persist('Carro atualizado ✓', `IA: ${U().nome} alterou ${D.carroTitulo(c)}`);
        return 'Feito. Agora: ' + linhaCarro(c);
      }
    },

    salvar_lead: {
      validar(a) {
        if (a.lead_id) { const l = leadDe(a.lead_id); if (!l) return 'Lead não encontrado.'; if (isVend() && l.vendedorId && l.vendedorId !== me()) return 'Esse lead é de outro vendedor.'; }
        else if (!a.nome) return 'Para criar um lead novo preciso pelo menos do nome.';
        if (a.carro_id && !carroDe(a.carro_id)) return 'Carro não encontrado.';
        if (a.etapa && !ETAPA[a.etapa]) return 'Etapa inválida.';
        if (a.proximo_contato && !dataOk(a.proximo_contato)) return 'Data de retorno deve ser AAAA-MM-DD.';
        if (a.vendedor && !isVend() && !acharVendedor(a.vendedor)) return 'Vendedor não encontrado.';
        return null;
      },
      descrever(a) {
        const l = a.lead_id && leadDe(a.lead_id), m = [];
        if (a.nome && !l) m.push(`nome <b>${esc(a.nome)}</b>`);
        if (a.telefone) m.push(`telefone ${esc(a.telefone)}`);
        if (a.carro_id) m.push(`interesse no <b>${esc(D.carroTitulo(carroDe(a.carro_id)))}</b>`);
        if (a.etapa) m.push(`etapa <b>${ETAPA[a.etapa]}</b>`);
        if (a.vendedor && !isVend()) m.push(`vendedor <b>${esc(acharVendedor(a.vendedor).nome)}</b>`);
        if (a.proximo_contato) m.push(`retorno em <b>${D.dateBR(a.proximo_contato)}</b>`);
        if (a.nota) m.push(`anotação: “${esc(a.nota)}”`);
        if (a.origem && !l) m.push(`origem ${esc(D.origemLabel(a.origem))}`);
        return l ? `Atualizar o lead <b>${esc(l.nome)}</b>: ${m.join(', ') || 'sem mudanças'}.` : `Criar lead novo: ${m.join(', ')}.`;
      },
      executar(a) {
        const d = db(); let l = a.lead_id && leadDe(a.lead_id); const novo = !l;
        if (novo) { l = { id: D.uid('ld'), nome: String(a.nome).trim(), telefone: a.telefone || '', carroId: a.carro_id || null, origem: a.origem || 'loja', mensagem: a.nota || '', etapa: 'novo', vendedorId: isVend() ? me() : null, criadoEm: D.nowISO(), historico: [{ data: D.nowISO(), texto: 'Lead cadastrado pela assistente', autor: U().nome }], primeiroContatoEm: null, proximoContato: null }; d.leads.unshift(l); }
        else { if (a.telefone) l.telefone = a.telefone; if (a.carro_id) l.carroId = a.carro_id; if (a.nome) l.nome = a.nome; if (a.nota) l.historico.push({ data: D.nowISO(), texto: a.nota, autor: U().nome }); }
        if (a.etapa && a.etapa !== l.etapa) P().leadMove(l, a.etapa);
        if (a.vendedor && !isVend()) { const v = acharVendedor(a.vendedor); l.vendedorId = v.id; l.historico.push({ data: D.nowISO(), texto: 'Atribuído a ' + v.nome, autor: U().nome }); }
        if (isVend() && !l.vendedorId) l.vendedorId = me();
        if (a.proximo_contato) l.proximoContato = a.proximo_contato;
        P().persist(novo ? 'Lead cadastrado ✓' : 'Lead atualizado ✓', `IA: ${novo ? 'cadastrou' : 'atualizou'} lead ${l.nome}`);
        return `Feito. Lead id:${l.id} | ${l.nome} | ${ETAPA[l.etapa]} | ${nomeU(l.vendedorId)}${l.proximoContato ? ' | retorno ' + dm(l.proximoContato) : ''}`;
      }
    },

    agendar: {
      validar(a) {
        if (!D.AGENDA_TIPOS[a.tipo]) return 'Tipo inválido: visita, test-drive, entrega, avaliacao ou outro.';
        if (!dataOk(a.data)) return 'Data deve ser AAAA-MM-DD.';
        if (!horaOk(a.hora)) return 'Hora deve ser HH:MM.';
        if (!a.cliente) return 'Falta o nome do cliente.';
        if (a.carro_id && !carroDe(a.carro_id)) return 'Carro não encontrado.';
        if (a.vendedor && !isVend() && !acharVendedor(a.vendedor)) return 'Vendedor não encontrado.';
        if (a.data < today()) return 'Essa data já passou.';
        return null;
      },
      descrever(a) {
        const c = a.carro_id && carroDe(a.carro_id);
        return `<b>${esc(D.AGENDA_TIPOS[a.tipo])}</b> com <b>${esc(a.cliente)}</b><br>${esc(D.weekday(a.data))}, ${D.dateBR(a.data)} às ${esc(a.hora)}${c ? '<br>Carro: ' + esc(D.carroTitulo(c) + ' ' + c.anoMod) : ''}${a.telefone ? '<br>Telefone: ' + esc(a.telefone) : ''}${a.vendedor && !isVend() ? '<br>Vendedor: ' + esc(acharVendedor(a.vendedor).nome) : ''}${a.obs ? '<br>Obs.: ' + esc(a.obs) : ''}`;
      },
      executar(a) {
        const v = isVend() ? me() : ((acharVendedor(a.vendedor) || {}).id || null);
        const x = D.addAgenda({ tipo: a.tipo, data: a.data, hora: a.hora, clienteNome: String(a.cliente).trim(), telefone: a.telefone || '', carroId: a.carro_id || null, vendedorId: v, obs: a.obs || '', origem: 'painel' });
        P().persist('Agendado ✓', `IA: agendou ${D.AGENDA_TIPOS[a.tipo]} com ${a.cliente}`);
        return `Feito. Agendamento id:${x.id} em ${D.dateBR(x.data)} ${x.hora}.`;
      }
    },

    lancar_financeiro: {
      so: 'diretora',
      validar(a) {
        if (!isDir()) return 'Só a diretora lança no financeiro.';
        if (!['entrada', 'saida'].includes(a.tipo)) return 'tipo deve ser entrada ou saida.';
        if (!(a.valor > 0)) return 'Valor inválido.';
        if (!a.descricao) return 'Falta a descrição.';
        if (a.data && !dataOk(a.data)) return 'Data deve ser AAAA-MM-DD.';
        if (a.vencimento && !dataOk(a.vencimento)) return 'Vencimento deve ser AAAA-MM-DD.';
        return null;
      },
      cat(a) { const lista = a.tipo === 'entrada' ? P().CAT_ENTRADA : P().CAT_SAIDA; return lista.find(c => norm(c) === norm(a.categoria)) || lista.find(c => norm(c).includes(norm(a.categoria || '~'))) || 'Outros'; },
      descrever(a) { const pago = a.pago !== false; return `${a.tipo === 'entrada' ? 'Entrada' : pago ? 'Saída' : '<b>Conta a pagar</b>'} de <b>${brl(a.valor)}</b><br>${esc(a.descricao)} · ${esc(this.cat(a))}<br>${pago ? 'Data: ' + D.dateBR(a.data || today()) : 'Vence em ' + D.dateBR(a.vencimento || a.data || today())}`; },
      executar(a) {
        const pago = a.pago !== false, data = a.data || today();
        const l = { id: D.uid('l'), data: pago ? data : (a.vencimento || data), tipo: a.tipo, categoria: this.cat(a), descricao: String(a.descricao).trim(), valor: Math.round(a.valor), ref: null, pago, vencimento: a.vencimento || data };
        db().lancamentos.push(l);
        P().persist('Lançamento salvo ✓', `IA: lançou ${l.descricao}`);
        return `Feito. ${l.tipo} de ${brl(l.valor)} (${l.categoria}) ${pago ? 'registrada' : 'como conta a pagar até ' + dm(l.vencimento)}.`;
      }
    },

    comunicado: {
      so: 'gestao',
      validar(a) { if (!isGestao()) return 'Só diretora e gerente publicam comunicados.'; if (!a.titulo || !a.texto) return 'Falta título ou texto.'; return null; },
      descrever(a) { return `Publicar para a equipe${a.fixado ? ' (fixado no topo)' : ''}:<br><b>${esc(a.titulo)}</b><br>${esc(a.texto).replace(/\n/g, '<br>')}`; },
      executar(a) {
        db().comunicados.unshift({ id: D.uid('cm'), titulo: String(a.titulo).trim(), texto: String(a.texto).trim(), data: today(), autorId: me(), fixado: !!a.fixado, leituras: [] });
        P().persist('Comunicado publicado ✓', 'IA: publicou comunicado');
        return 'Feito. Comunicado publicado para a equipe.';
      }
    }
  };

  /* ---------- abrir telas e documentos (não muda dados) ---------- */
  function abrir(a) {
    const p = P(), c = a.id && carroDe(a.id);
    const fechaNoCelular = () => { if (window.innerWidth < 760) fechar(); };
    switch (a.o_que) {
      case 'tela': { const v = p.VIEWS.find(x => x.id === a.tela && p.canView(x)); if (!v) return 'Tela inexistente ou sem permissão. Telas: ' + p.VIEWS.filter(p.canView).map(x => x.id).join(', '); location.hash = '#' + v.id; fechaNoCelular(); return 'Aberta a tela ' + v.label + '.'; }
      case 'carro': if (!c) return 'Carro não encontrado.'; fechaNoCelular(); p.carActions(c.id); return 'Abertas as ações do carro (proposta, arte, link, checklist).';
      case 'editar_carro': if (!c) return 'Carro não encontrado.'; if (isVend()) return 'Vendedor não edita carro.'; fechaNoCelular(); p.carModal(c.id); return 'Aberta a ficha do carro para edição.';
      case 'proposta': if (!c) return 'Carro não encontrado.'; fechaNoCelular(); p.printProposta(c, a.cliente || ''); return 'Aberta a proposta em PDF para imprimir ou salvar.';
      case 'arte_instagram': if (!c) return 'Carro não encontrado.'; fechaNoCelular(); p.instaArt(c); return 'Aberta a arte para Instagram (feed e story).';
      case 'nova_venda': if (c && c.status === 'vendido') return 'Carro já vendido.'; fechaNoCelular(); p.saleModal(c ? { carroId: c.id } : {}); return 'Aberta a tela de registrar venda. A pessoa confere e salva.';
      case 'lead': { const l = a.id && leadDe(a.id); if (!l) return 'Lead não encontrado.'; fechaNoCelular(); p.leadModal(l.id); return 'Aberta a ficha do lead.'; }
      case 'relatorio': if (!isGestao()) return 'Sem permissão.'; fechaNoCelular(); p.printRelatorio(mesOk(a.mes)); return 'Aberto o relatório do mês.';
      default: return 'Opção inválida.';
    }
  }

  /* =====================================================================
     FERRAMENTAS que a IA enxerga (descrições curtas = menos tokens)
     ===================================================================== */
  function ferramentas() {
    const f = (name, description, properties, required = []) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } });
    const S = t => ({ type: 'string', description: t }), N = t => ({ type: 'number', description: t }), B = t => ({ type: 'boolean', description: t });
    const tipos = ['resumo', 'carros', 'vendas', 'leads', 'agenda', 'clientes', 'comissoes', 'avaliacoes'].concat(isDir() ? ['financeiro'] : []).concat(isGestao() ? ['equipe'] : []);
    const lista = [
      f('consultar', 'Lê dados reais da loja. Use sempre antes de responder sobre números, carros, pessoas.', {
        tipo: { type: 'string', enum: tipos },
        texto: S('busca livre: marca, modelo, nome, telefone, placa, opcional'),
        status: S('carros: estoque(padrão)|venda|reservado|preparacao|vendido|parados|oferta|todos. leads: ativos(padrão)|atrasados|retorno|novo|atendimento|proposta|visita|vendido|perdido|todos. avaliacoes: ativas(padrão)|aberta|proposta|comprado|recusado|todas'),
        mes: S('AAAA-MM'), data: S('agenda: dia inicial AAAA-MM-DD'), dias: N('agenda: quantos dias (padrão 7)'),
        preco_min: N('R$'), preco_max: N('R$'), ano_min: N('ano modelo'), cambio: S('Automático|Manual'), carroceria: S('Hatch|Sedã|SUV|Picape'),
        vendedor: S('nome'), ordenar: { type: 'string', enum: ['preco', '-preco', 'dias', 'km', 'ano'] }, limite: N('máx. itens')
      }, ['tipo']),
      f('alterar_carro', isVend() ? 'Reserva um carro para o vendedor (status reservado).' : 'Muda preço, status, site ou destaque de um carro.', Object.assign({ carro_id: S('id do carro') , status: { type: 'string', enum: isVend() ? ['reservado'] : ['venda', 'reservado', 'preparacao'] } },
        isVend() ? {} : { preco: N('novo preço R$'), publicado: B('aparece no site'), destaque: B('destaque na home') },
        isDir() ? { preco_minimo: N('R$'), comentario_loja: S('texto “a loja recomenda” da página do carro') } : {}), ['carro_id']),
      f('salvar_lead', 'Cria lead (sem lead_id) ou atualiza um existente.', Object.assign({ lead_id: S('vazio = novo'), nome: S(''), telefone: S(''), carro_id: S(''), origem: { type: 'string', enum: ['loja', 'instagram', 'telefone', 'indicacao', 'site-whatsapp', 'outro'] }, etapa: { type: 'string', enum: Object.keys(ETAPA) }, proximo_contato: S('AAAA-MM-DD'), nota: S('anotação no histórico') }, isVend() ? {} : { vendedor: S('nome') })),
      f('agendar', 'Agenda visita, test drive, entrega ou avaliação.', Object.assign({ tipo: { type: 'string', enum: Object.keys(D.AGENDA_TIPOS) }, data: S('AAAA-MM-DD'), hora: S('HH:MM'), cliente: S('nome'), telefone: S(''), carro_id: S(''), obs: S('') }, isVend() ? {} : { vendedor: S('nome') }), ['tipo', 'data', 'hora', 'cliente']),
      f('abrir', 'Abre algo na tela para a pessoa: tela do painel, ações do carro, proposta PDF, arte de Instagram, registrar venda, ficha do lead, relatório.', {
        o_que: { type: 'string', enum: ['tela', 'carro', 'proposta', 'arte_instagram', 'nova_venda', 'lead'].concat(isVend() ? [] : ['editar_carro']).concat(isGestao() ? ['relatorio'] : []) },
        tela: { type: 'string', enum: P().VIEWS.filter(P().canView).map(v => v.id) }, id: S('id do carro ou lead'), cliente: S('nome p/ proposta'), mes: S('AAAA-MM')
      }, ['o_que']),
      f('preparar_whatsapp', 'Mostra um botão para a pessoa abrir o WhatsApp com a mensagem pronta.', { telefone: S('com DDD'), texto: S('mensagem') }, ['telefone', 'texto'])
    ];
    if (isGestao()) lista.push(f('comunicado', 'Publica um comunicado para a equipe.', { titulo: S(''), texto: S(''), fixado: B('') }, ['titulo', 'texto']));
    if (isDir()) lista.push(f('lancar_financeiro', 'Lança entrada, saída ou conta a pagar (pago=false).', { tipo: { type: 'string', enum: ['entrada', 'saida'] }, valor: N('R$'), descricao: S(''), categoria: S((P().CAT_SAIDA || []).join('|')), data: S('AAAA-MM-DD'), pago: B('false = conta a pagar'), vencimento: S('AAAA-MM-DD') }, ['tipo', 'valor', 'descricao']));
    return lista;
  }

  function sistema() {
    const u = U(), cfg = db().config, h = today();
    const perm = isDir() ? 'Ela é a dona: pode ver e fazer tudo.' : cargo() === 'gerente' ? 'Gerente: NÃO vê custos, lucro, preço mínimo nem financeiro.' : 'Vendedor: só vê os próprios leads, vendas, clientes e comissões; NÃO vê custo, lucro, preço mínimo nem financeiro; só pode reservar carro.';
    return [
      `Você é a assistente de IA do painel da ${cfg.loja}, loja de seminovos em ${cfg.bairro ? cfg.bairro + ', ' : ''}${cfg.cidade}${cfg.dono ? ', de ' + cfg.dono : ''}. Fala com ${u.nome} (${P().CARGOS[u.cargo]}). ${perm}`,
      `Hoje é ${D.weekday(h)}, ${D.dateBR(h)}. Loja: ${cfg.endereco}, ${cfg.horario}. WhatsApp ${cfg.whatsappExibicao}. Taxa do simulador ${cfg.taxaJuros}% a.m.${cfg.modoDemo ? ' ATENÇÃO: o painel está em modo demonstração, os dados são fictícios.' : ''}`,
      'Regras:',
      '- Português do Brasil, tom caloroso, respeitoso e direto. Respostas curtas; listas curtas; valores em R$. Sem tabelas.',
      '- Para qualquer dado da loja, use a ferramenta consultar. Nunca invente carros, preços, nomes ou números.',
      '- Os ids (id:...) são só para usar nas ferramentas: nunca mostre ids para a pessoa.',
      '- Para mudar algo, chame a ferramenta de ação direto (o sistema mostra um botão Confirmar). Não pergunte "posso?" antes. Se o resultado disser que cancelou, aceite.',
      '- Venda se registra só pela tela: use abrir o_que=nova_venda.',
      '- Datas relativas ("amanhã", "sábado") viram AAAA-MM-DD a partir de hoje.',
      '- Você também escreve mensagens de WhatsApp, posts e legendas de Instagram e textos de anúncio no estilo da loja (acolhedor e direto; frase da loja: "' + cfg.slogan + '"). Para mandar mensagem a um cliente, use preparar_whatsapp.',
      '- Se pedirem algo fora do seu alcance ou sem permissão, explique em uma frase.'
    ].join('\n');
  }

  /* =====================================================================
     CONVERSA
     ===================================================================== */
  const ST = { hist: [], ui: [], busy: false, open: false, uid: null };
  const chave = () => 'loja_ia_chat_' + me();
  function salvar() { ss(chave(), { hist: ST.hist.slice(-60), ui: ST.ui.slice(-80) }); }
  function carregar() {
    const s = ss(chave()) || { hist: [], ui: [] };
    ST.hist = s.hist || []; ST.ui = (s.ui || []).map(x => x.tipo === 'acao' && x.estado === 'pendente' ? Object.assign(x, { estado: 'cancelado' }) : x);
    /* chamada de ferramenta sem resposta (página recarregada no meio) → fecha como cancelada */
    const last = ST.hist[ST.hist.length - 1];
    if (last && last.role === 'assistant' && last.tool_calls) last.tool_calls.forEach(t => ST.hist.push({ role: 'tool', tool_call_id: t.id, content: 'Cancelado: a página foi recarregada.' }));
    ST.uid = me();
  }

  /* manda só o fim da conversa e encurta resultados antigos (limite grátis por minuto) */
  function histParaEnvio() {
    let h = ST.hist.slice(-18);
    while (h.length && h[0].role !== 'user') h.shift();
    const ultUser = h.map(m => m.role).lastIndexOf('user');
    return h.map((m, i) => (m.role === 'tool' && i < ultUser && m.content.length > 400) ? Object.assign({}, m, { content: m.content.slice(0, 400) + '… [resultado antigo encurtado]' }) : m);
  }

  async function chamarIA() {
    const headers = { 'content-type': 'application/json' };
    const cod = ls('loja_ia_codigo'); if (cod) headers['x-ia-codigo'] = cod;
    let r;
    try { r = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ messages: [{ role: 'system', content: sistema() }].concat(histParaEnvio()), tools: ferramentas() }) }); }
    catch (e) { throw { codigo: 'rede', erro: 'Sem conexão com a assistente. Confira a internet.' }; }
    let data = null; try { data = await r.json(); } catch (e) { /* ok */ }
    if (r.status === 404 || (!data && !r.ok)) throw { codigo: 'sem-funcao', erro: 'A assistente só funciona com o site publicado (Vercel ou Netlify). A função /api/ia não foi encontrada aqui.' };
    if (!r.ok) throw data || { erro: 'Erro ' + r.status };
    return data;
  }

  async function enviar(texto) {
    texto = String(texto || '').trim(); if (!texto || ST.busy) return;
    ST.ui.push({ tipo: 'eu', texto }); ST.hist.push({ role: 'user', content: texto });
    pintar(); salvar();
    await ciclo(0);
  }

  async function ciclo(passo) {
    if (passo > 6) { ST.ui.push({ tipo: 'erro', texto: 'Essa pediu muitos passos seguidos. Pode me pedir de um jeito mais direto?' }); pintar(); return salvar(); }
    ocupado(true, passo ? 'Pensando no resultado…' : 'Pensando…');
    let r;
    try { r = await chamarIA(); }
    catch (e) {
      ocupado(false);
      /* desfaz a última pergunta do histórico da IA para poder tentar de novo */
      while (ST.hist.length && ST.hist[ST.hist.length - 1].role !== 'user') ST.hist.pop();
      if (ST.hist.length && ST.hist[ST.hist.length - 1].role === 'user') ST.hist.pop();
      ST.ui.push({ tipo: 'erro', texto: e.erro || 'Algo deu errado.', codigo: e.codigo, repetir: true });
      pintar(); return salvar();
    }
    ocupado(false);
    const m = r.message || { role: 'assistant', content: '' };
    ST.hist.push(m);
    if (m.content) ST.ui.push({ tipo: 'ia', texto: m.content });
    const calls = m.tool_calls || [];
    if (!calls.length) { if (!m.content) ST.ui.push({ tipo: 'ia', texto: 'Pronto.' }); pintar(); return salvar(); }
    pintar();
    for (const c of calls) {
      let args = {}; try { args = JSON.parse(c.function.arguments || '{}') || {}; } catch (e) { args = null; }
      let res;
      if (!args) res = 'Erro: argumentos inválidos.';
      else res = await rodar(c.function.name, args);
      ST.hist.push({ role: 'tool', tool_call_id: c.id, content: String(res).slice(0, 7000) });
      salvar();
    }
    return ciclo(passo + 1);
  }

  const ROTULO = { resumo: 'Olhando os números da loja…', carros: 'Procurando no estoque…', vendas: 'Olhando as vendas…', leads: 'Olhando os leads…', agenda: 'Olhando a agenda…', clientes: 'Procurando clientes…', financeiro: 'Olhando o financeiro…', comissoes: 'Calculando comissões…', equipe: 'Olhando a equipe…', avaliacoes: 'Olhando as avaliações de usados…' };
  async function rodar(nome, a) {
    try {
      if (nome === 'consultar') { const fn = CONSULTAS[a.tipo]; if (!fn) return 'Tipo de consulta inválido.'; ocupado(true, ROTULO[a.tipo]); const out = fn(a); ocupado(false); ST.ui.push({ tipo: 'passo', texto: ROTULO[a.tipo].replace('…', '') }); pintar(); return out; }
      if (nome === 'abrir') { const out = abrir(a); ST.ui.push({ tipo: 'passo', texto: out }); pintar(); return out; }
      if (nome === 'preparar_whatsapp') { if (D.onlyDigits(a.telefone).length < 10) return 'Telefone inválido.'; ST.ui.push({ tipo: 'wa', telefone: a.telefone, texto: a.texto }); pintar(); return 'Botão do WhatsApp mostrado. A pessoa clica para enviar.'; }
      const ac = ACOES[nome]; if (!ac) return 'Ferramenta desconhecida.';
      const erro = ac.validar(a); if (erro) return 'Não feito: ' + erro;
      const ok = await pedirConfirmacao(ac.descrever(a));
      if (!ok) return 'Cancelado pela pessoa. Não foi feito.';
      const out = ac.executar(a);
      try { P().render(); } catch (e) { /* ok */ }
      return out;
    } catch (e) { console.warn(e); ocupado(false); return 'Erro ao executar: ' + (e.message || e); }
  }

  function pedirConfirmacao(html) {
    return new Promise(res => {
      const item = { tipo: 'acao', html, estado: 'pendente', id: D.uid('ac') };
      ST.ui.push(item); pintar(); salvar();
      ST.resolver = ok => { item.estado = ok ? 'feito' : 'cancelado'; ST.resolver = null; pintar(); salvar(); res(ok); };
    });
  }

  /* =====================================================================
     INTERFACE
     ===================================================================== */
  function md(t) {
    const lines = esc(t).replace(/\r/g, '').split('\n'); let html = '', list = null, table = [];
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\W)\*(?!\s)(.+?)\*(?=\W|$)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\bid:[\w-]+\s*\|?\s*/g, '');
    const flushL = () => { if (list) { html += `</${list}>`; list = null; } };
    const flushT = () => { if (table.length) { const rows = table.filter(r => !/^\|?\s*:?-{2,}/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()))); html += '<div class="ia-tw"><table>' + rows.map((r, i) => '<tr>' + r.map(c => i ? `<td>${c}</td>` : `<th>${c}</th>`).join('') + '</tr>').join('') + '</table></div>'; table = []; } };
    lines.forEach(raw => {
      const l = raw.trim();
      if (/^\|.*\|$/.test(l)) { flushL(); table.push(l); return; } flushT();
      let m;
      if ((m = l.match(/^[-*•]\s+(.*)/))) { if (list !== 'ul') { flushL(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; return; }
      if ((m = l.match(/^\d+[.)]\s+(.*)/))) { if (list !== 'ol') { flushL(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; return; }
      flushL();
      if ((m = l.match(/^#{1,4}\s+(.*)/))) { html += `<p class="ia-h">${inline(m[1])}</p>`; return; }
      if (!l) return;
      html += `<p>${inline(l)}</p>`;
    });
    flushL(); flushT();
    return html;
  }

  function sugestoes() {
    if (isVend()) return ['Quais leads estão esperando minha resposta?', 'Tem SUV automático até R$ 100 mil?', 'Como estão minhas vendas e comissão do mês?', 'O que tenho na agenda esta semana?'];
    if (isDir()) return ['Como está a loja este mês?', 'Quais carros estão parados há mais de 60 dias?', 'Quem está esperando resposta há mais de 2 horas?', 'Quanto tenho de contas para pagar esta semana?', 'Escreve um post de Instagram do carro que chegou por último'];
    return ['Como está a loja este mês?', 'Quais carros estão parados há mais de 60 dias?', 'Quem está esperando resposta?', 'O que tem na agenda hoje?'];
  }

  function mount() {
    if (!U() || !ativa()) return;
    if (ST.uid !== me()) carregar();
    if ($('#ia-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'ia-fab'; fab.className = 'ia-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Abrir assistente de IA');
    fab.innerHTML = `${IC.spark}<span>Assistente</span>`;
    fab.onclick = () => abrirChat();
    const box = document.createElement('aside');
    box.id = 'ia-box'; box.className = 'ia-box'; box.setAttribute('aria-label', 'Assistente de IA'); box.hidden = true;
    box.innerHTML = `<header class="ia-hd"><span class="ia-orb">${IC.spark}</span><div class="grow"><b>Assistente</b><small>IA da ${esc(db().config.loja)}</small></div>
        <button class="b icon ghost sm" id="ia-new" title="Nova conversa" aria-label="Nova conversa">${IC.neu}</button><button class="b icon ghost sm" id="ia-close" title="Fechar" aria-label="Fechar">${IC.x}</button></header>
      <div class="ia-msgs" id="ia-msgs" aria-live="polite"></div>
      <form class="ia-ft" id="ia-form"><textarea id="ia-in" rows="1" placeholder="Pergunte ou peça algo…" aria-label="Mensagem para a assistente"></textarea>
        ${voz() ? `<button type="button" class="ia-mic" id="ia-mic" title="Falar" aria-label="Falar">${IC.mic}</button>` : ''}<button class="ia-send" id="ia-send" aria-label="Enviar">${IC.send}</button></form>
      <p class="ia-note">Ações só acontecem depois que você confirma.</p>`;
    document.body.appendChild(fab); document.body.appendChild(box);
    $('#ia-close').onclick = fechar;
    $('#ia-new').onclick = () => { if (ST.busy) return; ST.hist = []; ST.ui = []; if (ST.resolver) ST.resolver(false); salvar(); pintar(); $('#ia-in').focus(); };
    const inp = $('#ia-in');
    const grow = () => { inp.style.height = 'auto'; inp.style.height = Math.min(140, inp.scrollHeight) + 'px'; };
    inp.addEventListener('input', grow);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#ia-form').requestSubmit(); } });
    $('#ia-form').onsubmit = e => { e.preventDefault(); const t = inp.value; if (!t.trim() || ST.busy) return; inp.value = ''; grow(); enviar(t); };
    if ($('#ia-mic')) $('#ia-mic').onclick = ouvir;
    $('#ia-msgs').addEventListener('click', onClick);
    /* arrastar para a direita fecha (celular) */
    if (window.PainelApp && window.PainelApp.swipe) window.PainelApp.swipe(box, 'right', fechar);
    /* no computador a conversa reabre como estava; no celular o painel sempre abre na tela normal */
    if (ss('loja_ia_aberta_' + me()) && window.innerWidth > 760) abrirChat(true);
  }

  function abrirChat(silencioso) {
    const box = $('#ia-box'); if (!box) return;
    box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); document.body.classList.add('ia-open'); ST.open = true; ss('loja_ia_aberta_' + me(), 1);
    if (window.PainelApp && window.PainelApp.openLayer) window.PainelApp.openLayer('ia', fechar);   // botão voltar do celular fecha a conversa
    pintar(); if (!silencioso && window.innerWidth > 760) setTimeout(() => $('#ia-in').focus(), 60);
  }
  function fechar() {
    const box = $('#ia-box'); if (!box) return;
    if (document.activeElement && box.contains(document.activeElement)) document.activeElement.blur();   // fecha o teclado junto
    box.classList.remove('on'); document.body.classList.remove('ia-open'); ST.open = false; ss('loja_ia_aberta_' + me(), null);
    if (window.PainelApp && window.PainelApp.closeLayer) window.PainelApp.closeLayer('ia');
    setTimeout(() => { if (!ST.open) box.hidden = true; }, 250);
  }

  function pintar() {
    const el = $('#ia-msgs'); if (!el) return;
    const u = U();
    if (!ST.ui.length) {
      el.innerHTML = `<div class="ia-hello"><span class="ia-orb lg">${IC.spark}</span><h3>Oi, ${esc(u.nome.split(' ')[0])}!</h3>
        <p>Sou a assistente do painel. Eu procuro carros, leads, vendas e números da loja, e também faço coisas por você: mudar preço, agendar visita, cadastrar lead, montar proposta, escrever mensagem e post.</p>
        <div class="ia-sugs">${sugestoes().map(s => `<button type="button" class="ia-sug" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
      return;
    }
    el.innerHTML = ST.ui.map(x => {
      if (x.tipo === 'eu') return `<div class="ia-m eu"><div>${esc(x.texto).replace(/\n/g, '<br>')}</div></div>`;
      if (x.tipo === 'ia') return `<div class="ia-m ia"><div>${md(x.texto)}</div></div>`;
      if (x.tipo === 'passo') return `<div class="ia-step">${IC.check}<span>${esc(x.texto)}</span></div>`;
      if (x.tipo === 'wa') return `<div class="ia-card wa"><small>Mensagem para ${esc(x.telefone)}</small><p>${esc(x.texto).replace(/\n/g, '<br>')}</p><div class="ia-row"><button type="button" class="b sm gold" data-wa="${esc(x.telefone)}" data-txt="${esc(x.texto)}">${IC.wa}Abrir no WhatsApp</button><button type="button" class="b sm" data-copy="${esc(x.texto)}">Copiar</button></div></div>`;
      if (x.tipo === 'acao') return `<div class="ia-card acao ${x.estado}"><small>${x.estado === 'pendente' ? 'Confirma esta ação?' : x.estado === 'feito' ? '✓ Feito' : 'Cancelado'}</small><p>${x.html}</p>${x.estado === 'pendente' ? `<div class="ia-row"><button type="button" class="b sm gold" data-ok="1">${IC.check}Confirmar</button><button type="button" class="b sm" data-ok="0">Cancelar</button></div>` : ''}</div>`;
      if (x.tipo === 'erro') return `<div class="ia-card erro"><p>${esc(x.texto)}</p>${x.codigo === 'codigo' ? `<form class="ia-row" data-cod><input class="in" type="password" placeholder="Código de acesso da IA" aria-label="Código de acesso da IA"><button class="b sm gold">Salvar</button></form>` : ''}${x.codigo === 'sem-chave' || x.codigo === 'sem-funcao' ? '<small>Veja o passo a passo em docs/ASSISTENTE-IA.md.</small>' : ''}${x.repetir && x.codigo !== 'codigo' && x === ST.ui[ST.ui.length - 1] ? `<div class="ia-row"><button type="button" class="b sm" data-retry>${IC.neu}Tentar de novo</button></div>` : ''}</div>`;
      return '';
    }).join('') + (ST.busy ? `<div class="ia-typing"><i></i><i></i><i></i><span>${esc(ST.busyTxt || '')}</span></div>` : '');
    el.scrollTop = el.scrollHeight;
    const send = $('#ia-send'); if (send) send.disabled = ST.busy;
  }
  function ocupado(b, txt) { ST.busy = b; ST.busyTxt = txt || ''; pintar(); }

  function onClick(e) {
    const s = e.target.closest('[data-sug]'); if (s) return enviar(s.dataset.sug);
    const ok = e.target.closest('[data-ok]'); if (ok && ST.resolver) return ST.resolver(ok.dataset.ok === '1');
    const wa = e.target.closest('[data-wa]'); if (wa) return P().openWa(wa.dataset.wa, wa.dataset.txt);
    if (e.target.closest('[data-retry]')) return repetir();
    const cp = e.target.closest('[data-copy]'); if (cp) { const t = cp.dataset.copy; if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => P().toast('Mensagem copiada ✓'), () => P().toast('Não deu para copiar')); return; }
  }
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('[data-cod]'); if (!f) return;
    e.preventDefault(); const v = $('input', f).value.trim(); if (!v) return;
    ls('loja_ia_codigo', v); P().toast('Código salvo neste aparelho ✓');
    repetir();
  });
  /* tenta de novo a última pergunta (depois de erro de rede, limite ou código) */
  function repetir() {
    let i = ST.ui.length - 1; while (i >= 0 && ST.ui[i].tipo !== 'eu') i--;
    if (i < 0) return;
    const t = ST.ui[i].texto; ST.ui.splice(i); enviar(t);
  }

  /* ---------- voz (Chrome / Android) ---------- */
  function voz() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function ouvir() {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
    const mic = $('#ia-mic'), inp = $('#ia-in');
    if (ST.rec) { ST.rec.stop(); return; }
    const r = new R(); r.lang = 'pt-BR'; r.interimResults = true; r.continuous = false;
    const base = inp.value ? inp.value + ' ' : '';
    r.onresult = ev => { inp.value = base + Array.from(ev.results).map(x => x[0].transcript).join(''); inp.dispatchEvent(new Event('input')); };
    r.onend = () => { ST.rec = null; mic.classList.remove('on'); if (inp.value.trim()) $('#ia-form').requestSubmit(); };
    r.onerror = () => { ST.rec = null; mic.classList.remove('on'); P().toast('Não consegui ouvir. Permita o microfone ou digite.'); };
    ST.rec = r; mic.classList.add('on'); r.start();
  }

  /* =====================================================================
     CONFIGURAÇÕES (card na aba Configurações, só diretora)
     ===================================================================== */
  function configCard() {
    const c = db().config;
    return `<div class="card" id="ia-cfg-card" style="margin-bottom:16px"><div class="card-h"><div><h3>Assistente de IA</h3><p>Chat que procura dados e faz tarefas no painel. Funciona com a chave gratuita do Groq guardada na hospedagem (Vercel ou Netlify).</p></div><span id="ia-status" class="pill no-dot">verificando…</span></div>
      <form id="ia-cfg" class="grid-form">
        <label class="check c2"><input type="checkbox" name="iaAtiva" ${c.iaAtiva !== false ? 'checked' : ''}>Assistente ligada</label>
        <label class="fl c2"><span>Quem pode usar</span><select class="sel" name="iaCargos">${[['todos', 'Toda a equipe'], ['gestao', 'Só diretora e gerente'], ['diretora', 'Só a diretoria']].map(o => `<option value="${o[0]}" ${(c.iaCargos || 'todos') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <label class="fl c2"><span>Código de acesso neste aparelho (se configurado)</span><input class="in" type="password" name="codigo" value="${esc(ls('loja_ia_codigo') || '')}" placeholder="Opcional"></label>
        <div class="c2" style="display:flex;align-items:flex-end;justify-content:flex-end"><button class="b gold" type="submit">Salvar</button></div>
      </form>
      <p class="small muted" style="margin-top:10px">A IA só lê os dados que o cargo da pessoa pode ver, e nada é alterado sem o clique em “Confirmar”. Conversas ficam só no navegador e somem ao fechar.</p></div>`;
  }
  async function configMount() {
    const f = $('#ia-cfg'); if (!f) return;
    f.onsubmit = e => {
      e.preventDefault(); const c = db().config;
      c.iaAtiva = f.iaAtiva.checked; c.iaCargos = f.iaCargos.value;
      const cod = f.codigo.value.trim(); ls('loja_ia_codigo', cod || null);
      P().persist('Assistente atualizada ✓', 'Alterou a assistente de IA');
      $$('#ia-fab, #ia-box').forEach(x => x.remove()); document.body.classList.remove('ia-open'); mount();
    };
    const st = $('#ia-status');
    try {
      const r = await fetch(API, { headers: { accept: 'application/json' } }); const d = await r.json();
      if (d.configurada) { st.className = 'pill ok'; st.textContent = 'Conectada (' + d.provedor + ')' + (d.codigo ? ' · com código' : ''); }
      else { st.className = 'pill warn'; st.textContent = 'Falta a chave GROQ_API_KEY na hospedagem'; }
    } catch (e) { st.className = 'pill no-dot'; st.textContent = 'Disponível só no site publicado'; }
  }

  document.addEventListener('loja:shell', mount);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ST.open && !$('.modal-bg')) fechar(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j' && $('#ia-box')) { e.preventDefault(); ST.open ? fechar() : abrirChat(); } });

  window.LojaIA = { configCard, configMount, abrir: abrirChat, fechar, enviar, _consultas: CONSULTAS, _ferramentas: ferramentas, _sistema: sistema };
})();
