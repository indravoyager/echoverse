import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { ArrowRightLeft, Loader2, Copy, Check, Languages, Type, Briefcase, Smile, Zap, Feather, Globe, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function TranslatorApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('translator_state', {
		inputText: '',
		outputText: '',
		targetLang: 'English',
		tone: 'Normal'
	});
	const { inputText, outputText, targetLang, tone } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setTargetLang = (val) => setState(prev => ({ ...prev, targetLang: typeof val === 'function' ? val(prev.targetLang) : val }));
	const setTone = (val) => setState(prev => ({ ...prev, tone: typeof val === 'function' ? val(prev.tone) : val }));

	const [imageFile, setImageFile] = useState(null);
	const fileInputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

	const [isLoading, setIsLoading] = useState(false);

	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			setImageFile({
				data: event.target.result.split(',')[1],
				mimeType: file.type,
				name: file.name,
				url: event.target.result
			});
		};
		reader.readAsDataURL(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (!file || !file.type.startsWith('image/')) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			setImageFile({
				data: event.target.result.split(',')[1],
				mimeType: file.type,
				name: file.name,
				url: event.target.result
			});
		};
		reader.readAsDataURL(file);
	};

	const handleTranslate = async () => {
		if (!inputText.trim() && !imageFile) return;

		setIsLoading(true);
		let toneInstruction = '';
		switch (tone) {
			case 'Normal':
				toneInstruction = 'Use a natural, highly accurate, and fluid tone. If translating songs or poetry, capture the underlying meaning naturally rather than translating word-for-word literally. Do NOT invent proper nouns or names from literal nouns (e.g., do not translate literal words as names like "Kira"). The translation must flow well and make sense in everyday language.';
				break;
			case 'Formal':
				toneInstruction = 'Use a highly professional, polite, and academic tone suitable for business or official documents.';
				break;
			case 'Casual':
				toneInstruction = 'Use a relaxed, friendly, and everyday conversational tone, as if texting a close friend.';
				break;
			case 'Slang':
				toneInstruction = 'Use internet slang, highly informal words, and Gen-Z terminology. Make it sound very modern.';
				break;
			case 'Poetic':
				toneInstruction = 'Use beautiful, elegant, and artistic language. Focus on rhyme, rhythm, and profound vocabulary. Perfect for translating songs, poems, or literature.';
				break;
			default:
				toneInstruction = `The tone MUST be ${tone}.`;
		}

		const systemPrompt = `You are an expert bilingual translator. Translate the given text ${imageFile ? 'contained in the attached image (and any accompanying input text)' : ''} to ${targetLang}.
Tone and Style Instructions: ${toneInstruction}

CRITICAL INSTRUCTION: You MUST strictly preserve the original line breaks, paragraph structure, and formatting exactly as they appear in the input/image. If the input is song lyrics with multiple lines, output the translation with the exact same line breaks. DO NOT merge lines into a single paragraph.
Output ONLY the translated text without any conversational filler, quotes, or explanations. 
CRITICAL: Do NOT use any em-dashes (—) or en-dashes (–) in your output. Use standard normal hyphens (-) or normal punctuation instead.`;

		try {
			const result = await generateUtilityResponse(inputText || "Translate the text in the attached image", systemPrompt, imageFile);
			const sanitized = result.replace(/[—–]/g, '-');
			setOutputText(sanitized);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to translate. Please check API key.");
		} finally {
			setIsLoading(false);
		}
	};

	const { copied, copy } = useCopyToClipboard();
	const copyToClipboard = () => copy(outputText);

	const handleReset = () => {
		setInputText('');
		setOutputText('');
		setImageFile(null);
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
							<Languages className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Translation Settings
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
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tone / Style</label>
							<CustomSelect
								value={tone}
								onChange={setTone}
								themeColor={persona.theme.primary}
								options={[
									{ value: 'Normal', label: 'Normal', icon: Type },
									{ value: 'Formal', label: 'Formal', icon: Briefcase },
									{ value: 'Casual', label: 'Casual', icon: Smile },
									{ value: 'Slang', label: 'Slang', icon: Zap },
									{ value: 'Poetic', label: 'Poetic', icon: Feather }
								]}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleTranslate}
							disabled={!inputText && !imageFile}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={ArrowRightLeft}
							label="TRANSLATE"
						/>
					</div>
				</div>
			}
			mainContent={
				<div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
					{/* Input */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={clsx(
							"lg:flex-1 flex flex-col rounded-xl border overflow-hidden custom-scrollbar transition-all bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10",
							isDragging && "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5"
						)}
						style={isDragging ? { "--color-brand-primary": persona.theme.primary } : {}}
					>
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Globe className="w-4 h-4 text-slate-400" /> Input Text
							</h3>
							<div className="flex items-center gap-2">
								<input
									type="file"
									accept="image/*"
									ref={fileInputRef}
									onChange={handleImageUpload}
									className="hidden"
								/>
								<Button
									variant="icon"
									onClick={() => fileInputRef.current?.click()}
									icon={ImageIcon}
									title="Upload Image"
								/>
							</div>
						</div>
						{imageFile && (
							<div className="px-4 pt-3 pb-1 shrink-0">
								<div className="relative inline-block group">
									<img src={imageFile.url} alt="Uploaded preview" className="h-16 w-auto rounded-md border border-slate-200 dark:border-white/10 object-cover" />
									<button
										onClick={() => setImageFile(null)}
										className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
										title="Remove image"
									>
										<X size={12} />
									</button>
								</div>
							</div>
						)}
						<textarea
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Type or paste text to translate..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Translation Result
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
						<div className="flex-1 p-4 overflow-y-auto min-h-[200px]">
							{isLoading ? (
								<div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
									<Loader2 size={32} className="animate-spin text-[var(--color-brand-primary)]" style={{ "--color-brand-primary": persona.theme.primary }} />
									<p className="text-sm font-medium animate-pulse">Translating...</p>
								</div>
							) : (
								<p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-[13px]">
									{outputText || <span className="text-slate-400 italic">Translation will appear here...</span>}
								</p>
							)}
						</div>
					</div>
				</div>
			}
		/>
	);
}
