/**
 * ============================================================================
 * CLIENTE SUPABASE — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Conexão com o projeto Supabase na região eu-north-1:
 * - URL: https://qcerpfbyrifbfqnphxdl.supabase.co
 * - Chave Anónima / Pública: sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4
 * 
 * Utilizado para:
 * 1. Autenticação de utilizadores (Google OAuth e E-mail/Senha).
 * 2. Gestão de sessões persistentes no navegador.
 * 3. Acesso e sincronização segura das tabelas conversations e messages com RLS.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase criado na região eu-north-1
export const SUPABASE_URL = 'https://qcerpfbyrifbfqnphxdl.supabase.co';

// Chave pública segura para chamadas do frontend
export const SUPABASE_ANON_KEY = 'sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4';

// Instância singleton do cliente Supabase para ser partilhada por toda a aplicação
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
