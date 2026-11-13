# Como reaproveitar este projeto para outra concessionária

O projeto foi preparado para trocar de loja rápido. Faça uma cópia da pasta e siga a ordem abaixo (ou peça ao Claude Code: “troca este projeto para a loja X seguindo docs/COMO-TROCAR-DE-LOJA.md”).

## 1. Identidade (um lugar só)
`assets/js/store.js` → bloco **IDENTIDADE DA LOJA**:
- `loja`, `marcaCurta`, `slogan`, `heroTitulo`, `heroDestaque` (palavra do título em destaque), `heroSub`, `cartaLoja`
- `whatsapp` (com 55 e DDD), `whatsappExibicao`, `telefone`, `email`, `instagram`, `facebook`
- `endereco`, `enderecoCompleto`, `bairro`, `cidade`, `cep`, `mapsQuery`, `horario`
- `dono`, `donoFoto` (se o dono ou a dona for a “cara” da loja; vazio = foco na marca)
- `metaLoja`, `taxaJuros`
- Usuários de demonstração em `usuarios` (a diretoria usa o id `u_dir`).
- Estoque inicial em `var estoque = [...]` (ou deixe vazio e importe a planilha pelo painel).

## 2. Cores
- Site: `assets/css/site.css`, bloco `:root` no topo (`--acc`, `--gold`, `--gold-hi`, `--gold-grad`…). O tema da Dancar é claro; para um tema escuro, troque `--bg`, `--surface`, `--text` e `--glass`/`--ink`.
- Painel: `assets/css/painel.css`, bloco `:root` (`--acc`, `--gold`, `--gold-grad`).
- Imagem provisória dos carros: cores `PH_BG`, `PH_ACC`, `PH_INK` em `store.js`.

## 3. Imagens
Em `assets/img/`: `logo.svg` (fundo claro), `logo-branco.svg` (fundo escuro), `logo-escuro.svg` (impressão), `icone.svg`, `favicon.png`, `apple-touch-icon.png`, `og.jpg` (1200×630, compartilhamento) e fotos.
Se a loja só tiver a logo no Instagram, dá para vetorizar o print (foi assim com a Dancar).

## 4. Textos das páginas
Procure o nome da loja nos HTML (`index.html`, `loja.html`, `venda-seu-carro.html`, `contato.html`…) e nas `<meta>` de cada página (título, descrição, `og:` e `canonical`). Também em `sitemap.xml` e `robots.txt` (domínio).

## 5. Conferir
- Nenhum nome da loja antiga: `grep -ri "nome-antigo" .`
- Suba o `?v=` das tags `<script>` e `<link>` nos HTML.
- Teste no celular (390 px) e no computador, e o painel com cada cargo.
- Nova chave do Groq e novo projeto na Vercel/Netlify para cada loja.
