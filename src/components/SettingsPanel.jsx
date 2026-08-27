import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Image, Moon, Palette, Sparkles, Check, Key, Wifi, Loader2, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, Info, HardDrive, Cpu, Leaf, ChevronDown, Zap, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { saveUserName, saveBgEffects, saveGlobalTheme, saveApiConfig, clearAllChats, factoryReset, savePersonaAccess } from '../lib/db';
import { testApiConnection } from '../lib/ai';
import { GLOBAL_THEMES } from '../config/themes';
import { CustomSelect } from './theme/CustomSelect';



export default function SettingsPanel({
  onBack,
  userName,
  setUserName,
  userAvatar,
  setSelectedImageForCrop,
  isDarkMode,
  setIsDarkMode,
  bgEffectsEnabled,
  setBgEffectsEnabled,
  globalThemeId,
  setGlobalThemeId,
  apiConfig,
  setApiConfig,
  customPersonas,
  onAddPersona,
  onEditPersona,
  onDeletePersona,
  customTags = [],
  onAddTag,
  onEditTag,
  onDeleteTag,
  personaAccessEnabled,
  setPersonaAccessEnabled
}) {
  const [testApiStatus, setTestApiStatus] = useState('idle');
  const [testApiMessage, setTestApiMessage] = useState('');
  const [storageInfo, setStorageInfo] = useState({ chatSize: 0, total: 0, calculated: false });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', description: '', confirmText: 'Confirm', confirmStyle: '', onConfirm: null });

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  useEffect(() => {
    const fetchStorageSize = async () => {
      try {
        let chatTotal = 0;
        try {
          const localforage = (await import('localforage')).default;
          const keys = await localforage.keys();
          for (const key of keys) {
            if (key.startsWith('chat_')) {
              const item = await localforage.getItem(key);
              if (item) chatTotal += new Blob([JSON.stringify(item)]).size;
            }
          }
        } catch (e) {
          console.warn("Failed to calculate chat size", e);
        }

        let totalUsage = 0;
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          totalUsage = estimate.usage || 0;
        }

        if (totalUsage === 0) {
          totalUsage = chatTotal;
        }

        setStorageInfo({
          chatSize: chatTotal,
          total: totalUsage,
          calculated: true
        });
      } catch (err) {
        console.error("Failed to estimate storage", err);
      }
    };
    fetchStorageSize();
  }, []);


  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center justify-between mb-4 shrink-0 -mt-1 pr-2">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">
          Preferences
        </h2>
        <button
          onClick={onBack}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4 pb-6">

        {/* Profile Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Profile</h3>
          <div className="p-4 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-start gap-5">
            <div className="shrink-0">
              <label className="relative cursor-pointer block group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)] flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-[3px] border-white dark:border-[#1a1a1a] relative">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userName ? userName.charAt(0).toUpperCase() : 'U'
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Edit2 size={16} className="text-white drop-" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setSelectedImageForCrop(event.target.result);
                      reader.readAsDataURL(file);
                    }
                    e.target.value = null;
                  }}
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 pt-1">
              <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} /> Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  saveUserName(e.target.value);
                }}
                placeholder="What should the AI call you?"
                className="w-full h-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md px-3 text-slate-900 dark:text-white text-[12px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Appearance</h3>
          <div className="flex flex-col rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            
            <div className="flex items-center justify-between p-3 border-b border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] rounded-t-lg">
              <div className="flex items-center gap-2.5 font-medium text-[12px] text-slate-700 dark:text-slate-300">
                <div className="w-7 h-7 rounded-md bg-[var(--color-brand-magenta)]/10 flex items-center justify-center text-[var(--color-brand-magenta)]">
                  <Moon size={14} />
                </div>
                <span>Dark Mode</span>
              </div>
              <button
                onClick={(e) => setIsDarkMode(!isDarkMode, e)}
                className={clsx(
                  "shrink-0 w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                  isDarkMode ? "border-[var(--color-brand-magenta)]" : "border-slate-400 dark:border-slate-500"
                )}
              >
                <div className={clsx(
                  "w-3 h-3 rounded-full transition-transform duration-300", 
                  isDarkMode ? "bg-[var(--color-brand-magenta)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                )}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border-b border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5 font-medium text-[12px] text-slate-700 dark:text-slate-300">
                <div className="w-7 h-7 rounded-md bg-[var(--color-brand-magenta)]/10 flex items-center justify-center text-[var(--color-brand-magenta)]">
                  <Palette size={14} />
                </div>
                <span>Background Lights</span>
              </div>
              <button
                onClick={() => {
                  const newValue = !bgEffectsEnabled;
                  setBgEffectsEnabled(newValue);
                  saveBgEffects(newValue);
                }}
                className={clsx(
                  "shrink-0 w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                  bgEffectsEnabled ? "border-[var(--color-brand-magenta)]" : "border-slate-400 dark:border-slate-500"
                )}
              >
                <div className={clsx(
                  "w-3 h-3 rounded-full transition-transform duration-300", 
                  bgEffectsEnabled ? "bg-[var(--color-brand-magenta)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                )}></div>
              </button>
            </div>

            <div className="flex items-center justify-center p-3 bg-white/20 dark:bg-white/[0.01] rounded-b-lg">
              <div className="flex items-center gap-2.5 overflow-x-auto py-1.5 px-1.5 no-scrollbar justify-center w-full">
                {Object.values(GLOBAL_THEMES).map(theme => (
                  <button
                    key={theme.id}
                    title={theme.name}
                    onClick={() => {
                      setGlobalThemeId(theme.id);
                      saveGlobalTheme(theme.id);
                    }}
                    className={`shrink-0 w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all duration-300 relative group`}
                    style={{ backgroundColor: theme.primary, width: '22px', height: '22px' }}
                  >
                    {globalThemeId === theme.id ? (
                       <div className="absolute inset-[-4px] rounded-full border-[2px] border-slate-400 dark:border-slate-500 transition-all"></div>
                    ) : (
                       <div className="absolute inset-[-4px] rounded-full border-[2px] border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-all scale-75 group-hover:scale-100"></div>
                    )}
                    {globalThemeId === theme.id && <Check size={10} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Features Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Features</h3>
          <div className="flex flex-col rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center justify-between p-3 bg-white/40 dark:bg-white/[0.02] rounded-lg">
              <div className="flex items-center gap-2.5 font-medium text-[12px] text-slate-700 dark:text-slate-300">
                <div className="w-7 h-7 rounded-md bg-[var(--color-brand-magenta)]/10 flex items-center justify-center text-[var(--color-brand-magenta)]">
                  <User size={14} />
                </div>
                <span>Persona Chat Access</span>
              </div>
              <button
                onClick={() => {
                  const newValue = !personaAccessEnabled;
                  setPersonaAccessEnabled(newValue);
                  savePersonaAccess(newValue);
                }}
                className={clsx(
                  "shrink-0 w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                  personaAccessEnabled ? "border-[var(--color-brand-magenta)]" : "border-slate-400 dark:border-slate-500"
                )}
              >
                <div className={clsx(
                  "w-3 h-3 rounded-full transition-transform duration-300", 
                  personaAccessEnabled ? "bg-[var(--color-brand-magenta)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                )}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Tags Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Custom Tags</h3>
            <button onClick={onAddTag} className="flex items-center gap-1.5 h-6 px-2.5 flex items-center justify-center bg-[var(--color-brand-magenta)]/10 hover:bg-[var(--color-brand-magenta)]/20 text-[var(--color-brand-magenta)] rounded-md text-[10px] font-medium transition-colors">
              <Plus size={12} strokeWidth={3} /> New Tag
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {customTags.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-white/10 text-center text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                You haven't created any custom tags yet.
              </div>
            ) : (
              customTags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:border-[var(--color-brand-magenta)]/30 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 font-medium shrink-0">
                      #
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-[13px] truncate">{tag.name}</p>
                      <p className="text-[10px] font-normal text-slate-400 truncate">{tag.members?.length || 0} items included</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEditTag(tag); }} className="p-1.5 rounded-md text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 transition-colors" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteTag(tag.id); }} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend Section */}
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
            Indicators
          </h3>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-3">
            <div className="flex gap-2.5">
              <Cpu size={16} className="text-green-500 fill-green-500/20 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-none mb-1">Local AI</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Artificial intelligence tools that download models to the browser and run 100% locally.</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-none mb-1">Offline Tool</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Productivity tools that run securely and directly within your browser without server processing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">API Configuration</h3>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[12px] text-slate-700 dark:text-slate-300">
                <Key className="text-[var(--color-brand-magenta)]" size={14} />
                <span>Custom API Key</span>
              </div>
              <button
                onClick={() => {
                  const newConfig = { ...apiConfig, useCustom: !apiConfig.useCustom };
                  setApiConfig(newConfig);
                  saveApiConfig(newConfig);
                }}
                className={clsx(
                  "shrink-0 w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                  apiConfig.useCustom ? "border-[var(--color-brand-magenta)]" : "border-slate-400 dark:border-slate-500"
                )}
              >
                <div className={clsx(
                  "w-3 h-3 rounded-full transition-transform duration-300", 
                  apiConfig.useCustom ? "bg-[var(--color-brand-magenta)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                )}></div>
              </button>
            </div>

              <div className={`flex flex-col gap-2.5 transition-opacity duration-300 ${!apiConfig.useCustom ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}>
                {/* Provider Selector */}
                <div className="flex flex-col gap-1 z-30 relative">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Provider</label>
                  <CustomSelect
                    value={apiConfig.provider || 'gemini'}
                    onChange={(val) => {
                      let defaultModel = '';
                      if (val === 'gemini') defaultModel = 'gemini-3.1-flash-lite';
                      if (val === 'openai') defaultModel = 'gpt-4o-mini';
                      if (val === 'groq') defaultModel = 'llama-3.3-70b-versatile';
                      if (val === 'custom') defaultModel = 'openrouter/auto';
                      
                      const newConfig = {
                        ...apiConfig,
                        provider: val,
                        customModel: defaultModel,
                        customBaseUrl: val === 'custom' ? (apiConfig.customBaseUrl || 'https://openrouter.ai/api/v1') : apiConfig.customBaseUrl
                      };
                      setApiConfig(newConfig);
                      saveApiConfig(newConfig);
                      setTestApiStatus('idle');
                    }}
                    options={[
                      { value: 'gemini', label: 'Google Gemini', icon: Cpu },
                      { value: 'openai', label: 'OpenAI', icon: Cpu },
                      { value: 'groq', label: 'Groq', icon: Cpu },
                      { value: 'custom', label: 'Custom / OpenRouter', icon: Cpu }
                    ]}
                    themeColor={GLOBAL_THEMES[globalThemeId]?.primary || '#94a3b8'}
                  />
                </div>

                {/* Custom Base URL Input */}
                {apiConfig.provider === 'custom' && (
                  <div className="flex flex-col gap-1 z-20 relative">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base URL (Endpoint)</label>
                    <input
                      type="text"
                      value={apiConfig.customBaseUrl || ''}
                      onChange={(e) => {
                        const newConfig = { ...apiConfig, customBaseUrl: e.target.value };
                        setApiConfig(newConfig);
                        saveApiConfig(newConfig);
                        setTestApiStatus('idle');
                      }}
                      placeholder="e.g. https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                      className="w-full h-7 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-0 text-slate-900 dark:text-white text-[11px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors placeholder:text-slate-400 font-mono"
                    />
                  </div>
                )}

                {/* API Key Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">API Key</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={apiConfig.customKey || ''}
                    onChange={(e) => {
                      const newConfig = { ...apiConfig, customKey: e.target.value };
                      setApiConfig(newConfig);
                      saveApiConfig(newConfig);
                      setTestApiStatus('idle');
                    }}
                    placeholder="Enter API Key..."
                    className="w-full h-7 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-0 text-slate-900 dark:text-white text-[11px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors placeholder:text-slate-400 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                  />
                </div>

                {/* Model Selector */}
                {(() => {
                  const defaultProviderModel =
                    apiConfig.provider === 'openai' ? 'gpt-4o-mini' :
                    apiConfig.provider === 'groq' ? 'llama-3.3-70b-versatile' :
                    apiConfig.provider === 'custom' ? 'openrouter/auto' :
                    'gemini-3.1-flash-lite';
                  const currentModel = apiConfig.customModel || defaultProviderModel;
                  const PRESETS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o-mini', 'gpt-4o', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openrouter/auto'];
                  const isPreset = PRESETS.includes(currentModel);

                  return (
                    <div className="flex flex-col gap-1 z-10 relative">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Model</label>
                      <CustomSelect
                        value={isPreset ? currentModel : 'custom'}
                        onChange={(val) => {
                          let defaultCustom = 'custom-model';
                          if (apiConfig.provider === 'gemini') defaultCustom = 'gemini-2.5-flash';
                          if (apiConfig.provider === 'openai') defaultCustom = 'gpt-4o';
                          if (apiConfig.provider === 'groq') defaultCustom = 'llama-3.1-8b-instant';
                          if (apiConfig.provider === 'custom') defaultCustom = 'deepseek/deepseek-chat';
                          
                          const newConfig = { ...apiConfig, customModel: val === 'custom' ? defaultCustom : val };
                          setApiConfig(newConfig);
                          saveApiConfig(newConfig);
                          setTestApiStatus('idle');
                        }}
                        options={[
                          ...(apiConfig.provider === 'gemini' ? [
                            { value: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite', icon: Cpu },
                            { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash', icon: Cpu },
                            { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro', icon: Cpu }
                          ] : []),
                          ...(apiConfig.provider === 'openai' ? [
                            { value: 'gpt-4o-mini', label: 'gpt-4o-mini', icon: Cpu },
                            { value: 'gpt-4o', label: 'gpt-4o', icon: Cpu }
                          ] : []),
                          ...(apiConfig.provider === 'groq' ? [
                            { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile', icon: Cpu },
                            { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant', icon: Cpu }
                          ] : []),
                          ...(apiConfig.provider === 'custom' ? [
                            { value: 'openrouter/auto', label: 'openrouter/auto', icon: Cpu }
                          ] : []),
                          { value: 'custom', label: 'Custom Model...', icon: Cpu }
                        ]}
                        themeColor={GLOBAL_THEMES[globalThemeId]?.primary || '#94a3b8'}
                      />
                      {!isPreset && (
                        <input
                          type="text"
                          value={apiConfig.customModel || ''}
                          onChange={(e) => {
                            const newConfig = { ...apiConfig, customModel: e.target.value };
                            setApiConfig(newConfig);
                            saveApiConfig(newConfig);
                            setTestApiStatus('idle');
                          }}
                          placeholder="Enter model name (e.g. deepseek/deepseek-chat)"
                          className="w-full h-7 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-0 text-slate-900 dark:text-white text-[11px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors placeholder:text-slate-400 font-mono placeholder:font-sans mt-1"
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Test Connection Button */}
                <div className="mt-1 flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      setTestApiStatus('testing');
                      setTestApiMessage('');
                      const result = await testApiConnection(
                        apiConfig.customKey,
                        apiConfig.customModel,
                        apiConfig.provider,
                        apiConfig.customBaseUrl
                      );
                      if (result.success) {
                        setTestApiStatus('success');
                        setTestApiMessage('Connection successful!');
                      } else {
                        setTestApiStatus('error');
                        setTestApiMessage(result.message);
                      }
                    }}
                    disabled={testApiStatus === 'testing' || !apiConfig.customKey}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-[11px] h-7 px-3 rounded-md transition-colors disabled:opacity-50 border border-slate-200 dark:border-white/5"
                  >
                    {testApiStatus === 'testing' ? (
                      <><Loader2 size={14} className="animate-spin" /> Testing...</>
                    ) : (
                      <><Wifi size={14} /> Test Connection</>
                    )}
                  </button>

                {testApiStatus === 'success' && (
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-900/50">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span className="text-[11px] font-medium">{testApiMessage}</span>
                  </div>
                )}

                {testApiStatus === 'error' && (
                  <div className="flex items-start gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-md border border-red-200 dark:border-red-900/50">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium leading-relaxed">{testApiMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Storage Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Data & Storage</h3>
            {storageInfo.calculated && (
              <span className="text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <HardDrive size={10} /> {formatBytes(storageInfo.total)} used
              </span>
            )}
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-2">

            <button
              onClick={() => {
                setConfirmModal({
                  show: true,
                  title: 'Clear Chat?',
                  description: 'Are you sure you want to delete all message history? Messages from pinned personas will not be deleted.',
                  confirmText: 'Delete',
                  confirmStyle: 'bg-[#e11d48] hover:bg-red-700 text-white',
                  onConfirm: async () => {
                    await clearAllChats();
                    window.location.reload();
                  }
                });
              }}
              className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[12px] font-semibold flex items-center gap-2">
                  Clear Chat
                  {storageInfo.calculated && storageInfo.chatSize > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md font-mono text-slate-500">{formatBytes(storageInfo.chatSize)}</span>}
                </span>
                <span className="text-[10px] text-slate-500 text-left">Delete all conversations except pinned ones.</span>
              </div>
              <Trash2 size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>

            <div className="h-px w-full bg-slate-200 dark:bg-white/5"></div>

            <button
              onClick={() => {
                setConfirmModal({
                  show: true,
                  title: 'Factory Reset?',
                  description: 'WARNING: This will completely reset the application. All Custom Personas, API Keys, and chat history will be permanently lost. Continue?',
                  confirmText: 'Factory Reset',
                  confirmStyle: 'bg-[#e11d48] hover:bg-red-700 text-white',
                  onConfirm: () => {
                    // Double confirmation using another modal state update
                    setConfirmModal({
                      show: true,
                      title: 'Are you absolutely sure?',
                      description: 'This action cannot be undone. All data will be destroyed.',
                      confirmText: 'Yes, Destroy Everything',
                      confirmStyle: 'bg-[#e11d48] hover:bg-red-700 text-white',
                      onConfirm: async () => {
                        await factoryReset();
                        window.location.reload();
                      }
                    });
                  }
                });
              }}
              className="w-full flex items-center justify-between p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[12px] font-semibold">Factory Reset</span>
                <span className="text-[10px] text-red-500/70 text-left">Delete all data completely.</span>
              </div>
              <AlertCircle size={16} className="text-red-500" />
            </button>

          </div>
        </div>

        <div className="mt-3 text-center text-[9px] font-light text-slate-400 uppercase tracking-widest flex flex-col items-center gap-2">
          <span className="opacity-50">Developed by <a href="https://github.com/indravoyager" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-semibold">Indra Voyager</a></span>
          <a
            href="https://trakteer.id/indravoyager"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-[11px] font-semibold transition-colors normal-case tracking-normal border border-red-500/20"
          >
            <Heart size={12} className="fill-red-500 text-red-500 animate-pulse" />
            <span>Support on Trakteer</span>
          </a>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.show && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-200"
          style={{
            '--color-brand-magenta': GLOBAL_THEMES[globalThemeId]?.primary || '#94a3b8',
            '--color-brand-purple': GLOBAL_THEMES[globalThemeId]?.secondary || '#475569'
          }}
          onClick={() => setConfirmModal({ show: false })}
        >
          <div
            className="bg-white dark:bg-[#0f0f0f] rounded-lg p-6 max-w-sm w-full  border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 text-left">
              {confirmModal.title}
            </h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 text-left">
              {confirmModal.description}
            </p>
            <div className="flex gap-4 justify-end items-center w-full">
              <button
                onClick={() => setConfirmModal({ show: false })}
                className="px-3 py-2 text-[var(--color-brand-magenta)] font-semibold text-[14px] transition-colors hover:bg-slate-50 dark:hover:bg-white/5 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-6 py-2 rounded-md text-white font-semibold text-[14px] transition-colors  ${confirmModal.confirmStyle || 'bg-[#e11d48] hover:bg-red-700'}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
