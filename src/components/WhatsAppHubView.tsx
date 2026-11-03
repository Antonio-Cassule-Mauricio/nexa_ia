import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { WhatsAppContact, WhatsAppMessage } from '../types';

interface WhatsAppHubViewProps {
  contacts: WhatsAppContact[];
  messages: Record<string, WhatsAppMessage[]>;
  onSendMessage: (contactId: string, text: string) => void;
  onAddReaction: (contactId: string, messageId: string, emoji: string) => void;
  onSummarizeThreadWithNexa: (contactName: string, threadMessages: WhatsAppMessage[]) => void;
  onExtractTasksFromThreadWithNexa: (contactName: string, threadMessages: WhatsAppMessage[]) => void;
  onSuggestReplyWithNexa: (contactName: string, lastMessage: string) => void;
  onToggleMobileSidebar: () => void;
}

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({
  contacts,
  messages,
  onSendMessage,
  onAddReaction,
  onSummarizeThreadWithNexa,
  onExtractTasksFromThreadWithNexa,
  onSuggestReplyWithNexa,
  onToggleMobileSidebar
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const activeMessages = messages[selectedContactId] || [];

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;
    onSendMessage(activeContact.id, inputText.trim());
    setInputText('');
  };

  const handleQuickReaction = (messageId: string, emoji: string) => {
    if (!activeContact) return;
    onAddReaction(activeContact.id, messageId, emoji);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base md:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              Hub WhatsApp • NEXA Bridge
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {isConnected ? 'Conta Conectada: +244 923 001 234' : 'Aguardando emparelhamento'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">QR Code de Ligação</span>
          </button>
        </div>
      </header>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Contact List column */}
        <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar conversas WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-slate-100 dark:bg-slate-800/80 border-l-2 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    {contact.isGroup ? <Users className="w-4 h-4 text-emerald-500" /> : contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">{contact.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{contact.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.lastMessage}</p>
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                      {contact.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation details & NEXA actions */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {activeContact ? (
            <>
              {/* Thread header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold">
                    {activeContact.isGroup ? <Users className="w-4 h-4" /> : activeContact.name[0]}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-slate-200">{activeContact.name}</h2>
                    <p className="text-[10px] text-slate-400 font-mono">{activeContact.phone}</p>
                  </div>
                </div>

                {/* AI Action Buttons for this thread */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => onSummarizeThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold transition-colors"
                    title="Resumir mensagens desta conversa com NEXA"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Resumir com NEXA</span>
                  </button>

                  <button
                    onClick={() => onExtractTasksFromThreadWithNexa(activeContact.name, activeMessages)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition-colors"
                    title="Extrair tarefas desta conversa"
                  >
                    <ListPlus className="w-3 h-3" />
                    <span>Extrair Tarefas</span>
                  </button>

                  <button
                    onClick={() => onSuggestReplyWithNexa(activeContact.name, activeContact.lastMessage)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-colors"
                    title="Sugerir resposta"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sugerir Resposta</span>
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                {activeMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`relative max-w-sm rounded-xl px-3.5 py-2 text-xs shadow-xs ${
                        isUser
                          ? 'bg-emerald-700 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                          <span>{msg.timestamp}</span>
                          {isUser && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                        </div>

                        {msg.reaction && (
                          <span className="absolute -bottom-2 -right-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.2 text-[10px] shadow-xs">
                            {msg.reaction}
                          </span>
                        )}
                      </div>

                      {/* State reaction triggers */}
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Responder a ${activeContact.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Seleciona uma conversa para ver as mensagens.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pairing Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Emparelhamento WhatsApp</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lê o código com a tua aplicação do WhatsApp no telemóvel para sincronizar mensagens com o NEXA.
              </p>
            </div>

            {/* Simulated QR Code Canvas */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-md border border-slate-200">
              <div className="w-44 h-44 bg-slate-950 flex flex-col items-center justify-center text-white text-xs p-2 rounded-xl relative">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 opacity-90">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-transparent'}`} 
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>1. Abre o WhatsApp no telemóvel</p>
              <p>2. Acede a <strong>Aparelhos Conectados &gt; Conectar</strong></p>
              <p>3. Aponta a câmara para este ecrã</p>
            </div>

            <button
              onClick={() => {
                setIsConnected(true);
                setShowQrModal(false);
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              Simular Conexão Concluída
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
