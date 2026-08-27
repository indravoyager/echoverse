import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, FileText, RotateCcw, Settings2, Loader2, Leaf, ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

export default function PdfCompressorApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState('rasterize'); // 'lossless', 'rasterize'
  const [quality, setQuality] = useState(80); // 1 to 100
  const [scriptsLoaded, setScriptsLoaded] = useState({ pdfjs: false, pdflib: false });
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load PDF.js and PDF-lib dynamically
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };

    const initScripts = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjs-script');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setScriptsLoaded(prev => ({ ...prev, pdfjs: true }));

        await loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'pdflib-script');
        setScriptsLoaded(prev => ({ ...prev, pdflib: true }));
      } catch (err) {
        console.error("Script loading error:", err);
      }
    };

    initScripts();
  }, []);

  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(!!pdfFile);
    }
  }, [pdfFile, onUnsavedDataChange]);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const file = e.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else {
      alert('Please drop a valid PDF file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
    e.target.value = null; // reset
  };

  const handleConfigChange = () => {
    if (compressedBlobUrl) {
      URL.revokeObjectURL(compressedBlobUrl);
      setCompressedBlobUrl(null);
      setCompressedSize(0);
      setProgress(0);
      setFallbackTriggered(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    handleConfigChange();
  };

  const handleQualityChange = (e) => {
    setQuality(Number(e.target.value));
    handleConfigChange();
  };

  const processFile = async (file) => {
    setPdfFile(file);
    setOriginalSize(file.size);
    setCompressedSize(0);
    setCompressedBlobUrl(null);
    setProgress(0);
    
    // Do not run compression automatically
    // await runCompression(file, preset);
  };

  const runCompression = async (file, currentMode = mode, currentQuality = quality) => {
    if (!file || !scriptsLoaded.pdfjs || !scriptsLoaded.pdflib) return;
    
    if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
    setCompressedBlobUrl(null);
    setCompressedSize(0);
    setFallbackTriggered(false);
    
    setIsCompressing(true);
    setProgress(10);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);
      
      let finalBytes;
      const { PDFDocument } = window.PDFLib;
      
      // Always compute the lossless version as a baseline
      const pdfDocBaseline = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
      pdfDocBaseline.setCreator('');
      pdfDocBaseline.setProducer('');
      const losslessBytes = await pdfDocBaseline.save();
      
      if (currentMode === 'lossless') {
        finalBytes = losslessBytes;
        setProgress(90);
      } else {
        // Rasterization approach - passing a copy to prevent Web Worker from detaching the main buffer
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const numPages = pdf.numPages;
        
        const newPdfDoc = await PDFDocument.create();
        
        // Fixed readable scale (1.5 = 108 DPI)
        const scaleMult = 1.5;
        const jpegQual = currentQuality / 100;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          setProgress(20 + Math.round((pageNum / numPages) * 60));
          
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: scaleMult });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          
          const dataUrl = canvas.toDataURL('image/jpeg', jpegQual);
          const imgBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
          
          const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
          const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
          });
          
          // Yield to main thread
          await new Promise(r => setTimeout(r, 10));
        }
        
        const rasterizedBytes = await newPdfDoc.save();
        
        // Smart Fallback: If rasterizing makes it LARGER, discard it!
        // PDFs that are mostly text get huge when converted to images.
        if (rasterizedBytes.length >= file.size) {
          finalBytes = losslessBytes; // Use the metadata-stripped version instead
          setFallbackTriggered(true);
        } else {
          finalBytes = rasterizedBytes;
          setFallbackTriggered(false);
        }
      }
      
      setProgress(90);
      
      // Final sanity check: if even lossless is larger, just return original file data
      if (finalBytes.length > file.size) {
        finalBytes = new Uint8Array(await file.arrayBuffer());
        setFallbackTriggered(true);
      }
      
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCompressedBlobUrl(url);
      setCompressedSize(blob.size);
      setProgress(100);
      
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Failed to compress the PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCompressing(false);
    }
  };



  const handleReset = () => {
    setPdfFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
    setCompressedBlobUrl(null);
    setIsCompressing(false);
    setProgress(0);
    setMode('rasterize');
    setQuality(80);
  };

  const handleDownload = () => {
    if (!compressedBlobUrl) return;
    const link = document.createElement('a');
    link.href = compressedBlobUrl;
    link.download = `compressed_${pdfFile?.name || 'document.pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      
      {/* Tool Header */}
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
          title="Reset"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            
            {/* Source File Upload */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Source File
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop it here!' : pdfFile ? 'Replace PDF' : 'Upload PDF'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Select a PDF file to compress.</p>
                {pdfFile && (
                  <div className="mt-3 p-2 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-between border border-slate-200 dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{pdfFile.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatSize(originalSize)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Configuration
                </h3>
                <button 
                  onClick={() => runCompression(pdfFile)}
                  disabled={!pdfFile || isCompressing || !scriptsLoaded.pdfjs || !scriptsLoaded.pdflib}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isCompressing || (!scriptsLoaded.pdfjs || !scriptsLoaded.pdflib) ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                  {isCompressing ? 'Wait...' : (!scriptsLoaded.pdfjs || !scriptsLoaded.pdflib) ? 'Loading...' : 'Start'}
                </button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                  {/* Mode Target */}
                  <div className="mb-0">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Compression Mode</label>
                    <SegmentedControl
                      value={mode}
                      onChange={handleModeChange}
                      options={[
                        { value: 'lossless', label: 'Lossless' },
                        { value: 'rasterize', label: 'Rasterize' }
                      ]}
                    />
                    <p className="text-[10px] text-slate-500 mt-2">{mode === 'lossless' ? 'Safest. Strips metadata but keeps image quality intact.' : 'Convert pages to images. Reduces size but makes text unselectable.'}</p>
                  </div>

                  {mode === 'rasterize' && (
                    <>
                      {/* Quality Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quality</label>
                          <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{quality}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="50" 
                          max="100" 
                          value={quality} 
                          onChange={handleQualityChange}
                          disabled={isCompressing}
                          className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing disabled:opacity-50"
                          style={{ '--slider-thumb-color': persona.theme.primary }}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Lower quality reduces file size further.</p>
                      </div>
                    </>
                  )}
              </div>
              </div>
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
              
              <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
                <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                  <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    Result Workspace
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col relative">
                  {!pdfFile ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 opacity-50 p-8 text-center">
                      <FileText className="w-12 h-12 mb-2" />
                      <span className="text-sm font-medium">No files added.</span>
                      <span className="text-[11px] max-w-[200px] leading-relaxed">Upload a file from the sidebar to begin processing.</span>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col gap-4">
                      
                      {fallbackTriggered && (
                        <div className="w-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-3 rounded-xl border border-orange-200 dark:border-orange-800/30 flex items-start gap-2">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                          <p className="text-[11px] leading-tight font-medium">
                            <b>Smart Fallback Activated:</b> Converting this text-heavy PDF to images would have increased file size. Applied <b>Lossless</b> compression instead!
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-all">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400">
                              <FileText size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{pdfFile.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-md shrink-0">
                                  {formatSize(originalSize)}
                                </span>
                                {compressedSize > 0 && (
                                  <>
                                    <ArrowLeft size={10} className="rotate-180 text-slate-400" />
                                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: persona.theme.primary }}>
                                      {formatSize(compressedSize)}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-500 ml-1">
                                      (-{originalSize > 0 ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100)) : 0}%)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {compressedBlobUrl && (
                            <button
                              onClick={handleDownload}
                              className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-white font-bold text-[11px] transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25 shrink-0"
                              style={{ backgroundColor: persona.theme.primary }}
                            >
                              <Download size={14} />
                              Save
                            </button>
                          )}
                        </div>

                        {isCompressing && (
                          <div className="w-full mt-2">
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing...</span>
                               <span className="text-[10px] font-bold" style={{ color: persona.theme.primary }}>{progress}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out" style={{ width: `${progress}%`, backgroundColor: persona.theme.primary }}></div>
                             </div>
                          </div>
                        )}
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
