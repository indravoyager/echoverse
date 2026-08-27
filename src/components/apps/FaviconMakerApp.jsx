import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Image as ImageIcon, SlidersHorizontal, FileArchive, Package, CheckCircle2, RotateCcw, Loader2, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
import JSZip from 'jszip';

export default function FaviconMakerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [borderRadius, setBorderRadius] = useState(0); // 0 to 50
  const [exportPng, setExportPng] = useState(true);
  const [exportWebp, setExportWebp] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedSize, setSelectedSize] = useState('all');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (generatedSuccess) {
      const timer = setTimeout(() => setGeneratedSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [generatedSuccess]);

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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files?.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setSelectedImage(file);
      setPreviewImage(url);
    } else {
      alert("Please upload an image file.");
    }
  };

  const getRoundedCanvas = (img, size, radiusPercent) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;

    if (radiusPercent > 0) {
      ctx.beginPath();
      const maxRadius = size / 2;
      const radius = (radiusPercent / 50) * maxRadius;

      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
    return canvas;
  };

  const getSizesList = () => {
    if (selectedSize === 'all') {
      return [
        { name: 'favicon-16x16', size: 16 },
        { name: 'favicon-32x32', size: 32 },
        { name: 'apple-touch-icon', size: 180 },
        { name: 'android-chrome-192x192', size: 192 },
        { name: 'android-chrome-512x512', size: 512 }
      ];
    }
    return [{ name: `icon-${selectedSize}x${selectedSize}`, size: Number(selectedSize) }];
  };

  const generateAndDownload = async () => {
    if (!previewImage) return;

    setIsGenerating(true);
    setGeneratedSuccess(false);

    try {
      const img = new window.Image();
      img.src = previewImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const zip = new JSZip();
      const folder = zip.folder("favicon_bundle");

      const sizes = getSizesList();

      for (const s of sizes) {
        const canvas = getRoundedCanvas(img, s.size, borderRadius);
        
        if (exportPng) {
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          folder.file(`${s.name}.png`, base64Data, { base64: true });
          
          if (s.size === 32) {
             folder.file(`favicon.ico`, base64Data, { base64: true });
          }
        }

        if (exportWebp) {
          const dataUrlWebp = canvas.toDataURL('image/webp', 0.9);
          const base64DataWebp = dataUrlWebp.replace(/^data:image\/webp;base64,/, "");
          folder.file(`${s.name}.webp`, base64DataWebp, { base64: true });
        }
      }

      const manifest = {
        "name": "App",
        "short_name": "App",
        "icons": [
          { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
        ],
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone"
      };
      folder.file("site.webmanifest", JSON.stringify(manifest, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'favicon_bundle.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setGeneratedSuccess(true);
    } catch (error) {
      console.error("Error generating favicons:", error);
      alert("Failed to generate favicons. Please try again with a different image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setGeneratedSuccess(false);
    setBorderRadius(0);
    setExportPng(true);
    setExportWebp(true);
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
          onClick={handleReset} 
          disabled={isGenerating}
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
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Source Image */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileArchive className="w-4 h-4 text-slate-400" />
                  Source Image
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
                      isGenerating ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10' :
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 cursor-pointer' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" disabled={isGenerating} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop here!' : previewImage ? 'Change Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Square image is highly recommended.</p>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden flex-1 lg:flex-none">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Settings
                </h3>
              </div>
              
              <div className="p-4 flex flex-col gap-5">
                {/* Size Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Output Size</label>
                  <SegmentedControl
                    value={selectedSize}
                    onChange={setSelectedSize}
                    options={[
                      { value: '32', label: '32px' },
                      { value: '192', label: '192px' },
                      { value: '512', label: '512px' },
                      { value: 'all', label: 'ALL' }
                    ]}
                  />
                  {/*
                    <div 
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out"
                      style={{
                         width: `calc((100% - 8px) / 4)`,
                         transform: `translateX(calc(${['32', '192', '512', 'all'].indexOf(selectedSize)} * 100%))`
                      }}
                    />
                    {[
                      { val: '32', label: '32px' },
                      { val: '192', label: '192px' },
                      { val: '512', label: '512px' },
                      { val: 'all', label: 'ALL' }
                    ].map(sz => (
                      <button
                        key={sz.val}
                        disabled={isGenerating}
                        onClick={() => setSelectedSize(sz.val)}
                        className={clsx(
                          "flex-1 relative z-10 flex items-center justify-center py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50",
                          selectedSize === sz.val 
                            ? "text-slate-800 dark:text-white" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {sz.label}
                      </button>
                    ))}
                  */}
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>

                {/* Rounded Corners Slider */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rounded Corners</label>
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10" style={{ color: persona.theme.primary }}>
                      {borderRadius}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={borderRadius} 
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing disabled:opacity-50"
                    style={{ '--slider-thumb-color': persona.theme.primary }}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>Square</span>
                    <span>Circle</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>

                {/* Export Format Toggles */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 block">Output Formats</label>
                  
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">PNG (Standard)</span>
                    <input type="checkbox" className="hidden" checked={exportPng} onChange={() => setExportPng(!exportPng)} disabled={isGenerating} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        exportPng ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500",
                        isGenerating && "opacity-50"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          exportPng ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">WEBP (Modern)</span>
                    <input type="checkbox" className="hidden" checked={exportWebp} onChange={() => setExportWebp(!exportWebp)} disabled={isGenerating} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        exportWebp ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500",
                        isGenerating && "opacity-50"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          exportWebp ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>
                  
                  <p className="text-[10px] text-slate-500 mt-1">.ico format is always included automatically.</p>
                </div>
              </div>
            </div>

            {/* Export Summary Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Export Summary
                </h3>
              </div>
              <div className="p-3.5 flex flex-col">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={!previewImage || isGenerating}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
                      color: persona.theme.primary
                    }}
                  >
                    <RotateCcw size={13} />
                    CLEAR
                  </button>
                  <button 
                    onClick={generateAndDownload}
                    disabled={!previewImage || isGenerating || (!exportPng && !exportWebp)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-white font-bold text-[10px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    style={{ backgroundColor: generatedSuccess ? '#10b981' : persona.theme.primary }}
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : generatedSuccess ? <CheckCircle2 size={13} /> : <Download size={13} />}
                    {isGenerating ? 'WAIT' : 'EXPORT'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[400px] shrink-0 overflow-hidden relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Preview Workspace
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="w-full max-w-md z-10 flex flex-col items-center gap-6">
                  
                  {/* Image Display */}
                  {!previewImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm font-medium">No image selected.</span>
                    </div>
                  ) : (
                    <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIgLz4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZWVlIiAvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VlZSIgLz4KPC9zdmc+')] rounded-3xl ">
                      <div 
                        className="w-48 h-48 sm:w-64 sm:h-64 relative border border-slate-200 dark:border-white/20 bg-white/50 backdrop-blur-sm overflow-hidden flex items-center justify-center"
                        style={{ borderRadius: `${borderRadius}%` }}
                      >
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover transition-all" 
                          style={{ borderRadius: `${borderRadius}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
