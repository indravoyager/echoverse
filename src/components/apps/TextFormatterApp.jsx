import { useState, useEffect } from 'react';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Copy, Check, RotateCcw, Type, AlignLeft, BarChart2, Settings2, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
 
const ActionButton = ({ onClick, label, className }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center h-[34px] rounded-lg transition-all active:scale-95",
      "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
      className
    )}
  >
    <span className="text-[11px] font-bold tracking-wider">{label}</span>
  </button>
);

export default function TextFormatterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [inputText, setInputText] = usePersistedState('textformatter_state', '');
 
  const { copied, copy } = useCopyToClipboard();

  const copyToClipboard = () => copy(inputText);

  const handleReset = () => {
    setInputText('');
  };

  // Format Handlers
  const handleUppercase = () => setInputText(prev => prev.toUpperCase());
  const handleLowercase = () => setInputText(prev => prev.toLowerCase());
  const handleTitleCase = () => setInputText(prev => prev.replace(
    /\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ));
  
  const handleCamelCase = () => setInputText(prev => prev.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '')
  );

  const handleSentenceCase = () => setInputText(prev => {
    return prev.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
  });

  const handleAlternatingCase = () => setInputText(prev => {
    let lower = true;
    return prev.split('').map(c => {
      if (/[a-zA-Z]/.test(c)) {
        const res = lower ? c.toLowerCase() : c.toUpperCase();
        lower = !lower;
        return res;
      }
      return c;
    }).join('');
  });

  const handleSnakeCase = () => setInputText(prev => prev.replace(/\W+/g, " ")
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_')
  );

  const handleRemoveExtraSpaces = () => setInputText(prev => prev.replace(/\s+/g, ' ').trim());
  const handleRemoveLineBreaks = () => setInputText(prev => prev.replace(/\r?\n|\r/g, ' '));
  const handleRemoveSnakeCase = () => setInputText(prev => prev.replace(/_/g, ' '));

  // Metrics
  const charCount = inputText.length;
  const charNoSpaceCount = inputText.replace(/\s+/g, '').length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length : 0;
  const sentenceCount = (inputText.match(/[.!?]+/g) || []).length;
  const lineCount = inputText === '' ? 0 : inputText.split(/\r?\n/).length;

  return (
    <SidebarLayout
      persona={persona}
      onOpenSidebar={onOpenSidebar}
      onOpenPersonaInfo={onOpenPersonaInfo}
      onReset={handleReset}
      resetLabel="Clear Text"
      sidebarContent={
        <>

          {/* Box 1: Format Actions */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
             <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Format Actions
               </h3>
             </div>
             <div className="p-3.5 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Case Conversion</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <ActionButton label="UPPERCASE" onClick={handleUppercase} />
                    <ActionButton label="lowercase" onClick={handleLowercase} />
                    
                    <ActionButton label="Title Case" onClick={handleTitleCase} />
                    <ActionButton label="Sentence case" onClick={handleSentenceCase} />
                    
                    <ActionButton label="camelCase" onClick={handleCamelCase} />
                    <ActionButton label="snake_case" onClick={handleSnakeCase} />
                    
                    <ActionButton label="aLtErNaTiNg" onClick={handleAlternatingCase} className="col-span-2" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Clean Up</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <ActionButton label="Remove Spaces" onClick={handleRemoveExtraSpaces} />
                    <ActionButton label="Remove Lines" onClick={handleRemoveLineBreaks} />
                    <ActionButton label="Remove snake_case" onClick={handleRemoveSnakeCase} className="col-span-2" />
                  </div>
                </div>
             </div>
          </div>

          {/* Box 2: Metrics */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
             <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <BarChart2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Metrics Report
               </h3>
             </div>
             <div className="p-3.5 grid grid-cols-2 gap-2">
               <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-100 dark:border-white/5 rounded-lg p-2.5 flex flex-col justify-center">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Words</span>
                 <span className="text-2xl font-black leading-none tracking-tight" style={{ color: persona.theme.primary }}>{wordCount}</span>
               </div>
               <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-100 dark:border-white/5 rounded-lg p-2.5 flex flex-col justify-center">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Chars / Letters</span>
                 <span className="text-2xl font-black leading-none tracking-tight text-slate-700 dark:text-slate-200">{charCount}</span>
               </div>
               <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-100 dark:border-white/5 rounded-lg p-2.5 flex flex-col justify-center">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sentences</span>
                 <span className="text-2xl font-black leading-none tracking-tight text-slate-700 dark:text-slate-200">{sentenceCount}</span>
               </div>
               <div className="bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-100 dark:border-white/5 rounded-lg p-2.5 flex flex-col justify-center">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lines</span>
                 <span className="text-2xl font-black leading-none tracking-tight text-slate-700 dark:text-slate-200">{lineCount}</span>
               </div>
             </div>
             <div className="px-3.5 pb-3.5">
               <div className="bg-[var(--color-primary)]/10 rounded-lg p-2.5 flex justify-between items-center" style={{ '--color-primary': persona.theme.primary }}>
                 <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Chars (No Spaces)</span>
                 <span className="text-lg font-black text-[var(--color-primary)]">{charNoSpaceCount}</span>
               </div>
             </div>
          </div>
    
        </>
      }
      mainContent={
        <>

          <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-full">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <AlignLeft className="w-4 h-4 text-slate-400" /> Text Workspace
              </h3>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <span className="text-xs font-bold text-green-500 animate-in fade-in slide-in-from-right-2 duration-200">Copied!</span>
                    <Check size={16} className="text-green-500" />
                  </>
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste your text here to format it..."
              className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar font-mono"
            />
          </div>
    
        </>
      }
    />
  );
}