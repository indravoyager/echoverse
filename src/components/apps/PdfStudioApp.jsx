import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Settings2, FileText, Loader2, CheckCircle2, RotateCcw, Scissors, Layers, Plus, X, Image as ImageIcon, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

export default function PdfStudioApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [activeTab, setActiveTab] = useState('merge'); // 'merge' or 'split'
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Merge specific settings
  const [pageSize, setPageSize] = useState('auto');
  const [stretchToFill, setStretchToFill] = useState(false);

  // Split specific settings
  const [splitMode, setSplitMode] = useState('extract'); // 'extract' (ranges) or 'everyN' (chunks)
  const [splitRanges, setSplitRanges] = useState('1'); // e.g. "1,3,5-10"
  const [splitChunkSize, setSplitChunkSize] = useState(2); // every N pages
  const [splitTotalPages, setSplitTotalPages] = useState(0);

  const fileInputRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({ pdflib: false, jszip: false });

  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(files.length > 0);
    }
  }, [files, onUnsavedDataChange]);

  useEffect(() => {
    // Load PDF-lib and JSZip dynamically
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'pdflib-script'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'jszip-script')
    ]).then(() => {
      setScriptsLoaded({ pdflib: true, jszip: true });
    }).catch(err => console.error("Failed to load PDF libraries", err));
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
    const isValidFile = (f) => activeTab === 'merge' 
      ? (f.type === 'application/pdf' || f.type.startsWith('image/'))
      : f.type === 'application/pdf';
    const droppedFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    } else {
      alert(activeTab === 'merge' ? 'Please drop valid PDF or Image files.' : 'Please drop valid PDF files.');
    }
  };

  const handleFileUpload = (e) => {
    const isValidFile = (f) => activeTab === 'merge' 
      ? (f.type === 'application/pdf' || f.type.startsWith('image/'))
      : f.type === 'application/pdf';
    const selectedFiles = Array.from(e.target.files).filter(isValidFile);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    e.target.value = null;
  };

  const addFiles = async (newFiles) => {
    if (activeTab === 'split') {
      // For split, only allow 1 file
      const file = newFiles[0];
      if (file) {
        setFiles([{
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          status: 'ready'
        }]);
        // Get page count
        if (window.PDFLib) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            setSplitTotalPages(pdfDoc.getPageCount());
            setSplitRanges(`1-${pdfDoc.getPageCount()}`);
          } catch (e) {
            console.error(e);
            setSplitTotalPages(0);
          }
        }
      }
    } else {
      // For merge, append files
      const mappedFiles = newFiles.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        name: f.name,
        size: f.size,
        status: 'ready'
      }));
      setFiles(prev => [...prev, ...mappedFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeTab === 'split' && files.length <= 1) {
      setSplitTotalPages(0);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index - 1];
    newFiles[index - 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index + 1];
    newFiles[index + 1] = newFiles[index];
    newFiles[index] = temp;
    setFiles(newFiles);
  };

  const parseRanges = (rangeStr, maxPages) => {
    const pages = new Set();
    const parts = rangeStr.replace(/\s/g, '').split(',');
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) pages.add(i);
          }
        }
      } else {
        const page = Number(part);
        if (page && page >= 1 && page <= maxPages) pages.add(page);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    if (!scriptsLoaded.pdflib || !scriptsLoaded.jszip) {
      alert("Please wait for PDF libraries to load...");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Initializing...');

    try {
      const { PDFDocument } = window.PDFLib;

      if (activeTab === 'merge') {
        setStatusMessage('Merging documents...');
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
          setStatusMessage(`Processing file ${i + 1} of ${files.length}...`);
          setProgress(Math.round(((i) / files.length) * 50));
          
          const file = files[i].file;
          const fileType = file.type;

          // Pre-calculate target dimensions if not auto
          let targetWidth = 0, targetHeight = 0;
          if (pageSize !== 'auto') {
             if (pageSize === 'A3') { targetWidth = 841.89; targetHeight = 1190.55; }
             else if (pageSize === 'A4') { targetWidth = 595.28; targetHeight = 841.89; }
             else if (pageSize === 'A5') { targetWidth = 420.94; targetHeight = 595.28; }
             else if (pageSize === 'A6') { targetWidth = 297.64; targetHeight = 420.94; }
          }

          if (fileType === 'application/pdf') {
            const fileData = await file.arrayBuffer();
            if (pageSize === 'auto') {
              const pdfToMerge = await PDFDocument.load(fileData, { ignoreEncryption: true });
              const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
              copiedPages.forEach((page) => mergedPdf.addPage(page));
            } else {
              const embeddedPages = await mergedPdf.embedPdf(fileData);
              embeddedPages.forEach((embeddedPage) => {
                const page = mergedPdf.addPage([targetWidth, targetHeight]);
                if (stretchToFill) {
                    page.drawPage(embeddedPage, {
                        x: 0,
                        y: 0,
                        width: targetWidth,
                        height: targetHeight,
                    });
                } else {
                    const dims = embeddedPage.scale(1);
                    const scale = Math.min(targetWidth / dims.width, targetHeight / dims.height);
                    const scaledWidth = dims.width * scale;
                    const scaledHeight = dims.height * scale;
                    page.drawPage(embeddedPage, {
                        x: (targetWidth - scaledWidth) / 2,
                        y: (targetHeight - scaledHeight) / 2,
                        width: scaledWidth,
                        height: scaledHeight,
                    });
                }
              });
            }
          } else if (fileType.startsWith('image/')) {
            let arrayBuffer = await file.arrayBuffer();
            let pdfImage;
            
            try {
                if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
                    pdfImage = await mergedPdf.embedJpg(arrayBuffer);
                } else if (fileType === 'image/png') {
                    pdfImage = await mergedPdf.embedPng(arrayBuffer);
                } else {
                    throw new Error('Fallback to canvas');
                }
            } catch (e) {
                // Fallback for WebP or invalid formats
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve, reject) => { 
                    img.onload = resolve; 
                    img.onerror = reject; 
                });
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const res = await fetch(jpgDataUrl);
                arrayBuffer = await res.arrayBuffer();
                pdfImage = await mergedPdf.embedJpg(arrayBuffer);
            }

            const { width, height } = pdfImage.scale(1);
            if (pageSize === 'auto') {
                const page = mergedPdf.addPage([width, height]);
                page.drawImage(pdfImage, { x: 0, y: 0, width, height });
            } else {
                const page = mergedPdf.addPage([targetWidth, targetHeight]);
                if (stretchToFill) {
                    page.drawImage(pdfImage, {
                        x: 0,
                        y: 0,
                        width: targetWidth,
                        height: targetHeight,
                    });
                } else {
                    const scale = Math.min(targetWidth / width, targetHeight / height);
                    const scaledWidth = width * scale;
                    const scaledHeight = height * scale;
                    page.drawImage(pdfImage, {
                        x: (targetWidth - scaledWidth) / 2,
                        y: (targetHeight - scaledHeight) / 2,
                        width: scaledWidth,
                        height: scaledHeight,
                    });
                }
            }
          }
        }

        setStatusMessage('Finalizing merged document...');
        setProgress(80);
        
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Merged_Document_${new Date().getTime()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
      } else if (activeTab === 'split') {
        const sourceFile = files[0];
        const fileData = await sourceFile.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(fileData, { ignoreEncryption: true });
        const totalPages = sourcePdf.getPageCount();

        if (splitMode === 'extract') {
          setStatusMessage('Extracting pages...');
          const pagesToExtract = parseRanges(splitRanges, totalPages);
          if (pagesToExtract.length === 0) throw new Error("Invalid page range specified.");
          
          const newPdf = await PDFDocument.create();
          // pageIndices are 0-indexed, pagesToExtract are 1-indexed
          const indices = pagesToExtract.map(p => p - 1);
          const copiedPages = await newPdf.copyPages(sourcePdf, indices);
          copiedPages.forEach((page) => newPdf.addPage(page));
          
          setProgress(80);
          const newPdfBytes = await newPdf.save();
          const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Extracted_Pages.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          
        } else if (splitMode === 'everyN') {
          setStatusMessage(`Splitting every ${splitChunkSize} pages...`);
          const zip = new window.JSZip();
          
          let chunkIndex = 1;
          for (let i = 0; i < totalPages; i += splitChunkSize) {
            setProgress(Math.round((i / totalPages) * 70));
            const newPdf = await PDFDocument.create();
            const end = Math.min(i + splitChunkSize, totalPages);
            const indices = [];
            for (let j = i; j < end; j++) indices.push(j);
            
            const copiedPages = await newPdf.copyPages(sourcePdf, indices);
            copiedPages.forEach((page) => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            zip.file(`Part_${chunkIndex}_(Pages_${i+1}-${end}).pdf`, pdfBytes);
            chunkIndex++;
          }
          
          setStatusMessage('Zipping files...');
          setProgress(85);
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Split_${sourceFile.name.replace('.pdf', '')}.zip`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }

      setProgress(100);
      setStatusMessage('Complete!');
      
      setFiles(files.map(f => ({ ...f, status: 'done' })));
      
    } catch (error) {
      console.error(error);
      setStatusMessage('Error: ' + error.message);
      setFiles(files.map(f => ({ ...f, status: 'error' })));
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setStatusMessage('');
      }, 2000);
    }
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
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setFiles([])} 
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

      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Configuration
                </h3>
                <button 
                  onClick={handleProcess}
                  disabled={files.length === 0 || isProcessing || !scriptsLoaded.pdflib}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: files.length === 0 ? 'gray' : persona.theme.primary }}
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : activeTab === 'merge' ? <Layers size={14} /> : <Scissors size={14} />}
                  {isProcessing ? 'WAIT...' : activeTab === 'merge' ? 'MERGE' : 'SPLIT'}
                </button>
              </div>
              <div className="p-4 flex flex-col gap-4 flex-1">
                <SegmentedControl
                  value={activeTab}
                  onChange={(val) => { setActiveTab(val); setFiles([]); }}
                  options={[
                    { value: 'merge', label: 'Merge', icon: Layers },
                    { value: 'split', label: 'Split', icon: Scissors }
                  ]}
                />

                {activeTab === 'merge' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white mb-2">Page Size</p>
                      <SegmentedControl
                        value={pageSize}
                        onChange={setPageSize}
                        options={[
                          { value: 'auto', label: 'AUTO' },
                          { value: 'A3', label: 'A3' },
                          { value: 'A4', label: 'A4' },
                          { value: 'A5', label: 'A5' },
                          { value: 'A6', label: 'A6' }
                        ]}
                      />
                      
                      {pageSize !== 'auto' && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
                          <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Stretch to Fill Canvas</span>
                          <button 
                            onClick={() => setStretchToFill(!stretchToFill)}
                            className={clsx(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none p-[2px]",
                              stretchToFill ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                            )}
                            style={{ '--color-primary': persona.theme.primary }}
                          >
                            <span className={clsx("inline-block h-3 w-3 transform rounded-full transition duration-300 ease-in-out", stretchToFill ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0")} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'split' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-white/10">
                      <span className="text-[13px] font-bold text-slate-800 dark:text-white">Total Pages</span>
                      <span className="text-[13px] font-bold text-slate-800 dark:text-white">{splitTotalPages > 0 ? splitTotalPages : '-'}</span>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors" style={{ borderColor: splitMode === 'extract' ? persona.theme.primary : 'transparent', backgroundColor: splitMode === 'extract' ? `color-mix(in srgb, ${persona.theme.primary} 5%, transparent)` : 'var(--bg-card)' }}>
                        <input type="radio" checked={splitMode === 'extract'} onChange={() => setSplitMode('extract')} className="mt-0.5" style={{ accentColor: persona.theme.primary }} />
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white mb-1">Extract Specific Pages</p>
                          <input 
                            type="text" 
                            value={splitRanges} 
                            onChange={(e) => setSplitRanges(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                            placeholder="e.g. 1, 3, 5-10"
                            onClick={(e) => setSplitMode('extract')}
                          />
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors" style={{ borderColor: splitMode === 'everyN' ? persona.theme.primary : 'transparent', backgroundColor: splitMode === 'everyN' ? `color-mix(in srgb, ${persona.theme.primary} 5%, transparent)` : 'var(--bg-card)' }}>
                        <input type="radio" checked={splitMode === 'everyN'} onChange={() => setSplitMode('everyN')} className="mt-0.5" style={{ accentColor: persona.theme.primary }} />
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white mb-1">Split Every N Pages</p>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="1" 
                              max={splitTotalPages} 
                              value={splitChunkSize} 
                              onChange={(e) => setSplitChunkSize(Number(e.target.value) || 1)} 
                              className="w-20 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                              onClick={(e) => setSplitMode('everyN')}
                            />
                            <span className="text-[11px] text-slate-500">pages/file (saves as .zip)</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            {files.length === 0 ? (
              <div 
                className={clsx(
                  "flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all duration-300 bg-white/50 dark:bg-black/20 relative",
                  isDragging 
                    ? "border-[var(--color-brand-magenta)] bg-[var(--color-brand-magenta)]/5 scale-[0.99]" 
                    : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple={activeTab === 'merge'}
                  accept={activeTab === 'merge' ? ".pdf,image/*" : ".pdf"}
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-slate-400">
                  <FileText size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                  Drop your {activeTab === 'merge' ? 'PDFs or Images' : 'PDF file'} here
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                  {activeTab === 'merge' 
                    ? "Upload PDFs and Images to merge them into a single document." 
                    : "Upload a PDF to extract pages or split it into chunks."}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white active:scale-95"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col h-full overflow-hidden relative">
                <div className="h-[46px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center px-4 shrink-0">
                  <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                    {activeTab === 'merge' ? 'Files to Merge' : 'Source File'}
                  </div>
                  {activeTab === 'merge' && (
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-brand-magenta)] hover:opacity-80 transition-opacity">
                      <Plus size={14} /> Add More
                      <input type="file" multiple accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)] flex items-center justify-center shrink-0">
                          {file.status === 'done' ? <CheckCircle2 size={20} className="text-green-500" /> : (file.file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />)}
                        </div>
                        <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {activeTab === 'merge' && (
                          <div className="flex flex-col mr-2">
                            <button onClick={() => moveUp(index)} disabled={index === 0} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronUpIcon /></button>
                            <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDownIcon /></button>
                          </div>
                        )}
                        <button onClick={() => removeFile(file.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                      <svg className="animate-spin text-slate-200 dark:text-slate-700 w-full h-full" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="var(--color-brand-magenta)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[var(--color-brand-magenta)]">{progress}%</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{statusMessage}</h3>
                    <p className="text-xs text-slate-500">Please wait, do not close this tab.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
