import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Image as ImageIcon, RotateCcw, Settings2, FileArchive, Loader2, CheckCircle2, PlayCircle, Layers, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
export default function ConverterApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [quality, setQuality] = useState(80);
  const [scale, setScale] = useState(100);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [processedResults, setProcessedResults] = useState({});

  const handleIndividualDownload = async (id) => {
    const items = processedResults[id];
    if (!items || items.length === 0) return;
    
    if (items.length === 1) {
      const a = document.createElement('a');
      a.href = items[0].dataUrl;
      a.download = items[0].name;
      a.click();
    } else {
      const zip = new window.JSZip();
      items.forEach(item => {
        const base64Data = item.dataUrl.split(',')[1];
        zip.file(item.name, base64Data, { base64: true });
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_pages_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const fileInputRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({ pdfjs: false, jszip: false });

  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(files.length > 0);
    }
  }, [files, onUnsavedDataChange]);

  useEffect(() => {
    // Load PDF.js and JSZip dynamically
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
        // Set worker src
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setScriptsLoaded(prev => ({ ...prev, pdfjs: true }));

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'jszip-script');
        setScriptsLoaded(prev => ({ ...prev, jszip: true }));
      } catch (err) {
        console.error("Script loading error:", err);
      }
    };

    initScripts();
  }, []);

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
    if (e.dataTransfer?.files?.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files?.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length !== newFiles.length) {
      alert("Some files were skipped. Only Images and PDFs are supported.");
    }
    const withIds = validFiles.map(f => ({ id: Math.random().toString(36).substring(2, 11), file: f }));
    setFiles(prev => [...prev, ...withIds]);
  };

  const removeFile = (idToRemove) => {
    setFiles(prev => prev.filter(f => f.id !== idToRemove));
    setProcessedResults(prev => {
      const next = { ...prev };
      delete next[idToRemove];
      return next;
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert a single image file via Canvas
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement('canvas');
        const targetWidth = img.width * (scale / 100);
        const targetHeight = img.height * (scale / 100);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        // Fill white background just in case converting PNG to JPG
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const dataUrl = canvas.toDataURL(targetFormat, quality / 100);
        const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        resolve([{ name: `${baseName}.${ext}`, dataUrl }]);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      
      img.src = objUrl;
    });
  };

  // Convert PDF to multiple images via PDF.js
  const processPDF = async (file) => {
    if (!window.pdfjsLib) throw new Error("PDF.js not loaded yet.");
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const results = [];
    
    const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setStatusMessage(`Extracting PDF: ${file.name} (Page ${pageNum}/${numPages})...`);
      const page = await pdf.getPage(pageNum);
      // scale parameter: let's use standard 2.0 for decent resolution, then apply user scale
      const viewport = page.getViewport({ scale: 2.0 * (scale / 100) });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // If JPG, we might want white bg (pdf.js renders transparent background for pdf pages sometimes)
      if (targetFormat === 'image/jpeg') {
         ctx.globalCompositeOperation = 'destination-over';
         ctx.fillStyle = '#FFFFFF';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const dataUrl = canvas.toDataURL(targetFormat, quality / 100);
      results.push({ name: `${baseName}_page${pageNum}.${ext}`, dataUrl });
      
      // Yield to main thread
      await new Promise(r => setTimeout(r, 10));
    }
    
    return results;
  };

  const startBatchProcess = async () => {
    if (files.length === 0 || !scriptsLoaded.jszip) return;
    setIsProcessing(true);
    setCompletedSteps(0);
    setTotalSteps(files.length);
    setProgress(0);
    setStatusMessage('Starting batch process...');
    setDownloadUrl(null);

    const zip = new window.JSZip();
    let currentStep = 0;

    try {
      for (const fileObj of files) {
        const file = fileObj.file;
        setStatusMessage(`Processing: ${file.name}...`);
        
        let outputItems = [];
        if (file.type === 'application/pdf') {
          outputItems = await processPDF(file);
        } else {
          outputItems = await processImage(file);
        }

        setProcessedResults(prev => ({ ...prev, [fileObj.id]: outputItems }));

        for (const item of outputItems) {
          const base64Data = item.dataUrl.split(',')[1];
          zip.file(item.name, base64Data, { base64: true });
        }

        currentStep++;
        setCompletedSteps(currentStep);
        setProgress((currentStep / files.length) * 100);
      }

      setStatusMessage('Bundling into ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
         setStatusMessage(`Compressing ZIP: ${Math.round(metadata.percent)}%`);
      });
      
      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);
      setDownloadFilename(`echo_converted_${Date.now()}.zip`);
      setStatusMessage('Done!');
      
    } catch (error) {
      console.error(error);
      alert(`Error during processing: ${error.message}`);
      setStatusMessage('Error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setProcessedResults({});
    setIsProcessing(false);
    setProgress(0);
    setCompletedSteps(0);
    setTotalSteps(0);
    setStatusMessage('');
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30">
      </div>
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
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] disabled:opacity-50"
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
            {/* Source Files */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileArchive className="w-4 h-4 text-slate-400" />
                  Source Files
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors",
                      isProcessing ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10' :
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 cursor-pointer' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" multiple disabled={isProcessing} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop files here!' : files.length > 0 ? 'Add More Files' : 'Upload Files'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Images and PDFs supported.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Settings
                </h3>
                <button 
                  onClick={startBatchProcess}
                  disabled={files.length === 0 || isProcessing || !scriptsLoaded.pdfjs || !scriptsLoaded.jszip}
                  className="flex items-center justify-center gap-1.5 h-7 w-[80px] -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin shrink-0" /> : <PlayCircle size={14} className="shrink-0" />}
                  <span>Start</span>
                </button>
              </div>
              
              <div className="p-4 flex flex-col gap-4 flex-1">
              {/* Format Target */}
              <div className="mb-0">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Target Format</label>
                <SegmentedControl
                  value={targetFormat}
                  onChange={setTargetFormat}
                  options={[
                    { value: 'image/png', label: 'PNG' },
                    { value: 'image/jpeg', label: 'JPG' },
                    { value: 'image/webp', label: 'WEBP' }
                  ]}
                />
                {/*
                  <div 
                    className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out"
                    style={{
                       width: `calc((100% - 8px) / 3)`,
                       transform: `translateX(calc(${['image/png', 'image/jpeg', 'image/webp'].indexOf(targetFormat)} * 100%))`
                    }}
                  />
                  {[
                    { val: 'image/png', label: 'PNG' },
                    { val: 'image/jpeg', label: 'JPG' },
                    { val: 'image/webp', label: 'WEBP' }
                  ].map(fmt => (
                    <button
                      key={fmt.val}
                      disabled={isProcessing}
                      onClick={() => setTargetFormat(fmt.val)}
                      className={clsx(
                        "flex-1 relative z-10 flex items-center justify-center py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50",
                        targetFormat === fmt.val 
                          ? "text-slate-800 dark:text-white" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      {fmt.label}
                    </button>
                  ))}
                */}
              </div>

              {/* Quality Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quality</label>
                  <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{quality}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing disabled:opacity-50"
                  style={{ '--slider-thumb-color': persona.theme.primary }}
                />
                <p className="text-[10px] text-slate-500 mt-1">Lower quality reduces file size further.</p>
              </div>

              {/* Scale Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Resolution Scale</label>
                  <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{scale}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={scale} 
                  onChange={(e) => setScale(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing disabled:opacity-50"
                  style={{ '--slider-thumb-color': persona.theme.primary }}
                />
                <p className="text-[10px] text-slate-500 mt-1">Reduce the dimensions to save massive space.</p>
              </div>
              </div>
            </div>

            {/* Status Panel */}
            {(isProcessing || completedSteps > 0) && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                  <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                    <Layers className="w-4 h-4" style={{ color: persona.theme.primary }} /> Status
                  </h3>
                </div>
                
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[12px]">
                  <span className="text-slate-500">Files processed:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{completedSteps} / {totalSteps}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: persona.theme.primary }}
                  ></div>
                </div>
                
                <p className="text-[11px] text-slate-400 mt-1 italic truncate">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload and File List Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
            {/* File Queue */}
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-slate-400" />
                  Queue List ({files.length})
                </h3>
                {downloadUrl && (
                  <a 
                    href={downloadUrl}
                    download="converted_files.zip"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity bg-[var(--color-primary)]"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <Download size={14} />
                    Download ZIP
                  </a>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {files.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <FileArchive className="w-8 h-8" />
                    <span className="text-sm font-medium">No files added yet.</span>
                  </div>
                ) : (
                  files.map((fileObj) => {
                    const { id, file } = fileObj;
                    return (
                    <div key={id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white dark:bg-[#0a0a0a] rounded-lg shrink-0">
                          {file.type === 'application/pdf' ? (
                            <FileArchive className="w-4 h-4 text-rose-500" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-500">{formatSize(file.size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {processedResults[id] && (
                          <button 
                            onClick={() => handleIndividualDownload(id)}
                            className="p-1.5 rounded-md text-white hover:opacity-90 transition-opacity bg-slate-800 dark:bg-slate-700"
                            title="Download Result"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {!isProcessing && (
                          <button onClick={() => removeFile(id)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
