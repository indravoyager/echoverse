import { CustomSelect } from '../theme/CustomSelect';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Settings2, Loader2, RotateCcw, Copy, Check, ScanText, Image as ImageIcon, ChevronDown, Globe, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { clsx } from 'clsx';
import { generateUtilityResponse } from '../../lib/ai';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

export default function OcrApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState('eng+ind');
  const { copied, copy } = useCopyToClipboard();
  const [docMode, setDocMode] = useState('11');
  const [useAiScan, setUseAiScan] = useState(false);
  
  const docModeOptions = [
    { value: '3', label: 'Standard Text (Auto)', icon: FileText },
    { value: '6', label: 'Uniform Text Block', icon: FileText },
    { value: '11', label: 'Sparse Text (Diagrams)', icon: ScanText }
  ];
  
  const languageOptions = [
    { value: 'eng+ind', label: 'English + Indonesian', icon: Globe },
    { value: 'eng', label: 'English (eng)', icon: Globe },
    { value: 'ind', label: 'Indonesian (ind)', icon: Globe },
    { value: 'chi_sim', label: 'Mandarin (Simplified)', icon: Globe },
    { value: 'eng+chi_sim', label: 'Mandarin + English (Simp)', icon: Globe },
    { value: 'chi_tra', label: 'Mandarin (Traditional)', icon: Globe },
    { value: 'eng+chi_tra', label: 'Mandarin + English (Trad)', icon: Globe }
  ];

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (originalImage) URL.revokeObjectURL(originalImage);
    
    setOriginalFile(file);
    setOriginalImage(URL.createObjectURL(file));
    setExtractedText('');
    setProgress(0);
    setStatusText('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileUpload({ target: fileInputRef.current });
      }
    }
  };

  const preprocessImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let scale = 1;
        // Upscale small images to improve Tesseract accuracy
        if (!useAiScan && img.width < 2000) {
          scale = 2000 / img.width;
          if (scale > 3) scale = 3; // cap at 3x
        }
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!useAiScan) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.filter = 'contrast(1.2) grayscale(100%)';
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        if (useAiScan || scale === 1) {
           resolve(file);
        } else {
           resolve(canvas);
        }
      };
      img.src = url;
    });
  };

  const startProcess = async () => {
    if (!originalFile || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    
    if (useAiScan) {
      try {
        setStatusText('Uploading to Cloud AI...');
        setProgress(25);
        
        const reader = new FileReader();
        reader.readAsDataURL(originalFile);
        reader.onload = async () => {
          try {
            const dataUrl = reader.result;
            const mimeType = dataUrl.split(';')[0].split(':')[1];
            const base64 = dataUrl.split(',')[1];
            
            setProgress(60);
            setStatusText('Analyzing complex document...');
            
            const prompt = `Tolong ekstrak semua teks dari gambar ini dengan tingkat akurasi maksimal. 
Pertahankan format aslinya sebaik mungkin (tabel, daftar, paragraf, dan rumus matematika). 
PENTING: Jangan tambahkan basa-basi, langsung berikan hasil teks ekstraknya saja.`;

            const result = await generateUtilityResponse(
               prompt,
               "You are an expert OCR engine. Extract text accurately. If there are formulas, output them properly.",
               { data: base64, mimeType: mimeType },
               true // Require custom API key
            );
            
            setExtractedText(result);
            setStatusText('Complete!');
            setProgress(100);
            setIsProcessing(false);
          } catch (e) {
            console.error("AI Scan failed:", e);
            setStatusText('Error');
            setIsProcessing(false);
          }
        };
        return;
      } catch (error) {
        console.error(error);
        setIsProcessing(false);
      }
    } else {
      setStatusText('Preprocessing image...');
      try {
        const targetInput = await preprocessImage(originalFile);
        setStatusText('Initializing engine...');
        
        const worker = await Tesseract.createWorker(language, 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
              setStatusText('Extracting text...');
            } else {
              setStatusText(m.status);
              if (m.progress) {
                  setProgress(Math.round(m.progress * 100));
              }
            }
          }
        });
        
        await worker.setParameters({
          tessedit_pageseg_mode: docMode,
        });
        
        const result = await worker.recognize(targetInput);
        setExtractedText(result.data.text);
        setStatusText('Complete!');
        await worker.terminate();
      } catch (error) {
        console.error("OCR failed:", error);
        setApiModalTitle("OCR Error");
        setApiModalMessage("Gagal mengekstrak teks. Pastikan gambar jelas dan coba lagi.");
        setShowApiModal(true);
        setStatusText('Error');
      } finally {
        setIsProcessing(false);
        setProgress(100);
      }
    }
  };

  const handleReset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    setOriginalFile(null);
    setOriginalImage(null);
    setExtractedText('');
    setProgress(0);
    setStatusText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = () => copy(extractedText);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`
            }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleReset} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{ 
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset Workspace"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Source Image
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors ${
                      isProcessing ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10' :
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 cursor-pointer' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                    }`}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" disabled={isProcessing} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop it here!' : originalImage ? 'Replace Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Format: JPG, PNG, WebP.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-visible z-10 relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-[11px]">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Settings
                </h3>
                <button 
                  onClick={startProcess}
                  disabled={!originalImage || isProcessing}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <ScanText size={14} />}
                  {isProcessing ? 'Wait...' : 'EXTRACT'}
                </button>
              </div>
              
              <div className="p-4 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5" onClick={() => setUseAiScan(!useAiScan)}>
                        Cloud AI Vision
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-[180px]">Uses Gemini AI to perfectly scan diagrams, math formulas, and mixed languages. Requires API Key.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setUseAiScan(!useAiScan)}
                      className={clsx(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none p-[2px]",
                        useAiScan ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                      )}
                      style={{ "--color-primary": persona.theme.primary }}
                    >
                      <span className="sr-only">Use AI Scan</span>
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "pointer-events-none inline-block h-3 w-3 transform rounded-full transition duration-300 ease-in-out",
                          useAiScan ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {!useAiScan && (
                  <>
                    <div className="mb-4">
                      <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                        Document Language
                      </label>
                      <CustomSelect 
                        value={language}
                        onChange={setLanguage}
                        options={languageOptions}
                        themeColor={persona.theme.primary}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                        Scan Mode
                      </label>
                      <CustomSelect 
                        value={docMode}
                        onChange={setDocMode}
                        options={docModeOptions}
                        themeColor={persona.theme.primary}
                      />
                    </div>
                  </>
                )}

                {isProcessing && (
                  <div className="mt-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      <span className="truncate pr-2">{statusText}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: persona.theme.primary }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 text-center leading-relaxed">Model data may take a moment to download on first run depending on your connection.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">File Details</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500 font-medium">Filename</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={originalFile?.name}>{originalFile ? originalFile.name : '-'}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500 font-medium">Size</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{originalFile ? formatSize(originalFile.size) : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col min-w-0 h-[600px] lg:h-auto gap-4">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Extraction Result
                </h3>
                {extractedText && (
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                )}
              </div>
              
              <div className="flex-1 relative flex flex-col md:flex-row min-h-0 bg-slate-100 dark:bg-[#0a0a0a]">
                {!originalImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 p-6">
                    <ScanText className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">No image to process.</span>
                    <span className="text-xs text-center max-w-xs">Upload an image containing text to see the extraction result here.</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full gap-px bg-slate-200 dark:bg-white/10 overflow-hidden">
                    {/* Image Preview */}
                    <div className="flex-1 flex flex-col min-h-[250px] md:min-h-0 bg-slate-50 dark:bg-[#111]">
                      <div className="p-2 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shrink-0 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Document</span>
                      </div>
                      <div className="flex-1 p-4 overflow-auto flex items-center justify-center checkerboard-bg">
                        <img src={originalImage} alt="Document" className="max-w-full h-auto max-h-full object-contain rounded drop- border border-slate-200 dark:border-white/10" />
                      </div>
                    </div>
                    {/* Text Result */}
                    <div className="flex-1 flex flex-col min-h-[250px] md:min-h-0 bg-white dark:bg-[#1a1a1a]">
                      <div className="p-2 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#111] shrink-0 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Extracted Text</span>
                      </div>
                      <div className="flex-1 p-0 relative">
                        {isProcessing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 z-10 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: persona.theme.primary }} />
                            <span className="text-sm font-medium animate-pulse">{statusText}</span>
                          </div>
                        ) : extractedText ? (
                          <textarea 
                            className="w-full h-full p-4 resize-none bg-transparent outline-none text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 custom-scrollbar"
                            value={extractedText}
                            onChange={(e) => setExtractedText(e.target.value)}
                            placeholder="Extracted text will appear here. You can edit it if needed."
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 p-6 text-center">
                            <span className="text-sm">Click EXTRACT in the settings panel to begin OCR processing.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
