# Plano de subida: GitHub → Netlify → domínio

Passo a passo para colocar o projeto no seu repositório do GitHub e no ar. Faça na ordem.

---

## 0. Antes de tudo: entenda o que vai ao ar

Hoje o site funciona como **demonstração**. Os dados (carros, vendas, leads) ficam salvos no navegador de quem abre.

| Situação | Funciona agora? |
|---|---|
| Mostrar o site e o painel para a diretoria na reunião | ✅ Sim |
| Cliente entrar no site e ver os carros de demonstração | ✅ Sim |
| A loja cadastrar um carro no computador e ele aparecer no celular do cliente | ❌ Só depois da Fase 2 (Supabase) |
| Equipe inteira usando o painel ao mesmo tempo | ❌ Só depois da Fase 2 |

**Recomendação:** suba agora num endereço de teste (ex.: `dancar-autoshop.netlify.app`) para a apresentação. Aponte o domínio oficial só depois da Fase 2.

---

## Caminho rápido na VERCEL (o que você já usa)

1. Crie um repositório novo no GitHub (ex.: `dancar-autoshop`, privado) e suba o **conteúdo** da pasta `dancar`.
2. vercel.com → **Add New → Project** → importe o repositório → Framework: **Other** → **Deploy**.
3. **Settings → Environment Variables**: `GROQ_API_KEY` (uma chave nova do Groq só para a Dancar) e, se quiser, `IA_CODIGO`. Depois **Deployments → ⋯ → Redeploy**.
4. Pronto: o site fica em `dancar-autoshop.vercel.app` e o painel em `/painel.html`.

---

## 1. Criar o repositório no GitHub

### Opção A — pelo navegador (sem terminal)
1. Entre em github.com → botão **New** (novo repositório).
2. Nome: `dancar-autoshop` · marque **Private** · clique em **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Descompacte o ZIP no seu computador. Abra a pasta `dancar` e **arraste o conteúdo dela** (os arquivos e as pastas `assets`, `docs`, `supabase`), não a pasta `dancar` em si.
5. Embaixo, escreva “Versão 2 — site + painel” e clique em **Commit changes**.

### Opção B — pelo terminal / Claude Code
Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Versão 2 — site + painel Dancar Auto Shop"
gh repo create dancar-autoshop --private --source=. --push
```

Se você ainda não usa o `gh`, peça ao Claude Code: *“Instala e loga o GitHub CLI e sobe esse projeto num repositório privado chamado dancar-autoshop”*.

---

## 2. Colocar no ar com a Netlify

1. Entre em app.netlify.com → **Add new site → Import an existing project → GitHub**.
2. Autorize e escolha o repositório `dancar-autoshop`.
3. Configuração do build:
   - **Build command:** deixe vazio
   - **Publish directory:** `.` (um ponto)
4. Clique em **Deploy**. Em 1 minuto o site está no ar num endereço `algo.netlify.app`.
5. Em **Site configuration → Change site name**, troque para `dancar-autoshop`.

A partir daí, **cada alteração enviada ao GitHub publica sozinha** na Netlify.

> **Alternativas:** a Vercel funciona igual (o `vercel.json` já está pronto). O GitHub Pages também funciona: Settings → Pages → Branch `main` / pasta `/ (root)`.

---

## 2.1 Ligar a assistente de IA (opcional, grátis)

Netlify: **Site configuration → Environment variables** → `GROQ_API_KEY` → **Trigger deploy**. Vercel: **Settings → Environment Variables** → `GROQ_API_KEY` → **Redeploy**. Passo a passo completo em **`docs/ASSISTENTE-IA.md`**.

---

## 3. Domínio oficial (depois da Fase 2)

Hoje a loja usa **www.dancarbrmultimarcas.com.br** com o site da Autoconf. Antes de mexer, confirme com a Dancar quem tem acesso à conta do Registro.br e combine a data da troca para o site não ficar fora do ar.

1. Netlify → **Domain management → Add a domain** → `dancarbrmultimarcas.com.br`.
2. A Netlify mostra os registros DNS exatos. Você cadastra no Registro.br de um destes dois jeitos:
   - trocar os **servidores DNS** para os da Netlify (mais simples), ou
   - criar um **CNAME** `www` apontando para `dancar-autoshop.netlify.app` e o registro **A** do domínio raiz com o IP que a Netlify indicar.
3. Ative o **HTTPS** (certificado gratuito, automático).
4. Se o domínio final for outro, troque `www.dancarbrmultimarcas.com.br` em `robots.txt`, `sitemap.xml` e nas tags `canonical`/`og:` dos HTMLs (peça ao Claude Code para trocar em todos os arquivos).

---

## 4. Checklist antes de divulgar o site oficial

- [ ] Fase 2 concluída: Supabase ligado (dados compartilhados e login seguro)
- [ ] Painel → Configurações → **Começar do zero (dados reais)**
- [ ] Carros reais cadastrados com fotos, preços, km e opcionais conferidos
- [ ] Equipe real cadastrada, com regras de comissão e metas combinadas com a Dancar
- [ ] História e carta da loja revisadas com ela
- [ ] CNPJ, horário de funcionamento e link de avaliação do Google preenchidos
- [ ] IDs do Google Analytics 4 e do Pixel da Meta colados em Configurações
- [ ] Política de privacidade (LGPD) publicada e linkada no rodapé
- [ ] Senha da loja trocada (a de demonstração é pública)
- [ ] Teste completo no celular: abrir carro, WhatsApp, agendar, pré-análise
- [ ] Site cadastrado no Google Search Console com o `sitemap.xml`
- [ ] Link do site colocado na bio do Instagram e no Google Meu Negócio

---

## 5. Rotina de atualização

1. Abra a pasta no Claude Code e peça a mudança.
2. Confira no navegador (`npx serve .`).
3. Peça: *“faz o commit e o push”*. A Netlify publica sozinha em cerca de 1 minuto.
