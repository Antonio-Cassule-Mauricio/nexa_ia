/**
 * ============================================================================
 * COMPONENTE RAIZ (APP) — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Startup: Maurícius (Soluções Digitais, Automação e IA)
 * Fundador: António Cassule Maurício
 * 
 * Este componente orquestra:
 * 1. A navegação entre as 3 visualizações da plataforma:
 *    - 'mauricius': Landing Page Corporativa da startup Maurícius.
 *    - 'nexa': Site dedicado ao assistente NEXA no estilo Zapia.com.
 *    - 'workspace': Aplicação web de chat, gestão de tarefas e WhatsApp Hub.
 * 2. Autenticação e sincronização de sessão via Supabase (Google e E-mail).
 * 3. Persistência local de conversas, tarefas e contactos WhatsApp.
 * 4. Comunicação assíncrona com o endpoint /api/chat (Qwen 3.8 Max).
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  Conversation, 
  Task, 
  WhatsAppContact, 
  WhatsAppMessage, 
  AppSettings, 
  Message,
  TaskStatus 
} from './types';
import { 
  INITIAL_CONVERSATION, 
  INITIAL_TASKS, 
  INITIAL_WHATSAPP_CONTACTS, 
  INITIAL_WHATSAPP_MESSAGES, 
  INITIAL_SETTINGS
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { TasksView } from './components/TasksView';
import { WhatsAppHubView } from './components/WhatsAppHubView';
import { SettingsModal } from './components/SettingsModal';
import { MauriciusLandingPage } from './components/MauriciusLandingPage';
import { NexaLandingPage } from './components/NexaLandingPage';
import { SupabaseAuthModal } from './components/SupabaseAuthModal';
import { sendMessageToNexa, checkServerHealth } from './services/api';
import { supabase } from './services/supabase';
import { Check, Bot, Globe } from 'lucide-react';

export const App: React.FC = () => {
  // Estado de navegação principal da aplicação:
  // - 'mauricius': Site corporativo da startup
  // - 'nexa': Site estilo zapia.com dedicado ao produto
  // - 'workspace': Aplicação Web de Chat com IA
  const [viewMode, setViewMode] = useState<'mauricius' | 'nexa' | 'workspace'>(() => {
    if (window.location.pathname.includes('/nexa')) return 'nexa';
    if (window.location.pathname.includes('/workspace') || window.location.pathname.includes('/chat')) return 'workspace';
    return 'mauricius';
  });

  // Estado do utilizador autenticado no Supabase
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Lista de conversas com histórico (persistência no LocalStorage)
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('nexa_conversations');
    return saved ? JSON.parse(saved) : [INITIAL_CONVERSATION];
  });

  // ID da conversa ativa no chat
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || 'conv-1';
  });

  // Lista de tarefas e afazeres
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nexa_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Contactos simulados do WhatsApp
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>(() => {
    const saved = localStorage.getItem('nexa_wa_contacts');
    return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_CONTACTS;
  });

  // Mensagens simuladas do WhatsApp organizadas por contacto
  const [whatsappMessages, setWhatsappMessages] = useState<Record<string, WhatsAppMessage[]>>(() => {
    const saved = localStorage.getItem('nexa_wa_messages');
    return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_MESSAGES;
  });

  // Configurações do assistente (modelo, tom, temperatura, system prompt)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('nexa_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Aba ativa dentro do Workspace: 'chat', 'tasks' ou 'whatsapp'
  const [currentTab, setCurrentTab] = useState<'chat' | 'tasks' | 'whatsapp'>('chat');
  
  // Indicador de digitação e raciocínio do NEXA ("NEXA está a pensar...")
  const [isThinking, setIsThinking] = useState(false);
  
  // Controlo da barra lateral móvel e do modal de definições
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Diagnóstico do servidor backend
  const [serverStatus, setServerStatus] = useState<{ status: string; engine: string }>({
    status: 'online',
    engine: 'Qwen 3.8 Max'
  });

  // ============================================================================
  // EFEITOS DE PERSISTÊNCIA E SINCRONIZAÇÃO
  // ============================================================================

  // Verifica a sessão atual no Supabase e escuta alterações de login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Guarda conversas no LocalStorage a cada alteração
  useEffect(() => {
    localStorage.setItem('nexa_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Guarda tarefas no LocalStorage a cada alteração
  useEffect(() => {
    localStorage.setItem('nexa_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Guarda contactos do WhatsApp no LocalStorage
  useEffect(() => {
    localStorage.setItem('nexa_wa_contacts', JSON.stringify(whatsappContacts));
  }, [whatsappContacts]);

  // Guarda mensagens do WhatsApp no LocalStorage
  useEffect(() => {
    localStorage.setItem('nexa_wa_messages', JSON.stringify(whatsappMessages));
  }, [whatsappMessages]);

  // Guarda configurações no LocalStorage
  useEffect(() => {
    localStorage.setItem('nexa_settings', JSON.stringify(settings));
  }, [settings]);

  // Verifica o estado operacional do backend
  useEffect(() => {
    checkServerHealth().then(data => {
      setServerStatus({
        status: data.status || 'online',
        engine: data.engine || 'Qwen 3.8 Max'
      });
    });
  }, []);

  // Exibe notificação temporária no ecrã
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Conversa ativa selecionada
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  // ============================================================================
  // PROCESSAMENTO DE MENSAGENS COM O NEXA
  // ============================================================================
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking || !activeConversation) return;

    // 1. Cria a mensagem do utilizador
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...activeConversation.messages, userMessage];

    // Atualiza o título da conversa se for a primeira mensagem
    let newTitle = activeConversation.title;
    if (activeConversation.messages.length <= 1) {
      newTitle = text.slice(0, 32) + (text.length > 32 ? '...' : '');
    }

    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversation.id
          ? { ...c, title: newTitle, messages: updatedMessages, updatedAt: new Date().toISOString() }
          : c
      )
    );

    setIsThinking(true);

    try {
      // 2. Envia para o backend (Qwen 3.8 Max)
      const response = await sendMessageToNexa(
        updatedMessages,
        settings.systemPrompt,
        settings.modelName
      );

      // 3. Adiciona a resposta do assistente ao feed
      const assistantMessage: Message = {
        id: `msg-nexa-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        reactions: ['✨', '🤖']
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversation.id
            ? { ...c, messages: [...updatedMessages, assistantMessage], updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Falha na resposta do assistente:', err);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'Ocorreu um erro ao processar a resposta com o motor Qwen. Por favor, tenta novamente.',
        timestamp: new Date().toISOString()
      };
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversation.id
            ? { ...c, messages: [...updatedMessages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  // ============================================================================
  // GESTÃO DE CONVERSAS (HISTÓRICO)
  // ============================================================================
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: `Conversa ${conversations.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      systemPrompt: settings.systemPrompt,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          role: 'assistant',
          content: 'Olá! Sou o NEXA, assistente pessoal de elite da Maurícius. Como posso ser útil hoje?',
          timestamp: new Date().toISOString()
        }
      ]
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentTab('chat');
  };

  const handleDeleteConversation = (id: string) => {
    if (conversations.length <= 1) return;
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (activeConversationId === id) {
      setActiveConversationId(remaining[0].id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleClearHistory = () => {
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: 'Histórico reiniciado. Em que posso ajudar agora?',
                  timestamp: new Date().toISOString()
                }
              ]
            }
          : c
      )
    );
    showToast('Histórico limpo');
  };

  // Ferramentas de resumo e extração de tarefas
  const handleSummarizeChat = () => {
    handleSendMessage('NEXA, resume os pontos mais importantes, decisões e conclusões da nossa conversa de forma clara e estruturada para a Maurícius.');
  };

  const handleExtractTasksFromChat = () => {
    handleSendMessage('NEXA, analisa toda a conversa e extrai uma lista detalhada de tarefas acionáveis com prioridades (Alta, Média, Baixa) que devo executar.');
  };

  const handleCreateTaskFromText = (text: string) => {
    const firstLine = text.split('\n')[0].replace(/^[#*-\s]+/, '').slice(0, 50);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: firstLine || 'Nova tarefa sugerida pelo NEXA',
      description: text.slice(0, 160),
      priority: 'media',
      status: 'pendente',
      dueDate: 'Hoje',
      createdAt: new Date().toISOString(),
      conversationId: activeConversationId
    };

    setTasks(prev => [newTask, ...prev]);
    showToast('Tarefa adicionada à Gestão de Tarefas!');
  };

  // Operações de tarefas
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    showToast('Nova tarefa criada');
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'concluida' ? new Date().toISOString() : undefined
            }
          : t
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAskNexaForTasks = () => {
    setCurrentTab('chat');
    handleSendMessage('NEXA, atua como meu gestor de produtividade na Maurícius e sugere um plano estruturado de 3 tarefas cruciais para hoje.');
  };

  // Operações do WhatsApp Hub
  const handleSendWhatsAppMessage = (contactId: string, text: string) => {
    const newMsg: WhatsAppMessage = {
      id: `wam-${Date.now()}`,
      contactId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWhatsappMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    setWhatsappContacts(prev =>
      prev.map(c =>
        c.id === contactId
          ? { ...c, lastMessage: text, lastMessageTime: 'Agora' }
          : c
      )
    );
  };

  const handleAddWhatsAppReaction = (contactId: string, messageId: string, emoji: string) => {
    setWhatsappMessages(prev => ({
      ...prev,
      [contactId]: (prev[contactId] || []).map(m =>
        m.id === messageId ? { ...m, reaction: emoji } : m
      )
    }));
    showToast(`Reação ${emoji} adicionada!`);
  };

  const handleSummarizeThreadWithNexa = (contactName: string, threadMessages: WhatsAppMessage[]) => {
    const threadTranscript = threadMessages
      .map(m => `${m.sender === 'user' ? 'Tu' : contactName}: ${m.text}`)
      .join('\n');

    handleNewConversation();
    setTimeout(() => {
      handleSendMessage(
        `NEXA, resume a seguinte conversa do WhatsApp com "${contactName}" e destaca decisões e prazos:\n\n${threadTranscript}`
      );
    }, 100);
  };

  const handleExtractTasksFromThreadWithNexa = (contactName: string, threadMessages: WhatsAppMessage[]) => {
    const threadTranscript = threadMessages
      .map(m => `${m.sender === 'user' ? 'Tu' : contactName}: ${m.text}`)
      .join('\n');

    handleNewConversation();
    setTimeout(() => {
      handleSendMessage(
        `NEXA, analisa as mensagens do WhatsApp com "${contactName}" e extrai todas as tarefas pendentes para adicionarmos à gestão de tarefas:\n\n${threadTranscript}`
      );
    }, 100);
  };

  const handleSuggestReplyWithNexa = (contactName: string, lastMessage: string) => {
    handleNewConversation();
    setTimeout(() => {
      handleSendMessage(
        `NEXA, ajuda-me a redigir uma resposta profissional e eficiente para o WhatsApp para "${contactName}", que acabou de me enviar:\n\n"${lastMessage}"`
      );
    }, 100);
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setConversations([INITIAL_CONVERSATION]);
    setActiveConversationId('conv-1');
    setTasks(INITIAL_TASKS);
    setWhatsappContacts(INITIAL_WHATSAPP_CONTACTS);
    setWhatsappMessages(INITIAL_WHATSAPP_MESSAGES);
    setSettings(INITIAL_SETTINGS);
    setIsSettingsOpen(false);
    showToast('Dados repostos com sucesso!');
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'concluida').length;
  const unreadWhatsAppCount = whatsappContacts.reduce((acc, c) => acc + c.unreadCount, 0);

  // ============================================================================
  // RENDERIZAÇÃO CONDICIONAL POR PÁGINA
  // ============================================================================

  // VISUALIZAÇÃO 1: Site Corporativo da Maurícius
  if (viewMode === 'mauricius') {
    return (
      <div className="relative">
        <MauriciusLandingPage
          onGoToNexaSite={() => setViewMode('nexa')}
          onGoToWorkspace={() => setViewMode('workspace')}
        />
        
        {/* Botão flutuante para ir rapidamente ao site do NEXA */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setViewMode('nexa')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xl transition-all hover:scale-105 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Site do NEXA (Zapia)</span>
          </button>
        </div>
      </div>
    );
  }

  // VISUALIZAÇÃO 2: Site Oficial do NEXA (estilo zapia.com)
  if (viewMode === 'nexa') {
    return (
      <div className="relative">
        <NexaLandingPage
          onGoToWorkspace={() => setViewMode('workspace')}
          onGoToMauricius={() => setViewMode('mauricius')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
        />

        {/* Modal de Autenticação Supabase (Google e E-mail) */}
        <SupabaseAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
        />
      </div>
    );
  }

  // VISUALIZAÇÃO 3: Workspace Web do NEXA (Interface de Chat estilo Zapia/ChatGPT)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Notificações flutuantes */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra lateral de navegação */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        pendingTasksCount={pendingTasksCount}
        unreadWhatsAppCount={unreadWhatsAppCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        serverStatus={serverStatus}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onGoToMauricius={() => setViewMode('mauricius')}
        onGoToNexaSite={() => setViewMode('nexa')}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Área de conteúdo principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'chat' && (
          <ChatView
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
            isThinking={isThinking}
            onClearHistory={handleClearHistory}
            onExtractTasksFromChat={handleExtractTasksFromChat}
            onSummarizeChat={handleSummarizeChat}
            onCreateTaskFromText={handleCreateTaskFromText}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            activeModelName={serverStatus.engine}
            onGoToNexaSite={() => setViewMode('nexa')}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onAskNexaForTasks={handleAskNexaForTasks}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        )}

        {currentTab === 'whatsapp' && (
          <WhatsAppHubView
            contacts={whatsappContacts}
            messages={whatsappMessages}
            onSendMessage={handleSendWhatsAppMessage}
            onAddReaction={handleAddWhatsAppReaction}
            onSummarizeThreadWithNexa={handleSummarizeThreadWithNexa}
            onExtractTasksFromThreadWithNexa={handleExtractTasksFromThreadWithNexa}
            onSuggestReplyWithNexa={handleSuggestReplyWithNexa}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        )}
      </main>

      {/* Modal de configurações e prompt de sistema */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        serverStatus={serverStatus}
        onResetAllData={handleResetAllData}
      />

      {/* Modal de autenticação Supabase */}
      <SupabaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
};
