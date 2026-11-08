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
  Check,
  Copy,
  Zap,
  Globe,
  Radio,
  Download,
  Trash2,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  LogOut,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { WhatsAppContact, WhatsAppMessage, WhatsAppConfig, WhatsAppQrState } from '../types';
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  generateNexaWhatsAppSuggestion,
  getWhatsAppQrSession,
  requestWhatsAppPairingCode,
  disconnectWhatsAppSession
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
  const [configModalTab, setConfigModalTab] = useState<'qr' | 'pairing_code' | 'meta' | 'ai'>('qr');
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Estado da Configuração WhatsApp
  const [config, setConfig] = useState<WhatsAppConfig>({
    connected: false,
    phoneNumber: '',
    instanceName: 'Maurícius NEXA Hub',
    apiMode: 'personal_baileys',
    webhookVerifyToken: '',
    autoReplyEnabled: false,
    autoReplyPrompt: 'És o assistente executivo NEXA da Maurícius no WhatsApp. Responde com educação, objetividade executiva em português e ajuda o cliente.',
    batteryLevel: 0,
    lastSync: 'Nunca sincronizado',
    totalSent: 0,
    totalReceived: 0
  });

  // Estado Real da Sessão QR / Pareamento do WhatsApp Pessoal
  const [qrSession, setQrSession] = useState<WhatsAppQrState>({
    status: 'disconnected'
  });
  const [pairingPhoneInput, setPairingPhoneInput] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [generatedPairingCode, setGeneratedPairingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Campos para Novo Contacto Real
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('+');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactTag, setNewContactTag] = useState('Cliente');
  const [newContactNotes, setNewContactNotes] = useState('');

  // Sugestão de IA em carregamento
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Delegação inteligente @nexa
  const [nexaDelegation, setNexaDelegation] = useState<{
    originContactId: string;
    targetContactId: string;
    targetContactName: string;
    step: 'awaiting_message' | 'awaiting_confirmation';
    proposedMessage?: string;
  } | null>(null);

  // CRM Drawer
  const [showCrmDrawer, setShowCrmDrawer] = useState(false);
  const [crmLeadStatus, setCrmLeadStatus] = useState<'novo' | 'em_negociacao' | 'proposta' | 'fechado'>('em_negociacao');
  const [crmDealValue, setCrmDealValue] = useState('1.500.000 Kz');

  // Notificações Toast locais
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carregar configurações reais do backend e escutar feed de mensagens + sessão QR
  useEffect(() => {
    let active = true;

    const pollLiveFeedAndQr = async () => {
      try {
        const [cfg, feedRes, qrData] = await Promise.all([
          getWhatsAppConfig(),
          fetch('/api/whatsapp/feed'),
          getWhatsAppQrSession()
        ]);
        if (!active) return;
        if (cfg) setConfig(cfg);
        if (qrData) {
          setQrSession(qrData);
          if (qrData.pairingCode) {
            setGeneratedPairingCode(qrData.pairingCode);
          }
        }
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
        // Silencioso
      }
    };

    pollLiveFeedAndQr();
    const timer = setInterval(pollLiveFeedAndQr, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Solicitar Código de Pareamento de 8 dígitos
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhoneInput.trim()) return;

    setPairingLoading(true);
    setPairingError(null);
    setGeneratedPairingCode(null);

    const res = await requestWhatsAppPairingCode(pairingPhoneInput);
    setPairingLoading(false);

    if (res.success && res.pairingCode) {
      setGeneratedPairingCode(res.pairingCode);
      showToast('Código de pareamento gerado! Digite no seu WhatsApp.');
    } else {
      setPairingError(res.error || 'Não foi possível gerar código de pareamento. Verifique o número.');
    }
  };

  // Desconectar Sessão do WhatsApp
  const handleDisconnectSession = async () => {
    if (confirm('Tem a certeza que deseja desconectar o seu WhatsApp desta sessão?')) {
      const res = await disconnectWhatsAppSession();
      if (res.success) {
        showToast('WhatsApp desconectado com sucesso.');
        setQrSession({ status: 'disconnected' });
        setConfig(prev => ({ ...prev, connected: false, phoneNumber: '' }));
      }
    }
  };

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

  // Confirmação e despacho de delegação @nexa
  const confirmAndSendNexaDelegation = () => {
    if (!nexaDelegation || !nexaDelegation.proposedMessage) return;

    const targetId = nexaDelegation.targetContactId;
    const targetName = nexaDelegation.targetContactName;
    const msgToSend = nexaDelegation.proposedMessage;

    setNexaDelegation(null);
    onSendMessage(targetId, msgToSend);

    if (onReceiveIncomingMessage && activeContact) {
      onReceiveIncomingMessage(
        activeContact.phone,
        '🤖 NEXA Assistant',
        `✅ Mensagem despachada para o WhatsApp de **${targetName}**:\n\n*"${msgToSend}"*`
      );
    }
  };

  const cancelNexaDelegation = () => {
    setNexaDelegation(null);
    if (onReceiveIncomingMessage && activeContact) {
      onReceiveIncomingMessage(
        activeContact.phone,
        '🤖 NEXA Assistant',
        '🚫 Envio de mensagem cancelado pelo utilizador.'
      );
    }
  };

  // Envio de mensagem com suporte a @nexa
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw || !activeContact) return;

    onSendMessage(activeContact.id, raw);
    setInputText('');

    if (nexaDelegation && nexaDelegation.originContactId === activeContact.id) {
      if (nexaDelegation.step === 'awaiting_message') {
        const proposed = raw;
        setNexaDelegation({
          ...nexaDelegation,
          step: 'awaiting_confirmation',
          proposedMessage: proposed
        });

        if (onReceiveIncomingMessage) {
          onReceiveIncomingMessage(
            activeContact.phone,
            '🤖 NEXA Assistant',
            `Confirma o envio da seguinte mensagem para **${nexaDelegation.targetContactName}**?\n\n*"${proposed}"*\n\n👉 Responda **Sim** ou clique em **Confirmar e Enviar**.`
          );
        }
        return;
      }

      if (nexaDelegation.step === 'awaiting_confirmation') {
        const lower = raw.toLowerCase();
        if (['sim', 'confirmo', 'envia', 'enviar', 'manda', 'ok'].some(k => lower.includes(k))) {
          confirmAndSendNexaDelegation();
        } else if (['não', 'nao', 'cancela', 'cancelar'].some(k => lower.includes(k))) {
          cancelNexaDelegation();
        }
        return;
      }
    }

    if (raw.toLowerCase().includes('@nexa')) {
      const query = raw.replace(/@nexa/gi, '').trim();
      generateNexaWhatsAppSuggestion(activeContact.name, query || activeContact.lastMessage || 'Instrução').then(suggestion => {
        if (onReceiveIncomingMessage && activeContact) {
          onReceiveIncomingMessage(
            activeContact.phone,
            '🤖 NEXA Copilot',
            suggestion
          );
        }
      });
    }
  };

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
      lastMessage: 'Contacto adicionado',
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
    setNewContactPhone('+');
    setNewContactEmail('');
    setNewContactNotes('');
    showToast(`Contacto ${newContact.name} guardado com sucesso!`);
  };

  const handleToggleAutoReply = async () => {
    const newAuto = !config.autoReplyEnabled;
    const updated = await saveWhatsAppConfig({ autoReplyEnabled: newAuto });
    setConfig(updated);
    showToast(newAuto ? 'Auto-resposta NEXA ativada no WhatsApp' : 'Auto-resposta NEXA pausada');
  };

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

  const handleExportChat = () => {
    if (!activeContact) return;
    const exportData = {
      empresa: 'Maurícius Tech',
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

  const handleCopyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyPairingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isConnected = config.connected || qrSession.status === 'authenticated';
  const displayPhone = qrSession.connectedPhone || config.phoneNumber;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors relative">
      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

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
                WhatsApp Hub • NEXA Multicanal
              </h1>
              {isConnected ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              {isConnected ? (
                <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {displayPhone || 'WhatsApp Pessoal Ativo'}
                </span>
              ) : (
                <span className="text-slate-400">
                  Nenhum telemóvel conectado. Conecte o seu WhatsApp pessoal com QR Code ou Código de Pareamento.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controlos e Ações Rápidas */}
        <div className="flex items-center gap-2">
          {/* Botão de Conectar / Desconectar */}
          {isConnected ? (
            <button
              onClick={handleDisconnectSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
              title="Desconectar o WhatsApp"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowConfigModal(true);
                setConfigModalTab('qr');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/25 cursor-pointer animate-pulse"
              title="Conectar agora o seu WhatsApp Pessoal"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Conectar WhatsApp Agora</span>
            </button>
          )}

          {/* Toggle de Auto-Resposta NEXA */}
          <button
            onClick={handleToggleAutoReply}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              config.autoReplyEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Quando ativo, o NEXA (Qwen 3.8 Max) responde automaticamente às mensagens recebidas no WhatsApp"
          >
            <Bot className={`w-3.5 h-3.5 ${config.autoReplyEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">Auto-Resposta:</span>
            <span className="font-bold">{config.autoReplyEnabled ? 'Ativa' : 'Pausada'}</span>
          </button>

          {/* Adicionar Contacto Real */}
          <button
            onClick={() => setShowAddContactModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Contacto</span>
          </button>

          {/* Configuração */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Definições do Conector WhatsApp"
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
              <strong>Base de Dados Supabase (RLS):</strong> Inicia sessão para guardar os teus contactos e conversas reais do WhatsApp na nuvem.
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

      {/* Banner de Desconexão / Ação Rápida de Pareamento */}
      {!isConnected && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
            <span>
              <strong>Conecte o seu WhatsApp pessoal agora:</strong> Escaneie o QR Code com o seu telemóvel ou gere um código de 8 dígitos para o seu número.
            </span>
          </div>
          <button
            onClick={() => {
              setShowConfigModal(true);
              setConfigModalTab('qr');
            }}
            className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 transition-all cursor-pointer text-xs shadow-xs"
          >
            Abrir QR Code / Pareamento
          </button>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna da Lista de Contactos */}
        <div className="w-72 sm:w-84 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex flex-col shrink-0">
          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar contacto ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filtros */}
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

          {/* Lista de Contactos */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <Smartphone className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum contacto adicionado</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Adicione um contacto real com indicativo internacional para enviar mensagens diretamente pelo WhatsApp.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Contacto</span>
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
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {contact.isGroup ? <Users className="w-4 h-4 text-emerald-500" /> : contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">{contact.lastMessageTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        {contact.lastMessage}
                      </p>
                      
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

        {/* Coluna Central de Conversa */}
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
                      <span className="text-emerald-500 font-medium">
                        {isConnected ? 'WhatsApp Ativo' : 'Desconectado'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={handleNexaInstantSuggestion}
                    disabled={isGeneratingSuggestion}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Gera uma resposta com IA NEXA adaptada ao contexto"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>{isGeneratingSuggestion ? 'A gerar...' : 'Sugerir Resposta'}</span>
                  </button>

                  <button
                    onClick={() => onSummarizeThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Gera uma síntese executiva da conversa"
                  >
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>Resumir com NEXA</span>
                  </button>

                  <button
                    onClick={() => onExtractTasksFromThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Cria tarefas acionáveis no gestor de tarefas"
                  >
                    <ListPlus className="w-3 h-3 text-amber-500" />
                    <span>Extrair Tarefas</span>
                  </button>

                  <button
                    onClick={() => setShowCrmDrawer(!showCrmDrawer)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      showCrmDrawer
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 border-purple-500/20'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>CRM & Lead</span>
                  </button>

                  <button
                    onClick={handleExportChat}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Descarregar histórico da conversa em JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {onDeleteContact && (
                    <button
                      onClick={() => {
                        if (confirm(`Tem a certeza que deseja remover ${activeContact.name}?`)) {
                          onDeleteContact(activeContact.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remover contacto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                  {activeMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Início da conversa com {activeContact.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isConnected 
                          ? 'Envie uma mensagem abaixo para despachar diretamente pelo seu WhatsApp conectado.' 
                          : 'Conecte o seu WhatsApp no topo para enviar e receber mensagens reais.'}
                      </p>
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
                            {msg.isAiGenerated && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200 dark:text-emerald-400 mb-1 border-b border-emerald-600/40 pb-0.5">
                                <Bot className="w-3 h-3" />
                                <span>Resposta Automática NEXA</span>
                              </div>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            
                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-80">
                              <span>{msg.timestamp}</span>
                              {isUser && (
                                <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-cyan-300' : (msg.status === 'failed' ? 'text-rose-300' : 'text-emerald-200')}`} />
                              )}
                            </div>

                            {msg.reaction && (
                              <span className="absolute -bottom-2 -right-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.2 text-[10px] shadow-xs">
                                {msg.reaction}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleQuickReaction(msg.id, '✅')}
                              className="text-[10px] text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleQuickReaction(msg.id, '⏳')}
                              className="text-[10px] text-slate-400 hover:text-amber-500 p-0.5 cursor-pointer"
                            >
                              ⏳
                            </button>
                            <button
                              onClick={() => handleQuickReaction(msg.id, '👍')}
                              className="text-[10px] text-slate-400 hover:text-blue-500 p-0.5 cursor-pointer"
                            >
                              👍
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Painel CRM Lateral */}
                {showCrmDrawer && (
                  <div className="w-72 sm:w-80 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-y-auto p-4 space-y-4 shrink-0 transition-all">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Gestão de Negócio
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Perfil do Cliente & Lead</h4>
                      </div>
                      <button
                        onClick={() => setShowCrmDrawer(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nome / Organização:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{activeContact.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Telefone WhatsApp:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{activeContact.phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Fase do Funil:
                      </label>
                      <select
                        value={crmLeadStatus}
                        onChange={(e: any) => setCrmLeadStatus(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="novo">Novo Contacto / Prospeção</option>
                        <option value="em_negociacao">Em Negociação</option>
                        <option value="proposta">Proposta Enviada</option>
                        <option value="fechado">Negócio Fechado</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Valor Estimado:
                      </label>
                      <input
                        type="text"
                        value={crmDealValue}
                        onChange={(e) => setCrmDealValue(e.target.value)}
                        placeholder="Ex: 1.500.000 Kz"
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Delegação @nexa */}
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
                  placeholder={isConnected ? `Mensagem para ${activeContact.name} no WhatsApp...` : `Conecte o seu WhatsApp acima para enviar mensagens reais a ${activeContact.name}...`}
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
                  Conecte o seu WhatsApp pessoal via QR Code ou Código de Pareamento para despachar e receber mensagens de clientes com automações de IA do NEXA.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Contacto</span>
                </button>
                <button
                  onClick={() => {
                    setShowConfigModal(true);
                    setConfigModalTab('qr');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  <span>Conectar WhatsApp Pessoal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: CONEXÃO REAL DO WHATSAPP (QR CODE REAL E PAIRING CODE REAL) */}
      {/* ==================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Conectar WhatsApp Pessoal ao NEXA
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ponte direta de multi-aparelhos oficial (Baileys) ou Meta Cloud API
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

            {/* Abas */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl text-[11px] font-bold">
              <button
                onClick={() => setConfigModalTab('qr')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'qr'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => setConfigModalTab('pairing_code')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'pairing_code'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Código 8 Dígitos
              </button>
              <button
                onClick={() => setConfigModalTab('meta')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'meta'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Meta Cloud API
              </button>
              <button
                onClick={() => setConfigModalTab('ai')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  configModalTab === 'ai'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Auto-Resposta
              </button>
            </div>

            {/* ABA 1: QR CODE REAL */}
            {configModalTab === 'qr' && (
              <div className="space-y-4 text-center">
                {isConnected ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto font-black text-lg shadow-md">
                      ✓
                    </div>
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      WhatsApp Pessoal Conectado com Sucesso!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Número conectado: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{displayPhone}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      O NEXA agora pode receber mensagens enviadas para si e despachar mensagens reais pelo seu WhatsApp.
                    </p>
                    <button
                      onClick={handleDisconnectSession}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer"
                    >
                      Desconectar Aparelho
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block mx-auto shadow-inner">
                      {qrSession.qrCode ? (
                        <img 
                          src={qrSession.qrCode} 
                          alt="Código QR WhatsApp" 
                          className="w-48 h-48 rounded-xl object-contain mx-auto shadow-md bg-white p-2"
                        />
                      ) : (
                        <div className="w-48 h-48 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                          <span>A gerar código QR de conexão...</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 max-w-sm mx-auto text-left">
                      <p className="font-bold text-slate-900 dark:text-slate-200">
                        Como conectar o seu WhatsApp pessoal:
                      </p>
                      <p>1. Abra o WhatsApp no seu telemóvel.</p>
                      <p>2. Toque em <strong>Menu (Android)</strong> ou <strong>Definições (iPhone)</strong> &gt; <strong>Aparelhos Conectados</strong>.</p>
                      <p>3. Toque em <strong>Conectar um Aparelho</strong> e aponte a câmara para este código QR.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABA 2: CÓDIGO DE PAREAMENTO DE 8 DÍGITOS (SEM CÂMARA) */}
            {configModalTab === 'pairing_code' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    <span>Conectar com Número de Telefone (Sem câmara)</span>
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    O WhatsApp oficial permite emparelhar digitando um código de 8 dígitos no seu telemóvel.
                  </p>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      O seu número de WhatsApp (com indicativo internacional):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 244923000000 ou 351912345678 ou 5511999999999"
                      value={pairingPhoneInput}
                      onChange={(e) => setPairingPhoneInput(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Digite apenas os dígitos incluindo o país (ex: 244 para Angola, 351 para Portugal, 55 para Brasil).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={pairingLoading || !pairingPhoneInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {pairingLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A solicitar código ao WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Gerar Código de Pareamento</span>
                      </>
                    )}
                  </button>
                </form>

                {pairingError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pairingError}</span>
                  </div>
                )}

                {generatedPairingCode && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      Código de Pareamento de 8 Dígitos gerado:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-500/40 select-all">
                        {generatedPairingCode}
                      </span>
                      <button
                        onClick={() => handleCopyPairingCode(generatedPairingCode)}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                        title="Copiar código"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 text-left pt-2 space-y-1">
                      <p><strong>Passos no seu telemóvel:</strong></p>
                      <p>1. No WhatsApp, abra <strong>Aparelhos Conectados &gt; Conectar um Aparelho</strong>.</p>
                      <p>2. Toque em <strong>"Conectar com número de telefone"</strong> na parte inferior do ecrã.</p>
                      <p>3. Digite o código acima no telemóvel.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: META CLOUD API (OFICIAL EMPRESARIAL) */}
            {configModalTab === 'meta' && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Meta Cloud API Oficial (Graph API v21.0)
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Opcional para empresas com WhatsApp Business Account registada na Meta.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Meta Phone Number ID:
                  </label>
                  <input
                    type="text"
                    placeholder="Definido no .env (WA_META_PHONE_NUMBER_ID)"
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
                    placeholder="Definido no .env (WA_META_ACCESS_TOKEN)"
                    value={config.metaAccessToken || ''}
                    onChange={(e) => setConfig({ ...config, metaAccessToken: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    URL do Webhook Oficial:
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
              </div>
            )}

            {/* ABA 4: AUTO-RESPOSTA NEXA */}
            {configModalTab === 'ai' && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Atendimento Automático com IA</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Responde a clientes no WhatsApp através do motor Qwen 3.8 Max / Gemini.
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
                    Instrução de Personalidade para o WhatsApp:
                  </label>
                  <textarea
                    rows={3}
                    value={config.autoReplyPrompt}
                    onChange={(e) => setConfig({ ...config, autoReplyPrompt: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder="Instruções para o assistente responder aos clientes..."
                  />
                </div>
              </div>
            )}

            {/* Rodapé */}
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
                  showToast('Configurações salvas!');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
              >
                Guardar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADICIONAR CONTACTO REAL                                     */}
      {/* ==================================================================== */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
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
                  placeholder="Ex: Mateus da Silva"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número de Telefone WhatsApp (Com DDI Internacional): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+244 923 000 000 ou +351 912 345 678"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria:
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
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail (Opcional):
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas / Observações:
                </label>
                <textarea
                  rows={2}
                  placeholder="Contexto ou notas do cliente..."
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
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
                Guardar Contacto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
