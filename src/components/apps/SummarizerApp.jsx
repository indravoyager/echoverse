import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, FileText, ListTodo, CheckSquare, List, Sparkles, Globe } from 'lucide-react';
 
export default function SummarizerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('summarizer_state', {
		inputText: '',
		outputText: '',
		format: 'full_minutes',
		language: 'id'
	});
	const { inputText, outputText, format, language } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setFormat = (val) => setState(prev => ({ ...prev, format: typeof val === 'function' ? val(prev.format) : val }));
	const setLanguage = (val) => setState(prev => ({ ...prev, language: typeof val === 'function' ? val(prev.language) : val }));

	const [isLoading, setIsLoading] = useState(false);

	const formats = [
		{ value: 'full_minutes', label: 'Full Minutes (Structured)', icon: FileText, prompt: 'Write a complete, structured meeting minutes document. Include: Meeting Goal, Key Topics Discussed, Decisions Made, and Action Items.' },
		{ value: 'executive', label: 'Executive Summary', icon: ListTodo, prompt: 'Write a concise, high-level executive summary of the meeting. Focus only on the most critical takeaways and outcomes in 1-2 paragraphs.' },
		{ value: 'action_items', label: 'Action Items Only', icon: CheckSquare, prompt: 'Extract ONLY the action items, tasks, and follow-ups mentioned in the text. Format them as a clear checklist with assignees if mentioned.' },
		{ value: 'bullet_points', label: 'Bullet Points', icon: List, prompt: 'Summarize the entire text using simple, easy-to-read bullet points highlighting the main ideas and statements.' }
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

	const handleSummarize = async () => {
		if (!inputText.trim()) return;
		setIsLoading(true);

		const activeFormatObj = formats.find(f => f.value === format);
		const activeLangObj = languages.find(l => l.value === language);

		const systemPrompt = `You are an expert meeting summarizer and administrative assistant. The user will provide raw text, which could be meeting notes, a transcript, or a long document.

Your task is to: ${activeFormatObj.prompt}

TARGET LANGUAGE: Write the entire output in ${activeLangObj.label}.

CRITICAL INSTRUCTIONS:
- Format the output beautifully using Markdown (bolding, headers, bullet points).
- Do NOT include conversational filler like "Here is your summary:" or "I have summarized the text." Output ONLY the requested format.
- Ensure clarity, brevity, and accuracy based strictly on the provided text.`;

		try {
			const result = await generateUtilityResponse(inputText, systemPrompt);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to summarize. Please check your API key.");
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

	const getInputWordCount = () => {
		return inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
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
							<FileText className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Summary Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Summary Format</label>
							<CustomSelect
								value={format}
								onChange={setFormat}
								themeColor={persona.theme.primary}
								options={formats}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Language</label>
							<CustomSelect
								value={language}
								onChange={setLanguage}
								themeColor={persona.theme.primary}
								options={languages}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleSummarize}
							disabled={!inputText}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="SUMMARIZE"
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
								<FileText className="w-4 h-4 text-slate-400" /> Raw Notes / Transcript
							</h3>
						</div>
						<textarea
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Paste raw meeting notes, transcripts, or any long text here to summarize..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
						<div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 text-[11px] font-semibold text-slate-400 text-right shrink-0">
							{getInputWordCount()} words
						</div>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Structured Summary
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
									<p className="text-sm font-medium animate-pulse">Extracting key points...</p>
								</div>
							) : (
								<div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px] break-words">
									{outputText ? (
										<div dangerouslySetInnerHTML={{
											__html: outputText
												.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
												.replace(/\*(.*?)\*/g, '<em>$1</em>')
												.replace(/\n\n/g, '<br/><br/>')
												.replace(/\n/g, '<br/>')
										}} />
									) : (
										<span className="text-slate-400 italic">Generated summary will appear here...</span>
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