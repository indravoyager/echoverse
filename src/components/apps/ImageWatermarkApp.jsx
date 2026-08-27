import { CustomSelect } from '../theme/CustomSelect';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Settings2, Image as ImageIcon, Type, Trash2, Loader2, Maximize, RotateCcw, ChevronDown, Layout, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
import { HexColorPicker } from "react-colorful";
import { usePersistedState } from '../theme/usePersistedState';

const LocalSlider = ({ value, min, max, step = 1, onChangeEnd, persona, label, displayValue }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
        <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{displayValue ?? `${localVal}%`}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localVal}
        onChange={(e) => {
          const val = Number(e.target.value);
          setLocalVal(val);
          onChangeEnd(val);
        }}
        className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
        style={{ '--slider-thumb-color': persona.theme.primary }}
      />
    </div>
  );
};

// Constants
const POSITIONS = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center-left', label: 'Center Left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Center Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' }
];

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial', icon: Type },
  { value: 'Impact', label: 'Impact', icon: Type },
  { value: 'Times New Roman', label: 'Times New Roman', icon: Type },
  { value: 'Courier New', label: 'Courier New', icon: Type },
  { value: 'Verdana', label: 'Verdana', icon: Type },
  { value: 'Georgia', label: 'Georgia', icon: Type }
];

export default function ImageWatermarkApp({ persona, onOpenSidebar, onOpenPersonaInfo, onUnsavedDataChange }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [settings, setSettings] = usePersistedState('imagewatermark_settings', {
    watermarkType: 'text',
    position: 'bottom-right',
    margin: 5,
    opacity: 0.8,
    text: 'ECHO ATURAI',
    fontSize: 5,
    color: '#ffffff',
    fontFamily: 'Arial',
    textShadow: true,
    logoScale: 15
  });
  const { watermarkType, position, margin, opacity, text, fontSize, color, fontFamily, textShadow, logoScale } = settings;

  const setWatermarkType = (val) => setSettings(prev => ({ ...prev, watermarkType: typeof val === 'function' ? val(prev.watermarkType) : val }));
  const setPosition = (val) => setSettings(prev => ({ ...prev, position: typeof val === 'function' ? val(prev.position) : val }));
  const setMargin = (val) => setSettings(prev => ({ ...prev, margin: typeof val === 'function' ? val(prev.margin) : val }));
  const setOpacity = (val) => setSettings(prev => ({ ...prev, opacity: typeof val === 'function' ? val(prev.opacity) : val }));
  const setText = (val) => setSettings(prev => ({ ...prev, text: typeof val === 'function' ? val(prev.text) : val }));
  const setFontSize = (val) => setSettings(prev => ({ ...prev, fontSize: typeof val === 'function' ? val(prev.fontSize) : val }));
  const setColor = (val) => setSettings(prev => ({ ...prev, color: typeof val === 'function' ? val(prev.color) : val }));
  const setFontFamily = (val) => setSettings(prev => ({ ...prev, fontFamily: typeof val === 'function' ? val(prev.fontFamily) : val }));
  const setTextShadow = (val) => setSettings(prev => ({ ...prev, textShadow: typeof val === 'function' ? val(prev.textShadow) : val }));
  const setLogoScale = (val) => setSettings(prev => ({ ...prev, logoScale: typeof val === 'function' ? val(prev.logoScale) : val }));

  const [hexInput, setHexInput] = useState(color.replace('#', ''));
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [swatchRect, setSwatchRect] = useState(null);
  const colorPickerRef = useRef(null);
  
  // Image config
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  
  const [scriptsLoaded, setScriptsLoaded] = useState({ jszip: false });

  // Sync hexInput when color changes
  useEffect(() => {
    setHexInput(color.replace('#', ''));
  }, [color]);


  // Click outside for color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Unsaved Data
  useEffect(() => {
    if (onUnsavedDataChange) {
      onUnsavedDataChange(files.length > 0);
    }
  }, [files.length, onUnsavedDataChange]);
  
  // Load JSZip
  useEffect(() => {
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        let script = document.getElementById(id);
        if (script) {
          if (script.getAttribute('data-loaded') === 'true') return resolve();
          script.addEventListener('load', resolve);
          script.addEventListener('error', reject);
          return;
        }
        script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'jszip-script')
      .then(() => setScriptsLoaded({ jszip: true }))
      .catch(err => console.error("Failed to load JSZip", err));
  }, []);
  
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoUrl(null);
    }
  }, [logoFile]);

  // Preview logic
  useEffect(() => {
    if (files.length === 0 || !previewCanvasRef.current) return;
    
    let isCancelled = false;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const renderPreview = async () => {
      try {
        const img = new Image();
        const imgUrl = URL.createObjectURL(files[0]);
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = imgUrl;
        });
        
        if (isCancelled) return;
        
        // Scale canvas for preview to fit container but keep aspect ratio
        const maxWidth = 800;
        let cWidth = img.width;
        let cHeight = img.height;
        if (cWidth > maxWidth) {
          const ratio = maxWidth / cWidth;
          cWidth = maxWidth;
          cHeight = cHeight * ratio;
        }
        
        canvas.width = cWidth;
        canvas.height = cHeight;
        ctx.clearRect(0, 0, cWidth, cHeight);
        ctx.drawImage(img, 0, 0, cWidth, cHeight);
        
        // Draw Watermark
        ctx.globalAlpha = opacity;
        
        const calcPos = (itemWidth, itemHeight) => {
          let x = 0, y = 0;
          const actualMargin = (margin / 100) * Math.min(cWidth, cHeight);
          
          if (position.includes('left')) x = actualMargin;
          else if (position.includes('right')) x = cWidth - itemWidth - actualMargin;
          else x = (cWidth - itemWidth) / 2;
          
          if (position.includes('top')) y = actualMargin;
          else if (position.includes('bottom')) y = cHeight - itemHeight - actualMargin;
          else y = (cHeight - itemHeight) / 2;
          
          return { x, y };
        };
        
        if (watermarkType === 'text' && text) {
          const actualFontSize = (fontSize / 100) * cWidth;
          ctx.font = `bold ${actualFontSize}px ${fontFamily}`;
          ctx.fillStyle = color;
          ctx.textBaseline = 'top';
          
          const metrics = ctx.measureText(text);
          const tWidth = metrics.width;
          const tHeight = actualFontSize; // rough approx
          
          const { x, y } = calcPos(tWidth, tHeight);
          
          if (textShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = actualFontSize * 0.2;
            ctx.shadowOffsetX = actualFontSize * 0.05;
            ctx.shadowOffsetY = actualFontSize * 0.05;
          }
          
          ctx.fillText(text, x, y);
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
        } else if (watermarkType === 'image' && logoUrl) {
          const logoImg = new Image();
          await new Promise((res, rej) => {
            logoImg.onload = res;
            logoImg.onerror = rej;
            logoImg.src = logoUrl;
          });
          if (isCancelled) return;
          
          const lWidth = (logoScale / 100) * cWidth;
          const lRatio = logoImg.height / logoImg.width;
          const lHeight = lWidth * lRatio;
          
          const { x, y } = calcPos(lWidth, lHeight);
          ctx.drawImage(logoImg, x, y, lWidth, lHeight);
        }
        
        ctx.globalAlpha = 1.0;
        URL.revokeObjectURL(imgUrl);
      } catch (err) {
        console.error(err);
      }
    };
    
    renderPreview();
    return () => { isCancelled = true; };
  }, [files, watermarkType, text, fontSize, color, fontFamily, textShadow, logoUrl, logoScale, position, margin, opacity]);

  const processFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (arr.length === 0) {
      alert("Please drop valid image files.");
      return;
    }
    setFiles(prev => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };
  const handleFileUpload = (e) => {
    processFiles(e.target.files);
    e.target.value = null;
  };

  const renderSingleFile = async (file) => {
    const img = new Image();
    const imgUrl = URL.createObjectURL(file);
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = imgUrl;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = opacity;
    
    const calcPos = (itemWidth, itemHeight) => {
      let x = 0, y = 0;
      const actualMargin = (margin / 100) * Math.min(img.width, img.height);
      if (position.includes('left')) x = actualMargin;
      else if (position.includes('right')) x = img.width - itemWidth - actualMargin;
      else x = (img.width - itemWidth) / 2;
      if (position.includes('top')) y = actualMargin;
      else if (position.includes('bottom')) y = img.height - itemHeight - actualMargin;
      else y = (img.height - itemHeight) / 2;
      return { x, y };
    };

    if (watermarkType === 'text' && text) {
      const actualFontSize = (fontSize / 100) * img.width;
      ctx.font = `bold ${actualFontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      
      const metrics = ctx.measureText(text);
      const { x, y } = calcPos(metrics.width, actualFontSize);
      
      if (textShadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = actualFontSize * 0.2;
        ctx.shadowOffsetX = actualFontSize * 0.05;
        ctx.shadowOffsetY = actualFontSize * 0.05;
      }
      ctx.fillText(text, x, y);
    } else if (watermarkType === 'image' && logoUrl) {
      const logoImg = new Image();
      await new Promise((res) => { logoImg.onload = res; logoImg.src = logoUrl; });
      const lWidth = (logoScale / 100) * img.width;
      const lHeight = lWidth * (logoImg.height / logoImg.width);
      const { x, y } = calcPos(lWidth, lHeight);
      ctx.drawImage(logoImg, x, y, lWidth, lHeight);
    }
    
    ctx.globalAlpha = 1.0;
    URL.revokeObjectURL(imgUrl);
    
    return new Promise(resolve => {
      canvas.toBlob(b => resolve(b), file.type, 0.95);
    });
  };

  const handleExport = async () => {
    if (files.length === 0 || !scriptsLoaded.jszip) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Processing images...');
    
    try {
      if (files.length === 1) {
        const blob = await renderSingleFile(files[0]);
        setProgress(100);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watermarked_${files[0].name}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new window.JSZip();
        for (let i = 0; i < files.length; i++) {
          setStatusMessage(`Processing ${i+1}/${files.length}...`);
          setProgress(Math.round((i / files.length) * 80));
          const blob = await renderSingleFile(files[i]);
          zip.file(`watermarked_${files[i].name}`, blob);
        }
        
        setStatusMessage('Bundling into ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
          setProgress(80 + Math.round(meta.percent * 0.2));
        });
        
        setProgress(100);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watermarked_batch_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Error exporting files: ' + err.message);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
      setProgress(0);
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
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setFiles([]); setLogoFile(null); }} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{ 
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
        >
          <RotateCcw size={18} /> <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          
          {/* Sidebar (Left) */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            
            {/* Card 0: Source Image Upload */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Source Images
                </h3>
                {files.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{files.length} FILE{files.length > 1 ? 'S' : ''}</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop it here!' : files.length > 0 ? 'Add More Images' : 'Upload Images'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Drag & drop or click to browse files.</p>
              </div>
            </div>

            {/* Card 1: Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} /> Configuration
                </h3>
                <button 
                  onClick={handleExport}
                  disabled={files.length === 0 || isProcessing || !scriptsLoaded.jszip || (watermarkType === 'image' && !logoUrl)}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest disabled:opacity-50 active:scale-95"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Export
                </button>
              </div>
              <div className="p-3 flex flex-col gap-3">
                {/* Type Switcher */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Watermark Type</label>
                  <SegmentedControl
                    value={watermarkType}
                    onChange={setWatermarkType}
                    options={[
                      { value: 'text', label: 'Text' },
                      { value: 'image', label: 'Image' }
                    ]}
                  />
                  {/*
                    <div 
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out"
                      style={{
                         width: `calc((100% - 8px) / 2)`,
                         transform: `translateX(calc(${['text', 'image'].indexOf(watermarkType)} * 100%))`
                      }}
                    />
                    {['text', 'image'].map(type => (
                      <button
                        key={type}
                        onClick={() => setWatermarkType(type)}
                        className={clsx(
                          "flex-1 relative z-10 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300",
                          watermarkType === type ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  */}
                </div>

                {watermarkType === 'text' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Watermark Text</label>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      {/* Modern Color Picker */}
                      <div className="w-[80px] shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Color</label>
                        <div className="relative" ref={colorPickerRef}>
                          <div 
                            id="color-swatch-btn"
                            className="h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer "
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setSwatchRect(rect);
                              setShowColorPicker(!showColorPicker);
                            }}
                            style={{ backgroundColor: color }}
                          />
                          {showColorPicker && swatchRect && (
                            <div
                              className="fixed z-[200] p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200"
                              style={{ top: swatchRect.bottom + 8, left: swatchRect.left }}
                            >
                              <HexColorPicker color={color} onChange={(c) => { setColor(c); setHexInput(c.replace('#', '')); }} />
                              <div className="flex items-center gap-2 mt-3 p-1.5 bg-slate-50 dark:bg-[#0a0a0a] rounded-lg border border-slate-200 dark:border-white/10">
                                <span className="text-slate-400 font-medium text-[11px] pl-1 uppercase">#</span>
                                <input 
                                  type="text" 
                                  value={hexInput}
                                  onChange={(e) => {
                                     const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                     setHexInput(val);
                                     if (val.length === 6) setColor(`#${val}`);
                                  }}
                                  className="w-full bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none uppercase"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Font Select */}
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Font Family</label>
                        <CustomSelect 
                          value={fontFamily} 
                          onChange={setFontFamily} 
                          options={FONT_OPTIONS} 
                          themeColor={persona.theme.primary} 
                        />
                      </div>
                    </div>
                    
                    {/* Font Size + Shadow inline */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Font Size</label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <div className={clsx(
                              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                              textShadow ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-slate-300 dark:border-white/20 group-hover:border-slate-400"
                            )} style={{ '--color-primary': persona.theme.primary }}>
                              {textShadow && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <input type="checkbox" checked={textShadow} onChange={(e) => setTextShadow(e.target.checked)} className="hidden" />
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Shadow</span>
                          </label>
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{fontSize}%</span>
                      </div>
                      <input
                        type="range" min={1} max={30} step={1} value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                        style={{ '--slider-thumb-color': persona.theme.primary }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Upload Logo</label>
                      <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" ref={logoInputRef} onChange={(e) => setLogoFile(e.target.files[0])} />
                      <label
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                        style={{ '--color-primary': persona.theme.primary }}
                      >
                        <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                        <span className="text-xs font-bold text-slate-500 truncate max-w-[160px]">
                          {logoFile ? logoFile.name : 'Upload Logo'}
                        </span>
                      </label>
                      <p className="text-[10px] text-slate-500 pl-1 mt-1.5">PNG, JPG, or WebP supported.</p>
                    </div>
                    <LocalSlider
                      label="Logo Scale"
                      value={logoScale}
                      min={5}
                      max={50}
                      step={1}
                      onChangeEnd={(val) => setLogoScale(val)}
                      persona={persona}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Positioning Grid */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Layout className="w-4 h-4" style={{ color: persona.theme.primary }} /> Positioning
                </h3>
              </div>
              <div className="p-3">
                <div className="flex gap-4">
                  {/* Left: Sliders */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <LocalSlider
                      label="Opacity"
                      value={Math.round(opacity * 100)}
                      min={0}
                      max={100}
                      step={1}
                      onChangeEnd={(val) => setOpacity(val / 100)}
                      persona={persona}
                    />
                    <LocalSlider
                      label="Margin Edge"
                      value={margin}
                      min={0}
                      max={40}
                      step={1}
                      onChangeEnd={(val) => setMargin(val)}
                      persona={persona}
                    />
                  </div>

                  {/* Right: Position Grid */}
                  <div className="shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Position Grid</label>
                    <div className="grid grid-cols-3 gap-1 w-[100px] h-[100px] p-1 bg-slate-50 dark:bg-[#0a0a0a] rounded-lg border border-slate-100 dark:border-white/5">
                      {POSITIONS.map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => setPosition(pos.id)}
                          className={clsx(
                            "rounded-md border flex items-center justify-center transition-all",
                            position === pos.id 
                              ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] " 
                              : "bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                          )}
                          style={{ '--color-primary': persona.theme.primary }}
                        >
                          <div className={clsx("w-1.5 h-1.5 rounded-full", position === pos.id ? "bg-[var(--color-primary)]" : "bg-slate-300 dark:bg-slate-600")} style={position === pos.id ? { backgroundColor: persona.theme.primary } : {}}></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Main Area (Right) — always visible */}
          <div className="flex-1 flex flex-col lg:min-h-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
            {/* Header always shown */}
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Maximize className="w-4 h-4 text-slate-400" /> Preview Workspace
              </h3>
              {files.length > 0 && (
                <div className="text-[11px] font-bold text-slate-400">
                  {files.length} FILE{files.length > 1 ? 'S' : ''} LOADED
                </div>
              )}
            </div>

            {files.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-slate-600">
                <ImageIcon size={48} strokeWidth={1} />
                <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">No image selected.</p>
              </div>
            ) : (
              <div className="flex-1 p-4 flex items-center justify-center overflow-hidden relative animate-in fade-in bg-slate-50 dark:bg-[#0a0a0a]/30 checkerboard-bg">
                <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain drop- rounded-md relative z-10" />
              </div>
            )}

          </div>
          
        </div>
      </div>
    </div>
  );
}
