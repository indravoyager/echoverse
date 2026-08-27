import { useState, useEffect, useMemo } from 'react';
import { Settings2, Copy, Check, Info, RotateCcw, Link as LinkIcon, Unlink, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

const RATIO_PRESETS = [
  { label: '16:9', x: 16, y: 9 },
  { label: '4:3', x: 4, y: 3 },
  { label: '3:2', x: 3, y: 2 },
  { label: '5:4', x: 5, y: 4 },
  { label: '1:1', x: 1, y: 1 },
  { label: 'Custom', x: 0, y: 0 },
];

const AspectIcon = ({ label, active, color, isPortrait }) => {
  let w = 16, h = 16;
  if (label === '16:9') { w = 20; h = 12; }
  else if (label === '4:3') { w = 18; h = 14; }
  else if (label === '3:2') { w = 18; h = 12; }
  else if (label === '5:4') { w = 16; h = 13; }
  
  if (isPortrait && label !== '1:1' && label !== 'Custom') {
    const temp = w;
    w = h;
    h = temp;
  }
  
  if (label === 'Custom') {
    return (
      <div className="w-6 h-6 flex items-center justify-center">
        <div 
          className={clsx("w-4 h-4 border-[1.5px] border-dashed rounded-[2px] transition-colors", active ? "border-[var(--active-color)]" : "border-slate-400 dark:border-slate-500")}
          style={{ '--active-color': color }}
        />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <div 
        className={clsx("border-[1.5px] rounded-[2px] transition-all duration-300", active ? "border-[var(--active-color)] bg-[var(--active-color)]/10" : "border-slate-400 dark:border-slate-500")}
        style={{ width: `${w}px`, height: `${h}px`, '--active-color': color }}
      />
    </div>
  );
};

export default function LayoutStudioApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [mode, setMode] = useState('Aspect Ratio');
  
  // Aspect Ratio State
  const [inputValue, setInputValue] = useState(1080);
  const [baseDimension, setBaseDimension] = useState('width'); // 'width' or 'height'
  const [arPreset, setArPreset] = useState('5:4');
  const [isPortrait, setIsPortrait] = useState(true);
  const [arCustomX, setArCustomX] = useState(4);
  const [arCustomY, setArCustomY] = useState(5);
  const [isLinked, setIsLinked] = useState(true);
  const [unlinkedWidth, setUnlinkedWidth] = useState(1080);
  const [unlinkedHeight, setUnlinkedHeight] = useState(1350);
  
  // Grid System State
  const [gridContainer, setGridContainer] = useState(1140);
  const [gridColumns, setGridColumns] = useState(12);
  const [gridGutter, setGridGutter] = useState(30);
  const [gridMargin, setGridMargin] = useState(0);

  // Copy States
  const [copiedHeight, setCopiedHeight] = useState(false);
  const [copiedCol, setCopiedCol] = useState(false);

  const copyToClipboard = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Calculations: Aspect Ratio
  const currentRatio = useMemo(() => {
    let r = { x: 16, y: 9 };
    if (arPreset === 'Custom') {
      r = { x: arCustomX || 1, y: arCustomY || 1 };
    } else {
      const preset = RATIO_PRESETS.find(p => p.label === arPreset);
      if (preset) r = { x: preset.x, y: preset.y };
    }
    const landscapeX = Math.max(r.x, r.y);
    const landscapeY = Math.min(r.x, r.y);
    return isPortrait ? { x: landscapeY, y: landscapeX } : { x: landscapeX, y: landscapeY };
  }, [arPreset, arCustomX, arCustomY, isPortrait]);

  const targetWidth = useMemo(() => {
    if (!isLinked) return unlinkedWidth;
    if (!inputValue || isNaN(inputValue)) return 0;
    return baseDimension === 'width' ? inputValue : Math.round((inputValue / currentRatio.y) * currentRatio.x);
  }, [inputValue, baseDimension, currentRatio, isLinked, unlinkedWidth]);

  const targetHeight = useMemo(() => {
    if (!isLinked) return unlinkedHeight;
    if (!inputValue || isNaN(inputValue)) return 0;
    return baseDimension === 'height' ? inputValue : Math.round((inputValue / currentRatio.x) * currentRatio.y);
  }, [inputValue, baseDimension, currentRatio, isLinked, unlinkedHeight]);

  // Calculations: Grid System
  const columnWidth = useMemo(() => {
    if (!gridContainer || !gridColumns || gridColumns <= 0) return 0;
    const totalGutter = gridGutter * (gridColumns - 1);
    const totalMargin = gridMargin * 2;
    const availableWidth = gridContainer - totalMargin - totalGutter;
    return Number((availableWidth / gridColumns).toFixed(2));
  }, [gridContainer, gridColumns, gridGutter, gridMargin]);

  const handleOrientationChange = (toPortrait) => {
    if (toPortrait === isPortrait) return;
    setInputValue(baseDimension === 'width' ? targetHeight : targetWidth);
    setIsPortrait(toPortrait);
  };

  const handleReset = () => {
    setInputValue(1080);
    setBaseDimension('width');
    setArPreset('5:4');
    setIsPortrait(true);
    setIsLinked(true);
    setGridContainer(1140);
    setGridColumns(12);
    setGridGutter(30);
    setGridMargin(0);
  };

  const toggleLink = () => {
    if (isLinked) {
      setUnlinkedWidth(targetWidth);
      setUnlinkedHeight(targetHeight);
      setArPreset('Custom');
      setArCustomX(targetWidth);
      setArCustomY(targetHeight);
      setIsLinked(false);
    } else {
      setBaseDimension('width');
      setInputValue(unlinkedWidth);
      setIsLinked(true);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      {/* Header (TANPA border-b) */}
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
          onClick={handleReset} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{ 
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset Inputs"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full min-h-[500px]">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                   <Settings2 className="w-4 h-4" />
                   Configuration
                </h3>
              </div>
              
              <div className="p-4 flex flex-col gap-5">
                <SegmentedControl
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'Aspect Ratio', label: 'Aspect Ratio' },
                    { value: 'Grid System', label: 'Grid System' }
                  ]}
                />

                {/* Aspect Ratio Inputs */}
                {mode === 'Aspect Ratio' && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Width (px)</label>
                        <input 
                          type="number"
                          value={targetWidth || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (isLinked) {
                              setBaseDimension('width');
                              setInputValue(val);
                            } else {
                              setUnlinkedWidth(val);
                              setArCustomX(val);
                            }
                          }}
                          className={clsx("w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none transition-all", isLinked && baseDimension === 'width' ? "border-[var(--tw-ring-color)] ring-1 ring-[var(--tw-ring-color)]" : "border-slate-200 dark:border-white/10")}
                          style={{ '--tw-ring-color': persona.theme.primary }}
                        />
                      </div>
                      
                      <button 
                        onClick={toggleLink}
                        className={clsx(
                          "h-[38px] w-[38px] flex items-center justify-center rounded-lg transition-colors flex-shrink-0 border",
                          isLinked 
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20" 
                            : "bg-slate-50 dark:bg-[#0a0a0a]/50 border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                        style={isLinked ? { '--color-primary': persona.theme.primary } : {}}
                        title={isLinked ? "Unlink Dimensions" : "Link Dimensions"}
                      >
                        {isLinked ? <LinkIcon size={16} /> : <Unlink size={16} />}
                      </button>

                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Height (px)</label>
                        <input 
                          type="number"
                          value={targetHeight || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (isLinked) {
                              setBaseDimension('height');
                              setInputValue(val);
                            } else {
                              setUnlinkedHeight(val);
                              setArCustomY(val);
                            }
                          }}
                          className={clsx("w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none transition-all", isLinked && baseDimension === 'height' ? "border-[var(--tw-ring-color)] ring-1 ring-[var(--tw-ring-color)]" : "border-slate-200 dark:border-white/10")}
                          style={{ '--tw-ring-color': persona.theme.primary }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Orientation</label>
                      <SegmentedControl
                        value={isPortrait}
                        onChange={handleOrientationChange}
                        options={[
                          { value: false, label: 'Landscape' },
                          { value: true, label: 'Portrait' }
                        ]}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ratio Preset</label>
                      <SegmentedControl
                        value={arPreset}
                        onChange={setArPreset}
                        options={[
                          { value: '16:9', label: '16:9' },
                          { value: '4:3', label: '4:3' },
                          { value: '3:2', label: '3:2' },
                          { value: '5:4', label: '5:4' },
                          { value: '1:1', label: '1:1' },
                          { value: 'Custom', label: 'Custom' }
                        ]}
                      />
                    </div>

                    {arPreset === 'Custom' && (
                      <div className="flex gap-3 animate-in fade-in duration-200">
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ratio X</label>
                          <input type="number" value={arCustomX} onChange={(e) => setArCustomX(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                        </div>
                        <div className="flex items-end pb-2">
                          <span className="text-slate-400 font-bold">:</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ratio Y</label>
                          <input type="number" value={arCustomY} onChange={(e) => setArCustomY(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grid System Inputs */}
                {mode === 'Grid System' && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Container Width (px)</label>
                      <input type="number" value={gridContainer} onChange={(e) => setGridContainer(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Columns</label>
                      <input type="number" value={gridColumns} onChange={(e) => setGridColumns(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gutter (px)</label>
                        <input type="number" value={gridGutter} onChange={(e) => setGridGutter(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margin (px)</label>
                        <input type="number" value={gridMargin} onChange={(e) => setGridMargin(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Context Helper */}
            {mode === 'Grid System' && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-blue-700 dark:text-blue-300">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Mathematical CSS Grid calculations for UI Design. Ensure the margin value reflects the total outer padding of your container.
                </p>
              </div>
            )}
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                 <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Visual Preview</h3>
                 {/* Utility Action */}
                 <button 
                   onClick={() => copyToClipboard(mode === 'Aspect Ratio' ? (baseDimension === 'width' ? targetHeight.toString() : targetWidth.toString()) : columnWidth.toString(), mode === 'Aspect Ratio' ? setCopiedHeight : setCopiedCol)}
                   className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                 >
                   {(mode === 'Aspect Ratio' ? copiedHeight : copiedCol) ? (
                     <>
                       <span className="text-xs font-bold text-green-500 animate-in fade-in slide-in-from-right-2 duration-200">Copied!</span>
                       <Check size={16} className="text-green-500" />
                     </>
                   ) : (
                     <Copy size={16} />
                   )}
                 </button>
              </div>
              
              <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-black/20 min-h-0 overflow-hidden relative checkerboard-bg">
                
                {mode === 'Aspect Ratio' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full max-h-full animate-in fade-in duration-300">
                    <div 
                      className="border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 relative rounded-lg bg-white dark:bg-[#1a1a1a]"
                      style={{ 
                        aspectRatio: `${currentRatio.x}/${currentRatio.y}`,
                        borderColor: persona.theme.primary,
                        height: currentRatio.y >= currentRatio.x ? '100%' : 'auto',
                        width: currentRatio.x > currentRatio.y ? '100%' : 'auto',
                        maxHeight: '100%',
                        maxWidth: '100%'
                      }}
                    >
                      {/* Top Label */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 tracking-widest whitespace-nowrap">
                        WIDTH: {targetWidth}px
                      </div>
                      {/* Right Label */}
                      <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-[10px] font-bold tracking-widest rotate-90 whitespace-nowrap" style={{ color: persona.theme.primary }}>
                        {targetHeight}px
                      </div>
                      
                      {/* Center Info */}
                      <div className="text-center p-4">
                        <div className="text-3xl md:text-5xl font-black text-slate-200 dark:text-white/5 tracking-tighter transition-all">
                          {currentRatio.x}:{currentRatio.y}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full animate-in fade-in duration-300 p-4">
                    {gridColumns > 0 && gridContainer > 0 && (
                      <div className="w-full max-w-3xl flex flex-col gap-4">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 tracking-widest px-2">
                          <span>Container: {gridContainer}px</span>
                          <span style={{ color: persona.theme.primary }}>Col: {columnWidth}px</span>
                        </div>
                        
                        <div className="w-full h-48 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#1a1a1a]  flex overflow-hidden relative" style={{ padding: `0 ${gridMargin > 50 ? 50 : gridMargin}%`}}>
                          {/* Visual representation of grid (proportional) */}
                          <div className="w-full h-full flex" style={{ gap: `${(gridGutter / gridContainer) * 100}%` }}>
                            {Array.from({ length: Math.min(gridColumns, 24) }).map((_, i) => (
                              <div key={i} className="h-full flex-1 rounded-sm opacity-20 transition-all" style={{ backgroundColor: persona.theme.primary }} />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-center mt-2">
                          <div className="flex items-center gap-6 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Column</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{columnWidth}px</span>
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Gutter</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{gridGutter}px</span>
                            </div>
                          </div>
                        </div>
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
