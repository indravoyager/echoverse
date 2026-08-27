import { useState, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, Zap, UserCircle, Briefcase, FileText, AlignLeft, CheckCircle, RotateCcw, Leaf, Cpu, ArrowLeft, Sparkles } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';

export default function PrompterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [state, setState] = usePersistedState('prompter_state', {
    rawPrompt: '',
    ptcf: {
      persona: '',
      task: '',
      context: '',
      format: ''
    },
    outputPrompt: ''
  });
  const { rawPrompt, ptcf, outputPrompt } = state;

  const setRawPrompt = (val) => setState(prev => ({ ...prev, rawPrompt: typeof val === 'function' ? val(prev.rawPrompt) : val }));
  const setPtcf = (val) => setState(prev => ({ ...prev, ptcf: typeof val === 'function' ? val(prev.ptcf) : val }));
  const setOutputPrompt = (val) => setState(prev => ({ ...prev, outputPrompt: typeof val === 'function' ? val(prev.outputPrompt) : val }));

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleImprove = async () => {
    if (!ptcf.task.trim() && !rawPrompt.trim()) return;

    setIsLoading(true);

    const userInstruction = `
 RAW PROMPT (Optional Idea): ${rawPrompt || 'None provided'}
 
 PTCF FRAMEWORK:
 - PERSONA: ${ptcf.persona || 'Expert AI Assistant'}
 - TASK: ${ptcf.task || (rawPrompt ? 'Improve the raw prompt above' : 'Help the user')}
 - CONTEXT: ${ptcf.context || 'None provided'}
 - FORMAT: ${ptcf.format || 'Clear and concise text'}
 `;

    const systemPrompt = `You are a Master AI Prompt Engineer. Your job is to take the user's PTCF (Persona, Task, Context, Format) inputs and weave them into a single, highly effective, professional mega-prompt. 
 
RULES:
1. Do NOT answer the prompt itself. You are WRITING the prompt for the user to copy and use later.
2. Structure the output prompt clearly. You can use markdown headers or bold text within the prompt to separate Context, Role, Task, etc if it helps, or write it as a cohesive paragraph.
3. If the user provided a RAW PROMPT, incorporate its intent into the final prompt.
4. Output ONLY the final constructed prompt. Do not include introductory or concluding remarks like "Here is your prompt:".
5. CRITICAL: You MUST write the final prompt using the EXACT SAME LANGUAGE as the user's inputs. If the user writes in Indonesian, you MUST output the prompt in Indonesian.
6. CRITICAL: Do NOT use any em-dashes (—) or en-dashes (–) in your output. Use standard normal hyphens (-) or normal punctuation instead.`;

    try {
      const result = await generateUtilityResponse(userInstruction, systemPrompt);
      const sanitized = result.replace(/[—–]/g, '-');
      setOutputPrompt(sanitized);
    } catch (error) {
      console.error(error);
      setOutputPrompt("Error: Failed to process prompt. Please check API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillPtcf = async () => {
    if (!rawPrompt.trim()) return;

    setIsAutoFilling(true);
    const systemPrompt = `You are an expert AI Prompt Engineer. Your task is to analyze the user's raw idea and formulate a professional PTCF framework (Persona, Task, Context, Format). 
 If the raw idea is vague, invent highly effective, logical details to make it a world-class prompt.
 CRITICAL: You MUST write the PTCF components using the EXACT SAME LANGUAGE as the user's raw idea. If the user writes in Indonesian, you MUST output the JSON values in Indonesian.
 
 You MUST output ONLY a valid JSON object with exactly these four keys: "persona", "task", "context", "format". 
 Do NOT include markdown formatting like \`\`\`json. Just the raw JSON object.
 
 Example output:
 {
 "persona": "Expert Copywriter",
 "task": "Write a highly engaging landing page copy.",
 "context": "Target audience is Gen-Z looking for affordable skincare.",
 "format": "Markdown format with clear headings and bullet points."
 }`;

    try {
      const result = await generateUtilityResponse(rawPrompt, systemPrompt);
      // Strip markdown if AI disobeys
      const cleanedResult = result.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedResult);

      setPtcf({
        persona: parsed.persona || '',
        task: parsed.task || '',
        context: parsed.context || '',
        format: parsed.format || ''
      });
    } catch (error) {
      console.error("Auto-fill failed:", error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const { copied, copy } = useCopyToClipboard();
  const copyToClipboard = () => copy(outputPrompt);

  const handlePtcfChange = (key, value) => {
    setPtcf(prev => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setRawPrompt('');
    setPtcf({ persona: '', task: '', context: '', format: '' });
    setOutputPrompt('');
  };

  // Calculate stats
  const filledComponents = Object.values(ptcf).filter(val => val && typeof val === 'string' && val.trim().length > 0).length;

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
        <button
          onClick={clearForm}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset Form"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset Form</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10">
        <div className="flex flex-col lg:flex-row h-full gap-4">

          {/* Left Panel: Input Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-[320px]">

            {/* Raw Prompt */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> 1. Raw Prompt (Optional)
                </h3>
                <button
                  onClick={handleImprove}
                  disabled={isLoading || (!ptcf.task && !rawPrompt.trim())}
                  className="flex items-center justify-center gap-1.5 h-6 px-3 -mr-2 text-white font-bold text-[10px] rounded-md  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                  title="Directly improve this raw prompt"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="fill-white" />}
                  Improve Directly
                </button>
              </div>
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Write your initial idea here... (e.g., Create an analysis of last month's sales report)"
                className="w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] h-24"
              />
            </div>

            {/* PTCF Framework Inputs */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col flex-1 relative">

              {/* Auto-fill Overlay */}
              {isAutoFilling && (
                <div className="absolute inset-0 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                  <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-[var(--color-brand-primary)]" style={{ "--color-brand-primary": persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Generating Framework...</span>
                  </div>
                </div>
              )}

              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-slate-400" /> 2. PTCF Framework Structure
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFillPtcf}
                    disabled={!rawPrompt.trim() || isAutoFilling}
                    className="flex items-center gap-1 text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
                    title="Auto-fill based on Raw Prompt"
                  >
                    <Wand2 size={12} /> Auto-Fill
                  </button>
                  <span className="text-[10px] font-bold bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] px-2 py-1 rounded-full -mr-2" style={{ "--color-brand-primary": persona.theme.primary }}>
                    {filledComponents}/4 Filled
                  </span>
                </div>
              </div>
              <div className="flex flex-col flex-1 divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto">

                {/* P - Persona */}
                <div className="p-4 flex flex-col gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <UserCircle size={14} className="text-slate-400" />
                    Persona (Role)
                  </label>
                  <input
                    type="text"
                    value={ptcf.persona}
                    onChange={(e) => handlePtcfChange('persona', e.target.value)}
                    placeholder='e.g., "Senior Data Analyst", "Lead UX Designer"'
                    className="w-full bg-transparent text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none py-1"
                  />
                </div>

                {/* T - Task */}
                <div className="p-4 flex flex-col gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Briefcase size={14} className="text-slate-400" />
                    Task (Main Objective)
                  </label>
                  <textarea
                    value={ptcf.task}
                    onChange={(e) => handlePtcfChange('task', e.target.value)}
                    placeholder='e.g., "Extract key trends from the dataset and design wireframe solutions..."'
                    className="w-full bg-transparent text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none resize-none h-16 custom-scrollbar"
                  />
                </div>

                {/* C - Context */}
                <div className="p-4 flex flex-col gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <FileText size={14} className="text-slate-400" />
                    Context (Background Info)
                  </label>
                  <textarea
                    value={ptcf.context}
                    onChange={(e) => handlePtcfChange('context', e.target.value)}
                    placeholder='e.g., "Dataset has 10,000 rows of Q3 transactions, focusing on retaining 18-24 year old users..."'
                    className="w-full bg-transparent text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none resize-none h-20 custom-scrollbar"
                  />
                </div>

                {/* F - Format */}
                <div className="p-4 flex flex-col gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <AlignLeft size={14} className="text-slate-400" />
                    Format (Output Structure)
                  </label>
                  <input
                    type="text"
                    value={ptcf.format}
                    onChange={(e) => handlePtcfChange('format', e.target.value)}
                    placeholder='e.g., "Metric summary table, Diagram schema, Executive summary"'
                    className="w-full bg-transparent text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none py-1"
                  />
                </div>

                {/* Improve Prompt Button — bottom right inside PTCF panel */}
                <div className="p-4 flex justify-end shrink-0">
                  <button
                    onClick={handleImprove}
                    disabled={isLoading || (!ptcf.task && !rawPrompt)}
                    className="flex items-center justify-center gap-1.5 h-8 px-4 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    {isLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Improving...</>
                    ) : (
                      <><Zap size={14} className="fill-white" /> Improve Prompt</>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Right Panel: Output Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative min-h-[500px]">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Prompt
              </h3>

              {outputPrompt && (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-1.5 mr-2">
                    <span className="text-xs font-normal text-slate-400">Quality</span>
                    <span className="text-xs font-medium text-green-500">Professional</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-xs font-bold"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-500" /> <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Prompt
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-transparent relative">
              {!outputPrompt && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50">
                  <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center mb-4">
                    <Wand2 size={32} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 max-w-sm">
                    You haven&apos;t formulated any prompt yet. Fill the components on the left and click <strong className="text-slate-700 dark:text-slate-300">&quot;IMPROVE PROMPT&quot;</strong> to launch prompt innovation.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white/80 dark:bg-[#111]/80 backdrop-blur-sm z-10">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse" style={{ backgroundColor: persona.theme.primary }}></div>
                    <Loader2 size={40} className="animate-spin relative z-10" style={{ color: persona.theme.primary }} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 animate-pulse">Constructing Mega-Prompt...</p>
                  <p className="text-xs text-slate-500 mt-1">Applying PTCF framework</p>
                </div>
              )}

              {outputPrompt && (
                <div className="w-full text-slate-800 dark:text-slate-200">
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed p-0 bg-transparent border-0 text-slate-800 dark:text-slate-200">
                    {outputPrompt}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer Stats */}
            {outputPrompt && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>{outputPrompt.length} Total Characters</span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" /> {filledComponents}/4 Components Fulfilled
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


