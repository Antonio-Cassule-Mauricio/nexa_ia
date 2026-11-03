import React from 'react';
import { 
  Bot, 
  ArrowRight, 
  Github, 
  Sun, 
  Moon, 
  ExternalLink, 
  CheckCircle2, 
  Smartphone, 
  Database, 
  Cpu, 
  Workflow, 
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MauriciusLandingPageProps {
  onGoToNexaSite: () => void;
  onGoToWorkspace: () => void;
}

export const MauriciusLandingPage: React.FC<MauriciusLandingPageProps> = ({
  onGoToNexaSite,
  onGoToWorkspace
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4-5 Nav Links) — Zone 3 (Action & Theme) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-black text-sm shadow-sm">
              M
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Maurícius
            </span>
          </div>

          {/* Zone 2: 4-5 single-line clean text links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-300">
            <a href="#solucoes" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Soluções</a>
            <a href="#nexa-spotlight" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">NEXA AI</a>
            <a href="#impacto" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Resultados</a>
            <a href="#sobre" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Sobre a Empresa</a>
          </nav>

          {/* Zone 3: 1 primary action + theme toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={onGoToNexaSite}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              <span>Conhecer o NEXA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
              <span>Soluções Digitais, Automação & Inteligência Artificial</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6 text-balance">
              Ecossistemas digitais de alta performance e agentes de IA multicanal.
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              A <strong>Maurícius</strong> projeta arquiteturas de software escaláveis, automação inteligente de processos de negócio e agentes conversacionais de última geração preparados para a web e para o WhatsApp.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={onGoToNexaSite}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Explorar Produto Flagship: NEXA</span>
              </button>

              <button
                onClick={onGoToWorkspace}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 transition-colors shadow-xs"
              >
                <span>Aceder ao Workspace de Chat</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Hero Photography Asset with Measured Scrim */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 aspect-16/9 max-h-[460px]">
            <img
              src="/src/assets/images/hero_mauricius_studio_1793724248159.jpg"
              alt="Maurícius Tech Labs - Modern Architecture & Studio"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6 sm:p-10">
              <div className="text-white">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold block mb-1">
                  Maurícius Tech & AI Labs
                </span>
                <p className="text-sm sm:text-base font-medium max-w-xl text-slate-200">
                  Infraestrutura de software moderna, engenharia de prompts rigorosa e modelos de IA de última geração (Qwen 3.8 Max e Supabase).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Product Showcase: NEXA Assistant Card */}
      <section id="nexa-spotlight" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-12 bg-linear-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 border border-emerald-500/20 dark:border-emerald-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Produto Flagship da Maurícius</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  NEXA Assistant — Inspirado na usabilidade do Zapia
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                  Criámos uma plataforma e um assistente conversacional pessoal capaz de atuar diretamente no <strong>WhatsApp</strong> e na <strong>Web</strong>. O NEXA transcreve áudios em segundos, pesquisa em tempo real, organiza prioridades de equipas e responde em português natural.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Resumo instantâneo de mensagens e áudios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pesquisa de mercado e informações em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Gestão executiva de tarefas e compromissos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Base de dados relacional Supabase com RLS</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onGoToNexaSite}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>Visitar o Site Oficial do NEXA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onGoToWorkspace}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>Abrir Chat Web do NEXA</span>
                  </button>
                </div>
              </div>

              {/* Visual preview */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900">
                  <img
                    src="/src/assets/images/hero_nexa_ai_assistant_1793724248893.jpg"
                    alt="NEXA AI Assistant Interface"
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4 bg-slate-950/90 text-white flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block">NEXA Mobile & Web Hub</span>
                      <span className="text-[10px] text-slate-400">Desenvolvido por Maurícius</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      qwen3.8-max
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities / Services */}
      <section id="solucoes" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
              Soluções Tecnológicas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engenharia de software e automação para empresas
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
              Soluções construídas para resolver estrangulamentos operacionais reais e impulsionar equipas de vendas e suporte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-all">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-4 block">01. Agentes Inteligentes</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Agentes de IA Personalizados</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Desenvolvemos agentes treinados nas políticas e catálogos da sua empresa, integrados com modelos de última geração em português.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-4 block">02. Ecossistemas de Mensagens</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Automação de WhatsApp Multicanal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Integração do WhatsApp corporativo a fluxos de pedidos, triagem automática de clientes e resumo de conversas para equipas comerciais.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition-all">
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-4 block">03. Arquitetura Escalável</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Bases de Dados Supabase & Cloud</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Estruturação de dados relacionais PostgreSQL com segurança a nível de linha (RLS), autenticação robusta e APIs assíncronas em nuvem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quantified Results / Impact Section */}
      <section id="impacto" className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight block mb-1">
                &lt; 2.4s
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                Tempo Médio de Resposta
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Com o motor Qwen 3.8 Max e endpoints assíncronos</p>
            </div>

            <div className="p-6">
              <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight block mb-1">
                +180%
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                Eficiência Operacional
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Na extração e triagem automática de tarefas diárias</p>
            </div>

            <div className="p-6">
              <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 font-mono tracking-tight block mb-1">
                100%
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                Retenção de Contexto
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Histórico multi-sessão sincronizado no Supabase</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Mauricius & Leadership Section */}
      <section id="sobre" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
              
              <div className="sm:col-span-4 text-center">
                <img
                  src="/src/assets/images/founder_portrait_minimal_1793724248156.jpg"
                  alt="António Cassule Maurício - Liderança e Fundador da Maurícius"
                  className="w-36 h-36 rounded-2xl object-cover mx-auto shadow-md border-2 border-slate-200 dark:border-slate-700"
                />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  António Cassule Maurício
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Fundador & Arquiteto de IA
                </p>
              </div>

              <div className="sm:col-span-8 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Sobre a Maurícius
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Construir produtos digitais que resolvem problemas reais.
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  A <strong>Maurícius</strong> é uma empresa de tecnologia orientada à criação de ecossistemas digitais escaláveis e automações inteligentes. Sob a liderança do fundador <strong>António Cassule Maurício</strong>, desenvolvemos soluções avançadas como o <strong>NEXA</strong>, aproximando a inteligência artificial do quotidiano de profissionais e empresas.
                </p>
                <div className="flex gap-3 pt-2">
                  <a
                    href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                  >
                    <Github className="w-4 h-4" />
                    <span>Ver Repositório no GitHub</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Maurícius Tech & AI Labs</span>
            <span className="mx-2">·</span>
            <span>Fundada por António Cassule Maurício</span>
            <span className="mx-2">·</span>
            <span>© 2026 Todos os direitos reservados</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onGoToNexaSite} className="hover:underline">Site do NEXA</button>
            <button onClick={onGoToWorkspace} className="hover:underline">Abrir Workspace</button>
            <a href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
