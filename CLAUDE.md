# CLAUDE.md — Grupo Maxxs Work Multimarcas

Projeto da agência CLYENT (dono: Rafael) para apresentar ao Grupo Maxxs Work Multimarcas (Av. Marechal Tito 1881 = Work Multimarcas e 2323 = Maxxs Multimarcas, São Miguel Paulista). Feito em 13/11/2026 a partir da base da Dancar (docs/COMO-TROCAR-DE-LOJA.md).
Fale com o Rafael em português informal, explique passo a passo (ele está aprendendo programação) e mostre o resultado no navegador antes de commitar.

## Estado atual (prévia de apresentação)
- `DEMO_FICTICIO = true` em store.js: o PAINEL mostra vendas, leads, equipe e valores de EXEMPLO (aviso “Modo demonstração”); o SITE mostra só o estoque real (34 carros do site da loja, com foto). Custo/FIPE/dias dos carros são estimados só para a demo.
- Login do painel: Diretoria / `maxxs123`; vendedores de exemplo com senha 1234.
- Sem banco online: `SB` vazio em store.js → tudo no aparelho (localStorage, chave `maxxs_db_v1`).
- Todas as páginas têm `<meta name="robots" content="noindex">` (é prévia). Tirar quando o domínio oficial apontar para cá.
- **Identidade (13/11/2026, enviada pelo Rafael): vermelho racing + grafite + branco.** Tokens só no `:root` de site.css (`--brand #D40000`, `--brand-vivid #E10600`, `--brand-deep #A80000`, `--graphite #111318`, `--black #0B0B0B`, `--ice #F7F7F8`, `--border #E5E7EB`, `--text-2 #6B7280`; `--gold*` = destaque por herança) e painel.css (`--gold #E10600` no tema escuro). Bordas neutras (`--line = #E5E7EB`); vermelho só em ações e destaques. Nada de azul de marca.
- Fonte dos títulos: Montserrat (self-hosted, 600–900, itálico 800/900); texto em Manrope.
- Logo vetorial própria inspirada na referência (monograma MW: M vermelho, W grafite/prata, arco vermelho): `assets/img/logo.svg` (fundo claro), `logo-branco.svg` (fundo escuro), `monograma*.svg`, `icone.svg`, PNG transparentes (`logo.png`, `logo-branco.png`, `monograma*.png`), favicon e ícones do app em `assets/img/app/`. Gerada por script (fontTools + Montserrat). Se a loja mandar o arquivo original da logo, troque esses arquivos.
- Estoque (VERSION 6): 34 carros reais lidos do site atual da loja (plataforma BNDV, endpoint `/Home/ListaEstoque`, 13/11/2026) com 1 foto por carro (links do CDN da BNDV), cor e final da placa (`finalPlaca`; placa completa nunca vai para o site). Sandero 2017 e 308 estavam sem preço lá: usamos o preço do portal Napista. Prisma Joy 2010 ficou de fora (sem preço e sem foto). Fotos são links externos: se a loja trocar de sistema, subir as fotos pelo painel.
- Duas lojas confirmadas na descrição dos anúncios da própria loja: “Av. Marechal Tito, 2323 • 1881”. Telefones: (11) 2537-8630 (WhatsApp), (11) 3467-4211 e (11) 4215-6340.
- Pendências: logo e cores reais, fotos, cor/opcionais dos carros, CNPJ, e-mail, equipe real; depois `DEMO_FICTICIO = false`.

## Visão geral
- Site público (vitrine) + Painel da Diretora, HTML/CSS/JS puro, sem build. Rodar com `npx serve .`.
- `assets/js/store.js` = camada de dados (`window.LojaDB`, versão 2; identidade da loja no bloco IDENTIDADE de seed()). Hoje: localStorage + dados de demonstração (`seed()`) + migração v1→v2.
  Toda leitura/escrita passa por ele. Na Fase 2 (Supabase) só ele muda — ver `supabase/schema.sql`.
- Site: `assets/js/site.js` (páginas por `<body data-page="home|estoque|carro|financiamento|venda|loja|contato">`).
- Painel: `assets/js/painel.js` (SPA por hash: #dashboard #estoque #avaliacoes #movimentacao #leads #agenda #vendas #clientes #financeiro #comissoes #equipe #marketing #comunicados #config).

## Regras de negócio
- Cargos: `diretora` (tudo), `gerente` (operação, sem custo/financeiro/config), `vendedor` (só o que é dele, nunca vê custo, lucro nem preço mínimo).
- Carro: `preparacao` → `venda` → `reservado` → `vendido`. Só aparece no site se `publicado` e status venda/reservado.
- Baixou o preço no painel → `precoAnterior` é preenchido sozinho → site mostra “de/por”.
- Venda: `lucro = valor − (compra + custos)`; comissão pela regra do vendedor (fixo, pct_venda, pct_lucro). Se não for a diretora e `valor < precoMinimo` → `aprovacao: 'pendente'` (comissão não pode ser paga até aprovar). Entrada no caixa = valor − troca. Troca entra no estoque em preparação.
- Lançamentos automáticos têm `ref` (carro/venda/comissao) e não são apagados à mão. `pago:false` + `vencimento` = conta a pagar.
- Leads: todo clique/formulário do site chama `LojaDB.addLead` (dedupe 30 min, UTM, roleta se `config.distribuicaoAuto`). Sair de “novo” grava `primeiroContatoEm`. `proximoContato` = follow-up.
- Agenda: `LojaDB.addAgenda` (site) ou `agendaModal` (painel). Tipos: visita, test-drive, entrega, avaliacao.
- Mensagens prontas em `config.scripts` com variáveis {loja} {nome} {carro} {vendedor} {endereco} {google} {quando}.

- Importação de estoque: `importModal()` em painel.js lê .xlsx (assets/js/vendor/xlsx.full.min.js, fallback CDN) ou .csv; colunas flexíveis (aliases em ALIAS); carro existente = mesma placa ou marca+modelo+anoMod+km → atualiza preço/km. Modelo em `modelos/`.

## Assistente de IA
- `assets/js/ia.js` (chat lateral) + `netlify/functions/ia.mjs` (rota `/api/ia`, guarda `GROQ_API_KEY`; nunca colocar chave no front). Na Vercel, `api/ia.mjs` reexporta a mesma função.
- Ao mudar JS/CSS, suba o `?v=` nas tags dos HTML (cache do navegador).
- Ferramentas rodam no navegador via LojaDB: `consultar` (resumo, carros, vendas, leads, agenda, clientes, comissoes, financeiro, equipe) e ações `alterar_carro`, `salvar_lead`, `agendar`, `lancar_financeiro`, `comunicado` (todas passam por `validar` → card de confirmação → `executar`), além de `abrir` e `preparar_whatsapp`.
- Permissões por cargo ficam nas consultas/ações de ia.js (mesmas regras do painel). Ao criar campo novo sensível, filtre lá também.
- Ponte com o painel: `window.LojaPainel` no fim de painel.js; o painel dispara `loja:shell` quando monta.
- Plano gratuito do Groq: respostas de ferramenta curtas (texto em linhas) e histórico enxuto para caber no limite por minuto. Guia: `docs/ASSISTENTE-IA.md`.

## App do painel (PWA)
- `painel.webmanifest` + `sw.js` (cache `painel-*-vN`, suba o N a cada versão) + `assets/js/app.js` (instalação, passo a passo do iPhone, abas no celular, aviso offline). Guia: `docs/APP-PAINEL.md`.
- CRM: etapa `qualificado`, campos `l.qualif {pagamento, prazo, troca}` e `l.motivoPerda` (obrigatório em “perdido”).
- LGPD: GA4/Pixel só carregam depois do aceite no aviso de cookies (`consent()` em site.js); página `privacidade.html`. O lead guarda gclid/fbclid na UTM.
- Crédito por idade do carro: `D.creditoNivel(c)` → facil (até 7 anos), consulta (8 a 11), avista (12+). Cards, página do carro e descrição seguem isso. Nunca prometer “sem entrada” para todo o estoque.
- Home v1.2: faixas de preço (`FAIXAS` em site.js), barra de números, barra fixa no celular; estoque aceita `?ate=&cambio=&carroceria=&ano=` na URL.

## v5 · Pacote CRM (inspirado no Autoconf) e toque no celular
- Dados novos entram por `ensureV5()` em store.js: só ACRESCENTA (`avaliacoes: []`, `config.avMargem = 12`). Não suba `VERSION` (hoje 5) à toa: com `modoDemo` a migração recria a demonstração.
- **Avaliações de usados** (`#avaliacoes`, `avModal`, `comprarAval`, `printLaudo`): checklist 360º (`D.AV_ITENS`, ok/atencao/ruim + custo do reparo), nota 0–100 (`D.avNota`), preparo (`D.avCusto`), oferta sugerida = FIPE × (1 − avMargem%) − preparo (`D.avSugestao`). Vendedor cria e preenche, mas só diretora/gerente definem a oferta; só a diretora compra para o estoque (cria carro em preparação + lançamento de compra via `syncCarLanc`). Lead do site "Venda seu carro" traz `lead.preAval` e abre a avaliação já preenchida.
- **Giro e preço** (aba do Estoque, `giroHTML`/`sugestaoPreco`): faixas de pátio, % da FIPE, sugestão de preço nunca abaixo do mínimo nem do custo; `preco-aplicar` grava `precoAnterior` (site mostra de/por).
- **Portais**: `carro.portais = {olx:{on,link,desde}}` (`D.PORTAIS`), editado na ficha do carro; filtro no estoque; "Texto p/ portais" em Ações do carro (a linha de crédito usa `D.textoCredito(c)`, seguindo a idade do carro). Origens de lead dos portais em `origemLabel`.
- **Documentação da venda**: `venda.docs = {recibo, vistoria, comunicacao, transferencia, entrega}` com datas; prazo `D.DOC_PRAZO` (30 dias, comunicação ao Detran). Vendas antigas têm `docs` indefinido = sem controle (não geram alerta).
- **Crédito no lead**: `lead.credito = {cpf, nascimento, renda, entrada, bancos:[{banco,status,valor,parcela,prazo}]}`; `D.creditoStatus(l)` → aprovado/analise/recusado.
- **Celular**: camadas com botão voltar (`PainelApp.openLayer/closeLayer` em app.js, acompanha menu e janelas sozinho), arrastar para fechar (assistente → direita, menu → esquerda), janelas em tela cheia com X e Salvar fixos, leads em abas por etapa com botão "próxima etapa", estoque em cartões, campos com 16px (sem zoom do iPhone), cabeçalhos respeitando o notch (`env(safe-area-inset-top)`). A assistente não reabre sozinha no celular.

