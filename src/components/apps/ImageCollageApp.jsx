import { useState, useEffect, useRef } from 'react';
import { Download, Image as ImageIcon, Trash2, Sliders, Layout, RotateCcw, X, CloudUpload, Palette, Plus, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

function drawRoundedImage(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

function drawRoundedImageCover(ctx, img, x, y, w, h, r, panX = 0, panY = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();

  const ratio = Math.max(w / img.width, h / img.height);
  const sW = w / ratio;
  const sH = h / ratio;
  const baseSX = (img.width - sW) / 2;
  const baseSY = (img.height - sH) / 2;

  const maxPanX = Math.max(0, baseSX);
  const maxPanY = Math.max(0, baseSY);

  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  const sX = baseSX - clampedPanX;
  const sY = baseSY - clampedPanY;

  ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
  ctx.restore();
}

const LocalSlider = ({ value, min, max, onChangeEnd, persona, label, unit = '' }) => {
  const [localVal, setLocalVal] = useState(value);
  
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span className="text-slate-500">{localVal}{unit}</span>
      </div>
      <input
        type="range" 
        min={min} 
        max={max} 
        value={localVal} 
        onChange={e => setLocalVal(parseInt(e.target.value))}
        onMouseUp={() => onChangeEnd(localVal)}
        onTouchEnd={() => onChangeEnd(localVal)}
        className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
        style={{ "--slider-thumb-color": persona.theme.primary }}
      />
    </div>
  );
};

export default function ImageCollageApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState('Row'); // 'Row', 'Column', 'Grid'
  const [gap, setGap] = useState(20);
  const [radius, setRadius] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [heroLayout, setHeroLayout] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [palette, setPalette] = useState(['#ffffff', '#000000', '#f1f5f9', '#334155']);
  const [hexInput, setHexInput] = useState('ffffff');
  const [showPicker, setShowPicker] = useState(false);

  // Interactivity
  const [draggingImgId, setDraggingImgId] = useState(null);
  const dragStartPos = useRef(null);
  const hitboxesRef = useRef([]);
  const pickerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setHexInput(bgColor.replace('#', ''));
  }, [bgColor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);


  useEffect(() => {
    if (images.length === 0) {
      setPalette(['#ffffff', '#000000', '#f1f5f9', '#334155']);
      return;
    }
    const img = images[0].img;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    const data = ctx.getImageData(0, 0, 100, 100).data;
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 16) {
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      if (data[i + 3] < 128) continue;
      const key = `${r},${g},${b}`;
      if (!colorMap.has(key)) colorMap.set(key, { r, g, b, count: 1 });
      else colorMap.get(key).count++;
    }
    const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => { const hex = x.toString(16); return hex.length === 1 ? '0' + hex : hex; }).join('');
    const newPalette = ['#ffffff', '#000000'];
    for (const c of sorted) {
      if (newPalette.length >= 6) break;
      const hex = rgbToHex(c.r, c.g, c.b);
      if (!newPalette.includes(hex)) newPalette.push(hex);
    }
    setPalette(newPalette);
  }, [images]);

  // Helper to load image
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        newImages.push({
          id: Math.random().toString(36).substring(7),
          file,
          url,
          img,
          panX: 0,
          panY: 0
        });
      } catch (err) {
        console.error("Failed to load image", err);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    if (e.target) e.target.value = null; // reset
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleReset = () => {
    setImages([]);
    setLayout('Row');
    setGap(20);
    setRadius(10);
    setBgColor('#ffffff');
    setHeroLayout(false);
  };

  const handleCanvasMouseDown = (e) => {
    if (layout !== 'Grid') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = hitboxesRef.current.length - 1; i >= 0; i--) {
      const box = hitboxesRef.current[i];
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        setDraggingImgId(box.id);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        break;
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingImgId || layout !== 'Grid') return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const internalDx = dx * scaleX;
    const internalDy = dy * scaleY;

    const box = hitboxesRef.current.find(b => b.id === draggingImgId);
    if (!box) return;

    // imagePixel = canvasPixel / ratio
    const imgDx = internalDx / box.ratio;
    const imgDy = internalDy / box.ratio;

    setImages(prev => prev.map(img => {
      if (img.id === draggingImgId) {
        return {
          ...img,
          panX: (img.panX || 0) + imgDx,
          panY: (img.panY || 0) + imgDy
        };
      }
      return img;
    }));
  };

  const handleCanvasMouseUp = () => {
    setDraggingImgId(null);
  };

  const renderCollage = () => {
    if (!canvasRef.current || images.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');

    // Make resolution very high for sharp exports
    const scaleFactor = 2;
    const p = gap * scaleFactor;
    const r = radius * scaleFactor;

    hitboxesRef.current = [];

    if (layout === 'Row') {
      const minHeight = Math.min(...images.map(i => i.img.height));
      const targetH = Math.max(800, minHeight);
      let totalW = p;
      const scaledImages = images.map(i => {
        const scale = targetH / i.img.height;
        const w = i.img.width * scale;
        const x = totalW;
        totalW += w + p;
        return { ...i, w, h: targetH, x, y: p };
      });
      canvasRef.current.width = totalW;
      canvasRef.current.height = targetH + p * 2;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      scaledImages.forEach(imgData => {
        drawRoundedImage(ctx, imgData.img, imgData.x, imgData.y, imgData.w, imgData.h, r);
      });

    } else if (layout === 'Column') {
      const minWidth = Math.min(...images.map(i => i.img.width));
      const targetW = Math.max(800, minWidth);
      let totalH = p;
      const scaledImages = images.map(i => {
        const scale = targetW / i.img.width;
        const h = i.img.height * scale;
        const y = totalH;
        totalH += h + p;
        return { ...i, w: targetW, h, x: p, y };
      });
      canvasRef.current.width = targetW + p * 2;
      canvasRef.current.height = totalH;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      scaledImages.forEach(imgData => {
        drawRoundedImage(ctx, imgData.img, imgData.x, imgData.y, imgData.w, imgData.h, r);
      });

    } else if (layout === 'Grid') {
      const n = images.length;
      const cellSize = 800;

      const drawGridImage = (idx, x, y, w, h, r) => {
        const imgData = images[idx];
        drawRoundedImageCover(ctx, imgData.img, x, y, w, h, r, imgData.panX || 0, imgData.panY || 0);
        hitboxesRef.current.push({
          id: imgData.id,
          x, y, w, h,
          ratio: Math.max(w / imgData.img.width, h / imgData.img.height)
        });
      };

      if (heroLayout && n >= 3) {
        if (n === 3) {
          canvasRef.current.width = 2 * cellSize + 3 * p;
          canvasRef.current.height = 2 * cellSize + 3 * p;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          drawGridImage(0, p, p, cellSize, 2 * cellSize + p, r);
          drawGridImage(1, p + cellSize + p, p, cellSize, cellSize, r);
          drawGridImage(2, p + cellSize + p, p + cellSize + p, cellSize, cellSize, r);
        } else if (n === 4) {
          canvasRef.current.width = 3 * cellSize + 4 * p;
          canvasRef.current.height = 2 * cellSize + 3 * p;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          drawGridImage(0, p, p, 2 * cellSize + p, 2 * cellSize + p, r);
          drawGridImage(1, p + 2 * cellSize + 2 * p, p, cellSize, Math.floor((2 * cellSize - p) / 3), r);
          drawGridImage(2, p + 2 * cellSize + 2 * p, p + Math.floor((2 * cellSize - p) / 3) + p, cellSize, Math.floor((2 * cellSize - p) / 3), r);
          drawGridImage(3, p + 2 * cellSize + 2 * p, p + 2 * Math.floor((2 * cellSize - p) / 3) + 2 * p, cellSize, Math.floor((2 * cellSize - p) / 3), r);
        } else {
          let cols = Math.ceil(Math.sqrt(n + 3));
          if (cols < 3) cols = 3;
          let rows = Math.ceil((n + 3) / cols);

          canvasRef.current.width = cols * cellSize + (cols + 1) * p;
          canvasRef.current.height = rows * cellSize + (rows + 1) * p;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          const gridMap = Array(rows).fill(null).map(() => Array(cols).fill(false));
          gridMap[0][0] = true; gridMap[0][1] = true;
          gridMap[1][0] = true; gridMap[1][1] = true;

          drawGridImage(0, p, p, 2 * cellSize + p, 2 * cellSize + p, r);

          let imgIdx = 1;
          for (let row = 0; row < rows && imgIdx < n; row++) {
            for (let col = 0; col < cols && imgIdx < n; col++) {
              if (!gridMap[row][col]) {
                gridMap[row][col] = true;
                const x = p + col * (cellSize + p);
                const y = p + row * (cellSize + p);
                drawGridImage(imgIdx, x, y, cellSize, cellSize, r);
                imgIdx++;
              }
            }
          }
        }
      } else {
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);

        canvasRef.current.width = cols * cellSize + (cols + 1) * p;
        canvasRef.current.height = rows * cellSize + (rows + 1) * p;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        images.forEach((imgData, idx) => {
          const rowIdx = Math.floor(idx / cols);
          const colIdx = idx % cols;
          const x = p + colIdx * (cellSize + p);
          const y = p + rowIdx * (cellSize + p);
          drawGridImage(idx, x, y, cellSize, cellSize, r);
        });
      }
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      renderCollage();
    }
  }, [images, layout, gap, radius, bgColor, heroLayout]);

  const handleDownload = () => {
    if (!canvasRef.current || images.length === 0) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `echo_collage_${new Date().getTime()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const layouts = ['Row', 'Column', 'Grid'];

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30"></div>

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
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">

          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">

            {/* Card 1: Source Image */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ImageIcon size={16} className="text-slate-500" />
                  Source Images
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors cursor-pointer",
                    isDragging ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                  )}
                  style={{ '--color-primary': persona.theme.primary }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                  <CloudUpload className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  <span className="text-xs font-bold text-slate-500">
                    {isDragging ? 'Drop it here!' : 'Upload Images'}
                  </span>
                </label>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <style>{`
                      @keyframes scaleInPop {
                        0% { opacity: 0; transform: scale(0.6); }
                        70% { transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                      }
                    `}</style>
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className="relative w-12 h-12 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden group"
                        style={{ animation: `scaleInPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${idx * 0.05}s both` }}
                      >
                        <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-400 hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)] transition-colors"
                      style={{ "--color-brand-primary": persona.theme.primary }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Sliders size={16} className="text-slate-500" />
                  Settings
                </h3>
              </div>

              <div className="p-4 flex flex-col gap-5">
                {/* Layout Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wider">Layout Format</label>
                  <SegmentedControl
                    value={layout}
                    onChange={setLayout}
                    options={layouts.map(opt => ({ value: opt, label: opt }))}
                  />
                  {/*
                    <div
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out"
                      style={{
                        width: `calc((100% - 8px) / ${layouts.length})`,
                        transform: `translateX(calc(${layouts.indexOf(layout)} * 100%))`
                      }}
                    />
                    {layouts.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setLayout(opt)}
                        className={clsx(
                          "flex-1 relative z-10 flex items-center justify-center py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50",
                          layout === opt ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  */}
                  {layout === 'Grid' && images.length >= 3 && (
                    <div className="flex items-center justify-between mt-3 px-1">
                      <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => setHeroLayout(!heroLayout)}>
                        Featured Image Layout
                      </label>
                      <button
                        type="button"
                        onClick={() => setHeroLayout(!heroLayout)}
                        className={clsx(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none p-[2px]",
                          heroLayout ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                        )}
                        style={{ "--color-primary": persona.theme.primary }}
                      >
                        <span className="sr-only">Use Featured Layout</span>
                        <span
                          aria-hidden="true"
                          className={clsx(
                            "pointer-events-none inline-block h-3 w-3 transform rounded-full transition duration-300 ease-in-out",
                            heroLayout ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <LocalSlider
                  label="Gap Spacing"
                  unit="px"
                  value={gap}
                  min={0}
                  max={100}
                  onChangeEnd={setGap}
                  persona={persona}
                />

                <LocalSlider
                  label="Corner Radius"
                  unit="px"
                  value={radius}
                  min={0}
                  max={100}
                  onChangeEnd={setRadius}
                  persona={persona}
                />
              </div>
            </div>

            {/* Card 3: Background Color */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Palette size={16} className="text-slate-500" />
                  Background Color
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex gap-2 items-center flex-wrap">
                  {palette.map(c => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={clsx("w-8 h-8 rounded-full  border-2 transition-transform hover:scale-110 flex items-center justify-center overflow-hidden")}
                      style={{ backgroundColor: c, borderColor: bgColor.toLowerCase() === c.toLowerCase() ? persona.theme.primary : 'transparent' }}
                      title={c}
                    >
                      <div className="w-full h-full rounded-full border border-black/5 dark:border-white/10"></div>
                    </button>
                  ))}
                </div>

                {/* Hex Input Field */}
                <div className="flex items-center gap-3 w-full mt-1 relative">
                  <div className="relative" ref={pickerRef}>
                    <button
                      onClick={() => setShowPicker(!showPicker)}
                      className="w-9 h-9 rounded-lg  border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-transform focus:outline-none focus:ring-2"
                      style={{ backgroundColor: bgColor, "--tw-ring-color": persona.theme.primary }}
                    />

                    {/* Modern Color Picker Popover */}
                    {showPicker && (
                      <div className="absolute bottom-11 left-0 z-50 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10  animate-[scaleInPop_0.2s_ease-out_forwards] origin-bottom-left">
                        <HexColorPicker
                          color={bgColor}
                          onChange={c => { setBgColor(c); setHexInput(c.replace('#', '')); }}
                        />
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1 flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:border-transparent"
                    style={{ "--tw-ring-color": `color-mix(in srgb, ${persona.theme.primary} 40%, transparent)` }}
                  >
                    <span className="pl-3 pr-1 text-slate-400 font-bold">#</span>
                    <input
                      type="text"
                      value={hexInput}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                        setHexInput(val);
                        if (val.length === 6 || val.length === 3) {
                          setBgColor(`#${val}`);
                        }
                      }}
                      onBlur={() => setHexInput(bgColor.replace('#', ''))}
                      className="w-full bg-transparent py-2 text-sm font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase"
                      placeholder="FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Workspace / Output */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Layout size={16} style={{ color: persona.theme.primary }} />
                  Preview Workspace
                </h3>
                {images.length > 0 && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    DOWNLOAD
                  </button>
                )}
              </div>

              <div className={clsx(
                "flex-1 p-4 flex items-center justify-center min-h-0 overflow-hidden relative",
                images.length > 0 && "checkerboard-bg"
              )}>
                {images.length > 0 ? (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className={clsx(
                      "max-w-full max-h-full object-contain relative z-10 drop- rounded-md",
                      layout === 'Grid' ? (draggingImgId ? 'cursor-grabbing' : 'cursor-grab') : ''
                    )}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 relative z-10">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">Add photos to start making a collage.</span>
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
