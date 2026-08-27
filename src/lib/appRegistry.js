/**
 * Central registry for all applications and tools in Echo AturAI
 * Implements Open/Closed Principle (OCP) and DRY
 */

export const APP_REGISTRY = {
  translator: {
    filename: 'TranslatorApp',
    tagline: 'Multilingual Translation',
    description: 'A premium multilingual translation tool that preserves formatting and adapts to your desired tone.',
    howToUse: '1. Paste the text or document you want to translate into the main input field.\n2. Select your desired target language from the dropdown menu.\n3. Adjust the \'Tone\' (e.g., Formal, Casual, Academic) to ensure the translation sounds natural.\n4. Click \'Translate\' and let the AI process it while preserving your original formatting.\n5. Use the \'Copy\' button to quickly grab the result.',
    features: '• Context-aware Translation\n• Tone Matching\n• Multi-language'
  },
  enhancer: {
    filename: 'EnhancerApp',
    tagline: 'Grammar & Flow Editor',
    description: 'Grammar and flow editor. Refines raw text into clear, professional content.',
    howToUse: '1. Paste your draft into the input field.\n2. Click \'Enhance\' to process the text.\n3. The assistant will restructure sentences, fix grammar, and improve readability.\n4. Copy the final polished version for your use.',
    features: '• Grammar Correction\n• Flow Optimization\n• Vocabulary Boost'
  },
  prompter: {
    filename: 'PrompterApp',
    tagline: 'Advanced Prompt Engineering',
    description: 'Prompt optimization assistant. Transforms basic instructions into structured prompts.',
    howToUse: '1. Write down your rough idea or basic instruction.\n2. Click \'Optimize Prompt\'.\n3. Review the reconstructed, highly detailed prompt.\n4. Copy and use the prompt in any major language model.',
    features: '• Prompt Engineering\n• Context Enrichment\n• Output Formatting'
  },
  tone_shifter: {
    filename: 'ToneShifterApp',
    tagline: 'Voice & Tone Adjustment',
    description: 'Tone adjustment utility. Modifies the emotional tone of your message without changing the core meaning.',
    howToUse: '1. Paste your original text.\n2. Select the target tone from the menu.\n3. Click \'Shift Tone\'.\n4. Review the rephrased sentences adjusted for your chosen situation.',
    features: '• Nuance Adjustment\n• Meaning Preservation\n• Context Awareness'
  },
  paraphraser: {
    filename: 'ParaphraserApp',
    tagline: 'Smart Text Rewriting',
    description: 'Text rewriting utility. Rephrase sentences to simplify concepts or adjust phrasing.',
    howToUse: '1. Paste the text you wish to rewrite.\n2. Choose an alternative writing style.\n3. Click \'Paraphrase\' to process the text.\n4. Review the newly structured sentences.',
    features: '• Sentence Restructuring\n• Meaning Preservation\n• Style Variety'
  },
  brainstormer: {
    filename: 'BrainstormerApp',
    tagline: 'Idea Generation & Concepts',
    description: 'Ideation assistant. Generate concepts and overcome writer\'s block for any project.',
    howToUse: '1. Type in your core topic or problem.\n2. Click \'Brainstorm\'.\n3. Review the generated list of fresh ideas and perspectives.\n4. Use these points as a foundation for your project.',
    features: '• Divergent Thinking\n• Concept Mapping\n• Perspective Discovery'
  },
  copywriter: {
    filename: 'CopywriterApp',
    tagline: 'Content Creation & Marketing',
    description: 'Marketing copy generator. Create ad copy, social media posts, and product descriptions.',
    howToUse: '1. Enter a brief description of the product or topic.\n2. Select the platform (e.g., Instagram, Email).\n3. Click \'Copywrite\'.\n4. Review the generated copy and call-to-actions.',
    features: '• Marketing Frameworks\n• Hook Generation\n• Call-to-Action Ideas'
  },
  articlewriter: {
    filename: 'ArticleWriterApp',
    tagline: 'Articles & Stories',
    description: 'Advanced Article Writer with Humanizer to bypass AI detectors and mimic specific journalism styles.',
    howToUse: '1. Enter your main topic or keywords.\n2. Select the media style (e.g., Forbes, BuzzFeed, Vice).\n3. Set the desired length and perspective.\n4. Adjust the \'Humanizer\' to make the text feel more natural or raw.\n5. Click \'Write\' to generate.',
    features: '• Anti-AI Cloaking\n• Media Style Mimicry\n• Markdown Support'
  },
  briefmaker: {
    filename: 'BriefMakerApp',
    tagline: 'Creative Brief Generator',
    description: 'Creative Brief Generator for agencies, marketers, and freelancers.',
    howToUse: '1. Enter your raw project idea or concept.\n2. Select the Project Type (e.g., Marketing, Logo/Branding).\n3. Choose the Brand Vibe and Target Audience.\n4. Pick your desired output format.\n5. Click \'Generate Brief\'.',
    features: '• Structured Briefs\n• Format Options\n• Tailored Tone & Audience'
  },
  exam: {
    filename: 'ExamApp',
    tagline: 'Interactive Practice Quiz',
    description: 'An intelligent practice quiz generator powered by AI. Upload any study material to instantly test your knowledge.',
    howToUse: '1. Prepare your study material (PDF file or plain text).\n2. Drag & drop the file into the upload zone, or paste text manually.\n3. (Optional) Set a \'Topic Focus\' to restrict questions to specific chapters.\n4. Select the number of questions (5-20).\n5. Click \'Generate Quiz\' and wait for the AI to build your test.\n6. Answer the questions, click \'Next Question\', and review your final score and detailed explanations.',
    features: '• PDF Parsing\n• Dynamic Scoring\n• AI Explanations\n• Auto-Save State'
  },
  compressor: {
    filename: 'CompressorApp',
    tagline: 'Image Size Optimization',
    description: 'High-efficiency image compression tool. Reduces image file sizes while preserving visual quality.',
    howToUse: '1. Drop or upload the image you want to compress.\n2. Adjust the \'Quality\' and \'Image Size\' sliders.\n3. View the real-time \'Savings Report\'.\n4. Click \'Download Output\' to save the optimized image.',
    features: '• Efficient Processing\n• Adjustable Quality\n• Real-time Preview'
  },
  converter: {
    filename: 'ConverterApp',
    tagline: 'Batch Format Conversion',
    description: 'Batch file format converter. Convert images or extract PDF pages to image formats.',
    howToUse: '1. Drop thousands of images or PDFs into the upload zone.\n2. Select your desired Target Format.\n3. Adjust the Quality and Scale sliders.\n4. Click \'Start Conversion\'.\n5. Download all converted files bundled in a ZIP file.',
    features: '• Bulk Processing\n• PDF to Image Extraction\n• Auto-ZIP Bundling'
  },
  bgremover: {
    filename: 'BgRemoverApp',
    tagline: 'Smart Image Cutout',
    description: 'Background removal utility that precisely isolates subjects from their backgrounds.',
    howToUse: '1. Drop or upload any image.\n2. Toggle \'Auto-crop to Object\' if you want to trim empty borders.\n3. Click \'START\' and wait for the processing to finish.\n4. Download the result as a PNG.',
    features: '• Instant Processing\n• Edge Detection\n• Auto-Crop'
  },
  flashcard: {
    filename: 'FlashcardApp',
    tagline: 'Study Deck Generator',
    description: 'Flashcard generator. Convert study material or text into interactive study decks.',
    howToUse: '1. Upload your study material or type your topic.\n2. Select the desired number of cards.\n3. Click \'START\' to generate your deck.\n4. Click on the cards to flip them and test your memory.',
    features: '• Info Extraction\n• Interactive Flip UI\n• Multi-format Support'
  },
  qr: {
    filename: 'QrApp',
    tagline: 'QR Code Maker',
    description: 'QR Code Generator. Create custom QR codes instantly.',
    howToUse: '1. Type or paste your data into the input field.\n2. Adjust the colors to match your brand.\n3. (Optional) Upload a logo to embed in the center.\n4. Export as SVG or PNG.',
    features: '• Instant Processing\n• Custom Branding\n• Vector SVG Export'
  },
  textformatter: {
    filename: 'TextFormatterApp',
    tagline: 'Text Styling & Formatting',
    description: 'A tool to style, clean, and format raw text contents with ease.',
    howToUse: '1. Paste text in the input area.\n2. Choose style options.\n3. Click format and copy the result.',
    features: '• Style options\n• Fast formatting'
  },
  pdfstudio: {
    filename: 'PdfStudioApp',
    tagline: 'PDF Merger & Splitter',
    description: 'PDF Merger and Splitter. Organize documents securely and instantly.',
    howToUse: '1. Select \'Merge\' or \'Split\' mode.\n2. Drop your PDFs into the workspace.\n3. Configure your merge order or split page ranges.\n4. Click the process button and download the result.',
    features: '• Secure Processing\n• Split Page Ranges\n• Auto-ZIP Bundling'
  },
  pdfcompressor: {
    filename: 'PdfCompressorApp',
    tagline: 'Lossless PDF Compression',
    description: 'WASM-powered PDF Compressor. Shrinks PDF file sizes by optimizing internal images without rasterizing the document.',
    howToUse: '1. Drop your PDF file into the workspace.\n2. Select your compression preset (Lossless, Balanced, Max).\n3. Wait for the processing to complete.\n4. Download the optimized PDF.',
    features: '• No Rasterization\n• Text Remains Selectable\n• On-Device Processing'
  },
  audiostudio: {
    filename: 'AudioStudioApp',
    tagline: 'Audio Trimmer & Formats',
    description: 'Audio Trimmer & Format Converter with an interactive visual waveform.',
    howToUse: '1. Drop your audio file into the workspace.\n2. Drag the edges of the highlighted region on the waveform to trim.\n3. Select your Target Format.\n4. Click \'EXPORT\' to process and download.',
    features: '• Interactive Waveform\n• MP3 & WAV Export\n• Seamless Export'
  },
  layoutstudio: {
    filename: 'LayoutStudioApp',
    tagline: 'Mathematical Layout Calculator',
    description: 'A precise mathematical layout calculator for graphic designers and developers.',
    howToUse: '1. Select Aspect Ratio or Grid System mode.\n2. Enter your target width or container size.\n3. Instantly get the exact pixel heights or column widths needed.\n4. Click the copy button to save the value.',
    features: '• Aspect Ratio Math\n• CSS Grid Columns\n• Instant Calculation'
  },
  imagecropper: {
    filename: 'ImageCropperApp',
    tagline: 'Image Cropping & Resizing',
    description: 'A precise image cropping and resizing utility.',
    howToUse: '1. Upload the image you want to crop.\n2. Select a preset aspect ratio or drag the corners to crop freely.\n3. Double-click the crop area to quickly download the cropped image.\n4. Download your cropped image instantly.',
    features: '• Aspect Ratio Presets\n• Double-click to Save\n• Fast Execution'
  },
  passwordgen: {
    filename: 'PasswordGenApp',
    tagline: 'Key Generator',
    description: 'A secure password generator to create highly resilient credentials.',
    howToUse: '1. Adjust the slider to set your desired password length.\n2. Toggle Uppercase, Lowercase, Numbers, and Symbols as needed.\n3. Observe the strength indicator to ensure your password is secure.\n4. Click \'Copy to Clipboard\' to use the generated password.',
    features: '• Instant Generation\n• Live Strength Indicator\n• Customizable Character Sets'
  },
  colorextractor: {
    filename: 'ColorExtractorApp',
    tagline: 'Color Palette Extractor',
    description: 'Extract dominant color palettes from any image.',
    howToUse: '1. Drag & drop or upload your image into the source area.\n2. The system will automatically extract the dominant colors into a palette.\n3. Hover over the image preview to pick specific pixel colors interactively.\n4. Click any color to instantly copy its HEX code to your clipboard.',
    features: '• Instant Processing\n• Interactive Hover Picker\n• Instant Copy to Clipboard'
  },
  imagecollage: {
    filename: 'ImageCollageApp',
    tagline: 'Collage Maker',
    description: 'Create beautiful photo collages instantly with dynamic layouts and adjustable gaps.',
    howToUse: '1. Upload multiple images to the workspace.\n2. Choose your preferred layout format (Row, Column, Grid).\n3. Adjust the Gap and Corner Radius sliders to fine-tune the look.\n4. Select a background color.\n5. Click \'DOWNLOAD\' to save your high-resolution collage.',
    features: '• Canvas Rendering\n• Dynamic Grid Options\n• High-Resolution Export'
  },
  imagewatermark: {
    filename: 'ImageWatermarkApp',
    tagline: 'Batch Branding & Protection',
    description: 'Batch apply text or image watermarks to protect your photos.',
    howToUse: '1. Upload multiple images to the workspace.\n2. Select Text or Image watermark type and adjust settings (opacity, position).\n3. Preview the watermark instantly on the first image.\n4. Click \'Export Batch\' to download all watermarked images as a ZIP.',
    features: '• Batch Processing\n• Live Canvas Preview\n• Auto-ZIP Bundling'
  },
  datavisualizer: {
    filename: 'DataVisualizerApp',
    tagline: 'Data Visualizer',
    description: 'Generate beautiful charts, plots, and visual summaries from tabular raw data.',
    howToUse: '1. Input or paste your CSV/JSON formatted data.\n2. Select the chart type (Bar, Line, Pie, Scatter).\n3. Adjust color parameters and styling.\n4. Download as high quality image.',
    features: '• Diverse Charts\n• Responsive Previews\n• High Quality Export'
  },
  ocr: {
    filename: 'OcrApp',
    tagline: 'Image to Text OCR',
    description: 'Extract text from images instantly using on-device OCR.',
    howToUse: '1. Upload an image containing text.\n2. Select the document language in the Settings panel.\n3. Click \'EXTRACT\' to begin processing.\n4. Review and copy the extracted text.',
    features: '• Offline Processing\n• Multi-language Support\n• Instant Copy to Clipboard'
  },
  codesnippet: {
    filename: 'CodeSnippetApp',
    tagline: 'Code Snippet Visualizer',
    description: 'Create beautiful, shareable screenshots of your code.',
    howToUse: '1. Select your programming language and highlight theme.\n2. Type or paste your code into the workspace.\n3. Adjust the background padding and gradient as desired.\n4. Click \'EXPORT\' to download the high-quality PNG.',
    features: '• Instant Canvas Render\n• Mac-Style Window\n• Syntax Highlighting'
  },
  summarizer: {
    filename: 'SummarizerApp',
    tagline: 'Meeting Minutes & Summaries',
    description: 'Summarizer tool. Convert raw meeting notes or transcripts into clean, organized minutes and action items.',
    howToUse: '1. Paste your raw meeting notes or transcript.\n2. Select your desired Summary Format (e.g., Action Items, Full Minutes).\n3. Click \'SUMMARIZE\'.\n4. Copy the structured results.',
    features: '• Auto-extract action items\n• Multiple languages\n• Structure conversion'
  },
  chatworld: {
    filename: 'ChatWorldApp',
    tagline: 'Chat World',
    description: 'Connect with multiple AI personas in a shared simulation space to explore dynamic group chats.',
    howToUse: '1. Join or configure simulated rooms.\n2. Start messages and observe how different personas interact with each other.',
    features: '• Multi-persona Group Simulation\n• Real-time Interactions'
  },
  faviconmaker: {
    filename: 'FaviconMakerApp',
    tagline: 'Favicon Maker',
    description: 'Create and generate compliant favicon formats for modern web pages in seconds.',
    howToUse: '1. Upload source image.\n2. Set sizing presets.\n3. Click generate to build compressed favicon files.',
    features: '• Bulk Formats\n• Speed Generation'
  },
  invoicemaker: {
    filename: 'InvoiceMakerApp',
    tagline: 'Invoice Maker',
    description: 'Create beautiful and professional invoices instantly in your browser.',
    howToUse: '1. Fill in the invoice details (No, Date, Client).\n2. Add your products or services in the Items section.\n3. Customize your brand with your name and avatar.\n4. (Optional) Upload a QR code for easy payments.\n5. Click \'UNDUH INVOICE\' to save the high-resolution image.',
    features: '• Live A4 Preview\n• Dynamic Calculations\n• QR Code Payment Support'
  },
  codeminifier: {
    filename: 'CodeMinifierApp',
    tagline: 'Code Minifier',
    description: 'Minify and compress HTML, CSS, and JS file contents to optimize load times.',
    howToUse: '1. Paste raw code.\n2. Click Minify.\n3. Copy the minified results.',
    features: '• Fast Compression\n• Clean Outputs'
  },
  audiometadata: {
    filename: 'AudioMetadataApp',
    tagline: 'Audio Metadata Editor',
    description: 'Read and edit ID3 metadata tags of audio files directly in the browser.',
    howToUse: '1. Upload audio file.\n2. Edit title, artist, album, and artwork metadata fields.\n3. Save and download updated file.',
    features: '• On-device updates\n• ID3 compatibility'
  },
  htmlreview: {
    filename: 'HtmlReviewApp',
    tagline: 'HTML Reviewer',
    description: 'Live interactive sandbox for viewing, testing, and reviewing HTML, CSS, and JS snippets.',
    howToUse: '1. Write or paste code in the editor panels.\n2. View changes immediately in the live side preview panel.',
    features: '• Hot-reloading preview\n• Multi-panel layout'
  },
  captiongenerator: {
    filename: 'CaptionGeneratorApp',
    tagline: 'Social Media Captions',
    description: 'Generate engaging and viral captions for Instagram, TikTok, LinkedIn, and Twitter.',
    howToUse: '1. Enter key topics.\n2. Pick platform and emotional tone.\n3. Click generate for curated caption lists.',
    features: '• Multi-platform optimization\n• Emoji inclusion'
  },
  fanficwriter: {
    filename: 'FanficWriterApp',
    tagline: 'Fanfiction Writer',
    description: 'Write engaging fanfiction stories with interactive prompt and outline generation options.',
    howToUse: '1. Pick base universe/characters.\n2. Define brief theme.\n3. Generate outlines and content chunks.',
    features: '• Story continuity helper\n• Character database suggestions'
  },
  colorblindness: {
    filename: 'ColorBlindnessApp',
    tagline: 'Colorblindness Simulator',
    description: 'Simulate visual constraints of different colorblindness types on loaded images.',
    howToUse: '1. Drop your image.\n2. Toggle different colorblindness filter presets.\n3. Save simulated output.',
    features: '• Realtime Canvas simulation\n• Preset filters'
  },
  colorgradientextractor: {
    filename: 'ColorGradientExtractorApp',
    tagline: 'Gradient Extractor',
    description: 'Extract premium CSS gradients and color palettes directly from uploaded images.',
    howToUse: '1. Upload source image.\n2. Pick extracted colors to construct linear/radial/conic/mesh gradients.\n3. Export CSS codes or generated PNG image files.',
    features: '• Multi-stop gradients\n• Canvas-based preview'
  },
  wavegenerator: {
    filename: 'WaveGeneratorApp',
    tagline: 'Wave Generator',
    description: 'Generate clean decorative SVG wave graphics for backgrounds and website sections.',
    howToUse: '1. Customize curve heights and layer colors.\n2. Export clean optimized SVG.',
    features: '• Multi-layer waves\n• Real-time updates'
  },
  lowpoly: {
    filename: 'LowPolyApp',
    tagline: 'Low Poly Generator',
    description: 'Convert standard images to stylized geometric low-poly vector assets.',
    howToUse: '1. Upload image.\n2. Adjust mesh detail density and threshold parameters.\n3. Click process to build stylized low poly shapes.',
    features: '• Detailed triangulation mesh\n• Scale controls'
  },
  tornpaper: {
    filename: 'TornPaperApp',
    tagline: 'Torn Paper Effect',
    description: 'Add beautiful decorative torn paper edges and textures to mockups and images.',
    howToUse: '1. Upload image.\n2. Choose border tearing styles.\n3. Download stylized results.',
    features: '• Custom border path generation\n• Canvas renders'
  },
  memphis: {
    filename: 'MemphisGeneratorApp',
    tagline: 'Memphis Pattern Gen',
    description: 'Generate playful stylized retro 80s/90s Memphis pattern backgrounds.',
    howToUse: '1. Adjust color palettes and shape counts.\n2. Download SVG vectors.',
    features: '• Retro styling options\n• Scale-independent export'
  },
  mindmap: {
    filename: 'MindMapApp',
    tagline: 'Mind Map Visualizer',
    description: 'A mathematical auto-layout mind map visualizer. Create conceptual relationship diagrams instantly.',
    howToUse: '1. Use indentation (spaces/tabs) to define visual relationships.\n2. Adjust node & line themes.\n3. Drag and zoom the map and export as PNG or SVG.',
    features: '• Auto-layout\n• SVG Export\n• Custom Themes\n• Interactive Zoom'
  },
  imagecrypt: {
    filename: 'ImageCryptApp',
    tagline: 'Image Encryption',
    description: 'Securely encrypt images into pixelated cipher data and decrypt them back using a private passphrase.',
    howToUse: '1. Set ENCRYPT/DECRYPT mode.\n2. Input private passkey passphrase.\n3. Process image offline.',
    features: '• On-device processing\n• Safe encryption algorithms'
  },
  decisionmatrix: {
    filename: 'DecisionMatrixApp',
    tagline: 'Pros, Cons & Logical Choice',
    description: 'A rational decision-making assistant that weighs pros and cons to recommend the best choice.',
    howToUse: '1. Enter two choices you are considering.\n2. Provide context or specific criteria for the decision.\n3. Click \'Analyze\' to generate a weighted pros and cons matrix.\n4. Review the logical recommendation.',
    features: '• Objective Analysis\n• Pros & Cons Weighing\n• Clear Recommendations'
  },
  goalplanner: {
    filename: 'GoalPlannerApp',
    tagline: 'Visual Monthly Planner',
    description: 'Map your messy thoughts and targets into a beautiful, visual monthly calendar.',
    howToUse: '1. Select the target Month and Year.\n2. Dump all your goals and tasks in the text area (e.g., \'Gym on Mondays, pay rent on the 5th\').\n3. Click BUILD to generate the visual schedule.\n4. Save it as an image to use as your wallpaper or reminder.',
    features: '• Smart Date Parsing\n• Visual Calendar Grid\n• Export to PNG'
  }
};

import { toolRegistryService, ToolRegistryService } from '../services/registry/ToolRegistry.jsx';

// Register standard tools in toolRegistryService
Object.entries(APP_REGISTRY).forEach(([id, appData]) => {
  toolRegistryService.registerTool(id, appData);
});

export { toolRegistryService, ToolRegistryService };

export const appRegistryService = toolRegistryService;

export const getAppTagline = (id, role = 'Productivity Tool') =>
  toolRegistryService.getToolTagline(id, role);

export const getAppDetails = (id) => toolRegistryService.getToolMetadata(id);

