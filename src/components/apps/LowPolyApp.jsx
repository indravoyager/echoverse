import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Leaf, Download, Copy, Check, RotateCcw, Settings2, Code, Layers, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import clsx from 'clsx';
import persona from '../../tools/lowpoly.json';

// Delaunay triangulation (Bowyer-Watson)
function delaunay(points) {
  const st = [[-1e6, -1e6], [1e6, -1e6], [0, 1e6]];
  let tris = [[0, 1, 2]];
  const pts = [...st];
  for (let i = 0; i < points.length; i++) {
    pts.push(points[i]);
    const pi = pts.length - 1;
    const bad = [], edges = [];
    for (const t of tris) {
      if (inCircumcircle(pts[t[0]], pts[t[1]], pts[t[2]], pts[pi])) bad.push(t);
    }
    for (const t of bad) {
      for (let j = 0; j < 3; j++) {
        const e = [t[j], t[(j+1)%3]];
        let shared = false;
        for (const o of bad) {
          if (o === t) continue;
          if (o.includes(e[0]) && o.includes(e[1])) { shared = true; break; }
        }
        if (!shared) edges.push(e);
      }
    }
    tris = tris.filter(t => !bad.includes(t));
    for (const e of edges) tris.push([e[0], e[1], pi]);
  }
  return tris.filter(t => t[0] > 2 && t[1] > 2 && t[2] > 2).map(t => [t[0]-3, t[1]-3, t[2]-3]);
}

function inCircumcircle(a, b, c, p) {
  const ax=a[0]-p[0], ay=a[1]-p[1], bx=b[0]-p[0], by=b[1]-p[1], cx=c[0]-p[0], cy=c[1]-p[1];
  const det = ax*(by*((cx*cx)+(cy*cy))-cy*((bx*bx)+(by*by))) - ay*(bx*((cx*cx)+(cy*cy))-cx*((bx*bx)+(by*by))) + ((ax*ax)+(ay*ay))*(bx*cy-cx*by);
  return det > 0;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function lerpColor(c1,c2,t) {
  const a=hexToRgb(c1), b=hexToRgb(c2);
  return rgbToHex(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t);
}

import { useCopyToClipboard } from '../theme/useCopyToClipboard';

const LowPolyApp = ({ onOpenSidebar, onOpenPersonaInfo }) => {
  const [color, setColor] = useState('#38bdf8');
  const [secondaryColor, setSecondaryColor] = useState('#818cf8');
  const [gradientMode, setGradientMode] = useState(true);
  const [bgColor, setBgColor] = useState('#1e293b');
  const [bgMode, setBgMode] = useState(true);
  const [cellSize, setCellSize] = useState(187);
  const [variance, setVariance] = useState(50);
  const [contrast, setContrast] = useState(30);
  const [seed, setSeed] = useState(42);
  const { copied: isCopied, copy } = useCopyToClipboard();
  const [activePicker, setActivePicker] = useState(null);
  const [hexInput, setHexInput] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setActivePicker(null); };
    if (activePicker) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [activePicker]);

  const openPicker = (which) => {
    if (activePicker === which) { setActivePicker(null); return; }
    setHexInput((which === 'start' ? color : which === 'end' ? secondaryColor : bgColor).replace('#',''));
    setActivePicker(which);
  };
  const handlePickerChange = (nc) => {
    if (activePicker === 'start') setColor(nc);
    else if (activePicker === 'end') setSecondaryColor(nc);
    else if (activePicker === 'bg') setBgColor(nc);
    setHexInput(nc.replace('#',''));
  };
  const handleHexInputChange = (val) => {
    const c = val.replace(/[^0-9A-Fa-f]/g,'').slice(0,6);
    setHexInput(c);
    if (c.length === 6 || c.length === 3) {
      const hex = `#${c}`;
      if (activePicker === 'start') setColor(hex);
      else if (activePicker === 'end') setSecondaryColor(hex);
      else if (activePicker === 'bg') setBgColor(hex);
    }
  };

  const resetAll = () => {
    setColor('#38bdf8'); setSecondaryColor('#818cf8'); setGradientMode(true);
    setBgColor('#1e293b'); setBgMode(true); setCellSize(187); setVariance(50);
    setContrast(30); setSeed(42);
  };

  const randomizeGeometry = () => {
    const r = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
    setCellSize(r(40,150)); setVariance(r(20,80)); setContrast(r(10,60));
    setSeed(Math.floor(Math.random()*99999));
  };

  const randomizeColors = () => {
    const p = [
      ['#6366f1','#14b8a6','#0f172a'],['#f472b6','#fb923c','#1a1a2e'],
      ['#34d399','#3b82f6','#0f172a'],['#facc15','#f97316','#1e1b4b'],
      ['#a78bfa','#ec4899','#0c0a1d'],['#2dd4bf','#a78bfa','#162032'],
      ['#60a5fa','#c084fc','#0f1729'],['#fb7185','#fbbf24','#1c1917'],
      ['#4ade80','#22d3ee','#0a192f'],['#f9a8d4','#c4b5fd','#1a1333'],
      ['#38bdf8','#818cf8','#0b1120'],['#fca5a5','#fcd34d','#1e293b'],
      ['#86efac','#67e8f9','#132a3e'],['#c084fc','#22d3ee','#0f0e1a'],
      ['#fb923c','#a855f7','#18181b'],['#5eead4','#f0abfc','#0c1222'],
    ];
    const pal = p[Math.floor(Math.random()*p.length)];
    setColor(pal[0]); setSecondaryColor(pal[1]); setBgColor(pal[2]);
  };

  const rng = (s) => { let x = Math.sin(s)*10000; return x - Math.floor(x); };

  const getSvgContent = () => {
    const W=1920, H=1080;
    const cols = Math.ceil(W/cellSize)+2, rows = Math.ceil(H/cellSize)+2;
    const v = variance/100;
    const points = [];
    let si = seed;
    // Generate jittered grid
    for (let r=0; r<rows; r++) {
      for (let c=0; c<cols; c++) {
        let px = (c-1)*cellSize + rng(si++)*cellSize*v;
        let py = (r-1)*cellSize + rng(si++)*cellSize*v;
        points.push([px, py]);
      }
    }
    // Add border points
    for (let i=0; i<20; i++) { points.push([-50, i*H/19]); points.push([W+50, i*H/19]); }
    for (let i=0; i<30; i++) { points.push([i*W/29, -50]); points.push([i*W/29, H+50]); }

    const tris = delaunay(points);
    const cVar = contrast/100;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display: block;">\n`;
    if (bgMode) svg += `<rect width="${W}" height="${H}" fill="${bgColor}"/>\n`;

    for (let i=0; i<tris.length; i++) {
      const [a,b,c] = tris[i];
      const p0=points[a], p1=points[b], p2=points[c];
      const cx2 = (p0[0]+p1[0]+p2[0])/3;
      const cy2 = (p0[1]+p1[1]+p2[1])/3;
      // Position-based color
      const tx = cx2/W, ty = cy2/H;
      let baseColor;
      if (gradientMode) {
        const diag = (tx + ty) / 2;
        baseColor = lerpColor(color, secondaryColor, diag);
      } else {
        baseColor = color;
      }
      // Add per-triangle variation
      const noise = (rng(seed + i*7) - 0.5) * 2 * cVar;
      const rgb = hexToRgb(baseColor);
      const shade = rgbToHex(rgb[0]+noise*80, rgb[1]+noise*80, rgb[2]+noise*80);

      svg += `<polygon points="${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="${shade}" stroke="${shade}" stroke-width="1.5" stroke-linejoin="round"/>\n`;
    }
    svg += `</svg>`;
    return svg;
  };

  const handleCopySVG = () => copy(getSvgContent());
  const handleDownloadPNG = () => {
    const s = getSvgContent(), canvas = document.createElement('canvas');
    canvas.width=1920; canvas.height=1080;
    const ctx = canvas.getContext('2d'), img = new Image();
    const blob = new Blob([s],{type:'image/svg+xml;charset=utf-8'}), url = URL.createObjectURL(blob);
    img.onload = () => { ctx.fillStyle='#fff'; ctx.fillRect(0,0,1920,1080); ctx.drawImage(img,0,0); const a=document.createElement('a'); a.download=`LowPoly-${Date.now()}.png`; a.href=canvas.toDataURL('image/png'); a.click(); URL.revokeObjectURL(url); };
    img.src = url;
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      {/* Header — identical to WaveGenerator */}
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
                    <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">Gradient Mode</span>
                    <button onClick={() => setGradientMode(!gradientMode)} className={clsx("w-[34px] h-[20px] rounded-full relative transition-colors duration-200 focus:outline-none border-2", gradientMode ? "bg-[#1e293b] border-[#1e293b] dark:bg-white dark:border-white" : "bg-transparent border-[#94a3b8] dark:border-slate-500")}>
                      <div className={clsx("w-[12px] h-[12px] rounded-full absolute top-[2px] transition-transform duration-200", gradientMode ? "bg-white dark:bg-[#1e293b] translate-x-[16px]" : "bg-[#94a3b8] dark:bg-slate-500 translate-x-[2px]")} />
                    </button>
                  </div>
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
                      <button onClick={() => openPicker('start')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='start' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:color}} title={gradientMode?'Start Color':'Poly Color'} />
                      {gradientMode && <button onClick={() => openPicker('end')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='end' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:secondaryColor}} title="End Color" />}
                      {bgMode && <button onClick={() => openPicker('bg')} className={clsx("w-8 h-8 rounded-lg border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform", activePicker==='bg' ? 'border-[#1e293b] dark:border-white scale-110' : 'border-slate-200 dark:border-white/10')} style={{backgroundColor:bgColor}} title="Background Color" /> }
                    </div>
                  </div>
                  {activePicker && (
                    <div ref={pickerRef} className="absolute top-full mt-2 left-0 right-0 z-50 flex flex-col gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl animate-[scaleInPop_0.2s_ease-out_forwards]">
                      <style>{`@keyframes scaleInPop{0%{opacity:0;transform:scale(0.9) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}.lp-picker .react-colorful{width:100%!important;height:150px!important;border-radius:8px!important}.lp-picker .react-colorful__saturation{border-radius:8px 8px 0 0!important}.lp-picker .react-colorful__hue{height:12px!important;border-radius:0 0 8px 8px!important}.lp-picker .react-colorful__pointer{width:18px!important;height:18px!important;border-width:2px!important}`}</style>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{activePicker==='start'?(gradientMode?'Start Color':'Poly Color'):activePicker==='end'?'End Color':'Background'}</span>
                        <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden w-24">
                          <span className="pl-2 text-slate-400 font-bold text-xs">#</span>
                          <input type="text" value={hexInput} onChange={e=>handleHexInputChange(e.target.value)} onBlur={()=>{const cur=activePicker==='start'?color:activePicker==='end'?secondaryColor:bgColor;setHexInput(cur.replace('#',''));}} className="w-full bg-transparent py-1.5 px-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase" placeholder="FFFFFF" />
                        </div>
                      </div>
                      <div className="lp-picker"><HexColorPicker color={activePicker==='start'?color:activePicker==='end'?secondaryColor:bgColor} onChange={handlePickerChange} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Geometry */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300"><Settings2 className="w-4 h-4 text-slate-400" />Geometry</h3>
                <button onClick={randomizeGeometry} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded"><RotateCcw size={12} /> Random</button>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {[
                  { label:'Cell Size', value:cellSize, min:20, max:250, setter:setCellSize },
                  { label:'Variance', value:variance, min:0, max:100, setter:setVariance },
                  { label:'Contrast', value:contrast, min:0, max:100, setter:setContrast },
                ].map(s=>(
                  <div key={s.label} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-widest">{s.label}</label>
                      <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{s.value}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} value={s.value} onChange={e=>s.setter(Number(e.target.value))} className="w-full h-[2px] appearance-none cursor-pointer bg-[#cbd5e1] dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1e293b] dark:[&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing" />
                  </div>
                ))}
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

export default LowPolyApp;
