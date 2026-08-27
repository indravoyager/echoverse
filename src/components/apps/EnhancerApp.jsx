import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, Scissors, Sparkles, AlignLeft, Maximize, CheckCircle2, FileText } from 'lucide-react';
 
export default function EnhancerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('enhancer_state', {
		inputText: '',
		outputText: '',
		selectedAction: 'grammar'
	});
	const { inputText, outputText, selectedAction } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedAction = (val) => setState(prev => ({ ...prev, selectedAction: typeof val === 'function' ? val(prev.selectedAction) : val }));

	const [isLoading, setIsLoading] = useState(false);

	const actions = [
		{ value: 'grammar', label: 'Fix Grammar', icon: CheckCircle2, prompt: 'Fix all grammar and spelling errors in the following text. Do not change the meaning or tone, just make it grammatically perfect.' },
		{ value: 'professional', label: 'Make Professional', icon: AlignLeft, prompt: 'Rewrite the following text to sound highly professional, polite, and suitable for business communication.' },
		{ value: 'summarize', label: 'Summarize', icon: Scissors, prompt: 'Summarize the following text into key bullet points. Keep it concise and easy to read.' },
		{ value: 'expand', label: 'Expand', icon: Maximize, prompt: 'Expand the following text by adding more detail, descriptive language, and elaboration. Make it longer and more engaging.' }
	];

	const handleEnhance = async () => {
		if (!inputText.trim()) return;

		setIsLoading(true);
		const activeActionObj = actions.find(a => a.value === selectedAction);
		const systemPrompt = `You are an expert AI Text Enhancer. ${activeActionObj.prompt} Output ONLY the final processed text without any conversational filler, quotes, or explanations. CRITICAL: Do NOT use any em-dashes (—) or en-dashes (–) in your output. Use standard normal hyphens (-) or normal punctuation instead.`;

		try {
			const result = await generateUtilityResponse(inputText, systemPrompt);
			const sanitized = result.replace(/[—–]/g, '-');
			setOutputText(sanitized);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to process text. Please check API key.");
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
							<Wand2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Enhancer Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Select Action</label>
							<CustomSelect
								value={selectedAction}
								onChange={setSelectedAction}
								themeColor={persona.theme.primary}
								options={actions}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleEnhance}
							disabled={!inputText}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="ENHANCE"
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
								<FileText className="w-4 h-4 text-slate-400" /> Original Text
							</h3>
						</div>
						<textarea
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Type or paste text to improve..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Enhanced Result
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
									<p className="text-sm font-medium animate-pulse">Enhancing...</p>
								</div>
							) : (
								<p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-[13px]">
									{outputText || <span className="text-slate-400 italic">Enhanced text will appear here...</span>}
								</p>
							)}
						</div>
					</div>
				</div>
			}
		/>
	);
}