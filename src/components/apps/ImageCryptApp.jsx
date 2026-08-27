import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, KeyRound, PlayCircle, Loader2, RotateCcw, ShieldAlert, ArrowLeft, Leaf, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

// PRNG Utilities
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  } 
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
}

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function getRect(index, cols, rows, w, h) {
  const c = index % cols;
  const r = Math.floor(index / cols);
  const x = Math.floor(c * w / cols);
  const y = Math.floor(r * h / rows);
  const bw = Math.floor((c + 1) * w / cols) - x;
  const bh = Math.floor((r + 1) * h / rows) - y;
  return { x, y, w: bw, h: bh };
}

export default function ImageCryptApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [encryptionMode, setEncryptionMode] = useState('jigsaw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef(null);

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
    if (e.dataTransfer?.files?.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files?.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setProcessedImage(null);
  };

  const handleProcess = (action) => {
    if (!selectedImage || !secretCode.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          
          const w = img.width;
          const h = img.height;
          
          // Seed the PRNG with the secret code
          const seedFn = xmur3(secretCode);
          const rand = mulberry32(seedFn());

          const useWave = encryptionMode === 'wave' || encryptionMode === 'hybrid';
          const useJigsaw = encryptionMode === 'jigsaw' || encryptionMode === 'hybrid';
          
          // 1. Generate Wave Parameters
          const numWaves = 15;
          const xWaves = [];
          const yWaves = [];
          if (useWave) {
            for(let i=0; i<numWaves; i++) {
              xWaves.push({ amp: (rand() * 0.3), freq: (rand() * 50 + 1) * Math.PI * 2, phase: rand() * Math.PI * 2 });
              yWaves.push({ amp: (rand() * 0.3), freq: (rand() * 50 + 1) * Math.PI * 2, phase: rand() * Math.PI * 2 });
            }
          }

          // 2. Generate Jigsaw Shuffle Parameters
          const cols = 20;
          const rows = 20;
          const numBlocks = cols * rows;
          const indices = Array.from({length: numBlocks}, (_, i) => i);
          if (useJigsaw) {
            // Fisher-Yates shuffle
            for (let i = indices.length - 1; i > 0; i--) {
              const j = Math.floor(rand() * (i + 1));
              [indices[i], indices[j]] = [indices[j], indices[i]];
            }
          }

          const getShiftX = (y) => {
            let shift = 0;
            for (const wave of xWaves) {
              shift += wave.amp * Math.sin( (y / h) * wave.freq + wave.phase );
            }
            return Math.round(shift * w);
          };

          const getShiftY = (x) => {
            let shift = 0;
            for (const wave of yWaves) {
              shift += wave.amp * Math.sin( (x / w) * wave.freq + wave.phase );
            }
            return Math.round(shift * h);
          };

          if (action === 'encrypt') {
            if (useWave) {
              // --- ENCRYPT STAGE 1: WAVE GLITCH ---
              const imageData = ctx.getImageData(0, 0, w, h);
              const srcBuf = new Uint32Array(imageData.data.buffer);
              const tempBuf = new Uint32Array(w * h);
              const finalBuf = new Uint32Array(w * h);

              // 1A. Y Shift
              for (let x = 0; x < w; x++) {
                const shift = getShiftY(x);
                for (let y = 0; y < h; y++) {
                  const destY = ((y + shift) % h + h) % h;
                  tempBuf[destY * w + x] = srcBuf[y * w + x];
                }
              }
              // 1B. X Shift
              for (let y = 0; y < h; y++) {
                const shift = getShiftX(y);
                for (let x = 0; x < w; x++) {
                  const destX = ((x + shift) % w + w) % w;
                  finalBuf[y * w + destX] = tempBuf[y * w + x];
                }
              }
              srcBuf.set(finalBuf);
              ctx.putImageData(imageData, 0, 0);
            }

            if (useJigsaw) {
              // --- ENCRYPT STAGE 2: JIGSAW SHUFFLE ---
              const offscreen = document.createElement('canvas');
              offscreen.width = w; offscreen.height = h;
              const offCtx = offscreen.getContext('2d');
              offCtx.drawImage(canvas, 0, 0);

              ctx.clearRect(0, 0, w, h);
              for (let i = 0; i < numBlocks; i++) {
                const srcRect = getRect(i, cols, rows, w, h);
                const destRect = getRect(indices[i], cols, rows, w, h);
                ctx.drawImage(offscreen, srcRect.x, srcRect.y, srcRect.w, srcRect.h, destRect.x, destRect.y, destRect.w, destRect.h);
              }
            }

          } else {
            if (useJigsaw) {
              // --- DECRYPT STAGE 1: UNDO JIGSAW SHUFFLE ---
              const offscreen = document.createElement('canvas');
              offscreen.width = w; offscreen.height = h;
              const offCtx = offscreen.getContext('2d');
              offCtx.drawImage(canvas, 0, 0);

              ctx.clearRect(0, 0, w, h);
              for (let i = 0; i < numBlocks; i++) {
                const srcRect = getRect(indices[i], cols, rows, w, h);
                const destRect = getRect(i, cols, rows, w, h);
                ctx.drawImage(offscreen, srcRect.x, srcRect.y, srcRect.w, srcRect.h, destRect.x, destRect.y, destRect.w, destRect.h);
              }
            }

            if (useWave) {
              // --- DECRYPT STAGE 2: UNDO WAVE GLITCH ---
              const imageData = ctx.getImageData(0, 0, w, h);
              const srcBuf = new Uint32Array(imageData.data.buffer);
              const tempBuf = new Uint32Array(w * h);
              const finalBuf = new Uint32Array(w * h);

              // Undo 1B. X Shift
              for (let y = 0; y < h; y++) {
                const shift = getShiftX(y);
                for (let x = 0; x < w; x++) {
                  const srcX = ((x + shift) % w + w) % w;
                  tempBuf[y * w + x] = srcBuf[y * w + srcX];
                }
              }
              // Undo 1A. Y Shift
              for (let x = 0; x < w; x++) {
                const shift = getShiftY(x);
                for (let y = 0; y < h; y++) {
                  const srcY = ((y + shift) % h + h) % h;
                  finalBuf[y * w + x] = tempBuf[srcY * w + x];
                }
              }
              srcBuf.set(finalBuf);
              ctx.putImageData(imageData, 0, 0);
            }
          }
          
          // Export as PNG natively, but it is now robust to JPG conversion outside the app!
          setProcessedImage(canvas.toDataURL('image/png'));
          setIsProcessing(false);
        };
        img.src = selectedImage;
      } catch (err) {
        console.error(err);
        alert("Failed to process image.");
        setIsProcessing(false);
      }
    }, 50);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `crypted_${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    setProcessedImage(null);
    setSecretCode('');
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30"></div>
      
      {/* Tool Header */}
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
          disabled={isProcessing || (!selectedImage && !secretCode)}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Reset"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">
          
          {/* Controls Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            
            {/* Input Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ShieldAlert className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Source Image
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors",
                      isProcessing ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10' :
                      isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 cursor-pointer' : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" disabled={isProcessing} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Drop image here!' : selectedImage ? 'Change Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Only image files are supported.</p>
              </div>
            </div>

            {/* Crypto Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Secret Configuration
                </h3>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Encryption Mode</label>
                  <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-lg mb-4">
                    {[
                      { id: 'jigsaw', label: 'Jigsaw Grid' },
                      { id: 'wave', label: 'Wave Glitch' },
                      { id: 'hybrid', label: 'Hybrid' },
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setEncryptionMode(mode.id)}
                        className={clsx(
                          "flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                          encryptionMode === mode.id ? "bg-white dark:bg-[#333] text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Secret Code</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                      style={{ '--color-primary': persona.theme.primary }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    This password is used to scramble the pixels. You <b>MUST</b> use the exact same password to restore the image later.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleProcess('encrypt')}
                    disabled={!selectedImage || !secretCode.trim() || isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-white font-bold text-[10px] rounded-lg transition-all disabled:opacity-50 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed uppercase tracking-widest"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <ShieldAlert size={13} className="shrink-0" />}
                    <span>Encrypt</span>
                  </button>
                  <button
                    onClick={() => handleProcess('decrypt')}
                    disabled={!selectedImage || !secretCode.trim() || isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
                      color: persona.theme.primary
                    }}
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <RotateCcw size={13} className="shrink-0" />}
                    <span>Decrypt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notice Panel */}
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 p-4">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Security Protocol Info
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
                {encryptionMode === 'jigsaw' 
                  ? <>The image is encrypted by shuffling it into a <b>20x20 Jigsaw Grid</b>. This method guarantees that there are no "ghosting" traces left behind, even when the image is heavily compressed and sent via WhatsApp!</>
                  : encryptionMode === 'wave'
                  ? <>The image is distorted using <b>Wave Glitch</b>. ⚠️ WARNING: If you send this via WhatsApp or compress it, it may leave faint ghostly traces when decrypted due to lossy compression. Send as document to prevent this!</>
                  : <>The image is encrypted using a <b>Hybrid</b> combination of Wave Glitch and Jigsaw Grid. ⚠️ WARNING: WhatsApp compression may leave faint wave traces. Best shared as a document or uncompressed image.</>
                }
              </p>
            </div>
            
          </div>

          {/* Canvas Workspace */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden min-h-[400px]">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Preview
                </h3>
                {processedImage && (
                  <button 
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25"
                    style={{ backgroundColor: persona.theme.primary, '--color-primary': persona.theme.primary }}
                  >
                    <Download size={14} /><span>Download PNG</span>
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-4 flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHADxigwfjP8J+BKMA4VEA+yxg1gHwWjRoAS8aI1zNqAEsUAgAAsEAmf00B11EAAAAASUVORK5CYII=')] overflow-auto">
                {!selectedImage ? (
                  <div className="text-center opacity-50 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/10 flex items-center justify-center mb-4">
                      <ShieldAlert size={32} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No Image Selected</p>
                  </div>
                ) : (
                  <div className="relative max-w-full max-h-full">
                    {/* Checkered pattern background for transparent images */}
                    <img 
                      src={processedImage || selectedImage} 
                      alt="Preview" 
                      className="max-w-full max-h-[70vh] object-contain rounded shadow-xl border border-slate-200 dark:border-white/10"
                    />
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
