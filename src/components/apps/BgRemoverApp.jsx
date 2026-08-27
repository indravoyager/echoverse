import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Eraser, Download, Image as ImageIcon, FileImage, Settings2, Loader2, RotateCcw, Check, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { clsx } from 'clsx';

export default function BgRemoverApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (processedImage) URL.revokeObjectURL(processedImage);
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Revoke old
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    
    setOriginalFile(file);
    setOriginalImage(URL.createObjectURL(file));
    setProcessedImage(null);
    setProgress(0);
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
      // Simulate input event
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileUpload({ target: fileInputRef.current });
      }
    }
  };

  const [autoCrop, setAutoCrop] = useState(true);

  const cropToContent = async (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        
        if (minX > maxX || minY > maxY) {
          URL.revokeObjectURL(objectUrl);
          resolve(blob);
          return;
        }
        
        const padding = 0;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);
        
        const width = maxX - minX + 1; // +1 to include the bound pixel
        const height = maxY - minY + 1;
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(
          canvas,
          minX, minY, width, height,
          0, 0, width, height
        );
        
        cropCanvas.toBlob((newBlob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(newBlob);
        }, 'image/png');
      };
      img.src = objectUrl;
    });
  };

  const startProcess = async () => {
    if (!originalFile || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const config = {
        progress: (key, current, total) => {
          const p = Math.round((current / total) * 100);
          setProgress(p > 100 ? 100 : p);
        }
      };
      
      let blob = await removeBackground(originalFile, config);
      
      if (autoCrop) {
        setProgress(99); // Indicate cropping phase
        blob = await cropToContent(blob);
      }
      
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (error) {
      console.error("Background removal failed:", error);
      alert("Failed to remove background. Please try another image.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleReset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    setOriginalFile(null);
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      {/* Header */}
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
              {persona.isOnDevice && <Cpu size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Source Image */}
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
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Drag & drop or click to browse files.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
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
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
                  {isProcessing ? 'Wait...' : 'START'}
                </button>
              </div>
              
              <div className="p-4 flex flex-col">
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => setAutoCrop(!autoCrop)}>
                      Auto-crop to Object
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">Automatically trims transparent borders.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAutoCrop(!autoCrop)}
                    className={clsx(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none p-[2px]",
                      autoCrop ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                    )}
                    style={{ "--color-primary": persona.theme.primary }}
                  >
                    <span className="sr-only">Auto-crop to Object</span>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full transition duration-300 ease-in-out",
                        autoCrop ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    <span>Removing Background</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: persona.theme.primary }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 text-center">Downloading AI models on first run may take a moment...</p>
                </div>
              )}
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Image Details</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500 font-medium">Filename</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={originalFile?.name}>{originalFile ? originalFile.name : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500 font-medium">Original Size</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{originalFile ? formatSize(originalFile.size) : '-'}</span>
              </div>
              {processedImage && (
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Status</span>
                  <span className="text-sm font-black text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }}>
                    REMOVED
                  </span>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">

            {/* Preview Area */}
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[400px] shrink-0 overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Preview Workspace
                </h3>
                {processedImage && (
                  <a 
                    href={processedImage}
                    download={`bg-removed-${originalFile?.name || 'image.png'}`}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Download size={14} />
                    PNG
                  </a>
                )}
              </div>
              
              <div className="flex-1 relative p-4 flex flex-col min-h-0">
                {!originalImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">No image selected.</span>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-white/10 rounded-lg overflow-hidden border border-slate-100 dark:border-white/5 min-h-0">
                    {/* Original Preview */}
                    <div className="bg-white dark:bg-[#1a1a1a] flex flex-col min-h-[250px] md:min-h-0 md:h-full overflow-hidden">
                    <div className="p-3 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center shrink-0 h-[44px]">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FileImage className="w-3.5 h-3.5" /> Original</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-md">{originalFile ? formatSize(originalFile.size) : '0 B'}</span>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-center checkerboard-bg min-h-0 overflow-hidden">
                      <img src={originalImage} alt="Original" className="rounded-lg drop-" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 220px)', width: 'auto', height: 'auto', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Processed Preview */}
                  <div className="bg-white dark:bg-[#1a1a1a] flex flex-col min-h-[300px] md:min-h-0 md:h-full relative">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-500/20 flex justify-between items-center shrink-0 h-[44px]">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Eraser className="w-3.5 h-3.5" /> Cutout Result</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-500/30 px-2 py-0.5 rounded-md">READY</span>
                    </div>
                    <div 
                      className="flex-1 p-4 flex items-center justify-center relative checkerboard-bg min-h-0 overflow-hidden"
                    >
                      {!processedImage ? (
                        <div className="text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin" style={{ color: persona.theme.primary }} />
                              <span>Applying magic...</span>
                            </>
                          ) : (
                            <span>Click START to remove background</span>
                          )}
                        </div>
                      ) : (
                        <img src={processedImage} alt="Processed Cutout" className="drop- animate-in fade-in zoom-in-95 duration-500" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 220px)', width: 'auto', height: 'auto', objectFit: 'contain' }} />
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
