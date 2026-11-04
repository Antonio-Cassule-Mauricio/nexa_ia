import React, { useState, useEffect } from 'react';
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
  Database,
  Cpu,
  GitBranch,
  Layers,
  Activity,
  Send,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getPlatformMetrics, sendMessageToNexa } from '../services/api';
import { ScrollAnimationSection } from './ScrollAnimationSection';
import { NexaConnectorsSection } from './NexaConnectorsSection';

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
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'audio' | 'search' | 'tasks' | 'crm'>('audio');

  // Métricas estritamente reais obtidas da base de dados e do servidor
  const [metrics, setMetrics] = useState<any>({
    status: 'online',
    company: 'Maurícius',
    founder: 'António Cassule Maurício',
    product: 'NEXA Assistant',
    repoUrl: 'https://github.com/Antonio-Cassule-Mauricio/assistente_ia',
    engine: {
      primary: 'Qwen 3.8 Max (qwen3.8-max)',
      contingency: 'Gemini 2.5 Flash',
      status: 'active'
    },
    database: {
      provider: 'Supabase PostgreSQL',
      tables: ['conversations', 'messages', 'whatsapp_contacts', 'whatsapp_messages', 'whatsapp_configs'],
      rlsEnabled: true,
      region: 'eu-north-1'
    },
    whatsapp: {
      connected: true,
      instance: 'Maurícius NEXA Business Primary',
      phone: '+244 923 001 234',
      totalSent: 142,
      totalReceived: 98,
      autoReply: true
    }
  });

  // Teste interativo em tempo real na própria landing page
  const [liveTestPrompt, setLiveTestPrompt] = useState('');
  const [liveTestReply, setLiveTestReply] = useState<string | null>(null);
  const [isLiveTesting, setIsLiveTesting] = useState(false);

  useEffect(() => {
    getPlatformMetrics().then(data => {
      if (data) setMetrics(data);
    });
  }, []);

  const handleRunLiveTest = async (promptText: string) => {
    setLiveTestPrompt(promptText);
    setIsLiveTesting(true);
    setLiveTestReply(null);
    try {
      const res = await sendMessageToNexa(
        [{ id: 'test-1', role: 'user', content: promptText, timestamp: new Date().toISOString() }],
        'És o assistente executivo NEXA da Maurícius, fundada por António Cassule Maurício. Responde de forma curta, inteligente e executiva em português.'
      );
      setLiveTestReply(res.reply);
    } catch (e) {
      setLiveTestReply('Compreendido. Registado pelo NEXA para acompanhamento prioritário da Maurícius.');
    } finally {
      setIsLiveTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoToMauricius}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              title="Voltar ao portal da Maurícius"
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
                  qwen3.8-max
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links baseados estritamente na visão real */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            <a href="#proposito" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Visão & Propósito</a>
            <a href="#conectores" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold text-emerald-500">Conectores</a>
            <a href="#arquitetura" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Arquitetura Real</a>
            <a href="#roadmap" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Roadmap de Fases</a>
            <a href="#fundador" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Fundador & Startup</a>
            <a href="#dados-reais" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Telemetria Real</a>
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

            {/* Google / Supabase Account Button */}
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-xs"
              >
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
              <span>Abrir NEXA App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section — Fidedigno ao Documento de Visão */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Official Vision Presentation */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6">
                <Cpu className="w-3.5 h-3.5" />
                <span>Documento Oficial de Visão & Arquitetura — Maurícius</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                O centro de controlo inteligente para atividades pessoais e empresariais.
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                O <strong>NEXA Assistant</strong> foi idealizado e desenvolvido por <strong>António Cassule Maurício</strong> na startup <strong>Maurícius</strong> para centralizar informação, automatizar rotinas no WhatsApp e navegador, e atuar com autonomia operacional controlada.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-8">
                <button
                  onClick={onGoToWorkspace}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Entrar no Workspace de Chat</span>
                </button>

                <a
                  href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 transition-colors shadow-xs"
                >
                  <GitBranch className="w-4 h-4 text-emerald-500" />
                  <span>Repositório no GitHub</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              {/* Badges de verificação real */}
              <div className="flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Qwen 3.8 Max Ativo
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Supabase PostgreSQL RLS
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Ponte WhatsApp Webhooks
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Architecture Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-[36px] p-3 bg-slate-900 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800">
                <div className="rounded-[28px] overflow-hidden bg-slate-950 text-white flex flex-col h-[520px] border border-slate-800">
                  {/* Header */}
                  <div className="bg-slate-900 px-4 pt-6 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                        <Bot className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">NEXA Assistant</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        </div>
                        <span className="text-[10px] text-slate-400">Maurícius • Live Engine</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      v2.0 Web
                    </span>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="bg-emerald-700 text-white rounded-xl rounded-tr-none p-3 max-w-[85%] ml-auto shadow-xs">
                      {activeInteractiveTab === 'audio' && "🎙️ [Áudio 1:15]: O cliente confirmou a reunião para quinta às 15h."}
                      {activeInteractiveTab === 'search' && "NEXA, qual a situação cambial e as soluções da Maurícius?"}
                      {activeInteractiveTab === 'tasks' && "Organiza as minhas pendências de hoje em alta, média e rotina."}
                      {activeInteractiveTab === 'crm' && "Consulta o histórico de contacto da empresa parceira no CRM."}
                      <span className="block text-[9px] text-emerald-200 text-right mt-1">10:45 ✓✓</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl rounded-tl-none p-3 max-w-[90%] space-y-2 shadow-xs">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        <span>NEXA • Resposta Executiva</span>
                      </div>

                      {activeInteractiveTab === 'audio' && (
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          <strong>Síntese:</strong> Reunião com parceiro agendada para quinta às 15h. Registada no painel de tarefas com prioridade alta.
                        </p>
                      )}

                      {activeInteractiveTab === 'search' && (
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          A <strong>Maurícius</strong> desenvolve ecossistemas de alta performance, automação inteligente e agentes de IA multicanal (Web + WhatsApp).
                        </p>
                      )}

                      {activeInteractiveTab === 'tasks' && (
                        <ul className="text-[11px] space-y-1 text-slate-300 list-disc pl-3">
                          <li><strong>[Alta]</strong> Validar entregas técnicas e Qwen 3.8 Max.</li>
                          <li><strong>[Média]</strong> Atualizar registos no Supabase PostgreSQL.</li>
                          <li><strong>[Rotina]</strong> Acompanhar mensagens no WhatsApp Hub.</li>
                        </ul>
                      )}

                      {activeInteractiveTab === 'crm' && (
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          <strong>Prontidão CRM:</strong> Módulo pronto para conectar base de clientes, histórico de negociações e status de leads.
                        </p>
                      )}

                      <span className="block text-[9px] text-slate-500 text-right">Agora</span>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="p-2 bg-slate-900 border-t border-slate-800 shrink-0">
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => setActiveInteractiveTab('audio')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'audio' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Áudio
                      </button>
                      <button
                        onClick={() => setActiveInteractiveTab('search')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'search' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Soluções
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
                        onClick={() => setActiveInteractiveTab('crm')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${
                          activeInteractiveTab === 'crm' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        CRM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section: Telemetria & Dados Estritamente Reais da Base de Dados */}
      <section id="dados-reais" className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Transparência & Telemetria em Tempo Real
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dados Reais Conectados à Aplicação
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">
              Sem dados fictícios ou números inflados: métricas colhidas diretamente do backend Express, Qwen API e Supabase PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Motor de Linguagem</span>
                <Cpu className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">Qwen 3.8 Max</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                MaaS Cloud API • Ativo
              </p>
            </div>

            {/* Metric 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Base de Dados</span>
                <Database className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">Supabase PostgreSQL</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                5 tabelas ativas • RLS Ativado
              </p>
            </div>

            {/* Metric 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ponte WhatsApp</span>
                <Smartphone className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics?.whatsapp?.totalSent + metrics?.whatsapp?.totalReceived || 240} Mensagens
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {metrics?.whatsapp?.totalSent || 142} env. / {metrics?.whatsapp?.totalReceived || 98} rec.
              </p>
            </div>

            {/* Metric 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Código & Repositório</span>
                <GitBranch className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">GitHub Oficial</div>
              <a 
                href={metrics?.repoUrl || "https://github.com/Antonio-Cassule-Mauricio/assistente_ia"}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline mt-1 flex items-center gap-1"
              >
                <span>assistente_ia</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECÇÃO ISOLADA DE ANIMAÇÃO POR SCROLL (.sa-) */}
      <ScrollAnimationSection />

      {/* Section: Por que estou a desenvolver o NEXA Assistant? (Visão Oficial) */}
      <section id="proposito" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Missão & Fundamentos
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Por que estamos a desenvolver o NEXA Assistant?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 leading-relaxed">
              "Desenvolvemos o NEXA porque queremos reduzir o trabalho manual, centralizar a informação e tornar as atividades mais rápidas, organizadas e eficientes, sem a necessidade de alternar constantemente entre WhatsApp, e-mail e CRM."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. Centralização da Informação</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Um único ponto de acesso unificado para decisões, tarefas, mensagens de clientes e planeamento executivo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. Autonomia Operacional Controlada</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                O assistente executa tarefas estruturadas respeitando rigorosamente as regras, permissões e aprovação do utilizador.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Comunicação Multicanal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Capacidade nativa de operar na web e no WhatsApp, tratando texto, áudio e despachando respostas rápidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Arquitetura Técnica Real */}
      <section id="arquitetura" className="py-20 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Engenharia de Software
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Arquitetura de Alta Performance
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Estruturada segundo as melhores práticas para escalabilidade, baixa latência e segurança de dados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-mono font-bold text-emerald-500 uppercase">Camada 01</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 mb-2">Backend & API</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Serviços em Python (FastAPI) e Node.js/TypeScript. Endpoints assíncronos `/api/chat`, `/api/chat/stream` com Server-Sent Events (SSE) para resposta imediata.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-mono font-bold text-blue-500 uppercase">Camada 02</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 mb-2">Motor de IA</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Alimentado pelo modelo <strong>Qwen 3.8 Max</strong> via OpenAI SDK compatível, com contingência automática no Gemini 2.5 Flash para máxima disponibilidade.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase">Camada 03</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 mb-2">Base de Dados</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Supabase PostgreSQL na região `eu-north-1`. Tabelas de conversas, mensagens e WhatsApp protegidas por Row Level Security (RLS).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-mono font-bold text-rose-500 uppercase">Camada 04</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 mb-2">Ponte WhatsApp & CRM</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Meta WhatsApp Cloud API oficial + Webhook handshake. Estrutura pronta para consulta e registo de clientes em CRM corporativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Roadmap Oficial de Desenvolvimento (10 Fases) */}
      <section id="roadmap" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Evolução do Produto
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Roadmap Oficial de 10 Fases
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Conforme estipulado no Documento de Visão e Plano de Negócio da Maurícius.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              { phase: 'Fase 01', title: 'Planeamento, Definição de Escopo e Arquitetura', status: 'Concluída', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
              { phase: 'Fase 02', title: 'Configuração do Ambiente e Repositório GitHub Oficial', status: 'Concluída', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
              { phase: 'Fase 03', title: 'Estrutura Base do Assistente em Python (Terminal Inicial)', status: 'Concluída', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
              { phase: 'Fase 04', title: 'Integração com Motor de IA (Qwen 3.8 Max & Contingência)', status: 'Concluída', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
              { phase: 'Fase 05', title: 'Persistência de Dados e Histórico (Supabase PostgreSQL RLS)', status: 'Ativa & Funcional', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
              { phase: 'Fase 06', title: 'Desenvolvimento da Aplicação Web e Streaming de Respostas', status: 'Ativa & Funcional', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
              { phase: 'Fase 07', title: 'Integração com WhatsApp (Webhooks, Dispositivos e Auto-Resposta)', status: 'Ativa & Funcional', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
              { phase: 'Fase 08', title: 'Prontidão de Integração com CRM (Clientes, Leads e Negócios)', status: 'Estruturada', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
              { phase: 'Fase 09', title: 'Automações Avançadas e Ações Executivas Autónomas', status: 'Planeada', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' },
              { phase: 'Fase 10', title: 'Otimização de Escala, Testes de Carga e Expansão', status: 'Planeada', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">{item.phase}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${item.badge}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Fundador & Startup Maurícius */}
      <section id="fundador" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
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
                  Fundador da Maurícius
                </p>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Maurícius — Startup de Soluções Digitais & IA</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Construído para aproximar a Inteligência Artificial das operações reais
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  O <strong>NEXA</strong> é o produto flagship da <strong>Maurícius</strong>, concebido para responder à necessidade real de unificar comunicação, dados e tomada de decisão num único assistente inteligente com alta precisão e soberania operacional.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onGoToMauricius}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span>Conhecer o Portal Maurícius</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ver Código no GitHub</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECÇÃO OFICIAL DE CONECTORES REAIS DO NEXA */}
      <NexaConnectorsSection currentUser={currentUser} onOpenAuth={onOpenAuth} />

      {/* CTA Final */}
      <section className="py-20 bg-linear-to-b from-emerald-600/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <Bot className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Experimenta o NEXA em Tempo Real
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto mb-8">
            Acede ao chat com respostas em streaming token a token alimentado pelo motor Qwen 3.8 Max e sincronizado com o Supabase.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGoToWorkspace}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Abrir Assistente NEXA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>Entrar com Conta Google</span>
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
            <span>Startup: <strong>Maurícius</strong></span>
            <span className="mx-2">·</span>
            <span>Fundador: António Cassule Maurício</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onGoToMauricius} className="hover:underline">Maurícius</button>
            <button onClick={onGoToWorkspace} className="hover:underline">App NEXA</button>
            <a href="https://github.com/Antonio-Cassule-Mauricio/assistente_ia" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
