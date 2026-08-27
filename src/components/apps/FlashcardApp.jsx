import { useState, useRef, useEffect } from 'react';
import { FileText, UploadCloud, Download, Sparkles, Loader2, RefreshCw, ChevronLeft, ChevronRight, Layers, X, ChevronDown, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { generateFlashcardsFromDocument } from '../../lib/ai';
import { loadApiConfig } from '../../lib/db';

export default function FlashcardApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [apiProvider, setApiProvider] = useState(null);
  const [topic, setTopic] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [numCards, setNumCards] = useState(10);
  const [isNumCardsDropdownOpen, setIsNumCardsDropdownOpen] = useState(false);
  const numCardsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (numCardsDropdownRef.current && !numCardsDropdownRef.current.contains(event.target)) {
        setIsNumCardsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkApi = async () => {
      const config = await loadApiConfig();
      if (config && config.useCustom && config.provider !== 'gemini') {
        setApiProvider(config.provider);
      }
    };
    checkApi();
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cards, setCards] = useState([]);
  
  // Flashcard UI State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveFile({ name: file.name, type: file.name.split('.').pop() });
      setRawFile(file);
    }
  };

  const handleGenerate = async () => {
    if ((!topic && !rawFile) || isGenerating) return;
    
    setIsGenerating(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      let base64Data = null;
      let mimeType = null;
      
      // If a file is uploaded, read it as Data URL
      if (rawFile) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(rawFile);
        });
        
        mimeType = dataUrl.match(/data:(.*?);/)[1];
        base64Data = dataUrl.split(',')[1];
      }

      const generatedCards = await generateFlashcardsFromDocument(base64Data, mimeType, topic, numCards);
      
      if (generatedCards && generatedCards.length > 0) {
        setCards(generatedCards);
      } else {
        throw new Error("Format JSON Array tidak valid atau kosong.");
      }
    } catch (error) {
      console.error("Flashcard generation failed:", error);
      alert(`Failed to generate flashcards: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
    }, 150);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, 150);
  };

  const downloadCSV = () => {
    if (cards.length === 0) return;
    
    // Format for Anki (Question,Answer)
    let csvContent = "data:text/csv;charset=utf-8,";
    cards.forEach(card => {
      // Escape quotes and wrap in quotes to handle commas inside text
      const q = `"${card.question.replace(/"/g, '""')}"`;
      const a = `"${card.answer.replace(/"/g, '""')}"`;
      csvContent += `${q},${a}\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `flashcards_${topic || 'deck'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Background */}
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
              <span className="-translate-y-[1px]">Online</span>
            </div>
          </div>
        </div>
        <button 
            onClick={() => setCards([])} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
            style={{ 
              '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
              '--btn-hover-text': persona.theme.primary
            }}
          >
            <RefreshCw size={18} />
            <span className="hidden md:inline">New Deck</span>
          </button>
      </div>

      {/* Main Workspace */}
      {cards.length === 0 ? (
        <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
          <div className="flex flex-col h-full gap-4">
            {/* Top Bar Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 p-4 rounded-xl border bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 shrink-0 relative z-40">
              <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Subject / Topic (Optional)</label>
              <input type="text" placeholder="E.g. History of Rome..." value={topic} onChange={e => setTopic(e.target.value)} className="w-full h-7 px-3 py-0 text-[11px] rounded-lg border outline-none transition-colors bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]/50" style={{ '--color-primary': persona.theme.primary }} />
            </div>

            <div className="flex flex-row items-end gap-3 w-full lg:w-auto mt-1 lg:mt-0">
              <div className="flex-1 lg:w-[150px] lg:flex-none relative" ref={numCardsDropdownRef}>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Number of Cards</label>
                <div
                  onClick={() => setIsNumCardsDropdownOpen(!isNumCardsDropdownOpen)}
                  className="w-full h-7 px-3 py-0 text-[11px] rounded-lg border cursor-pointer flex justify-between items-center transition-colors bg-slate-50 dark:bg-[#0a0a0a]/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  style={{ borderColor: isNumCardsDropdownOpen ? persona.theme.primary : '' }}
                >
                  <span className="font-medium">{numCards} Cards</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isNumCardsDropdownOpen ? 'rotate-180' : ''}`} style={{ color: isNumCardsDropdownOpen ? persona.theme.primary : '' }} />
                </div>
                
                {isNumCardsDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 rounded-xl border overflow-hidden z-50 backdrop-blur-md bg-white dark:bg-[#0f0f0f]/90 border-slate-100 dark:border-white/10">
                    {[5, 10, 15, 20, 25, 30].map(num => (
                      <div
                        key={num}
                        onClick={() => { setNumCards(num); setIsNumCardsDropdownOpen(false); }}
                        className={`px-3 py-1.5 text-[11px] cursor-pointer transition-colors duration-200 ${numCards === num ? 'bg-slate-100 dark:bg-white/10 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
                        style={{ color: numCards === num ? persona.theme.primary : '' }}
                      >
                        {num} Cards
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 lg:flex-none w-full lg:w-auto">
                <button onClick={handleGenerate} disabled={isGenerating || (!topic && !rawFile)} className="w-full lg:w-auto flex items-center justify-center gap-1.5 h-7 px-4 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50" style={{ background: `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary || persona.theme.primary})` }}>
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  START
                </button>
              </div>
            </div>
          </div>

          {/* Main Area: Upload & History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left Panel: Upload Material */}
            <div className="flex-1 flex flex-col p-4 md:p-5 rounded-xl border bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10">
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Upload Material
                </h3>
                <p className="text-[13px] mt-1 text-slate-500 dark:text-slate-400">Upload a Material (PDF, TXT, MD) to automatically generate flashcards.</p>
                {apiProvider && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                    Pemberitahuan: Anda sedang menggunakan API kustom ({apiProvider.toUpperCase()}). Pemrosesan berkas PDF/Dokumen hanya didukung penuh menggunakan Google Gemini default.
                  </div>
                )}
              </div>
              <div 
                onClick={() => !activeFile && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0] && !activeFile) {
                    const file = e.dataTransfer.files[0];
                    setActiveFile({ name: file.name, type: file.name.split('.').pop() });
                    setRawFile(file);
                  }
                }}
                className={`flex-1 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-colors duration-300 min-h-[250px] ${!activeFile ? 'cursor-pointer' : ''} border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:border-[var(--color-primary)] hover:bg-slate-100 dark:hover:bg-white/5`}
                style={{ '--color-primary': persona.theme.primary }}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" />
                {activeFile ? (
                  <div className="w-full max-w-[320px] p-5 rounded-2xl border flex flex-col items-center text-center relative group overflow-hidden bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10">
                    <div className="absolute top-3 right-3">
                      <button onClick={(e) => { e.stopPropagation(); setActiveFile(null); setRawFile(null); }} className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 rounded-full mb-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)]" style={{ color: persona.theme.primary }}>
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-[14px] font-bold truncate w-full px-4 mb-1 text-slate-900 dark:text-white">{activeFile.name}</h4>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-500 dark:text-emerald-400">Ready to generate deck</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-full bg-white dark:bg-white/5">
                      <UploadCloud className="w-10 h-10" style={{ color: persona.theme.primary }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900 dark:text-white">Drop your Material (PDF, TXT, MD) here</p>
                      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Or click to select a file from your computer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Recent Decks */}
            <div className="flex-1 flex flex-col p-4 md:p-5 rounded-xl border bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  <h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Recent Decks</h3>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-center">
                <Layers className="w-7 h-7 mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No decks yet.</p>
                <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-600">Generate a deck to see it here!</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center transition-all duration-500 w-full max-w-5xl mx-auto h-full py-4 sm:py-6 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
          <div className="w-full flex flex-col h-full overflow-hidden">
            {/* Header Actions & Progress */}
                <div className="flex justify-between items-center mb-6">
                  <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="hidden sm:inline">Deck Progress</span>
                    <span className="px-2.5 py-1 bg-slate-200 dark:bg-white/10 rounded-full text-slate-700 dark:text-slate-200">{currentIndex + 1} / {cards.length}</span>
                  </div>
                  
                  <button 
                    onClick={downloadCSV}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">CSV (ANKI)</span>
                    <span className="sm:hidden">CSV</span>
                  </button>
                </div>

                {/* Card Container */}
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div 
                    className="relative w-full max-w-xl aspect-[3/2] cursor-pointer group"
                    style={{ perspective: "1000px" }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div 
                      className="w-full h-full relative"
                      style={{ 
                        transformStyle: "preserve-3d", 
                        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", 
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" 
                      }}
                    >
                      {/* Front Face (Question) */}
                      <div 
                        className="absolute inset-0 w-full h-full bg-white dark:bg-[#222222] rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</span>
                        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-white leading-relaxed">
                          {cards[currentIndex]?.question}
                        </h2>
                        <span className="absolute bottom-4 text-[10px] text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to flip</span>
                      </div>

                      {/* Back Face (Answer) */}
                      <div 
                        className="absolute inset-0 w-full h-full bg-white dark:bg-[#222222] rounded-2xl border-2 flex flex-col items-center justify-center p-8 text-center"
                        style={{ 
                          backfaceVisibility: "hidden", 
                          transform: "rotateY(180deg)",
                          borderColor: persona.theme.primary 
                        }}
                      >
                        <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: persona.theme.primary }}>Answer</span>
                        <p className="text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed overflow-y-auto custom-scrollbar max-h-full">
                          {cards[currentIndex]?.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#222222] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${((currentIndex + 1) / cards.length) * 100}%`,
                        backgroundColor: persona.theme.primary 
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#222222] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
          </div>
        </div>
      )}
    </div>
  );
}
