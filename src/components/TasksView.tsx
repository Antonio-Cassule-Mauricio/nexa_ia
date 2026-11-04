import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Trash2, 
  Clock, 
  Sparkles, 
  Check, 
  Menu,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onAskNexaForTasks: () => void;
  onToggleMobileSidebar: () => void;
  currentUser?: any;
  onOpenAuth?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onAskNexaForTasks,
  onToggleMobileSidebar,
  currentUser,
  onOpenAuth
}) => {
  const [filter, setFilter] = useState<'todas' | 'pendente' | 'em_curso' | 'concluida'>('todas');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('media');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'todas') return true;
    return t.status === filter;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      status: 'pendente',
      dueDate: newDueDate.trim() || 'Hoje'
    });

    setNewTitle('');
    setNewDescription('');
    setNewPriority('media');
    setNewDueDate('');
    setIsAdding(false);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Alta
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Média
          </span>
        );
      case 'baixa':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Baixa
          </span>
        );
    }
  };

  const pendingCount = tasks.filter(t => t.status !== 'concluida').length;
  const completedCount = tasks.filter(t => t.status === 'concluida').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Header */}
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
              <CheckSquare className="w-5 h-5 text-emerald-500" />
              Gestão de Tarefas NEXA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''} • {completedCount} concluída{completedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAskNexaForTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
            title="Pedir sugestões de tarefas ao NEXA"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sugerir com IA</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Banner de Segurança & Autenticação Supabase */}
        {!currentUser && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  <span>Base de Dados Supabase Segura com Row Level Security (RLS)</span>
                  <Database className="w-3.5 h-3.5 inline text-amber-500" />
                </p>
                <p className="text-[11px] opacity-90">
                  Para guardar tarefas reais na tua conta com proteção criptográfica, inicia sessão ou cria a tua conta.
                </p>
              </div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 shadow-xs transition-colors cursor-pointer"
              >
                Entrar / Criar Conta
              </button>
            )}
          </div>
        )}

        {/* New Task Inline Form */}
        {isAdding && (
          <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Adicionar Nova Tarefa</h3>
            
            <input
              type="text"
              placeholder="O que precisas de fazer?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              autoFocus
            />

            <textarea
              placeholder="Detalhes ou notas adicionais (opcional)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Prioridade:</span>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Prazo:</span>
                  <input
                    type="text"
                    placeholder="Ex: Hoje 18h"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-32"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <button
              onClick={() => setFilter('todas')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                filter === 'todas' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pendente')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                filter === 'pendente' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendentes ({tasks.filter(t => t.status === 'pendente').length})
            </button>
            <button
              onClick={() => setFilter('em_curso')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                filter === 'em_curso' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Em Curso ({tasks.filter(t => t.status === 'em_curso').length})
            </button>
            <button
              onClick={() => setFilter('concluida')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                filter === 'concluida' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Concluídas ({completedCount})
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
              <CheckSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma tarefa nesta categoria.</p>
              <p className="text-xs text-slate-500 mt-1">Cria uma nova tarefa ou pede sugestões ao NEXA.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'concluida';
              const isInProgress = task.status === 'em_curso';

              return (
                <div
                  key={task.id}
                  className={`group p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-100/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-60'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, isCompleted ? 'pendente' : 'concluida')}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Em Curso
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    {!isCompleted && (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, isInProgress ? 'pendente' : 'em_curso')}
                        className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {isInProgress ? 'Pausar' : 'Iniciar'}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Eliminar tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
