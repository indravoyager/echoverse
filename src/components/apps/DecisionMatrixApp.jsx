import { useState, useEffect, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Loader2, Copy, Check, Scale, RotateCcw, Leaf, ArrowLeft, GitCompare } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';

export default function DecisionMatrixApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [state, setState] = usePersistedState('decisionmatrix_state', {
    choiceA: '',
    choiceB: '',
    contextText: '',
    outputText: ''
  });
  const { choiceA, choiceB, contextText, outputText } = state;

  const setChoiceA = (val) => setState(prev => ({ ...prev, choiceA: typeof val === 'function' ? val(prev.choiceA) : val }));
  const setChoiceB = (val) => setState(prev => ({ ...prev, choiceB: typeof val === 'function' ? val(prev.choiceB) : val }));
  const setContextText = (val) => setState(prev => ({ ...prev, contextText: typeof val === 'function' ? val(prev.contextText) : val }));
  const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));

  const [isLoading, setIsLoading] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const handleAnalyze = async () => {
    if (!choiceA.trim() || !choiceB.trim() || !contextText.trim()) return;
    setIsLoading(true);

    const systemPrompt = `You are a highly analytical and objective decision-making assistant.
The user is trying to choose between two options based on specific context/criteria.

Choice A: ${choiceA}
Choice B: ${choiceB}
Context & Criteria: ${contextText}

Your task is to create a structured Decision Matrix. 
Follow this strict markdown format:

### 📊 Objective Analysis
Provide a brief 1-2 sentence overview of the dilemma.

### ⚖️ Choice A: ${choiceA}
**Pros:**
- [Pro point 1]
- [Pro point 2]
**Cons:**
- [Con point 1]
- [Con point 2]

### ⚖️ Choice B: ${choiceB}
**Pros:**
- [Pro point 1]
- [Pro point 2]
**Cons:**
- [Con point 1]
- [Con point 2]

### 🎯 Final Recommendation
Provide a clear, rational recommendation based on the user's specific context. Do not be vague. Pick a clear winner or state exactly under what specific condition they should pick one over the other.

CRITICAL: Keep your analysis concise, highly logical, and directly relevant to the user's provided context. Use proper markdown spacing.`;

    try {
      const result = await generateUtilityResponse(contextText, systemPrompt);
      setOutputText(result);
    } catch (error) {
      console.error(error);
      const isRateLimit = error.message?.includes("Rate Limit");
      setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to analyze. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => copy(outputText);

  const handleReset = () => {
    setChoiceA('');
    setChoiceB('');
    setContextText('');
    setOutputText('');
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30">
      </div>

      {/* Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`
            }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">Online</span>
            </div>
          </div>
        </div>
        {/* Global Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title="Reset Form"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[500px] lg:h-full">
          
          {/* Input Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <GitCompare size={16} style={{ color: persona.theme.primary }} /> The Choices
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Choice A</label>
                  <input 
                    type="text" 
                    value={choiceA}
                    onChange={(e) => setChoiceA(e.target.value)}
                    placeholder="e.g., Buy a new car"
                    className="w-full bg-slate-50 dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors placeholder:text-slate-400"
                    style={{ "--color-brand-primary": persona.theme.primary }}
                  />
                </div>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 italic">VS</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Choice B</label>
                  <input 
                    type="text" 
                    value={choiceB}
                    onChange={(e) => setChoiceB(e.target.value)}
                    placeholder="e.g., Keep repairing the old car"
                    className="w-full bg-slate-50 dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors placeholder:text-slate-400"
                    style={{ "--color-brand-primary": persona.theme.primary }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[250px] lg:min-h-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Scale size={16} style={{ color: persona.theme.primary }} /> Context & Criteria
                  </span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !choiceA.trim() || !choiceB.trim() || !contextText.trim()}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                  ANALYZE
                </button>
              </div>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g., I have a budget of $5000 and I drive 50 miles a day for work..."
                className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar"
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative min-h-[400px] lg:h-full lg:min-h-0">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-white">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.theme.primary }}></div>
                Matrix Analysis
              </span>
              <button
                onClick={copyToClipboard}
                disabled={!outputText}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
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
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-transparent">
              {isLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className="relative">
                    <Loader2 size={40} className="animate-spin text-[var(--color-brand-primary)]" style={{ "--color-brand-primary": persona.theme.primary }} />
                    <Scale size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 opacity-50" />
                  </div>
                  <p className="text-sm font-medium animate-pulse">Weighing pros and cons...</p>
                </div>
              ) : (
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px] break-words prose dark:prose-invert max-w-none prose-h3:text-[15px] prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:my-2 prose-li:my-1">
                  {outputText ? (
                    <div dangerouslySetInnerHTML={{
                      __html: outputText
                        .replace(/### (.*?)\n/g, '<h3 class="flex items-center gap-2 text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4 list-disc marker:text-slate-400">$1</li>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                      <Scale size={48} className="text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-[13px] max-w-[250px]">Enter your choices and criteria, then click analyze to generate a decision matrix.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
