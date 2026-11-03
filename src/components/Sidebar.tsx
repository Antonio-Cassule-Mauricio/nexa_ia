import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  CheckSquare, 
  Smartphone, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Settings, 
  ChevronRight,
  Globe,
  User,
  Sun,
  Moon,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Conversation } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentTab: 'chat' | 'tasks' | 'whatsapp';
  onSelectTab: (tab: 'chat' | 'tasks' | 'whatsapp') => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  pendingTasksCount: number;
  unreadWhatsAppCount: number;
  onOpenSettings: () => void;
  serverStatus: { status: string; engine: string };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onGoToMauricius: () => void;
  onGoToNexaSite: () => void;
  currentUser: any;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  pendingTasksCount,
  unreadWhatsAppCount,
  onOpenSettings,
  serverStatus,
  isOpenMobile,
  onCloseMobile,
  onGoToMauricius,
  onGoToNexaSite,
  currentUser,
  onOpenAuthModal
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full
        transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">NEXA</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  qwen3.8-max
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Maurícius Tech Labs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button 
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation back to landing pages */}
        <div className="px-3 pt-3 space-y-1.5">
          <button
            onClick={onGoToNexaSite}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Site Oficial do NEXA</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
          </button>

          <button
            onClick={onGoToMauricius}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Startup Maurícius</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => { onSelectTab('chat'); onCloseMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>Chat NEXA</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
              {conversations.length}
            </span>
          </button>

          <button
            onClick={() => { onSelectTab('tasks'); onCloseMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4" />
              <span>Gestão de Tarefas</span>
            </div>
            {pendingTasksCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { onSelectTab('whatsapp'); onCloseMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4" />
              <span>Hub WhatsApp</span>
            </div>
            {unreadWhatsAppCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                {unreadWhatsAppCount}
              </span>
            )}
          </button>
        </div>

        {/* History Header & + Nova */}
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Histórico</span>
          <button
            onClick={() => { onNewConversation(); onSelectTab('chat'); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-opacity"
            title="Iniciar nova conversa"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-6 px-4 text-xs text-slate-400">
              Nenhuma conversa.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConversationId === c.id && currentTab === 'chat';
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    onSelectTab('chat');
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-medium border border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isEditing ? (
                    <form 
                      onSubmit={(e) => saveEditing(c.id, e)} 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white w-full focus:outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-emerald-500 hover:text-emerald-600 p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={cancelEditing} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate pr-2">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className="truncate">{c.title}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(c, e)}
                          className="p-1 text-slate-400 hover:text-emerald-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                          title="Renomear"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(c.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Account / Supabase Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 space-y-2">
          {/* User Profile Card */}
          <div 
            onClick={onOpenAuthModal}
            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.email ? currentUser.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                  {currentUser?.email ? currentUser.email.split('@')[0] : 'Convidado'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                  {currentUser ? 'Supabase Conectado' : 'Entrar / Registar'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Configurações & Prompt</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Online</span>
          </button>
        </div>
      </aside>
    </>
  );
};
