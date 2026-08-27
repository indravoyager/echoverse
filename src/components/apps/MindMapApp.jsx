import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Leaf, Download, Copy, Check, RotateCcw, Settings2, Code, Layers, FileText, Palette, ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import persona from '../../tools/mindmap.json';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const DEFAULT_TEXT = `Mind Map Visualizer
  Features
    Auto Layout
    SVG Export
    Custom Themes
  Node Styles
    Pill
    Box
    Underline
  Line Styles
    Curved
    Straight
    Orthogonal
  Use Cases
    Brainstorming
    Project Planning
    Notes`;

const THEMES = {
  indigo: { name: 'Indigo Pop', bg: '#ffffff', line: '#c7d2fe', nodeBg: '#4f46e5', nodeText: '#ffffff' },
  dark: { name: 'Dark Mode', bg: '#0f172a', line: '#334155', nodeBg: '#1e293b', nodeText: '#f8fafc', border: '#475569' },
  emerald: { name: 'Mint Forest', bg: '#f0fdf4', line: '#a7f3d0', nodeBg: '#10b981', nodeText: '#ffffff' },
  rose: { name: 'Rose Petal', bg: '#fff1f2', line: '#fecdd3', nodeBg: '#e11d48', nodeText: '#ffffff' },
  amber: { name: 'Sunset', bg: '#fffbeb', line: '#fde68a', nodeBg: '#d97706', nodeText: '#ffffff' },
  retro: { name: 'Memphis Classic', bg: '#ffffff', line: '#000000', nodeBg: '#ff00ff', nodeText: '#ffffff', border: '#000000', shadow: true }
};

const parseTextToTree = (text) => {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return null;
  
  const root = { id: 'root', text: lines[0].trim(), children: [], depth: 0, parent: null };
  const stack = [{ node: root, indent: 0 }];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const nodeText = line.trim();
    
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parentItem = stack[stack.length - 1];
    if (!parentItem) continue; // safety fallback
    
    const parentNode = parentItem.node;
    const newNode = { id: `n_${i}`, text: nodeText, children: [], depth: parentNode.depth + 1, parent: parentNode };
    parentNode.children.push(newNode);
    stack.push({ node: newNode, indent });
  }
  return root;
};

const MindMapApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [activeTheme, setActiveTheme] = useState('indigo');
  const [lineStyle, setLineStyle] = useState('curved'); // curved, straight, orthogonal
  const [nodeStyle, setNodeStyle] = useState('pill'); // pill, box, underline
  const [hSpacing, setHSpacing] = useState(220);
  const [vSpacing, setVSpacing] = useState(60);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  
  const { copied: isCopied, copy } = useCopyToClipboard();

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      const newValue = inputText.substring(0, start) + '  ' + inputText.substring(end);
      setInputText(newValue);
      
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.0015;
      const delta = -e.deltaY * zoomSensitivity;
      setScale(s => Math.min(Math.max(0.1, s + delta), 5));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const resetAll = () => {
    setInputText(DEFAULT_TEXT);
    setActiveTheme('indigo');
    setLineStyle('curved');
    setNodeStyle('pill');
    setHSpacing(220);
    setVSpacing(60);
    resetView();
  };

  // Calculate Layout
  const treeData = useMemo(() => {
    const root = parseTextToTree(inputText);
    if (!root) return null;

    let currentY = 0;
    
    const calculatePass = (node) => {
      // Base case: leaf node
      if (node.children.length === 0) {
        node.y = currentY;
        currentY += vSpacing;
      } else {
        let minY = Infinity, maxY = -Infinity;
        node.children.forEach(child => {
          calculatePass(child);
          if (child.y < minY) minY = child.y;
          if (child.y > maxY) maxY = child.y;
        });
        node.y = (minY + maxY) / 2;
      }
      node.x = node.depth * hSpacing;
    };
    
    calculatePass(root);
    return root;
  }, [inputText, hSpacing, vSpacing]);

  const getSvgContent = (forExport = false) => {
    if (!treeData) return '';
    
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const traverseBounds = (node) => {
      // Approx width of text node (padding added for safety)
      const estimatedWidth = Math.max(80, node.text.length * 9 + 40);
      const halfW = estimatedWidth / 2;
      
      if (node.x - halfW < minX) minX = node.x - halfW;
      if (node.x + halfW > maxX) maxX = node.x + halfW;
      if (node.y - 30 < minY) minY = node.y - 30;
      if (node.y + 30 > maxY) maxY = node.y + 30;
      node.children.forEach(traverseBounds);
    };
    traverseBounds(treeData);

    const pad = 60;
    const width = Math.max(800, maxX - minX + pad * 2);
    const height = Math.max(600, maxY - minY + pad * 2);
    
    const theme = THEMES[activeTheme];
    
    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${width} ${height}" width="${width}" height="${height}" style="${forExport ? `background: ${theme.bg};` : ''} font-family: system-ui, -apple-system, sans-serif; overflow: visible;">`;
    
    // Add defs if needed
    if (theme.shadow) {
      svgStr += `
      <defs>
        <filter id="hard-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000" flood-opacity="1"/>
        </filter>
      </defs>`;
    }

    const lines = [];
    const nodes = [];

    const traverseRender = (node) => {
      const estimatedWidth = Math.max(80, node.text.length * 9 + 30);
      const halfW = estimatedWidth / 2;
      
      // Draw lines to children
      node.children.forEach(child => {
        const childW = Math.max(80, child.text.length * 9 + 30);
        const startX = node.x + halfW;
        const startY = node.y;
        const endX = child.x - (childW / 2);
        const endY = child.y;

        let pathD = '';
        if (lineStyle === 'curved') {
          const cpX = (startX + endX) / 2;
          pathD = `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`;
        } else if (lineStyle === 'orthogonal') {
          const midX = (startX + endX) / 2;
          pathD = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        } else {
          pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        }

        lines.push(`<path d="${pathD}" fill="none" stroke="${theme.line}" stroke-width="${theme.shadow ? '4' : '3'}" ${theme.shadow ? 'stroke-linejoin="round"' : ''} />`);
        traverseRender(child);
      });

      // Draw Node
      let nodeSvg = '';
      const nBg = node.depth === 0 ? theme.nodeBg : (theme.border ? theme.nodeBg : 'transparent');
      const nBorder = theme.border || (node.depth > 0 ? theme.line : 'none');
      const nText = node.depth === 0 ? theme.nodeText : (theme.name === 'Dark Mode' ? '#f8fafc' : '#1e293b');
      const strokeStr = nBorder !== 'none' ? `stroke="${nBorder}" stroke-width="2"` : '';
      const filterStr = (theme.shadow && node.depth === 0) ? 'filter="url(#hard-shadow)"' : '';

      if (nodeStyle === 'pill') {
        nodeSvg = `
          <rect x="${node.x - halfW}" y="${node.y - 18}" width="${estimatedWidth}" height="36" rx="18" fill="${node.depth===0?theme.nodeBg:(theme.bg==='#0f172a'?'#1e293b':'#ffffff')}" ${strokeStr} ${filterStr}/>
          <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="${node.depth===0?theme.nodeText:nText}" font-size="14" font-weight="${node.depth===0?'bold':'600'}">${node.text}</text>
        `;
      } else if (nodeStyle === 'box') {
        nodeSvg = `
          <rect x="${node.x - halfW}" y="${node.y - 18}" width="${estimatedWidth}" height="36" rx="4" fill="${node.depth===0?theme.nodeBg:(theme.bg==='#0f172a'?'#1e293b':'#ffffff')}" ${strokeStr} ${filterStr}/>
          <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="${node.depth===0?theme.nodeText:nText}" font-size="14" font-weight="${node.depth===0?'bold':'600'}">${node.text}</text>
        `;
      } else if (nodeStyle === 'underline') {
        if (node.depth === 0) {
          nodeSvg = `
            <rect x="${node.x - halfW}" y="${node.y - 18}" width="${estimatedWidth}" height="36" rx="4" fill="${theme.nodeBg}" ${filterStr}/>
            <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="${theme.nodeText}" font-size="14" font-weight="bold">${node.text}</text>
          `;
        } else {
          nodeSvg = `
            <line x1="${node.x - halfW}" y1="${node.y + 12}" x2="${node.x + halfW}" y2="${node.y + 12}" stroke="${nBorder !== 'none'? nBorder : theme.line}" stroke-width="2" />
            <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="${nText}" font-size="14" font-weight="600">${node.text}</text>
          `;
        }
      }

      nodes.push(nodeSvg);
    };

    traverseRender(treeData);

    svgStr += `\n  <g id="lines">\n    ${lines.join('\n    ')}\n  </g>`;
    svgStr += `\n  <g id="nodes">\n    ${nodes.join('\n    ')}\n  </g>`;
    svgStr += `\n</svg>`;

    return svgStr;
  };

  const handleCopySVG = () => copy(getSvgContent(true));

  const handleDownloadPNG = () => {
    const s = getSvgContent(true);
    const canvas = document.createElement('canvas');
    // We need to parse viewBox to know canvas size
    const match = s.match(/viewBox="([^"]+)"/);
    if (!match) return;
    const [vx, vy, vw, vh] = match[1].split(' ').map(Number);
    
    // Scale up for better quality
    const scale = 2;
    canvas.width = vw * scale;
    canvas.height = vh * scale;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.fillStyle = THEMES[activeTheme].bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `MindMap-${Date.now()}.png`;
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
          <img src={persona?.avatar} alt={persona?.name || 'Mind Map'} onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{ borderColor: `color-mix(in srgb, ${persona?.theme?.primary || '#6366f1'} 50%, transparent)` }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona?.name || 'Mind Map Visualizer'}</span>
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
            {/* Input Data */}
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[250px] shrink-0 relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4 text-slate-400" />Data Input</h3>
              </div>
              <div className="flex-1 flex flex-col p-4 relative">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Use indentation (spaces/tabs) to nest.</p>
                <textarea 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent text-[13px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none custom-scrollbar whitespace-pre"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><Palette className="w-4 h-4 text-slate-400" />Appearance</h3>
              </div>
              <div className="p-4 flex flex-col gap-5">
                
                {/* Theme Selector */}
                <div className="flex flex-col gap-2 relative z-50">
                  <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Theme</label>
                  <div
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 cursor-pointer transition-colors outline-none bg-slate-50 dark:bg-white/5"
                    style={{
                      borderColor: isThemeDropdownOpen ? '#1e3a8a' : undefined // Using a nice blue for the border
                    }}
                    tabIndex={0}
                    onBlur={() => setTimeout(() => setIsThemeDropdownOpen(false), 150)}
                    onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  >
                    <span className={clsx("text-sm font-medium", isThemeDropdownOpen ? "text-[#1e3a8a] dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
                      {THEMES[activeTheme]?.name}
                    </span>
                    {isThemeDropdownOpen ? <ChevronUp size={14} className="text-[#1e3a8a] dark:text-blue-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>

                  {/* Dropdown Menu */}
                  {isThemeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                      {Object.entries(THEMES).map(([key, t]) => (
                        <div
                          key={key}
                          onClick={() => { setActiveTheme(key); setIsThemeDropdownOpen(false); }}
                          className={clsx(
                            "flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                            activeTheme === key
                              ? "bg-blue-50 dark:bg-blue-500/10 text-[#1e3a8a] dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                        >
                          {t.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node Style */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Node Style</label>
                  <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                    {['pill', 'box', 'underline'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setNodeStyle(style)}
                        className={clsx(
                          "flex-1 py-1 text-[11px] font-bold capitalize rounded-md transition-colors",
                          nodeStyle === style ? "bg-white dark:bg-[#333] text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Style */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Line Style</label>
                  <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                    {['curved', 'straight', 'orthogonal'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setLineStyle(style)}
                        className={clsx(
                          "flex-1 py-1 text-[11px] font-bold capitalize rounded-md transition-colors",
                          lineStyle === style ? "bg-white dark:bg-[#333] text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                {[
                  { label: 'H-Spacing', value: hSpacing, min: 100, max: 400, setter: setHSpacing },
                  { label: 'V-Spacing', value: vSpacing, min: 30, max: 150, setter: setVSpacing },
                ].map(s => (
                  <div key={s.label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">{s.label}</label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{s.value}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.setter(Number(e.target.value))} className="w-full h-[2px] appearance-none cursor-pointer bg-[#cbd5e1] dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1e293b] dark:[&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" />Live Preview</h3>
              <button onClick={handleDownloadPNG} className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25" style={{backgroundColor:persona?.theme?.primary || '#6366f1','--color-primary':persona?.theme?.primary || '#6366f1'}}>
                <Download size={14} /><span>Save Image</span>
              </button>
            </div>
            
            <div 
              className={clsx(
                "flex-1 w-full relative overflow-hidden transition-colors duration-300",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{ backgroundColor: THEMES[activeTheme].bg }}
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                   className="relative flex items-center justify-center transition-transform origin-center will-change-transform"
                   style={{
                     transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                     transitionDuration: isDragging ? '0ms' : '200ms'
                   }}
                >
                   {/* Background Pattern Layer */}
                   <div className="absolute inset-[-4000px] pointer-events-none opacity-50" style={{
                      backgroundImage: `radial-gradient(${THEMES[activeTheme].name === 'Dark Mode' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} 1px, transparent 0)`,
                      backgroundSize: `24px 24px`,
                      backgroundPosition: 'center center'
                   }} />
                   
                   {/* SVG Content */}
                   {treeData ? (
                     <div dangerouslySetInnerHTML={{__html:getSvgContent()}} style={{ display: 'flex', zIndex: 10, pointerEvents: 'none' }} />
                   ) : (
                     <div className="text-slate-400 text-sm z-10 px-6 py-4 bg-white/10 backdrop-blur-md rounded-xl border border-slate-200/20">Type in the left panel to generate a map.</div>
                   )}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-white/20 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-lg border border-slate-200/50 dark:border-white/10 shadow-lg z-20">
                <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="p-2 text-slate-700 dark:text-slate-300 hover:text-[var(--color-brand-magenta)] hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors shadow-sm bg-white/30 dark:bg-black/30"><ZoomIn size={16} /></button>
                <button onClick={resetView} className="p-2 text-slate-700 dark:text-slate-300 hover:text-[var(--color-brand-magenta)] hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors shadow-sm bg-white/30 dark:bg-black/30"><Maximize size={16} /></button>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-2 text-slate-700 dark:text-slate-300 hover:text-[var(--color-brand-magenta)] hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors shadow-sm bg-white/30 dark:bg-black/30"><ZoomOut size={16} /></button>
              </div>
            </div>

            <div className="h-auto py-3 px-4 sm:px-6 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 truncate mr-4">
                <Code size={16} className="shrink-0" />
                <span className="text-xs font-mono truncate">&lt;svg xmlns="http://www.w3.org/2000/svg"&gt;...&lt;/svg&gt;</span>
              </div>
              <button onClick={handleCopySVG} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] transition-colors shrink-0">
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy SVG'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide default pattern-grid since we use infinite grid now */
      `}} />
    </div>
  );
};

export default MindMapApp;
