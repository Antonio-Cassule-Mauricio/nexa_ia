import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  ListPlus, 
  Menu, 
  FileText,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  Plus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  Calendar,
  Mail,
  CheckCircle2,
  Clock,
  Radio,
  FileCheck,
  Zap,
  Play,
  Square
} from 'lucide-react';
import { Conversation, TaskPriority } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTheme } from '../context/ThemeContext';

interface ChatViewProps {
  conversation: Conversation;
  onSendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
  onClearHistory: () => void;
  onExtractTasksFromChat: () => void;
  onSummarizeChat: () => void;
  onCreateTaskFromText: (text: string) => void;
  onToggleMobileSidebar: () => void;
  activeModelName: string;
  onGoToNexaSite: () => void;
  onNewConversation: () => void;
  onAddTaskDirectly?: (task: { title: string; priority: TaskPriority; dueDate: string; description?: string }) => void;
  onSendWhatsAppDirectly?: (phone: string, text: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: '📋',
    title: 'Organizar Tarefas do Dia',
    desc: 'Cria uma rotina organizada e define prioridades para hoje',
    prompt: 'Olá NEXA, ajuda-me a organizar o meu dia de trabalho na Maurícius. Tenho várias pendências e preciso de uma lista estruturada de tarefas com prioridades alta, média e baixa.'
  },
  {
    icon: '📅',
    title: 'Marcar no Calendário',
    desc: 'Agenda reunião executiva ou compromisso com cliente',
    prompt: 'NEXA, no calendário cria um evento: Reunião Executiva de Alinhamento com a equipa da Maurícius na próxima quinta-feira às 15:00.'
  },
  {
    icon: '✉️',
    title: 'E-mail para Candidatura / Proposta',
    desc: 'Redige e prepara o envio de e-mail formal com anexo',
    prompt: 'NEXA, prepara um e-mail formal de candidatura e proposta de serviços de IA da Maurícius para enviar com o anexo do nosso portfólio executivo.'
  },
  {
    icon: '🗺️',
    title: 'Planeamento de Viagem & Atividades',
    desc: 'Estrutura itinerário, custos e plano de ação',
    prompt: 'NEXA, atua como meu gestor de viagens e planeia um itinerário de negócios de 3 dias para Luanda e Lisboa, com reuniões matinais e lista de atividades prioritárias.'
  }
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  isThinking,
  onClearHistory,
  onExtractTasksFromChat,
  onSummarizeChat,
  onCreateTaskFromText,
  onToggleMobileSidebar,
  activeModelName,
  onGoToNexaSite,
  onNewConversation,
  onAddTaskDirectly,
  onSendWhatsAppDirectly
}) => {
  const { theme, toggleTheme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Áudio & Reconhecimento de Voz (Speech-to-Text)
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Síntese de Voz (Text-to-Speech / Ouvir o NEXA)
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Anexo de Ficheiros (CV, Documentos, Áudio)
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inovação Startup: Briefing Executivo em Áudio Diário
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingPlaying, setBriefingPlaying] = useState(false);

  // Notificação toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ==========================================================================
  // CONFIGURAÇÃO DE RECONHECIMENTO DE VOZ (SPEECH-TO-TEXT)
  // ==========================================================================
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-PT';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Erro de reconhecimento de voz:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!speechRecognitionSupported) {
      showToast('Reconhecimento de voz em tempo real não suportado neste navegador.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      showToast('Gravação concluída.');
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        showToast('🎙️ A ouvir voz... Fala agora em português.');
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento:', e);
      }
    }
  };

  // ==========================================================================
  // SÍNTESE DE VOZ (TEXT-TO-SPEECH / OUVIR O NEXA)
  // ==========================================================================
  const speakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Síntese de voz não suportada pelo navegador.');
      return;
    }

    // Se já estiver a falar esta mensagem, parar
    if (currentlySpeakingId === id) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Remove markdown e tags para leitura fluida
    const cleanText = text
      .replace(/[*_#`[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-PT';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Tenta encontrar uma voz portuguesa nativa
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.startsWith('pt-PT') || v.lang.startsWith('pt-BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setCurrentlySpeakingId(id);
    };

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAllSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
    setBriefingPlaying(false);
  };

  // ==========================================================================
  // INOVAÇÃO STARTUP: BRIEFING EXECUTIVO EM ÁUDIO DIÁRIO (PODCAST DIÁRIO)
  // ==========================================================================
  const handleGenerateAudioBriefing = async () => {
    setIsBriefingLoading(true);
    stopAllSpeech();

    const briefingPrompt = 
      'NEXA, gera o Briefing Executivo do Dia da Maurícius. ' +
      'Sintetiza num parágrafo conciso e dinâmico de 3 frases: o status das operações, as reuniões agendadas no calendário e as tarefas prioritárias de hoje. ' +
      'Fala diretamente para o fundador António Cassule Maurício em tom executivo de rádio/podcast.';

    try {
      await onSendMessage(briefingPrompt);
      showToast('🎙️ Briefing Executivo gerado com sucesso!');
      setBriefingPlaying(true);
    } catch (e) {
      showToast('Erro ao sintetizar briefing executivo.');
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // ==========================================================================
  // ANEXO DE FICHEIROS E DOCUMENTOS
  // ==========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      setAttachedFile({
        name: file.name,
        size: sizeStr,
        type: file.type || 'document'
      });
      showToast(`Documento "${file.name}" anexado com sucesso!`);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Scroll automático
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isThinking]);

  // Submissão do formulário
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let textToSend = inputText.trim();
    if (!textToSend && !attachedFile) return;
    if (isThinking) return;

    if (attachedFile) {
      textToSend = `[Documento Anexado: ${attachedFile.name} (${attachedFile.size})]\n\n${textToSend || 'Por favor analisa este documento para a tarefa.'}`;
    }

    setInputText('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await onSendMessage(textToSend);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStarterClick = (prompt: string) => {
    setInputText(prompt);
    inputRef.current?.focus();
  };

  // Execução de ação sugerida no chat
  const handleExecuteCalendarAction = (title: string, date: string) => {
    if (onAddTaskDirectly) {
      onAddTaskDirectly({
        title: `[Calendário] ${title}`,
        priority: 'alta',
        dueDate: date || 'Amanhã',
        description: 'Agendamento estruturado pelo NEXA Assistant'
      });
    }

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent('Compromisso estruturado pelo NEXA Assistant - Maurícius')}`;
    const a = document.createElement('a');
    a.href = gCalUrl;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
    showToast(`Evento "${title}" aberto no Google Calendar e registado nas Tarefas!`);
  };

  const handleExecuteEmailAction = (recipient: string, subject: string) => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Olá,\n\nSegue a minuta de comunicação executiva conforme estruturada com o assistente NEXA da Maurícius.\n\nCom os melhores cumprimentos,\nAntónio Cassule Maurício')}`;
    const a = document.createElement('a');
    a.href = mailtoUrl;
    a.click();
    showToast(`Cliente de e-mail aberto com a minuta pronta para ${recipient}!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      
      {/* Toast flutuante */}
      {toastMsg && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {conversation.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                {activeModelName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              NEXA Online • Contexto Ativo • Anti-Alucinação Rigorosa
            </p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-1.5">
          {/* Inovação Startup: Briefing Executivo em Áudio */}
          <button
            onClick={handleGenerateAudioBriefing}
            disabled={isBriefingLoading || isThinking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
            title="Sintetiza e fala o resumo do dia executivo da Maurícius em áudio"
          >
            <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">Briefing Diário em Áudio</span>
            <span className="sm:hidden">Briefing</span>
          </button>

          <button
            onClick={onNewConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
            title="Iniciar uma nova conversa vazia"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Conversa</span>
          </button>

          <button
            onClick={onSummarizeChat}
            disabled={isThinking || conversation.messages.length < 2}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-slate-700/60 shadow-xs"
            title="Resumir conversa"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Resumir</span>
          </button>

          <button
            onClick={onExtractTasksFromChat}
            disabled={isThinking || conversation.messages.length < 2}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-slate-700/60 shadow-xs"
            title="Extrair tarefas"
          >
            <ListPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Extrair Tarefas</span>
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Limpar histórico da conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.messages.map((message) => {
            const isUser = message.role === 'user';
            const isSpeaking = currentlySpeakingId === message.id;

            return (
              <div
                key={message.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 text-white mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3.5 text-sm transition-all shadow-xs ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                  } ${isSpeaking ? 'ring-2 ring-amber-500/80' : ''}`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  ) : (
                    <div>
                      {message.content ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          A processar resposta executiva com Qwen 3.8 Max...
                        </span>
                      )}
                      
                      {/* Cursor de digitação em streaming estilo ChatGPT */}
                      {isThinking && !isUser && message.content && (
                        <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle rounded-xs" />
                      )}

                      {/* CARTÃO INTERATIVO DE AÇÃO EXECUTIVA (QUANDO DETETADO CALENDÁRIO / E-MAIL / TAREFA) */}
                      {!isThinking && message.content && (
                        <>
                          {message.content.toLowerCase().includes('calendário') && (
                            <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                <div>
                                  <p className="font-bold">Ação Detectada: Google Calendar</p>
                                  <p className="text-[11px] opacity-80">Pronto para sincronizar evento com a agenda executiva.</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleExecuteCalendarAction('Reunião Alinhada pelo NEXA', 'Quinta-feira 15:00')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                              >
                                Agendar no Calendário
                              </button>
                            </div>
                          )}

                          {message.content.toLowerCase().includes('e-mail') && (
                            <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-purple-500 shrink-0" />
                                <div>
                                  <p className="font-bold">Ação Detectada: Envio de E-mail / Candidatura</p>
                                  <p className="text-[11px] opacity-80">Minuta executiva preparada com opção de anexo.</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleExecuteEmailAction('candidaturas@empresa.com', 'Candidatura e Portfólio Maurícius')}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                              >
                                Despachar E-mail
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Assistant Actions Bar: TTS (Ouvir Áudio), Copiar, Salvar Tarefa */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {message.reactions?.map((emoji, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {emoji}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {/* Botão de Ouvir Áudio (Text-to-Speech) */}
                        <button
                          onClick={() => speakText(message.id, message.content)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSpeaking 
                              ? 'bg-amber-500 text-black font-bold animate-pulse' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isSpeaking ? "Parar leitura de voz" : "Ouvir esta mensagem em áudio"}
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => copyToClipboard(message.id, message.content)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title="Copiar mensagem"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onCreateTaskFromText(message.content)}
                          className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-500 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Guardar como tarefa"
                        >
                          <ListPlus className="w-3 h-3" />
                          <span>Guardar Tarefa</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking State */}
          {isThinking && (conversation.messages.length === 0 || conversation.messages[conversation.messages.length - 1]?.role === 'user') && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 text-white animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">NEXA está a raciocinar sem alucinações (Qwen 3.8 Max)...</span>
              </div>
            </div>
          )}

          {/* Starter suggestions */}
          {conversation.messages.length <= 1 && !isThinking && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                Ações Executivas & Multicanais Rápidas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_PROMPTS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(item.prompt)}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{item.icon}</span>
                        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Usar este comando</span>
                      <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area com Áudio e Anexos */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          
          {/* Chip de Anexo Ativo */}
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 animate-in fade-in">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">{attachedFile.name}</span>
              <span className="text-[11px] text-slate-400">({attachedFile.size})</span>
              <button
                onClick={removeAttachment}
                className="ml-auto p-1 text-slate-400 hover:text-white"
                title="Remover anexo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick chips above input */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">Atalhos:</span>
            <button
              onClick={() => handleStarterClick('NEXA, no calendário cria um evento: ')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors cursor-pointer"
            >
              📅 Marcar no Calendário
            </button>
            <button
              onClick={() => handleStarterClick('NEXA, envia um e-mail com a mensagem: ')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors cursor-pointer"
            >
              ✉️ Enviar E-mail
            </button>
            <button
              onClick={() => handleStarterClick('NEXA, agenda esta atividade no gestor de tarefas: ')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors cursor-pointer"
            >
              📋 Agendar Tarefa
            </button>
          </div>

          {/* Input Form com Microfone e Anexos */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus-within:border-emerald-500 rounded-2xl p-2 transition-colors shadow-inner">
            
            {/* Input Oculto de Ficheiros */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a"
            />

            {/* Botão de Anexo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Anexar documento (PDF, CV, notas, áudio)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Botão de Microfone (Speech-to-Text / Gravação de Áudio) */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40'
                  : 'text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title={isRecording ? "Parar de gravar" : "Falar por voz (Transcrever áudio para texto)"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "🎙️ A ouvir voz... Fala em português..." : "Escreve ou fala com o NEXA... (ex: marca no calendário, envia e-mail...)"}
              className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[38px] py-1.5 px-2"
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedFile) || isThinking}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 shadow-md shadow-emerald-600/30 cursor-pointer"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Pressiona <strong>Enter</strong> para enviar • <strong>Mic</strong> para falar por áudio</span>
            <span>Maurícius Tech • Anti-Alucinação Ativa • Qwen 3.8 Max</span>
          </div>
        </div>
      </div>
    </div>
  );
};
