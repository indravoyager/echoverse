import { useState, useRef, useEffect } from 'react';
import { generateUtilityResponse } from '../../lib/ai';
import { Loader2, Download, Check, CalendarDays, RotateCcw, ArrowLeft, Leaf, LayoutList, ChevronDown, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import * as htmlToImage from 'html-to-image';
import { usePersistedState } from '../theme/usePersistedState';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const LAYOUT_THEMES = [
  { id: 'modern', label: 'Modern Editorial' },
  { id: 'playful', label: 'Playful Sticky Notes' },
  { id: 'classic', label: 'Classic Notebook' }
];

const CATEGORY_COLORS = {
  task: 'bg-slate-400 dark:bg-slate-500',
  event: 'bg-purple-400 dark:bg-purple-500',
  finance: 'bg-emerald-400 dark:bg-emerald-500',
  fitness: 'bg-orange-400 dark:bg-orange-500',
  study: 'bg-blue-400 dark:bg-blue-500',
  work: 'bg-rose-400 dark:bg-rose-500',
  default: 'bg-indigo-400 dark:bg-indigo-500'
};

const CATEGORY_COLORS_PLAYFUL = {
  task: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  event: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50',
  finance: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  fitness: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50',
  study: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  work: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50',
  default: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50'
};

const CustomDropdown = ({ label, value, options, onChange, primaryColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#0f0f0f] border rounded-xl transition-all",
            isOpen ? "border-[var(--color-primary)] shadow-[0_0_0_3px_var(--color-primary-light)]" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
          )}
          style={{ 
            '--color-primary': primaryColor,
            '--color-primary-light': `color-mix(in srgb, ${primaryColor} 20%, transparent)`
          }}
        >
          <div className="flex items-center gap-2.5 truncate">
            <LayoutList size={16} className={clsx("shrink-0", isOpen ? "text-[var(--color-primary)]" : "text-slate-400")} style={{ color: isOpen ? primaryColor : undefined }} />
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedOption?.label || "Select..."}</span>
          </div>
          <ChevronDown size={16} className={clsx("text-slate-400 shrink-0 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors text-left",
                  value === opt.value 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                )}
                style={{ '--color-primary': primaryColor }}
              >
                <LayoutList size={16} className={clsx("shrink-0", value === opt.value ? "text-[var(--color-primary)]" : "text-slate-400")} style={{ color: value === opt.value ? primaryColor : undefined }} />
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function GoalPlannerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const [state, setState] = usePersistedState('goalplanner_state', {
    layoutTheme: 'modern',
    inputText: '',
    events: [],
    notes: {}
  });
  const { layoutTheme, inputText, events, notes } = state;

  const setLayoutTheme = (val) => setState(prev => ({ ...prev, layoutTheme: typeof val === 'function' ? val(prev.layoutTheme) : val }));
  const setInputText = (val) => setState(prev => ({ ...prev, inputText: typeof val === 'function' ? val(prev.inputText) : val }));
  const setEvents = (val) => setState(prev => ({ ...prev, events: typeof val === 'function' ? val(prev.events) : val }));
  const setNotes = (val) => setState(prev => ({ ...prev, notes: typeof val === 'function' ? val(prev.notes) : val }));

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        const padding = 40; // 20px padding on each side
        const scaleX = (width - padding) / 1123;
        const scaleY = (height - padding) / 794;
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calendar Math
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday
  
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };
  
  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    const monthName = MONTHS[selectedMonth];
    let dayMap = "Day References:\n";
    for(let i=1; i<=daysInMonth; i++) {
        let d = new Date(selectedYear, selectedMonth, i);
        dayMap += `${i}: ${d.toLocaleDateString('en-US', {weekday: 'short'})}, `;
    }

    const systemPrompt = `You are an expert scheduling assistant. The user wants to map their goals/activities for ${monthName} ${selectedYear}.
The month has ${daysInMonth} days.
${dayMap}

User Input: "${inputText}"

Extract tasks and assign them to specific days (1 to ${daysInMonth}).
- If no exact date is specified but a relative time is (e.g. "mid month"), make a logical guess (e.g. 15).
- If it's a recurring day (e.g. "every monday"), add an event object for EACH Monday in the month.
- Titles should be very short (max 4 words).

RETURN ONLY A RAW JSON ARRAY. Do not use markdown blocks (\`\`\`json). Just return the array.
Format example:
[
  { "day": 1, "title": "Pay rent", "category": "finance" },
  { "day": 15, "title": "Doctor Appt", "category": "event" }
]
Valid categories: task, event, finance, fitness, study, work, default.`;

    try {
      const rawResult = await generateUtilityResponse(inputText, systemPrompt);
      let cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedEvents = JSON.parse(cleanJson);
      if (Array.isArray(parsedEvents)) {
        const taggedEvents = parsedEvents.map(e => ({ ...e, month: selectedMonth, year: selectedYear }));
        setEvents(prev => [
            ...prev.filter(e => e.month !== selectedMonth || e.year !== selectedYear),
            ...taggedEvents
        ]);
      } else {
        throw new Error("Invalid output format");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to parse schedule. Please try rephrasing your goals.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      // Force light theme for export if playful/classic to ensure best paper look,
      // or preserve it. Let's preserve current theme.
      const dataUrl = await htmlToImage.toPng(calendarRef.current, { 
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0'
        }
      });
      const link = document.createElement('a');
      link.download = `Schedule-${MONTHS[selectedMonth]}-${selectedYear}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
      alert("Failed to save image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setInputText('');
    setEvents([]);
    setNotes({});
  };

  const updateEventTitle = (evtToUpdate, newTitle) => {
    if (!newTitle.trim()) {
      setEvents(prev => prev.filter(e => e !== evtToUpdate));
    } else {
      setEvents(prev => prev.map(e => e === evtToUpdate ? { ...e, title: newTitle } : e));
    }
  };

  // --- Renderers ---
  
  const renderModern = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const noteKey = `modern-start-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div key={`empty-${i}`} className="h-full overflow-hidden p-2 bg-slate-50/50 dark:bg-black/20 flex flex-col">
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-400 dark:text-slate-600 text-[18px] cursor-text overflow-hidden"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => Number(e.day) === day && (e.month === undefined || (Number(e.month) === Number(selectedMonth) && Number(e.year) === Number(selectedYear))));
      const isToday = day === currentDate.getDate() && selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
      
      cells.push(
        <div key={`day-${day}`} className="h-full overflow-hidden p-1.5 bg-white dark:bg-[#111111] flex flex-col gap-0.5 relative">
          <div className="flex justify-end mb-0">
            <span className="text-[12px] font-bold w-5 h-5 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500">
              {day}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">
            {dayEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-1.5 px-0.5">
                 <div className="w-1 h-2.5 mt-1.5 rounded-full shrink-0 opacity-80" style={{ backgroundColor: 'var(--color-primary)' }} />
                 <span 
                   contentEditable suppressContentEditableWarning
                   onBlur={(e) => updateEventTitle(evt, e.target.innerText)}
                   onKeyDown={(e) => {
                     if (e.key === 'Backspace' && !e.currentTarget.innerText.trim()) {
                       e.preventDefault();
                       setEvents(prev => prev.filter(ev => ev !== evt));
                     }
                   }}
                   style={{fontFamily: "'Caveat', cursive", fontSize: "15px", lineHeight: "1.1"}} 
                   className="text-slate-700 dark:text-slate-300 outline-none focus:bg-slate-100 dark:focus:bg-white/10 rounded px-1 -ml-1 cursor-text"
                 >
                   {evt.title}
                 </span>
              </div>
            ))}
            <div  
               contentEditable suppressContentEditableWarning
               onBlur={e => {
                 const text = e.target.innerText.trim();
                 if (text) {
                   setEvents(prev => [...prev, { day, title: text, category: "work", month: selectedMonth, year: selectedYear }]);
                   e.target.innerText = "";
                 }
               }}
               className="flex-1 w-full outline-none cursor-text text-slate-700 dark:text-slate-300"
               style={{fontFamily: "'Caveat', cursive", fontSize: "15px", lineHeight: "1.1"}}
            />
          </div>
        </div>
      );
    }

    const trailingDays = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;
    for (let i = 0; i < trailingDays; i++) {
      const noteKey = `modern-end-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div key={`empty-end-${i}`} className="h-full overflow-hidden p-2 bg-slate-50/50 dark:bg-black/20 flex flex-col">
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-400 dark:text-slate-600 text-[18px] cursor-text overflow-hidden"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }

    return (
       <div className="p-12 w-full h-full flex flex-col bg-white dark:bg-[#0a0a0a]">
          <div className="flex justify-between items-end mb-8 px-2 shrink-0">
            <div>
              <h3 className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white uppercase flex items-baseline gap-3">
                {MONTHS[selectedMonth]} <span className="text-slate-300 dark:text-slate-600 font-medium">{selectedYear}</span>
              </h3>
            </div>
            {events.length > 0 && (
              <div className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.theme.primary }}></span>
                {events.length} Targets Set
              </div>
            )}
          </div>
          
          <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-[#0f0f0f] border-b border-slate-200 dark:border-white/10 shrink-0">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest py-4">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-white/10 flex-1 min-h-0 auto-rows-fr">
              {cells}
            </div>
          </div>
       </div>
    );
  };

  const renderPlayful = () => {
    const STICKY_COLORS = [
      'bg-[#fef08a]', // yellow
      'bg-[#bbf7d0]', // green
      'bg-[#bfdbfe]', // blue
      'bg-[#fbcfe8]', // pink
      'bg-[#fed7aa]', // orange
    ];

    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const noteKey = `playful-start-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div key={`empty-${i}`} className="h-full p-2 flex flex-col overflow-hidden">
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-800/30 dark:text-slate-400/50 text-[20px] cursor-text overflow-hidden"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => Number(e.day) === day && (e.month === undefined || (Number(e.month) === Number(selectedMonth) && Number(e.year) === Number(selectedYear))));
      const isToday = day === currentDate.getDate() && selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
      
      const stickyColor = STICKY_COLORS[(day * 7) % STICKY_COLORS.length];
      const rotation = ((day * 13) % 5) - 2;
      
      cells.push(
        <div key={`day-${day}`} className="h-full overflow-hidden p-1 flex justify-center items-center">
          <div 
            className={clsx(
              "w-full h-full relative shadow-[2px_4px_10px_rgba(0,0,0,0.15)] p-1.5 flex flex-col gap-0.5 transition-transform hover:scale-105",
              stickyColor
            )}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Tape */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/40 shadow-sm rotate-[3deg] backdrop-blur-sm"></div>
            
            <div className="flex justify-between items-start mb-0">
              <span className="text-lg font-black text-slate-800" style={{fontFamily: "'Caveat', cursive", lineHeight: "1"}}>
                {day}
              </span>
            </div>
            
            <div className="flex flex-col gap-0 overflow-hidden flex-1 min-h-0">
              {dayEvents.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-0.5">
                   <span className="text-slate-800/50 mt-0.5 text-xs">-</span>
                   <span 
                     contentEditable suppressContentEditableWarning
                     onBlur={(e) => updateEventTitle(evt, e.target.innerText)}
                     onKeyDown={(e) => {
                       if (e.key === 'Backspace' && !e.currentTarget.innerText.trim()) {
                         e.preventDefault();
                         setEvents(prev => prev.filter(ev => ev !== evt));
                       }
                     }}
                     style={{fontFamily: "'Caveat', cursive", fontSize: "16px", lineHeight: "1.1"}} 
                     className="text-slate-800 outline-none focus:bg-white/40 rounded px-1 -ml-1 cursor-text"
                   >
                     {evt.title}
                   </span>
                </div>
              ))}
              <div 
                 contentEditable suppressContentEditableWarning
                 onBlur={e => {
                   const text = e.target.innerText.trim();
                   if (text) {
                     setEvents(prev => [...prev, { day, title: text, category: "work", month: selectedMonth, year: selectedYear }]);
                     e.target.innerText = "";
                   }
                 }}
                 className="flex-1 w-full outline-none cursor-text text-slate-800"
                 style={{fontFamily: "'Caveat', cursive", fontSize: "16px", lineHeight: "1.1"}}
              />
            </div>
          </div>
        </div>
      );
    }

    const trailingDays = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;
    for (let i = 0; i < trailingDays; i++) {
      const noteKey = `playful-end-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div key={`empty-end-${i}`} className="h-full p-2 flex flex-col overflow-hidden">
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-800/30 dark:text-slate-400/50 text-[20px] cursor-text overflow-hidden"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }

    return (
       <div className="p-10 w-full h-full flex flex-col relative bg-[#e8e2d5] dark:bg-[#2a2622]">
          <div className="relative z-10 w-max mx-auto mb-8 bg-white/90 dark:bg-[#f8fafc] px-10 py-4 shadow-md flex items-center gap-4 transform rotate-[-1deg] shrink-0">
             {/* Push Pins */}
             <div className="absolute -top-3 left-4 w-4 h-4 rounded-full bg-red-500 shadow-[1px_2px_4px_rgba(0,0,0,0.4)]"></div>
             <div className="absolute -top-3 right-4 w-4 h-4 rounded-full bg-red-500 shadow-[1px_2px_4px_rgba(0,0,0,0.4)]"></div>
             
             <h3 className="text-5xl font-black text-slate-800 uppercase" style={{fontFamily: "'Caveat', cursive"}}>
               {MONTHS[selectedMonth]} {selectedYear}
             </h3>
          </div>
          
          <div className="flex flex-col gap-1 sm:gap-2 relative z-10 flex-1 min-h-0">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 shrink-0">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={`header-${day}`} className="text-center text-[22px] font-bold text-slate-600 dark:text-slate-400 pb-1" style={{fontFamily: "'Caveat', cursive"}}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0 auto-rows-fr">
              {cells}
            </div>
          </div>
       </div>
    );
  };

  const renderClassic = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const noteKey = `classic-start-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div 
          key={`empty-${i}`} 
          className="h-full overflow-hidden border-r-2 border-b-2 border-slate-800 dark:border-slate-600 bg-[length:10px_10px] bg-slate-800/5 dark:bg-white/5 p-2 flex flex-col min-h-0"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 5px)' }}
        >
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-800/50 dark:text-slate-400/80 text-[22px] cursor-text overflow-hidden leading-tight"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => e.day === day && (e.month === undefined || (e.month === selectedMonth && e.year === selectedYear)));
      const isToday = day === currentDate.getDate() && selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
      
      cells.push(
        <div key={`day-${day}`} className="h-full overflow-hidden border-r-2 border-b-2 border-slate-800 dark:border-slate-600 p-1.5 flex flex-col gap-0.5 relative min-h-0">
          <div className="flex justify-start mb-0 shrink-0">
            <span className="text-[16px] font-semibold text-slate-800 dark:text-slate-400" style={{fontFamily: "'Caveat', cursive", lineHeight: "1"}}>
              {day}
            </span>
          </div>
          <div className="flex flex-col gap-0 flex-1 min-h-0 overflow-hidden">
            {dayEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-1 px-0.5">
                 <span className="text-slate-400 mt-0.5 text-xs">-</span>
                 <span 
                   contentEditable suppressContentEditableWarning
                   onBlur={(e) => updateEventTitle(evt, e.target.innerText)}
                   onKeyDown={(e) => {
                     if (e.key === 'Backspace' && !e.currentTarget.innerText.trim()) {
                       e.preventDefault();
                       setEvents(prev => prev.filter(ev => ev !== evt));
                     }
                   }}
                   style={{fontFamily: "'Caveat', cursive", fontSize: "17px", lineHeight: "1.1"}} 
                   className="text-slate-800 dark:text-slate-200 outline-none focus:bg-slate-200 dark:focus:bg-white/10 rounded px-1 -ml-1 cursor-text"
                 >
                   {evt.title}
                 </span>
              </div>
            ))}
            <div 
               contentEditable suppressContentEditableWarning
               onBlur={e => {
                 const text = e.target.innerText.trim();
                 if (text) {
                   setEvents(prev => [...prev, { day, title: text, category: "work", month: selectedMonth, year: selectedYear }]);
                   e.target.innerText = "";
                 }
               }}
               className="flex-1 w-full outline-none cursor-text text-slate-800 dark:text-slate-200"
               style={{fontFamily: "'Caveat', cursive", fontSize: "17px", lineHeight: "1.1"}}
            />
          </div>
        </div>
      );
    }

    const trailingDays = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;
    for (let i = 0; i < trailingDays; i++) {
      const noteKey = `classic-end-${selectedYear}-${selectedMonth}-${i}`;
      cells.push(
        <div 
          key={`empty-end-${i}`} 
          className="h-full overflow-hidden border-r-2 border-b-2 border-slate-800 dark:border-slate-600 bg-[length:10px_10px] bg-slate-800/5 dark:bg-white/5 p-2 flex flex-col min-h-0"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 5px)' }}
        >
           <div 
             contentEditable suppressContentEditableWarning
             onBlur={e => setNotes(prev => ({...prev, [noteKey]: e.target.innerText}))}
             className="flex-1 min-h-0 w-full outline-none text-slate-800/50 dark:text-slate-400/80 text-[22px] cursor-text overflow-hidden leading-tight"
             style={{fontFamily: "'Caveat', cursive"}}
           >
             {notes[noteKey] || ""}
           </div>
        </div>
      );
    }

    return (
       <div className="p-12 w-full h-full flex flex-col relative bg-[#fdfbf7] dark:bg-[#121212]">
          <div className="absolute top-0 bottom-0 left-16 w-px bg-red-400/60 dark:bg-red-900/50 z-0"></div>
          <div className="absolute top-0 bottom-0 left-[68px] w-px bg-red-400/60 dark:bg-red-900/50 z-0"></div>
          
          <div className="flex justify-between items-center mb-6 pl-12 z-10 pb-4 pr-4 shrink-0">
            <h3 className="text-6xl text-slate-800 dark:text-slate-200 font-bold" style={{fontFamily: "'Caveat', cursive"}}>
              {MONTHS[selectedMonth]} {selectedYear}
            </h3>
            {events.length > 0 && (
              <div className="text-3xl text-slate-500 dark:text-slate-500 flex flex-col items-end" style={{fontFamily: "'Caveat', cursive"}}>
                <span>Goals: {events.length}</span>
                <span className="text-[var(--color-primary)] opacity-80" style={{fontFamily: "'Caveat', cursive"}}>{persona.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col ml-12 z-10 bg-transparent border-t-2 border-l-2 border-slate-800 dark:border-slate-600 min-h-0">
            <div className="grid grid-cols-7 bg-transparent shrink-0">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[22px] font-bold text-slate-800 dark:text-slate-300 py-3 border-r-2 border-b-2 border-slate-800 dark:border-slate-600" style={{fontFamily: "'Caveat', cursive"}}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 min-h-0 auto-rows-fr bg-transparent">
              {cells}
            </div>
          </div>
       </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
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
            style={{ borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)` }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title="Reset Form"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full lg:h-full">
          
          {/* Input Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative z-20">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarDays size={16} style={{ color: persona.theme.primary }} /> Period
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <CustomDropdown
                  label="TARGET MONTH"
                  value={selectedMonth}
                  options={MONTHS.map((m, i) => ({ value: i, label: m }))}
                  onChange={setSelectedMonth}
                  primaryColor={persona.theme.primary}
                />
                <CustomDropdown
                  label="TARGET YEAR"
                  value={selectedYear}
                  options={[0, 1, 2].map(offset => {
                    const y = currentDate.getFullYear() + offset;
                    return { value: y, label: String(y) };
                  })}
                  onChange={setSelectedYear}
                  primaryColor={persona.theme.primary}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col shrink-0 relative z-10">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Palette size={16} style={{ color: persona.theme.primary }} /> Visual Theme
                </span>
              </div>
              <div className="p-4">
                <CustomDropdown
                  value={layoutTheme}
                  options={LAYOUT_THEMES.map(t => ({ value: t.id, label: t.label }))}
                  onChange={setLayoutTheme}
                  primaryColor={persona.theme.primary}
                />
              </div>
            </div>

            <div className="flex-1 min-h-[250px] lg:min-h-0 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <LayoutList size={16} style={{ color: persona.theme.primary }} /> Target & Activities
                  </span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !inputText.trim()}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
                  BUILD
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., I want to hit the gym every Monday and Wednesday. Pay my electricity bill on the 5th. Launch my app mid-month."
                className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed custom-scrollbar"
              />
            </div>
          </div>

          {/* Output Panel - Calendar Canvas */}
          <div className="w-full lg:w-auto lg:flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative lg:h-full lg:min-h-0 shadow-sm shrink-0">
            
            <div className="px-2 sm:px-4 py-2 sm:py-0 min-h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex flex-wrap justify-between items-center gap-x-2 gap-y-2 shrink-0 z-10 relative bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur">
              <span className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-white shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.theme.primary }}></div>
                <span className="hidden sm:inline">A4 Document View</span>
                <span className="sm:hidden text-[13px]">A4 View</span>
                <span className="ml-0 sm:ml-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: persona.theme.primary }}></div>
                  <span className="opacity-40 mx-1 sm:hidden">|</span>
                  {events.filter(e => e.month === undefined || (Number(e.month) === Number(selectedMonth) && Number(e.year) === Number(selectedYear))).length} <span className="hidden sm:inline">TARGETS SET</span><span className="sm:hidden">TARGETS</span>
                </span>
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded px-1 py-0.5 shrink-0">
                  <button onClick={handlePrevMonth} className="p-0.5 rounded hover:bg-white dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 min-w-[60px] text-center select-none tracking-wider">
                    {MONTHS[selectedMonth].substring(0, 3)} {selectedYear}
                  </span>
                  <button onClick={handleNextMonth} className="p-0.5 rounded hover:bg-white dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
                
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50 uppercase tracking-wider bg-slate-100 dark:bg-white/10 px-2 py-1 rounded"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span className="hidden sm:inline">Save as Image</span>
                </button>
              </div>
            </div>
            <div className="w-full lg:flex-1 overflow-hidden bg-slate-100/50 dark:bg-[#050505] flex items-center justify-center relative aspect-[1171/842] lg:aspect-auto" ref={containerRef}>
              <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
              `}</style>
              
              {/* A4 Canvas Container */}
              <div 
                className="shrink-0 bg-white dark:bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 overflow-hidden relative" 
                ref={calendarRef} 
                style={{ 
                  '--color-primary': persona.theme.primary,
                  width: '1123px',
                  height: '794px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                {layoutTheme === 'modern' && renderModern()}
                {layoutTheme === 'playful' && renderPlayful()}
                {layoutTheme === 'classic' && renderClassic()}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
