import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Image as ImageIcon, Download, Settings2, Eye, EyeOff, UploadCloud, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import persona from '../../tools/colorblindness.json';

const ColorBlindnessApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [image, setImage] = useState(null);
  const [mode, setMode] = useState('protanopia');
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const modes = [
    { id: 'protanopia', label: 'Protanopia', desc: 'Red-Blind' },
    { id: 'protanomaly', label: 'Protanomaly', desc: 'Red-Weak' },
    { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-Blind' },
    { id: 'deuteranomaly', label: 'Deuteranomaly', desc: 'Green-Weak' },
    { id: 'tritanopia', label: 'Tritanopia', desc: 'Blue-Blind' },
    { id: 'tritanomaly', label: 'Tritanomaly', desc: 'Blue-Weak' },
    { id: 'achromatopsia', label: 'Achromatopsia', desc: 'Monochromacy' },
    { id: 'achromatomaly', label: 'Achromatomaly', desc: 'Partial Color Blindness' }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSplitPos(percent);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSplitPos(percent);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const resetAll = () => {
    setImage(null);
    setMode('deuteranopia');
    setSplitPos(50);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadImage = () => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Dynamic scaling for text, gaps, and padding based on image size
      const fontSize = Math.max(16, img.height * 0.04); 
      const textHeight = fontSize * 3;
      const padding = Math.max(20, img.width * 0.03); // White frame size
      const gap = padding;
      
      // Canvas includes padding on left, right, top, and text area at the bottom
      canvas.width = padding + img.width + gap + img.width + padding;
      canvas.height = padding + img.height + textHeight;
      
      // Fill background (white frame)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const rightX = padding + img.width + gap;
      
      // Draw original on left, copy on right (inside the frame)
      ctx.drawImage(img, padding, padding);
      ctx.drawImage(img, rightX, padding);
      
      // Get image data for the right side ONLY
      const imageData = ctx.getImageData(rightX, padding, img.width, img.height);
      const data = imageData.data;
      
      // Matrices matching SVG filters
      const matrices = {
        protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
        protanomaly: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875],
        deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
        deuteranomaly: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858],
        tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
        tritanomaly: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817],
        achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
        achromatomaly: [0.618, 0.320, 0.062, 0.163, 0.775, 0.062, 0.163, 0.320, 0.516]
      };
      
      const m = matrices[mode];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = r * m[0] + g * m[1] + b * m[2];
        data[i + 1] = r * m[3] + g * m[4] + b * m[5];
        data[i + 2] = r * m[6] + g * m[7] + b * m[8];
      }
      
      // Apply modified pixels to the right side
      ctx.putImageData(imageData, rightX, padding);
      
      // Add text labels
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      
      const textY = padding + img.height + (fontSize * 1.5);
      ctx.fillText('Original', padding + (img.width / 2), textY);
      const modeObj = modes.find(m => m.id === mode);
      ctx.fillText(`${modeObj.label} Simulation`, rightX + (img.width / 2), textY);
      
      const link = document.createElement('a');
      link.download = `simulated-${mode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = image;
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      
      {/* SVG Filters Definition */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <filter id="cb-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-protanomaly"><feColorMatrix type="matrix" values="0.817 0.183 0 0 0  0.333 0.667 0 0 0  0 0.125 0.875 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-deuteranomaly"><feColorMatrix type="matrix" values="0.8 0.2 0 0 0  0.258 0.742 0 0 0  0 0.142 0.858 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-tritanomaly"><feColorMatrix type="matrix" values="0.967 0.033 0 0 0  0 0.733 0.267 0 0  0 0.183 0.817 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-achromatopsia"><feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-achromatomaly"><feColorMatrix type="matrix" values="0.618 0.320 0.062 0 0  0.163 0.775 0.062 0 0  0.163 0.320 0.516 0 0  0 0 0 1 0" /></filter>
        </defs>
      </svg>

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
            style={{ borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)` }}
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
        
        {/* Global Reset */}
        <button 
          onClick={resetAll}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Workspace */}
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
              <div className="p-4 flex flex-col">
                <div className="flex items-center gap-3 shrink-0">
                  <label
                    className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {image ? 'Replace Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5 mb-0 shrink-0">JPG, PNG, and WebP supported.</p>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Simulation Mode
                </h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar content-start">
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={clsx(
                      "flex flex-col text-left px-3 py-2 rounded-lg border transition-all duration-200",
                      mode === m.id
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]"
                        : "bg-transparent border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <span className={clsx("text-[13px] font-bold", mode === m.id ? "text-[var(--color-primary)]" : "text-slate-800 dark:text-slate-200")} style={{ '--color-primary': persona.theme.primary }}>
                      {m.label}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Viewer */}
          <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden min-h-[400px]">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--color-primary)]/20 text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }}>
                  <Eye size={12} />
                </div>
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Live Simulator</span>
              </div>
              <button 
                onClick={downloadImage}
                disabled={!image}
                className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-md shadow-[var(--color-primary)]/25"
                style={{ backgroundColor: persona.theme.primary, '--color-primary': persona.theme.primary }}
              >
                <Download size={14} />
                Save Image
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-black/20">
              {image ? (
                <div 
                  ref={containerRef}
                  className="relative w-full flex-1 min-h-[300px] max-w-4xl max-h-[70vh] select-none touch-none overflow-hidden rounded-xl border border-slate-200/50"
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                >
                  {/* Base Layer: Simulated Image */}
                  <img 
                    src={image} 
                    alt="Simulated" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ filter: `url(#cb-${mode})` }}
                  />

                  {/* Top Layer: Original Image (Clipped) */}
                  <div 
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`, willChange: 'clip-path' }}
                  >
                    <img 
                      src={image} 
                      alt="Original" 
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  </div>

                  {/* Slider Control */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 flex items-center justify-center"
                    style={{ left: `${splitPos}%`, transform: 'translateX(-50%)', willChange: 'left' }}
                    onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onTouchStart={(e) => { setIsDragging(true); }}
                  >
                    {/* Expand hit area invisibly */}
                    <div className="absolute inset-y-0 -left-4 -right-4 cursor-ew-resize" />
                    
                    <div className={clsx(
                      "w-9 h-9 shrink-0 bg-white rounded-full border border-slate-200 flex items-center justify-center transition-all duration-200 z-10 shadow-sm",
                      isDragging ? "scale-110 text-slate-700 shadow-md" : "scale-100 text-slate-400 hover:scale-110 hover:text-slate-600 hover:shadow-md"
                    )}
                    style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18 6-6-6-6"/>
                        <path d="m9 6-6 6 6 6"/>
                      </svg>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-2 left-[25%] -translate-x-1/2 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded backdrop-blur-md">ORIGINAL</div>
                  <div className="absolute top-2 right-[25%] translate-x-1/2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-3 py-1 rounded backdrop-blur-md uppercase tracking-widest" style={{ '--color-primary': persona.theme.primary }}>{modes.find(m=>m.id===mode)?.label}</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <EyeOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">No Image Selected</h3>
                  <p className="text-xs text-slate-400 mt-1">Upload an image from the sidebar to start the simulation</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ColorBlindnessApp;
