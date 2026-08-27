import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, Sparkles, Smile, Laugh, Shield, Briefcase, Zap, Feather, Building2, Globe, FileText } from 'lucide-react';
 
export default function ToneShifterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('tone_shifter_state', {
		inputText: '',
		outputText: '',
		selectedTone: 'friendly',
		targetLang: 'Original Language'
	});
	const { inputText, outputText, selectedTone, targetLang } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedTone = (val) => setState(prev => ({ ...prev, selectedTone: typeof val === 'function' ? val(prev.selectedTone) : val }));
	const setTargetLang = (val) => setState(prev => ({ ...prev, targetLang: typeof val === 'function' ? val(prev.targetLang) : val }));

	const [isLoading, setIsLoading] = useState(false);

	const tones = [
		{ value: 'assertive', label: 'Assertive', icon: Shield, prompt: 'Rewrite the following text to sound highly firm, confident, assertive, authoritative, and direct while remaining respectful.' },
		{ value: 'formal', label: 'Formal', icon: Briefcase, prompt: 'Rewrite the following text to sound highly professional, polite, formal, and suitable for business communication.' },
		{ value: 'friendly', label: 'Friendly', icon: Smile, prompt: 'Rewrite the following text to sound highly friendly, warm, casual, approachable, and empathetic.' },
		{ value: 'linkedin', label: 'LinkedIn', icon: Building2, prompt: 'Rewrite the following text to sound professional, highly motivational, inspiring, positive, and optimized for professional networks like LinkedIn. Use impactful language, avoid jargon, and make it feel human yet polished.' },
		{ value: 'persuasive', label: 'Persuasive', icon: Sparkles, prompt: 'Rewrite the following text to sound highly persuasive, compelling, engaging, and perfect for convincing someone or marketing.' },
		{ value: 'poetic', label: 'Poetic', icon: Feather, prompt: 'Rewrite the following text to sound beautiful, poetic, and highly elegant.' },
		{ value: 'sarcastic', label: 'Sarcastic', icon: Laugh, prompt: 'Rewrite the following text to sound witty, highly sarcastic, humorous, and sharp, with a clever genius attitude.' },
		{ value: 'slang', label: 'Slang', icon: Zap, prompt: 'Rewrite the following text using clean modern slang and dynamic expressions.' }
	];

	const handleShift = async () => {
		if (!inputText.trim()) return;

		setIsLoading(true);
		const activeToneObj = tones.find(t => t.value === selectedTone);

		let languageInstruction = '';
		if (targetLang !== 'Original Language') {
			languageInstruction = ` Translate the output into ${targetLang}.`;
		}

		const systemPrompt = `You are an expert AI Conversational Tone Shifter. ${activeToneObj.prompt}${languageInstruction} Maintain a first-person point of view (e.g., "I", "me", "my", "we") if appropriate, or strictly match the point of view used in the original text. Output ONLY the final processed text without any conversational filler, quotes, or explanations. CRITICAL: Do NOT use any em-dashes (—) or en-dashes (–) in your output. Use standard normal hyphens (-) or normal punctuation instead.`;

		try {
			const result = await generateUtilityResponse(inputText, systemPrompt);
			const sanitized = result.replace(/[—–]/g, '-');
			setOutputText(sanitized);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to shift tone. Please check API key.");
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
							<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Tone Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Language</label>
							<CustomSelect
								value={targetLang}
								onChange={setTargetLang}
								themeColor={persona.theme.primary}
								options={[
									{ value: 'Original Language', label: 'Original Language', icon: Globe },
									{ value: 'English', label: 'English', icon: Globe },
									{ value: 'Indonesian', label: 'Indonesian', icon: Globe },
									{ value: 'Japanese', label: 'Japanese', icon: Globe },
									{ value: 'Korean', label: 'Korean', icon: Globe },
									{ value: 'Mandarin', label: 'Mandarin', icon: Globe },
									{ value: 'Spanish', label: 'Spanish', icon: Globe }
								]}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Select Target Tone</label>
							<CustomSelect
								value={selectedTone}
								onChange={setSelectedTone}
								themeColor={persona.theme.primary}
								options={tones}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleShift}
							disabled={!inputText}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="SHIFT TONE"
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
							placeholder="Type or paste the message you want to shift tone..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Converted Result
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
									<p className="text-sm font-medium animate-pulse">Shifting Tone...</p>
								</div>
							) : (
								<p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-[13px]">
									{outputText || <span className="text-slate-400 italic">Shifted message will appear here...</span>}
								</p>
							)}
						</div>
					</div>
				</div>
			}
		/>
	);
}