# 🚀 NEXA Assistant & Plataforma Maurícius (100% Real & Produção)

Assistente Pessoal e Corporativo com Inteligência Artificial multicanal da startup **Maurícius**, fundada por **António Cassule Maurício**. 
Esta versão foi completamente limpa de dados fictícios, mocks e simulações, operando com **conectividade real via WhatsApp (Baileys Multi-Device)**, integração com modelos de linguagem (**Qwen 3.8 Max** via DashScope/OpenAI API e **Google Gemini**), autenticação segura com **Supabase** e persistência completa.

---

## 📱 1. Conexão Real ao WhatsApp Pessoal (Agora Mesmo)

O NEXA inclui um conector nativo WebSocket via protocolo Baileys Multi-Device. Pode emparelhar o seu telemóvel pessoal sem precisar de aprovação da Meta nem de servidores pagos de terceiros:

### Método A: Ler QR Code (No Navegador)
1. Inicie a aplicação (`npm run dev` ou aceda ao servidor).
2. No menu lateral do Workspace, clique em **"Hub WhatsApp"** (ícone do WhatsApp).
3. Selecione a aba **"QR Code (Escanear)"**.
4. Abra o WhatsApp no seu telemóvel:
   - **Android**: Toque nos 3 pontos verticais `⋮` no canto superior direito > **Dispositivos Conectados** > **Conectar um dispositivo**.
   - **iPhone (iOS)**: Vá em **Definições / Ajustes** > **Aparelhos Conectados** > **Conectar um aparelho**.
5. Aponte a câmara do telemóvel para o QR Code gerado no ecrã.
6. A sessão conecta-se imediatamente e o status mudará para `Sessão ativa e sincronizada`.
7. O token de sessão é guardado em segurança na pasta local `data/wa-auth/`.

### Método B: Código de Emparelhamento (8 Dígitos - Sem Câmara)
1. No **Hub WhatsApp**, selecione a aba **"Código de Emparelhamento (8 dígitos)"**.
2. Digite o seu número de telemóvel no formato internacional (ex.: `244923456789` ou `5511999999999`).
3. Clique em **"Pedir Código de 8 Dígitos"**.
4. No seu WhatsApp no telemóvel, abra a notificação de dispositivo conectado ou vá a **Aparelhos Conectados > Conectar com número de telefone** e introduza o código de 8 dígitos exibido.

---

## 🛡️ 2. Arquitetura de Segurança Implementada

- **Zero Mocks**: Todas as simulações (`setTimeout` de respostas falsas, métricas forjadas de mensagens, utilizador de teste pré-logado) foram completamente eliminadas.
- **Proteção de Cabeçalhos HTTP (Helmet)**: X-Frame-Options, DNS Prefetch Control, Referrer Policy e mitigação de clickjacking.
- **Rate Limiting**: Proteção contra ataques de negação de serviço e força bruta nos endpoints de chat (`/api/chat`) e de envio de mensagens (`/api/whatsapp/send`).
- **Sanitização & Validação**: Validação estrita de formato de números internacionais de telefone, higienização de payload JSON e CORS restrito a requisições de origem cruzada válidas.
- **Persistência de Sessões Segura**: As credenciais Baileys são gravadas em `data/wa-auth/` (adicionada ao `.gitignore`), impedindo vazamento de tokens no repositório Git.
- **Tratamento Seguro de Erros**: O servidor nunca expõe stack traces detalhados ou variáveis de ambiente a clientes em caso de falha.

---

## ⚙️ 3. Variáveis de Ambiente (`.env`)

Crie o seu ficheiro `.env` na raiz do projeto com base no ficheiro de modelo `.env.example`:

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Inteligência Artificial - Qwen (DashScope / Tongyi / Alibaba Cloud)
# Obtenha em: https://dashscope.console.aliyun.com/
QWEN_API_KEY=sua_chave_qwen_aqui
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.8-max

# Inteligência Artificial - Google Gemini (Fallback ou Motor Secundário)
# Obtenha em: https://aistudio.google.com/
GEMINI_API_KEY=sua_chave_gemini_aqui

# Autenticação e Base de Dados - Supabase (PostgreSQL)
# Obtenha em: https://supabase.com/dashboard/project/_/settings/api
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_publica_aqui
```

---

## 🗄️ 4. Configuração da Base de Dados (Supabase)

1. Aceda ao painel do [Supabase](https://supabase.com/dashboard).
2. Abra o **SQL Editor** do seu projeto e execute o ficheiro `supabase_schema.sql` incluído no repositório.
3. Isso cria:
   - Tabela `conversations` (conversas isoladas por utilizador via UUID).
   - Tabela `messages` (mensagens com papéis `user`, `assistant`, `system`).
   - Políticas de **Row Level Security (RLS)** ativas para garantir que nenhum utilizador aceda a dados de outro.

---

## 🚀 5. Execução em Desenvolvimento e Produção

### Desenvolvimento Local:
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor integrado (Express API + Vite Dev Server na porta 3000)
npm run dev
```
Aceda a `http://localhost:3000`.

### Verificação de Tipos e Build:
```bash
# Compilar frontend
npm run build

# Iniciar servidor de produção
npm start
```

### Com Docker (Recomendado para Produção):
```bash
# 1. Construir imagem
docker build -t nexa-assistant:latest .

# 2. Executar contentor com volume para manter o WhatsApp conectado mesmo após reinicializações
docker run -d \
  --name nexa-assistant \
  -p 3000:3000 \
  -v nexa-wa-data:/app/data/wa-auth \
  --env-file .env \
  nexa-assistant:latest
```

---

## 👨‍💻 Créditos
- **Startup**: Maurícius
- **Fundador & Arquiteto**: António Cassule Maurício
- **Plataforma**: NEXA Assistant AI
