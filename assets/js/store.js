/* =====================================================================
   LOJA — Camada de dados (store.js) · versão 2
   ---------------------------------------------------------------------
   Hoje os dados ficam no navegador (localStorage) para a demonstração
   funcionar sem servidor. Na Fase 2 (Supabase), este é o ÚNICO arquivo
   que troca — ver supabase/schema.sql e o PDF do plano de execução.
   Site público e Painel usam a mesma base: cadastrou no painel,
   aparece na vitrine.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'maxxs_db_v1';
  var VERSION = 5;
  /* false = painel de verdade: só a identidade e o estoque anunciado pela loja (sem vendas, equipe, leads ou valores inventados).
     true  = demonstração completa com dados fictícios (para apresentar o sistema a outra loja). */
  var DEMO_FICTICIO = true;   /* apresentação: painel com vendas, leads e equipe de EXEMPLO; o site mostra só o estoque real */
  var SESSION = 'maxxs_sessao_v1';

  /* ---------- utilitários ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function nowISO() { var d = new Date(); return iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function parse(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function diffHours(a, b) { var A = new Date(String(a).length > 10 ? a : a + 'T09:00'), B = new Date(String(b).length > 10 ? b : b + 'T09:00'); return (B - A) / 36e5; }
  function monthKey(s) { return String(s).slice(0, 7); }
  function monthAdd(mk, n) { var p = mk.split('-'); var d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var MES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function monthLabel(mk, short) { var p = mk.split('-'); var m = +p[1] - 1; return short ? MES_C[m] + '/' + p[0].slice(2) : MESES[m] + ' de ' + p[0]; }
  function weekday(s, short) { var d = DIAS[parse(s).getDay()]; return short ? d.slice(0, 3) : d; }
  function dateBR(s) { if (!s) return '—'; var p = String(s).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function timeOf(s) { return String(s || '').length > 10 ? String(s).slice(11, 16) : ''; }
  function brl(n, cents) {
    n = Number(n) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  }
  function num(n) { return (Number(n) || 0).toLocaleString('pt-BR'); }
  function km(n) { return num(n) + ' km'; }
  function uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
  function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* gerador pseudo-aleatório com semente (dados de demonstração sempre iguais) */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* imagem provisória (carro ainda sem foto): cartão da marca com o nome do carro */
  var PH_BG = '#F1F2F4', PH_ACC = '#D40000', PH_INK = '#111318';
  function phEsc(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function placeholderFor(c) {
    var marca = c ? phEsc(String(c.marca).toUpperCase()) : '', modelo = c ? phEsc(c.modelo) : '', ano = c ? phEsc(c.anoFab && c.anoFab !== c.anoMod ? c.anoFab + '/' + c.anoMod : c.anoMod) : '';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="' + PH_BG + '"/>' +
      '<path d="M0 470 L800 380 L800 600 L0 600Z" fill="' + PH_INK + '" opacity=".05"/><path d="M60 452 C300 420 560 398 742 392 C760 392 766 402 752 408 C560 418 320 438 60 456Z" fill="' + PH_ACC + '"/>' +
      '<g transform="translate(170 40)"><path d="M250 300c32-5 56-42 104-53 56-13 120-10 160 8 24 11 48 32 64 42 16 3 24 8 24 19v16H236v-18c0-8 6-13 14-14z" fill="none" stroke="' + PH_INK + '" stroke-opacity=".22" stroke-width="7" stroke-linejoin="round"/>' +
      '<circle cx="314" cy="338" r="27" fill="' + PH_BG + '" stroke="' + PH_INK + '" stroke-opacity=".22" stroke-width="7"/><circle cx="522" cy="338" r="27" fill="' + PH_BG + '" stroke="' + PH_INK + '" stroke-opacity=".22" stroke-width="7"/></g>' +
      (c ? '<text x="60" y="168" font-family="Montserrat,Arial,sans-serif" font-weight="700" font-size="30" letter-spacing="5" fill="' + PH_ACC + '">' + marca + '</text>' +
      '<text x="60" y="236" font-family="Montserrat,Arial,sans-serif" font-weight="800" font-style="italic" font-size="64" fill="' + PH_INK + '">' + modelo + '</text>' +
      '<text x="60" y="278" font-family="Manrope,Arial,sans-serif" font-weight="600" font-size="26" fill="' + PH_INK + '" fill-opacity=".55">' + ano + '</text>' : '') +
      '<text x="60" y="540" font-family="Manrope,Arial,sans-serif" font-weight="700" font-size="20" letter-spacing="4" fill="' + PH_INK + '" fill-opacity=".45">FOTOS EM BREVE</text></svg>');
  }
  var PLACEHOLDER = placeholderFor(null);

  /* fotos reais dos carros da loja, dos anúncios dela no portal UsadosBR (out/2026).
     Chave = anoMod|km. Servem até a loja subir as fotos pelo painel; se um link sair do ar, o site mostra o cartão provisório. */
  var FOTO_BASE = 'https://images.usadosbr.com/manipulatedImages/media/gallery/', FOTO_FIM = '-image-760x570-crop.webp';
  var FOTOS_PORTAL = {};
  function fotosPortal(anoMod, km) { var f = FOTOS_PORTAL[anoMod + '|' + km]; return f ? f.map(function (p) { return FOTO_BASE + p + FOTO_FIM; }) : []; }

  /* checklist de preparação/documentação de cada carro */
  var CHECKLIST = [
    ['laudo', 'Laudo cautelar aprovado'], ['vistoria', 'Vistoria / perícia'], ['multas', 'Multas e débitos consultados'],
    ['ipva', 'IPVA e licenciamento em dia'], ['revisao', 'Revisão mecânica'], ['higienizacao', 'Higienização e polimento'],
    ['chave', 'Chave reserva'], ['manual', 'Manual e nota fiscal'], ['fotos', 'Fotos profissionais'], ['transferencia', 'Documento pronto p/ transferência']
  ];

  /* ---------- v5 · avaliação de usados, portais, documentação e crédito ---------- */
  /* checklist de avaliação 360º do carro que o cliente quer vender ou dar na troca */
  var AV_ITENS = [
    ['lataria', 'Lataria (amassados, batidas)'], ['pintura', 'Pintura e repintura'], ['vidros', 'Para-brisa, vidros e retrovisores'],
    ['farois', 'Faróis e lanternas'], ['pneus', 'Pneus e estepe'], ['rodas', 'Rodas'], ['motor', 'Motor (ruído, vazamento, fumaça)'],
    ['cambio', 'Câmbio e embreagem'], ['suspensao', 'Suspensão, direção e freios'], ['ar', 'Ar-condicionado'],
    ['eletrica', 'Elétrica e painel (luzes de alerta)'], ['interior', 'Interior, bancos e forro'], ['docs', 'Documento, débitos, multas e gravame'],
    ['chave', 'Chave reserva e manual']
  ];
  /* portais onde o carro pode estar anunciado */
  var PORTAIS = [['olx', 'OLX'], ['webmotors', 'Webmotors'], ['icarros', 'iCarros'], ['mercadolivre', 'Mercado Livre'], ['mobiauto', 'Mobiauto'], ['marketplace', 'Facebook Marketplace']];
  /* documentação depois da venda (prazo legal de 30 dias para a comunicação de venda) */
  var DOC_ITENS = [['recibo', 'Recibo / ATPV-e assinado e reconhecido'], ['vistoria', 'Vistoria de transferência'], ['comunicacao', 'Comunicação de venda ao Detran'], ['transferencia', 'Transferência concluída'], ['entrega', 'Documento novo entregue ao cliente']];
  var DOC_PRAZO = 30;
  var BANCOS = ['Santander', 'BV', 'Itaú', 'Bradesco', 'Omni', 'Pan', 'Safra', 'C6', 'Porto', 'Outro'];
  var CRED_STATUS = { enviado: 'Em análise', pendencia: 'Com pendência', aprovado: 'Aprovado', recusado: 'Recusado' };

  var SCRIPTS_PADRAO = [
    { id: 's_boasvindas', titulo: 'Primeiro contato', texto: 'Olá, {nome}! Aqui é {vendedor}, da {loja}. Vi seu interesse no {carro}. Ele está disponível, sim! Quer que eu te mande mais fotos e uma simulação de pagamento?' },
    { id: 's_followup', titulo: 'Follow-up (sem resposta)', texto: 'Oi, {nome}, tudo bem? Passando pra saber se ainda tem interesse no {carro}. A gente conseguiu uma condição especial essa semana. Posso te mandar?' },
    { id: 's_visita', titulo: 'Convite para visita', texto: '{nome}, que tal vir conhecer o {carro} pessoalmente? O café é por nossa conta. Estamos na {endereco}. Qual o melhor dia pra você?' },
    { id: 's_confirmacao', titulo: 'Confirmar agendamento', texto: 'Olá, {nome}! Confirmando sua visita na {loja} {quando}. Endereço: {endereco}. Qualquer coisa é só chamar. Te esperamos!' },
    { id: 's_credito', titulo: 'Pedir dados para crédito', texto: '{nome}, pra eu consultar os bancos e buscar a melhor aprovação, me envia por aqui: nome completo, data de nascimento e renda aproximada. Seus dados ficam só com a gente.' },
    { id: 's_posvenda', titulo: 'Pós-venda', texto: 'Oi, {nome}! Aqui é da {loja}. Passando pra saber como está o {carro}. Qualquer coisa que precisar, conte com a gente!' },
    { id: 's_avaliacao', titulo: 'Pedir avaliação no Google', texto: '{nome}, foi uma alegria te atender! Se puder, deixa uma avaliação pra gente no Google, ajuda muito a loja: {google}. Obrigada de coração!' },
    { id: 's_indicacao', titulo: 'Pedir indicação', texto: '{nome}, você conhece alguém que está procurando carro? Indica a {loja}! A gente trata seu indicado com o mesmo carinho que te tratou.' }
  ];

  /* ---------- dados de demonstração ---------- */
  function seed() {
    var r = rng(19681968);
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function between(a, b) { return a + r() * (b - a); }
    function int(a, b) { return Math.floor(between(a, b + 1)); }
    function price(v) { return Math.round(v / 1000) * 1000 - 100; }
    var hoje = today();
    var mesAtual = monthKey(hoje);
    var diaHoje = parse(hoje).getDate();

    /* =============== IDENTIDADE DA LOJA (troque aqui para outra concessionária) =============== */
    var config = {
      modoDemo: DEMO_FICTICIO,
      loja: 'Grupo Maxxs Work Multimarcas',
      marcaCurta: 'Maxxs Work',
      dono: '',                 /* nome do dono(a) se ele(a) for a "cara" da loja; vazio = marca da loja */
      donoCargo: '',
      donoFoto: '',
      logo: 'assets/img/logo.svg',
      logoEscuro: 'assets/img/logo-escuro.svg',
      logoRodape: 'assets/img/logo-branco.svg',
      loginFoto: '',
      icone: 'assets/img/icone.svg',
      slogan: 'Sua parceira na compra, venda ou troca do seu veículo.',
      whatsapp: '551125378630',
      whatsappExibicao: '(11) 2537-8630',
      telefone: '(11) 3467-4211',
      email: '',
      instagram: 'maxxs_multimarcas_1',
      facebook: 'share/184HtYJVkA/',
      site: 'grupomaxxsworkmultimarcas.com.br',
      endereco: 'Av. Marechal Tito, 1881',
      enderecoCompleto: 'Av. Marechal Tito, 1881 (Work) e 2323 (Maxxs)',
      cep: '08115-000',
      bairro: 'São Miguel Paulista',
      cidade: 'São Paulo – SP',
      mapsQuery: 'Av. Marechal Tito, 1881, São Miguel Paulista, São Paulo - SP',
      horario: 'Segunda a sábado, 8h30 às 18h',
      cnpj: '',
      taxaJuros: 1.89,
      metaLoja: 15,
      videoHero: '',
      heroTitulo: 'Seu próximo carro está na Marechal Tito.',
      heroDestaque: 'Marechal Tito',
      heroSub: 'Seminovos e 0km de várias marcas, com preço no site, financiamento pelos bancos parceiros e o seu carro na troca. Duas lojas do Grupo Maxxs Work em São Miguel Paulista.',
      cartaLoja: 'A Maxxs Multimarcas foi fundada com o objetivo de ser sua parceira na compra, venda ou troca do seu veículo.\nAqui você encontra seminovos e 0km de várias marcas, com financiamento pelos bancos parceiros e avaliação do seu carro na troca, tudo explicado antes de assinar.\nVenha conhecer as nossas duas lojas na Av. Marechal Tito. Vai ser um prazer te receber.',
      versiculo: '',
      versiculoRef: '',
      googleReviewUrl: '',
      gaId: '',
      pixelId: '',
      distribuicaoAuto: false,
      rrIndex: 0,
      scripts: SCRIPTS_PADRAO.slice(),
      mostrarIntro: true
    };

    var usuarios = [
      { id: 'u_dir', nome: 'Diretoria', cargo: 'diretora', email: 'diretoria@maxxswork.demo', senha: 'maxxs123', telefone: config.whatsappExibicao, comissaoTipo: 'nenhuma', comissaoValor: 0, meta: 0, ativo: true, admissao: '2015-01-01', cor: '#D40000' },
      { id: 'u_ger', nome: 'Carlos Mendes', cargo: 'gerente', email: 'carlos@maxxswork.demo', senha: '1234', telefone: '(11) 90000-0201', comissaoTipo: 'pct_lucro', comissaoValor: 8, meta: 3, ativo: true, admissao: '2021-03-02', cor: '#7FB3D5' },
      { id: 'u_v1', nome: 'Patrícia Lima', cargo: 'vendedor', email: 'patricia@maxxswork.demo', senha: '1234', telefone: '(11) 90000-0202', comissaoTipo: 'pct_venda', comissaoValor: 1, meta: 5, ativo: true, admissao: '2022-06-13', cor: '#E59866' },
      { id: 'u_v2', nome: 'André Souza', cargo: 'vendedor', email: 'andre@maxxswork.demo', senha: '1234', telefone: '(11) 90000-0203', comissaoTipo: 'fixo', comissaoValor: 500, meta: 4, ativo: true, admissao: '2023-02-01', cor: '#82E0AA' },
      { id: 'u_v3', nome: 'Camila Rocha', cargo: 'vendedor', email: 'camila@maxxswork.demo', senha: '1234', telefone: '(11) 90000-0204', comissaoTipo: 'pct_lucro', comissaoValor: 10, meta: 4, ativo: true, admissao: '2024-01-15', cor: '#C39BD3' }
    ];
    var vendedoresPeso = ['u_v1', 'u_v1', 'u_v1', 'u_v2', 'u_v2', 'u_v3', 'u_v3', 'u_ger'];

    var MODELOS = [
      ['Chevrolet', 'Onix', 'LT 1.0 Turbo', 74000, 'Hatch', 'Automático', 'Flex'],
      ['Hyundai', 'HB20', 'Comfort 1.0', 68000, 'Hatch', 'Manual', 'Flex'],
      ['Volkswagen', 'Polo', 'Highline 200 TSI', 92000, 'Hatch', 'Automático', 'Flex'],
      ['Volkswagen', 'T-Cross', 'Comfortline 200 TSI', 114000, 'SUV', 'Automático', 'Flex'],
      ['Jeep', 'Compass', 'Longitude 1.3 T270', 139000, 'SUV', 'Automático', 'Flex'],
      ['Jeep', 'Renegade', 'Sport 1.3 T270', 99000, 'SUV', 'Automático', 'Flex'],
      ['Toyota', 'Corolla', 'XEi 2.0', 121000, 'Sedã', 'Automático', 'Flex'],
      ['Nissan', 'Kicks', 'SV 1.6', 95000, 'SUV', 'Automático', 'Flex'],
      ['Fiat', 'Strada', 'Freedom 1.3', 99000, 'Picape', 'Manual', 'Flex'],
      ['Fiat', 'Toro', 'Freedom 1.3 Turbo', 129000, 'Picape', 'Automático', 'Flex'],
      ['Fiat', 'Argo', 'Drive 1.0', 69000, 'Hatch', 'Manual', 'Flex'],
      ['Renault', 'Sandero', 'Zen 1.0', 58000, 'Hatch', 'Manual', 'Flex'],
      ['Hyundai', 'Creta', 'Comfort 1.0 Turbo', 118000, 'SUV', 'Automático', 'Flex'],
      ['Chevrolet', 'Tracker', 'LT 1.0 Turbo', 109000, 'SUV', 'Automático', 'Flex'],
      ['Volkswagen', 'Gol', '1.0 MPI', 52000, 'Hatch', 'Manual', 'Flex'],
      ['Honda', 'HR-V', 'EXL 1.5', 128000, 'SUV', 'Automático', 'Flex'],
      ['Chevrolet', 'Prisma', 'LT 1.4', 55000, 'Sedã', 'Manual', 'Flex'],
      ['Nissan', 'Sentra', 'SV 2.0', 89000, 'Sedã', 'Automático', 'Flex'],
      ['Ford', 'Ka', 'SE 1.0', 49000, 'Hatch', 'Manual', 'Flex']
    ];
    var CORES = ['Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 'Azul'];
    var NOMES = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Lucas', 'Mariana', 'Mateus', 'Natália', 'Otávio', 'Paula', 'Rafaela', 'Renato', 'Sabrina', 'Thiago', 'Vanessa', 'Vinícius', 'Aline', 'Caio', 'Débora', 'Elias', 'Fernanda', 'Gustavo', 'Jéssica'];
    var SOBRE = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Barbosa', 'Moreira', 'Teixeira', 'Freitas'];
    var BANCOS = ['Santander', 'BV', 'Itaú', 'Bradesco', 'Omni', 'Pan'];
    function nomeFake() { return pick(NOMES) + ' ' + pick(SOBRE); }
    function telFake() { return '(11) 90000-' + pad(int(10, 99)) + pad(int(10, 99)); }
    function hora() { return pad(int(9, 18)) + ':' + pad(int(0, 5) * 10); }

    var carros = [], vendas = [], clientes = [], lancamentos = [], leads = [], agenda = [];
    function lanc(data, tipo, categoria, descricao, valor, ref, pago, venc) {
      lancamentos.push({ id: uid('l'), data: data, tipo: tipo, categoria: categoria, descricao: descricao, valor: Math.round(valor), ref: ref || null, pago: pago !== false, vencimento: venc || data });
    }
    function custosFake() {
      var c = [{ desc: 'Higienização e polimento', valor: int(4, 9) * 100 }, { desc: 'Documentação / transferência', valor: int(6, 12) * 100 }];
      if (r() < .7) c.push({ desc: 'Mecânica / revisão', valor: int(3, 25) * 100 });
      if (r() < .3) c.push({ desc: 'Funilaria e pintura', valor: int(8, 30) * 100 });
      return c;
    }
    function checklistCompleto() { var o = {}; CHECKLIST.forEach(function (c) { o[c[0]] = true; }); return o; }
    function checklistParcial(n) { var o = {}; CHECKLIST.forEach(function (c, i) { o[c[0]] = i < n; }); return o; }
    function soma(a) { return a.reduce(function (s, x) { return s + x.valor; }, 0); }

    /* histórico de vendas dos últimos 6 meses */
    for (var m = 5; m >= 0; m--) {
      var mk = monthAdd(mesAtual, -m);
      var p = mk.split('-');
      var diasMes = new Date(+p[0], +p[1], 0).getDate();
      var ate = (mk === mesAtual) ? diaHoje : diasMes;
      var qtd = Math.round(int(15, 21) * ate / diasMes);
      for (var i = 0; i < qtd; i++) {
        var md = pick(MODELOS);
        var valor = price(md[3] * between(.88, 1.12));
        var ano = Math.max(2014, Math.min(2025, 2025 - Math.round((140000 - md[3]) / 18000) + int(-2, 1)));
        var data = p[0] + '-' + p[1] + '-' + pad(int(1, ate));
        var entrada = addDays(data, -int(9, 70));
        var compra = Math.round(valor * between(.80, .87) / 100) * 100;
        var custos = custosFake();
        var carro = {
          id: uid('c'), marca: md[0], modelo: md[1], versao: md[2], anoFab: ano - (r() < .5 ? 1 : 0), anoMod: ano,
          km: int(8, 110) * 1000, cambio: md[5], combustivel: md[6], cor: pick(CORES), carroceria: md[4], portas: 4,
          preco: valor, precoCompra: compra, fipe: Math.round(valor * between(1.0, 1.08) / 100) * 100, custos: custos,
          opcionais: [], descricao: '', fotos: [], destaque: false, publicado: false, status: 'vendido',
          dataEntrada: entrada, dataSaida: data, origem: r() < .75 ? 'compra' : 'troca', fornecedor: '', checklist: checklistCompleto()
        };
        carros.push(carro);
        lanc(entrada, 'saida', 'Compra de veículo', 'Compra — ' + md[0] + ' ' + md[1] + ' ' + ano, compra, { tipo: 'carro', id: carro.id });
        lanc(addDays(entrada, 3), 'saida', 'Preparação de veículo', 'Preparação — ' + md[1] + ' ' + ano, soma(custos), { tipo: 'carro', id: carro.id });

        var cli = { id: uid('cl'), nome: nomeFake(), telefone: telFake(), email: '', cidade: 'São Paulo', criadoEm: data, obs: '', demo: true };
        clientes.push(cli);
        var vend = pick(vendedoresPeso);
        var fr = r(), forma = fr < .55 ? 'financiado' : fr < .75 ? 'avista' : 'troca_financiado';
        var ent = forma === 'avista' ? valor : (r() < .5 ? 0 : Math.round(valor * between(.1, .3) / 100) * 100);
        var trocaValor = forma === 'troca_financiado' ? Math.round(valor * between(.25, .45) / 100) * 100 : 0;
        var venda = {
          id: uid('v'), carroId: carro.id, clienteId: cli.id, vendedorId: vend, data: data, valor: valor,
          formaPagamento: forma, entrada: forma === 'avista' ? valor : ent, banco: forma === 'avista' ? '' : pick(BANCOS),
          valorFinanciado: forma === 'avista' ? 0 : Math.max(0, valor - ent - trocaValor),
          trocaValor: trocaValor, trocaDescricao: trocaValor ? pick(MODELOS)[1] + ' ' + int(2012, 2019) : '',
          lucro: 0, comissao: 0, comissaoPaga: false, comissaoPagaEm: null, obs: '', aprovacao: 'aprovada'
        };
        carro.vendaId = venda.id;
        vendas.push(venda);
        /* entrada no caixa = valor − troca (a troca não é dinheiro) */
        lanc(data, 'entrada', 'Venda de veículo', 'Venda — ' + md[0] + ' ' + md[1] + ' ' + ano + (trocaValor ? ' (troca abatida)' : ''), valor - trocaValor, { tipo: 'venda', id: venda.id });
      }
      /* despesas fixas do mês (as que vencem depois de hoje ficam "a pagar") */
      var fixas = [[5, 'Aluguel', 'Aluguel do imóvel', 15000], [5, 'Salários', 'Salários fixos da equipe', 16500], [8, 'Marketing', 'Tráfego pago e Instagram', 3500], [10, 'Contas', 'Energia, água e internet', 2300], [12, 'Serviços', 'Contabilidade', 1200], [20, 'Impostos e taxas', 'Impostos (Simples Nacional)', 6800], [25, 'Serviços', 'Despachante', 1900]];
      fixas.forEach(function (f) {
        var dt = p[0] + '-' + p[1] + '-' + pad(f[0]);
        if (f[0] <= ate) lanc(dt, 'saida', f[1], f[2], f[3] + int(-3, 3) * 50);
        else if (mk === mesAtual) lanc(dt, 'saida', f[1], f[2], f[3], null, false, dt);
      });
    }
    var db = { version: VERSION, criadoEm: hoje, config: config, usuarios: usuarios, carros: carros, vendas: vendas, clientes: clientes, lancamentos: lancamentos, leads: leads, agenda: agenda, comunicados: [], auditoria: [], entregas: [], depoimentos: [], stats: { dias: {}, views: {}, wa: {} } };

    vendas.forEach(function (v) {
      var c = carros.find(function (x) { return x.id === v.carroId; });
      v.lucro = v.valor - c.precoCompra - soma(c.custos);
      v.comissao = calcComissao(v, usuarios.find(function (u) { return u.id === v.vendedorId; }));
      if (monthKey(v.data) !== mesAtual) { v.comissaoPaga = true; v.comissaoPagaEm = monthAdd(monthKey(v.data), 1) + '-05'; }
    });
    for (var m2 = 5; m2 >= 1; m2--) {
      var mk2 = monthAdd(mesAtual, -m2);
      usuarios.forEach(function (u) {
        var tot = vendas.filter(function (v) { return v.vendedorId === u.id && monthKey(v.data) === mk2; }).reduce(function (s, v) { return s + v.comissao; }, 0);
        if (tot > 0) lanc(monthAdd(mk2, 1) + '-05', 'saida', 'Comissões', 'Comissão ' + monthLabel(mk2, true) + ' — ' + u.nome, tot, { tipo: 'comissao', id: u.id + ':' + mk2 });
      });
    }

    /* estoque atual — carros das fotos enviadas (valores ILUSTRATIVOS: confirmar com a loja) */
    /* estoque real anunciado pelo Grupo Maxxs Work (portal Napista + site da loja, 13/11/2026). Cor e opcionais: a loja completa.
       Custo, FIPE e dias de pátio são ESTIMADOS só para a demonstração do painel (DEMO_FICTICIO = true). */
    var estoque = [
      { marca: 'Jaguar', modelo: 'F-Pace', versao: '2.0 Prestige 180cv Diesel', anoFab: 2020, anoMod: 2020, km: 39697, cambio: 'Automático', combustivel: 'Diesel', cor: '', carroceria: 'SUV', preco: 189000, precoCompra: 162500, fipe: 194700, fotos: [], destaque: true, dias: 12, opcionais: [] },
      { marca: 'Fiat', modelo: 'Strada', versao: 'Ultra T200 Flex', anoFab: 2027, anoMod: 2027, km: 900, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'Picape', preco: 137990, precoCompra: 118700, fipe: 142100, fotos: [], destaque: true, dias: 25, opcionais: [] },
      { marca: 'Volkswagen', modelo: 'Tera', versao: '1.0 170 TSI High', anoFab: 2026, anoMod: 2026, km: 3000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 129990, precoCompra: 111800, fipe: 133900, fotos: [], destaque: true, dias: 8, opcionais: [] },
      { marca: 'Toyota', modelo: 'Corolla Cross', versao: '2.0 XR CVT', anoFab: 2023, anoMod: 2023, km: 69730, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 129990, precoCompra: 111800, fipe: 133900, fotos: [], destaque: true, dias: 40, opcionais: [] },
      { marca: 'Nissan', modelo: 'Kicks', versao: 'Sense 1.6 16v Flex', anoFab: 2024, anoMod: 2024, km: 89000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 106990, precoCompra: 92000, fipe: 110200, fotos: [], destaque: true, dias: 18, opcionais: [] },
      { marca: 'Fiat', modelo: 'Argo', versao: 'Drive 1.0 6v Flex', anoFab: 2026, anoMod: 2026, km: 44056, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 82990, precoCompra: 71400, fipe: 85500, fotos: [], destaque: true, dias: 5, opcionais: [] },
      { marca: 'Fiat', modelo: 'Strada', versao: 'Endurance 1.4 Cabine Plus', anoFab: 2023, anoMod: 2023, km: 114873, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Picape', preco: 74990, precoCompra: 64500, fipe: 77200, fotos: [], destaque: false, dias: 33, opcionais: [] },
      { marca: 'Jeep', modelo: 'Renegade', versao: 'Longitude 1.8 4x2 Flex 16v', anoFab: 2021, anoMod: 2021, km: 140000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 73990, precoCompra: 63600, fipe: 76200, fotos: [], destaque: true, dias: 60, opcionais: [] },
      { marca: 'Volkswagen', modelo: 'Polo', versao: 'Track 1.0 Flex 12v', anoFab: 2024, anoMod: 2024, km: 77000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 69990, precoCompra: 60200, fipe: 72100, fotos: [], destaque: false, dias: 21, opcionais: [] },
      { marca: 'Chevrolet', modelo: 'Prisma', versao: 'LTZ 1.4 8v Flexpower', anoFab: 2018, anoMod: 2018, km: 204000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'Sedã', preco: 69990, precoCompra: 60200, fipe: 72100, fotos: ["https://bndvsistemalojistasst.blob.core.windows.net/vehicles-images/sistema.lojistas/1523/1332951/731b1fdb-8cf3-44da-b079-554ec6dfa38d.jpg"], destaque: false, dias: 47, opcionais: [] },
      { marca: 'Fiat', modelo: 'Mobi', versao: 'Like 1.0 Fire Flex', anoFab: 2025, anoMod: 2025, km: 54000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 65990, precoCompra: 56800, fipe: 68000, fotos: [], destaque: false, dias: 14, opcionais: [] },
      { marca: 'Fiat', modelo: 'Mobi', versao: 'Easy 1.0 Fire Flex', anoFab: 2025, anoMod: 2025, km: 32827, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 61990, precoCompra: 53300, fipe: 63800, fotos: [], destaque: false, dias: 9, opcionais: [] },
      { marca: 'Ford', modelo: 'EcoSport', versao: 'Freestyle 2.0 16v Flex', anoFab: 2014, anoMod: 2014, km: 108000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 54990, precoCompra: 47300, fipe: 56600, fotos: [], destaque: false, dias: 70, opcionais: [] },
      { marca: 'Fiat', modelo: 'Mobi', versao: 'Like 1.0 Fire Flex', anoFab: 2021, anoMod: 2021, km: 151745, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 51990, precoCompra: 44700, fipe: 53500, fotos: [], destaque: false, dias: 28, opcionais: [] },
      { marca: 'Renault', modelo: 'Kwid', versao: 'Zen 1.0 Flex 12v', anoFab: 2024, anoMod: 2024, km: 50000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 51990, precoCompra: 44700, fipe: 53500, fotos: [], destaque: false, dias: 11, opcionais: [] },
      { marca: 'Ford', modelo: 'Ka', versao: 'SE Plus 1.0 TiVCT Flex', anoFab: 2020, anoMod: 2020, km: 113861, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 49990, precoCompra: 43000, fipe: 51500, fotos: [], destaque: false, dias: 36, opcionais: [] },
      { marca: 'Renault', modelo: 'Logan', versao: 'Life 1.0 12v Flex', anoFab: 2021, anoMod: 2021, km: 113082, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Sedã', preco: 49990, precoCompra: 43000, fipe: 51500, fotos: [], destaque: false, dias: 19, opcionais: [] },
      { marca: 'Peugeot', modelo: '208', versao: 'Active 1.2 12v Flex', anoFab: 2018, anoMod: 2018, km: 119000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 47990, precoCompra: 41300, fipe: 49400, fotos: ["https://cdn-sistema-lojistas.bndv.com.br/vehicles-images/sistema.lojistas/1523/1522737/990aebc0-6d64-40a4-836f-869a6ff07f7d.webp"], destaque: false, dias: 52, opcionais: [] },
      { marca: 'Hyundai', modelo: 'Tucson', versao: '2.0 16v', anoFab: 2012, anoMod: 2012, km: 208000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 47990, precoCompra: 41300, fipe: 49400, fotos: [], destaque: false, dias: 88, opcionais: [] },
      { marca: 'Nissan', modelo: 'Versa', versao: 'SV 1.6 16v Flex', anoFab: 2016, anoMod: 2016, km: 136000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Sedã', preco: 47990, precoCompra: 41300, fipe: 49400, fotos: [], destaque: false, dias: 24, opcionais: [] },
      { marca: 'Renault', modelo: 'Sandero', versao: 'Expression Hi-Power 1.0 16v', anoFab: 2019, anoMod: 2019, km: 126840, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 43990, precoCompra: 37800, fipe: 45300, fotos: [], destaque: false, dias: 16, opcionais: [] },
      { marca: 'Renault', modelo: 'Sandero', versao: 'Authentique Hi-Flex 1.0 16v', anoFab: 2017, anoMod: 2017, km: 128120, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 42990, precoCompra: 37000, fipe: 44300, fotos: [], destaque: false, dias: 31, opcionais: [] },
      { marca: 'Citroën', modelo: 'Aircross', versao: 'Exclusive Atacama 1.6 Flex 16v', anoFab: 2013, anoMod: 2013, km: 130000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 42990, precoCompra: 37000, fipe: 44300, fotos: [], destaque: false, dias: 64, opcionais: [] },
      { marca: 'Toyota', modelo: 'Etios', versao: 'X 1.3 Flex 16v', anoFab: 2015, anoMod: 2015, km: 176223, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 42990, precoCompra: 37000, fipe: 44300, fotos: [], destaque: false, dias: 27, opcionais: [] },
      { marca: 'Ford', modelo: 'Fiesta', versao: '1.5 16v Flex', anoFab: 2013, anoMod: 2013, km: 235000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 39990, precoCompra: 34400, fipe: 41200, fotos: [], destaque: false, dias: 45, opcionais: [] },
      { marca: 'Peugeot', modelo: '308', versao: 'Griffe 1.6 Turbo Flex 16v', anoFab: 2014, anoMod: 2014, km: 126000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 39990, precoCompra: 34400, fipe: 41200, fotos: [], destaque: false, dias: 38, opcionais: [] },
      { marca: 'Chevrolet', modelo: 'Astra', versao: '2.0 8v Hatch', anoFab: 2010, anoMod: 2010, km: 182000, cambio: 'Automático', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 38990, precoCompra: 33500, fipe: 40200, fotos: [], destaque: false, dias: 81, opcionais: [] },
      { marca: 'Fiat', modelo: 'Doblò', versao: 'Cargo 1.8 8v Flex', anoFab: 2009, anoMod: 2009, km: 290000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Utilitário', preco: 37990, precoCompra: 32700, fipe: 39100, fotos: [], destaque: false, dias: 95, opcionais: [] },
      { marca: 'Fiat', modelo: 'Punto', versao: 'ELX 1.4 Fire Flex 8v', anoFab: 2010, anoMod: 2010, km: 150000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 34990, precoCompra: 30100, fipe: 36000, fotos: [], destaque: false, dias: 57, opcionais: [] },
      { marca: 'Ford', modelo: 'EcoSport', versao: 'XLT 1.6 Flex 8v', anoFab: 2005, anoMod: 2005, km: 192000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'SUV', preco: 28990, precoCompra: 24900, fipe: 29900, fotos: [], destaque: false, dias: 102, opcionais: [] },
      { marca: 'Chevrolet', modelo: 'Celta', versao: '1.0 Super 8v', anoFab: 2010, anoMod: 2010, km: 177000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 28990, precoCompra: 24900, fipe: 29900, fotos: [], destaque: false, dias: 49, opcionais: [] },
      { marca: 'Fiat', modelo: 'Siena', versao: '1.0 MPI', anoFab: 2007, anoMod: 2007, km: 209000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Sedã', preco: 26990, precoCompra: 23200, fipe: 27800, fotos: [], destaque: false, dias: 66, opcionais: [] },
      { marca: 'Volkswagen', modelo: 'Gol City', versao: 'Trend 1.0 Total Flex 8v 4p', anoFab: 2009, anoMod: 2009, km: 250000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Hatch', preco: 26990, precoCompra: 23200, fipe: 27800, fotos: [], destaque: false, dias: 73, opcionais: [] },
      { marca: 'Fiat', modelo: 'Palio Weekend', versao: 'Trekking 1.8 MPI Flex 8v', anoFab: 2010, anoMod: 2010, km: 215000, cambio: 'Manual', combustivel: 'Flex', cor: '', carroceria: 'Perua', preco: 25990, precoCompra: 22400, fipe: 26800, fotos: [], destaque: false, dias: 59, opcionais: [] },
      { marca: 'Fiat', modelo: 'Siena', versao: 'EX 1.0 MPI Fire 16v', anoFab: 2002, anoMod: 2002, km: 190000, cambio: 'Manual', combustivel: 'Gasolina', cor: '', carroceria: 'Sedã', preco: 19999, precoCompra: 17200, fipe: 20600, fotos: [], destaque: false, dias: 110, opcionais: [] }
    ];
    estoque.forEach(function (e) {
      var c = {
        id: 'c_' + slug(e.marca + '-' + e.modelo + '-' + e.anoMod + '-' + e.km), marca: e.marca, modelo: e.modelo, versao: e.versao, anoFab: e.anoFab, anoMod: e.anoMod,
        km: e.km, cambio: e.cambio, combustivel: e.combustivel, cor: e.cor, carroceria: e.carroceria, portas: 4,
        preco: e.preco, precoAnterior: e.precoAnterior || 0, precoMinimo: Math.round(e.preco * 0.95 / 1000) * 1000, precoCompra: e.precoCompra, fipe: e.fipe, custos: custosFake(), opcionais: e.opcionais,
        descricao: e.marca + ' ' + e.modelo + ' ' + e.versao + ' ' + e.anoFab + '/' + e.anoMod + (e.cor ? ', ' + e.cor.toLowerCase() : '') + ', ' + num(e.km) + ' km. ' + textoCredito(e),
        comentarioLoja: e.comentario || '', videoUrl: '',
        fotos: e.fotos.length ? e.fotos : fotosPortal(e.anoMod, e.km), destaque: e.destaque, publicado: e.publicado !== false, status: e.status || 'venda',
        dataEntrada: addDays(hoje, -e.dias), dataSaida: null, origem: 'compra', fornecedor: '', vendaId: null, valoresIlustrativos: true,
        checklist: e.check != null ? checklistParcial(e.check) : checklistCompleto()
      };
      carros.push(c);
      lanc(c.dataEntrada, 'saida', 'Compra de veículo', 'Compra — ' + c.marca + ' ' + c.modelo + ' ' + c.anoMod, c.precoCompra, { tipo: 'carro', id: c.id });
      if (e.dias > 3) lanc(addDays(c.dataEntrada, 3), 'saida', 'Preparação de veículo', 'Preparação — ' + c.modelo + ' ' + c.anoMod, soma(c.custos), { tipo: 'carro', id: c.id });
    });
    var reservado = carros.find(function (c) { return c.modelo === 'Corolla Cross'; });
    if (reservado) reservado.status = 'reservado';

    /* leads do mês (com horário, 1ª resposta, próximo contato e campanha) */
    var ORIG = ['site-whatsapp', 'site-whatsapp', 'instagram', 'instagram', 'site-financiamento', 'loja', 'indicacao', 'site-venda-seu-carro', 'site-agendamento'];
    var ETAPAS = ['novo', 'novo', 'atendimento', 'atendimento', 'atendimento', 'proposta', 'proposta', 'visita', 'perdido'];
    var CAMP = [{ source: 'instagram', medium: 'paid', campaign: 'sem-entrada-outubro' }, { source: 'google', medium: 'cpc', campaign: 'seminovos-zona-leste' }, null, null, null];
    var estoqueIds = carros.filter(function (c) { return c.status !== 'vendido' && c.publicado; }).map(function (c) { return c.id; });
    for (var k = 0; k < 26; k++) {
      var et = pick(ETAPAS), o = pick(ORIG);
      var criadoDia = addDays(hoje, -int(0, 12));
      var criado = criadoDia + 'T' + hora();
      var vendId = et === 'novo' && r() < .6 ? null : pick(vendedoresPeso);
      var utm = o.indexOf('site') === 0 ? pick(CAMP) : null;
      var lead = {
        id: uid('ld'), nome: nomeFake(), telefone: telFake(), carroId: o === 'site-venda-seu-carro' ? null : pick(estoqueIds), origem: o,
        mensagem: o === 'site-venda-seu-carro' ? 'Quero avaliar meu ' + pick(MODELOS)[1] + ' ' + int(2015, 2021) : o === 'site-financiamento' ? 'Pré-análise de crédito — sem entrada' : '',
        etapa: et, vendedorId: vendId, criadoEm: criado, utm: utm,
        primeiroContatoEm: et === 'novo' ? null : criadoDia + 'T' + pad(Math.min(19, +criado.slice(11, 13) + int(0, 3))) + ':' + pad(int(0, 5) * 10),
        proximoContato: ['atendimento', 'proposta', 'visita'].indexOf(et) > -1 ? addDays(hoje, int(-3, 4)) : null,
        historico: [{ data: criado, texto: 'Lead recebido (' + origemLabel(o) + ')', autor: 'Sistema' }], demo: true
      };
      leads.push(lead);
    }

    /* agenda da semana */
    var ag = [
      [0, '10:00', 'visita', 'confirmado'], [0, '14:30', 'test-drive', 'agendado'], [0, '16:00', 'entrega', 'confirmado'],
      [1, '09:30', 'avaliacao', 'agendado'], [1, '11:00', 'visita', 'agendado'], [2, '15:00', 'test-drive', 'agendado'],
      [3, '10:30', 'visita', 'agendado'], [-1, '11:00', 'visita', 'realizado'], [-1, '17:00', 'test-drive', 'faltou'], [-2, '10:00', 'entrega', 'realizado']
    ];
    ag.forEach(function (a) {
      var ld = leads[int(0, leads.length - 1)];
      agenda.push({ id: uid('ag'), tipo: a[2], data: addDays(hoje, a[0]), hora: a[1], clienteNome: ld.nome, telefone: ld.telefone, carroId: a[2] === 'avaliacao' ? null : pick(estoqueIds), leadId: ld.id, vendedorId: ld.vendedorId || pick(vendedoresPeso), status: a[3], obs: '', origem: r() < .4 ? 'site' : 'painel', demo: true });
    });

    /* galeria de entregas (fotos reais enviadas) */
    db.entregas = [];   /* fotos de entregas reais entram pelo painel */

    /* estatísticas do site (demonstração) */
    for (var d = 20; d >= 0; d--) {
      var dia = addDays(hoje, -d), dw = parse(dia).getDay();
      var vis = int(70, 150) + (dw === 6 || dw === 0 ? 60 : 0);
      db.stats.dias[dia] = { visitas: vis, leads: leads.filter(function (l) { return l.criadoEm.slice(0, 10) === dia && l.origem.indexOf('site') === 0; }).length, wa: Math.round(vis * between(.04, .09)) };
    }
    estoqueIds.forEach(function (id) { db.stats.views[id] = int(90, 420); db.stats.wa[id] = int(6, 38); });

    db.comunicados = [
      { id: uid('cm'), titulo: 'Bem-vindos ao nosso novo sistema!', texto: 'A partir de agora, todo atendimento, venda e carro novo é registrado aqui. Cadastrou o lead, atualiza a etapa e marca o próximo contato. Vendeu, registra a venda — a comissão é calculada na hora. Qualquer dúvida, falem comigo.', data: addDays(hoje, -6), autorId: 'u_dir', fixado: true, leituras: ['u_ricardo', 'u_juliana'] },
      { id: uid('cm'), titulo: 'Meta da loja: ' + config.metaLoja + ' carros este mês', texto: 'Vamos com tudo! Prioridade para os SUVs e para os carros parados há mais de 60 dias. Lembrem de oferecer a simulação sem entrada para todo cliente.', data: addDays(hoje, -3), autorId: 'u_dir', fixado: false, leituras: ['u_juliana'] },
      { id: uid('cm'), titulo: 'Padrão de fotos dos carros', texto: 'Toda foto nova: frente 3/4, traseira 3/4, lateral, painel, bancos, porta-malas e rodas. Carro limpo, fundo da loja, sem gente passando.', data: addDays(hoje, -1), autorId: 'u_dir', fixado: false, leituras: [] }
    ];

    /* painel de verdade: fica só o que é real (identidade da loja + estoque anunciado).
       Valor de compra, FIPE, preço mínimo, data de entrada e checklist a loja preenche no painel. */
    if (!DEMO_FICTICIO) {
      db.usuarios = usuarios.filter(function (u) { return u.cargo === 'diretora'; });
      db.carros = carros.filter(function (c) { return c.status !== 'vendido'; }).map(function (c) {
        return Object.assign(c, { status: 'venda', precoCompra: 0, fipe: 0, precoMinimo: 0, custos: [], checklist: {}, dataEntrada: hoje, valoresIlustrativos: false });
      });
      db.vendas = []; db.clientes = []; db.lancamentos = []; db.leads = []; db.agenda = []; db.comunicados = [];
      db.stats = { dias: {}, views: {}, wa: {} };
    }
    return db;
  }

  /* ---------- migração v1 → v2 (mantém o que já foi cadastrado) ---------- */
  function migrate(db) {
    if (!db || db.version >= VERSION) return db;
    if (db.config && db.config.modoDemo) return seed();   // demonstração: recria com as novidades
    var fresh = seed();
    Object.keys(fresh.config).forEach(function (k) { if (db.config[k] == null) db.config[k] = fresh.config[k]; });
    ['agenda', 'entregas', 'depoimentos'].forEach(function (k) { if (!db[k]) db[k] = []; });
    if (!db.stats) db.stats = { dias: {}, views: {}, wa: {} };
    db.carros.forEach(function (c) { if (c.descricao && /inclusive sem entrada/.test(c.descricao)) c.descricao = c.descricao.replace(/ Revisado e pronto para entrega\..*$/, ' ' + textoCredito(c)); if (!c.fotos || !c.fotos.length) c.fotos = fotosPortal(c.anoMod, c.km); if (!c.checklist) c.checklist = {}; if (c.precoAnterior == null) c.precoAnterior = 0; if (c.precoMinimo == null) c.precoMinimo = 0; if (c.comentarioLoja == null) c.comentarioLoja = ''; if (c.videoUrl == null) c.videoUrl = ''; });
    db.vendas.forEach(function (v) { if (!v.aprovacao) v.aprovacao = 'aprovada'; });
    db.lancamentos.forEach(function (l) { if (l.pago == null) l.pago = true; if (!l.vencimento) l.vencimento = l.data; });
    db.version = VERSION;
    return db;
  }

  function origemLabel(o) {
    return ({ 'site-whatsapp': 'Site · WhatsApp', 'site-financiamento': 'Site · Financiamento', 'site-venda-seu-carro': 'Site · Venda seu carro', 'site-contato': 'Site · Contato', 'site-agendamento': 'Site · Agendamento', 'site-favoritos': 'Site · Favoritos', 'site-proposta': 'Site · Pedido de proposta', 'instagram': 'Instagram', 'facebook': 'Facebook', 'google': 'Google (anúncio)', 'gmn': 'Google Meu Negócio', 'olx': 'OLX', 'webmotors': 'Webmotors', 'icarros': 'iCarros', 'mercadolivre': 'Mercado Livre', 'mobiauto': 'Mobiauto', 'marketplace': 'Facebook Marketplace', 'loja': 'Na loja', 'indicacao': 'Indicação', 'telefone': 'Telefone', 'outro': 'Outro' })[o] || o;
  }
  var AGENDA_TIPOS = { visita: 'Visita / café', 'test-drive': 'Test drive', entrega: 'Entrega do carro', avaliacao: 'Avaliação de troca', outro: 'Outro' };

  /* ---------- regra de comissão ---------- */
  function calcComissao(venda, vendedor) {
    if (!vendedor) return 0;
    var v = Number(vendedor.comissaoValor) || 0;
    switch (vendedor.comissaoTipo) {
      case 'fixo': return Math.round(v);
      case 'pct_venda': return Math.round(venda.valor * v / 100);
      case 'pct_lucro': return Math.round(Math.max(0, venda.lucro) * v / 100);
      default: return 0;
    }
  }
  function comissaoRegra(u) {
    if (!u) return '—';
    switch (u.comissaoTipo) {
      case 'fixo': return brl(u.comissaoValor) + ' por carro';
      case 'pct_venda': return num(u.comissaoValor) + '% do valor da venda';
      case 'pct_lucro': return num(u.comissaoValor) + '% do lucro do carro';
      default: return 'Sem comissão';
    }
  }

  /* ---------- carregar / salvar ---------- */
  var cache = null;
  function load() {
    if (cache) return cache;
    try { var raw = localStorage.getItem(KEY); if (raw) cache = JSON.parse(raw); } catch (e) { cache = null; }
    if (!cache || !cache.version) { cache = seed(); save(); }
    else if (cache.version < VERSION) { cache = migrate(cache); save(); }
    if (ensureV5(cache)) save();
    return cache;
  }
  /* v5: só ACRESCENTA o que falta (nunca apaga nem recria nada que já foi cadastrado) */
  function ensureV5(db) {
    var mudou = false;
    if (!db.avaliacoes) { db.avaliacoes = db.config && db.config.modoDemo ? avaliacoesDemo(db) : []; mudou = true; }
    if (db.config && db.config.avMargem == null) { db.config.avMargem = 12; mudou = true; }
    return mudou;
  }
  function avaliacoesDemo(db) {
    var h = today(), vend = (db.usuarios || []).filter(function (u) { return u.cargo === 'vendedor'; });
    var ok = function (o) { var r = {}; AV_ITENS.forEach(function (k) { r[k[0]] = 'ok'; }); return Object.assign(r, o || {}); };
    return [
      { id: uid('av'), demo: true, criadoEm: addDays(h, -1) + 'T10:20', tipo: 'troca', status: 'aberta', clienteNome: 'Rafaela Costa', telefone: '(11) 90000-4411', leadId: null, avaliadorId: vend[0] ? vend[0].id : null,
        marca: 'Chevrolet', modelo: 'Onix', versao: 'LT 1.4', anoFab: 2017, anoMod: 2018, km: 78000, cor: 'Prata', placa: '', cambio: 'Manual', combustivel: 'Flex',
        fipe: 58900, pedido: 55000, oferta: 0, itens: ok({ pneus: 'atencao', pintura: 'atencao' }), custos: { pneus: 1600, pintura: 900 }, fotos: [], obs: 'Cliente quer trocar por um SUV automático.', historico: [{ data: addDays(h, -1) + 'T10:20', texto: 'Avaliação iniciada', autor: 'Sistema' }] },
      { id: uid('av'), demo: true, criadoEm: addDays(h, -4) + 'T15:00', tipo: 'compra', status: 'proposta', clienteNome: 'Otávio Lima', telefone: '(11) 90000-5520', leadId: null, avaliadorId: 'u_dir',
        marca: 'Hyundai', modelo: 'HB20', versao: 'Comfort Plus 1.0', anoFab: 2019, anoMod: 2020, km: 52000, cor: 'Branco', placa: '', cambio: 'Manual', combustivel: 'Flex',
        fipe: 64500, pedido: 60000, oferta: 54500, itens: ok({ motor: 'atencao', interior: 'atencao' }), custos: { motor: 1200, interior: 500 }, fotos: [], obs: 'Revisões na concessionária até 40 mil km.', historico: [{ data: addDays(h, -4) + 'T15:00', texto: 'Avaliação iniciada', autor: 'Sistema' }, { data: addDays(h, -3) + 'T11:00', texto: 'Proposta enviada: R$ 54.500', autor: 'Diretoria' }] }
    ];
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); return true; }
    catch (e) { console.warn('Não foi possível salvar', e); return false; }
  }
  function reset() { cache = seed(); ensureV5(cache); save(); return cache; }
  function wipe() {
    var c = load().config; c.modoDemo = false;
    cache = { version: VERSION, criadoEm: today(), config: c, usuarios: load().usuarios.filter(function (u) { return u.cargo === 'diretora'; }), carros: [], vendas: [], clientes: [], lancamentos: [], leads: [], agenda: [], comunicados: [], auditoria: [], avaliacoes: [], entregas: load().entregas || [], depoimentos: [], stats: { dias: {}, views: {}, wa: {} } };
    save(); return cache;
  }
  try { window.addEventListener('storage', function (e) { if (e.key === KEY) { cache = null; document.dispatchEvent(new CustomEvent('loja:db-changed')); } }); } catch (e) { /* ok */ }

  /* ---------- helpers de domínio ---------- */
  function carroTitulo(c) { return c ? (c.marca + ' ' + c.modelo) : '—'; }
  function carroNome(c) { return c ? (c.marca + ' ' + c.modelo + ' ' + c.versao + ' ' + c.anoFab + '/' + c.anoMod) : '—'; }
  function carroFoto(c) { return (c && c.fotos && c.fotos[0]) || placeholderFor(c); }
  /* crédito pela idade do carro: bancos costumam financiar carros mais novos (confirmar regras com os parceiros da loja) */
  function creditoNivel(c) { var idade = new Date().getFullYear() - (c && c.anoMod || 0); return idade <= 7 ? 'facil' : idade <= 11 ? 'consulta' : 'avista'; }
  function textoCredito(c) {
    var n = creditoNivel(c);
    if (n === 'facil') return 'Aceitamos seu carro na troca. Financiamento com bancos parceiros, sujeito à análise de crédito.';
    if (n === 'consulta') return 'Aceitamos seu carro na troca. Consulte as condições de financiamento (sujeito à análise de crédito).';
    return 'Pagamento à vista ou com o seu carro na troca. Consulte outras condições com a nossa equipe.';
  }
  function custoTotal(c) { return (c.custos || []).reduce(function (s, x) { return s + (Number(x.valor) || 0); }, 0); }
  function custoCarro(c) { return (Number(c.precoCompra) || 0) + custoTotal(c); }
  function lucroPrevisto(c) { return (Number(c.preco) || 0) - custoCarro(c); }
  function temCusto(c) { return Number(c.precoCompra) > 0; }   /* sem valor de compra não dá para falar em lucro */
  function diasEstoque(c) { return diffDays(c.dataEntrada, c.dataSaida || today()); }
  function checklistPct(c) { var ok = CHECKLIST.filter(function (k) { return c.checklist && c.checklist[k[0]]; }).length; return { ok: ok, total: CHECKLIST.length }; }
  function fipePct(c) { return c && c.fipe ? Math.round((Number(c.preco) || 0) / c.fipe * 100) : null; }
  function portaisAtivos(c) { return PORTAIS.filter(function (p) { return c && c.portais && c.portais[p[0]] && c.portais[p[0]].on; }); }
  /* avaliação: nota (0–100), custo estimado e oferta sugerida */
  function avCusto(a) { return Object.keys(a.custos || {}).reduce(function (s, k) { return s + ((a.itens || {})[k] && a.itens[k] !== 'ok' ? Number(a.custos[k]) || 0 : 0); }, 0); }
  function avNota(a) {
    var pts = 0, n = 0; AV_ITENS.forEach(function (k) { var v = (a.itens || {})[k[0]]; if (!v) return; n++; pts += v === 'ok' ? 1 : v === 'atencao' ? 0.5 : 0; });
    return n ? Math.round(pts / n * 100) : null;
  }
  function avSugestao(a, margem) {
    var m = margem == null ? (load().config.avMargem || 12) : margem;
    var base = Number(a.fipe) || 0; if (!base) return 0;
    var v = base * (1 - m / 100) - avCusto(a);
    return Math.max(0, Math.floor(v / 500) * 500);
  }
  /* documentação da venda: quantos itens faltam e quantos dias de prazo */
  function docStatus(v) {
    if (!v || !v.docs) return null;
    var feitos = DOC_ITENS.filter(function (k) { return v.docs[k[0]]; }).length;
    var dias = diffDays(v.data, today());
    return { feitos: feitos, total: DOC_ITENS.length, completo: feitos === DOC_ITENS.length, dias: dias, restam: DOC_PRAZO - dias, comunicada: !!v.docs.comunicacao };
  }
  function creditoStatus(l) {
    var bs = (l && l.credito && l.credito.bancos) || []; if (!bs.length) return null;
    if (bs.some(function (b) { return b.status === 'aprovado'; })) return 'aprovado';
    if (bs.some(function (b) { return b.status === 'enviado' || b.status === 'pendencia'; })) return 'analise';
    if (bs.every(function (b) { return b.status === 'recusado'; })) return 'recusado';
    return null;
  }
  function emOferta(c) { return c && c.precoAnterior && c.precoAnterior > c.preco; }
  function parcela(valor, entrada, meses, taxa) {
    var pv = Math.max(0, valor - (entrada || 0)); var i = (taxa == null ? load().config.taxaJuros : taxa) / 100;
    if (!pv) return 0; if (!i) return pv / meses;
    return pv * i / (1 - Math.pow(1 + i, -meses));
  }
  function vitrine() {
    return load().carros.filter(function (c) { return c.publicado && (c.status === 'venda' || c.status === 'reservado'); });
  }
  function getCarro(id) { return load().carros.find(function (c) { return c.id === id; }); }
  function getUser(id) { return load().usuarios.find(function (u) { return u.id === id; }); }
  function getCliente(id) { return load().clientes.find(function (c) { return c.id === id; }); }

  function waLink(msg, numero) {
    var n = onlyDigits(numero || load().config.whatsapp);
    if (n.length <= 11) n = '55' + n;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg || '');
  }
  function fillTemplate(t, vars) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null && vars[k] !== '' ? vars[k] : m; }); }

  /* ---------- campanha (UTM) — guarda a 1ª origem da visita ---------- */
  function captureUTM() {
    try {
      if (ss('loja_utm')) return;
      var q = new URLSearchParams(location.search), o = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { if (q.get(k)) o[k.replace('utm_', '')] = q.get(k); });
      if (o.gclid && !o.source) { o.source = 'google'; o.medium = 'cpc'; }
      if (o.fbclid && !o.source) { o.source = 'meta'; o.medium = 'paid'; }
      if (!o.source && document.referrer) {
        var ref = document.referrer.toLowerCase();
        if (ref.indexOf(location.hostname) < 0) o.source = /instagram/.test(ref) ? 'instagram' : /facebook/.test(ref) ? 'facebook' : /google/.test(ref) ? 'google' : 'referencia';
        if (o.source) o.medium = 'organico';
      }
      if (o.source) { ss('loja_utm', o); }
    } catch (e) { /* ok */ }
  }
  function utm() { return ss('loja_utm'); }

  /* ---------- estatísticas do site ---------- */
  function stat(tipo, id) {
    var db = load(); if (!db.stats) db.stats = { dias: {}, views: {}, wa: {} };
    var d = today(); var dia = db.stats.dias[d] || (db.stats.dias[d] = { visitas: 0, leads: 0, wa: 0 });
    if (tipo === 'visita') { if (ss('loja_visit')) return; ss('loja_visit', 1); dia.visitas++; }
    if (tipo === 'lead') dia.leads++;
    if (tipo === 'wa') { dia.wa++; if (id) db.stats.wa[id] = (db.stats.wa[id] || 0) + 1; }
    if (tipo === 'view' && id) { var seen = ss('loja_seen') || {}; if (seen[id]) return; seen[id] = 1; ss('loja_seen', seen); db.stats.views[id] = (db.stats.views[id] || 0) + 1; }
    save();
  }


  /* =====================================================================
     FASE 2 · SUPABASE (projeto dancar-sdr, o mesmo da automação de SDR)
     Etapa 1: a vitrine do site vem da tabela veiculos (sincronizada da
     Autoconf) e os formulários viram lead na tabela leads do SDR.
     A chave abaixo é a PUBLICÁVEL (pode ficar no front). O acesso do site
     é só pelas funções fn_site_vitrine, fn_site_lead e fn_site_evento.
     ===================================================================== */
  var SB = { url: '', key: '' };   /* sem banco online por enquanto: tudo fica no aparelho (localStorage) */
  function sbRpc(fn, body) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('sem fetch'));
    return fetch(SB.url + '/rest/v1/rpc/' + fn, { method: 'POST', keepalive: true, headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { if (!r.ok) throw new Error('supabase ' + r.status); return r.status === 204 ? null : r.json().catch(function () { return null; }); });
  }
  var CARROCERIA = { 'van/utilitário': 'SUV', 'utilitário': 'SUV', 'sedan': 'Sedã', 'sedã': 'Sedã', 'hatchback': 'Hatch', 'hatch': 'Hatch', 'picape': 'Picape', 'pick-up': 'Picape', 'suv': 'SUV' };
  function versaoDe(v) {
    var t = String(v.titulo || ''), pre = (v.marca || '') + ' ' + (v.modelo || '') + ' ';
    if (pre.trim() && t.toLowerCase().indexOf(pre.toLowerCase()) === 0) return t.slice(pre.length).trim();
    return v.versao || '';
  }
  function mapVeiculo(v, c) {
    var preco = Number(v.preco) || 0, promo = Number(v.preco_promocional) || 0;
    var final = promo && promo < preco ? promo : preco;
    c = c || { id: 'v' + v.id, precoCompra: 0, precoMinimo: 0, custos: [], checklist: {}, portais: {}, dataEntrada: String(v.publicado_em || '').slice(0, 10) || today(), dataSaida: null, origem: 'compra', fornecedor: '', vendaId: null, comentarioLoja: '', videoUrl: '' };
    var anterior = promo && promo < preco ? preco : (c.sbId && c.preco && final < c.preco ? c.preco : (c.precoAnterior > final ? c.precoAnterior : 0));
    var carroc = CARROCERIA[String(v.carroceria || '').toLowerCase()] || v.carroceria || c.carroceria || '';
    Object.assign(c, {
      sbId: v.id, marca: v.marca || c.marca, modelo: v.modelo || c.modelo, versao: versaoDe(v) || c.versao || '', anoFab: v.ano_fabricacao || c.anoFab, anoMod: v.ano_modelo || c.anoMod,
      km: v.km != null ? v.km : (c.km || 0), cambio: v.cambio || c.cambio || '', combustivel: v.combustivel || c.combustivel || '', cor: v.cor || c.cor || '', carroceria: carroc, portas: v.portas || c.portas || 4,
      preco: final, precoAnterior: anterior, fipe: Number(v.valor_fipe) || c.fipe || 0, finalPlaca: v.final_placa || '',
      opcionais: (v.opcionais && v.opcionais.length ? v.opcionais : v.opcionais_destaque) || [], destaque: !!v.destaque,
      fotos: (v.fotos && v.fotos.length) ? v.fotos : (c.fotos || []), publicado: true, status: v.status === 'reservado' ? 'reservado' : 'venda'
    });
    if (v.descricao) c.descricao = v.descricao;
    else if (!c.descricao || c.valoresIlustrativos) c.descricao = c.marca + ' ' + c.modelo + ' ' + c.versao + ' ' + c.anoFab + '/' + c.anoMod + (c.cor ? ', ' + String(c.cor).toLowerCase() : '') + ', ' + num(c.km) + ' km. ' + textoCredito(c);
    return c;
  }
  /* troca o estoque local pelo do Supabase, sem perder o que o painel já anotou (custo, checklist, portais…) */
  function aplicarVitrine(list) {
    var db = load(), porSb = {}, porAnoKm = {};
    db.carros.forEach(function (c) { if (c.sbId) porSb[c.sbId] = c; else if (c.status !== 'vendido') porAnoKm[c.anoMod + '|' + c.km] = c; });
    var vistos = {}, usados = {};
    list.forEach(function (v) {
      var c = porSb[v.id] || porAnoKm[v.ano_modelo + '|' + v.km];
      if (c && usados[c.id]) c = null;
      c = mapVeiculo(v, c); usados[c.id] = 1; vistos[v.id] = 1;
      if (db.carros.indexOf(c) < 0) db.carros.push(c);
    });
    db.carros.forEach(function (c) {
      if (usados[c.id]) return;
      if (c.status === 'venda' || c.status === 'reservado') c.publicado = false;   /* saiu da Autoconf/Supabase: some do site */
    });
    db.config.sbVitrineEm = new Date().toISOString();
    save();
    try { document.dispatchEvent(new CustomEvent('loja:db-changed')); } catch (e) { /* ok */ }
    return db;
  }
  function syncVitrine() { if (!SB.url) return Promise.resolve(null); return sbRpc('fn_site_vitrine').then(function (list) { if (Array.isArray(list) && list.length) aplicarVitrine(list); return list; }); }
  /* o site espera o estoque do Supabase antes de desenhar (até 2,5 s); se já sincronizou há pouco, segue na hora e atualiza por trás */
  var readyP = null;
  function ready(ms) {
    if (readyP) return readyP;
    if (!SB.url) { readyP = Promise.resolve(load()); return readyP; }
    var ult = Date.parse(load().config.sbVitrineEm || 0) || 0;
    if (Date.now() - ult < 10 * 60e3) { readyP = Promise.resolve(load()); syncVitrine().catch(function () { /* offline: fica o que já tem */ }); return readyP; }
    readyP = new Promise(function (res) {
      var feito = false, fim = function () { if (!feito) { feito = true; res(load()); } };
      setTimeout(fim, ms || 2500);
      syncVitrine().then(fim, fim);
    });
    return readyP;
  }
  /* manda o lead do site para o Supabase (tabela leads do SDR); clique sem telefone vira só evento */
  function enviarLeadSb(lead) {
    if (!SB.url) return Promise.resolve(null);
    var carro = lead.carroId ? getCarro(lead.carroId) : null;
    if (!lead.telefone || onlyDigits(lead.telefone).length < 10) {
      return sbRpc('fn_site_evento', { p_tipo: 'site_clique_whatsapp', p_dados: { origem: lead.origem, veiculo_id: carro && carro.sbId || null, utm: lead.utm || null } }).catch(function () { /* ok */ });
    }
    return sbRpc('fn_site_lead', { p: {
      nome: lead.nome && lead.nome !== 'Visitante do site' ? lead.nome : '', telefone: lead.telefone, formulario: String(lead.origem || 'site').replace(/^site-/, ''),
      mensagem: lead.mensagem || '', pagina: (typeof location !== 'undefined' ? location.pathname : ''), utm: lead.utm || {},
      veiculo_id: carro && carro.sbId ? String(carro.sbId) : null, veiculo_texto: carro ? carroNome(carro) : null,
      extras: { origem_site: lead.origem, preAval: lead.preAval || null, credito: lead.credito || null }
    } }).catch(function (e) { console.warn('Lead não foi para o Supabase', e); });
  }

  /* ---------- leads ---------- */
  function nextVendedor() {
    var db = load(), cfg = db.config;
    var vs = db.usuarios.filter(function (u) { return u.ativo && u.cargo === 'vendedor'; });
    if (!vs.length) return null;
    var u = vs[(cfg.rrIndex || 0) % vs.length]; cfg.rrIndex = ((cfg.rrIndex || 0) + 1) % vs.length; return u.id;
  }
  function addLead(l) {
    var db = load();
    /* evita lead duplicado quando a mesma pessoa clica várias vezes no WhatsApp do mesmo carro */
    var key = (l.origem || '') + '|' + (l.carroId || '') + '|' + onlyDigits(l.telefone);
    var recent = ss('loja_leadkeys') || {};
    if (!l.telefone && recent[key] && Date.now() - recent[key] < 30 * 60e3) { return null; }
    recent[key] = Date.now(); ss('loja_leadkeys', recent);
    var lead = Object.assign({ id: uid('ld'), nome: 'Visitante do site', telefone: '', carroId: null, origem: 'site-whatsapp', mensagem: '', etapa: 'novo', vendedorId: null, criadoEm: nowISO(), historico: [], primeiroContatoEm: null, proximoContato: null }, l);
    lead.utm = lead.utm || utm() || null;
    lead.historico = [{ data: nowISO(), texto: 'Lead recebido (' + origemLabel(lead.origem) + ')' + (lead.mensagem ? ': ' + lead.mensagem : ''), autor: 'Site' }];
    if (!lead.vendedorId && db.config.distribuicaoAuto) { lead.vendedorId = nextVendedor(); if (lead.vendedorId) lead.historico.push({ data: nowISO(), texto: 'Distribuído automaticamente para ' + getUser(lead.vendedorId).nome, autor: 'Sistema' }); }
    db.leads.unshift(lead); stat('lead'); save();
    if (typeof window !== 'undefined' && window.LojaSite) enviarLeadSb(lead);
    return lead;
  }
  function addAgenda(a) {
    var db = load(); if (!db.agenda) db.agenda = [];
    var item = Object.assign({ id: uid('ag'), tipo: 'visita', data: today(), hora: '10:00', clienteNome: '', telefone: '', carroId: null, leadId: null, vendedorId: null, status: 'agendado', obs: '', origem: 'site' }, a);
    db.agenda.push(item); save(); return item;
  }
  function log(userId, acao) {
    var db = load(); db.auditoria.unshift({ data: new Date().toISOString(), userId: userId, acao: acao });
    if (db.auditoria.length > 300) db.auditoria.length = 300;
  }

  function session(u) {
    try {
      if (u === null) { localStorage.removeItem(SESSION); return null; }
      if (u) { localStorage.setItem(SESSION, u.id); return u; }
      var id = localStorage.getItem(SESSION); return id ? getUser(id) : null;
    } catch (e) { return null; }
  }

  captureUTM();

  window.LojaDB = {
    load: load, save: save, reset: reset, wipe: wipe, session: session, log: log,
    uid: uid, today: today, nowISO: nowISO, parse: parse, addDays: addDays, diffDays: diffDays, diffHours: diffHours, monthKey: monthKey, monthAdd: monthAdd, monthLabel: monthLabel, weekday: weekday,
    dateBR: dateBR, timeOf: timeOf, brl: brl, num: num, km: km, esc: esc, onlyDigits: onlyDigits, slug: slug,
    AV_ITENS: AV_ITENS, PORTAIS: PORTAIS, DOC_ITENS: DOC_ITENS, DOC_PRAZO: DOC_PRAZO, BANCOS: BANCOS, CRED_STATUS: CRED_STATUS,
    fipePct: fipePct, portaisAtivos: portaisAtivos, avCusto: avCusto, avNota: avNota, avSugestao: avSugestao, docStatus: docStatus, creditoStatus: creditoStatus,
    PLACEHOLDER: PLACEHOLDER, placeholderFor: placeholderFor, CHECKLIST: CHECKLIST, AGENDA_TIPOS: AGENDA_TIPOS, SCRIPTS_PADRAO: SCRIPTS_PADRAO,
    origemLabel: origemLabel, calcComissao: calcComissao, comissaoRegra: comissaoRegra,
    carroTitulo: carroTitulo, carroNome: carroNome, carroFoto: carroFoto, creditoNivel: creditoNivel, textoCredito: textoCredito, custoTotal: custoTotal, custoCarro: custoCarro,
    lucroPrevisto: lucroPrevisto, temCusto: temCusto, diasEstoque: diasEstoque, checklistPct: checklistPct, emOferta: emOferta, parcela: parcela, vitrine: vitrine,
    getCarro: getCarro, getUser: getUser, getCliente: getCliente, waLink: waLink, fillTemplate: fillTemplate,
    addLead: addLead, addAgenda: addAgenda, stat: stat, utm: utm, nextVendedor: nextVendedor,
    ready: ready, syncVitrine: syncVitrine, sbRpc: sbRpc
  };
})();
