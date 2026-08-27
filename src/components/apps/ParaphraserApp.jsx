import { CustomSelect } from '../theme/CustomSelect';
import { SidebarLayout } from '../theme/SidebarLayout';
import { Button } from '../theme/Button';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';
import { usePersistedState } from '../theme/usePersistedState';
import { useState, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Wand2, Loader2, Copy, Check, Briefcase, Smile, Feather, Sparkles, Sliders, FileText } from 'lucide-react';
 
export default function ParaphraserApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
	const [state, setState] = usePersistedState('paraphraser_state', {
		inputText: '',
		outputText: '',
		mode: 'humanizer',
		strength: 'medium'
	});
	const { inputText, outputText, mode, strength } = state;

	const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
	const setOutputText = (val) => setState(prev => ({ ...prev, outputText: typeof val === 'function' ? val(prev.outputText) : val }));
	const setMode = (val) => setState(prev => ({ ...prev, mode: typeof val === 'function' ? val(prev.mode) : val }));
	const setStrength = (val) => setState(prev => ({ ...prev, strength: typeof val === 'function' ? val(prev.strength) : val }));

	const [isLoading, setIsLoading] = useState(false);

	const handleParaphrase = async () => {
		if (!inputText.trim()) return;

		setIsLoading(true);

		let baseInstructions = "";
		if (mode === 'humanizer') {
			baseInstructions = `You are a world-class essayist and human writer. Your goal is to rewrite the input text to have extremely high perplexity and burstiness, making it indistinguishable from human-written text and completely immune to AI content detectors (like Turnitin, GPTZero, ZeroGPT, Copyleaks).

To achieve 100% human-like metrics, you must strictly follow these structural and grammatical constraints:
1. **Severe Burstiness (Sentence Length Variance)**:
   - NEVER write sentences of similar lengths back-to-back.
   - You must vary your sentence lengths drastically: write one very short sentence (3-6 words), followed by a medium sentence (10-15 words), followed by a long, complex sentence (20-30 words containing clauses), then another short one.
   - Strict pattern to follow: Short sentence. Long sentence. Medium sentence. Short sentence. Long sentence.
2. **Syntactic Inversion (Clause Restructuring)**:
   - Deeply restructure sentences. Do NOT translate thoughts linearly. Invert the sequence of clauses (e.g., instead of "Pendidikan penting karena mendidik moral", write "Moral seseorang dididik lewat pendidikan, itulah mengapa hal ini krusial").
3. **Sentence Fragments (Kalimat Menggantung Sengaja)**:
   - Intentionally inject 1 or 2 sentence fragments for raw stylistic emphasis (e.g., in English: "A harsh reality.", "Simple, yet powerful."; in Indonesian: "Sebuah fakta tak terbantahkan.", "Sederhana, tapi bermakna.", "Sangat kontras."). AI models strictly avoid fragments, so this completely disrupts AI syntax tree analysis.
4. **Extreme Perplexity & Low-Probability N-grams (Unpredictable Vocabulary)**:
   - Avoid standard, highly predictable word couplings. Swap plain collocations with fresh, descriptive human ones (e.g., instead of "memberikan kontribusi", use "ikut andil"; instead of "memberikan dampak positif", use "membawa angin segar").
   - For English: DO NOT use 'delve', 'tapestry', 'testament', 'furthermore', 'moreover', 'in conclusion', 'not only... but also', 'overall', 'it is important to note', 'leverage', 'robust', 'synergy', 'streamline', 'pave the way'.
   - For Indonesian: JANGAN SEKALI-KALI menggunakan kata 'merupakan', 'adalah', 'di mana', 'dalam hal ini', 'oleh karena itu', 'perlu diingat bahwa', 'selain itu', 'sebagai kesimpulan', 'secara keseluruhan', 'menakjubkan', 'terdapat', 'memiliki peran penting', 'berbagai', 'sangat penting', 'signifikan', 'solusi', 'inovatif', 'mengoptimalkan', 'efisien', 'fleksibilitas', 'meningkatkan'. Gunakan pengganti alami seperti 'jalan keluar', 'terobosan', 'mendongkrak', 'sangat terasa', 'keluwesan', 'tepat guna'.
5. **Strict Active Voice**:
   - Rewrite at least 80% of passive sentences into active voice.
   - For Indonesian: Ubah awalan pasif 'di-' menjadi aktif 'me-'. Ganti 'penelitian dilakukan oleh...' menjadi 'peneliti melakukan...'.
6. **Natural Conversational Transitions**:
   - Replace robotic logical transition words with natural, slightly informal human transitions.
   - For Indonesian: Gunakan kata hubung alami seperti 'tapi', 'padahal', 'makanya', 'sebenarnya', 'nah', 'jadi', 'sebetulnya', 'bahkan', 'lagipula'.
7. **No Structured Templates & Paragraph Variety**:
   - Do not write in perfectly balanced paragraphs or predictable structures. Write with a natural, slightly conversational, and engaging human flow.
   - Vary paragraph lengths drastically. Some paragraphs should consist of only a single, highly impactful sentence. Others can be longer.
   - JANGAN SEKALI-KALI memulai paragraf atau kalimat dengan frasa klise pembuka AI berikut: 'Di era digital saat ini', 'Pada dasarnya', 'Penting untuk diingat bahwa', 'Secara umum', 'Dewasa ini', 'Dalam konteks ini', 'Seiring perkembangan zaman', 'Sebagai kesimpulan', 'Langkah pertama', 'Hal pertama yang'.
8. **Preserve Content & Lists**:
   - Do not lose any facts, names, exact numbers, dates, or core meaning of the original text.
   - CRITICAL: If the input text has numbered lists (e.g., '1.', '2.', '3.'), bullet points, or list structures, you MUST preserve the exact list format, numbers, and layout. Do NOT merge them into one paragraph or delete the numbering.
9. **Banned Punctuation**:
   - ABSOLUTELY DO NOT use long em-dashes (—) or en-dashes (–) anywhere in your output (e.g. for separating clauses). Use standard commas, conjunctions, or periods instead.
   - Note: Standard short hyphens (-) for compound words (e.g., 'anak-anak', 'gotong-royong') are 100% ALLOWED and encouraged.`;
		} else if (mode === 'academic') {
			baseInstructions = "You are an elite academic editor. Rewrite the text to be highly formal, scholastic, and precise, suitable for scientific journal submission. Eliminate slang, contractions, and colloquialisms. Preserve the logical flow and meaning.";
		} else if (mode === 'creative') {
			baseInstructions = "You are an imaginative creative writer. Rephrase the text to be highly engaging, expressive, and fluid. Use vivid descriptors, powerful verbs, and varied rhythms to make the text lively and compelling.";
		} else {
			baseInstructions = "You are a clear communications expert. Rewrite the text to be extremely clear, simple, and direct. Break down overly complex sentences, remove unnecessary jargon, and write in the active voice for maximum readability.";
		}

		let strengthInstructions = "";
		if (strength === 'low') {
			strengthInstructions = "Apply a GENTLE rewrite. Only swap a few words for synonyms, keeping the exact original sentence structures and paragraph flows completely intact.";
		} else if (strength === 'medium') {
			strengthInstructions = "Apply a BALANCED rewrite. Rephrase both words and sentence structures moderately while keeping the original context and overall flow recognizable.";
		} else {
			strengthInstructions = "Apply a COMPLETE OVERHAUL. Deeply restructure all sentences, break paragraphs down, reorganize thoughts, and completely change the phrasing layout for maximum uniqueness while preserving the target semantic meaning.";
		}

		const systemPrompt = `${baseInstructions}\n${strengthInstructions}\n\nCRITICAL OUTPUT REQUIREMENT: Output ONLY the final paraphrased text. Do NOT include any conversational intro, outro, quotes, markdown wrappers, or meta-explanations.`;

		try {
			const result = await generateUtilityResponse(inputText, systemPrompt);
			setOutputText(result);
		} catch (error) {
			console.error(error);
			const isRateLimit = error.message?.includes("Rate Limit");
			setOutputText(isRateLimit ? `Error: ${error.message}` : "Error: Failed to paraphrase. Please check your internet connection or API key.");
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

	const getOutputWordCount = () => {
		return outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
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
							Paraphrase Settings
						</h3>
					</div>
					<div className="p-3.5 flex flex-col gap-4">
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Paraphrase Mode</label>
							<CustomSelect
								value={mode}
								onChange={setMode}
								themeColor={persona.theme.primary}
								options={[
									{ value: 'humanizer', label: 'Anti AI-Detector (Humanizer)', icon: Sparkles },
									{ value: 'academic', label: 'Formal & Academic', icon: Briefcase },
									{ value: 'creative', label: 'Creative & Vivid', icon: Feather },
									{ value: 'simple', label: 'Simple & Direct', icon: Smile }
								]}
							/>
						</div>
						<div>
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Rewrite Strength</label>
							<CustomSelect
								value={strength}
								onChange={setStrength}
								themeColor={persona.theme.primary}
								options={[
									{ value: 'low', label: 'Low (Gentle Rewrite)', icon: Sliders },
									{ value: 'medium', label: 'Medium (Balanced)', icon: Sliders },
									{ value: 'high', label: 'High (Complete Overhaul)', icon: Sliders }
								]}
							/>
						</div>
						<Button
							variant="full-action"
							onClick={handleParaphrase}
							disabled={!inputText}
							isLoading={isLoading}
							themeColor={persona.theme.primary}
							icon={Wand2}
							label={mode === 'humanizer' ? 'HUMANIZE' : 'REPHRASE'}
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
							placeholder="Paste original text here to rewrite or humanize..."
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
								<Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Paraphrased Result
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
									<p className="text-sm font-medium animate-pulse">Humanizing text...</p>
								</div>
							) : (
								<p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-[13px]">
									{outputText || <span className="text-slate-400 italic">Paraphrased output will appear here...</span>}
								</p>
							)}
						</div>
						<div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 text-[11px] font-semibold text-slate-400 text-right shrink-0">
							{getOutputWordCount()} words
						</div>
					</div>
				</div>
			}
		/>
	);
}