import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Search, 
  Send, 
  CheckCheck, 
  Bot, 
  Sparkles, 
  FileText, 
  ListPlus, 
  Menu,
  Users,
  Plus,
  Settings,
  PhoneCall,
  Check,
  Copy,
  Zap,
  Globe,
  Radio,
  Tag,
  Download,
  Trash2,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { WhatsAppContact, WhatsAppMessage, WhatsAppConfig } from '../types';
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  generateNexaWhatsAppSuggestion, 
  simulateIncomingMessage 
} from '../services/whatsapp';

interface WhatsAppHubViewProps {
  contacts: WhatsAppContact[];
  messages: Record<string, WhatsAppMessage[]>;
  onSendMessage: (contactId: string, text: string) => void;
  onAddReaction: (contactId: string, messageId: string, emoji: string) => void;
  onSummarizeThreadWithNexa: (contactName: string, threadMessages: WhatsAppMessage[]) => void;
  onExtractTasksFromThreadWithNexa: (contactName: string, threadMessages: WhatsAppMessage[]) => void;
  onSuggestReplyWithNexa: (contactName: string, lastMessage: string) => void;
  onToggleMobileSidebar: () => void;
  onAddContact?: (contact: WhatsAppContact) => void;
  onDeleteContact?: (contactId: string) => void;
  onReceiveIncomingMessage?: (fromPhone: string, fromName: string, text: string, aiReply?: string) => void;
  currentUser?: any;
  onOpenAuth?: () => void;
}

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({
  contacts,
  messages,
  onSendMessage,
  onAddReaction,
  onSummarizeThreadWithNexa,
  onExtractTasksFromThreadWithNexa,
  onSuggestReplyWithNexa,
  onToggleMobileSidebar,
  onAddContact,
  onDeleteContact,
  onReceiveIncomingMessage,
  currentUser,
  onOpenAuth
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'nao_lidas' | 'clientes' | 'equipa'>('todos');
  
  // Modais
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalTab, setConfigModalTab] = useState<'qr' | 'meta' | 'ai'>('qr');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Estado da Configuração WhatsApp
  const [config, setConfig] = useState<WhatsAppConfig>({
    connected: true,
    phoneNumber: '+244 923 001 234',
    instanceName: 'Maurícius NEXA Business Primary',
    apiMode: 'cloud_api',
    webhookVerifyToken: 'mauricius_nexa_webhook_2026',
    autoReplyEnabled: true,
    autoReplyPrompt: 'És o assistente executivo NEXA da Maurícius no WhatsApp. Responde de forma educada, precisa e profissional em português.',
    batteryLevel: 94,
    lastSync: 'Sincronizado agora',
    totalSent: 142,
    totalReceived: 98
  });

  // Campos para Novo Contacto Real
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('+244 ');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactTag, setNewContactTag] = useState('Cliente');
  const [newContactNotes, setNewContactNotes] = useState('');

  // Campos para Simulação de Mensagem Real
  const [simPhone, setSimPhone] = useState('+244 923 456 789');
  const [simName, setSimName] = useState('Dr. Carlos Silva (Diretor Comercial)');
  const [simText, setSimText] = useState('Olá António! A nossa empresa tem interesse em automatizar os processos de atendimento com a IA da Maurícius. Quando podemos agendar uma reunião?');
  const [isSimulating, setIsSimulating] = useState(false);

  // Sugestão de IA em carregamento
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Delegação inteligente @nexa (ex: "@nexa mande mensagem no Alex")
  const [nexaDelegation, setNexaDelegation] = useState<{
    originContactId: string;
    targetContactId: string;
    targetContactName: string;
    step: 'awaiting_message' | 'awaiting_confirmation';
    proposedMessage?: string;
  } | null>(null);

  // Status de digitação ativa no WhatsApp para um contacto (simulando "a escrever...")
  const [typingContactId, setTypingContactId] = useState<string | null>(null);

  const [showCrmDrawer, setShowCrmDrawer] = useState(false);
  const [crmLeadStatus, setCrmLeadStatus] = useState<'novo' | 'em_negociacao' | 'proposta' | 'fechado'>('em_negociacao');
  const [crmDealValue, setCrmDealValue] = useState('1.500.000 Kz');

  // Carregar configurações reais do backend e escutar feed de mensagens
  useEffect(() => {
    let active = true;

    const pollLiveFeed = async () => {
      try {
        const [cfg, feedRes] = await Promise.all([
          getWhatsAppConfig(),
          fetch('/api/whatsapp/feed')
        ]);
        if (!active) return;
        if (cfg) setConfig(cfg);
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          if (feedData?.stats) {
            setConfig(prev => ({
              ...prev,
              totalSent: feedData.stats.sent,
              totalReceived: feedData.stats.received
            }));
          }
        }
      } catch (err) {
        // silencioso
      }
    };

    pollLiveFeed();
    const timer = setInterval(pollLiveFeed, 6000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Contacto ativo selecionado
  const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const activeMessages = activeContact ? (messages[activeContact.id] || []) : [];

  // Filtragem dos contactos
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'nao_lidas') return c.unreadCount > 0;
    if (activeFilter === 'clientes') return c.tags?.includes('Cliente') || !c.isGroup;
    if (activeFilter === 'equipa') return c.isGroup || c.tags?.includes('Equipa');
    return true;
  });

  // Confirmação e despacho da mensagem delegada com @nexa
  const confirmAndSendNexaDelegation = () => {
    if (!nexaDelegation || !nexaDelegation.proposedMessage) return;

    const targetId = nexaDelegation.targetContactId;
    const targetName = nexaDelegation.targetContactName;
    const msgToSend = nexaDelegation.proposedMessage;
    const originId = nexaDelegation.originContactId;

    setNexaDelegation(null);

    // 1. Mensagem de status na conversa atual
    if (onReceiveIncomingMessage) {
      onReceiveIncomingMessage(
        activeContact?.phone || '+244 923 000 000',
        '🤖 NEXA Assistant',
        `⏳ A preparar despacho... O **${targetName}** está a ver **"A escrever..."** no WhatsApp neste momento.`
      );
    }

    // 2. Ativa indicador de digitação visual para o contacto alvo
    setTypingContactId(targetId);

    // 3. Aguarda 2.5s para simulação realista de digitação e despacha a mensagem
    setTimeout(() => {
      setTypingContactId(null);
      onSendMessage(targetId, msgToSend);

      if (onReceiveIncomingMessage) {
        onReceiveIncomingMessage(
          activeContact?.phone || '+244 923 000 000',
          '🤖 NEXA Assistant',
          `✅ Mensagem entregue com sucesso no WhatsApp de **${targetName}**!\n\n*"${msgToSend}"*`
        );
      }
    }, 2500);
  };

  const cancelNexaDelegation = () => {
    setNexaDelegation(null);
    if (onReceiveIncomingMessage) {
      onReceiveIncomingMessage(
        activeContact?.phone || '+244 923 000 000',
        '🤖 NEXA Assistant',
        '🚫 Envio de mensagem cancelado pelo utilizador.'
      );
    }
  };

  // Envio de mensagem inteligente com suporte nativo a @nexa
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw || !activeContact) return;

    // Envia a mensagem do utilizador na conversa atual
    onSendMessage(activeContact.id, raw);
    setInputText('');

    // Se estiver em fluxo de delegação ativo nesta conversa
    if (nexaDelegation && nexaDelegation.originContactId === activeContact.id) {
      if (nexaDelegation.step === 'awaiting_message') {
        const proposed = raw;
        setNexaDelegation({
          ...nexaDelegation,
          step: 'awaiting_confirmation',
          proposedMessage: proposed
        });

        setTimeout(() => {
          if (onReceiveIncomingMessage) {
            onReceiveIncomingMessage(
              activeContact.phone,
              '🤖 NEXA Assistant',
              `Confirma o envio da seguinte mensagem para o **${nexaDelegation.targetContactName}**?\n\n*"${proposed}"*\n\n👉 Responda **Sim** ou clica em **Confirmar e Enviar**.`
            );
          }
        }, 500);
        return;
      }

      if (nexaDelegation.step === 'awaiting_confirmation') {
        const lower = raw.toLowerCase();
        if (['sim', 'confirmo', 'envia', 'enviar', 'manda', 'pode enviar', 'ok'].some(k => lower.includes(k))) {
          confirmAndSendNexaDelegation();
        } else if (['não', 'nao', 'cancela', 'cancelar'].some(k => lower.includes(k))) {
          cancelNexaDelegation();
        }
        return;
      }
    }

    // Detecção de comandos @nexa
    if (raw.toLowerCase().includes('@nexa')) {
      const lower = raw.toLowerCase();

      // Caso 1: Delegar mensagem (ex: "@nexa mande mensagem no Alex")
      if (lower.includes('mande mensagem') || lower.includes('manda mensagem') || lower.includes('envia mensagem') || lower.includes('envie mensagem') || lower.includes('fala com') || lower.includes('fale com')) {
        const match = raw.match(/@nexa\s+(?:mande|manda|envie|envia|fala com|fale com)\s+(?:mensagem\s+)?(?:no\s+|ao\s+|para\s+|o\s+)?([a-zA-ZÀ-ÿ\s]+)/i);
        let targetName = match ? match[1].trim() : 'Alex';
        targetName = targetName.replace(/[.?!,]+$/, '').trim();

        let target = contacts.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()));

        // Se não existir, cria o contacto automaticamente (ex: Alex)
        if (!target) {
          const newTarget: WhatsAppContact = {
            id: `wa-contact-${Date.now()}`,
            name: targetName,
            phone: '+244 923 111 222',
            unreadCount: 0,
            lastMessage: 'Aguardando primeira mensagem...',
            lastMessageTime: 'Agora',
            tags: ['Cliente', 'Delegado @nexa'],
            status: 'online'
          };
          if (onAddContact) onAddContact(newTarget);
          target = newTarget;
        }

        setNexaDelegation({
          originContactId: activeContact.id,
          targetContactId: target.id,
          targetContactName: target.name,
          step: 'awaiting_message'
        });

        setTimeout(() => {
          if (onReceiveIncomingMessage) {
            onReceiveIncomingMessage(
              activeContact.phone,
              '🤖 NEXA Assistant',
              `Localizei o contacto **${target.name}** (${target.phone}). Qual é a mensagem que desejas que eu lhe envie?`
            );
          }
        }, 600);
        return;
      }

      // Caso 2: Instrução geral ou pergunta ao @nexa
      const query = raw.replace(/@nexa/gi, '').trim();
      setTimeout(async () => {
        try {
          const suggestion = await generateNexaWhatsAppSuggestion(
            activeContact.name,
            query || activeContact.lastMessage || 'Instrução para o NEXA'
          );
          if (onReceiveIncomingMessage) {
            onReceiveIncomingMessage(
              activeContact.phone,
              '🤖 NEXA Copilot',
              suggestion
            );
          }
        } catch (err) {
          if (onReceiveIncomingMessage) {
            onReceiveIncomingMessage(
              activeContact.phone,
              '🤖 NEXA Copilot',
              'Compreendido. Instrução registada e em execução pela Maurícius.'
            );
          }
        }
      }, 700);
    }
  };

  // Reação rápida
  const handleQuickReaction = (messageId: string, emoji: string) => {
    if (!activeContact) return;
    onAddReaction(activeContact.id, messageId, emoji);
  };

  // Salvar novo contacto real
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: WhatsAppContact = {
      id: `wa-real-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || undefined,
      unreadCount: 0,
      lastMessage: 'Contacto criado na Maurícius Tech',
      lastMessageTime: 'Agora',
      tags: [newContactTag],
      notes: newContactNotes.trim(),
      status: 'online'
    };

    if (onAddContact) {
      onAddContact(newContact);
    }
    setSelectedContactId(newContact.id);
    setShowAddContactModal(false);
    setNewContactName('');
    setNewContactPhone('+244 ');
    setNewContactEmail('');
    setNewContactNotes('');
  };

  // Alternar Auto-Resposta com NEXA
  const handleToggleAutoReply = async () => {
    const newAuto = !config.autoReplyEnabled;
    const updated = await saveWhatsAppConfig({ autoReplyEnabled: newAuto });
    setConfig(updated);
  };

  // Disparar Sugestão Inteligente do NEXA diretamente no input
  const handleNexaInstantSuggestion = async () => {
    if (!activeContact) return;
    setIsGeneratingSuggestion(true);
    try {
      const suggestion = await generateNexaWhatsAppSuggestion(
        activeContact.name,
        activeContact.lastMessage || 'Olá, aguardo resposta.'
      );
      setInputText(suggestion);
    } catch (e) {
      console.warn('Erro ao sugerir resposta:', e);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Executar simulação de mensagem recebida de cliente real
  const handleExecuteSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    setIsSimulating(true);

    try {
      const result = await simulateIncomingMessage(simPhone, simName, simText);
      
      if (onReceiveIncomingMessage) {
        onReceiveIncomingMessage(simPhone, simName, simText, result.reply);
      }

      setShowSimulateModal(false);
    } catch (err) {
      console.error('Erro ao simular:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Exportar histórico de conversa
  const handleExportChat = () => {
    if (!activeContact) return;
    const exportData = {
      empresa: 'Maurícius (António Cassule Maurício)',
      assistente: 'NEXA',
      contacto: activeContact.name,
      telefone: activeContact.phone,
      dataExportacao: new Date().toISOString(),
      mensagens: activeMessages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_${activeContact.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copiar URL do webhook oficial
  const handleCopyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Barra de Topo do WhatsApp Hub */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                WhatsApp Hub Pro • NEXA Multicanal
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Mercado Real
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{config.phoneNumber}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="hidden sm:inline text-slate-500">{config.instanceName}</span>
            </p>
          </div>
        </div>

        {/* Controlos e Ações Rápidas */}
        <div className="flex items-center gap-2">
          {/* Toggle de Auto-Resposta NEXA */}
          <button
            onClick={handleToggleAutoReply}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              config.autoReplyEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Quando ativo, o NEXA (Qwen 3.8 Max) responde automaticamente às mensagens de clientes recebidas pelo WhatsApp"
          >
            <Bot className={`w-3.5 h-3.5 ${config.autoReplyEnabled ? 'text-emerald-500 animate-spin-slow' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">Auto-Resposta NEXA:</span>
            <span className="font-bold">{config.autoReplyEnabled ? 'Ativa' : 'Pausada'}</span>
          </button>

          {/* Testar Mensagem Recebida (Simulação) */}
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 transition-colors cursor-pointer"
            title="Simular receção de mensagem de um cliente real"
          >
            <Radio className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Testar Entrada</span>
          </button>

          {/* Adicionar Contacto Real */}
          <button
            onClick={() => setShowAddContactModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar Contacto</span>
          </button>

          {/* Configuração Empresarial do WhatsApp */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Configuração Meta Cloud API e Pareamento QR Code"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Banner de Segurança & Autenticação Supabase */}
      {!currentUser && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Base de Dados Supabase (RLS):</strong> Inicia sessão ou cria a tua conta para guardar conversas reais e conectar o teu WhatsApp com isolamento de dados.
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shrink-0 transition-colors cursor-pointer text-xs shadow-xs"
            >
              Entrar / Criar Conta
            </button>
          )}
        </div>
      )}

      {/* Área Principal Dividida */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna da Lista de Contactos */}
        <div className="w-72 sm:w-84 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex flex-col shrink-0">
          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar por nome, número ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filtros por Categoria */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {(['todos', 'nao_lidas', 'clientes', 'equipa'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize shrink-0 transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter === 'todos' ? 'Todos' : filter === 'nao_lidas' ? 'Não lidas' : filter === 'clientes' ? 'Clientes' : 'Equipa'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Rolável de Contactos */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <Smartphone className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum contacto adicionado</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Sem dados falsos. Adiciona contactos reais com indicativo internacional (+244, +351, +55) ou sincroniza com o WhatsApp.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Contacto Real</span>
                </button>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = contact.id === selectedContactId;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-3 border-emerald-500' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Avatar com status online */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {contact.isGroup ? <Users className="w-4 h-4 text-emerald-500" /> : contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                    </div>

                    {/* Detalhes do Contacto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">{contact.lastMessageTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        {contact.lastMessage}
                      </p>
                      
                      {/* Tags do Contacto */}
                      <div className="flex items-center gap-1">
                        {contact.tags && contact.tags.length > 0 ? (
                          contact.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-400 font-mono truncate">{contact.phone}</span>
                        )}
                      </div>
                    </div>

                    {/* Contador de não lidas */}
                    {contact.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Central de Mensagens e Ações com IA */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {activeContact ? (
            <>
              {/* Cabeçalho da Conversa */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold">
                    {activeContact.isGroup ? <Users className="w-4 h-4" /> : activeContact.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeContact.name}</h2>
                      {activeContact.tags?.map((t, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{activeContact.phone}</span>
                      <span>•</span>
                      {typingContactId === activeContact.id ? (
                        <span className="text-emerald-500 font-bold animate-pulse">a escrever...</span>
                      ) : (
                        <span className="text-emerald-500 font-medium">Online via WhatsApp Web</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Botões de Ações de IA do NEXA */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Sugerir Resposta no Input */}
                  <button
                    onClick={handleNexaInstantSuggestion}
                    disabled={isGeneratingSuggestion}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Gera uma resposta adaptada ao contexto com o motor Qwen 3.8 Max"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>{isGeneratingSuggestion ? 'A gerar...' : 'Sugerir Resposta'}</span>
                  </button>

                  {/* Resumir com NEXA */}
                  <button
                    onClick={() => onSummarizeThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Gera uma síntese executiva da conversa para a Maurícius"
                  >
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>Resumir com NEXA</span>
                  </button>

                  {/* Extrair Tarefas */}
                  <button
                    onClick={() => onExtractTasksFromThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Cria tarefas acionáveis no quadro de produtividade"
                  >
                    <ListPlus className="w-3 h-3 text-amber-500" />
                    <span>Extrair Tarefas</span>
                  </button>

                  {/* CRM Readiness & Lead */}
                  <button
                    onClick={() => setShowCrmDrawer(!showCrmDrawer)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      showCrmDrawer
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 border-purple-500/20'
                    }`}
                    title="Abrir painel de gestão de CRM e negócio com este contacto"
                  >
                    <Users className="w-3 h-3" />
                    <span>CRM & Lead</span>
                  </button>

                  {/* Exportar Conversa */}
                  <button
                    onClick={handleExportChat}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Descarregar histórico desta conversa em JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Eliminar contacto (se fornecido) */}
                  {onDeleteContact && (
                    <button
                      onClick={() => {
                        if (confirm(`Tem a certeza que deseja remover o contacto ${activeContact.name}?`)) {
                          onDeleteContact(activeContact.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remover contacto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Área Central: Mensagens + Painel CRM Opcional */}
              <div className="flex-1 flex overflow-hidden">
                {/* Feed de Mensagens do Chat WhatsApp */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                  {activeMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs">Ainda não existem mensagens com este contacto.</p>
                      <p className="text-[11px] text-slate-500">Envia uma mensagem abaixo ou simula uma entrada para testar o NEXA.</p>
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`relative max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs transition-all ${
                            isUser
                              ? 'bg-emerald-700 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800'
                          }`}>
                            {/* Badge de Resposta da IA */}
                            {msg.isAiGenerated && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200 dark:text-emerald-400 mb-1 border-b border-emerald-600/40 pb-0.5">
                                <Bot className="w-3 h-3" />
                                <span>Resposta Automática NEXA (Qwen 3.8 Max)</span>
                              </div>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            
                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-80">
                              <span>{msg.timestamp}</span>
                              {isUser && (
                                <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-cyan-300' : 'text-emerald-200'}`} />
                              )}
                            </div>

                            {msg.reaction && (
                              <span className="absolute -bottom-2 -right-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.2 text-[10px] shadow-xs">
                                {msg.reaction}
                              </span>
                            )}
                          </div>

                          {/* Gatilhos de Reação Rápida */}
                          <div className="flex items-center gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleQuickReaction(msg.id, '✅')}
                              className="text-[10px] text-slate-400 hover:text-emerald-500 p-0.5"
                              title="Marcar como Concluído ✅"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleQuickReaction(msg.id, '⏳')}
                              className="text-[10px] text-slate-400 hover:text-amber-500 p-0.5"
                              title="Marcar como Em Análise ⏳"
                            >
                              ⏳
                            </button>
                            <button
                              onClick={() => handleQuickReaction(msg.id, '👍')}
                              className="text-[10px] text-slate-400 hover:text-blue-500 p-0.5"
                              title="Confirmar 👍"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleQuickReaction(msg.id, '🔥')}
                              className="text-[10px] text-slate-400 hover:text-orange-500 p-0.5"
                              title="Destaque 🔥"
                            >
                              🔥
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Indicador de Digitação Real do WhatsApp ("A escrever...") */}
                  {typingContactId === activeContact.id && (
                    <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 max-w-xs text-xs text-emerald-600 dark:text-emerald-400 shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      <span className="font-semibold text-[11px]">{activeContact.name} está a ver: a escrever...</span>
                    </div>
                  )}
                </div>

                {/* Painel Lateral de CRM & Lead (Prontidão Fase 8) */}
                {showCrmDrawer && (
                  <div className="w-72 sm:w-80 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-y-auto p-4 space-y-4 shrink-0 transition-all">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Prontidão CRM • Fase 8
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Perfil do Cliente & Lead</h4>
                      </div>
                      <button
                        onClick={() => setShowCrmDrawer(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Dados Básicos */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nome / Organização:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{activeContact.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Telefone WhatsApp:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{activeContact.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Etiqueta:</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold border border-emerald-500/20">
                          {activeContact.tags?.[0] || 'Cliente'}
                        </span>
                      </div>
                    </div>

                    {/* Estado do Lead */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Fase do Pipeline:
                      </label>
                      <select
                        value={crmLeadStatus}
                        onChange={(e: any) => setCrmLeadStatus(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="novo">Novo Lead / Prospeção</option>
                        <option value="em_negociacao">Em Qualificação / Conversação</option>
                        <option value="proposta">Proposta Comercial Enviada</option>
                        <option value="fechado">Negócio Fechado / Cliente Ativo</option>
                      </select>
                    </div>

                    {/* Valor Potencial */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Valor Estimado do Projeto:
                      </label>
                      <input
                        type="text"
                        value={crmDealValue}
                        onChange={(e) => setCrmDealValue(e.target.value)}
                        placeholder="Ex: 2.000.000 Kz"
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Notas do Cliente */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Notas Operacionais:
                      </label>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {activeContact.notes || 'Interesse em automação de processos e agentes de IA multicanal da Maurícius.'}
                      </div>
                    </div>

                    {/* Ações Inteligentes com NEXA */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <button
                        onClick={() => {
                          setInputText(`Olá ${activeContact.name}! Conforme o alinhamento da Maurícius, elaborei a minuta da proposta no valor de ${crmDealValue}. Segue para a vossa validação.`);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Preprar Proposta Comercial</span>
                      </button>

                      <button
                        onClick={() => {
                          onExtractTasksFromThreadWithNexa(activeContact.name, activeMessages);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-amber-500" />
                        <span>Agendar Tarefa de Follow-up</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Sugestões de Resposta Rápida */}
              <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  Atalhos:
                </span>
                <button
                  type="button"
                  onClick={() => setInputText(`Olá ${activeContact.name}! Entro em contacto para confirmar o agendamento da reunião executiva com a Maurícius.`)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                >
                  Confirmar reunião
                </button>
                <button
                  type="button"
                  onClick={() => setInputText(`Apresentação técnica da solução concluída com sucesso. Enviarei a documentação detalhada por e-mail.`)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                >
                  Envio de proposta
                </button>
                <button
                  type="button"
                  onClick={() => setInputText(`O assistente NEXA já está configurado e pronto para operar nos teus canais digitais.`)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                >
                  Status do NEXA
                </button>
                <button
                  type="button"
                  onClick={() => setInputText(`@nexa mande mensagem no Alex`)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0 cursor-pointer"
                >
                  @nexa mande mensagem no Alex
                </button>
                <button
                  type="button"
                  onClick={() => setInputText(`@nexa resume esta conversa e sugere ações`)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold shrink-0 cursor-pointer"
                >
                  @nexa resumo
                </button>
              </div>

              {/* Barra de Confirmação Interativa para Delegação @nexa */}
              {nexaDelegation && nexaDelegation.step === 'awaiting_confirmation' && (
                <div className="px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-950/40 border-t border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-800 dark:text-emerald-200">
                      Enviar para <strong>{nexaDelegation.targetContactName}</strong>: <em>"{nexaDelegation.proposedMessage}"</em>?
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={confirmAndSendNexaDelegation}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      Confirmar e Enviar
                    </button>
                    <button
                      type="button"
                      onClick={cancelNexaDelegation}
                      className="px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário de Envio de Mensagem */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Responder a ${activeContact.name} no WhatsApp (+244)...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-xs font-bold shrink-0 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Enviar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">WhatsApp Hub da Maurícius</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sem dados falsos. Conecta a tua conta oficial do WhatsApp ou adiciona contactos reais (Angola +244, Portugal +351, Brasil +55) para gerir comunicações e automações de IA com o NEXA.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Contacto Real</span>
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Conectar WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: CONFIGURAÇÃO DE MERCADO DO WHATSAPP (META & QR CODE)        */}
      {/* ==================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Integração WhatsApp Empresarial</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conexão oficial para empresas e ponte de instância para o NEXA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Abas de Configuração */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
              <button
                onClick={() => setConfigModalTab('qr')}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'qr'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pareamento QR
              </button>
              <button
                onClick={() => setConfigModalTab('meta')}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'meta'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Meta Cloud API
              </button>
              <button
                onClick={() => setConfigModalTab('ai')}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'ai'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Agente IA NEXA
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: PAREAMENTO QR CODE */}
            {configModalTab === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block mx-auto shadow-inner">
                  {/* QR Code Canvas Dinâmico */}
                  <div className="w-44 h-44 bg-slate-950 flex flex-col items-center justify-center text-white text-xs p-2 rounded-xl relative mx-auto">
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-1 opacity-90">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-transparent'}`} 
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg border border-emerald-400/40">
                        <Smartphone className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 max-w-sm mx-auto">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Como emparelhar com o teu telemóvel:
                  </p>
                  <p>1. Abre o WhatsApp &gt; Definições &gt; <strong>Aparelhos Conectados</strong></p>
                  <p>2. Toca em <strong>Conectar um Aparelho</strong> e aponta a câmara</p>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                    Código de Pareamento Rápido: <strong>MAUR-9234-2026</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Dispositivo: <strong>Samsung Galaxy / iPhone</strong></span>
                  </div>
                  <span className="font-mono text-emerald-500 font-bold">Bateria: {config.batteryLevel}%</span>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: META WHATSAPP CLOUD API (OFICIAL) */}
            {configModalTab === 'meta' && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Meta Cloud API (Graph API v21.0)
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Utilizada por grandes empresas para envio oficial sem risco de bloqueio de número.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Meta Phone Number ID:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 104598234871234"
                    value={config.metaPhoneNumberId || ''}
                    onChange={(e) => setConfig({ ...config, metaPhoneNumberId: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Meta System Access Token:
                  </label>
                  <input
                    type="password"
                    placeholder="EAAO..."
                    value={config.metaAccessToken || ''}
                    onChange={(e) => setConfig({ ...config, metaAccessToken: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    URL do Webhook Oficial (Colar no Painel da Meta):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/whatsapp/webhook`}
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 select-all"
                    />
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Verify Token: <code className="text-emerald-500 font-bold">{config.webhookVerifyToken}</code></span>
                  <span>SSL: <strong className="text-emerald-500">HTTPS Ativo</strong></span>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 3: AGENTE IA NEXA */}
            {configModalTab === 'ai' && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Auto-Resposta Inteligente (Qwen 3.8 Max)</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      O NEXA atende os clientes no WhatsApp 24/7 de forma personalizada.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoReplyEnabled}
                    onChange={(e) => setConfig({ ...config, autoReplyEnabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Instrução de Comportamento para o WhatsApp:
                  </label>
                  <textarea
                    rows={3}
                    value={config.autoReplyPrompt}
                    onChange={(e) => setConfig({ ...config, autoReplyPrompt: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Instruções para o assistente responder aos clientes..."
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p>• Motor Ativo: <strong>Qwen 3.8 Max</strong> (compatível OpenAI)</p>
                  <p>• Contingência Automática: <strong>Gemini 2.5 Flash</strong></p>
                  <p>• Transição Humana: Se o cliente pedir para falar com uma pessoa, o NEXA notifica António Cassule Maurício.</p>
                </div>
              </div>
            )}

            {/* Rodapé do Modal com Botão de Gravação */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  await saveWhatsAppConfig(config);
                  setShowConfigModal(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADICIONAR CONTACTO REAL (DDI ANGOLA, PORTUGAL, BRASIL...)  */}
      {/* ==================================================================== */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateContact} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Adicionar Novo Contacto</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo / Empresa: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenheiro Mateus da Silva"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número de Telefone WhatsApp (Com DDI): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+244 923 000 000"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Exemplos: +244 (Angola), +351 (Portugal), +55 (Brasil), +258 (Moçambique)</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria / Tag:
                  </label>
                  <select
                    value={newContactTag}
                    onChange={(e) => setNewContactTag(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Lead VIP">Lead VIP</option>
                    <option value="Equipa">Equipa</option>
                    <option value="Parceiro">Parceiro</option>
                    <option value="Fornecedor">Fornecedor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail (Opcional):
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas Internas (Maurícius):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Interessado em automação de relatórios e integração WhatsApp."
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
              >
                Salvar Contacto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: TESTADOR DE ENTRADA REAL (SIMULADOR DE WEBHOOK E IA)        */}
      {/* ==================================================================== */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleExecuteSimulation} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Testador de Mensagem Recebida</h3>
                  <p className="text-[10px] text-slate-500">Dispara o Webhook do backend para validar a IA NEXA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Cliente:
                  </label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Número WhatsApp:
                  </label>
                  <input
                    type="text"
                    required
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mensagem Enviada pelo Cliente:
                </label>
                <textarea
                  rows={3}
                  required
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Escreve uma mensagem simulada de um cliente..."
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  O que vai acontecer:
                </p>
                <p>1. O backend recebe esta mensagem no endpoint <code>/api/whatsapp/simulate-incoming</code>.</p>
                <p>2. Se a Auto-Resposta estiver ligada, o NEXA (Qwen 3.8 Max) gera imediatamente uma resposta inteligente e envia de volta!</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSimulating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'A processar IA...' : 'Simular Receção Real'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
