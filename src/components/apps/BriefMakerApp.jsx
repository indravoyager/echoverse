import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useState, useEffect, useRef } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Loader2, Copy, Check, MessageSquare, Sparkles, Globe, Type, Image as ImageIcon, X, FileText, Video, Megaphone, ReceiptText, User, Wand2, LayoutTemplate } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
 
export default function BriefMakerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('briefmaker_state', {
		inputText: '',
		outputText: '',
		selectedType: 'marketing',
		selectedVibe: 'professional',
		selectedAudience: 'general',
		selectedFormat: 'standard'
	});
	const { inputText, outputText, selectedType, selectedVibe, selectedAudience, selectedFormat } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setSelectedType = (val) => setState(prev => ({ ...prev, selectedType: typeof val === 'function' ? val(prev.selectedType) : val }));
	const setSelectedVibe = (val) => setState(prev => ({ ...prev, selectedVibe: typeof val === 'function' ? val(prev.selectedVibe) : val }));
	const setSelectedAudience = (val) => setState(prev => ({ ...prev, selectedAudience: typeof val === 'function' ? val(prev.selectedAudience) : val }));
	const setSelectedFormat = (val) => setState(prev => ({ ...prev, selectedFormat: typeof val === 'function' ? val(prev.selectedFormat) : val }));

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

	const projectTypes = [
		{ value: 'marketing', label: 'Marketing Campaign', icon: Megaphone, prompt: 'Focus on campaign objectives, messaging, media channels, and expected ROI.' },
		{ value: 'branding', label: 'Logo / Branding', icon: LayoutTemplate, prompt: 'Focus on brand identity, visual guidelines, competitor analysis, and core values.' },
		{ value: 'website', label: 'Website Redesign', icon: Globe, prompt: 'Focus on user experience (UX), technical requirements, site architecture, and conversion goals.' },
		{ value: 'video', label: 'Video Production', icon: Video, prompt: 'Focus on visual storytelling, storyboard elements, required talent/locations, and duration.' },
		{ value: 'social', label: 'Social Media Content', icon: MessageSquare, prompt: 'Focus on content pillars, platform-specific strategies, posting frequency, and engagement goals.' }
	];

	const brandVibes = [
		{ value: 'professional', label: 'Professional & Corporate', icon: ReceiptText },
		{ value: 'playful', label: 'Playful & Fun', icon: Sparkles },
		{ value: 'edgy', label: 'Edgy & Bold', icon: Sparkles },
		{ value: 'minimalist', label: 'Minimalist & Elegant', icon: Type }
	];

	const targetAudiences = [
		{ value: 'general', label: 'Mass Market / General', icon: User },
		{ value: 'genz', label: 'Gen Z (18-24)', icon: User },
		{ value: 'millennials', label: 'Millennials (25-40)', icon: User },
		{ value: 'b2b', label: 'B2B Corporate', icon: User },
		{ value: 'luxury', label: 'High-End / Luxury', icon: User }
	];

	const outputFormats = [
		{ value: 'standard', label: 'Standard Creative Brief', icon: FileText },
		{ value: 'onepager', label: 'One-Pager Summary', icon: FileText },
		{ value: 'presentation', label: 'Presentation Outline', icon: FileText }
	];

	const handleGenerate = async () => {
		if (!inputText.trim() && !imageFile) return;

		setIsLoading(true);
		const activeTypeObj = projectTypes.find(a => a.value === selectedType);
		const activeVibeObj = brandVibes.find(a => a.value === selectedVibe);
		const activeAudienceObj = targetAudiences.find(a => a.value === selectedAudience);
		let formatInstruction = '';
		if (selectedFormat === 'onepager') {
			formatInstruction = 'Keep the entire brief to a single, concise page summary. Focus only on the absolute most important elements.';
		} else if (selectedFormat === 'presentation') {
			formatInstruction = 'Format the brief as a series of presentation slides. Use "Slide 1:", "Slide 2:", etc., with bullet points for each.';
		} else {
			formatInstruction = 'Format as a comprehensive standard creative brief with clear headings (Executive Summary, Target Audience, Key Message, Deliverables, etc).';
		}

		const systemPrompt = `You are a Senior Creative Director at a top-tier agency. The user has provided a raw project idea, concept, or notes: "${inputText || 'See attached image'}".
${imageFile ? 'The user has also attached a reference image. Please incorporate its visual details into the brief.' : ''}

Your task is to write a highly professional Creative Brief for this project.

PROJECT PARAMETERS:
- Project Type: ${activeTypeObj.label}. ${activeTypeObj.prompt}
- Brand Vibe / Tone: ${activeVibeObj.label}
- Target Audience: ${activeAudienceObj.label}

FORMAT INSTRUCTION:
${formatInstruction}

CRITICAL FORMATTING:
- Write the brief in markdown format.
- DO NOT use long em-dashes (—). If you need a dash, use a normal short hyphen (-).
- Output ONLY the requested brief. Do NOT include any conversational filler before or after the text.`;

		try {
			const result = await generateUtilityResponse(inputText || "Write a brief based on this image", systemPrompt, imageFile);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to write brief. Please check API key.");
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
							Brief Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Project Type</label>
							<CustomSelect
								value={selectedType}
								onChange={setSelectedType}
								themeColor={persona.theme.primary}
								options={projectTypes}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Brand Vibe</label>
							<CustomSelect
								value={selectedVibe}
								onChange={setSelectedVibe}
								themeColor={persona.theme.primary}
								options={brandVibes}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Audience</label>
							<CustomSelect
								value={selectedAudience}
								onChange={setSelectedAudience}
								themeColor={persona.theme.primary}
								options={targetAudiences}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Output Format</label>
							<CustomSelect
								value={selectedFormat}
								onChange={setSelectedFormat}
								themeColor={persona.theme.primary}
								options={outputFormats}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleGenerate}
							disabled={!inputText && !imageFile}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label="GENERATE BRIEF"
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
						className={`flex-1 flex flex-col rounded-xl border overflow-hidden relative transition-all ${isDragging
								? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5"
								: "bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10"
							}`}
						style={isDragging ? { "--color-brand-primary": persona.theme.primary } : {}}
					>
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<FileText className="w-4 h-4 text-slate-400" /> Project Idea / Concept
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
							placeholder="Enter your raw project idea, concept, or rough notes here..."
							className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar min-h-[200px]"
						/>
					</div>

					{/* Output */}
					<div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
						<div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
							<h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Generated Brief
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
									<p className="text-sm font-medium animate-pulse">Drafting your brief...</p>
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
										<span className="text-slate-400 italic">Your generated brief will appear here...</span>
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