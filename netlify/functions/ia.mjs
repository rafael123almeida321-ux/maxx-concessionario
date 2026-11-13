/* =====================================================================
   LOJA — Assistente de IA (função da Netlify)
   Endereço: /api/ia  ·  Na Vercel, api/ia.mjs reaproveita este mesmo arquivo.

   Por que existe: a chave da IA NUNCA pode ficar no site (qualquer pessoa
   veria abrindo o código da página). Ela fica guardada na Netlify, numa
   variável de ambiente, e só esta função usa.

   Variáveis de ambiente (Netlify → Site configuration → Environment variables;
   Vercel → Settings → Environment Variables):
     GROQ_API_KEY   (obrigatória) chave do Groq, começa com gsk_
     IA_CODIGO      (opcional)    código que a equipe digita uma vez no painel;
                                  sem ele ninguém de fora consegue usar a IA
     IA_MODELO      (opcional)    força um modelo específico
     IA_URL         (opcional)    outro provedor compatível com OpenAI
                                  (ex.: Gemini, OpenRouter). Use junto com IA_CHAVE.
     IA_CHAVE       (opcional)    chave desse outro provedor

   Os dados da loja NÃO passam por aqui guardados: o painel manda a
   conversa, a IA responde, e as ações acontecem no navegador da equipe.
   ===================================================================== */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/* Ordem de tentativa no plano gratuito do Groq. Cada modelo tem o seu
   próprio limite por minuto: quando um estoura, passamos para o próximo. */
const GROQ_MODELOS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant'
];

const LIMITES = { mensagens: 40, caracteres: 60000, ferramentas: 24, maxTokens: 1200, prazoMs: 9000 };

const env = k => {
  try { if (typeof Netlify !== 'undefined' && Netlify.env) { const v = Netlify.env.get(k); if (v) return v; } } catch (e) { /* ok */ }
  return process.env[k] || '';
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function provedor() {
  const chaveGroq = env('GROQ_API_KEY');
  const url = env('IA_URL'), chave = env('IA_CHAVE');
  if (url && chave) return { nome: 'personalizado', url, chave, modelos: [env('IA_MODELO') || 'gpt-4o-mini'] };
  const k = chaveGroq || chave;
  if (!k) return null;
  return { nome: 'groq', url: GROQ_URL, chave: k, modelos: env('IA_MODELO') ? [env('IA_MODELO')] : GROQ_MODELOS };
}

/* só deixa passar os campos que a API entende (evita lixo e campos extras) */
function limparMensagens(msgs) {
  return msgs.map(m => {
    const o = { role: m.role };
    if (m.role === 'tool') { o.tool_call_id = String(m.tool_call_id || ''); o.content = String(m.content == null ? '' : m.content); return o; }
    o.content = m.content == null ? (m.tool_calls ? null : '') : String(m.content);
    if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length) {
      o.tool_calls = m.tool_calls.map(t => ({ id: String(t.id), type: 'function', function: { name: String(t.function && t.function.name), arguments: String((t.function && t.function.arguments) || '{}') } }));
    }
    return o;
  });
}

function validar(body) {
  if (!body || !Array.isArray(body.messages) || !body.messages.length) return 'Conversa vazia.';
  if (body.messages.length > LIMITES.mensagens) return 'Conversa longa demais. Comece uma nova.';
  const roles = ['system', 'user', 'assistant', 'tool'];
  if (body.messages.some(m => !m || !roles.includes(m.role))) return 'Mensagem inválida.';
  if (JSON.stringify(body.messages).length > LIMITES.caracteres) return 'Conversa longa demais. Comece uma nova.';
  if (body.tools && (!Array.isArray(body.tools) || body.tools.length > LIMITES.ferramentas)) return 'Ferramentas inválidas.';
  return null;
}

function origemPermitida(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;                       // mesma página (alguns navegadores não mandam)
  let host = '';
  try { host = new URL(origin).host; } catch (e) { return false; }
  const proprios = [new URL(req.url).host, req.headers.get('x-forwarded-host'), req.headers.get('host')].filter(Boolean);
  if (proprios.includes(host)) return true;
  const extras = env('IA_ORIGENS').split(',').map(s => s.trim()).filter(Boolean);
  return extras.some(o => o === origin || o === host);
}

async function chamar(p, modelo, payload, sinal, semRaciocinio) {
  const body = Object.assign({ model: modelo }, payload);
  /* modelos gpt-oss "pensam" antes de responder: no nível baixo ficam bem mais rápidos */
  if (!semRaciocinio && /gpt-oss/.test(modelo)) body.reasoning_effort = 'low';
  const r = await fetch(p.url, {
    method: 'POST', signal: sinal,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + p.chave },
    body: JSON.stringify(body)
  });
  let data = null; try { data = await r.json(); } catch (e) { data = null; }
  return { status: r.status, data };
}

export default async (req) => {
  const p = provedor();

  if (req.method === 'GET') {
    return json(200, { ok: true, configurada: !!p, provedor: p ? p.nome : null, codigo: !!env('IA_CODIGO') });
  }
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });
  if (!origemPermitida(req)) return json(403, { erro: 'Origem não permitida.' });
  if (!p) return json(503, { erro: 'A IA ainda não foi configurada. Falta colocar a GROQ_API_KEY nas variáveis de ambiente da hospedagem (Vercel ou Netlify) e fazer um novo deploy.', codigo: 'sem-chave' });

  const codigo = env('IA_CODIGO');
  if (codigo && req.headers.get('x-ia-codigo') !== codigo) return json(401, { erro: 'Código de acesso da IA inválido.', codigo: 'codigo' });

  let body; try { body = await req.json(); } catch (e) { return json(400, { erro: 'Pedido inválido.' }); }
  const invalido = validar(body); if (invalido) return json(400, { erro: invalido });

  const payload = {
    messages: limparMensagens(body.messages),
    temperature: 0.3,
    max_tokens: LIMITES.maxTokens
  };
  if (body.tools && body.tools.length) { payload.tools = body.tools; payload.tool_choice = 'auto'; }

  const inicio = Date.now();
  const tentativas = [];
  for (const modelo of p.modelos) {
    const resta = LIMITES.prazoMs - (Date.now() - inicio);
    if (resta < 1200) break;
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), resta);
    try {
      let r = await chamar(p, modelo, payload, ctrl.signal);
      /* se o provedor não aceitar o ajuste de raciocínio, tenta de novo sem ele */
      if (r.status === 400 && /reasoning/i.test(JSON.stringify(r.data || ''))) r = await chamar(p, modelo, payload, ctrl.signal, true);
      clearTimeout(t);
      if (r.status === 401 || r.status === 403) return json(502, { erro: 'A chave da IA foi recusada. Confira a GROQ_API_KEY na hospedagem (Vercel ou Netlify).', codigo: 'chave' });
      if (r.status >= 200 && r.status < 300 && r.data && r.data.choices && r.data.choices[0]) {
        const m = r.data.choices[0].message || {};
        const msg = { role: 'assistant', content: m.content || null };
        if (Array.isArray(m.tool_calls) && m.tool_calls.length) msg.tool_calls = m.tool_calls.map(x => ({ id: x.id, type: 'function', function: { name: x.function.name, arguments: x.function.arguments || '{}' } }));
        return json(200, { message: msg, modelo, uso: r.data.usage || null });
      }
      tentativas.push(modelo + ': ' + r.status);
      /* 429 = limite do plano grátis; 400 de ferramenta mal formada, 404 modelo saiu do ar, 5xx = instabilidade → próximo modelo */
    } catch (e) {
      clearTimeout(t);
      tentativas.push(modelo + ': ' + (e.name === 'AbortError' ? 'demorou' : 'falhou'));
    }
  }
  const limite = tentativas.some(x => /: 429$/.test(x));
  return json(limite ? 429 : 502, {
    erro: limite ? 'A assistente atingiu o limite gratuito deste minuto. Tente de novo em 1 minutinho.' : 'A IA não respondeu agora. Tente de novo em instantes.',
    codigo: limite ? 'limite' : 'falha', tentativas
  });
};

export const config = { path: '/api/ia' };
