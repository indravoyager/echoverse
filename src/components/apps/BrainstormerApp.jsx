import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, PlayCircle, Smartphone, Target, Lightbulb, Sparkles, Globe } from 'lucide-react';
 
export default function BrainstormerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('brainstormer_state', {
		inputText: '',
		outputText: '',
		selectedAction: 'brainstorm',
		selectedLanguage: 'id'
	});
	const { inputText, outputText, selectedAction, selectedLanguage } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedAction = (val) => setState(prev => ({ ...prev, selectedAction: typeof val === 'function' ? val(prev.selectedAction) : val }));
	const setSelectedLanguage = (val) => setState(prev => ({ ...prev, selectedLanguage: typeof val === 'function' ? val(prev.selectedLanguage) : val }));

	const [isLoading, setIsLoading] = useState(false);

	const actions = [
		{ value: 'brainstorm', label: 'General Brainstorm', icon: Lightbulb, prompt: 'Generate 10 highly creative, out-of-the-box ideas related to the topic.' },
		{ value: 'youtube', label: 'YouTube Video Ideas', icon: PlayCircle, prompt: 'Generate 10 viral and engaging YouTube video ideas. Include a catchy title and a short 1-sentence hook for each.' },
		{ value: 'tiktok', label: 'TikTok / Reels Concepts', icon: Smartphone, prompt: 'Generate 10 trendy, fast-paced TikTok/Reels content ideas. Focus on visual hooks and high retention concepts.' },
		{ value: 'marketing', label: 'Marketing Strategies', icon: Target, prompt: 'Generate 10 unique, unconventional guerrilla or digital marketing strategies to promote this topic/product.' }
	];

	const languages = [
		{ value: 'id', label: 'Indonesian', icon: Globe },
		{ value: 'en', label: 'English', icon: Globe },
		{ value: 'es', label: 'Spanish', icon: Globe },
		{ value: 'fr', label: 'French', icon: Globe },
		{ value: 'de', label: 'German', icon: Globe },
		{ value: 'ja', label: 'Japanese', icon: Globe },
		{ value: 'ko', label: 'Korean', icon: Globe },
		{ value: 'zh', label: 'Chinese', icon: Globe }
	];

	const handleGenerate = async () => {
		if (!inputText.trim()) return;

		setIsLoading(true);
		const activeActionObj = actions.find(a => a.value === selectedAction);
		const activeLangObj = languages.find(l => l.value === selectedLanguage);

		const systemPrompt = `You are a world-class creative director and idea generator. The user has provided a base topic: "${inputText}".
Your task is to: ${activeActionObj.prompt}

TARGET LANGUAGE:
Write all generated ideas in ${activeLangObj.label}.

CRITICAL FORMATTING INSTRUCTIONS:
- Do NOT use plain text blocks. Output your response as a well-formatted Markdown list.
- Use bold text for titles or key phrases.
- Keep descriptions punchy, exciting, and highly actionable.
- Output ONLY the ideas without any conversational intro or outro.`;

		try {
			const result = await generateUtilityResponse(inputText, systemPrompt);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to generate ideas. Please check API key.");
		} finally {
			setIsLoading(false);
		}
	};

	const { copied, copy } = useCopyToClipboard();
	const copyToClipboard = () => copy(outputText);

	const handleReset = () => {
		setInputText('');
		setOutputText('');
	};

	return (
		<SidebarLayout
			persona={persona}
			onOpenSidebar={onOpenSidebar}
			onOpenPersonaInfo={onOpenPersonaInfo}
			onReset={handleReset}
			resetLabel="Reset Form"
			sidebarContent={
				<div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
					<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center rounded-t-xl shrink-0">
						<h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
							<Lightbulb className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Brainstorm Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Select Idea Type</label>
							<CustomSelect
								value={selectedAction}
								onChange={setSelectedAction}
								themeColor={persona.theme.primary}
								options={actions}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Language</label>
							<CustomSelect
								value={selectedLanguage}
								onChange={setSelectedLanguage}
								themeColor={persona.theme.primary}
								options={languages}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleGenerate}
							disabled={!inputText}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="BRAINSTORM"
						/>
					</div>
				</div>
			}
			mainContent={
				<div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
					{/* Input */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Lightbulb className="w-4 h-4 text-slate-400" /> Base Topic / Niche
							</h3>
						</div>
						<textarea
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Type your core topic, niche, or problem you want to solve (e.g. 'AI Coding Assistant' or 'Healthy snacks for kids')..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Idea Board
							</h3>
							<Button
								onClick={copyToClipboard}
								variant="reset"
								icon={copied ? Check : Copy}
								className={copied ? "text-green-500 hover:text-green-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}
								title="Copy to clipboard"
								label={copied ? "Copied!" : ""}
							/>
						</div>
						<div className="flex-1 p-4 overflow-y-auto min-h-[200px]">
							{isLoading ? (
								<div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
									<Loader2 size={32} className="animate-spin text-[var(--color-brand-primary)]" style={{ "--color-brand-primary": persona.theme.primary }} />
									<p className="text-sm font-medium animate-pulse">Brainstorming highly creative ideas...</p>
								</div>
							) : (
								<div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px]">
									{outputText ? (
										<div dangerouslySetInnerHTML={{
											__html: outputText
												.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
												.replace(/\*(.*?)\*/g, '<em>$1</em>')
												.replace(/\n\n/g, '<br/><br/>')
												.replace(/\n- /g, '<br/>• ')
										}} />
									) : (
										<span className="text-slate-400 italic">Your generated ideas will appear here...</span>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			}
		/>
	);
}