import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Image as ImageIcon, RotateCcw, UploadCloud, Copy, Check, SlidersHorizontal, Download } from 'lucide-react';
import clsx from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
import persona from '../../tools/colorgradientextractor.json';

import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const ColorGradientExtractorApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState(['#ec4899', '#8b5cf6']);
  const [extractedPalette, setExtractedPalette] = useState(['#ec4899', '#8b5cf6', '#be185d']);
  const [basePalette, setBasePalette] = useState(['#ec4899', '#8b5cf6', '#be185d']);
  const [hueShift, setHueShift] = useState(0);
  const [colorCount, setColorCount] = useState(5);
  const [copiedColor, setCopiedColor] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [gradientType, setGradientType] = useState('linear');
  const [angle, setAngle] = useState(135);
  const { copied: isCopied, copy } = useCopyToClipboard();
  const fileInputRef = useRef(null);

  const resetAll = () => {
    setImage(null);
    setColors(['#ec4899', '#8b5cf6']);
    setBasePalette(['#ec4899', '#8b5cf6', '#be185d']);
    setExtractedPalette(['#ec4899', '#8b5cf6', '#be185d']);
    setVariations([]);
    setSelectedVariationIndex(0);
    setColorCount(5);
    setGradientType('linear');
    setAngle(135);
    setHueShift(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hexToHsl = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s, l];
  };

  const hslToHex = (h, s, l) => {
    l /= 1;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const shiftHue = (hex, amount) => {
    if (amount === 0) return hex;
    const [h, s, l] = hexToHsl(hex);
    let newH = (h + amount) % 360;
    if (newH < 0) newH += 360;
    return hslToHex(newH, s, l);
  };

  useEffect(() => {
    if (image) {
      extractColorsFromImage(image);
    }
  }, [colorCount, image]);

  useEffect(() => {
    if (basePalette.length === 0) return;
    
    const shiftedHexColors = basePalette.map(c => shiftHue(c, hueShift));
    setExtractedPalette(shiftedHexColors);

    let allPossibleVariations = [];
    if (shiftedHexColors.length >= 8) {
      allPossibleVariations = [
        [shiftedHexColors[0], shiftedHexColors[1], shiftedHexColors[2]],
        [shiftedHexColors[3], shiftedHexColors[4], shiftedHexColors[5]],
        [shiftedHexColors[5], shiftedHexColors[6], shiftedHexColors[7]],
        [shiftedHexColors[0], shiftedHexColors[4], shiftedHexColors[7]],
        [shiftedHexColors[1], shiftedHexColors[3], shiftedHexColors[6]],
        [shiftedHexColors[0], shiftedHexColors[7]],
        [shiftedHexColors[2], shiftedHexColors[5]],
        [shiftedHexColors[4], shiftedHexColors[6]]
      ];
    } else if (shiftedHexColors.length >= 5) {
      allPossibleVariations = [
        [shiftedHexColors[0], shiftedHexColors[1], shiftedHexColors[2]],
        [shiftedHexColors[2], shiftedHexColors[3], shiftedHexColors[4]],
        [shiftedHexColors[0], shiftedHexColors[3], shiftedHexColors[4]],
        [shiftedHexColors[1], shiftedHexColors[2], shiftedHexColors[4]],
        [shiftedHexColors[0], shiftedHexColors[1]],
        [shiftedHexColors[2], shiftedHexColors[3]],
        [shiftedHexColors[1], shiftedHexColors[4]],
        [shiftedHexColors[0], shiftedHexColors[4]]
      ];
    } else {
      allPossibleVariations = [
        [shiftedHexColors[0], shiftedHexColors[1], shiftedHexColors[2]],
        [shiftedHexColors[0], shiftedHexColors[1]],
        [shiftedHexColors[1], shiftedHexColors[2]],
        [shiftedHexColors[0], shiftedHexColors[2]],
        [shiftedHexColors[2], shiftedHexColors[1], shiftedHexColors[0]],
        [shiftedHexColors[2], shiftedHexColors[0]],
        [shiftedHexColors[1], shiftedHexColors[0]],
        [shiftedHexColors[2], shiftedHexColors[1]]
      ];
    }
    
    allPossibleVariations = allPossibleVariations.filter(arr => arr && arr.every(c => c !== undefined));

    const uniqueV = [];
    const seen = new Set();
    for(const arr of allPossibleVariations) {
       const key = arr.join(',');
       if(!seen.has(key)) {
          seen.add(key);
          uniqueV.push(arr);
          if (uniqueV.length >= 8) break;
       }
    }

    setVariations(uniqueV);
    
    // Set colors directly using selectedVariationIndex logic
    // We make sure not to throw error if uniqueV is empty
    if (uniqueV.length > 0) {
      setColors(uniqueV[selectedVariationIndex] || uniqueV[0]);
    }
  }, [basePalette, hueShift, selectedVariationIndex]);

  const copyColor = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      setImage(src);
    };
    reader.readAsDataURL(file);
  };

  const downloadGradient = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (gradientType === 'linear') {
      const angleRad = (angle - 90) * Math.PI / 180;
      const length = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const x1 = cx - Math.cos(angleRad) * length;
      const y1 = cy - Math.sin(angleRad) * length;
      const x2 = cx + Math.cos(angleRad) * length;
      const y2 = cy + Math.sin(angleRad) * length;
      
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
    } else if (gradientType === 'radial') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.max(canvas.width, canvas.height) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
    } else if (gradientType === 'conic') {
      if (ctx.createConicGradient) {
        const grad = ctx.createConicGradient((angle - 90) * Math.PI / 180, canvas.width/2, canvas.height/2);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = colors[0];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
    } else if (gradientType === 'mesh') {
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const points = [
        { x: 0.18, y: 0.71 }, { x: 0.80, y: 0.00 }, { x: 0.31, y: 0.21 },
        { x: 0.93, y: 0.85 }, { x: 0.50, y: 0.50 }, { x: 0.00, y: 1.00 },
        { x: 1.00, y: 1.00 }, { x: 0.00, y: 0.00 }
      ];
      const loops = Math.min(colors.length, points.length);
      for (let i = loops - 1; i >= 0; i--) {
        const pt = points[i];
        const cx = pt.x * canvas.width;
        const cy = pt.y * canvas.height;
        const radius = Math.max(canvas.width, canvas.height) * 0.75;
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, colors[i]);
        
        const hex = colors[i].replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    const link = document.createElement('a');
    link.download = `Echo-Gradient-${gradientType}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const extractColorsFromImage = (src) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxDim = 100;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height).data;
      const buckets = {};
      
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        
        if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;
        
        const rQuant = Math.round(r / 24) * 24;
        const gQuant = Math.round(g / 24) * 24;
        const bQuant = Math.round(b / 24) * 24;
        
        const key = `${rQuant},${gQuant},${bQuant}`;
        if (!buckets[key]) {
          buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
        }
        buckets[key].r += r;
        buckets[key].g += g;
        buckets[key].b += b;
        buckets[key].count += 1;
      }
      
      const bucketArray = Object.values(buckets).map(bucket => {
        const avgR = bucket.r / bucket.count;
        const avgG = bucket.g / bucket.count;
        const avgB = bucket.b / bucket.count;
        
        const max = Math.max(avgR, avgG, avgB);
        const min = Math.min(avgR, avgG, avgB);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        // Score based on a combination of frequency and vividness
        // sqrt(count) flattens the dominance of massive backgrounds
        const score = Math.sqrt(bucket.count) * (1 + saturation * 3);
        
        return { avgR, avgG, avgB, score, count: bucket.count };
      });
      
      bucketArray.sort((a, b) => b.score - a.score);
      const finalColors = [];
      
      for (const bucket of bucketArray) {
        let isDistinct = true;
        for (const finalColor of finalColors) {
          const dist = Math.sqrt(
            Math.pow(bucket.avgR - finalColor.r, 2) + 
            Math.pow(bucket.avgG - finalColor.g, 2) + 
            Math.pow(bucket.avgB - finalColor.b, 2)
          );
          if (dist < 55) { 
            isDistinct = false;
            break;
          }
        }
        
        if (isDistinct) {
          finalColors.push({ r: Math.round(bucket.avgR), g: Math.round(bucket.avgG), b: Math.round(bucket.avgB) });
          if (finalColors.length >= colorCount) break;
        }
      }
      
      if (finalColors.length === 0) finalColors.push({ r: 236, g: 72, b: 153 });
      while (finalColors.length < colorCount) {
        const last = finalColors[finalColors.length - 1];
        finalColors.push({ 
          r: Math.max(0, last.r - 20), 
          g: Math.max(0, last.g - 20), 
          b: Math.max(0, last.b - 20) 
        });
      }
      
      const hexColors = finalColors.map(c => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`);
      setBasePalette(hexColors);
      // Reset hue shift when a new image is loaded or count is updated.
      // Wait, if colorCount changes, we shouldn't reset hueShift! So only reset if new image, or just don't reset inside extractColorsFromImage.
      // We will let handleFileUpload reset it if necessary, or just leave it.
    };
    img.src = src;
  };

  const getGradientStyleObject = () => {
    const colorStops = colors.join(', ');
    if (gradientType === 'linear') {
      return { background: `linear-gradient(${angle}deg, ${colorStops})` };
    } else if (gradientType === 'radial') {
      return { background: `radial-gradient(circle at center, ${colorStops})` };
    } else if (gradientType === 'conic') {
      return { background: `conic-gradient(from ${angle}deg at 50% 50%, ${colorStops}, ${colors[0]})` };
    } else if (gradientType === 'mesh') {
      const c1 = colors[0];
      const c2 = colors[1] || colors[0];
      const c3 = colors[2] || colors[0];
      return { 
        backgroundColor: c1,
        backgroundImage: `radial-gradient(at 18% 71%, ${c2} 0px, transparent 75%), radial-gradient(at 80% 0%, ${c3} 0px, transparent 75%), radial-gradient(at 31% 21%, ${c1} 0px, transparent 75%), radial-gradient(at 93% 85%, ${c2} 0px, transparent 75%)`
      };
    }
  };

  const getGradientStyleCSSString = () => {
    if (gradientType === 'mesh') {
      const c1 = colors[0];
      const c2 = colors[1] || colors[0];
      const c3 = colors[2] || colors[0];
      return `background-color: ${c1};\nbackground-image: radial-gradient(at 18% 71%, ${c2} 0px, transparent 75%), radial-gradient(at 80% 0%, ${c3} 0px, transparent 75%), radial-gradient(at 31% 21%, ${c1} 0px, transparent 75%), radial-gradient(at 93% 85%, ${c2} 0px, transparent 75%);`;
    } else {
      const colorStops = colors.join(', ');
      let bg = '';
      if (gradientType === 'linear') bg = `linear-gradient(${angle}deg, ${colorStops})`;
      else if (gradientType === 'radial') bg = `radial-gradient(circle at center, ${colorStops})`;
      else if (gradientType === 'conic') bg = `conic-gradient(from ${angle}deg at 50% 50%, ${colorStops}, ${colors[0]})`;
      return `background: ${bg};`;
    }
  };

  const copyCSS = () => copy(getGradientStyleCSSString());

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
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
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 shrink-0">
                  <label
                    className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {image ? 'Replace Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Gradient Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  Gradient Settings
                </h3>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                {/* Type Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Type
                  </label>
                  <SegmentedControl
                    value={gradientType}
                    onChange={setGradientType}
                    options={[
                      { value: 'linear', label: 'linear' },
                      { value: 'radial', label: 'radial' },
                      { value: 'conic', label: 'conic' },
                      { value: 'mesh', label: 'mesh' }
                    ]}
                  />
                  {/*
                    <div 
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out shadow-sm"
                      style={{
                         width: `calc((100% - 8px) / 4)`,
                         transform: `translateX(calc(${['linear', 'radial', 'conic', 'mesh'].indexOf(gradientType)} * 100%))`
                      }}
                    />
                    {['linear', 'radial', 'conic', 'mesh'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setGradientType(t)}
                        className={clsx(
                          "flex-1 relative z-10 flex items-center justify-center py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 focus:outline-none",
                          gradientType === t 
                            ? "text-slate-800 dark:text-white" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  */}
                </div>

                {/* Angle Slider */}
                {(gradientType === 'linear' || gradientType === 'conic') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Angle
                      </label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                        {angle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={angle}
                      onChange={(e) => setAngle(Number(e.target.value))}
                      className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                      style={{ '--slider-thumb-color': persona.theme.primary }}
                    />
                  </div>
                )}

                {/* Hue Shift Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Hue Shift
                    </label>
                    <button 
                      onClick={() => setHueShift(0)}
                      title="Reset to Original"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 px-2 py-0.5 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors focus:outline-none cursor-pointer flex items-center gap-1 group"
                    >
                      <RotateCcw size={10} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                      {hueShift > 0 ? '+' : ''}{hueShift}°
                    </button>
                  </div>
                  <div className="relative w-full flex items-center h-5">
                    {/* Background track with rainbow */}
                    <div className="absolute left-0 right-0 h-[3px] rounded-lg pointer-events-none opacity-80" style={{ background: `linear-gradient(to right, #00ffff 0%, #0000ff 17%, #ff00ff 33%, #ff0000 50%, #ffff00 67%, #00ff00 83%, #00ffff 100%)` }} />
                    
                    {/* Center Marker for Original Point */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-3 bg-white rounded-sm border border-slate-300 dark:border-slate-500 shadow-sm pointer-events-none z-10" />
                    
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={hueShift}
                      onChange={(e) => setHueShift(Number(e.target.value))}
                      className="w-full appearance-none cursor-pointer outline-none bg-transparent relative z-20 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-300 dark:[&::-webkit-slider-thumb]:border-slate-500 [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>
                </div>

                {/* Extracted Colors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Extracted Palette
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">COUNT:</span>
                      <div className="flex bg-slate-100 dark:bg-white/5 rounded-md p-0.5">
                        {[3, 5, 8].map(num => (
                          <button
                            key={num}
                            onClick={() => setColorCount(num)}
                            className={clsx(
                              "px-2 py-0.5 text-[10px] font-bold rounded-sm transition-colors",
                              colorCount === num ? "bg-white dark:bg-[#2a2a2a] shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {extractedPalette.map((c, i) => (
                      <button 
                        key={i} 
                        onClick={() => copyColor(c)}
                        className="h-7 flex-1 rounded md:rounded-md border border-slate-200 dark:border-white/10 shadow-sm relative group overflow-hidden cursor-pointer hover:scale-105 transition-transform focus:outline-none"
                        style={{ backgroundColor: c }}
                        title={`Copy ${c.toUpperCase()}`}
                      >
                        {copiedColor === c && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                          {copiedColor !== c && <Copy size={10} className="text-white drop-shadow-md" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variations */}
                {variations.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                      Variations
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {variations.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setColors(v);
                            setSelectedVariationIndex(i);
                          }}
                          className={clsx(
                            "relative h-10 rounded-lg p-0 overflow-hidden transition-all cursor-pointer focus:outline-none group",
                            selectedVariationIndex === i 
                              ? "shadow-md scale-105 z-10" 
                              : "shadow-sm hover:scale-105"
                          )}
                        >
                          {/* Inner gradient background perfectly clipped by overflow-hidden */}
                          <div 
                            className="absolute inset-0 w-full h-full"
                            style={{ background: `linear-gradient(135deg, ${v.join(', ')})` }}
                          />
                          {/* Border overlay */}
                          <div 
                            className={clsx(
                              "absolute inset-0 rounded-lg border-2 pointer-events-none transition-colors",
                              selectedVariationIndex === i 
                                ? "border-pink-500" 
                                : "border-slate-200/50 dark:border-white/5 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Output Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Header / Top Panel */}
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.theme.primary }} />
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Live Preview</h3>
              </div>
              <button 
                onClick={downloadGradient}
                className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25"
                style={{ backgroundColor: persona.theme.primary, '--color-primary': persona.theme.primary }}
              >
                <Download size={14} />
                <span>Save Image</span>
              </button>
            </div>
            
            <div className="flex-1 w-full relative transition-all duration-300" style={getGradientStyleObject()}>
            </div>
            
            {/* Code Output */}
            <div className="h-auto min-h-[60px] py-3 px-4 sm:px-6 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <code className="text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 mr-4 whitespace-pre-wrap break-all">
                {getGradientStyleCSSString()}
              </code>
              <button
                onClick={copyCSS}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] transition-colors shrink-0"
              >
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy CSS'}</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ColorGradientExtractorApp;
