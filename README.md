# 🚀 Maurícius Tech & NEXA AI Platform

Plataforma corporativa futurista e ecossistema de Inteligência Artificial multicanal da startup **Maurícius**, apresentando o seu produto flagship **NEXA** (estilo Zapia e ChatGPT), com suporte integrado a LLMs de ponta (**Qwen 3.8 Max**, **Google Gemini**), autenticação e banco de dados **Supabase**, e simulação avançada de integração **WhatsApp**.

---

## 🏢 1. Contexto da Startup
- **Empresa:** Maurícius (Startup de Soluções Digitais, Automação e IA)
- **Fundador:** António Cassule Maurício
- **Proposta de Valor:** Desenvolvimento de ecossistemas digitais de alta performance, automação inteligente de processos corporativos e agentes de IA conversacionais multicanal (Web + WhatsApp).
- **Produto Flagship:** **NEXA** — Assistente pessoal e executivo de elite, capaz de resumir conversas, transcrever áudio, gerir tarefas e conectar fluxos de trabalho.
- **Repositório Oficial:** `https://github.com/Antonio-Cassule-Mauricio/assistente_ia/`

---

## 💎 2. Arquitetura da Plataforma

O projeto oferece uma arquitetura moderna e versátil:

### A. Aplicação Web Completa (React + TypeScript + Tailwind CSS + Node.js/Express)
1. **Landing Page Corporativa da Maurícius (`/`)**:
   - Visual futurista de alto nível com tema escuro (Dark) e claro (Light) configuráveis.
   - Foco na proposta de valor empresarial: ecossistemas digitais, agentes de IA e engenharia escalável.
   - Apresentação da liderança e visão do fundador **António Cassule Maurício** na seção dedicada de liderança.
   - Navegação direta para o site exclusivo do NEXA e para o Workspace.

2. **Site Exclusivo do NEXA (Estilo Zapia.com)**:
   - Apresentação completa do produto, destacando a criação pela Maurícius.
   - Vitrine de capacidades: Transcrição de áudios, pesquisa web em tempo real, extração de tarefas e rascunhos executivos.
   - Simulador interativo de WhatsApp em formato de telemóvel para demonstração em tempo real.
   - Botão no canto superior direito para entrar com conta Google / Supabase ou aceder ao Workspace.

3. **NEXA Workspace (`/workspace`)**:
   - Interface conversacional intuitiva (estilo Zapia / ChatGPT).
   - Conexão em tempo real ao motor **Qwen 3.8 Max** (`qwen3.8-max`) com redundância inteligente para **Google Gemini** e motor semântico em português.
   - Painel integrado de Gestão de Tarefas (Kanban/Listas).
   - Hub de integração multicanal com WhatsApp (sincronização, resumos e rascunho de respostas).
   - Modal de autenticação integrado com Supabase e suporte a modo convidado.

### B. Versão Alternativa em Python (FastAPI + Jinja2 Templates)
- Ficheiro `app.py` com rotas assíncronas em FastAPI, consumo da OpenAI API compatível com o endpoint Qwen e integração Supabase.
- Templates prontos em `templates/index.html` e `templates/chat.html`.
- Ficheiro `requirements.txt` para deploy direto em servidores Python.

---

## 🗄️ 3. Configuração da Base de Dados (Supabase PostgreSQL)

Aceda ao **SQL Editor** do seu painel Supabase (`https://qcerpfbyrifbfqnphxdl.supabase.co`) e execute o script que se encontra no ficheiro `supabase_schema.sql`:

```sql
-- Criação da tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova Conversa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Criação da tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ativação de Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: o utilizador apenas acede aos seus próprios registos
CREATE POLICY "Utilizadores gerem as suas conversas"
    ON public.conversations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores gerem as suas mensagens"
    ON public.messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## ⚡ 4. Como Executar Localmente

### Opção 1: Aplicação Web React + Node.js (Recomendada)
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm run dev
   ```
3. Aceda no navegador a `http://localhost:3000`.

### Opção 2: Backend Python (FastAPI)
1. Crie um ambiente virtual e instale os requisitos:
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Inicie o servidor FastAPI:
   ```bash
   python app.py
   # ou: uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Aceda a `http://localhost:8000`.

---

## 🔄 5. Passo a Passo para Fazer Commit e Push no GitHub

Para sincronizar todas as novas alterações com o repositório oficial da startup no GitHub:

### Passo 1: Verificar o estado do repositório
No terminal da raiz do projeto, execute:
```bash
git status
```

### Passo 2: Adicionar todos os ficheiros criados e atualizados
```bash
git add .
```

### Passo 3: Criar o commit com uma mensagem descritiva
```bash
git commit -m "feat: reestruturação completa da plataforma Maurícius e assistente NEXA (React, FastAPI, Qwen 3.8 Max, Supabase)"
```

### Passo 4: Confirmar a branch principal e enviar para o GitHub
Se a sua branch principal for `main`:
```bash
git branch -M main
git push -u origin main
```
*(Se estiver a utilizar a branch `master`, substitua `main` por `master`: `git push -u origin master`)*

---

## 🌐 6. Deploy Gratuito 24/7 na Nuvem

- **Render (Opção Recomendada)**:
  1. Conecte o seu repositório GitHub no [Render.com](https://render.com).
  2. Selecione **Web Service**.
  3. Para a versão Node/React:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
  4. Para a versão Python:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Railway / Fly.io**:
  - Deteção automática via `package.json` ou `Dockerfile`.

---

## 👨‍💻 Créditos & Liderança
- **Fundador & Arquiteto**: António Cassule Maurício
- **Startup**: Maurícius
- **Flagship**: NEXA Assistant
