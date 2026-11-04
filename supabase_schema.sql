-- ==============================================================================
-- SCRIPT DE CRIAÇÃO DA BASE DE DADOS (SUPABASE POSTGRESQL) - MAURÍCIUS / NEXA
-- Project ID: qcerpfbyrifbfqnphxdl
-- Região: eu-north-1
-- ==============================================================================

-- 1. Criação da tabela de conversas (conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova Conversa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da tabela de mensagens (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criação de índices para alta performance de consulta
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- 4. Ativação de Row Level Security (RLS) para proteção de dados
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS) para a tabela CONVERSATIONS
-- Leitura: o utilizador apenas pode visualizar as suas próprias conversas
CREATE POLICY "Utilizadores podem ler apenas as suas conversas"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Criação: o utilizador apenas pode inserir conversas associadas ao seu user_id
CREATE POLICY "Utilizadores podem criar as suas conversas"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Atualização: o utilizador apenas pode alterar o título das suas conversas
CREATE POLICY "Utilizadores podem atualizar as suas conversas"
    ON public.conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Eliminação: o utilizador apenas pode apagar as suas conversas
CREATE POLICY "Utilizadores podem apagar as suas conversas"
    ON public.conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Políticas de Segurança (RLS) para a tabela MESSAGES
-- Leitura: o utilizador apenas pode ler mensagens das suas conversas
CREATE POLICY "Utilizadores podem ler as mensagens das suas conversas"
    ON public.messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Inserção: o utilizador apenas pode inserir mensagens para si mesmo
CREATE POLICY "Utilizadores podem inserir mensagens nas suas conversas"
    ON public.messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Eliminação: o utilizador apenas pode apagar mensagens das suas conversas
CREATE POLICY "Utilizadores podem apagar as suas mensagens"
    ON public.messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Trigger para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.conversations;
CREATE TRIGGER trigger_update_conversation_timestamp
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- MÓDULO WHATSAPP EMPRESARIAL (NEXA MULTICANAL)
-- ==============================================================================

-- 8. Tabela de Contactos do WhatsApp (whatsapp_contacts)
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    unread_count INT DEFAULT 0,
    last_message TEXT,
    last_message_time TEXT,
    is_group BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Mensagens do WhatsApp (whatsapp_messages)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'contact')),
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    reaction TEXT,
    status TEXT DEFAULT 'delivered',
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabela de Configuração e Chaves do WhatsApp (whatsapp_configs)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    phone_number TEXT NOT NULL DEFAULT '+244 923 001 234',
    instance_name TEXT DEFAULT 'Maurícius NEXA Primary',
    api_mode TEXT DEFAULT 'cloud_api',
    meta_phone_number_id TEXT,
    meta_business_account_id TEXT,
    meta_access_token TEXT,
    webhook_verify_token TEXT DEFAULT 'mauricius_nexa_webhook_2026',
    auto_reply_enabled BOOLEAN DEFAULT true,
    auto_reply_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_wa_contacts_user_id ON public.whatsapp_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_user_id ON public.whatsapp_messages(user_id);

-- Ativação de RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Contactos WhatsApp
CREATE POLICY "Permitir leitura de contactos ao proprietário"
    ON public.whatsapp_contacts FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Permitir inserção e edição de contactos ao proprietário"
    ON public.whatsapp_contacts FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Políticas de RLS para Mensagens WhatsApp
CREATE POLICY "Permitir leitura de mensagens ao proprietário"
    ON public.whatsapp_messages FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Permitir envio e inserção de mensagens ao proprietário"
    ON public.whatsapp_messages FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Políticas de RLS para Configurações WhatsApp
CREATE POLICY "Permitir gestão de configurações WhatsApp ao proprietário"
    ON public.whatsapp_configs FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ==============================================================================
-- MÓDULO DE GESTÃO DE TAREFAS (TASKS & PRODUCTIVITY)
-- ==============================================================================

-- 11. Tabela de Tarefas e Afazeres Executivos (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('alta', 'media', 'baixa')),
    status TEXT NOT NULL CHECK (status IN ('pendente', 'em_curso', 'concluida')),
    due_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de consulta rápida para tarefas
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Ativação de Row Level Security (RLS) para Tarefas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela TASKS
CREATE POLICY "Permitir leitura de tarefas apenas ao proprietário autenticado"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir criação de tarefas apenas ao proprietário autenticado"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir atualização de tarefas apenas ao proprietário autenticado"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir eliminação de tarefas apenas ao proprietário autenticado"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger de updated_at para Tarefas
DROP TRIGGER IF EXISTS trigger_update_task_timestamp ON public.tasks;
CREATE TRIGGER trigger_update_task_timestamp
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- SCRIPT FINALIZADO COM SUCESSO!
-- Execute no SQL Editor do painel Supabase (https://qcerpfbyrifbfqnphxdl.supabase.co)
-- ==============================================================================

