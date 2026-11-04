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
import { NexaConnectorsSection } from './components/NexaConnectorsSection';
import { SupabaseAuthModal } from './components/SupabaseAuthModal';
import { 
  sendMessageToNexa, 
  streamMessageToNexa,
  checkServerHealth 
} from './services/api';
import { 
  supabase, 
  saveConversationToSupabase, 
  saveMessageToSupabase, 
  loadUserConversationsFromSupabase,
  loadUserTasksFromSupabase,
  saveTaskToSupabase,
  deleteTaskFromSupabase,
  loadUserWhatsAppContactsFromSupabase,
  saveWhatsAppContactToSupabase,
  deleteWhatsAppContactFromSupabase,
  loadWhatsAppMessagesForContactFromSupabase,
  saveWhatsAppMessageToSupabase
} from './services/supabase';
import { 
  sendWhatsAppMessageApi 
} from './services/whatsapp';
import { Check, Bot, Globe } from 'lucide-react';

/**
 * Helper para gerar títulos limpos e contextuais a partir da primeira mensagem (estilo ChatGPT)
 */
function generateConversationTitle(raw: string): string {
  const clean = raw.trim().replace(/^["']|["']$/g, '');
  if (!clean) return 'Nova Conversa';
  const sentence = clean.split(/[.!?\n]/)[0].trim();
  const capped = sentence.length > 34 ? sentence.slice(0, 34) + '...' : sentence;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

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

  // Aba ativa dentro do Workspace: 'chat', 'tasks', 'whatsapp' ou 'connectors'
  const [currentTab, setCurrentTab] = useState<'chat' | 'tasks' | 'whatsapp' | 'connectors'>('chat');
  
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
  // Sincroniza conversas, tarefas e WhatsApp do Supabase quando o utilizador se autentica
  useEffect(() => {
    if (currentUser?.id) {
      // 1. Carrega conversas do utilizador
      loadUserConversationsFromSupabase(currentUser.id).then(cloudConvs => {
        if (cloudConvs && cloudConvs.length > 0) {
          setConversations(cloudConvs);
          setActiveConversationId(cloudConvs[0].id);
        }
      });

      // 2. Carrega tarefas reais do utilizador
      loadUserTasksFromSupabase(currentUser.id).then(cloudTasks => {
        if (cloudTasks) {
          setTasks(cloudTasks);
        }
      });

      // 3. Carrega contactos reais e histórico de WhatsApp do utilizador
      loadUserWhatsAppContactsFromSupabase(currentUser.id).then(async cloudContacts => {
        if (cloudContacts) {
          setWhatsappContacts(cloudContacts);
          const msgsMap: Record<string, WhatsAppMessage[]> = {};
          for (const c of cloudContacts) {
            const msgs = await loadWhatsAppMessagesForContactFromSupabase(c.id, currentUser.id);
            if (msgs) {
              msgsMap[c.id] = msgs;
            }
          }
          setWhatsappMessages(msgsMap);
        }
      });
    } else {
      // Quando não autenticado, não exibe dados de terceiros
      setTasks([]);
      setWhatsappContacts([]);
      setWhatsappMessages({});
    }
  }, [currentUser?.id]);

  // Conversa ativa selecionada
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  // ============================================================================
  // PROCESSAMENTO DE MENSAGENS COM O NEXA (ESTILO CHATGPT / ZAPIA)
  // ============================================================================
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    // Se não existir conversa ativa, cria uma nova
    let targetConv = activeConversation;
    if (!targetConv) {
      const newId = `conv-${Date.now()}`;
      targetConv = {
        id: newId,
        title: generateConversationTitle(text),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        systemPrompt: settings.systemPrompt,
        messages: []
      };
      setActiveConversationId(newId);
    }

    // 1. Cria a mensagem do utilizador
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...targetConv.messages, userMessage];

    // Calcula título dinâmico para o histórico (como o ChatGPT):
    // Se for a primeira mensagem enviada pelo utilizador ou título inicial/genérico
    const userMessageCount = targetConv.messages.filter(m => m.role === 'user').length;
    let newTitle = targetConv.title;
    if (
      userMessageCount === 0 || 
      targetConv.title === 'Nova Conversa' || 
      targetConv.title.startsWith('Conversa ') ||
      targetConv.title === 'Alinhamento Estratégico NEXA'
    ) {
      newTitle = generateConversationTitle(text);
    }

    // Cria o marcador da resposta do assistente NEXA (começa vazio e preenche via stream)
    const assistantMessageId = `msg-nexa-${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      reactions: ['✨', '🤖']
    };

    const targetConvId = targetConv.id;
    const conversationWithAssistant: Conversation = {
      ...targetConv,
      title: newTitle,
      messages: [...updatedMessages, initialAssistantMessage],
      updatedAt: new Date().toISOString()
    };

    // Mover a conversa atualizada para o TOPO da lista no histórico
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== targetConvId);
      return [conversationWithAssistant, ...remaining];
    });

    // Guardar no Supabase se utilizador estiver autenticado
    if (currentUser?.id) {
      saveConversationToSupabase(conversationWithAssistant, currentUser.id);
      saveMessageToSupabase(userMessage, targetConvId, currentUser.id);
    }

    setIsThinking(true);
    let streamedFullText = '';

    try {
      await streamMessageToNexa(
        updatedMessages,
        settings.systemPrompt,
        {
          onChunk: (chunk: string) => {
            streamedFullText += chunk;
            setConversations(prev => prev.map(c => {
              if (c.id !== targetConvId) return c;
              return {
                ...c,
                title: newTitle,
                updatedAt: new Date().toISOString(),
                messages: c.messages.map(m => 
                  m.id === assistantMessageId ? { ...m, content: streamedFullText } : m
                )
              };
            }));
          },
          onDone: (finalText: string) => {
            setIsThinking(false);
            const completedMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: finalText || streamedFullText,
              timestamp: new Date().toISOString(),
              reactions: ['✨', '🤖']
            };

            // Salvar mensagem completa do assistente no Supabase
            if (currentUser?.id) {
              saveMessageToSupabase(completedMessage, targetConvId, currentUser.id);
            }
          },
          onError: (err: any) => {
            console.error('Falha no streaming do assistente:', err);
            setIsThinking(false);
            setConversations(prev => prev.map(c => {
              if (c.id !== targetConvId) return c;
              return {
                ...c,
                messages: c.messages.map(m => 
                  m.id === assistantMessageId ? {
                    ...m,
                    content: 'Ocorreu um erro temporário na ligação ao motor Qwen. Por favor tenta enviar novamente.'
                  } : m
                )
              };
            }));
          }
        },
        settings.modelName
      );
    } catch (streamErr) {
      console.error('Erro na execução do stream:', streamErr);
      setIsThinking(false);
    }
  };

  // ============================================================================
  // GESTÃO DE CONVERSAS (HISTÓRICO ESTILO CHATGPT)
  // ============================================================================
  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      systemPrompt: settings.systemPrompt,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Olá! Sou o **NEXA**, assistente pessoal de elite da **Maurícius**.\n\nComo posso ser útil hoje? Experimenta enviar uma pergunta, organizar tarefas ou preparar uma mensagem para o WhatsApp.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Adiciona ao topo da lista de conversas
    setConversations(prev => [newConv, ...prev.filter(c => c.id !== newId)]);
    setActiveConversationId(newId);
    setCurrentTab('chat');
    showToast('Nova conversa pronta');
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
    if (currentUser?.id) {
      saveTaskToSupabase(newTask, currentUser.id);
    }
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
    if (currentUser?.id) {
      saveTaskToSupabase(newTask, currentUser.id);
    }
    showToast('Nova tarefa criada');
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: Task = {
            ...t,
            status,
            completedAt: status === 'concluida' ? new Date().toISOString() : undefined
          };
          if (currentUser?.id) {
            saveTaskToSupabase(updated, currentUser.id);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (currentUser?.id) {
      deleteTaskFromSupabase(id, currentUser.id);
    }
  };

  const handleAskNexaForTasks = () => {
    setCurrentTab('chat');
    handleSendMessage('NEXA, atua como meu gestor de produtividade na Maurícius e sugere um plano estruturado de 3 tarefas cruciais para hoje.');
  };

  // Operações do WhatsApp Hub (Mercado Real & NEXA Multicanal)
  const handleSendWhatsAppMessage = async (contactId: string, text: string) => {
    const contact = whatsappContacts.find(c => c.id === contactId);
    const newMsgId = `wam-${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: WhatsAppMessage = {
      id: newMsgId,
      contactId,
      sender: 'user',
      text,
      timestamp: timeNow,
      status: 'sending'
    };

    // Atualização otimista imediata na interface
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

    // Persistência na base de dados Supabase
    if (currentUser?.id) {
      saveWhatsAppMessageToSupabase(newMsg, contactId, currentUser.id);
      if (contact) {
        saveWhatsAppContactToSupabase({
          ...contact,
          lastMessage: text,
          lastMessageTime: 'Agora'
        }, currentUser.id);
      }
    }

    // Despacho real pelo backend Express (/api/whatsapp/send)
    try {
      const sendResult = await sendWhatsAppMessageApi(
        contact?.phone || '+244 923 000 000',
        contact?.name || 'Cliente',
        text
      );

      // Atualiza o estado da mensagem para entregue
      setWhatsappMessages(prev => ({
        ...prev,
        [contactId]: (prev[contactId] || []).map(m =>
          m.id === newMsgId ? { ...m, status: sendResult.status } : m
        )
      }));
    } catch (err) {
      console.warn('Aviso no envio WhatsApp:', err);
    }
  };

  // Adicionar novo contacto real (Angola, Portugal, Brasil, etc.)
  const handleAddWhatsAppContact = (newContact: WhatsAppContact) => {
    setWhatsappContacts(prev => [newContact, ...prev]);
    setWhatsappMessages(prev => ({
      ...prev,
      [newContact.id]: []
    }));
    if (currentUser?.id) {
      saveWhatsAppContactToSupabase(newContact, currentUser.id);
    }
    showToast(`Contacto ${newContact.name} adicionado com sucesso!`);
  };

  // Remover contacto
  const handleDeleteWhatsAppContact = (contactId: string) => {
    setWhatsappContacts(prev => prev.filter(c => c.id !== contactId));
    setWhatsappMessages(prev => {
      const copy = { ...prev };
      delete copy[contactId];
      return copy;
    });
    if (currentUser?.id) {
      deleteWhatsAppContactFromSupabase(contactId, currentUser.id);
    }
    showToast('Contacto removido.');
  };

  // Receber mensagem de cliente (Simulação ou Webhook real)
  const handleReceiveIncomingWhatsAppMessage = (
    fromPhone: string,
    fromName: string,
    text: string,
    aiReply?: string
  ) => {
    // Verificar se já existe contacto com este telefone
    let contact = whatsappContacts.find(c => c.phone.replace(/\D/g, '') === fromPhone.replace(/\D/g, ''));
    let contactId = contact?.id;

    if (!contact) {
      contactId = `wa-client-${Date.now()}`;
      const newContact: WhatsAppContact = {
        id: contactId,
        name: fromName,
        phone: fromPhone,
        unreadCount: 1,
        lastMessage: text,
        lastMessageTime: 'Agora',
        tags: ['Cliente', 'Entrada Webhook'],
        status: 'online'
      };
      setWhatsappContacts(prev => [newContact, ...prev]);
      contact = newContact;
    } else {
      setWhatsappContacts(prev =>
        prev.map(c =>
          c.id === contactId
            ? {
                ...c,
                lastMessage: aiReply || text,
                lastMessageTime: 'Agora',
                unreadCount: c.unreadCount + 1
              }
            : c
        )
      );
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mensagem recebida do cliente
    const incomingMsg: WhatsAppMessage = {
      id: `wam-in-${Date.now()}`,
      contactId: contactId!,
      sender: 'contact',
      text,
      timestamp: timeNow,
      status: 'read'
    };

    const newMessages = [incomingMsg];

    // Se a IA NEXA gerou uma auto-resposta
    if (aiReply) {
      const aiMsg: WhatsAppMessage = {
        id: `wam-ai-${Date.now() + 1}`,
        contactId: contactId!,
        sender: 'user',
        text: aiReply,
        timestamp: timeNow,
        status: 'delivered',
        isAiGenerated: true
      };
      newMessages.push(aiMsg);
    }

    setWhatsappMessages(prev => ({
      ...prev,
      [contactId!]: [...(prev[contactId!] || []), ...newMessages]
    }));

    // Persiste mensagens e contacto no Supabase
    if (currentUser?.id && contactId) {
      if (contact) {
        saveWhatsAppContactToSupabase(contact, currentUser.id);
      }
      for (const msg of newMessages) {
        saveWhatsAppMessageToSupabase(msg, contactId, currentUser.id);
      }
    }

    showToast(aiReply ? 'Nova mensagem respondida pelo NEXA!' : 'Nova mensagem recebida no WhatsApp');
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
            onNewConversation={handleNewConversation}
            onAddTaskDirectly={handleAddTask}
            onSendWhatsAppDirectly={handleSendWhatsAppMessage}
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
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
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
            onAddContact={handleAddWhatsAppContact}
            onDeleteContact={handleDeleteWhatsAppContact}
            onReceiveIncomingMessage={handleReceiveIncomingWhatsAppMessage}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentTab === 'connectors' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
              <NexaConnectorsSection
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
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
