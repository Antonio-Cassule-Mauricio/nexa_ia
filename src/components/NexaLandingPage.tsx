import React, { useState } from 'react';
import { 
  Bot, 
  Smartphone, 
  Sparkles, 
  Mic, 
  Search, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  MessageSquare, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Zap, 
  Building2,
  Calendar,
  Languages,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NexaLandingPageProps {
  onGoToWorkspace: () => void;
  onGoToMauricius: () => void;
  onOpenAuth: () => void;
  currentUser: any;
}

export const NexaLandingPage: React.FC<NexaLandingPageProps> = ({
  onGoToWorkspace,
  onGoToMauricius,
  onOpenAuth,
  currentUser
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'audio' | 'search' | 'tasks' | 'draft'>('audio');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoToMauricius}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              title="Voltar ao site corporativo da Maurícius"
            >
              <span>← Maurícius</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">NEXA</span>
                <span className="hidden sm:inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  estilo Zapia
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            <a href="#funcionalidades" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">O Que Faz</a>
            <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Como Funciona</a>
            <a href="#quem-criou" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Quem Criou</a>
            <a href="#whatsapp" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">WhatsApp</a>
          </nav>

          {/* Right Action Zone */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Google / Account Button if not connected */}
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-xs"
              >
                {/* Google G SVG */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="hidden sm:inline">Entrar com Google</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{currentUser.email.split('@')[0]}</span>
              </button>
            )}

            {/* Primary CTA */}
            <button
              onClick={onGoToWorkspace}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/25 cursor-pointer whitespace-nowrap"
            >
              <span>Abrir App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Like Zapia.com) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline and Call-to-actions */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6">
                <Smartphone className="w-3.5 h-3.5" />
                <span>O teu assistente pessoal inteligente no WhatsApp e na Web</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                Tudo o que precisas de resolver, a uma mensagem de distância.
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Criado pela <strong>Maurícius</strong>, fundada por <strong>António Cassule Maurício</strong>. O <strong>NEXA</strong> resume áudios longos, pesquisa na internet em tempo real, organiza as tuas tarefas e redige respostas profissionais no WhatsApp e no navegador.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-8">
                <button
                  onClick={onGoToWorkspace}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Experimentar no Navegador</span>
                </button>

                <a
                  href="#whatsapp"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 transition-colors shadow-xs"
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Conversar no WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Grátis para começar
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Sem instalação obrigatória
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Português nativo
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Smartphone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-[40px] p-3 bg-slate-900 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800">
                {/* Dynamic island / speaker */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20"></div>

                {/* Smartphone Screen */}
                <div className="rounded-[32px] overflow-hidden bg-slate-950 text-white flex flex-col h-[540px] border border-slate-800">
                  {/* WhatsApp Header */}
                  <div className="bg-slate-900 px-4 pt-8 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm">
                        <Bot className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">NEXA Assistant</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        </div>
                        <span className="text-[10px] text-slate-400">Maurícius Tech • Online</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      WhatsApp
                    </span>
                  </div>

                  {/* WhatsApp Chat Messages Stream */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                    {/* User Prompt */}
                    <div className="bg-emerald-700 text-white rounded-xl rounded-tr-none p-3 max-w-[85%] ml-auto shadow-xs">
                      {activeInteractiveTab === 'audio' && (
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-emerald-200" />
                          <span>🎙️ Mensagem de áudio (0:42) — Reunião da equipa</span>
                        </div>
                      )}
                      {activeInteractiveTab === 'search' && "Qual é a cotação do Dólar hoje e previsão para Luanda?"}
                      {activeInteractiveTab === 'tasks' && "Organiza o meu dia e extrai 3 tarefas críticas."}
                      {activeInteractiveTab === 'draft' && "Redige uma resposta cordial para o cliente sobre a proposta."}
                      <span className="block text-[9px] text-emerald-200 text-right mt-1">10:42 ✓✓</span>
                    </div>

                    {/* NEXA Reply */}
                    <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl rounded-tl-none p-3 max-w-[90%] space-y-2 shadow-xs">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        <span>NEXA • Resumo Inteligente</span>
                      </div>

                      {activeInteractiveTab === 'audio' && (
                        <>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            <strong>Transcrição rápida:</strong> O João confirmou que o relatório de impacto está fechado e que a apresentação à direção será às 16h.
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-emerald-400">
                            ✓ 1 Tarefa adicionada à tua agenda
                          </div>
                        </>
                      )}

                      {activeInteractiveTab === 'search' && (
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          Pesquisei em tempo real: O mercado cambial mantém-se estável com tendência de valorização. Recomendo validar o fecho diário oficial do BNA.
                        </p>
                      )}

                      {activeInteractiveTab === 'tasks' && (
                        <ul className="text-[11px] space-y-1 text-slate-300 list-disc pl-3">
                          <li><strong>[Alta]</strong> Aprovar rascunho executivo da Maurícius.</li>
                          <li><strong>[Média]</strong> Alinhar entregas com a equipa técnica.</li>
                          <li><strong>[Rotina]</strong> Rever mensagens no WhatsApp.</li>
                        </ul>
                      )}

                      {activeInteractiveTab === 'draft' && (
                        <blockquote className="border-l-2 border-emerald-500 pl-2 text-[10px] italic text-slate-300">
                          "Olá! Agradecemos o contacto. A proposta comercial foi ajustada com os termos acordados e está disponível para validação final."
                        </blockquote>
                      )}

                      <span className="block text-[9px] text-slate-500 text-right">Agora</span>
                    </div>
                  </div>

                  {/* Interactive Tab Selectors in Phone */}
                  <div className="p-2 bg-slate-900 border-t border-slate-800 shrink-0">
                    <p className="text-[10px] text-slate-400 text-center mb-1.5 font-medium">Testa uma funcionalidade do NEXA:</p>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => setActiveInteractiveTab('audio')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'audio' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Áudios
                      </button>
                      <button
                        onClick={() => setActiveInteractiveTab('search')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'search' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Pesquisa
                      </button>
                      <button
                        onClick={() => setActiveInteractiveTab('tasks')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'tasks' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Tarefas
                      </button>
                      <button
                        onClick={() => setActiveInteractiveTab('draft')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'draft' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Respostas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section: O que o NEXA pode fazer por ti (Como o Zapia) */}
      <section id="funcionalidades" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Funcionalidades do Assistente
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              O teu dia a dia muito mais simples e produtivo
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
              Não precisas de instalar apps complicadas nem aprender comandos técnicos. Basta enviares uma mensagem como falas com um amigo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Audio Transcriber */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Resumo e Transcrição de Áudios
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Recebeste um áudio de 5 minutos no WhatsApp? Encaminha para o NEXA e recebe o texto e um resumo executivo com os pontos principais em poucos segundos.
              </p>
            </div>

            {/* Card 2: Real-time search */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Pesquisa na Web em Tempo Real
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pergunta sobre notícias atualizadas, cotações cambiais, voos, os melhores restaurantes em Luanda ou Lisboa e recebe respostas precisas com fontes confiáveis.
              </p>
            </div>

            {/* Card 3: Tasks and Productivity */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Gestão de Tarefas e Agenda
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                O NEXA extrai automaticamente compromissos das tuas mensagens e organiza tudo num painel prático por ordem de prioridade para nunca falhares prazos.
              </p>
            </div>

            {/* Card 4: Writing and Translation */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Redação e Tradução Instantânea
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pede ao NEXA para redigir e-mails profissionais, mensagens comerciais para clientes no WhatsApp ou traduzir conversas em dezenas de línguas estrangeiras.
              </p>
            </div>

            {/* Card 5: Documents and Files */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Análise de Documentos e Faturas
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Envia fotos de faturas, contratos em PDF ou relatórios em texto para receber uma síntese imediata dos valores, cláusulas e conclusões essenciais.
              </p>
            </div>

            {/* Card 6: Privacy and Security */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Segurança e Privacidade com Supabase
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                As tuas conversas são criptografadas e protegidas com políticas Row Level Security (RLS). Apenas tu tens acesso ao teu histórico de mensagens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Quem criou o NEXA (Startup Maurícius e Fundador) */}
      <section id="quem-criou" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              <div className="md:col-span-4 text-center">
                <div className="relative inline-block">
                  <img
                    src="/src/assets/images/founder_portrait_minimal_1793724248156.jpg"
                    alt="António Cassule Maurício - Fundador da Maurícius"
                    className="w-36 h-36 rounded-2xl object-cover mx-auto shadow-md border-2 border-emerald-500/30"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Fundador
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  António Cassule Maurício
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Fundador & Arquiteto de IA
                </p>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Maurícius — Startup de Soluções Digitais & IA</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Construído para aproximar a Inteligência Artificial das pessoas e empresas reais
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  O <strong>NEXA</strong> nasceu da visão de <strong>António Cassule Maurício</strong> de eliminar a barreira entre modelos de IA complexos e o utilizador comum. A <strong>Maurícius</strong> combinou os melhores modelos de linguagem mundiais (como o <strong>Qwen 3.8 Max</strong>) com a praticidade do WhatsApp e uma experiência web fluida, inspirada no padrão Zapia e ChatGPT.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onGoToMauricius}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                  >
                    <span>Conhecer a Startup Maurícius</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>Código Aberto no GitHub</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Section: Como Começar em 3 Passos */}
      <section id="como-funciona" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            Simples e Rápido
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-12">
            Como começar a usar o NEXA em 3 passos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-black text-emerald-500 font-mono block mb-3">01</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">Abre o Navegador ou WhatsApp</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Clica no botão para abrir o NEXA no teu navegador ou conecta-te com a tua conta WhatsApp de forma rápida.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-black text-emerald-500 font-mono block mb-3">02</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">Envia Texto, Áudio ou Tarefa</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pergunta qualquer coisa em português natural, pede para resumir um texto ou dita um áudio como farias normalmente.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-black text-emerald-500 font-mono block mb-3">03</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">Recebe Respostas Executivas</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                O NEXA processa o teu pedido com o motor Qwen 3.8 Max e entrega respostas claras, estruturadas e práticas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final: Pronto para falar com o NEXA? */}
      <section id="whatsapp" className="py-20 bg-linear-to-b from-emerald-600/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <Bot className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Pronto para falar com o teu assistente pessoal?
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto mb-8">
            Experimenta agora no teu navegador com suporte do motor de IA Qwen 3.8 Max e persistência na nuvem Supabase.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGoToWorkspace}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Começar a Conversar no NEXA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>Criar Conta com Google / E-mail</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">NEXA Assistant</span>
            <span className="mx-2">·</span>
            <span>Um produto da <strong>Maurícius</strong></span>
            <span className="mx-2">·</span>
            <span>Fundador: António Cassule Maurício</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onGoToMauricius} className="hover:underline">Site Maurícius</button>
            <button onClick={onGoToWorkspace} className="hover:underline">Abrir App</button>
            <a href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
