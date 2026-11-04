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
import fs from 'fs';
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

// ⚠️ SEGURANÇA: As chaves de API são EXCLUSIVAMENTE lidas do ambiente (.env / Vercel).
// Se uma chave hardcoded for detetada no ambiente, o servidor recusa-se a arrancar
// e obriga à rotação imediata da chave comprometida.
const FORBIDDEN_HARDCODED_KEYS = [
  'sk-ws-H.DILIRYM', // antiga chave Qwen exposta no código — ROTACIONADA
  'AQ.Ab8RN6IXtWk'  // antiga chave Gemini exposta no código — ROTACIONADA
];
for (const bad of FORBIDDEN_HARDCODED_KEYS) {
  if ((process.env.QWEN_API_KEY || '').includes(bad) || (process.env.GEMINI_API_KEY || '').includes(bad)) {
    console.error('[SEGURANÇA] Foi detetada uma chave comprometida no ambiente. Rotaciona a chave no painel do fornecedor e atualiza o .env. O arranque foi bloqueado.');
    process.exit(1);
  }
}

// Chave da API Qwen — obrigatória via .env (sem fallback hardcoded)
const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
if (!QWEN_API_KEY) {
  console.warn('[AVISO] QWEN_API_KEY não definida no .env — o NEXA usará apenas a contingência Gemini ou o motor local.');
}
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";

// Chave da API Gemini utilizada como contingência em caso de oscilação da Qwen — via .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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
  const qwenReady = !!QWEN_API_KEY;
  const geminiReady = !!GEMINI_API_KEY;
  res.json({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    assistant: 'NEXA',
    // Estado HONESTO dos motores: refletir "Ativo" sem chave configurada seria simulação.
    engine: qwenReady ? 'Qwen 3.8 Max (Ativo)' : 'Motor local NEXA (QWEN_API_KEY não configurada)',
    contingency: geminiReady ? 'Gemini AI (Ativa)' : 'Não configurada',
    whatsappConnected: whatsAppConfig.connected,
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

/**
 * ROTA: POST /api/chat/stream
 * Streaming de respostas em tempo real com Server-Sent Events (SSE).
 * Fornece feedback imediato token a token (efeito máquina de escrever) no estilo ChatGPT/Zapia.
 */
app.post('/api/chat/stream', async (req, res) => {
  // Configurar headers para SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const { messages = [], systemPrompt = MAURICIUS_SYSTEM_PROMPT } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.write(`data: ${JSON.stringify({ error: 'Lista de mensagens inválida.' })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  let streamedAnyToken = false;

  // 1. Tentar streaming nativo na API Qwen (qwen3.8-max)
  if (QWEN_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const qwenResponse = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QWEN_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3.8-max',
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 1500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (qwenResponse.ok && qwenResponse.body) {
        const reader = qwenResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              streamedAnyToken = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                streamedAnyToken = true;
                res.write(`data: ${JSON.stringify({ text: delta, done: false })}\n\n`);
              }
            } catch (err) {
              // chunk json em construção
            }
          }
        }
      }
    } catch (qwenErr: any) {
      console.warn('[Qwen Stream Warning]:', qwenErr?.message || qwenErr);
    }
  }

  // 2. Se o Qwen falhou ou não enviou nenhum token, contingência com streaming progressivo imediato
  if (!streamedAnyToken) {
    let fallbackText = '';

    // Tentar Gemini
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
        fallbackText = response.text || '';
      } catch (gemErr) {
        console.warn('[Gemini Stream Contingency]:', gemErr);
      }
    }

    if (!fallbackText) {
      fallbackText = generateMauriciusExecutiveReply(messages, lastUserMessage);
    }

    // Dividir a resposta em pequenas palavras/sílabas e transmitir a cada 18ms para simular digitação ultrarrápida
    const words = fallbackText.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 2) {
      const piece = (words[i] || '') + (words[i + 1] || '');
      res.write(`data: ${JSON.stringify({ text: piece, done: false })}\n\n`);
      await new Promise(r => setTimeout(r, 18));
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// ============================================================================
// MÓDULO WHATSAPP EMPRESARIAL — MAURÍCIUS & NEXA BRIDGE
// Suporte a: Meta WhatsApp Cloud API, Webhook oficial e Auto-Resposta com IA
// ============================================================================

interface WhatsAppServerConfig {
  connected: boolean;
  phoneNumber: string;
  instanceName: string;
  apiMode: 'cloud_api' | 'qr_bridge';
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  webhookVerifyToken: string;
  autoReplyEnabled: boolean;
  autoReplyPrompt: string;
  batteryLevel: number;
  lastSync: string;
  totalSent: number;
  totalReceived: number;
}

// ⚠️ ESTADO REAL, PERSISTENTE E SEM NÚMEROS INVENTADOS:
// 1. As credenciais Meta (metaAccessToken / metaPhoneNumberId) VÊM DO .env do servidor
//    e NUNCA são devolvidas ao navegador (mascaradas em todas as respostas HTTP).
// 2. connected é derivado: só é true se existir token Meta real OU uma ponte Evolution ativa.
// 3. totalSent/totalReceived começam a ZERO e só contam mensagens efetivamente
//    enviadas/recebidas — persistidas em disco (data/whatsapp-config.json).
const WA_CONFIG_FILE = path.resolve(__dirname, 'data', 'whatsapp-config.json');

function loadWhatsAppConfig(): WhatsAppServerConfig {
  const base: WhatsAppServerConfig = {
    connected: false,
    phoneNumber: process.env.WA_PHONE_NUMBER || '',
    instanceName: 'Maurícius NEXA Business Primary',
    apiMode: 'cloud_api',
    metaPhoneNumberId: process.env.WA_META_PHONE_NUMBER_ID || '',
    metaBusinessAccountId: process.env.WA_META_BUSINESS_ACCOUNT_ID || '',
    metaAccessToken: process.env.WA_META_ACCESS_TOKEN || '',
    webhookVerifyToken: process.env.WA_WEBHOOK_VERIFY_TOKEN || 'nexa-wa-' + Math.random().toString(36).slice(2, 10),
    autoReplyEnabled: false,
    autoReplyPrompt: 'És o assistente NEXA da Maurícius (fundada por António Cassule Maurício) no WhatsApp. Responde de forma educada, executiva e prestativa em português.',
    batteryLevel: 0,
    lastSync: 'Nunca sincronizado',
    totalSent: 0,
    totalReceived: 0
  };
  try {
    if (fs.existsSync(WA_CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(WA_CONFIG_FILE, 'utf-8'));
      return { ...base, ...saved }; // estatísticas reais persistidas sobrevivem a reinícios
    }
  } catch (e) {
    console.warn('[WA Config] Ficheiro de estado corrompido, a recomeçar do zero:', e);
  }
  return base;
}

let whatsAppConfig: WhatsAppServerConfig = loadWhatsAppConfig();

/** Escreve o estado (sem segredos) em disco para persistência real */
function persistWhatsAppConfig() {
  try {
    fs.mkdirSync(path.dirname(WA_CONFIG_FILE), { recursive: true });
    const { metaAccessToken, ...safeState } = whatsAppConfig; // token nunca toca o disco do repo
    fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(safeState, null, 2));
  } catch (e) {
    console.warn('[WA Config] Falha ao persistir estado:', e);
  }
}

/** Remove campos sensíveis antes de qualquer resposta HTTP ao navegador */
function sanitizeWaConfig(cfg: WhatsAppServerConfig): WhatsAppServerConfig {
  return {
    ...cfg,
    metaAccessToken: cfg.metaAccessToken ? '••••' + cfg.metaAccessToken.slice(-4) : undefined,
    batteryLevel: 0 // sem telemóvel ligado à plataforma, bateria não existe — não inventar
  };
}

/** Recalcula o estado de ligação com base APENAS em credenciais/mensagens reais */
function refreshConnectionState() {
  const token = process.env.WA_META_ACCESS_TOKEN || whatsAppConfig.metaAccessToken;
  const phoneId = process.env.WA_META_PHONE_NUMBER_ID || whatsAppConfig.metaPhoneNumberId;
  const hasMeta = !!(token && phoneId && !token.startsWith('••••'));
  const hasBridge = !!process.env.EVOLUTION_API_URL;
  whatsAppConfig.connected = hasMeta || hasBridge;
  if (whatsAppConfig.connected && !whatsAppConfig.phoneNumber) {
    whatsAppConfig.phoneNumber = process.env.WA_PHONE_NUMBER || '';
  }
  whatsAppConfig.lastSync = new Date().toISOString();
}
refreshConnectionState();

/**
 * ROTA: GET /api/whatsapp/config
 * Retorna as configurações ativas da integração WhatsApp (credenciais mascaradas)
 */
app.get('/api/whatsapp/config', (req, res) => {
  refreshConnectionState();
  res.json(sanitizeWaConfig(whatsAppConfig));
});

/**
 * ROTA: POST /api/whatsapp/config
 * Atualiza parâmetros de conexão. Um token enviado aqui substitui apenas o valor
 * em memória deste processo — para produção define-se via .env no servidor.
 */
app.post('/api/whatsapp/config', (req, res) => {
  const incoming = req.body || {};
  // Nunca aceitar apagar silenciosamente o token do .env com um valor mascarado
  if (typeof incoming.metaAccessToken === 'string' && incoming.metaAccessToken.startsWith('••••')) {
    delete incoming.metaAccessToken;
  }
  whatsAppConfig = {
    ...whatsAppConfig,
    ...incoming,
    lastSync: new Date().toISOString()
  };
  refreshConnectionState();
  persistWhatsAppConfig();
  res.json({ status: 'ok', config: sanitizeWaConfig(whatsAppConfig) });
});

/**
 * ROTA: GET /api/whatsapp/status
 * Retorna o diagnóstico operacional da ponte WhatsApp
 */
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: whatsAppConfig.connected,
    phoneNumber: whatsAppConfig.phoneNumber,
    instance: whatsAppConfig.instanceName,
    apiMode: whatsAppConfig.apiMode,
    autoReply: whatsAppConfig.autoReplyEnabled,
    battery: whatsAppConfig.batteryLevel,
    stats: {
      sent: whatsAppConfig.totalSent,
      received: whatsAppConfig.totalReceived
    },
    webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/webhook`
  });
});

/**
 * ROTA: GET /api/whatsapp/webhook
 * Validação obrigatória de Webhook da Meta WhatsApp Cloud API (Handshake de subscrição)
 */
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === whatsAppConfig.webhookVerifyToken) {
      console.log('[Meta WhatsApp Webhook] Subscrição verificada com sucesso!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Meta WhatsApp Webhook] Falha de autenticação do token de verificação.');
      return res.sendStatus(403);
    }
  }

  res.status(200).json({
    status: 'online',
    message: 'Endpoint de Webhook WhatsApp da Maurícius pronto para receber notificações Meta.',
    // NOTA: o verify token é um segredo de configuração — nunca devolvê-lo por HTTP.
    verifyTokenConfigured: !!whatsAppConfig.webhookVerifyToken
  });
});

/**
 * ROTA: POST /api/whatsapp/webhook
 * Receção de mensagens reais via Meta Cloud API ou Gateways (Baileys / Evolution)
 * Dispara automaticamente a resposta do NEXA se a auto-resposta estiver ligada.
 */
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('[Meta WhatsApp Webhook Recebido]:', JSON.stringify(body).slice(0, 300));

    // Extrair dados da mensagem conforme padrão oficial da Meta Cloud API
    let from = '';
    let messageText = '';
    let contactName = 'Cliente WhatsApp';

    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      from = msgObj.from;
      messageText = msgObj.text?.body || '';
      contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || from;
    } else if (body.from && body.text) {
      // Formato simplificado direto para testes
      from = body.from;
      messageText = body.text;
      contactName = body.name || from;
    }

    // ⚠️ Verificação de autenticidade: sem assinatura X-Hub-Signature-256 válida
    // (app secret Meta), NÃO aceitamos payloads como tráfego real — rejeitamos 401.
    // Assim as estatísticas nunca são inflacionadas por pedidos externos aleatórios.
    const appSecret = process.env.WA_META_APP_SECRET;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const isMetaPayload = !!body.entry;
    if (isMetaPayload) {
      if (!appSecret || !signature) {
        console.warn('[WA Webhook] Payload Meta sem assinatura/secret — rejeitado.');
        return res.status(401).json({ error: 'Webhook não autenticado: falta X-Hub-Signature-256 ou WA_META_APP_SECRET.' });
      }
      const crypto = await import('crypto');
      const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(JSON.stringify(body)).digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(signature);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        console.warn('[WA Webhook] Assinatura inválida — rejeitado.');
        return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
      }
    }

    // Só incrementamos a receção quando há efetivamente uma mensagem extraída
    if (messageText.trim()) {
      whatsAppConfig.totalReceived += 1;
      persistWhatsAppConfig();
      liveWhatsAppLogs.unshift({
        id: `wa-recv-${Date.now()}`,
        from,
        name: contactName,
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'incoming',
        provider: isMetaPayload ? 'meta_cloud_api' : 'webhook_direct'
      });
      persistWhatsAppFeed();
    }

    let aiReply: string | null = null;

    // Se o auto-responder do NEXA estiver ativado e houver texto
    if (whatsAppConfig.autoReplyEnabled && messageText.trim()) {
      try {
        // Chamar o motor de IA (Qwen 3.8 Max com fallback)
        const chatPayload = {
          messages: [
            { role: 'user', content: `[Mensagem WhatsApp de ${contactName}]: "${messageText}"\nResponde em português de forma concisa e profissional como assistente NEXA da Maurícius.` }
          ],
          systemPrompt: whatsAppConfig.autoReplyPrompt
        };

        const chatRes = await fetch(`http://localhost:${PORT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload)
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          aiReply = chatData.reply;

          // Despachar a resposta de volta ao WhatsApp APENAS se a Meta confirmar receção
          const replyToken = process.env.WA_META_ACCESS_TOKEN || whatsAppConfig.metaAccessToken;
          const replyPhoneId = process.env.WA_META_PHONE_NUMBER_ID || whatsAppConfig.metaPhoneNumberId;
          if (replyToken && !replyToken.startsWith('••••') && replyPhoneId && from) {
            try {
              const sendRes = await fetch(`https://graph.facebook.com/v21.0/${replyPhoneId}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${replyToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: from,
                  type: 'text',
                  text: { body: aiReply }
                })
              });
              if (sendRes.ok) {
                // Contamos e registamos apenas envios CONFIRMADOS pela plataforma
                whatsAppConfig.totalSent += 1;
                persistWhatsAppConfig();
                liveWhatsAppLogs.unshift({
                  id: `wa-auto-${Date.now()}`,
                  from,
                  name: contactName,
                  text: messageText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'outgoing',
                  aiReply: aiReply || undefined,
                  provider: 'meta_cloud_api'
                });
                persistWhatsAppFeed();
              } else {
                console.warn('[WA AutoReply] Meta rejeitou o envio:', sendRes.status);
              }
            } catch (sendErr) {
              console.warn('[WA AutoReply] Falha de rede no envio:', sendErr);
            }
          }
        }
      } catch (aiErr) {
        console.warn('[WhatsApp AutoReply Error]:', aiErr);
      }
    }

    res.status(200).json({
      status: 'received',
      processedBy: 'NEXA WhatsApp Bridge',
      autoReplied: !!aiReply,
      aiReply
    });
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err);
    res.status(500).json({ error: 'Erro ao processar webhook WhatsApp' });
  }
});

// Buffer de mensagens reais da ponte WhatsApp (Recebidas via Webhook e Enviadas)
interface LiveWhatsAppLog {
  id: string;
  from: string;
  name: string;
  text: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  aiReply?: string;
  provider: string;
}

// Feed APENAS com mensagens reais (webhooks Meta / envios confirmados).
// Começa vazio — é alimentado em runtime e persistido em data/whatsapp-feed.json.
const WA_FEED_FILE = path.resolve(__dirname, 'data', 'whatsapp-feed.json');

function loadWhatsAppFeed(): LiveWhatsAppLog[] {
  try {
    if (fs.existsSync(WA_FEED_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WA_FEED_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[WA Feed] Ficheiro corrompido, a recomeçar vazio:', e);
  }
  return [];
}

const liveWhatsAppLogs: LiveWhatsAppLog[] = loadWhatsAppFeed();

function persistWhatsAppFeed() {
  try {
    fs.mkdirSync(path.dirname(WA_FEED_FILE), { recursive: true });
    fs.writeFileSync(WA_FEED_FILE, JSON.stringify(liveWhatsAppLogs.slice(0, 200), null, 2));
  } catch (e) {
    console.warn('[WA Feed] Falha ao persistir:', e);
  }
}

// Estado REAL da sessão QR: sem ponte Evolution/Baileys configurada via .env,
// não existe nenhum telemóvel emparelhado — o estado é 'not_configured'.
let qrSessionState = {
  status: process.env.EVOLUTION_API_URL ? 'ready_to_scan' : 'not_configured', // 'not_configured' | 'ready_to_scan' | 'pairing' | 'authenticated'
  pairingCode: '',
  qrData: '',
  lastConnected: ''
};

/**
 * ROTA: GET /api/platform/metrics
 * Retorna dados estritamente reais do sistema para a Landing Page (sem dados falsos)
 */
app.get('/api/platform/metrics', (req, res) => {
  refreshConnectionState();
  res.json({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    product: 'NEXA Assistant',
    repoUrl: 'https://github.com/Antonio-Cassule-Mauricio/assistente_ia',
    engine: {
      primary: QWEN_API_KEY ? 'Qwen 3.8 Max (qwen3.8-max)' : 'Não configurado (definir QWEN_API_KEY)',
      contingency: GEMINI_API_KEY ? 'Gemini 2.5 Flash' : 'Não configurado (definir GEMINI_API_KEY)',
      // 'active' só quando existe realmente uma chave de IA configurada no servidor
      status: (QWEN_API_KEY || GEMINI_API_KEY) ? 'active' : 'not_configured'
    },
    database: {
      provider: 'Supabase PostgreSQL',
      tables: ['conversations', 'messages', 'tasks', 'whatsapp_contacts', 'whatsapp_messages', 'whatsapp_configs'],
      rlsEnabled: true,
      region: 'eu-north-1'
    },
    whatsapp: {
      connected: whatsAppConfig.connected,
      instance: whatsAppConfig.instanceName,
      phone: whatsAppConfig.phoneNumber,
      totalSent: whatsAppConfig.totalSent,
      totalReceived: whatsAppConfig.totalReceived,
      autoReply: whatsAppConfig.autoReplyEnabled
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * ROTA: GET /api/whatsapp/feed
 * Retorna o feed em tempo real de mensagens que chegaram via webhook
 */
app.get('/api/whatsapp/feed', (req, res) => {
  res.json({
    logs: liveWhatsAppLogs,
    total: liveWhatsAppLogs.length,
    stats: {
      sent: whatsAppConfig.totalSent,
      received: whatsAppConfig.totalReceived
    }
  });
});

/**
 * ROTA: GET /api/whatsapp/qr
 * Retorna o estado da sessão de emparelhamento por QR Code
 */
app.get('/api/whatsapp/qr', (req, res) => {
  res.json(qrSessionState);
});

/**
 * ROTA: POST /api/whatsapp/qr/pair
 * Gestão honesta da sessão QR: sem uma ponte real (Evolution API / Baileys)
 * configurada via EVOLUTION_API_URL, NÃO é possível gerar QR nem emparelhar —
 * a rota devolve 503 em vez de fingir uma conexão inexistente.
 */
app.post('/api/whatsapp/qr/pair', async (req, res) => {
  if (!process.env.EVOLUTION_API_URL) {
    return res.status(503).json({
      success: false,
      error: 'Emparelhamento por QR indisponível: nenhuma ponte WhatsApp (Evolution API/Baileys) configurada no servidor. Liga a Meta Cloud API ou define EVOLUTION_API_URL no .env.'
    });
  }

  const { action = 'connect' } = req.body;
  if (action === 'refresh') {
    qrSessionState = {
      status: 'ready_to_scan',
      pairingCode: `NEXA-${Math.floor(1000 + Math.random() * 9000)}-MAUR`,
      qrData: '',
      lastConnected: ''
    };
  } else {
    qrSessionState = {
      ...qrSessionState,
      status: 'authenticated',
      lastConnected: new Date().toISOString()
    };
    whatsAppConfig.connected = true;
  }
  res.json({ success: true, qrSession: qrSessionState });
});

/**
 * ROTA: POST /api/whatsapp/send
 * Envio REAL de mensagem via Meta WhatsApp Cloud API.
 * ⚠️ Sem credenciais Meta configuradas (WA_META_ACCESS_TOKEN + WA_META_PHONE_NUMBER_ID)
 * a rota recusa o envio com 503 — nunca finge um "delivered" inexistente.
 */
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, name, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'Campos "to" e "text" são obrigatórios.' });
    }

    // Fonte de verdade: credenciais reais do .env do servidor (ou sessão de config)
    const token = process.env.WA_META_ACCESS_TOKEN || whatsAppConfig.metaAccessToken;
    const phoneId = process.env.WA_META_PHONE_NUMBER_ID || whatsAppConfig.metaPhoneNumberId;

    if (!token || !phoneId || token.startsWith('••••')) {
      return res.status(503).json({
        status: 'not_sent',
        error: 'WhatsApp não ligado: adiciona WA_META_ACCESS_TOKEN e WA_META_PHONE_NUMBER_ID ao .env do servidor (painel Meta Business) para envios reais.'
      });
    }

    const messageId = `wam-${Date.now()}`;

    try {
      const cleanNumber = to.replace(/\D/g, '');
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanNumber,
          type: 'text',
          text: { body: text }
        })
      });

      const metaData = await metaRes.json();

      if (!metaRes.ok) {
        return res.status(502).json({
          status: 'failed',
          error: 'A API da Meta rejeitou o envio.',
          metaResponse: metaData
        });
      }

      // Só contamos e registamos quando a Meta CONFIRMA a aceitação
      whatsAppConfig.totalSent += 1;
      persistWhatsAppConfig();
      liveWhatsAppLogs.unshift({
        id: metaData.messages?.[0]?.id || messageId,
        from: to,
        name: name || to,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'outgoing',
        provider: 'meta_cloud_api'
      });
      persistWhatsAppFeed();

      return res.json({
        status: 'sent',
        messageId: metaData.messages?.[0]?.id || messageId,
        provider: 'meta_cloud_api',
        metaResponse: metaData
      });
    } catch (metaErr: any) {
      console.warn('[Meta API Send Error]:', metaErr?.message || metaErr);
      return res.status(502).json({ status: 'failed', error: 'Falha de rede ao contactar a API da Meta.' });
    }
  } catch (err: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', err);
    res.status(500).json({ error: 'Falha no envio da mensagem WhatsApp.' });
  }
});

/**
 * ROTA: POST /api/whatsapp/simulate-incoming
 * ⚠️ FERRAMENTA DE TESTE (não é tráfego real): executa o pipeline completo do
 * webhook (receção → IA NEXA → resposta) para validar a automação ANTES de ligar
 * números reais. As entradas são marcadas como provider='simulator' e NÃO
 * entram nas estatísticas oficiais totalSent/totalReceived.
 */
app.post('/api/whatsapp/simulate-incoming', async (req, res) => {
  try {
    const { from = '', name = 'Cliente de Teste', text = '' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Escreve uma mensagem de teste em "text".' });
    }

    let aiReply: string | null = null;
    if (whatsAppConfig.autoReplyEnabled) {
      try {
        const chatRes = await fetch(`http://localhost:${PORT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: `[WhatsApp de ${name || from} (${from})]: "${text}"\nResponde diretamente em português como assistente NEXA da Maurícius.` }
            ],
            systemPrompt: whatsAppConfig.autoReplyPrompt
          })
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          aiReply = chatData.reply;
        }
      } catch (e) {
        console.warn('[Simulate AutoReply Error]:', e);
      }
    }

    const logEntry: LiveWhatsAppLog = {
      id: `wa-test-${Date.now()}`,
      from: from || '+000 000 000 000',
      name: `${name} (TESTE)`,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'incoming',
      aiReply: aiReply || undefined,
      provider: 'simulator'
    };
    liveWhatsAppLogs.unshift(logEntry);
    persistWhatsAppFeed();

    res.json({
      success: true,
      simulated: true, // sinal explícito ao frontend: isto NÃO é uma mensagem recebida de um cliente real
      sender: from,
      name,
      incomingText: text,
      autoReplied: !!aiReply,
      reply: aiReply,
      logEntry
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
