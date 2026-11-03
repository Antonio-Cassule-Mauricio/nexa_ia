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
import { Conversation, Message } from '../types';

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
