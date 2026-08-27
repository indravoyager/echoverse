import { useState, useEffect } from 'react';
import { KeyRound, Copy, Check, SlidersHorizontal, RefreshCw, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

export default function PasswordGenApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const { copied, copy } = useCopyToClipboard();

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }
    
    setPassword(newPassword);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const handleCopy = () => copy(password);

  const calculateStrength = () => {
    let entropy = 0;
    let poolSize = 0;
    if (includeUppercase) poolSize += 26;
    if (includeLowercase) poolSize += 26;
    if (includeNumbers) poolSize += 10;
    if (includeSymbols) poolSize += 32;

    if (poolSize === 0 || length === 0) return { score: 0, label: 'Invalid', color: 'bg-slate-300' };

    entropy = length * Math.log2(poolSize);

    if (entropy < 40) return { score: 25, label: 'Weak', color: 'bg-red-500' };
    if (entropy < 60) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (entropy < 80) return { score: 75, label: 'Good', color: 'bg-emerald-400' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-600' };
  };

  const strength = calculateStrength();

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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Parameters
                </h3>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                {/* Length Slider */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Length</label>
                    <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10" style={{ color: persona.theme.primary }}>
                      {length}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="4" 
                    max="64" 
                    value={length} 
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="w-full h-[2px] appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600 outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--slider-thumb-color)] hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    style={{ '--slider-thumb-color': persona.theme.primary }}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>4</span>
                    <span>32</span>
                    <span>64</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>

                {/* Toggles */}
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Uppercase (A-Z)</span>
                    <input type="checkbox" className="hidden" checked={includeUppercase} onChange={() => setIncludeUppercase(!includeUppercase)} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        includeUppercase ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          includeUppercase ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Lowercase (a-z)</span>
                    <input type="checkbox" className="hidden" checked={includeLowercase} onChange={() => setIncludeLowercase(!includeLowercase)} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        includeLowercase ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          includeLowercase ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Numbers (0-9)</span>
                    <input type="checkbox" className="hidden" checked={includeNumbers} onChange={() => setIncludeNumbers(!includeNumbers)} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        includeNumbers ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          includeNumbers ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Symbols (!@#$)</span>
                    <input type="checkbox" className="hidden" checked={includeSymbols} onChange={() => setIncludeSymbols(!includeSymbols)} />
                    <div 
                      className={clsx(
                        "w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                        includeSymbols ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                      )} 
                      style={{ '--color-primary': persona.theme.primary }}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full transition-transform duration-300", 
                          includeSymbols ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                        )}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Box 2: Actions Panel */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Actions</h3>
              </div>
              <div className="p-4 flex flex-col">
                <div className="flex items-center gap-2">
                  <button
                    onClick={generatePassword}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all hover:opacity-90 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 active:scale-95"
                  >
                    <RefreshCw size={13} />
                    REGENERATE
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!password}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-white font-bold text-[10px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: copied ? '#10b981' : persona.theme.primary }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col min-h-[400px] shrink-0 overflow-hidden relative justify-center items-center p-8">
              
              {/* Decorative background logo */}
              <KeyRound className="absolute opacity-5 w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ color: persona.theme.primary }} />

              <div className="w-full max-w-2xl z-10 flex flex-col items-center gap-8">
                
                {/* Password Display */}
                <div className="w-full relative group">
                  <div 
                    className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center  break-all overflow-hidden relative flex flex-col items-center justify-center min-h-[120px] cursor-text"
                    style={{
                      boxShadow: `inset 0 2px 10px rgba(0,0,0,0.02)`
                    }}
                  >
                    {!password ? (
                      <span className="text-slate-400 font-medium text-lg">Select at least one character type</span>
                    ) : (
                      <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-slate-800 dark:text-white selection:bg-cyan-500/30 text-center">
                        {password}
                      </span>
                    )}
                  </div>
                </div>

                {/* Strength Indicator */}
                <div className="w-full flex flex-col gap-2 max-w-md">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Security Strength</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${
                      strength.label === 'Strong' ? 'text-emerald-600 dark:text-emerald-400' :
                      strength.label === 'Good' ? 'text-emerald-500 dark:text-emerald-300' :
                      strength.label === 'Fair' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-500 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons (Moved to Sidebar) */}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
