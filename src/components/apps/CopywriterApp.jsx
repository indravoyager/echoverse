import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useState, useEffect, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, MessageSquare, Mail, PenTool, LayoutTemplate, Sparkles, Globe, Type, Image as ImageIcon, X, ShoppingBag, FileText, Video, Search, Megaphone, ReceiptText } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
 
export default function CopywriterApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('copywriter_state', {
		inputText: '',
		outputText: '',
		selectedAction: 'social',
		selectedStyle: 'default',
		selectedLanguage: 'id',
		selectedEmoji: 'auto'
	});
	const { inputText, outputText, selectedAction, selectedStyle, selectedLanguage, selectedEmoji } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedAction = (val) => setState(prev => ({ ...prev, selectedAction: typeof val === 'function' ? val(prev.selectedAction) : val }));
	const setSelectedStyle = (val) => setState(prev => ({ ...prev, selectedStyle: typeof val === 'function' ? val(prev.selectedStyle) : val }));
	const setSelectedLanguage = (val) => setState(prev => ({ ...prev, selectedLanguage: typeof val === 'function' ? val(prev.selectedLanguage) : val }));
	const setSelectedEmoji = (val) => setState(prev => ({ ...prev, selectedEmoji: typeof val === 'function' ? val(prev.selectedEmoji) : val }));

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

	const actions = [
		{ value: 'social', label: 'Social Media Post', icon: MessageSquare, prompt: 'Write an engaging, highly shareable social media post about the topic. Include relevant hashtags. Make it conversational and hook the reader immediately.' },
		{ value: 'email', label: 'Email Newsletter', icon: Mail, prompt: 'Write a persuasive email newsletter about the topic. Include a catchy subject line, a strong opening hook, clear body paragraphs providing value, and a strong Call-To-Action (CTA) at the end.' },
		{ value: 'ad', label: 'Facebook/IG Ad Copy', icon: PenTool, prompt: 'Write a high-converting Facebook/Instagram ad copy for the topic. Use the AIDA framework (Attention, Interest, Desire, Action). Keep it punchy and persuasive.' },
		{ value: 'landing', label: 'Landing Page Hero', icon: LayoutTemplate, prompt: 'Write the hero section copy for a landing page based on the topic. Provide a Main Headline (H1), a Subheadline (H2), and 3 bullet points highlighting the main benefits, plus a strong CTA button text.' },
		{ value: 'product', label: 'Product Description', icon: ShoppingBag, prompt: 'Write a compelling product description that highlights features, benefits, and solves a customer pain point. Make it persuasive and SEO-friendly.' },
		{ value: 'blog_outline', label: 'Blog Post Outline', icon: FileText, prompt: 'Create a comprehensive and well-structured blog post outline about the topic. Include a catchy title, introduction points, several main heading sections with sub-points, and a conclusion.' },
		{ value: 'video_script', label: 'Video/YouTube Script', icon: Video, prompt: 'Write an engaging video script for YouTube or TikTok about the topic. Include visual/audio cues in brackets [], a strong 5-second hook, high-value content, and a clear call-to-action to subscribe/like.' },
		{ value: 'seo_meta', label: 'SEO Meta Description', icon: Search, prompt: 'Write an SEO-optimized meta title (under 60 characters) and meta description (under 160 characters) for a page about the topic. Include a call to action to click.' },
		{ value: 'press', label: 'Press Release', icon: Megaphone, prompt: 'Write a formal, journalistic press release announcing news about the topic. Use the standard inverted pyramid structure: an attention-grabbing headline, dateline, strong lead paragraph, body details with quotes, and a boilerplate ending.' },
		{ value: 'sales', label: 'Sales Page Copy', icon: ReceiptText, prompt: 'Write persuasive sales page copy. Use the PAS (Problem-Agitate-Solve) formula. Describe the customer pain point, agitate it, present the topic as the perfect solution, and end with a strong offer and CTA.' }
	];

	const styles = [
		{ value: 'default', label: 'Default / Standard', icon: Type },
		{ value: 'short', label: 'Short & Punchy', icon: Type },
		{ value: 'long', label: 'Detailed & Comprehensive', icon: Type },
		{ value: 'humorous', label: 'Funny & Humorous', icon: Type },
		{ value: 'urgent', label: 'Urgent & Action-Oriented', icon: Type }
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

	const emojiOptions = [
		{ value: 'auto', label: 'Auto (AI Choice)', icon: Sparkles },
		{ value: 'lots', label: 'Lots of Emojis', icon: Sparkles },
		{ value: 'few', label: 'Few Emojis', icon: Sparkles },
		{ value: 'none', label: 'No Emojis', icon: Sparkles }
	];

	const handleGenerate = async () => {
		if (!inputText.trim()) return;

		setIsLoading(true);
		const activeActionObj = actions.find(a => a.value === selectedAction);
		const activeLangObj = languages.find(l => l.value === selectedLanguage);

		let stylePrompt = '';
		switch (selectedStyle) {
			case 'short': stylePrompt = 'Make the copy very short, punchy, and to the point. Keep sentences brief.'; break;
			case 'long': stylePrompt = 'Make the copy detailed, comprehensive, and elaborate extensively on the points.'; break;
			case 'humorous': stylePrompt = 'Make the tone witty, funny, and humorous. Use jokes or clever puns if appropriate.'; break;
			case 'urgent': stylePrompt = 'Use urgent, action-oriented language. Create a strong sense of FOMO (Fear Of Missing Out).'; break;
			default: stylePrompt = 'Use a standard, engaging tone.'; break;
		}

		let emojiPrompt = '';
		switch (selectedEmoji) {
			case 'lots': emojiPrompt = 'Use a lot of relevant emojis throughout the text to make it highly engaging and colorful.'; break;
			case 'few': emojiPrompt = 'Use only a few subtle emojis, keep it minimal.'; break;
			case 'none': emojiPrompt = 'CRITICAL: DO NOT use any emojis at all. Keep the text completely free of emojis.'; break;
			default: emojiPrompt = 'Use emojis naturally where appropriate.'; break;
		}

		const systemPrompt = `You are a world-class, highly-paid direct response copywriter. The user has provided a base topic or product description: "${inputText || 'See attached image'}".
${imageFile ? 'The user has also attached an image. Please analyze the image carefully to understand the product/context and incorporate details from it into your copy.' : ''}

Your task is to: ${activeActionObj.prompt}

TONE AND STYLE:
${stylePrompt}
${emojiPrompt}

TARGET LANGUAGE:
Write the entire copy in ${activeLangObj.label}.

CRITICAL FORMATTING INSTRUCTIONS:
- Keep the generated copy relatively concise and strictly tailored to the requested format (e.g. social media posts should not be an essay).
- Format the output nicely using Markdown.
- Use bold text for emphasis, subject lines, or headlines.
- Output ONLY the requested copy. Do NOT include any introductory or concluding conversational text like "Here is the copy you requested:"`;

		try {
			const result = await generateUtilityResponse(inputText || "Tolong buatkan copy untuk gambar ini", systemPrompt, imageFile);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to generate copy. Please check API key.");
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
							<PenTool className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Copywrite Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Select Copy Format</label>
							<CustomSelect
								value={selectedAction}
								onChange={setSelectedAction}
								themeColor={persona.theme.primary}
								options={actions}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tone / Style</label>
							<CustomSelect
								value={selectedStyle}
								onChange={setSelectedStyle}
								themeColor={persona.theme.primary}
								options={styles}
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
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Emoji</label>
							<CustomSelect
								value={selectedEmoji}
								onChange={setSelectedEmoji}
								themeColor={persona.theme.primary}
								options={emojiOptions}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleGenerate}
							disabled={!inputText && !imageFile}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="COPYWRITE"
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
								<FileText className="w-4 h-4 text-slate-400" /> Product / Topic Info
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
							placeholder="Describe your product, service, or drag and drop an image here..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Copy
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
									<p className="text-sm font-medium animate-pulse">Crafting persuasive copy...</p>
								</div>
							) : (
								<div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px]">
									{outputText ? (
										<div dangerouslySetInnerHTML={{
											__html: outputText
												.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
												.replace(/\*(.*?)\*/g, '<em>$1</em>')
												.replace(/\n\n/g, '<br/><br/>')
												.replace(/\n/g, '<br/>')
										}} />
									) : (
										<span className="text-slate-400 italic">Your generated copy will appear here...</span>
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