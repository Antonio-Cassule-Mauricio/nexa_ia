# Guia Definitivo de Deploy na Vercel — NEXA Assistant & Maurícius Tech

Este guia foi elaborado para garantir que o teu projeto seja publicado na **Vercel** sem qualquer erro de compilação, roteamento ou conexão com a base de dados.

---

## 1. Visão Geral da Arquitetura de Deploy

O projeto é uma aplicação moderna full-stack:
* **Frontend SPA:** Desenvolvido em **React 19 + TypeScript + Vite + Tailwind CSS**, compilado para a pasta `/dist`.
* **Base de Dados Persistente & RLS:** **Supabase PostgreSQL** na região `eu-north-1`.
* **Motor de IA & Streaming:** **Qwen 3.8 Max** (MaaS Cloud API) com fallback para Gemini.
* **Canal WhatsApp & Webhooks:** Endpoints de despacho e receção prontos para produção.

---

## 2. Passo a Passo no Painel da Vercel (Sem Erros)

### Passo 1: Enviar o Código para o GitHub
Se ainda não fizeste push para o teu repositório oficial (`https://github.com/Antonio-Cassule-Mauricio/assistente_ia`), executa no terminal:
```bash
git add .
git commit -m "feat: secção scroll animada, conectores reais e otimizações vercel"
git push origin main
```

### Passo 2: Importar o Projeto na Vercel
1. Acede a [vercel.com](https://vercel.com) e faz login com o teu GitHub.
2. Clica em **"Add New..."** → **"Project"**.
3. Seleciona o repositório **`assistente_ia`** e clica em **"Import"**.

### Passo 3: Configuração do Projeto (Project Settings)
A Vercel deteta automaticamente o Vite, mas certifica-te de que os campos estão assim preenchidos:
* **Framework Preset:** `Vite`
* **Root Directory:** `./`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`

### Passo 4: Variáveis de Ambiente (Environment Variables)
No ecrã de importação da Vercel, expande a secção **"Environment Variables"** e adiciona as seguintes chaves:

| Nome da Variável | Valor Recomendado | Descrição |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://qcerpfbyrifbfqnphxdl.supabase.co` | URL da tua instância Supabase |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4` | Chave pública anónima com RLS |
| `QWEN_API_KEY` | `<COLA_AQUI_A_TUA_CHAVE_NOVA>` | Chave do motor Qwen 3.8 Max |
| `QWEN_BASE_URL` | `https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1` | Endpoint compatível OpenAI MaaS |
| `GEMINI_API_KEY` | `<COLA_AQUI_A_TUA_CHAVE_NOVA>` | Chave de contingência Google AI |
| `WHATSAPP_VERIFY_TOKEN`| `<TOKEN_ALEATÓRIO_QUE_DEVES_CRIAR>` | Token de segurança do Webhook |

### Passo 5: Clicar em "Deploy"
Clica no botão **"Deploy"**. A compilação demora cerca de 45 segundos e o teu site ficará imediatamente disponível com SSL/HTTPS gratuito e CDN global.

---

## 3. Por que o `vercel.json` incluído previne erros 404 em SPA?

Em aplicações React/Vite, quando um utilizador recarrega a página em rotas como `/workspace` ou `/nexa`, servidores padrão retornam erro `404 Not Found`.

O ficheiro `vercel.json` adicionado à raiz do projeto contém:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Isto instrui a rede da Vercel a encaminhar todos os pedidos para o `index.html`, permitindo ao React Router e ao estado de navegação carregar instantaneamente.

---

## 4. Como configurar o Domínio Personalizado na Vercel

1. No painel do teu projeto na Vercel, vai a **Settings** → **Domains**.
2. Adiciona o teu domínio (ex: `nexa.mauricius.com` ou `mauricius.ao`).
3. Adiciona os registos DNS fornecidos pela Vercel no teu fornecedor de domínio:
   * **CNAME:** `cname.vercel-dns.com`
   * **A Record:** `76.76.21.21`

---

## 5. Resolução Rápida de Possíveis Avisos

1. **"Build failed: Command npm run build exited with 1"**:
   * O código já foi rigorosamente validado localmente com `tsc --noEmit` e `vite build`. O build passa com 0 erros.
2. **"Websocket connection closed"**:
   * Este aviso surge apenas em ambiente de desenvolvimento local quando o HMR do Vite reinicia. Não afeta nem existe no build de produção da Vercel.
3. **CORS no Supabase**:
   * No painel do Supabase (`qcerpfbyrifbfqnphxdl`), em **Authentication** → **URL Configuration**, adiciona o URL final da Vercel (`https://seu-projeto.vercel.app`) em **Site URL** e **Redirect URLs**.
