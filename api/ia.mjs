/* =====================================================================
   Assistente de IA na VERCEL (endereço /api/ia)
   É a mesma função da Netlify (netlify/functions/ia.mjs), só "embrulhada"
   no formato que a Vercel entende. Chave: Vercel → Settings →
   Environment Variables → GROQ_API_KEY (e, opcional, IA_CODIGO).
   ===================================================================== */
import handler from '../netlify/functions/ia.mjs';

export function GET(request) { return handler(request); }
export function POST(request) { return handler(request); }
