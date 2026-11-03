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
  Plus
} from 'lucide-react';
import { Conversation } from '../types';
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
}

const STARTER_PROMPTS = [
  {
    icon: '📋',
    title: 'Organizar Tarefas do Dia',
    desc: 'Cria uma rotina organizada e define prioridades para hoje',
    prompt: 'Olá NEXA, ajuda-me a organizar o meu dia de trabalho. Tenho várias pendências urgentes e preciso de uma lista estruturada de tarefas com prioridades alta, média e baixa.'
  },
  {
    icon: '⚡',
    title: 'Resumir Reunião / Conversa',
    desc: 'Sintetiza tópicos longos em pontos-chave objetivos',
    prompt: 'NEXA, podes fazer um resumo executivo dos principais pontos e decisões da nossa conversa de alinhamento com a equipa da Maurícius?'
  },
  {
    icon: '🔍',
    title: 'Analisar e Resolver Problema',
    desc: 'Avaliação estruturada de alternativas e riscos',
    prompt: 'Preciso de tomar uma decisão crítica sobre o lançamento de uma funcionalidade. Podes analisar as variáveis, listar prós e contras e sugerir a melhor abordagem?'
  },
  {
    icon: '💬',
    title: 'Redigir Mensagem WhatsApp',
    desc: 'Prepara uma mensagem profissional e clara',
    prompt: 'Ajuda-me a escrever uma mensagem profissional e cortês para enviar a um cliente através do WhatsApp a pedir o feedback sobre a proposta de projeto.'
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
  onNewConversation
}) => {
  const { theme, toggleTheme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isThinking]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;

    setInputText('');
    await onSendMessage(trimmed);
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              NEXA Online • Contexto ativo
            </p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-1.5">
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
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-slate-700/60 shadow-xs"
            title="Resumir conversa"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Resumir</span>
          </button>

          <button
            onClick={onExtractTasksFromChat}
            disabled={isThinking || conversation.messages.length < 2}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-slate-700/60 shadow-xs"
            title="Extrair tarefas"
          >
            <ListPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Extrair Tarefas</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={onClearHistory}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Limpar histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {conversation.messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 text-white mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`group relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                }`}>
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px]">
                    <span className={`font-semibold ${isUser ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1'}`}>
                      {!isUser && <Sparkles className="w-3 h-3 inline" />}
                      {isUser ? 'Tu' : 'NEXA'}
                    </span>
                    <span className={`text-[10px] ${isUser ? 'text-emerald-200' : 'text-slate-400 font-mono'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="relative">
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
                    </div>
                  )}

                  {/* Assistant Actions */}
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
                          className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-500 px-2 py-0.5 rounded transition-colors"
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
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking State — Apenas antes do primeiro token do assistente começar a fluir */}
          {isThinking && (conversation.messages.length === 0 || conversation.messages[conversation.messages.length - 1]?.role === 'user') && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 text-white animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">NEXA está a pensar com Qwen 3.8 Max...</span>
              </div>
            </div>
          )}

          {/* Starter suggestions */}
          {conversation.messages.length <= 1 && !isThinking && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                Sugestões rápidas de pedidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_PROMPTS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(item.prompt)}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between shadow-xs"
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
                      <span>Usar este pedido</span>
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

      {/* Bottom Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick chips above input */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">Ações:</span>
            <button
              onClick={() => handleStarterClick('NEXA, podes extrair uma lista de tarefas claras e prioridades a partir da nossa conversa?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors"
            >
              📋 Extrair tarefas
            </button>
            <button
              onClick={() => handleStarterClick('NEXA, faz um resumo objetivo dos pontos mais importantes que abordámos até agora.')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors"
            >
              ⚡ Resumir contexto
            </button>
            <button
              onClick={() => handleStarterClick('Prepara uma resposta executiva e cordial para enviar pelo WhatsApp sobre as decisões tomadas.')}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] shrink-0 border border-slate-200 dark:border-slate-700/50 transition-colors"
            >
              💬 Mensagem WhatsApp
            </button>
          </div>

          {/* Textarea Input Form */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus-within:border-emerald-500 rounded-xl p-2 transition-colors shadow-inner">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreve uma mensagem para o NEXA... (Enter para enviar)"
              className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[38px] py-1.5 px-2"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 shadow-md shadow-emerald-600/30 cursor-pointer"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Pressiona <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para nova linha</span>
            <span>Maurícius Tech • Modelo Qwen 3.8 Max</span>
          </div>
        </div>
      </div>
    </div>
  );
};
