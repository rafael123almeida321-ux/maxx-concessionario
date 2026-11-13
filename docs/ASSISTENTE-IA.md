# Assistente de IA do painel

Um chat dentro do painel (botão dourado **Assistente**, no canto de baixo). A diretoria e a equipe escrevem ou falam, e a assistente:

- **procura**: carros, preços, carros parados, leads, agenda, vendas, clientes, comissões e, só para a diretoria, o financeiro;
- **faz**: muda preço, status e destaque de carro, reserva carro, cadastra e atualiza lead, agenda visita ou test drive, lança conta e publica comunicado. **Tudo pede confirmação antes**;
- **abre**: proposta em PDF, arte de Instagram, tela de registrar venda, ficha do lead, relatório do mês;
- **escreve**: mensagem de WhatsApp (com botão para abrir no WhatsApp), post e legenda de Instagram, texto de anúncio.

Ela respeita o cargo de quem está logado: o vendedor nunca vê custo, lucro, preço mínimo nem financeiro, e só enxerga os leads e as vendas dele.

Usa o **Groq** no plano gratuito, sem cartão. Por isso não existe risco de cobrança: se o limite grátis acabar, ela só pede para esperar um minuto.

---

## Ligar em 5 minutos

### 1. Pegar a chave do Groq (grátis)
1. Entre em **console.groq.com** e faça login (pode ser com o Google).
2. Menu **API Keys → Create API Key**. Dê o nome `dancar-painel`.
3. Copie a chave. Ela começa com `gsk_` e só aparece uma vez.

> **Não cadastre cartão** no Groq. Sem cartão, a conta fica no plano gratuito e nunca gera cobrança.

### 2A. Se o site está na VERCEL
1. **vercel.com** → abra o projeto da diretoria → **Settings → Environment Variables**.
2. Key: `GROQ_API_KEY` · Value: a chave `gsk_...` · marque **Production** (e Preview, se quiser) → **Save**.
3. **Deployments** → nos três pontinhos do último deploy → **Redeploy** (a função só lê a chave num deploy novo).

O arquivo `api/ia.mjs` é a função na Vercel. Ele reaproveita `netlify/functions/ia.mjs`, então não apague a pasta `netlify`.

### 2B. Se o site está na NETLIFY
1. **app.netlify.com** → abra o site da diretoria.
2. **Site configuration → Environment variables → Add a variable → Add a single variable**.
3. Key: `GROQ_API_KEY` · Value: a chave `gsk_...` → **Create variable**.
4. **Deploys → Trigger deploy → Deploy site** (a função só lê a chave num deploy novo).

### 3. Testar
Painel → **Configurações → Assistente de IA**. O selo deve mostrar **Conectada (groq)**. Se o botão Assistente não aparecer, recarregue com **Ctrl+Shift+R** (no celular, feche e abra a aba) para o navegador pegar a versão nova. Depois clique em **Assistente** e pergunte: *“Como está a loja este mês?”*.

---

## Segurança (recomendado antes de usar com dados reais)

O endereço `/api/ia` é público. Ele só aceita pedidos vindos do próprio site, mas para trancar de vez:

1. Na hospedagem (Vercel ou Netlify) crie mais uma variável: `IA_CODIGO` = uma senha só da loja (ex.: `dancar-2026`).
2. Faça um novo deploy.
3. Em cada computador ou celular da equipe, digite esse código uma vez em **Configurações → Assistente de IA** (ou no próprio chat, que pede o código).

Também em **Configurações → Assistente de IA** a diretoria pode desligar a assistente ou deixar só para ela, ou só para diretora e gerente.

---

## Como funciona por dentro

```
Painel (navegador)                 Vercel ou Netlify                    Groq
 ia.js ── conversa + ferramentas ──▶ netlify/functions/ia.mjs ──▶ modelo de IA
   ▲                                 (guarda GROQ_API_KEY)               │
   └──────── resposta / pedido de ferramenta ◀──────────────────────────┘
 As ferramentas rodam no navegador usando o diretoriaDB, com as permissões do cargo.
```

- `assets/js/ia.js`: o chat, as ferramentas (consultar e ações), as permissões e a confirmação.
- `netlify/functions/ia.mjs` (Netlify) e `api/ia.mjs` (Vercel, reaproveita o da Netlify): guardam a chave e passa a conversa para o Groq. Se um modelo bate o limite grátis do minuto, tenta o próximo, nesta ordem: `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant`.
- `assets/js/painel.js`: só ganhou a “ponte” `window.diretoriaPainel` (no fim do arquivo) e o card nas Configurações.
- Na **Fase 2 (Supabase)** não muda nada aqui: as ferramentas usam o diretoriaDB, que é o que vai trocar.

### Limites do plano gratuito
O Groq limita tokens por minuto em cada modelo (por exemplo, 8 mil/minuto e 200 mil/dia no `gpt-oss-120b`). Uma pergunta comum gasta de 3 a 6 mil. Como a função troca de modelo sozinha, dá para várias perguntas por minuto e centenas por dia, o que sobra para uma loja. Se um dia faltar, a diretoria vê o aviso “tente de novo em 1 minutinho”.

### Variáveis opcionais
| Variável | Para quê |
|---|---|
| `IA_CODIGO` | Código de acesso da equipe (recomendado) |
| `IA_MODELO` | Forçar um modelo do Groq específico |
| `IA_URL` + `IA_CHAVE` | Usar outro provedor compatível com a API da OpenAI (ex.: Gemini, OpenRouter) no lugar do Groq |
| `IA_ORIGENS` | Outros domínios autorizados, separados por vírgula (o próprio site já é autorizado) |

### Testar no computador
`npx serve .` não roda funções. Para testar a IA localmente: `npx netlify-cli dev` (lê a chave de um arquivo `.env` com `GROQ_API_KEY=...`, que já está no `.gitignore`).

### Privacidade (LGPD)
Para responder, a assistente envia ao Groq os trechos de dados que consultou (por exemplo, nome e telefone de um lead). O Groq não usa dados da API para treinar modelos. Cite isso na política de privacidade do site quando ela for publicada.

### Ideias para depois
- Ler foto do documento do carro e cadastrar sozinha.
- Resumo automático toda manhã no WhatsApp da diretoria (precisa de automação por fora, ex.: n8n).
- Responder clientes do site direto, com aprovação de um vendedor.
