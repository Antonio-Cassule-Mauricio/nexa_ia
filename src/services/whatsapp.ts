/**
 * ============================================================================
 * SERVIÇO DE INTEGRAÇÃO WHATSAPP — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Startup: Maurícius (Soluções Digitais, Automação e IA)
 * Fundador: António Cassule Maurício
 * 
 * Suporta:
 * 1. Conexão direta com WhatsApp Pessoal via Baileys (QR Code e Código de Pareamento de 8 dígitos).
 * 2. Meta WhatsApp Cloud API Oficial (Graph API).
 * 3. Envio e receção real de mensagens sem dados simulados.
 * 4. Atendimento automático com IA NEXA (Qwen 3.8 Max com fallback Gemini).
 * ============================================================================
 */

import { WhatsAppContact, WhatsAppMessage, WhatsAppConfig, WhatsAppQrState } from '../types';
import { supabase } from './supabase';

const DEFAULT_CONFIG: WhatsAppConfig = {
  connected: false,
  phoneNumber: '',
  instanceName: 'Maurícius NEXA Business Primary',
  apiMode: 'personal_baileys',
  webhookVerifyToken: '',
  autoReplyEnabled: false,
  autoReplyPrompt: 'És o NEXA no WhatsApp da Maurícius. Responde com educação, objetividade executiva em português e ajuda o cliente.',
  batteryLevel: 0,
  lastSync: 'Nunca sincronizado',
  totalSent: 0,
  totalReceived: 0
};

/**
 * Obtém a configuração ativa do WhatsApp a partir do servidor backend.
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const res = await fetch('/api/whatsapp/config');
    if (res.ok) {
      const data = await res.json();
      const merged: WhatsAppConfig = { ...DEFAULT_CONFIG, ...data };
      localStorage.setItem('mauricius_wa_config', JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('[WhatsApp Service] Backend indisponível ao obter config:', err);
  }

  const saved = localStorage.getItem('mauricius_wa_config');
  return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

/**
 * Salva a configuração atualizada do WhatsApp
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
  const current = await getWhatsAppConfig();
  const updated: WhatsAppConfig = { ...current, ...config };

  localStorage.setItem('mauricius_wa_config', JSON.stringify(updated));

  try {
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const data = await res.json();
      return data.config || updated;
    }
  } catch (err) {
    console.warn('[WhatsApp Service] Erro ao sincronizar config com backend:', err);
  }

  return updated;
}

/**
 * Consulta o estado em tempo real do pareamento do WhatsApp (QR Code / Pareamento)
 */
export async function getWhatsAppQrSession(): Promise<WhatsAppQrState> {
  try {
    const res = await fetch('/api/whatsapp/qr');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[WhatsApp Service] Erro ao obter sessão QR:', err);
  }
  return { status: 'disconnected', error: 'Servidor indisponível' };
}

/**
 * Solicita código de pareamento de 8 dígitos para o número de telefone informado
 */
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
  try {
    const res = await fetch('/api/whatsapp/pair-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de comunicação com o servidor' };
  }
}

/**
 * Desconecta a sessão ativa do WhatsApp e limpa as credenciais locais
 */
export async function disconnectWhatsAppSession(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/whatsapp/logout', {
      method: 'POST'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[WhatsApp Service] Erro ao desconectar sessão:', err);
  }
  return { success: false };
}

/**
 * Envia uma mensagem real pelo WhatsApp via backend Express.
 * Se o envio falhar ou o WhatsApp estiver desconectado, retorna erro REAL sem simulações.
 */
export async function sendWhatsAppMessageApi(
  contactPhone: string,
  contactName: string,
  text: string
): Promise<{ success: boolean; messageId?: string; status: 'sent' | 'delivered' | 'failed'; timestamp?: string; error?: string }> {
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: contactPhone,
        name: contactName,
        text
      })
    });

    const data = await res.json();

    if (res.ok && (data.status === 'sent' || data.status === 'delivered')) {
      return {
        success: true,
        messageId: data.messageId || `wam-${Date.now()}`,
        status: data.status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      return {
        success: false,
        status: 'failed',
        error: data.error || 'A mensagem não pôde ser enviada pelo WhatsApp.'
      };
    }
  } catch (err: any) {
    console.error('[WhatsApp Service] Erro de rede ao despachar mensagem:', err);
    return {
      success: false,
      status: 'failed',
      error: 'Falha de conexão com o servidor ao despachar mensagem.'
    };
  }
}

/**
 * Solicita ao NEXA uma sugestão inteligente de resposta para uma mensagem do WhatsApp
 */
export async function generateNexaWhatsAppSuggestion(
  contactName: string,
  lastMessage: string
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Elabora uma resposta curta, profissional e direta em português para enviar pelo WhatsApp a ${contactName}.
A mensagem do cliente foi: "${lastMessage}".
Representa a Maurícius (fundada por António Cassule Maurício). Devolve apenas o texto pronto a enviar.`
          }
        ],
        systemPrompt: 'És o NEXA, assistente executivo da Maurícius. Responde apenas com a mensagem a enviar ao cliente no WhatsApp, sem introduções ou explicações.'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return data.reply.replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Service] Falha ao obter sugestão do NEXA:', err);
  }

  return `Olá ${contactName}! Obrigado pela sua mensagem. A sua solicitação foi registada e entraremos em contacto com brevidade.`;
}

/**
 * Sincroniza um contacto com a base de dados do Supabase
 */
export async function syncContactToSupabase(contact: WhatsAppContact, userId?: string) {
  if (!userId) return;
  try {
    await supabase.from('whatsapp_contacts').upsert({
      id: contact.id,
      user_id: userId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      unread_count: contact.unreadCount,
      last_message: contact.lastMessage,
      last_message_time: contact.lastMessageTime,
      tags: contact.tags || [],
      notes: contact.notes || ''
    });
  } catch (e) {
    console.warn('[Supabase WhatsApp Contact Sync]', e);
  }
}
