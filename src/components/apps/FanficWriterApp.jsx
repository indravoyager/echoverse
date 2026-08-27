import { useState, useEffect, useRef } from 'react';
import { SidebarLayout } from '../theme/SidebarLayout';
import { CustomSelect } from '../theme/CustomSelect';
import { Button } from '../theme/Button';
import { BookOpen, Users, MapPin, PenTool, RotateCcw, Copy, Check, Wand2, Sparkles, Book, Heart, Ghost, Smile, Zap, Coffee, AlignLeft, AlignJustify, BookText, AlertCircle } from 'lucide-react';
import { generateUtilityResponse } from '../../lib/ai';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';

export default function FanficWriterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  // Load state from local storage or set defaults
  const [state, setState] = usePersistedState('fanficwriter_state', {
    characters: '',
    location: '',
    plot: '',
    selectedGenre: 'romance',
    selectedStyle: 'standard',
    selectedLength: 'medium'
  });
  const { characters, location, plot, selectedGenre, selectedStyle, selectedLength } = state;

  const setCharacters = (val) => setState(prev => ({ ...prev, characters: typeof val === 'function' ? val(prev.characters) : val }));
  const setLocation = (val) => setState(prev => ({ ...prev, location: typeof val === 'function' ? val(prev.location) : val }));
  const setPlot = (val) => setState(prev => ({ ...prev, plot: typeof val === 'function' ? val(prev.plot) : val }));
  const setSelectedGenre = (val) => setState(prev => ({ ...prev, selectedGenre: typeof val === 'function' ? val(prev.selectedGenre) : val }));
  const setSelectedStyle = (val) => setState(prev => ({ ...prev, selectedStyle: typeof val === 'function' ? val(prev.selectedStyle) : val }));
  const setSelectedLength = (val) => setState(prev => ({ ...prev, selectedLength: typeof val === 'function' ? val(prev.selectedLength) : val }));

  const [outputText, setOutputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { copied: isCopied, copy } = useCopyToClipboard();
  const resultRef = useRef(null);

  const genres = [
    { value: 'romance', label: 'Romance & Fluff', icon: Heart },
    { value: 'angst', label: 'Angst & Drama', icon: Ghost },
    { value: 'adventure', label: 'Action & Adventure', icon: Zap },
    { value: 'comedy', label: 'Humor & Comedy', icon: Smile },
    { value: 'sliceoflife', label: 'Slice of Life', icon: Coffee }
  ];

  const styles = [
    { value: 'standard', label: 'Standard Fanfic Style', icon: AlignLeft },
    { value: 'descriptive', label: 'Rich & Descriptive', icon: AlignLeft },
    { value: 'fastpaced', label: 'Fast-Paced Action', icon: AlignJustify }
  ];

  const lengths = [
    { value: 'short', label: 'Flash Fiction (~300 words)', icon: AlignLeft },
    { value: 'medium', label: 'One-Shot (~700 words)', icon: AlignLeft },
    { value: 'long', label: 'Extended Chapter (~1200 words)', icon: AlignJustify }
  ];

  const handleGenerate = async () => {
    if (!plot.trim() && !characters.trim()) return;

    setIsGenerating(true);
    setError(null);

    const genrePromptMap = {
      romance: "romantic dynamics, emotional intimacy, fluff, and interpersonal chemistry.",
      angst: "intense emotions, inner conflict, tragic themes, and dramatic tension.",
      adventure: "dynamic action, high stakes, exploration, and heroic journeys.",
      comedy: "witty dialogue, humorous situations, lighthearted banter, and comedic timing.",
      sliceoflife: "cozy atmospheres, everyday interactions, character bonding, and domestic comfort."
    };

    const stylePromptMap = {
      standard: "written in a standard modern fanfiction style with balanced description and dialogue.",
      descriptive: "written with highly detailed descriptions, sensory imagery, and rich prose.",
      fastpaced: "written with punchy sentences, rapid pacing, and a focus on immediate events."
    };

    const lengthPromptMap = {
      short: "Write a short, complete scene of around 300 words.",
      medium: "Write a complete one-shot story of around 700 words.",
      long: "Write an extended, immersive chapter/story of around 1200 words."
    };

    const systemPrompt = `You are a highly creative and expressive Fanfiction Author. Your task is to write a high-quality fanfiction story based on the user's characters, location, and plot details.
    
Genre: ${genres.find(g => g.value === selectedGenre)?.label || 'General'}
Focus on: ${genrePromptMap[selectedGenre] || ''}
Writing Style: ${styles.find(s => s.value === selectedStyle)?.label || 'Standard'}
Style guidelines: ${stylePromptMap[selectedStyle] || ''}
Length: ${lengthPromptMap[selectedLength] || 'Write a detailed story.'}

Ensure the characters feel authentic to the provided descriptions, the setting is atmospheric, and the plot is resolved satisfyingly or leaves a classic fanfiction hook. Use paragraph breaks clearly.`;

    const userPrompt = `Characters: ${characters || 'Unspecified characters'}
Setting/Location: ${location || 'Unspecified location'}
Core Plot / Dynamic: ${plot || 'Write a creative story exploring their interactions.'}`;

    try {
      const response = await generateUtilityResponse(userPrompt, systemPrompt);
      setOutputText(response);

      // Smooth scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError('Failed to generate story. Please verify your connection or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => copy(outputText);

  const handleReset = () => {
    setCharacters('');
    setLocation('');
    setPlot('');
    setOutputText('');
    setError(null);
  };

  return (
    <SidebarLayout
      persona={persona}
      onOpenSidebar={onOpenSidebar}
      onOpenPersonaInfo={onOpenPersonaInfo}
      onReset={handleReset}
      resetLabel="Clear Workspace"
      sidebarContent={
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
          <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
            <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <PenTool className="w-4 h-4 text-slate-400" />
              Story Configuration
            </h3>
          </div>

          <div className="p-3.5 flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Genre</label>
              <CustomSelect
                value={selectedGenre}
                onChange={setSelectedGenre}
                themeColor={persona.theme.primary}
                options={genres}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Writing Style</label>
              <CustomSelect
                value={selectedStyle}
                onChange={setSelectedStyle}
                themeColor={persona.theme.primary}
                options={styles}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Story Length</label>
              <CustomSelect
                value={selectedLength}
                onChange={setSelectedLength}
                themeColor={persona.theme.primary}
                options={lengths}
              />
            </div>

            <Button
              variant="full-action"
              onClick={handleGenerate}
              disabled={!plot.trim() && !characters.trim()}
              isLoading={isGenerating}
              themeColor={persona.theme.primary}
              icon={Wand2}
              label="WRITE STORY"
            />
          </div>
        </div>
      }
      mainContent={
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
          {/* Left Panel: Inputs */}
          <div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4 text-slate-400" /> Characters & Description
              </h3>
            </div>
            <div className="flex flex-col flex-1 divide-y divide-slate-100 dark:divide-white/5">
              <textarea
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="List major characters and their traits (e.g., 'Aria (spirited mage, secretly royalty), Leo (sarcastic swordsman)')..."
                className="flex-1 w-full bg-transparent p-4 text-[13px] leading-relaxed resize-none focus:outline-none custom-scrollbar min-h-[100px] text-slate-800 dark:text-slate-200"
              />

              <div className="p-4 flex flex-col gap-2 shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Setting / Location</label>
                <div className="relative flex items-center">
                  <MapPin size={16} className="absolute left-0 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 'An ancient library at midnight', 'A cozy tea shop'"
                    className="w-full bg-transparent pl-7 pr-2 py-1 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Plot Outline / Prompt</label>
                <textarea
                  value={plot}
                  onChange={(e) => setPlot(e.target.value)}
                  placeholder="Describe the main situation or interaction (e.g., 'Aria is studying a forbidden spellbook, and Leo sneaks in to tease her but notices she looks exhausted')..."
                  className="flex-1 w-full bg-transparent text-[13px] leading-relaxed resize-none focus:outline-none custom-scrollbar min-h-[120px] text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
            {/* Output Header */}
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Story
              </h3>

              {outputText && (
                <Button
                  onClick={handleCopy}
                  variant="reset"
                  icon={isCopied ? Check : Copy}
                  className={isCopied ? "text-green-500 hover:text-green-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}
                  title="Copy to clipboard"
                  label={isCopied ? "Copied!" : ""}
                />
              )}
            </div>

            {/* Output Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" ref={resultRef}>
              {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              ) : outputText ? (
                <div className="whitespace-pre-wrap text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">
                  {outputText}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 opacity-60">
                  <Book size={48} strokeWidth={1} />
                  <p className="text-sm max-w-[250px] text-center">
                    Your story will appear here. Fill in the details on the left and click "Write Story".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
