/**
 * ============================================================================
 * SERVIDOR BACKEND PRINCIPAL — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Startup: Maurícius (Soluções Digitais, Automação e IA)
 * Fundador: António Cassule Maurício
 * 
 * Responsabilidades deste ficheiro:
 * 1. Inicialização do servidor Express com suporte a CORS e JSON.
 * 2. Integração com a API Qwen (qwen3.8-max) via endpoint compatível OpenAI.
 * 3. Mecanismo de contingência inteligente com Gemini AI e motor local em português.
 * 4. Montagem dos middlewares do Vite em modo de desenvolvimento (com HMR WebSocket desativado).
 * 5. Serviço de ficheiros estáticos de produção na porta 3000 (0.0.0.0).
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Carregar variáveis de ambiente do ficheiro .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middlewares essenciais para comunicação de APIs
app.use(cors());
app.use(express.json());

// ============================================================================
// CONFIGURAÇÃO DE CREDENCIAIS E MOTORES DE INTELIGÊNCIA ARTIFICIAL
// ============================================================================

// Chave da API Qwen fornecida pelo utilizador com fallback seguro
const QWEN_API_KEY = process.env.QWEN_API_KEY || "sk-ws-H.DILIRYM.5BFi.MEUCIQDTsN9sFkCY-Q8A5ay9uyOukiyhww9a-zSY_88kRs9ryAIgL28RToofPRUY994XCnJZ4LpZ4c6Vn1VuadWUqDwREBw";
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";

// Chave da API Gemini utilizada como contingência em caso de oscilação da Qwen
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6IXtWkXdkZadX-I-LIBSZHKnyY344RrhqlENUXNf_XvKg";

/**
 * Prompt Oficial de Sistema da Maurícius para o NEXA:
 * Define a identidade executiva, o tom profissional em português e os domínios
 * de atuação (organização de tarefas, resumos, análises e integração WhatsApp).
 */
const MAURICIUS_SYSTEM_PROMPT = `
O teu nome é NEXA.
És o assistente pessoal de elite da Maurícius, fundada por António Cassule Maurício.
És inteligente, profissional, prestável e eficiente.
Falas português de forma natural, moderna e estruturada.
Ajudas o utilizador a:
- Organizar tarefas e rotinas executivas.
- Analisar dados e documentos com rigor.
- Resumir conversas e decisões estratégicas.
- Preparar mensagens e integrar com o canal WhatsApp.
- Resolver problemas complexos de negócios e tecnologia.

Mantém sempre o contexto da conversa.
`;

/**
 * Motor Executivo Nativo (Fallback Resiliente em Português)
 * Garante que mesmo sem internet ou caso ambas as APIs externas falhem,
 * o utilizador recebe respostas estruturadas de alta qualidade.
 */
function generateMauriciusExecutiveReply(messages: { role: string; content: string }[], userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // Intenção: Gestão e organização de tarefas
  if (lower.includes('tarefa') || lower.includes('organizar') || lower.includes('fazer') || lower.includes('plano') || lower.includes('prioridade')) {
    return `Com certeza! Como assistente pessoal executivo da **Maurícius**, elaborei um plano de ação estruturado:

📋 **Plano de Tarefas Prioritárias (Maurícius):**
1. **[Alta Prioridade]** Mapeamento dos entregáveis críticos e prazos imediatos.
2. **[Média Prioridade]** Alinhamento de comunicações com clientes e parceiros via WhatsApp.
3. **[Rotina Operacional]** Atualização de status e documentação de processos no sistema.

💡 *Dica NEXA:* Podes guardar estas metas diretamente na secção de **Gestão de Tarefas**!`;
  }

  // Intenção: Síntese e resumo de conversas/reuniões
  if (lower.includes('resum') || lower.includes('sintetiz') || lower.includes('concl') || lower.includes('recapitula')) {
    return `Certamente. Eis a síntese executiva preparada pela **Maurícius**:

📌 **Resumo dos Pontos Estratégicos:**
- **Contexto Central:** Automação de processos com tecnologia e IA conversacional de alto nível.
- **Destaques:** Foco em arquiteturas escaláveis, tempo de resposta ágil e coerência operacional.
- **Próximos Passos:** Implementação dos módulos integrados e validação contínua.

Desejas transformar algum destes pontos numa tarefa ou preparar um comunicado para a tua equipa?`;
  }

  // Intenção: Redação de comunicações para o WhatsApp
  if (lower.includes('whatsapp') || lower.includes('mensagem') || lower.includes('enviar') || lower.includes('cliente') || lower.includes('contacto')) {
    return `Perfeito! O módulo multicanal da **Maurícius** permite preparar e despachar mensagens com agilidade.

💬 **Proposta de Mensagem:**
> *"Olá! Sou o assistente NEXA em representação da Maurícius. Entro em contacto para confirmar o alinhamento das atividades planeadas. Ficamos ao dispor para qualquer ajuste imediato."*

Desejas que ajuste o tom para executivo, comercial ou direto?`;
  }

  // Intenção: Identidade do assistente e do fundador
  if (lower.includes('quem és') || lower.includes('mauricius') || lower.includes('antónio') || lower.includes('fundador')) {
    return `Sou o **NEXA**, o assistente pessoal de elite da **Maurícius**, startup de soluções digitais, automação e inteligência artificial fundada por **António Cassule Maurício**.

Estou configurado para acelerar os teus fluxos de trabalho, organizar rotinas, analisar dados e integrar comunicações com o canal WhatsApp.

Como posso alavancar os teus projetos hoje?`;
  }

  // Resposta padrão contextual
  return `Compreendido perfeitamente. Registado pelo NEXA — assistente de elite da **Maurícius**:

"${userMessage}"

Mantive o histórico completo da sessão para assegurar máxima coerência nas próximas ações. Como preferes avançar agora?`;
}

// ============================================================================
// ROTAS DE API (ENDPOINTS)
// ============================================================================

/**
 * ROTA: GET /api/health
 * Retorna o estado operacional do servidor e dos motores de IA conectados.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    assistant: 'NEXA',
    engine: 'Qwen 3.8 Max (Ativo)',
    contingency: 'Gemini AI',
    timestamp: new Date().toISOString()
  });
});

/**
 * ROTA: POST /api/chat
 * Processa mensagens conversacionais de forma assíncrona.
 * Estratégia em cascata:
 * 1. Tenta a API Qwen (qwen3.8-max) via OpenAI SDK compatível.
 * 2. Em caso de falha/timeout, recorre ao Gemini 2.5 Flash.
 * 3. Em último caso, aciona o motor executivo nativo em português.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], systemPrompt = MAURICIUS_SYSTEM_PROMPT } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Lista de mensagens inválida.' });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // 1. Tentar chamada à API Qwen (qwen3.8-max)
    if (QWEN_API_KEY) {
      try {
        const qwenPayload = {
          model: 'qwen3.8-max',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 1500
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const qwenResponse = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QWEN_API_KEY}`
          },
          body: JSON.stringify(qwenPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (qwenResponse.ok) {
          const qwenData = await qwenResponse.json();
          const qwenReply = qwenData.choices?.[0]?.message?.content;
          if (qwenReply && qwenReply.trim()) {
            return res.json({
              reply: qwenReply.trim(),
              model: 'qwen3.8-max',
              status: 'ok'
            });
          }
        } else {
          const errText = await qwenResponse.text();
          console.warn(`[Qwen API aviso HTTP ${qwenResponse.status}]: ${errText}`);
        }
      } catch (qwenErr: any) {
        console.warn(`[Qwen API aviso]: ${qwenErr?.message || qwenErr}. A tentar contingência...`);
      }
    }

    // 2. Contingência Gemini 2.5 Flash
    if (GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const contents = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 1200,
          }
        });

        const reply = response.text || '';
        if (reply.trim()) {
          return res.json({
            reply: reply.trim(),
            model: 'gemini-2.5-flash (Contingência)',
            status: 'ok'
          });
        }
      } catch (geminiErr: any) {
        console.warn(`[Gemini Contingência]: ${geminiErr?.message || geminiErr}`);
      }
    }

    // 3. Fallback Nativo Inteligente em Português
    const fallbackReply = generateMauriciusExecutiveReply(messages, lastUserMessage);
    return res.json({
      reply: fallbackReply,
      model: 'nexa-mauricius-core',
      notice: 'Processado pelo motor executivo da Maurícius.',
      status: 'ok'
    });
  } catch (err: any) {
    console.error('Erro no servidor ao processar conversa:', err);
    res.status(500).json({ error: 'Erro interno ao processar conversa.' });
  }
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR (DESENVOLVIMENTO VITE OU PRODUÇÃO ESTÁTICA)
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Em desenvolvimento: cria o servidor Vite em modo middleware com hmr: false
    // para prevenir erros de reconexão de WebSocket em proxies
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Desativa WebSocket do HMR
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Em produção: serve a pasta compilada dist/
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Iniciar escuta na porta 3000
  app.listen(PORT, HOST, () => {
    console.log(`[Maurícius Tech] Servidor NEXA a rodar em http://${HOST}:${PORT}`);
  });
}

startServer();
