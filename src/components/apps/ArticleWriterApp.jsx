import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useState, useEffect, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Loader2, Copy, Check, Sparkles, Globe, Type, Image as ImageIcon, X, FileText, LayoutTemplate, Megaphone, ReceiptText, User, Cpu, Wand2 } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
 
export default function ArticleWriterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('articlewriter_state', {
		inputText: '',
		outputText: '',
		selectedMedia: 'medium',
		selectedLength: 'medium',
		selectedPerspective: 'neutral',
		selectedHumanizer: 'subtle'
	});
	const { inputText, outputText, selectedMedia, selectedLength, selectedPerspective, selectedHumanizer } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedMedia = (val) => setState(prev => ({ ...prev, selectedMedia: typeof val === 'function' ? val(prev.selectedMedia) : val }));
	const setSelectedLength = (val) => setState(prev => ({ ...prev, selectedLength: typeof val === 'function' ? val(prev.selectedLength) : val }));
	const setSelectedPerspective = (val) => setState(prev => ({ ...prev, selectedPerspective: typeof val === 'function' ? val(prev.selectedPerspective) : val }));
	const setSelectedHumanizer = (val) => setState(prev => ({ ...prev, selectedHumanizer: typeof val === 'function' ? val(prev.selectedHumanizer) : val }));

	const [imageFile, setImageFile] = useState(null);
	const fileInputRef = useRef(null);
 
	const [isLoading, setIsLoading] = useState(false);
	const { copied, copy } = useCopyToClipboard();

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

	const [isDragging, setIsDragging] = useState(false);

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

	const mediaStyles = [
		{ value: 'medium', label: 'Medium.com Blog', icon: FileText, prompt: 'Write in an engaging, thought-provoking, and slightly personal blog format typical of top writers on Medium.com. Use clear headings, bullet points, and an inviting tone.' },
		{ value: 'forbes', label: 'Forbes / Business', icon: LayoutTemplate, prompt: 'Write in a highly professional, authoritative, and analytical tone typical of Forbes or Harvard Business Review. Focus on data, business implications, and industry trends.' },
		{ value: 'buzzfeed', label: 'BuzzFeed / Pop', icon: Sparkles, prompt: 'Write in a highly engaging, pop-culture-infused, and slightly dramatic tone typical of BuzzFeed. Use catchy subheadings, relatable scenarios, and internet slang.' },
		{ value: 'vice', label: 'Vice / Edgy', icon: Megaphone, prompt: 'Write in an edgy, investigative, and raw tone typical of Vice News. Do not shy away from controversial or gritty angles.' },
		{ value: 'wikipedia', label: 'Wikipedia / Academic', icon: Globe, prompt: 'Write in a strictly neutral, academic, and encyclopedia format. Do not use any first-person pronouns. Use formal citations or "history" structures.' },
		{ value: 'storytelling', label: 'Narrative Storytelling', icon: Type, prompt: 'Write the article as a compelling narrative story. Use vivid imagery, character arcs, and a strong hook to draw the reader in emotionally.' }
	];

	const lengths = [
		{ value: 'short', label: 'Short (~300 words)', icon: Type },
		{ value: 'medium', label: 'Medium (~600 words)', icon: Type },
		{ value: 'long', label: 'Long (1000+ words)', icon: Type },
		{ value: 'epic', label: 'Epic (2000+ words)', icon: Type }
	];

	const perspectives = [
		{ value: 'neutral', label: 'Neutral & Objective', icon: ReceiptText },
		{ value: 'opinionated', label: 'Opinionated & Strong', icon: ReceiptText },
		{ value: 'persuasive', label: 'Persuasive (Sales)', icon: ReceiptText },
		{ value: 'first_person', label: 'First-Person (I/We)', icon: ReceiptText }
	];

	const humanizers = [
		{ value: 'none', label: 'Standard AI', icon: Cpu },
		{ value: 'subtle', label: 'Subtle Human Touch', icon: User },
		{ value: 'conversational', label: 'Highly Conversational', icon: User },
		{ value: 'raw', label: 'Raw & Imperfect', icon: User }
	];

	const handleGenerate = async () => {
		if (!inputText.trim() && !imageFile) return;

		setIsLoading(true);
		const activeMediaObj = mediaStyles.find(a => a.value === selectedMedia);

		let lengthPrompt = '';
		switch (selectedLength) {
			case 'short': lengthPrompt = 'Length target: Approximately 300 words. Keep it very concise.'; break;
			case 'medium': lengthPrompt = 'Length target: Approximately 600 words. Provide a balanced, mid-length article.'; break;
			case 'long': lengthPrompt = 'Length target: Over 1000 words. Provide deep, comprehensive analysis and multiple subsections.'; break;
			case 'epic': lengthPrompt = 'Length target: Over 2000 words. Write an ultimate guide or masterclass level article. Go extremely deep.'; break;
			default: lengthPrompt = ''; break;
		}

		let perspectivePrompt = '';
		switch (selectedPerspective) {
			case 'opinionated': perspectivePrompt = 'Take a strong, opinionated stance on this topic. Do not be completely neutral.'; break;
			case 'persuasive': perspectivePrompt = 'Write persuasively. Try to convince the reader to take action or agree with your viewpoint.'; break;
			case 'first_person': perspectivePrompt = 'Write from a first-person perspective ("I", "me", "my experience"). Make it sound like a personal recount.'; break;
			case 'neutral':
			default: perspectivePrompt = 'Maintain a neutral, objective, and unbiased perspective.'; break;
		}

		let humanizerPrompt = '';
		switch (selectedHumanizer) {
			case 'subtle': humanizerPrompt = 'To bypass AI detectors, use a moderate amount of burstiness (varying sentence lengths). Avoid overused AI words like "delve", "testament", "tapestry", "moreover", "crucial".'; break;
			case 'conversational': humanizerPrompt = 'Write as if you are talking to a friend over coffee. Use conversational transitions, occasional rhetorical questions, and very high burstiness. NEVER sound robotic or use overly academic AI jargon.'; break;
			case 'raw': humanizerPrompt = 'Make the writing extremely raw, human, and slightly imperfect. It should read like a passionate Reddit post or a raw journal entry. High burstiness, high perplexity.'; break;
			case 'none':
			default: humanizerPrompt = 'Use standard high-quality AI phrasing.'; break;
		}

		const systemPrompt = `You are an elite ghostwriter and journalist. The user has provided a core topic, keywords, or rough notes: "${inputText || 'See attached image'}".
${imageFile ? 'The user has also attached an image. Please analyze the image carefully to understand the context and incorporate details from it into your article.' : ''}

Your primary task is to write a full article.
STYLE INSTRUCTION: ${activeMediaObj.prompt}
${lengthPrompt}
${perspectivePrompt}
ANTI-AI CLOAKING INSTRUCTION: ${humanizerPrompt}

CRITICAL FORMATTING:
- Write the article in markdown format.
- DO NOT use long em-dashes (—). If you need a dash, use a normal short hyphen (-).
- Output ONLY the requested article. Do NOT include any conversational filler before or after the text.`;

		try {
			const result = await generateUtilityResponse(inputText || "Write an article based on this image", systemPrompt, imageFile);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to write article. Please check API key.");
		} finally {
			setIsLoading(false);
		}
	};

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
							<FileText className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Article Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Media Style</label>
							<CustomSelect
								value={selectedMedia}
								onChange={setSelectedMedia}
								themeColor={persona.theme.primary}
								options={mediaStyles}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Length Target</label>
							<CustomSelect
								value={selectedLength}
								onChange={setSelectedLength}
								themeColor={persona.theme.primary}
								options={lengths}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Angle / Perspective</label>
							<CustomSelect
								value={selectedPerspective}
								onChange={setSelectedPerspective}
								themeColor={persona.theme.primary}
								options={perspectives}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Humanizer (Bypass AI)</label>
							<CustomSelect
								value={selectedHumanizer}
								onChange={setSelectedHumanizer}
								themeColor={persona.theme.primary}
								options={humanizers}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleGenerate}
							disabled={!inputText && !imageFile}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="WRITE ARTICLE"
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
						className={`lg:flex-1 flex flex-col rounded-xl border overflow-hidden relative transition-all ${isDragging
								? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5"
								: "bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10"
							}`}
						style={isDragging ? { "--color-brand-primary": persona.theme.primary } : {}}
					>
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<FileText className="w-4 h-4 text-slate-400" /> Topic / Keywords
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
							placeholder="Enter your topic, keywords, or rough notes here..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Article
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
									<p className="text-sm font-medium animate-pulse">Drafting your article...</p>
								</div>
							) : (
								<div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px]">
									{outputText ? (
										<div dangerouslySetInnerHTML={{
											__html: outputText
												.replace(/—/g, ' - ')
												.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
												.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
												.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
												.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
												.replace(/\*(.*?)\*/g, '<em>$1</em>')
												.replace(/\n\n/g, '<br/><br/>')
												.replace(/\n/g, '<br/>')
										}} />
									) : (
										<span className="text-slate-400 italic">Your generated article will appear here...</span>
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