import { CustomSelect } from '../theme/CustomSelect';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Settings2, RotateCcw, Sparkles, Download, Check, ChevronDown, Code, Palette, Sliders, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { HexColorPicker } from 'react-colorful';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  dracula,
  oneDark,
  materialDark,
  atomDark,
  nord,
  oneLight,
  vs
} from 'react-syntax-highlighter/dist/esm/styles/prism';

const THEMES = {
  vscDarkPlus: { name: 'VS Code Dark', style: vscDarkPlus, isDark: true },
  dracula: { name: 'Dracula', style: dracula, isDark: true },
  oneDark: { name: 'One Dark', style: oneDark, isDark: true },
  materialDark: { name: 'Material', style: materialDark, isDark: true },
  atomDark: { name: 'Atom Dark', style: atomDark, isDark: true },
  nord: { name: 'Nord', style: nord, isDark: true },
  oneLight: { name: 'One Light', style: oneLight, isDark: false },
  vs: { name: 'VS Code Light', style: vs, isDark: false }
};

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'jsx',
  'tsx',
  'rust',
  'go',
  'sql',
  'java',
  'json'
];

const EXTENSION_MAP = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  css: 'css',
  jsx: 'jsx',
  tsx: 'tsx',
  rust: 'rs',
  go: 'go',
  sql: 'sql',
  java: 'java',
  json: 'json'
};

const GRADIENTS = [
  { name: 'Hyper', value: 'linear-gradient(to right, #ec4899, #ef4444, #eab308)' },
  { name: 'Ocean', value: 'linear-gradient(to right, #0ea5e9, #10b981)' },
  { name: 'Purple', value: 'linear-gradient(to right, #a855f7, #ec4899)' },
  { name: 'Night', value: 'linear-gradient(to right, #1e293b, #0f172a)' },
  { name: 'Sunset', value: 'linear-gradient(to right, #f97316, #f59e0b)' },
  { name: 'Mint', value: 'linear-gradient(to right, #6ee7b7, #3b82f6)' },
  { name: 'Transparent', value: 'transparent' }
];

export default function CodeSnippetApp({ persona, isDarkMode, onOpenSidebar, onOpenPersonaInfo }) {
  const [code, setCode] = useState(`function sayHello(name) {\n  console.log(\`Hello, ${name}! Welcome to Echo ATURAI.\`);\n}\n\nsayHello("Developer");`);
  const [filename, setFilename] = useState('Untitled.js');
  const [language, setLanguage] = useState('javascript');
  const [themeKey, setThemeKey] = useState('vscDarkPlus');
  const [padding, setPadding] = useState(16);
  const [borderRadius, setBorderRadius] = useState(16);
  const [showShadow, setShowShadow] = useState(true);
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');

  const previewRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  useEffect(() => {
    const ext = EXTENSION_MAP[language] || language;
    setFilename(prev => {
      const lastDotIdx = prev.lastIndexOf('.');
      if (lastDotIdx === -1) {
        return `${prev}.${ext}`;
      } else {
        const base = prev.slice(0, lastDotIdx);
        return `${base}.${ext}`;
      }
    });
  }, [language]);

  const handleReset = () => {
    setCode(`function sayHello(name) {\n  console.log(\`Hello, ${name}! Welcome to Echo ATURAI.\`);\n}\n\nsayHello("Developer");`);
    setFilename('Untitled.js');
    setLanguage('javascript');
    setThemeKey('vscDarkPlus');
    setPadding(16);
    setBorderRadius(16);
    setShowShadow(true);
    setGradient(GRADIENTS[0].value);
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    try {
      setIsExporting(true);

      // Wait for React to swap <input> to <span> for filename
      await new Promise(r => setTimeout(r, 100));

      const el = previewRef.current;

      // Hide the textarea so only SyntaxHighlighter is captured
      const textarea = el.querySelector('textarea');
      if (textarea) textarea.style.display = 'none';

      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: false
      });

      // Restore textarea
      if (textarea) textarea.style.display = '';

      const link = document.createElement('a');
      link.download = `codesnippet_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background Overlay untuk efek Glassmorphism tembus Grid */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      {/* Header Utama */}
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

      {/* Main Layout Workspace Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">

            {/* Card 1: Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative z-20">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Code className="w-4 h-4 text-slate-500" />
                  Configuration
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {/* Language Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
                  <CustomSelect
                    value={language}
                    onChange={setLanguage}
                    options={LANGUAGES.map(lang => ({ value: lang, label: lang.toUpperCase(), icon: Code }))}
                    themeColor={persona.theme.primary}
                  />
                </div>

                {/* Theme Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Editor Theme</label>
                  <CustomSelect
                    value={themeKey}
                    onChange={setThemeKey}
                    options={Object.entries(THEMES).map(([k, v]) => ({ value: k, label: v.name, icon: Palette }))}
                    themeColor={persona.theme.primary}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Appearance */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative z-10">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Palette className="w-4 h-4 text-slate-500" />
                  Background Color
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {/* Background Gradient */}
                <div>
                  <div className="flex gap-2 items-center flex-wrap mb-4">
                    {GRADIENTS.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => setGradient(g.value)}
                        className={clsx(
                          "w-8 h-8 rounded-full border-2 p-[2px] flex items-center justify-center transition-transform hover:scale-110",
                          gradient === g.value ? "border-slate-800 dark:border-white scale-110" : "border-transparent"
                        )}
                        title={g.name}
                      >
                        <div
                          className="w-full h-full rounded-full "
                          style={{ background: g.value === 'transparent' ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px' : g.value }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Hex Input Field */}
                  <div className="flex items-center gap-3 w-full relative">
                    <div className="relative" ref={pickerRef}>
                      <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="w-9 h-9 rounded-lg  border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-transform focus:outline-none focus:ring-2"
                        style={{
                          background: gradient.startsWith('#') ? gradient : '#ffffff',
                          "--tw-ring-color": persona.theme.primary
                        }}
                      />

                      {/* Modern Color Picker Popover */}
                      {showPicker && (
                        <div className="absolute top-11 left-0 z-50 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10  animate-[scaleInPop_0.2s_ease-out_forwards] origin-top-left">
                          <HexColorPicker
                            color={gradient.startsWith('#') ? gradient : '#ffffff'}
                            onChange={c => { setGradient(c); setHexInput(c.replace('#', '')); }}
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
                        value={gradient.startsWith('#') ? gradient.replace('#', '') : hexInput}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                          setHexInput(val);
                          if (val.length === 6 || val.length === 3) {
                            setGradient(`#${val}`);
                          }
                        }}
                        onBlur={() => {
                          if (gradient.startsWith('#')) setHexInput(gradient.replace('#', ''));
                        }}
                        className="w-full bg-transparent py-2 text-sm font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase"
                        placeholder="FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Layout & Effects */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative z-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  Layout Options
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-5">
                {/* Padding */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Padding</label>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{padding}px</span>
                  </div>
                  <input
                    type="range" min="8" max="128" step="4"
                    value={padding} onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    style={{ '--slider-thumb-color': persona.theme.primary }}
                  />
                </div>

                {/* Border Radius */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Corner Radius</label>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{borderRadius}px</span>
                  </div>
                  <input
                    type="range" min="0" max="32" step="4"
                    value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    style={{ '--slider-thumb-color': persona.theme.primary }}
                  />
                </div>

                {/* Shadow Toggle */}
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drop Shadow</label>
                  <button
                    onClick={() => setShowShadow(!showShadow)}
                    className={clsx(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none p-[2px]",
                      showShadow ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <span className="sr-only">Toggle Drop Shadow</span>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full transition duration-300 ease-in-out",
                        showShadow ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  Editor Workspace
                </h3>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isExporting ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> EXPORTING...</>
                  ) : exported ? (
                    <><Check size={14} /> SAVED!</>
                  ) : (
                    <><Download size={14} /> EXPORT PNG</>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-[#0f0f0f] flex items-center justify-center custom-scrollbar">

                {/* Canvas Container that will be exported */}
                <div
                  className="flex items-center justify-center overflow-visible transition-all w-full h-full"
                  style={{ padding: '32px' }}
                >
                  <div
                    ref={previewRef}
                    className="flex flex-col relative transition-all"
                    style={{
                      padding: `${padding}px`,
                      background: gradient.startsWith('#') ? gradient : (gradient === 'transparent' ? 'transparent' : gradient)
                    }}
                  >
                    <div
                      className="flex flex-col relative transition-all overflow-hidden"
                      style={{
                        borderRadius: `${borderRadius}px`,
                        boxShadow: showShadow ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
                        background: THEMES[themeKey].isDark ? '#1A1825' : '#ffffff',
                        minWidth: '500px', // Slightly larger min-width
                        maxWidth: '900px'
                      }}
                    >
                      {/* Mac OS Window Header */}
                      <div className="h-12 w-full flex items-center px-5 shrink-0 opacity-80">
                        {/* Traffic Lights */}
                        <div className="flex-1 flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                          <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                          <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                        </div>
                        
                        {/* Filename Input/Text */}
                        <div className="flex-1 flex justify-center items-center">
                          {isExporting ? (
                            <span className={clsx(
                              "font-sans text-[13px] font-medium m-0 p-0",
                              THEMES[themeKey].isDark ? "text-slate-400" : "text-slate-500"
                            )}>
                              {filename || "Untitled"}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={filename}
                              onChange={(e) => {
                                const newFilename = e.target.value;
                                setFilename(newFilename);
                                
                                const lastDotIdx = newFilename.lastIndexOf('.');
                                if (lastDotIdx !== -1) {
                                  const ext = newFilename.slice(lastDotIdx + 1).toLowerCase();
                                  // Find corresponding language from EXTENSION_MAP
                                  const matchedLang = Object.keys(EXTENSION_MAP).find(key => EXTENSION_MAP[key] === ext);
                                  // If matched and it's different from current language, update language
                                  if (matchedLang && matchedLang !== language) {
                                    setLanguage(matchedLang);
                                  }
                                }
                              }}
                              className={clsx(
                                "w-full text-center bg-transparent border-none outline-none font-sans text-[13px] font-medium transition-colors m-0 p-0",
                                THEMES[themeKey].isDark ? "text-slate-400 focus:text-slate-200" : "text-slate-500 focus:text-slate-700"
                              )}
                              placeholder="Untitled"
                              spellCheck={false}
                            />
                          )}
                        </div>

                        {/* Spacer to keep text centered */}
                        <div className="flex-1"></div>
                      </div>

                      {/* Code Editor Area */}
                      <div className="relative pb-5 flex-1">
                        <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="absolute inset-0 w-full h-full resize-none z-10 font-mono text-transparent bg-transparent focus:outline-none custom-scrollbar border-none m-0"
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: '15px',
                            lineHeight: '1.5',
                            caretColor: THEMES[themeKey].isDark ? 'white' : 'black',
                            padding: '1rem 1.25rem',
                            whiteSpace: 'pre',
                            tabSize: 2
                          }}
                          spellCheck={false}
                        />
                        <div className="pointer-events-none relative z-0" style={{ padding: '0', margin: '0' }}>
                          <SyntaxHighlighter
                            language={language}
                            style={THEMES[themeKey].style}
                            customStyle={{
                              margin: 0,
                              padding: '1rem 1.25rem',
                              background: 'transparent',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                              fontSize: '15px',
                              lineHeight: '1.5',
                              minHeight: '120px',
                              overflow: 'hidden',
                              border: 'none'
                            }}
                            codeTagProps={{
                              style: {
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                fontSize: '15px',
                                lineHeight: '1.5',
                              }
                            }}
                          >
                            {code || ' '}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
