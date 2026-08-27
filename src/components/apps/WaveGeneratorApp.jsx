import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Download, Copy, Check, RotateCcw, Settings2, Code, Layers, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import clsx from 'clsx';
import persona from '../../tools/wavegenerator.json';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const WaveGeneratorApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [color, setColor] = useState('#06b6d4');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [gradientMode, setGradientMode] = useState(true);
  const [bgColor, setBgColor] = useState('#1e3a5f');
  const [bgMode, setBgMode] = useState(true);
  const [layers, setLayers] = useState(4);
  const [peaks, setPeaks] = useState(4);
  const [waveHeight, setWaveHeight] = useState(140);
  const [amplitude, setAmplitude] = useState(104);
  const [spacing, setSpacing] = useState(253);
  const [offset, setOffset] = useState(36);
  const [smoothness, setSmoothness] = useState(44);
  const [baseOpacity, setBaseOpacity] = useState(18);
  const [invert, setInvert] = useState(false);
  const [seed, setSeed] = useState(1);
  const { copied: isCopied, copy } = useCopyToClipboard();
  const [activePicker, setActivePicker] = useState(null); // 'start' | 'end' | 'bg' | null
  const [hexInput, setHexInput] = useState('');
  
  const pickerRef = useRef(null);

  // Click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setActivePicker(null);
      }
    };
    if (activePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePicker]);

  const openPicker = (which) => {
    if (activePicker === which) {
      setActivePicker(null);
      return;
    }
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
    setColor('#06b6d4');
    setSecondaryColor('#8b5cf6');
    setGradientMode(true);
    setBgColor('#1e3a5f');
    setBgMode(true);
    setLayers(4);
    setPeaks(4);
    setWaveHeight(140);
    setAmplitude(104);
    setSpacing(253);
    setOffset(36);
    setSmoothness(44);
    setBaseOpacity(18);
    setInvert(false);
    setSeed(1);
  };

  const randomizeGeometry = () => {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    setLayers(rand(3, 6));
    setPeaks(rand(3, 5));
    setWaveHeight(rand(100, 200));
    setAmplitude(rand(60, 120));
    setSpacing(rand(180, 300));
    setOffset(rand(15, 45));
    setSmoothness(rand(40, 65));
    setBaseOpacity(rand(12, 25));
    setSeed(Math.floor(Math.random() * 99999));
  };

  const randomizeColors = () => {
    // Curated palettes: [startColor, endColor, bgColor]
    const palettes = [
      ['#06b6d4', '#8b5cf6', '#1e3a5f'],  // Cyan → Purple / Navy
      ['#f472b6', '#fb923c', '#1a1a2e'],  // Pink → Orange / Dark
      ['#34d399', '#3b82f6', '#0f172a'],  // Emerald → Blue / Slate
      ['#facc15', '#f97316', '#1e1b4b'],  // Yellow → Orange / Indigo
      ['#a78bfa', '#ec4899', '#0c0a1d'],  // Violet → Pink / Deep
      ['#2dd4bf', '#a78bfa', '#162032'],  // Teal → Violet / Dark Blue
      ['#60a5fa', '#c084fc', '#0f1729'],  // Blue → Purple / Navy
      ['#fb7185', '#fbbf24', '#1c1917'],  // Rose → Amber / Stone
      ['#4ade80', '#22d3ee', '#0a192f'],  // Green → Cyan / Dark
      ['#f9a8d4', '#c4b5fd', '#1a1333'],  // Pink → Lavender / Deep
      ['#38bdf8', '#818cf8', '#0b1120'],  // Sky → Indigo / Dark
      ['#fca5a5', '#fcd34d', '#1e293b'],  // Red → Yellow / Slate
      ['#86efac', '#67e8f9', '#132a3e'],  // Mint → Aqua / Ocean
      ['#c084fc', '#22d3ee', '#0f0e1a'],  // Purple → Cyan / Deep
      ['#fb923c', '#a855f7', '#18181b'],  // Orange → Purple / Zinc
      ['#5eead4', '#f0abfc', '#0c1222'],  // Teal → Fuchsia / Dark
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    setColor(palette[0]);
    setSecondaryColor(palette[1]);
    setBgColor(palette[2]);
  };

  // Pseudo-random generator based on seed
  const random = (s) => {
    let x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  const generateWavePath = (layerIndex) => {
    const width = 1920;
    const canvasHeight = 1080;
    
    // Reverse layer index so layer 0 is the backmost
    const reversedIndex = layers - 1 - layerIndex;
    const progress = layers > 1 ? reversedIndex / (layers - 1) : 1;
    
    // Calculate Y offset for this layer using the spacing slider
    const yOffset = canvasHeight - waveHeight - (progress * spacing);
    const effectiveStartY = invert ? canvasHeight - yOffset : yOffset;
    
    // Use the exact same seed sequence for EVERY layer so their shapes match exactly!
    let currentSeed = seed * 100;
    
    const segmentWidth = width / peaks;
    const pathData = [];
    
    // Add horizontal shift per layer based on Offset slider. Alternate direction per layer!
    const directionMultiplier = (layerIndex % 2 === 0) ? 1 : -1;
    const layerOffset = progress * offset * directionMultiplier * 5;
    
    // Start X well before the left edge to allow horizontal shifting without gaps
    let currentX = -segmentWidth * 2 + layerOffset;
    
    // Start point
    pathData.push(`M ${currentX} ${invert ? 0 : canvasHeight}`);
    pathData.push(`L ${currentX} ${effectiveStartY}`);
    
    let currentY = effectiveStartY;
    
    // Render enough peaks to cover the screen and any offsets
    const totalPeaks = peaks + 6;
    
    for (let p = 0; p < totalPeaks; p++) {
      const nextX = currentX + segmentWidth;
      // Alternate high and low points
      const direction = (p % 2 === 0) ? 1 : -1;
      
      // Use exact same amplitude sequence for all layers
      const peakAmplitude = amplitude * (1 + random(currentSeed++) * 0.3);
      const nextY = effectiveStartY + (direction * peakAmplitude * (invert ? -1 : 1));
      
      const cp1x = currentX + segmentWidth * (smoothness / 100);
      const cp1y = currentY;
      const cp2x = nextX - segmentWidth * (smoothness / 100);
      const cp2y = nextY;
      
      pathData.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextX} ${nextY}`);
      
      currentX = nextX;
      currentY = nextY;
    }
    
    // Complete the shape
    pathData.push(`L ${currentX} ${invert ? 0 : canvasHeight} Z`);
    
    return pathData.join(' ');
  };

  const getSvgContent = () => {
    let content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display: block;">\n`;
    
    if (gradientMode) {
      content += `  <defs>
    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${color}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
  </defs>\n`;
    }
    
    if (bgMode) {
      content += `<rect width="1920" height="1080" fill="${bgColor}"/>\n`;
    }
    
    for (let i = 0; i < layers; i++) {
      const path = generateWavePath(i);
      const minOpacity = baseOpacity / 100;
      const opacity = layers > 1 ? (minOpacity + (i / (layers - 1)) * (1 - minOpacity)).toFixed(2) : 1;
      const fill = gradientMode ? 'url(#wave-grad)' : color;
      
      content += `  <path d="${path}" fill="${fill}" opacity="${opacity}" />\n`;
    }
    content += `</svg>`;
    return content;
  };

  const handleCopySVG = () => copy(getSvgContent());

  const handleDownloadSVG = () => {
    const blob = new Blob([getSvgContent()], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Echo-Wave-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const svgString = getSvgContent();
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Fill transparent background with white or a very subtle off-white so PNG looks good
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `Echo-Wave-${Date.now()}.png`;
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
            {/* Appearance */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Palette className="w-4 h-4 text-slate-400" />
                  Appearance
                </h3>
                <button 
                  onClick={randomizeColors}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"
                >
                  <RotateCcw size={12} /> Random
                </button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {/* Mode Toggles */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Gradient Mode</span>
                    <button 
                      onClick={() => setGradientMode(!gradientMode)} 
                      className={clsx(
                        "w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", 
                        gradientMode ? "bg-[#1e293b] border-[#1e293b] dark:bg-white dark:border-white" : "bg-transparent border-[#94a3b8] dark:border-slate-500"
                      )}
                    >
                      <div className={clsx(
                        "w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", 
                        gradientMode ? "bg-white dark:bg-[#1e293b] translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]"
                      )} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Background Layer</span>
                    <button 
                      onClick={() => setBgMode(!bgMode)} 
                      className={clsx(
                        "w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", 
                        bgMode ? "bg-[#1e293b] border-[#1e293b] dark:bg-white dark:border-white" : "bg-transparent border-[#94a3b8] dark:border-slate-500"
                      )}
                    >
                      <div className={clsx(
                        "w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", 
                        bgMode ? "bg-white dark:bg-[#1e293b] translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 relative">
                  {/* Color Swatches Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Colors</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPicker('start')}
                        className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'start' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')}
                        style={{ backgroundColor: color }}
                        title={gradientMode ? 'Start Color' : 'Wave Color'}
                      />
                      {gradientMode && (
                        <button
                          onClick={() => openPicker('end')}
                          className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'end' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')}
                          style={{ backgroundColor: secondaryColor }}
                          title="End Color"
                        />
                      )}
                      {bgMode && (
                        <button
                          onClick={() => openPicker('bg')}
                          className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker === 'bg' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')}
                          style={{ backgroundColor: bgColor }}
                          title="Background Color"
                        />
                      )}
                    </div>
                  </div>

                  {/* Color Picker Popover — floating below */}
                  {activePicker && (
                    <div ref={pickerRef} className="absolute top-full mt-2 left-0 right-0 z-50 flex flex-col gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl animate-[scaleInPop_0.2s_ease-out_forwards]">
                      <style>{`
                        @keyframes scaleInPop {
                          0% { opacity: 0; transform: scale(0.9) translateY(8px); }
                          100% { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .wave-picker .react-colorful { width: 100% !important; height: 150px !important; border-radius: 8px !important; }
                        .wave-picker .react-colorful__saturation { border-radius: 8px 8px 0 0 !important; }
                        .wave-picker .react-colorful__hue { height: 12px !important; border-radius: 0 0 8px 8px !important; }
                        .wave-picker .react-colorful__pointer { width: 18px !important; height: 18px !important; border-width: 2px !important; }
                      `}</style>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {activePicker === 'start' ? (gradientMode ? 'Start Color' : 'Wave Color') : activePicker === 'end' ? 'End Color' : 'Background'}
                        </span>
                        <div
                          className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden w-24"
                        >
                          <span className="pl-2 text-slate-400 font-bold text-xs">#</span>
                          <input
                            type="text"
                            value={hexInput}
                            onChange={e => handleHexInputChange(e.target.value)}
                            onBlur={() => {
                              const current = activePicker === 'start' ? color : activePicker === 'end' ? secondaryColor : bgColor;
                              setHexInput(current.replace('#', ''));
                            }}
                            className="w-full bg-transparent py-1.5 px-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase"
                            placeholder="FFFFFF"
                          />
                        </div>
                      </div>
                      <div className="wave-picker">
                        <HexColorPicker
                          color={activePicker === 'start' ? color : activePicker === 'end' ? secondaryColor : bgColor}
                          onChange={handlePickerChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Geometry Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4 text-slate-400" />
                  Geometry
                </h3>
                <button 
                  onClick={randomizeGeometry}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"
                >
                  <RotateCcw size={12} /> Random
                </button>
              </div>
              
              <div className="p-4 flex flex-col gap-5">
                {/* Sliders */}
                {[
                  { label: 'Layers', value: layers, min: 1, max: 10, setter: setLayers },
                  { label: 'Peaks', value: peaks, min: 1, max: 10, setter: setPeaks },
                  { label: 'Height', value: waveHeight, min: 0, max: 700, setter: setWaveHeight },
                  { label: 'Amplitude', value: amplitude, min: 0, max: 300, setter: setAmplitude },
                  { label: 'Spacing', value: spacing, min: 0, max: 500, setter: setSpacing },
                  { label: 'Offset', value: offset, min: -100, max: 100, setter: setOffset },
                  { label: 'Smoothness', value: smoothness, min: 0, max: 100, setter: setSmoothness },
                  { label: 'Base Opac.', value: baseOpacity, min: 5, max: 100, setter: setBaseOpacity },
                ].map(slider => (
                  <div key={slider.label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">{slider.label}</label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{slider.value}</span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={slider.value}
                      onChange={(e) => slider.setter(Number(e.target.value))}
                      className="w-full h-[2px] appearance-none cursor-pointer bg-[#cbd5e1] dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1e293b] dark:[&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    />
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Invert</span>
                  <button 
                    onClick={() => setInvert(!invert)}
                    className={clsx(
                      "w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", 
                      invert ? "bg-[#1e293b] border-[#1e293b] dark:bg-white dark:border-white" : "bg-transparent border-[#94a3b8] dark:border-slate-500"
                    )}
                  >
                    <div className={clsx(
                      "w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", 
                      invert ? "bg-white dark:bg-[#1e293b] translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                Live Preview
              </h3>
              <button 
                  onClick={handleDownloadPNG}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25"
                  style={{ backgroundColor: persona.theme.primary, '--color-primary': persona.theme.primary }}
                >
                  <Download size={14} />
                  <span>Save Image</span>
                </button>
            </div>
            
            <div className="flex-1 w-full relative overflow-hidden transition-all duration-300">
              {/* Checkerboard pattern for transparency indication */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
              
              {/* Actual SVG container — fills entire area */}
              <div 
                className="w-full h-full absolute inset-0"
                dangerouslySetInnerHTML={{ __html: getSvgContent() }}
              />
            </div>
            
            {/* Code Output */}
            <div className="h-auto py-3 px-4 sm:px-6 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 truncate mr-4">
                <Code size={16} className="shrink-0" />
                <span className="text-xs font-mono truncate">&lt;svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"&gt;...&lt;/svg&gt;</span>
              </div>
              <button
                onClick={handleCopySVG}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] transition-colors shrink-0"
              >
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

export default WaveGeneratorApp;
