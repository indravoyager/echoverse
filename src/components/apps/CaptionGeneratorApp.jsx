import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useState, useEffect, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, MessageSquare, Sparkles, Camera, Video, Briefcase, Smile, Heart, ShoppingBag, AlignLeft, AlignJustify, Type, Image as ImageIcon, X, FileText } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
 
export default function CaptionGeneratorApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('captiongenerator_state', {
		inputText: '',
		outputText: '',
		selectedPlatform: 'instagram',
		selectedStyle: 'aesthetic',
		selectedLength: 'medium',
		includeEmojis: 'yes'
	});
	const { inputText, outputText, selectedPlatform, selectedStyle, selectedLength, includeEmojis } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedPlatform = (val) => setState(prev => ({ ...prev, selectedPlatform: typeof val === 'function' ? val(prev.selectedPlatform) : val }));
	const setSelectedStyle = (val) => setState(prev => ({ ...prev, selectedStyle: typeof val === 'function' ? val(prev.selectedStyle) : val }));
	const setSelectedLength = (val) => setState(prev => ({ ...prev, selectedLength: typeof val === 'function' ? val(prev.selectedLength) : val }));
	const setIncludeEmojis = (val) => setState(prev => ({ ...prev, includeEmojis: typeof val === 'function' ? val(prev.includeEmojis) : val }));

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

	const platforms = [
		{ value: 'instagram', label: 'Instagram', icon: Camera },
		{ value: 'tiktok', label: 'TikTok', icon: Video },
		{ value: 'twitter', label: 'Twitter / X', icon: MessageSquare },
		{ value: 'linkedin', label: 'LinkedIn', icon: Briefcase }
	];

	const styles = [
		{ value: 'aesthetic', label: 'Aesthetic / Minimalist', icon: Sparkles },
		{ value: 'funny', label: 'Funny / Relatable', icon: Smile },
		{ value: 'storytelling', label: 'Storytelling / Emotional', icon: Heart },
		{ value: 'professional', label: 'Professional / Business', icon: Briefcase },
		{ value: 'hard_sell', label: 'Hard Sell / Promo', icon: ShoppingBag }
	];

	const lengths = [
		{ value: 'short', label: 'Short (1-2 sentences)', icon: AlignLeft },
		{ value: 'medium', label: 'Medium (1-2 paragraphs)', icon: AlignJustify },
		{ value: 'long', label: 'Long (Detailed Story)', icon: Type }
	];

	const emojiOptions = [
		{ value: 'yes', label: 'Yes, please 🎉', icon: Smile },
		{ value: 'no', label: 'No emojis', icon: X }
	];

	const handleGenerate = async () => {
		if (!inputText.trim() && !imageFile) return;

		setIsLoading(true);

		const activePlatform = platforms.find(p => p.value === selectedPlatform).label;
		const activeStyle = styles.find(s => s.value === selectedStyle).label;
		const activeLength = lengths.find(l => l.value === selectedLength).label;

		const systemPrompt = `You are an expert social media manager and viral content creator. The user has provided a base topic, description, or image for a social media post: "${inputText || 'See attached image'}".
${imageFile ? 'The user has also attached an image. Please analyze the image carefully to understand the context and incorporate details from it into your caption.' : ''}

Your task is to write a highly engaging caption and generate relevant hashtags.

TARGET PLATFORM: ${activePlatform}
TONE/STYLE: ${activeStyle}
LENGTH: ${activeLength}

CRITICAL FORMATTING INSTRUCTIONS:
- Optimize the caption specifically for the Target Platform (e.g., TikTok needs shorter text + viral hashtags, LinkedIn needs professional spacing, Instagram needs good aesthetics and emojis).
- Apply the requested Tone/Style perfectly.
- Ensure the length matches the request.
- Include a good hook at the beginning to stop users from scrolling.
- Include an engaging Call-To-Action (CTA) at the end.
- Add 5-10 highly relevant, mix of popular and niche hashtags at the very bottom.
- ${includeEmojis === 'yes' ? 'Use emojis naturally to enhance the text.' : 'STRICTLY NO EMOJIS. Do not include a single emoji in the output.'}
- Write in Indonesian language (Bahasa Indonesia) perfectly, maintaining the exact requested tone.
- Output ONLY the caption and hashtags. Do NOT include any introductory or concluding conversational text like "Here is your caption:".`;

		try {
			const result = await generateUtilityResponse(inputText || "Tolong buatkan caption untuk gambar ini", systemPrompt, imageFile);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to generate caption. Please check API key.");
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
							<Camera className="w-4 h-4" style={{ color: persona.theme.primary }} />
							Caption Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Platform</label>
							<CustomSelect
								value={selectedPlatform}
								onChange={setSelectedPlatform}
								themeColor={persona.theme.primary}
								options={platforms}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Caption Style</label>
							<CustomSelect
								value={selectedStyle}
								onChange={setSelectedStyle}
								themeColor={persona.theme.primary}
								options={styles}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Desired Length</label>
							<CustomSelect
								value={selectedLength}
								onChange={setSelectedLength}
								themeColor={persona.theme.primary}
								options={lengths}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Include Emojis</label>
							<CustomSelect
								value={includeEmojis}
								onChange={setIncludeEmojis}
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
							label="GENERATE CAPTION"
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
								<FileText className="w-4 h-4 text-slate-400" /> Post Topic / Image
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
							placeholder="Describe your photo, mood, or what you want to say... (You can also drag & drop a photo here)"
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="lg:flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Caption
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
									<p className="text-sm font-medium animate-pulse">Crafting viral caption...</p>
								</div>
							) : (
								<div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[13px] whitespace-pre-wrap">
									{outputText ? outputText : <span className="text-slate-400 italic">Your generated caption and hashtags will appear here...</span>}
								</div>
							)}
						</div>
					</div>
				</div>
			}
		/>
	);
}