import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Download, Copy, Check, RotateCcw, Settings2, Code, Layers, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import clsx from 'clsx';
import persona from '../../tools/memphis.json';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const MemphisGeneratorApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  // --- STATE ---
  // Appearance
  const [bgMode, setBgMode] = useState(true);
  const [bgColor, setBgColor] = useState('#f8fafc');
  const [color1, setColor1] = useState('#000000'); // Black
  const [color2, setColor2] = useState('#ff007f'); // Pink
  const [color3, setColor3] = useState('#00ccff'); // Cyan
  const [color4, setColor4] = useState('#ffcc00'); // Yellow

  // Color Picker State
  const [activePicker, setActivePicker] = useState(null);
  const [hexInput, setHexInput] = useState('');
  const pickerRef = useRef(null);

  // Structure
  const [density, setDensity] = useState(32);
  const [minSize, setMinSize] = useState(24);
  const [maxSize, setMaxSize] = useState(195);
  const [shapeStyle, setShapeStyle] = useState('solid'); // 'solid', 'outline', 'mixed'
  const [shadowOpacity, setShadowOpacity] = useState(15);
  
  // Layout Control
  const [variation, setVariation] = useState(31);
  const [globalRotate, setGlobalRotate] = useState(127);

  const { copied: isCopied, copy } = useCopyToClipboard();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openPicker = (type) => {
    setActivePicker(activePicker === type ? null : type);
    const c = type === 'c1' ? color1 : type === 'c2' ? color2 : type === 'c3' ? color3 : type === 'c4' ? color4 : bgColor;
    setHexInput(c.replace('#', ''));
  };

  const handlePickerChange = (newColor) => {
    setHexInput(newColor.replace('#', ''));
    if (activePicker === 'c1') setColor1(newColor);
    else if (activePicker === 'c2') setColor2(newColor);
    else if (activePicker === 'c3') setColor3(newColor);
    else if (activePicker === 'c4') setColor4(newColor);
    else if (activePicker === 'bg') setBgColor(newColor);
  };

  const handleHexInputChange = (val) => {
    setHexInput(val);
    if (val.length === 6) {
      const hex = '#' + val;
      if (activePicker === 'c1') setColor1(hex);
      else if (activePicker === 'c2') setColor2(hex);
      else if (activePicker === 'c3') setColor3(hex);
      else if (activePicker === 'c4') setColor4(hex);
      else if (activePicker === 'bg') setBgColor(hex);
    }
  };

  // --- LOGIC ---
  const MEMPHIS_PALETTES = [
    ['#000000', '#ff007f', '#00ccff', '#ffcc00'], // Classic vibrant
    ['#1e1b4b', '#d946ef', '#10b981', '#f97316'], // Dark neon pop
    ['#ef4444', '#06b6d4', '#facc15', '#8b5cf6'], // Primary + purple
    ['#14b8a6', '#f43f5e', '#eab308', '#0f172a'], // Teal coral mustard
    ['#1e3a8a', '#6ee7b7', '#fbbf24', '#f472b6'], // Navy mint peach
    ['#059669', '#e11d48', '#d97706', '#4f46e5'], // Jewel tones
    ['#2563eb', '#dc2626', '#facc15', '#16a34a'], // Retro classic
    ['#000000', '#ec4899', '#8b5cf6', '#06b6d4'], // Synthwave
    ['#111827', '#f97316', '#3b82f6', '#10b981'], // Hacker pop
    ['#ffffff', '#000000', '#ff00ff', '#00ffff'], // CMYK vibe
    ['#f43f5e', '#8b5cf6', '#ec4899', '#0ea5e9'], // Cool berries
    ['#f97316', '#eab308', '#ef4444', '#14b8a6']  // Warm sunset
  ];

  const handleRandomizeColor = () => {
    // Pick a curated palette
    const palette = MEMPHIS_PALETTES[Math.floor(Math.random() * MEMPHIS_PALETTES.length)];
    // Shuffle the 4 colors so they map to different shapes every time
    const shuffled = [...palette].sort(() => 0.5 - Math.random());
    setColor1(shuffled[0]);
    setColor2(shuffled[1]);
    setColor3(shuffled[2]);
    setColor4(shuffled[3]);
  };

  const handleRandomizeStructure = () => {
    setDensity(Math.floor(Math.random() * 80) + 20); // 20 - 100
    setMinSize(Math.floor(Math.random() * 30) + 20); // 20 - 50
    setMaxSize(Math.floor(Math.random() * 150) + 80); // 80 - 230
    const styles = ['solid', 'outline', 'mixed'];
    setShapeStyle(styles[Math.floor(Math.random() * styles.length)]);
    setVariation(Math.floor(Math.random() * 100) + 1);
    setGlobalRotate(Math.floor(Math.random() * 360));
  };

  const resetAll = () => {
    setBgMode(true);
    setBgColor('#f8fafc');
    setColor1('#000000');
    setColor2('#ff007f');
    setColor3('#00ccff');
    setColor4('#ffcc00');
    setDensity(32);
    setMinSize(24);
    setMaxSize(195);
    setShapeStyle('solid');
    setShadowOpacity(15);
    setVariation(31);
    setGlobalRotate(127);
  };

  const mulberry32 = (a) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  };

  const getSvgContent = (forExport = false) => {
    const random = mulberry32(12345 + variation * 9999);
    const colors = [color1, color2, color3, color4];
    const shapes = [];

    const SHAPE_TYPES = ['circle', 'triangle', 'square', 'pill', 'plus', 'zigzag', 'squiggle', 'dots'];

    for (let i = 0; i < density; i++) {
      const type = SHAPE_TYPES[Math.floor(random() * SHAPE_TYPES.length)];
      const x = random() * 1920;
      const y = random() * 1080;
      const size = minSize + random() * (maxSize - minSize);
      const color = colors[Math.floor(random() * colors.length)];
      const rotation = (random() * 360) + globalRotate;
      
      let isOutline = false;
      if (shapeStyle === 'outline') isOutline = true;
      if (shapeStyle === 'mixed') isOutline = random() > 0.5;

      const strokeW = Math.max(4, size * 0.1);
      let shapeSvg = '';

      switch(type) {
        case 'circle':
          shapeSvg = `<circle cx="0" cy="0" r="${size/2}" ${isOutline ? `fill="none" stroke="${color}" stroke-width="${strokeW}"` : `fill="${color}"`} />`;
          break;
        case 'triangle':
          shapeSvg = `<polygon points="0,-${size/2} ${size/2},${size/2} -${size/2},${size/2}" ${isOutline ? `fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round"` : `fill="${color}"`} />`;
          break;
        case 'square':
          shapeSvg = `<rect x="-${size/2}" y="-${size/2}" width="${size}" height="${size}" ${isOutline ? `fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round"` : `fill="${color}"`} />`;
          break;
        case 'pill':
          shapeSvg = `<rect x="-${size}" y="-${size/3}" width="${size*2}" height="${size*0.66}" rx="${size*0.33}" ${isOutline ? `fill="none" stroke="${color}" stroke-width="${strokeW}"` : `fill="${color}"`} />`;
          break;
        case 'plus': {
          const t = size * 0.2;
          const s = size / 2;
          shapeSvg = `<path d="M -${t},-${s} L ${t},-${s} L ${t},-${t} L ${s},-${t} L ${s},${t} L ${t},${t} L ${t},${s} L -${t},${s} L -${t},${t} L -${s},${t} L -${s},-${t} L -${t},-${t} Z" ${isOutline ? `fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round"` : `fill="${color}"`} />`;
          break;
        }
        case 'zigzag':
          shapeSvg = `<polyline points="-${size},0 -${size/2},-${size/2} 0,0 ${size/2},-${size/2} ${size},0" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round" stroke-linecap="round" />`;
          break;
        case 'squiggle':
          shapeSvg = `<path d="M -${size},0 Q -${size*0.75},-${size/2} -${size/2},0 T 0,0 T ${size/2},0 T ${size},0" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" />`;
          break;
        case 'dots': {
          const dotR = size * 0.08;
          const step = size * 0.4;
          let dots = '';
          for(let dx=-1; dx<=1; dx++) {
            for(let dy=-1; dy<=1; dy++) {
              dots += `<circle cx="${dx*step}" cy="${dy*step}" r="${dotR}" fill="${color}" />`;
            }
          }
          shapeSvg = `<g>${dots}</g>`;
          break;
        }
      }

      shapes.push(`\n        <g transform="translate(${x}, ${y}) rotate(${rotation})">\n          ${shapeSvg}\n        </g>`);
    }

    let content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display: block;">
  <defs>
    <filter id="memphis-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="10" dy="10" stdDeviation="5" flood-color="#000000" flood-opacity="${shadowOpacity / 100}" />
    </filter>
  </defs>`;

    if (bgMode) {
      content += `\n  <rect width="1920" height="1080" fill="${bgColor}" />`;
    }

    content += `\n  <g${shadowOpacity > 0 ? ' filter="url(#memphis-shadow)"' : ''}>`;
    content += shapes.join('');
    content += `\n  </g>\n</svg>`;

    return content;
  };

  const handleCopySVG = () => copy(getSvgContent(true));

  const handleDownloadPNG = () => {
    const s = getSvgContent(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1920; canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.fillStyle = bgColor;
      if (bgMode) ctx.fillRect(0, 0, 1920, 1080);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `Memphis-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      
      {/* Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img src={persona?.avatar} alt={persona?.name || 'Memphis'} onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{ borderColor: `color-mix(in srgb, ${persona?.theme?.primary || '#f43f5e'} 50%, transparent)` }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona?.name || 'Memphis Generator'}</span>
              {persona?.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <button onClick={resetAll} className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          <RotateCcw size={18} /><span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Appearance */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><Palette className="w-4 h-4 text-slate-400" />Appearance</h3>
                <button onClick={handleRandomizeColor} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"><RotateCcw size={12} /> Random</button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Background Layer</span>
                    <button onClick={() => setBgMode(!bgMode)} className={clsx("w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", bgMode ? "bg-[#1e293b] border-[#1e293b] dark:bg-white dark:border-white" : "bg-transparent border-[#94a3b8] dark:border-slate-500")}>
                      <div className={clsx("w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", bgMode ? "bg-white dark:bg-[#1e293b] translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]")} />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Colors</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openPicker('c1')} className={clsx("w-6 h-6 rounded border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'c1' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor: color1}} title="Color 1" />
                      <button onClick={() => openPicker('c2')} className={clsx("w-6 h-6 rounded border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'c2' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor: color2}} title="Color 2" />
                      <button onClick={() => openPicker('c3')} className={clsx("w-6 h-6 rounded border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'c3' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor: color3}} title="Color 3" />
                      <button onClick={() => openPicker('c4')} className={clsx("w-6 h-6 rounded border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'c4' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor: color4}} title="Color 4" />
                      {bgMode && (
                        <button onClick={() => openPicker('bg')} className={clsx("ml-2 w-6 h-6 rounded-full border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'bg' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor: bgColor}} title="Background Color" />
                      )}
                    </div>
                  </div>
                  {activePicker && (
                    <div ref={pickerRef} className="absolute top-full mt-2 left-0 right-0 z-50 flex flex-col gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl animate-[scaleInPop_0.2s_ease-out_forwards]">
                      <style>{`@keyframes scaleInPop{0%{opacity:0;transform:scale(0.9) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}.lp-picker .react-colorful{width:100%!important;height:150px!important;border-radius:8px!important}.lp-picker .react-colorful__saturation{border-radius:8px 8px 0 0!important}.lp-picker .react-colorful__hue{height:12px!important;border-radius:0 0 8px 8px!important}.lp-picker .react-colorful__pointer{width:18px!important;height:18px!important;border-width:2px!important}`}</style>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{activePicker === 'bg' ? 'Background' : `Color ${activePicker.replace('c','')}`}</span>
                        <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden w-24">
                          <span className="pl-2 text-slate-400 font-bold text-xs">#</span>
                          <input type="text" value={hexInput} onChange={e => handleHexInputChange(e.target.value)} onBlur={() => {const cur = activePicker === 'c1' ? color1 : activePicker === 'c2' ? color2 : activePicker === 'c3' ? color3 : activePicker === 'c4' ? color4 : bgColor; setHexInput(cur.replace('#', ''));}} className="w-full bg-transparent py-1.5 px-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase" placeholder="FFFFFF" />
                        </div>
                      </div>
                      <div className="lp-picker">
                        <HexColorPicker color={activePicker === 'c1' ? color1 : activePicker === 'c2' ? color2 : activePicker === 'c3' ? color3 : activePicker === 'c4' ? color4 : bgColor} onChange={handlePickerChange} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Structure */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><Settings2 className="w-4 h-4 text-slate-400" />Structure</h3>
                <button onClick={handleRandomizeStructure} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"><RotateCcw size={12} /> Random</button>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {[
                  { label: 'Density', value: density, min: 10, max: 200, setter: setDensity },
                  { label: 'Variation', value: variation, min: 1, max: 100, setter: setVariation },
                  { label: 'Rotation', value: globalRotate, min: 0, max: 360, setter: setGlobalRotate },
                  { label: 'Min Size', value: minSize, min: 10, max: 100, setter: setMinSize },
                  { label: 'Max Size', value: maxSize, min: 50, max: 300, setter: setMaxSize },
                  { label: 'Shadow Opacity', value: shadowOpacity, min: 0, max: 50, setter: setShadowOpacity },
                ].map(s => (
                  <div key={s.label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">{s.label}</label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{s.value}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.setter(Number(e.target.value))} className="w-full h-[2px] appearance-none cursor-pointer bg-[#cbd5e1] dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1e293b] dark:[&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing" />
                  </div>
                ))}
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Shape Style</label>
                  <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                    {['solid', 'outline', 'mixed'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setShapeStyle(style)}
                        className={clsx(
                          "flex-1 py-1 text-[11px] font-bold capitalize rounded-md transition-colors",
                          shapeStyle === style ? "bg-white dark:bg-[#333] text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" />Live Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setVariation(Math.floor(Math.random() * 100) + 1)} className="flex items-center justify-center gap-1.5 h-7 px-3 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/20 transition-colors uppercase tracking-widest">
                  <RotateCcw size={14} /><span>Shuffle</span>
                </button>
                <button onClick={handleDownloadPNG} className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25" style={{backgroundColor:persona?.theme?.primary || '#f43f5e','--color-primary':persona?.theme?.primary || '#f43f5e'}}>
                  <Download size={14} /><span>Save Image</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full relative overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',backgroundPosition:'0 0, 10px 10px',backgroundSize:'20px 20px'}}></div>
              <div className="w-full h-full absolute inset-0 flex items-center justify-center" dangerouslySetInnerHTML={{__html:getSvgContent()}} />
            </div>

            <div className="h-auto py-3 px-4 sm:px-6 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 truncate mr-4">
                <Code size={16} className="shrink-0" />
                <span className="text-xs font-mono truncate">&lt;svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"&gt;...&lt;/svg&gt;</span>
              </div>
              <button onClick={handleCopySVG} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] transition-colors shrink-0">
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy SVG'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemphisGeneratorApp;
