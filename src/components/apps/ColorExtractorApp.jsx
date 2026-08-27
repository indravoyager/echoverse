import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Pipette, Palette, Copy, Check, FileImage, MousePointer2, Download, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Calculate contrast color for text on a bg
const getContrastColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export default function ColorExtractorApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [palette, setPalette] = useState([]);
  const [hoverColor, setHoverColor] = useState(null);
  const [copiedColor, setCopiedColor] = useState(null);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
    };
  }, []);

  const extractPalette = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 150;
    canvas.height = 150;
    ctx.drawImage(img, 0, 0, 150, 150);
    const data = ctx.getImageData(0, 0, 150, 150).data;
    
    const colorMap = new Map();
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 128) continue;
      
      const rBucket = Math.round(r / 24) * 24;
      const gBucket = Math.round(g / 24) * 24;
      const bBucket = Math.round(b / 24) * 24;
      
      const key = `${rBucket},${gBucket},${bBucket}`;
      if (!colorMap.has(key)) {
        colorMap.set(key, { r: rBucket, g: gBucket, b: bBucket, count: 1 });
      } else {
        colorMap.get(key).count++;
      }
    }
    
    const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    
    const newPalette = [];
    for (const c of sortedColors) {
      if (newPalette.length >= 6) break;
      let isDistinct = true;
      for (const p of newPalette) {
        const rgbP = hexToRgb(p);
        if(!rgbP) continue;
        const dist = Math.sqrt(Math.pow(c.r - rgbP.r, 2) + Math.pow(c.g - rgbP.g, 2) + Math.pow(c.b - rgbP.b, 2));
        if (dist < 50) {
          isDistinct = false;
          break;
        }
      }
      if (isDistinct) newPalette.push(rgbToHex(c.r, c.g, c.b));
    }
    
    if (newPalette.length < 6) {
        for (const c of sortedColors) {
            if (newPalette.length >= 6) break;
            const hex = rgbToHex(c.r, c.g, c.b);
            if (!newPalette.includes(hex)) newPalette.push(hex);
        }
    }
    
    setPalette(newPalette);
  };

  const handleImageLoad = (e) => {
    extractPalette(e.target);
    
    // Draw on visible canvas for color picking
    const canvas = canvasRef.current;
    if (canvas && e.target) {
      canvas.width = e.target.naturalWidth;
      canvas.height = e.target.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(e.target, 0, 0);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (originalImage) URL.revokeObjectURL(originalImage);
    
    setOriginalFile(file);
    setOriginalImage(URL.createObjectURL(file));
    setPalette([]);
    setHoverColor(null);
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

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates respecting object-fit logic
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] > 0) {
        setHoverColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
      } else {
        setHoverColor(null);
      }
    } catch (e) {
      // Ignore cross-origin canvas errors if any
    }
  };

  const handleMouseLeave = () => {
    setHoverColor(null);
  };

  const copyToClipboard = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadPalette = () => {
    if (!palette.length) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Canvas dimensions (Landscape)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Top Title
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 36px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Color Palette', width / 2, 65);
    
    // Card Dimensions
    const sideMargin = 40; // Small side margin as requested
    const cardWidth = width - (sideMargin * 2);
    const cardHeight = 400;
    const cardX = sideMargin;
    const cardY = 100;
    
    // Draw Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
    ctx.fill();
    ctx.restore();
    
    // Create clipping mask for the rounded card
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
    ctx.clip();
    
    // Draw Color Stripes
    const count = palette.length;
    const stripeWidth = cardWidth / count;
    
    palette.forEach((color, index) => {
      const stripeX = cardX + (index * stripeWidth);
      
      // Draw Stripe
      ctx.fillStyle = color;
      ctx.fillRect(stripeX, cardY, stripeWidth, cardHeight);
      
      // Draw HEX Text
      ctx.fillStyle = getContrastColor(color);
      ctx.font = '800 26px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Write horizontal HEX code at the bottom of the stripe
      ctx.fillText(color.toUpperCase(), stripeX + (stripeWidth / 2), cardY + cardHeight - 40);
    });
    
    // Restore context to remove clipping
    ctx.restore();
    
    // Bottom Branding
    ctx.fillStyle = '#a8a29e';
    ctx.font = '700 18px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ECHO ATURAI', width / 2, cardY + cardHeight + 60);
    
    // Trigger Download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `echo-aturai-palette.png`;
    a.click();
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Upload Area */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileImage className="w-4 h-4 text-slate-400" />
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
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 cursor-pointer' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
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
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Upload any image to extract its color palette.</p>
              </div>
            </div>

            {/* Extracted Palette */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Palette className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Color Palette
                </h3>
                {palette.length > 0 && (
                  <button 
                    onClick={handleDownloadPalette}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download size={13} />
                    DOWNLOAD
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3">
                {!palette.length ? (
                   <div className="flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 min-h-[150px]">
                     <Palette className="w-8 h-8" />
                     <span className="text-sm font-medium">No palette generated.</span>
                   </div>
                ) : (
                  palette.map((color, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => copyToClipboard(color)}
                      className="group flex items-center justify-between p-2 pr-4 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-md  border border-black/10 dark:border-white/10 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ backgroundColor: color }}
                        >
                          {copiedColor === color && <Check size={16} color={getContrastColor(color)} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{color}</span>
                        </div>
                      </div>
                      <Copy size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Interactive Preview Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[400px] shrink-0 overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Pipette className="w-4 h-4 text-slate-400" />
                  Interactive Picker
                </h3>
                {hoverColor && (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in">
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: hoverColor }}></div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{hoverColor}</span>
                  </div>
                )}
              </div>
              
              <div 
                className={clsx(
                  "flex-1 relative p-4 flex flex-col min-h-0 bg-slate-100 dark:bg-[#0a0a0a]",
                  originalImage && "checkerboard-bg"
                )}
              >
                {!originalImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <MousePointer2 className="w-8 h-8" />
                    <span className="text-sm font-medium">Hover over image to pick color</span>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center group cursor-crosshair">
                    <img 
                      ref={imageRef}
                      src={originalImage} 
                      alt="Original" 
                      className="hidden" 
                      onLoad={handleImageLoad}
                    />
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full max-h-full object-contain rounded-lg drop-"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => hoverColor && copyToClipboard(hoverColor)}
                    />
                    
                    {/* Floating Color Tooltip on Hover */}
                    {hoverColor && (
                      <div className="absolute bottom-4 right-4 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex flex-col gap-2 z-10 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-md border border-black/10" style={{ backgroundColor: hoverColor }}></div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-500 uppercase">HEX Color</span>
                             <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{hoverColor}</span>
                           </div>
                         </div>
                         <div className="text-[10px] text-center text-slate-400 font-medium">Click image to copy</div>
                      </div>
                    )}
                    
                    {/* Copy notification overlay */}
                    {copiedColor && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-xs  animate-in fade-in slide-in-from-top-2 flex items-center gap-2 pointer-events-none z-20">
                        <Check size={14} />
                        Copied {copiedColor}!
                      </div>
                    )}
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
