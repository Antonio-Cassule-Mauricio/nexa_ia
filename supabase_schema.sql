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

-- Concluído com sucesso! Cole este script no SQL Editor do painel Supabase.
