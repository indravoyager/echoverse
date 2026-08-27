import { useState, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download, Link as LinkIcon, Settings2, Image as ImageIcon, QrCode, AlignLeft, RotateCcw, UploadCloud, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { SegmentedControl } from '../theme/SegmentedControl';
import clsx from 'clsx';

export default function QrApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [text, setText] = useState('https://echo.aturai.com');
  const [errorCorrection, setErrorCorrection] = useState(() => {
    try {
      return localStorage.getItem('qr_error_correction') || 'H';
    } catch {
      return 'H';
    }
  });
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  
  const hiddenCanvasContainerRef = useRef(null);
  const svgContainerRef = useRef(null);

  const handleSetErrorCorrection = (val) => {
    setErrorCorrection(val);
    try {
      localStorage.setItem('qr_error_correction', val);
    } catch (e) {
      console.warn('Failed to save qr_error_correction:', e);
    }
  };

  const handleDownloadPNG = () => {
    if (!hiddenCanvasContainerRef.current) return;
    const canvas = hiddenCanvasContainerRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'echo-qrcode.png';
      a.click();
    }
  };

  const handleDownloadSVG = () => {
    if (!svgContainerRef.current) return;
    const svg = svgContainerRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'echo-qrcode.svg';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      setIncludeLogo(true);
    }
  };

  const handleReset = () => {
    setText('https://echo.aturai.com');
    handleSetErrorCorrection('H');
    setIncludeLogo(false);
    setLogoUrl('');
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
        <button 
          onClick={handleReset} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{ 
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title="Reset Workspace"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            {/* Box 1: Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Settings
                </h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Error Correction */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    <AlignLeft className="w-3.5 h-3.5" /> Error Correction
                  </label>
                  <SegmentedControl
                    value={errorCorrection}
                    onChange={handleSetErrorCorrection}
                    options={[
                      { value: 'L', label: 'L' },
                      { value: 'M', label: 'M' },
                      { value: 'Q', label: 'Q' },
                      { value: 'H', label: 'H' }
                    ]}
                  />
                  <p className="text-[10px] text-slate-500 pl-1 mt-1.5">
                    {errorCorrection === 'L' && 'Low (7%) - Best for simple URLs.'}
                    {errorCorrection === 'M' && 'Medium (15%) - Standard quality.'}
                    {errorCorrection === 'Q' && 'Quartile (25%) - Good for logos.'}
                    {errorCorrection === 'H' && 'High (30%) - Best for adding a logo.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Box 2: Branding / Logo */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Custom Branding
                </h3>
              </div>
              
              <div className="p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                      <span className="text-xs font-bold text-slate-500">Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {logoUrl && (
                      <button 
                        onClick={() => { setLogoUrl(''); setIncludeLogo(false); }}
                        className="h-9 px-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Logo will be embedded in the center of the QR code.</p>
                </div>
              </div>
            </div>

          {/* Main Workspace Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Top Box: Input Data */}
            <div className="w-full bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  Data / URL
                </h3>
              </div>
              <div className="p-4">
                <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-[60px] p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/50 resize-none transition-all"
                style={{ '--color-primary': persona.theme.primary }}
                placeholder="Enter URL, text, or any data to encode..."
              />
              </div>
            </div>

            {/* Bottom Box: Preview */}
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden min-h-[400px]">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  Preview Workspace
                </h3>
                <div className="flex items-center gap-2 -mr-2.5">
                  <button 
                    onClick={handleDownloadSVG}
                    disabled={!text}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" /> SVG
                  </button>
                  <button 
                    onClick={handleDownloadPNG}
                    disabled={!text}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 flex items-center justify-center bg-slate-100/50 dark:bg-black/50 min-h-0 overflow-hidden relative checkerboard-bg">
                {text ? (
                  <div className="relative group flex items-center justify-center w-full h-full p-4">
                    {/* Invisible SVG purely for download */}
                    <div className="hidden" ref={svgContainerRef}>
                      <QRCodeSVG 
                        value={text} 
                        size={1024} 
                        level={errorCorrection}
                        marginSize={2}
                        fgColor="#000000"
                        bgColor="transparent"
                        imageSettings={includeLogo && logoUrl ? {
                          src: logoUrl,
                          height: 200,
                          width: 200,
                          excavate: true,
                        } : undefined}
                      />
                    </div>

                    {/* Invisible Canvas purely for high-res PNG download */}
                    <div className="hidden" ref={hiddenCanvasContainerRef}>
                      <QRCodeCanvas 
                        value={text} 
                        size={1024} 
                        level={errorCorrection}
                        marginSize={2}
                        fgColor="#000000"
                        bgColor="#ffffff"
                        imageSettings={includeLogo && logoUrl ? {
                          src: logoUrl,
                          height: 200,
                          width: 200,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                    
                    {/* Visible Canvas for Display */}
                    <div 
                      className=" border border-slate-200/50"
                    >
                      <QRCodeCanvas 
                        value={text} 
                        size={240} 
                        level={errorCorrection}
                        marginSize={2}
                        fgColor="#000000"
                        bgColor="#ffffff"
                        imageSettings={includeLogo && logoUrl ? {
                          src: logoUrl,
                          height: 56,
                          width: 56,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 opacity-50 gap-2">
                    <QrCode className="w-8 h-8" />
                    <span className="text-sm font-medium">Enter data to generate QR code.</span>
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
