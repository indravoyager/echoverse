import { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Download, Image as ImageIcon, RotateCcw, Settings2, FileImage, Link as LinkIcon, Unlink, TrendingDown, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

const LocalSlider = ({ value, min, max, onChangeEnd, persona, label, helpText }) => {
  const [localVal, setLocalVal] = useState(value);
  
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</label>
        <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{localVal}%</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={localVal} 
        onChange={(e) => setLocalVal(Number(e.target.value))}
        onMouseUp={() => onChangeEnd(localVal)}
        onTouchEnd={() => onChangeEnd(localVal)}
        className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
        style={{ '--slider-thumb-color': persona.theme.primary }}
      />
      <p className="text-[10px] text-slate-500 mt-1.5">{helpText}</p>
    </div>
  );
};

export default function CompressorApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [imageFile, setImageFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null); // dataURL
  const [compressedImage, setCompressedImage] = useState(null); // dataURL
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [quality, setQuality] = useState(80); // 0 to 100
  const [scale, setScale] = useState(100); // 10 to 100
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [isLinked, setIsLinked] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(!!originalImage);
    }
  }, [originalImage, onUnsavedDataChange]);

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
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      alert('Please drop a valid image file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setImageFile(file);
    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const img = new window.Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        setScale(100);
        setOriginalImage(src);
        compressImage(src, quality, img.width, img.height);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (src, qual, tWidth, tHeight) => {
    if (!src || tWidth <= 0 || tHeight <= 0) return;
    
    // Skip loading state and artificial delay for files under 3MB or dimensions under 3000px
    const isLargeFile = originalSize > 3 * 1024 * 1024 || tWidth > 3000 || tHeight > 3000;
    
    if (isLargeFile) setIsCompressing(true);
    
    const runCompression = () => {
      const img = new window.Image();
      img.onload = () => {
        const doCanvas = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = tWidth;
          canvas.height = tHeight;
          
          ctx.drawImage(img, 0, 0, tWidth, tHeight);
          
          // Determine format: mostly webp/jpeg to actually compress well
          let format = 'image/jpeg';
          if (imageFile?.type === 'image/webp' || imageFile?.type === 'image/png') {
             format = 'image/webp'; // Webp allows good compression for png too
          }

          const dataUrl = canvas.toDataURL(format, qual / 100);
          setCompressedImage(dataUrl);
          
          // Calculate size of base64
          const base64str = dataUrl.split(',')[1];
          const decoded = atob(base64str);
          setCompressedSize(decoded.length);
          if (isLargeFile) setIsCompressing(false);
        };

        // Defer heavy canvas processing for large files to keep UI responsive
        if (isLargeFile) {
          setTimeout(doCanvas, 10);
        } else {
          doCanvas();
        }
      };
      img.src = src;
    };

    if (isLargeFile) {
      // Defer execution to allow UI to paint the loading state
      setTimeout(runCompression, 10);
    } else {
      runCompression();
    }
  };

  // Re-compress when settings change
  useEffect(() => {
    if (originalImage) {
      const timer = setTimeout(() => {
        compressImage(originalImage, quality, targetWidth, targetHeight);
      }, 300); // debounce
      return () => clearTimeout(timer);
    }
  }, [quality, targetWidth, targetHeight]);

  const handleReset = () => {
    setImageFile(null);
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setIsCompressing(false);
    setQuality(80);
    setScale(100);
    setTargetWidth(0);
    setTargetHeight(0);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setIsLinked(true);
  };

  const handleDownload = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    const ext = imageFile?.type === 'image/png' || imageFile?.type === 'image/webp' ? 'webp' : 'jpg';
    link.download = `compressed_${imageFile?.name.split('.')[0] || 'image'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    className={`flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
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
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-1">
                {/* Quality Slider */}
                <LocalSlider
                  label="Quality"
                  helpText="Lower quality reduces file size further."
                  value={quality}
                  min={1}
                  max={100}
                  onChangeEnd={(val) => setQuality(val)}
                  persona={persona}
                />

                {/* Scale Slider */}
                <LocalSlider
                  label="Image Size"
                  helpText="Reduce the dimensions proportionally."
                  value={scale}
                  min={10}
                  max={100}
                  onChangeEnd={(newScale) => {
                    setScale(newScale);
                    if (originalWidth > 0 && originalHeight > 0) {
                      setTargetWidth(Math.round(originalWidth * (newScale / 100)));
                      setTargetHeight(Math.round(originalHeight * (newScale / 100)));
                      setIsLinked(true);
                    }
                  }}
                  persona={persona}
                />

                {/* Dimensions Inputs */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dimensions (px)</label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Width</label>
                      <input 
                        type="number"
                        value={targetWidth || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTargetWidth(val);
                          if (isLinked && originalWidth > 0) {
                            setTargetHeight(Math.round(val * (originalHeight / originalWidth)));
                            setScale(Math.round((val / originalWidth) * 100));
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-[var(--tw-ring-color)]"
                        style={{ '--tw-ring-color': persona.theme.primary }}
                      />
                    </div>
                    
                    <button 
                      onClick={() => setIsLinked(!isLinked)}
                      className={clsx(
                        "mt-5 h-7 w-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 border",
                        isLinked 
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20" 
                          : "bg-slate-50 dark:bg-[#0a0a0a]/50 border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                      style={isLinked ? { '--color-primary': persona.theme.primary } : {}}
                      title={isLinked ? "Unlink Dimensions" : "Link Dimensions"}
                    >
                      {isLinked ? <LinkIcon size={14} /> : <Unlink size={14} />}
                    </button>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height</label>
                      <input 
                        type="number"
                        value={targetHeight || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTargetHeight(val);
                          if (isLinked && originalHeight > 0) {
                            setTargetWidth(Math.round(val * (originalWidth / originalHeight)));
                            setScale(Math.round((val / originalHeight) * 100));
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-[var(--tw-ring-color)]"
                        style={{ '--tw-ring-color': persona.theme.primary }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">Adjust the dimensions to resize the image.</p>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.theme.primary }} />
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Savings Report</h3>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reduced By</span>
                    <div className="flex items-end gap-1" style={{ color: persona.theme.primary }}>
                      <span className="text-4xl font-black leading-none tracking-tighter">
                        {originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0}
                      </span>
                      <span className="text-lg font-bold pb-1">%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original</span>
                      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{formatSize(originalSize)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compressed</span>
                      <span className="text-[13px] font-bold" style={{ color: persona.theme.primary }}>{formatSize(compressedSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Visualization */}
                <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                  <div 
                    className="h-full transition-all duration-500 ease-out rounded-r-sm"
                    style={{ 
                      width: `${originalSize > 0 ? (compressedSize / originalSize) * 100 : 100}%`,
                      backgroundColor: persona.theme.primary 
                    }} 
                  />
                  <div 
                    className="h-full flex-1 transition-all duration-500 ease-out opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, ${persona.theme.primary} 0, ${persona.theme.primary} 4px, transparent 4px, transparent 8px)`
                    }}
                  />
                </div>
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
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-md">{formatSize(originalSize)}</span>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-center checkerboard-bg min-h-0 overflow-hidden">
                      <img src={originalImage} alt="Original" className="rounded-lg drop-" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 220px)', width: 'auto', height: 'auto', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Compressed Preview */}
                  <div className="bg-white dark:bg-[#1a1a1a] flex flex-col min-h-[300px] md:min-h-0 md:h-full relative">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-500/20 flex justify-between items-center shrink-0 h-[44px]">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Compressed</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-500/30 px-2 py-0.5 rounded-md">{formatSize(compressedSize)}</span>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden checkerboard-bg relative min-h-0">
                      {compressedImage && <img src={compressedImage} alt="Compressed" className={clsx("rounded-lg drop- transition-all duration-300", isCompressing ? "opacity-30 blur-sm scale-95" : "opacity-100 scale-100")} style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 220px)', width: 'auto', height: 'auto', objectFit: 'contain' }} />}
                      {isCompressing && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="w-10 h-10 border-4 border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin absolute" style={{ '--color-primary': persona.theme.primary }}></div>
                          </div>
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
