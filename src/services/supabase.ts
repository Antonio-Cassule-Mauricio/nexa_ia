/**
 * ============================================================================
 * SERVIÇO SUPABASE — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Configurações da plataforma:
 * - Projeto: qcerpfbyrifbfqnphxdl
 * - URL: https://qcerpfbyrifbfqnphxdl.supabase.co
 * - Chave Anónima / Pública: sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4
 * 
 * Funcionalidades implementadas:
 * 1. Autenticação (Email/Senha, Google com fallback seguro e modo convidado)
 * 2. Gestão de sessões ativas
 * 3. Sincronização persistente de conversas e mensagens com as tabelas Supabase
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Conversation, 
  Message, 
  Task, 
  WhatsAppContact, 
  WhatsAppMessage, 
  WhatsAppConfig 
} from '../types';

export const SUPABASE_URL = 'https://qcerpfbyrifbfqnphxdl.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Tenta login com Google no Supabase de forma segura.
 * Se o fornecedor Google ainda não estiver habilitado no painel Supabase
 * (erro "Unsupported provider: provider is not enabled"), não redireciona o utilizador
 * para uma página de erro 400 — em vez disso, retorna um erro amigável para acionar a sessão de demonstração.
 */
export async function safeGoogleSignIn(): Promise<{ success: boolean; isMock?: boolean; user?: any; error?: string }> {
  try {
    // skipBrowserRedirect: true impede que o navegador seja redirecionado para a página de erro do Supabase caso não configurado
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.warn('[Supabase Auth Warning]:', error.message);
      // Se o provedor não estiver ativo no painel Supabase
      return {
        success: false,
        error: error.message
      };
    }

    if (data?.url) {
      // Se houver URL válida retornada pelo Supabase, redirecionar
      window.location.href = data.url;
      return { success: true };
    }

    return { success: false, error: 'Não foi possível obter URL de autenticação.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao autenticar com o Google.' };
  }
}

/**
 * Salva uma nova conversa no Supabase (se o utilizador estiver autenticado)
 */
export async function saveConversationToSupabase(conv: Conversation, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('conversations')
      .upsert({
        id: conv.id,
        user_id: userId,
        title: conv.title,
        created_at: conv.createdAt
      });
    
    if (error) {
      console.warn('[Supabase Conversations Upsert]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Conversations Exception]:', err);
    return false;
  }
}

/**
 * Salva uma mensagem de chat no Supabase (se o utilizador estiver autenticado)
 */
export async function saveMessageToSupabase(
  msg: Message,
  conversationId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('messages')
      .upsert({
        id: msg.id,
        conversation_id: conversationId,
        user_id: userId,
        role: msg.role,
        content: msg.content,
        created_at: msg.timestamp
      });

    if (error) {
      console.warn('[Supabase Message Upsert]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Message Exception]:', err);
    return false;
  }
}

/**
 * Carrega conversas do utilizador a partir do Supabase
 */
export async function loadUserConversationsFromSupabase(userId: string): Promise<Conversation[] | null> {
  if (!userId) return null;
  try {
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !convs) {
      console.warn('[Supabase Load Conversations]:', error?.message);
      return null;
    }

    // Carregar mensagens de cada conversa
    const loadedConversations: Conversation[] = [];
    for (const c of convs) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: true });

      loadedConversations.push({
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
        updatedAt: c.created_at,
        messages: (msgs && msgs.length > 0) ? msgs.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          timestamp: m.created_at
        })) : [
          {
            id: `msg-init-${c.id}`,
            role: 'assistant',
            content: 'Olá! Como posso ajudar?',
            timestamp: c.created_at
          }
        ]
      });
    }

    return loadedConversations;
  } catch (err) {
    console.warn('[Supabase Load Exception]:', err);
    return null;
  }
}

// ============================================================================
// MÓDULO DE TAREFAS — PERSISTÊNCIA REAL NO SUPABASE
// ============================================================================

/**
 * Carrega tarefas reais do utilizador autenticado a partir do Supabase
 */
export async function loadUserTasksFromSupabase(userId: string): Promise<Task[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Load Tasks]:', error?.message);
      return null;
    }

    return data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      priority: t.priority as 'alta' | 'media' | 'baixa',
      status: t.status as 'pendente' | 'em_curso' | 'concluida',
      dueDate: t.due_date || undefined,
      createdAt: t.created_at
    }));
  } catch (err) {
    console.warn('[Supabase Load Tasks Exception]:', err);
    return null;
  }
}

/**
 * Salva ou atualiza uma tarefa no Supabase
 */
export async function saveTaskToSupabase(task: Task, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('tasks')
      .upsert({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description || null,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate || null,
        created_at: task.createdAt
      });

    if (error) {
      console.warn('[Supabase Task Upsert]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Task Exception]:', err);
    return false;
  }
}

/**
 * Elimina uma tarefa do Supabase
 */
export async function deleteTaskFromSupabase(taskId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase Task Delete]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Task Delete Exception]:', err);
    return false;
  }
}

// ============================================================================
// MÓDULO WHATSAPP — PERSISTÊNCIA REAL NO SUPABASE
// ============================================================================

/**
 * Carrega contactos reais do utilizador a partir da tabela whatsapp_contacts
 */
export async function loadUserWhatsAppContactsFromSupabase(userId: string): Promise<WhatsAppContact[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Load WA Contacts]:', error?.message);
      return null;
    }

    return data.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || undefined,
      unreadCount: c.unread_count || 0,
      lastMessage: c.last_message || 'Início da conversa',
      lastMessageTime: c.last_message_time || 'Agora',
      isGroup: c.is_group || false,
      tags: c.tags || [],
      notes: c.notes || undefined
    }));
  } catch (err) {
    console.warn('[Supabase WA Contacts Exception]:', err);
    return null;
  }
}

/**
 * Salva ou atualiza um contacto no Supabase
 */
export async function saveWhatsAppContactToSupabase(contact: WhatsAppContact, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .upsert({
        id: contact.id,
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || null,
        unread_count: contact.unreadCount,
        last_message: contact.lastMessage,
        last_message_time: contact.lastMessageTime,
        is_group: contact.isGroup || false,
        tags: contact.tags || [],
        notes: contact.notes || null
      });

    if (error) {
      console.warn('[Supabase WA Contact Upsert]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase WA Contact Exception]:', err);
    return false;
  }
}

/**
 * Elimina um contacto no Supabase
 */
export async function deleteWhatsAppContactFromSupabase(contactId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase WA Contact Delete]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase WA Contact Delete Exception]:', err);
    return false;
  }
}

/**
 * Carrega mensagens de um contacto a partir da tabela whatsapp_messages
 */
export async function loadWhatsAppMessagesForContactFromSupabase(contactId: string, userId: string): Promise<WhatsAppMessage[] | null> {
  if (!userId || !contactId) return null;
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Load WA Messages]:', error?.message);
      return null;
    }

    return data.map(m => ({
      id: m.id,
      contactId: m.contact_id,
      sender: m.sender as 'user' | 'contact',
      text: m.text,
      timestamp: m.timestamp,
      reaction: m.reaction || undefined,
      status: m.status as any,
      isAiGenerated: m.is_ai_generated || false
    }));
  } catch (err) {
    console.warn('[Supabase Load WA Messages Exception]:', err);
    return null;
  }
}

/**
 * Salva uma mensagem do WhatsApp no Supabase
 */
export async function saveWhatsAppMessageToSupabase(
  message: WhatsAppMessage,
  contactId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .upsert({
        id: message.id,
        contact_id: contactId,
        user_id: userId,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
        reaction: message.reaction || null,
        status: message.status || 'delivered',
        is_ai_generated: message.isAiGenerated || false
      });

    if (error) {
      console.warn('[Supabase WA Message Upsert]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase WA Message Exception]:', err);
    return false;
  }
}
