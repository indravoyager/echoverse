import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Download, Copy, Check, RotateCcw, Settings2, Code, Layers, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import clsx from 'clsx';
import persona from '../../tools/tornpaper.json';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const TornPaperApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [color, setColor] = useState('#d1d5db'); // Paper Color
  const [paperGradient, setPaperGradient] = useState('#d1d5db'); // Paper Gradient End Color
  const [secondaryColor, setSecondaryColor] = useState('#ffffff'); // Fiber Color
  const [bgColor, setBgColor] = useState('#0f172a'); // Background Color
  
  const [gradientMode, setGradientMode] = useState(false);
  const [bgMode, setBgMode] = useState(false);
  
  const [elevation, setElevation] = useState(250); // 0 to 1080 (position of tear)
  const [roughness, setRoughness] = useState(50); // Macro jaggedness
  const [fiberWidth, setFiberWidth] = useState(25); // How much white fiber sticks out
  const [microFray, setMicroFray] = useState(30); // SVG filter displacement scale
  const [shadow, setShadow] = useState(30); // Drop shadow opacity
  const [seed, setSeed] = useState(42);
  const [invert, setInvert] = useState(false); // Paper on top or bottom
  
  const { copied: isCopied, copy } = useCopyToClipboard();
  const [activePicker, setActivePicker] = useState(null);
  const [hexInput, setHexInput] = useState('');
  
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setActivePicker(null);
      }
    };
    if (activePicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePicker]);

  const openPicker = (which) => {
    if (activePicker === which) { setActivePicker(null); return; }
    const currentColor = which === 'start' ? color : which === 'end' ? secondaryColor : bgColor;
    setHexInput(currentColor.replace('#', ''));
    setActivePicker(which);
  };

  const handlePickerChange = (newColor) => {
    if (activePicker === 'start') setColor(newColor);
    else if (activePicker === 'end') setSecondaryColor(newColor);
    else if (activePicker === 'bg') setBgColor(newColor);
    setHexInput(newColor.replace('#', ''));
  };

  const handleHexInputChange = (val) => {
    const clean = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(clean);
    if (clean.length === 6 || clean.length === 3) {
      const hex = `#${clean}`;
      if (activePicker === 'start') setColor(hex);
      else if (activePicker === 'end') setSecondaryColor(hex);
      else if (activePicker === 'bg') setBgColor(hex);
    }
  };

  const resetAll = () => {
    setColor('#d1d5db'); setPaperGradient('#d1d5db'); setSecondaryColor('#ffffff'); setBgColor('#0f172a');
    setElevation(250); setRoughness(50); setFiberWidth(25);
    setMicroFray(30); setShadow(30); setInvert(false); setSeed(42);
    setGradientMode(false); setBgMode(false);
  };

  const randomizeGeometry = () => {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    setElevation(rand(200, 800)); setRoughness(rand(20, 150));
    setFiberWidth(rand(5, 50)); setMicroFray(rand(10, 60));
    setSeed(Math.floor(Math.random() * 99999));
  };

  const randomizeColors = () => {
    const palettes = [
      ['#ffffff', '#f8fafc', '#0f172a'], // Classic White on Dark
      ['#1e293b', '#334155', '#f8fafc'], // Dark Paper on White
      ['#fef3c7', '#fde68a', '#9a3412'], // Kraft Paper
      ['#fee2e2', '#fecaca', '#7f1d1d'], // Pink Scrap
      ['#e0e7ff', '#c7d2fe', '#312e81'], // Indigo Print
      ['#dcfce7', '#bbf7d0', '#14532d'], // Mint Tear
      ['#18181b', '#27272a', '#eab308'], // Black on Yellow
      ['#f1f5f9', '#e2e8f0', '#0284c7'], // Clean Blue
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    setColor(palette[0]); setSecondaryColor(palette[1]); setBgColor(palette[2]);
  };

  // Simple 1D noise for the macro jaggedness
  const rng = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  
  const getNoise = (x, s) => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    for (let i = 0; i < 3; i++) {
      const x0 = Math.floor(x * frequency);
      const x1 = x0 + 1;
      const t = (x * frequency) - x0;
      const smooth = t * t * (3 - 2 * t);
      const v0 = rng(x0 + s * (i + 1));
      const v1 = rng(x1 + s * (i + 1));
      value += (v0 + (v1 - v0) * smooth) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value - 0.5; // range roughly -0.5 to 0.5
  };

  const generatePath = (offsetY) => {
    const width = 1920;
    const segments = 100;
    const step = width / segments;
    
    // Top corners (extended beyond the canvas so the filter doesn't tear the straight edges)
    let path = invert 
      ? `M -200 1280 L 2120 1280 L 2120 ${elevation + offsetY}`
      : `M -200 -200 L 2120 -200 L 2120 ${elevation + offsetY}`;
      
    // Jagged bottom/top edge (extend the loop to cover the extra width)
    for (let i = segments + 10; i >= -10; i--) {
      let x = i * step;
      let noise = getNoise(x * 0.005, seed) * roughness;
      // Add a secondary higher frequency noise for more tear variation
      noise += getNoise(x * 0.02, seed + 10) * (roughness * 0.3);
      
      let y = elevation + offsetY + (invert ? -noise : noise);
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    
    // Close path
    path += invert ? ` L -200 1280 Z` : ` L -200 -200 Z`;
    return path;
  };

  const getSvgContent = (forExport = false) => {
    // Generate paths for the fiber layer and the main colored layer
    // Fiber layer sticks out more (no Y offset, or slight offset depending on invert)
    // Main layer is pulled back slightly
    const fiberPath = generatePath(0);
    const mainPath = generatePath(invert ? fiberWidth : -fiberWidth);
    
    const shadowOpacity = shadow / 100;

    let content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display: block;">
  <defs>
    <!-- Filter for micro paper fibers -->
    <filter id="fray-filter" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.1" numOctaves="3" result="noise" seed="${seed}" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="${microFray}" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    
    <!-- Filter for Drop Shadow -->
    <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${invert ? -15 : 15}" stdDeviation="15" flood-color="#000000" flood-opacity="${shadowOpacity}" />
    </filter>`;

    if (gradientMode) {
      content += `
    <!-- Paper Gradient -->
    <linearGradient id="paper-grad" x1="0" y1="${invert ? '1' : '0'}" x2="0" y2="${invert ? '0' : '1'}">
      <stop offset="0%" stop-color="${color}" />
      <stop offset="100%" stop-color="${paperGradient}" />
    </linearGradient>`;
    }

    content += `
  </defs>`;

    if (bgMode) {
      content += `

  <!-- Background -->
  <rect width="1920" height="1080" fill="${bgColor}" />`;
    }

    const fillStyle = gradientMode ? 'url(#paper-grad)' : color;

    content += `

  <!-- The Torn Paper Group -->
  <!-- Apply the drop shadow to the entire group so it casts a shadow on the background -->
  <g${!forExport && shadowOpacity > 0 ? ' filter="url(#drop-shadow)"' : ''}>
    <!-- Fiber Layer (Underneath, slightly lighter/different color, usually white) -->
    <!-- Apply the fray filter to make the edge look like torn fibers -->
    <path d="${fiberPath}" fill="${secondaryColor}" filter="url(#fray-filter)" />
    
    <!-- Main Paper Layer (Top layer, main color) -->
    <!-- Apply a smaller fray filter so it looks slightly torn but sharper than the fibers -->
    <path d="${mainPath}" fill="${fillStyle}" filter="url(#fray-filter)" />
  </g>
</svg>`;
    return content;
  };

  const handleCopySVG = () => copy(getSvgContent(true));

  const handleDownloadPNG = () => {
    const svgString = getSvgContent(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `TornPaper-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
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
          <img src={persona.avatar} alt={persona.name} onClick={onOpenPersonaInfo}
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
                <button onClick={randomizeColors} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"><RotateCcw size={12} /> Random</button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#eab308] dark:text-yellow-500 uppercase tracking-widest">Gradient Mode</span>
                    <button onClick={() => setGradientMode(!gradientMode)} className={clsx("w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", gradientMode ? "bg-[#eab308] border-[#eab308] dark:bg-yellow-500 dark:border-yellow-500" : "bg-transparent border-[#94a3b8] dark:border-slate-500")}>
                      <div className={clsx("w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", gradientMode ? "bg-white translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]")} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#eab308] dark:text-yellow-500 uppercase tracking-widest">Background Layer</span>
                    <button onClick={() => setBgMode(!bgMode)} className={clsx("w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", bgMode ? "bg-[#eab308] border-[#eab308] dark:bg-yellow-500 dark:border-yellow-500" : "bg-transparent border-[#94a3b8] dark:border-slate-500")}>
                      <div className={clsx("w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", bgMode ? "bg-white translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]")} />
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#eab308] dark:text-yellow-500 uppercase tracking-widest">Colors</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openPicker('start')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='start' ? 'border-[#eab308] dark:border-yellow-500 scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:color}} title={gradientMode?"Paper Start":"Paper Color"} />
                      {gradientMode && <button onClick={() => openPicker('paperGrad')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='paperGrad' ? 'border-[#eab308] dark:border-yellow-500 scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:paperGradient}} title="Paper End" />}
                      <button onClick={() => openPicker('end')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='end' ? 'border-[#eab308] dark:border-yellow-500 scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:secondaryColor}} title="Fiber Edge Color" />
                      {bgMode && <button onClick={() => openPicker('bg')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='bg' ? 'border-[#eab308] dark:border-yellow-500 scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:bgColor}} title="Background Color" />}
                    </div>
                  </div>
                  {activePicker && (
                    <div ref={pickerRef} className="absolute top-full mt-2 left-0 right-0 z-50 flex flex-col gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl animate-[scaleInPop_0.2s_ease-out_forwards]">
                      <style>{`@keyframes scaleInPop{0%{opacity:0;transform:scale(0.9) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}.tp-picker .react-colorful{width:100%!important;height:150px!important;border-radius:8px!important}.tp-picker .react-colorful__saturation{border-radius:8px 8px 0 0!important}.tp-picker .react-colorful__hue{height:12px!important;border-radius:0 0 8px 8px!important}.tp-picker .react-colorful__pointer{width:18px!important;height:18px!important;border-width:2px!important}`}</style>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{activePicker==='start'?(gradientMode?'Paper Start':'Paper Color'):activePicker==='paperGrad'?'Paper End':activePicker==='end'?'Fiber Color':'Background'}</span>
                        <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden w-24">
                          <span className="pl-2 text-slate-400 font-bold text-xs">#</span>
                          <input type="text" value={hexInput} onChange={e=>handleHexInputChange(e.target.value)} onBlur={()=>{const cur=activePicker==='start'?color:activePicker==='paperGrad'?paperGradient:activePicker==='end'?secondaryColor:bgColor;setHexInput(cur.replace('#',''));}} className="w-full bg-transparent py-1.5 px-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase" placeholder="FFFFFF" />
                        </div>
                      </div>
                      <div className="tp-picker"><HexColorPicker color={activePicker==='start'?color:activePicker==='paperGrad'?paperGradient:activePicker==='end'?secondaryColor:bgColor} onChange={handlePickerChange} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Geometry */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><Settings2 className="w-4 h-4 text-slate-400" />Structure</h3>
                <button onClick={randomizeGeometry} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"><RotateCcw size={12} /> Random</button>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {[
                  { label:'Elevation', value:elevation, min:100, max:980, setter:setElevation },
                  { label:'Roughness', value:roughness, min:0, max:200, setter:setRoughness },
                  { label:'Fiber Width', value:fiberWidth, min:0, max:100, setter:setFiberWidth },
                  { label:'Micro Fray', value:microFray, min:0, max:100, setter:setMicroFray },
                  { label:'Shadow (Preview Only)', value:shadow, min:0, max:100, setter:setShadow },
                ].map(s=>(
                  <div key={s.label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#eab308] dark:text-yellow-500 uppercase tracking-widest">{s.label}</label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{s.value}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} value={s.value} onChange={e=>s.setter(Number(e.target.value))} className="w-full h-[2px] appearance-none cursor-pointer bg-[#cbd5e1] dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#eab308] dark:[&::-webkit-slider-thumb]:bg-yellow-500 hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing" />
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] font-bold text-[#eab308] dark:text-yellow-500 uppercase tracking-widest">Flip Position</span>
                  <button onClick={() => setInvert(!invert)} className={clsx("w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", invert ? "bg-[#eab308] border-[#eab308] dark:bg-yellow-500 dark:border-yellow-500" : "bg-transparent border-[#94a3b8] dark:border-slate-500")}>
                    <div className={clsx("w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", invert ? "bg-white translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]")} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" />Live Preview</h3>
              <button onClick={handleDownloadPNG} className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25" style={{backgroundColor:persona.theme.primary,'--color-primary':persona.theme.primary}}>
                <Download size={14} /><span>Save Image</span>
              </button>
            </div>
            <div className="flex-1 w-full relative overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',backgroundPosition:'0 0, 10px 10px',backgroundSize:'20px 20px'}}></div>
              <div className="w-full h-full absolute inset-0" dangerouslySetInnerHTML={{__html:getSvgContent()}} />
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

export default TornPaperApp;
