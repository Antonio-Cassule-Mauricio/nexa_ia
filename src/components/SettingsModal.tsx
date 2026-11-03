import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Bot, 
  Check, 
  RefreshCcw, 
  Server,
  Sun,
  Moon
} from 'lucide-react';
import { AppSettings } from '../types';
import { INITIAL_SYSTEM_PROMPT } from '../data/initialData';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  serverStatus: { status: string; engine: string; hasGeminiKey?: boolean; hasQwenKey?: boolean };
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  serverStatus,
  onResetAllData
}) => {
  if (!isOpen) return null;

  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetPrompt = () => {
    setFormData(prev => ({ ...prev, systemPrompt: INITIAL_SYSTEM_PROMPT }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configurações do NEXA Assistant</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Maurícius Tech Labs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Server Diagnostic */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                Diagnóstico do Servidor
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {serverStatus.status === 'online' ? '● Online' : '○ Standalone'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div>
                Motor ativo: <strong className="text-slate-800 dark:text-slate-200">{serverStatus.engine}</strong>
              </div>
              <div>
                Tema ativo: <strong className="text-slate-800 dark:text-slate-200 capitalize">{theme}</strong>
              </div>
            </div>
          </div>

          {/* Theme Quick Switcher in Settings */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Aparência Visual</p>
              <p className="text-[10px] text-slate-400">Alternar entre modo escuro e claro</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          </div>

          {/* NEXA System Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                Prompt de Personalidade do NEXA
              </label>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCcw className="w-3 h-3" />
                Restaurar original
              </button>
            </div>
            <textarea
              rows={5}
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Model & Parameters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200">Modelo de IA</label>
              <select
                value={formData.modelName}
                onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="qwen3.8-max">Qwen 3.8 Max (Ativo)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="nexa-core">Motor Nativo Maurícius</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200">Tom de Resposta</label>
              <select
                value={formData.tone}
                onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="profissional">Profissional & Executivo</option>
                <option value="direto">Direto & Sucinto</option>
                <option value="detalhado">Analítico & Estratégico</option>
              </select>
            </div>
          </div>

          {/* Reset / Danger Zone */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Repor Dados Locais</p>
              <p className="text-[10px] text-slate-400">Limpa o histórico e reinicia as tarefas</p>
            </div>
            <button
              type="button"
              onClick={onResetAllData}
              className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-300 dark:border-rose-900/40 transition-colors"
            >
              Repor
            </button>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Guardado!</span>
                </>
              ) : (
                <span>Guardar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
