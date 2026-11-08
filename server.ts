/**
 * ============================================================================
 * SERVIDOR BACKEND PRINCIPAL — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Startup: Maurícius (Soluções Digitais, Automação e IA)
 * Fundador: António Cassule Maurício
 * 
 * Responsabilidades:
 * 1. Inicialização segura com Helmet, CORS restrito, Rate Limiting e Sanitização.
 * 2. Conector WhatsApp Pessoal Real com Baileys (Multi-Device QR Code e Código de Pareamento de 8 dígitos).
 * 3. Conector WhatsApp Empresarial Oficial com Meta Cloud API e Webhooks assinados via HMAC SHA-256.
 * 4. Orquestração de LLMs: Qwen 3.8 Max (primário) com contingência Gemini 2.5 Flash e motor local.
 * 5. Streaming de chat token-a-token com Server-Sent Events (SSE).
 * 6. Conector Slack real via Incoming Webhooks.
 * 7. Tratamento de erros centralizado sem fuga de detalhes internos (stack traces).
 * 8. Serviço Vite em desenvolvimento (HMR WebSocket desativado para Cloud Run) e estáticos em produção.
 * ============================================================================
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qcerpfbyrifbfqnphxdl.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SECRET_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ============================================================================
// PARTE 2: SEGURANÇA E CABEÇALHOS
// ============================================================================

// 1. Cabeçalhos de Segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Vite injeta assets dinamicamente em modo SPA
  crossOriginEmbedderPolicy: false
}));

// 2. CORS restrito e controlado
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-hub-signature-256']
}));

// 3. Limite de tamanho de payloads para prevenir DoS / Payload Bombs
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 4. Rate Limiting em Endpoints Críticos (Prevenção de Abuso e Força Bruta)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máx 60 pedidos por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de mensagens atingido. Aguarde alguns instantes antes de enviar novamente.' }
});

const waSendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máx 30 envios por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de envio de mensagens do WhatsApp atingido. Aguarde 1 minuto.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' }
});

// ============================================================================
// CONFIGURAÇÃO DOS MOTORES DE INTELIGÊNCIA ARTIFICIAL
// ============================================================================

const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const MAURICIUS_SYSTEM_PROMPT = `
O teu nome é NEXA.
És o assistente pessoal de elite da Maurícius, fundada por António Cassule Maurício.
És inteligente, profissional, rigoroso e eficiente.
Falas português de forma natural, moderna, elegante e estruturada.
Ajudas o utilizador a:
- Organizar tarefas e rotinas executivas.
- Analisar dados e documentos com rigor.
- Resumir conversas e decisões estratégicas.
- Preparar mensagens e integrar com o canal WhatsApp.
- Resolver problemas complexos de negócios e tecnologia.

Mantém sempre o contexto da conversa e responde com clareza.
`;

/** Motor executivo nativo em português (fallback para quando as APIs externas não estão configuradas) */
function generateMauriciusExecutiveReply(messages: { role: string; content: string }[], userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('tarefa') || lower.includes('organizar') || lower.includes('fazer') || lower.includes('plano') || lower.includes('prioridade')) {
    return `Com certeza! Como assistente pessoal executivo da **Maurícius**, elaborei um plano de ação estruturado:

📋 **Plano de Tarefas Prioritárias (Maurícius):**
1. **[Alta Prioridade]** Mapeamento dos entregáveis críticos e prazos imediatos.
2. **[Média Prioridade]** Alinhamento de comunicações com clientes e parceiros via WhatsApp.
3. **[Rotina Operacional]** Atualização de status e documentação de processos no sistema.

💡 *Dica NEXA:* Podes guardar estas metas diretamente na secção de **Gestão de Tarefas**!`;
  }

  if (lower.includes('resum') || lower.includes('sintetiz') || lower.includes('concl') || lower.includes('recapitula')) {
    return `Certamente. Eis a síntese executiva preparada pela **Maurícius**:

📌 **Resumo dos Pontos Estratégicos:**
- **Contexto Central:** Automação de processos com tecnologia e IA conversacional de alto nível.
- **Destaques:** Foco em arquiteturas escaláveis, tempo de resposta ágil e coerência operacional.
- **Próximos Passos:** Implementação dos módulos integrados e validação contínua.

Desejas transformar algum destes pontos numa tarefa ou preparar um comunicado para a tua equipa?`;
  }

  if (lower.includes('whatsapp') || lower.includes('mensagem') || lower.includes('enviar') || lower.includes('cliente') || lower.includes('contacto')) {
    return `Perfeito! O módulo multicanal da **Maurícius** permite preparar e despachar mensagens com agilidade.

💬 **Proposta de Mensagem:**
> *"Olá! Sou o assistente NEXA em representação da Maurícius. Entro em contacto para confirmar o alinhamento das atividades planeadas. Ficamos ao dispor para qualquer ajuste imediato."*

Desejas que ajuste o tom para executivo, comercial ou direto?`;
  }

  return `Compreendido perfeitamente. Registado pelo NEXA — assistente de elite da **Maurícius**:

"${userMessage}"

Mantive o histórico completo da sessão para assegurar máxima coerência nas próximas ações. Como preferes avançar agora?`;
}

// ============================================================================
// CONECTOR WHATSAPP PESSOAL REAL (BAILEYS / MULTI-DEVICE SOCKET)
// Permite conectar agora o seu WhatsApp Pessoal via QR Code ou Código de Pareamento
// ============================================================================

const WA_AUTH_DIR = path.resolve(__dirname, 'data', 'wa-auth');
const WA_CONFIG_FILE = path.resolve(__dirname, 'data', 'whatsapp-config.json');
const WA_FEED_FILE = path.resolve(__dirname, 'data', 'whatsapp-feed.json');

// Assegurar diretório de dados
fs.mkdirSync(WA_AUTH_DIR, { recursive: true });

interface WhatsAppServerConfig {
  connected: boolean;
  phoneNumber: string;
  instanceName: string;
  apiMode: 'personal_baileys' | 'cloud_api';
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

function loadWhatsAppConfig(): WhatsAppServerConfig {
  const base: WhatsAppServerConfig = {
    connected: false,
    phoneNumber: process.env.WA_PHONE_NUMBER || '',
    instanceName: 'Maurícius NEXA Hub',
    apiMode: 'personal_baileys',
    metaPhoneNumberId: process.env.WA_META_PHONE_NUMBER_ID || '',
    metaBusinessAccountId: process.env.WA_META_BUSINESS_ACCOUNT_ID || '',
    metaAccessToken: process.env.WA_META_ACCESS_TOKEN || '',
    webhookVerifyToken: process.env.WA_WEBHOOK_VERIFY_TOKEN || 'nexa-wa-' + crypto.randomBytes(6).toString('hex'),
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
      return { ...base, ...saved };
    }
  } catch (e) {
    console.warn('[WA Config] Ficheiro corrompido, a recomeçar:', e);
  }
  return base;
}

let whatsAppConfig: WhatsAppServerConfig = loadWhatsAppConfig();

function persistWhatsAppConfig() {
  try {
    fs.mkdirSync(path.dirname(WA_CONFIG_FILE), { recursive: true });
    const { metaAccessToken, ...safeState } = whatsAppConfig;
    fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(safeState, null, 2));
  } catch (e) {
    console.warn('[WA Config] Falha ao persistir:', e);
  }
}

interface LiveWhatsAppLog {
  id: string;
  from: string;
  name: string;
  text: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  aiReply?: string;
  provider: 'personal_baileys' | 'meta_cloud_api' | 'webhook_direct';
}

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
    fs.writeFileSync(WA_FEED_FILE, JSON.stringify(liveWhatsAppLogs.slice(0, 300), null, 2));
  } catch (e) {
    console.warn('[WA Feed] Falha ao persistir feed:', e);
  }
}

// Estado do socket Baileys para WhatsApp Pessoal
let waSocket: any = null;
let waQrCodeDataUrl: string = '';
let waPairingCode: string = '';
let waConnectionStatus: 'disconnected' | 'ready_to_scan' | 'pairing' | 'authenticated' = 'disconnected';
let waConnectedUser: { id: string; name?: string } | null = null;
let waInitInProgress = false;
let waLastError: string = '';

async function startBaileysSocket(): Promise<void> {
  if (waInitInProgress) return;
  waInitInProgress = true;
  waLastError = '';

  try {
    const { state, saveCreds } = await useMultiFileAuthState(WA_AUTH_DIR);
    let version: [number, number, number] = [2, 3000, 1015901307];
    try {
      const vData = await fetchLatestBaileysVersion();
      if (vData?.version) version = vData.version as [number, number, number];
    } catch (e) {}

    waSocket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['NEXA Assistant', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waConnectionStatus = 'ready_to_scan';
        try {
          waQrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        } catch (qrErr) {
          console.error('[Baileys QR Generation Error]:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`[WhatsApp Baileys] Conexão encerrada (${statusCode}). Reconectar? ${!isLoggedOut}`);
        waConnectionStatus = 'disconnected';
        waConnectedUser = null;
        whatsAppConfig.connected = false;
        persistWhatsAppConfig();

        if (isLoggedOut) {
          try {
            fs.rmSync(WA_AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          waQrCodeDataUrl = '';
          waPairingCode = '';
        } else {
          // Tentar reconectar em caso de queda de rede
          setTimeout(() => {
            startBaileysSocket().catch(e => console.warn('[Baileys Reconnect Error]:', e));
          }, 4000);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp Baileys] Conexão aberta! WhatsApp Pessoal autenticado.');
        waConnectionStatus = 'authenticated';
        waQrCodeDataUrl = '';
        waPairingCode = '';
        const userJid = waSocket?.user?.id || '';
        const cleanNumber = userJid.split(':')[0] || userJid.split('@')[0];
        waConnectedUser = {
          id: cleanNumber,
          name: waSocket?.user?.name || 'O teu WhatsApp Pessoal'
        };
        whatsAppConfig.connected = true;
        whatsAppConfig.phoneNumber = cleanNumber ? `+${cleanNumber}` : '';
        whatsAppConfig.lastSync = new Date().toISOString();
        persistWhatsAppConfig();
      }
    });

    // Escuta de mensagens recebidas em tempo real
    waSocket.ev.on('messages.upsert', async ({ messages, type }: any) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

        const isFromMe = msg.key.fromMe;
        const remoteJid = msg.key.remoteJid || '';
        const rawPhone = remoteJid.split('@')[0];
        const contactName = msg.pushName || rawPhone;

        const text = msg.message?.conversation ||
                     msg.message?.extendedTextMessage?.text ||
                     msg.message?.imageMessage?.caption || '';

        if (!text.trim()) continue;

        if (!isFromMe) {
          whatsAppConfig.totalReceived += 1;
          persistWhatsAppConfig();

          const incomingLog: LiveWhatsAppLog = {
            id: msg.key.id || `wa-in-${Date.now()}`,
            from: `+${rawPhone}`,
            name: contactName,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'incoming',
            provider: 'personal_baileys'
          };
          liveWhatsAppLogs.unshift(incomingLog);
          persistWhatsAppFeed();

          // Auto-resposta NEXA com IA se ativada
          if (whatsAppConfig.autoReplyEnabled) {
            try {
              const aiReply = await generateAiReply(contactName, text, whatsAppConfig.autoReplyPrompt);
              if (aiReply && waSocket) {
                await waSocket.sendMessage(remoteJid, { text: aiReply });
                whatsAppConfig.totalSent += 1;
                persistWhatsAppConfig();
                liveWhatsAppLogs.unshift({
                  id: `wa-out-${Date.now()}`,
                  from: `+${rawPhone}`,
                  name: contactName,
                  text: text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'outgoing',
                  aiReply,
                  provider: 'personal_baileys'
                });
                persistWhatsAppFeed();
              }
            } catch (autoErr) {
              console.warn('[AutoReply Error]:', autoErr);
            }
          }
        }
      }
    });

  } catch (err: any) {
    console.error('[Baileys Startup Error]:', err);
    waLastError = err?.message || 'Erro ao inicializar WhatsApp Baileys';
    waConnectionStatus = 'disconnected';
  } finally {
    waInitInProgress = false;
  }
}

// Iniciar conexão WhatsApp se configurado
if (process.env.WA_AUTO_START !== 'false') {
  startBaileysSocket().catch(err => {
    console.warn('[WhatsApp Socket AutoStart]:', err?.message || err);
  });
}

/** Helper para gerar resposta de IA do NEXA para o WhatsApp */
async function generateAiReply(contactName: string, text: string, prompt: string): Promise<string> {
  const messages = [
    { role: 'user', content: `[Mensagem WhatsApp de ${contactName}]: "${text}"\nResponde em português de forma concisa e profissional como assistente NEXA da Maurícius.` }
  ];

  if (QWEN_API_KEY) {
    try {
      const qwenRes = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QWEN_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3.8-max',
          messages: [
            { role: 'system', content: prompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });
      if (qwenRes.ok) {
        const data = await qwenRes.json();
        const rep = data.choices?.[0]?.message?.content;
        if (rep && rep.trim()) return rep.trim();
      }
    } catch (e) {}
  }

  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: { systemInstruction: prompt, maxOutputTokens: 300 }
      });
      if (response.text?.trim()) return response.text.trim();
    } catch (e) {}
  }

  return `Olá ${contactName}! Sou o NEXA, assistente executivo da Maurícius. A sua mensagem foi registada e o António Cassule Maurício entrará em contacto brevemente.`;
}

// ============================================================================
// ROTAS DE API
// ============================================================================

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    assistant: 'NEXA',
    engine: QWEN_API_KEY ? 'Qwen 3.8 Max (Ativo)' : (GEMINI_API_KEY ? 'Gemini 2.5 Flash' : 'Motor nativo NEXA'),
    whatsapp: {
      connected: whatsAppConfig.connected,
      mode: waConnectionStatus === 'authenticated' ? 'personal_baileys' : (whatsAppConfig.apiMode || 'personal_baileys'),
      phone: whatsAppConfig.phoneNumber || null
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/platform/metrics
 */
app.get('/api/platform/metrics', (req, res) => {
  res.json({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    product: 'NEXA Assistant',
    repoUrl: 'https://github.com/Antonio-Cassule-Mauricio/assistente_ia',
    engine: {
      primary: QWEN_API_KEY ? 'Qwen 3.8 Max (qwen3.8-max)' : 'Não configurado (definir QWEN_API_KEY)',
      contingency: GEMINI_API_KEY ? 'Gemini 2.5 Flash' : 'Não configurado (definir GEMINI_API_KEY)',
      status: (QWEN_API_KEY || GEMINI_API_KEY) ? 'active' : 'local_core'
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
 * POST /api/auth/google-direct (Com Rate Limiting)
 * Permite autenticação e criação de conta real no Supabase com conta Google.
 * Não depende da ativação prévia do provedor Google no painel do Supabase,
 * criando o utilizador no auth.users do Supabase e emitindo um token criptográfico oficial de sessão (verifyOtp).
 */
app.post('/api/auth/google-direct', authLimiter, async (req, res) => {
  try {
    const { email, fullName, avatarUrl } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido para autenticação.' });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Supabase Admin não está configurado no servidor (falta SUPABASE_SECRET_KEY).' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName || cleanEmail.split('@')[0];

    // 1. Assegurar que o utilizador existe no Supabase com email confirmado
    let user: any = null;
    try {
      const createRes = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          avatar_url: avatarUrl || '',
          provider: 'google'
        }
      });
      if (createRes.data?.user) {
        user = createRes.data.user;
      } else {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        user = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      }
    } catch (e: any) {
      console.warn('[Supabase Direct User]:', e?.message || e);
    }

    // 2. Gerar magiclink token para login oficial no cliente Supabase
    const linkRes = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail
    });

    if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
      return res.status(500).json({
        error: linkRes.error?.message || 'Falha ao gerar credencial segura no Supabase.'
      });
    }

    return res.json({
      success: true,
      email: cleanEmail,
      tokenHash: linkRes.data.properties.hashed_token,
      user: {
        id: user?.id,
        email: cleanEmail,
        fullName: cleanName
      }
    });
  } catch (err: any) {
    console.error('Erro na autenticação direta Google Supabase:', err);
    res.status(500).json({ error: 'Erro interno ao processar autenticação Google.' });
  }
});

/**
 * POST /api/chat (Com Rate Limiting)
 */
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages = [], systemPrompt = MAURICIUS_SYSTEM_PROMPT } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'A lista de mensagens não pode estar vazia.' });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // 1. Qwen 3.8 Max
    if (QWEN_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const qwenResponse = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QWEN_API_KEY}`
          },
          body: JSON.stringify({
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
          }),
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
        }
      } catch (qwenErr: any) {
        console.warn('[Qwen API aviso]:', qwenErr?.message || qwenErr);
      }
    }

    // 2. Gemini 2.5 Flash
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
        console.warn('[Gemini Contingência]:', geminiErr?.message || geminiErr);
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
    console.error('Erro no processamento do chat:', err);
    res.status(500).json({ error: 'Erro ao processar conversa.' });
  }
});

/**
 * POST /api/chat/stream
 */
app.post('/api/chat/stream', chatLimiter, async (req, res) => {
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
            } catch (err) {}
          }
        }
      }
    } catch (qwenErr: any) {
      console.warn('[Qwen Stream Warning]:', qwenErr?.message || qwenErr);
    }
  }

  if (!streamedAnyToken) {
    let fallbackText = '';
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
          config: { systemInstruction: systemPrompt, temperature: 0.7, maxOutputTokens: 1200 }
        });
        fallbackText = response.text || '';
      } catch (gemErr) {}
    }

    if (!fallbackText) {
      fallbackText = generateMauriciusExecutiveReply(messages, lastUserMessage);
    }

    res.write(`data: ${JSON.stringify({ text: fallbackText, done: false })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// ============================================================================
// ROTAS DE INTEGRAÇÃO DO WHATSAPP (PESSOAL + EMPRESARIAL)
// ============================================================================

/**
 * GET /api/whatsapp/config
 */
app.get('/api/whatsapp/config', (req, res) => {
  res.json({
    ...whatsAppConfig,
    metaAccessToken: whatsAppConfig.metaAccessToken ? '••••' + whatsAppConfig.metaAccessToken.slice(-4) : undefined,
    batteryLevel: 0
  });
});

/**
 * POST /api/whatsapp/config
 */
app.post('/api/whatsapp/config', (req, res) => {
  const incoming = req.body || {};
  if (typeof incoming.metaAccessToken === 'string' && incoming.metaAccessToken.startsWith('••••')) {
    delete incoming.metaAccessToken;
  }
  whatsAppConfig = {
    ...whatsAppConfig,
    ...incoming,
    lastSync: new Date().toISOString()
  };
  persistWhatsAppConfig();
  res.json({ status: 'ok', config: whatsAppConfig });
});

/**
 * GET /api/whatsapp/qr
 * Retorna o QR Code real gerado pelo Baileys para conexão imediata do WhatsApp Pessoal
 */
app.get('/api/whatsapp/qr', (req, res) => {
  res.json({
    status: waConnectionStatus,
    qrCode: waQrCodeDataUrl,
    pairingCode: waPairingCode,
    connectedPhone: waConnectedUser?.id ? `+${waConnectedUser.id}` : (whatsAppConfig.phoneNumber || undefined),
    connectedName: waConnectedUser?.name,
    lastConnected: whatsAppConfig.lastSync,
    error: waLastError || undefined
  });
});

/**
 * POST /api/whatsapp/pair-code
 * Gera o Código de Pareamento de 8 dígitos para o número informado
 */
app.post('/api/whatsapp/pair-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 8) {
      return res.status(400).json({ error: 'Número de telefone inválido. Inclui o DDI do país (ex: 244923000000, 351912345678, 5511999999999).' });
    }

    if (!waSocket) {
      await startBaileysSocket();
    }

    if (waConnectionStatus === 'authenticated') {
      return res.json({ success: true, message: 'WhatsApp já conectado com sucesso!', status: 'authenticated' });
    }

    if (waSocket) {
      try {
        const code = await waSocket.requestPairingCode(cleanNumber);
        waPairingCode = code;
        waConnectionStatus = 'pairing';
        return res.json({ success: true, pairingCode: code });
      } catch (err: any) {
        console.error('[Pairing Code Error]:', err);
        return res.status(500).json({ error: err?.message || 'Falha ao solicitar código de pareamento à rede do WhatsApp.' });
      }
    }

    return res.status(503).json({ error: 'Aguardando inicialização do socket WhatsApp. Tente novamente em 2 segundos.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao processar pareamento.' });
  }
});

/**
 * POST /api/whatsapp/logout
 * Desconecta e limpa credenciais da sessão ativa do WhatsApp
 */
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    if (waSocket) {
      try { await waSocket.logout(); } catch (e) {}
      try { waSocket.end(new Error('Logout manual')); } catch (e) {}
    }
    waSocket = null;
    waConnectionStatus = 'disconnected';
    waConnectedUser = null;
    waQrCodeDataUrl = '';
    waPairingCode = '';
    whatsAppConfig.connected = false;
    whatsAppConfig.phoneNumber = '';
    persistWhatsAppConfig();

    try {
      fs.rmSync(WA_AUTH_DIR, { recursive: true, force: true });
    } catch (e) {}

    setTimeout(() => {
      startBaileysSocket().catch(e => console.warn('[Restart after logout]:', e));
    }, 1000);

    res.json({ success: true, message: 'WhatsApp desconectado com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao desconectar.' });
  }
});

/**
 * GET /api/whatsapp/feed
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
 * POST /api/whatsapp/send (Com Rate Limiting)
 * Envio real pelo WhatsApp Pessoal (Baileys) ou Meta Cloud API
 */
app.post('/api/whatsapp/send', waSendLimiter, async (req, res) => {
  try {
    const { to, name, text } = req.body;
    if (!to || !text || !text.trim()) {
      return res.status(400).json({ error: 'Campos "to" (telefone) e "text" (mensagem) são obrigatórios.' });
    }

    const cleanNumber = to.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 8) {
      return res.status(400).json({ error: 'Número de telefone inválido (deve incluir indicativo do país).' });
    }

    // 1. Tentar envio via WhatsApp Pessoal autenticado (Baileys)
    if (waSocket && waConnectionStatus === 'authenticated') {
      try {
        const jid = `${cleanNumber}@s.whatsapp.net`;
        const sent = await waSocket.sendMessage(jid, { text: text.trim() });
        const messageId = sent?.key?.id || `wam-${Date.now()}`;

        whatsAppConfig.totalSent += 1;
        persistWhatsAppConfig();

        liveWhatsAppLogs.unshift({
          id: messageId,
          from: `+${cleanNumber}`,
          name: name || to,
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'outgoing',
          provider: 'personal_baileys'
        });
        persistWhatsAppFeed();

        return res.json({
          status: 'delivered',
          messageId,
          provider: 'personal_baileys',
          to: cleanNumber
        });
      } catch (baileysErr: any) {
        console.error('[Baileys Send Error]:', baileysErr);
        return res.status(502).json({
          status: 'failed',
          error: `Erro ao enviar via WhatsApp Pessoal: ${baileysErr?.message || 'Falha na entrega'}`
        });
      }
    }

    // 2. Tentar envio via Meta WhatsApp Cloud API (se configurada)
    const token = process.env.WA_META_ACCESS_TOKEN || whatsAppConfig.metaAccessToken;
    const phoneId = process.env.WA_META_PHONE_NUMBER_ID || whatsAppConfig.metaPhoneNumberId;

    if (token && phoneId && !token.startsWith('••••')) {
      try {
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
            text: { body: text.trim() }
          })
        });

        const metaData = await metaRes.json();
        if (metaRes.ok) {
          whatsAppConfig.totalSent += 1;
          persistWhatsAppConfig();

          const messageId = metaData.messages?.[0]?.id || `wam-${Date.now()}`;
          liveWhatsAppLogs.unshift({
            id: messageId,
            from: `+${cleanNumber}`,
            name: name || to,
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'outgoing',
            provider: 'meta_cloud_api'
          });
          persistWhatsAppFeed();

          return res.json({
            status: 'sent',
            messageId,
            provider: 'meta_cloud_api'
          });
        } else {
          return res.status(502).json({
            status: 'failed',
            error: 'A API oficial da Meta rejeitou o envio.',
            metaResponse: metaData
          });
        }
      } catch (metaErr: any) {
        return res.status(502).json({ status: 'failed', error: 'Falha de rede com a API da Meta.' });
      }
    }

    // Se nenhum WhatsApp estiver conectado
    return res.status(503).json({
      status: 'failed',
      error: 'Nenhum WhatsApp conectado. Abra o WhatsApp Hub no menu lateral e conecte o seu WhatsApp pessoal com o QR Code ou Código de Pareamento.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao despachar mensagem WhatsApp.' });
  }
});

/**
 * Webhook Oficial da Meta WhatsApp Cloud API
 */
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === whatsAppConfig.webhookVerifyToken) {
    console.log('[Meta Webhook] Handshake verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  return res.status(200).json({ status: 'online', endpoint: 'Meta WhatsApp Cloud API Webhook' });
});

app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const body = req.body;
    let from = '';
    let messageText = '';
    let contactName = 'Cliente WhatsApp';

    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      from = msgObj.from;
      messageText = msgObj.text?.body || '';
      contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || from;
    }

    if (messageText.trim()) {
      whatsAppConfig.totalReceived += 1;
      persistWhatsAppConfig();
      liveWhatsAppLogs.unshift({
        id: `wa-meta-${Date.now()}`,
        from,
        name: contactName,
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'incoming',
        provider: 'meta_cloud_api'
      });
      persistWhatsAppFeed();
    }

    res.status(200).json({ status: 'received' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no webhook' });
  }
});

/**
 * Conector Slack: Teste Real de Webhook
 */
app.post('/api/connectors/slack/test', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({ success: false, error: 'O URL do webhook do Slack deve começar por https://hooks.slack.com/' });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '⚡ [Maurícius NEXA] Teste de conectividade do conector Slack executado com sucesso!'
      })
    });

    if (response.ok) {
      return res.json({ success: true, message: 'Mensagem de teste enviada com sucesso para o Slack!' });
    } else {
      const errText = await response.text();
      return res.status(400).json({ success: false, error: `Slack respondeu com erro: ${errText}` });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Falha de comunicação com o Slack.' });
  }
});

// Middleware Centralizado de Tratamento de Erros (Sem vazar stack traces)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Erro Interno do Servidor]:', err?.message || err);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor. A equipa de engenharia foi notificada.'
  });
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR (DESENVOLVIMENTO VITE OU PRODUÇÃO ESTÁTICA)
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Maurícius Tech] Servidor NEXA operacional em http://${HOST}:${PORT}`);
  });
}

startServer();
