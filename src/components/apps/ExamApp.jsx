import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, BrainCircuit, Trophy, History, CheckCircle2, XCircle, PlayCircle, Loader2, ChevronRight, Trash2, X, ChevronDown, Maximize2, Minimize2, Home, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { generateExamFromPdf } from '../../lib/ai';
import { loadApiConfig } from '../../lib/db';
import { usePersistedState } from '../theme/usePersistedState';

export default function ExamApp({ persona, onOpenSidebar, isDarkMode, onOpenPersonaInfo }) {
  const [apiProvider, setApiProvider] = useState(null);

  const [state, setState] = usePersistedState('exam_active_state', {
    activeFile: null,
    topic: '',
    questionCount: 5,
    questions: [],
    currentIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    score: 0,
    isFinished: false,
    isExamActive: false
  });
  const { activeFile, topic, questionCount, questions, currentIndex, selectedAnswer, isAnswered, score, isFinished, isExamActive } = state;

  const setActiveFile = (val) => setState(prev => ({ ...prev, activeFile: typeof val === 'function' ? val(prev.activeFile) : val }));
  const setTopic = (val) => setState(prev => ({ ...prev, topic: typeof val === 'function' ? val(prev.topic) : val }));
  const setQuestionCount = (val) => setState(prev => ({ ...prev, questionCount: typeof val === 'function' ? val(prev.questionCount) : val }));
  const setQuestions = (val) => setState(prev => ({ ...prev, questions: typeof val === 'function' ? val(prev.questions) : val }));
  const setCurrentIndex = (val) => setState(prev => ({ ...prev, currentIndex: typeof val === 'function' ? val(prev.currentIndex) : val }));
  const setSelectedAnswer = (val) => setState(prev => ({ ...prev, selectedAnswer: typeof val === 'function' ? val(prev.selectedAnswer) : val }));
  const setIsAnswered = (val) => setState(prev => ({ ...prev, isAnswered: typeof val === 'function' ? val(prev.isAnswered) : val }));
  const setScore = (val) => setState(prev => ({ ...prev, score: typeof val === 'function' ? val(prev.score) : val }));
  const setIsFinished = (val) => setState(prev => ({ ...prev, isFinished: typeof val === 'function' ? val(prev.isFinished) : val }));
  const setIsExamActive = (val) => setState(prev => ({ ...prev, isExamActive: typeof val === 'function' ? val(prev.isExamActive) : val }));

  const [rawFile, setRawFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQuestionDropdownOpen, setIsQuestionDropdownOpen] = useState(false);

  const fileInputRef = useRef(null);
  const questionDropdownRef = useRef(null);
  const [examHistory, setExamHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (questionDropdownRef.current && !questionDropdownRef.current.contains(event.target)) {
        setIsQuestionDropdownOpen(false);
      }
    };
    if (isQuestionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuestionDropdownOpen]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('cyresia_exam_history');
      if (stored) {
        setExamHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load exam history:", e);
    }
  };

  const saveHistory = (newHistory) => {
    setExamHistory(newHistory);
    localStorage.setItem('cyresia_exam_history', JSON.stringify(newHistory));
  };

  useEffect(() => {
    loadHistory();
    const checkApi = async () => {
      const config = await loadApiConfig();
      if (config && config.useCustom && config.provider !== 'gemini') {
        setApiProvider(config.provider);
      }
    };
    checkApi();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawFile(file);
      setActiveFile({ name: file.name, type: file.type });
      setQuestions([]);
    }
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
    const file = e.dataTransfer?.files[0];
    if (file && file.type === "application/pdf") {
      setRawFile(file);
      setActiveFile({ name: file.name, type: file.type });
      setQuestions([]);
    } else if (file) {
      alert("Please drop a valid PDF file.");
    }
  };

  const closeExam = () => {
    setIsFullscreen(false);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setIsFinished(false);
    setIsExamActive(false);
  };

  const startRealQuiz = () => {
    if (!rawFile && questions.length === 0) return alert("Please upload a PDF first!");
    setIsGenerating(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result.split(',')[1];
      try {
        const validQuestions = await generateExamFromPdf(base64Data, rawFile.type, topic, questionCount);

        if (validQuestions && validQuestions.length > 0) {
          setQuestions(validQuestions);
          setCurrentIndex(0);
          setScore(0);
          setIsAnswered(false);
          setSelectedAnswer(null);
          setIsFinished(false);
          setIsExamActive(true);
        } else {
          alert("Failed to generate valid questions. Try again.");
        }
      } catch (e) {
        console.error("Quiz generation error:", e);
        alert(`Failed to generate exam: ${e.message}`);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(rawFile);
  };

  const handleAnswer = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || isAnswered) return;
    setIsAnswered(true);
    if (questions[currentIndex] && selectedAnswer === questions[currentIndex].answerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setCurrentIndex(prev => prev + 1);
    setIsAnswered(false);
    setSelectedAnswer(null);
  };

  const handleFinish = () => {
    setIsFinished(true);

    const existingExamIndex = examHistory.findIndex(ex => ex.title === activeFile.name);
    const examData = {
      id: existingExamIndex !== -1 ? examHistory[existingExamIndex].id : `EXAM-${Date.now()}`,
      title: activeFile.name || topic || 'Cyrene Practice Exam',
      score: score,
      total: questions.length,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      questions: questions
    };

    let newHistory = [...examHistory];
    if (existingExamIndex !== -1) {
      newHistory[existingExamIndex] = examData;
    } else {
      newHistory.push(examData);
    }

    saveHistory(newHistory);
  };

  const reopenExam = (exam) => {
    if (!exam.questions || exam.questions.length === 0) return alert("The questions are lost in time!");

    const validQuestions = exam.questions.filter(q => q && q.question && Array.isArray(q.options));
    if (validQuestions.length === 0) return alert("Questions data is corrupted.");

    setQuestions(validQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setIsFinished(false);
    setActiveFile({ name: exam.title, type: 'history' });
    setRawFile(null);
    setIsExamActive(true);
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden" : "flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden"}>
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
              <span className="-translate-y-[1px]">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] dark:text-slate-400"
          style={{
            '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
            '--btn-hover-text': persona.theme.primary
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Expand'}</span>
        </button>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6">
        {!isExamActive ? (
          <div className="flex flex-col h-full gap-4">

            {/* Top Bar Controls */}
            <div className={`flex flex-col lg:flex-row items-stretch lg:items-end gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Topic Focus (Optional)</label>
                <input type="text" placeholder="E.g., Chapter 3" value={topic} onChange={e => setTopic(e.target.value)} className={`w-full h-7 px-3 py-0 text-[11px] rounded-lg border outline-none transition-colors ${isDarkMode ? 'bg-black/40 border-white/10 text-white focus:border-[var(--color-primary)]/50' : 'bg-slate-50 border-slate-200 focus:border-[var(--color-primary)] text-slate-900'}`} style={{ '--color-primary': persona.theme.primary }} />
              </div>

              <div className="flex flex-row items-end gap-3 w-full lg:w-auto mt-1 lg:mt-0">
                <div className="flex-1 lg:w-[150px] lg:flex-none relative" ref={questionDropdownRef}>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Questions</label>
                  <div
                    onClick={() => setIsQuestionDropdownOpen(!isQuestionDropdownOpen)}
                    className={`w-full h-7 px-3 py-0 text-[11px] rounded-lg border cursor-pointer flex justify-between items-center transition-colors ${isDarkMode ? 'bg-[#0a0a0a]/80 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    style={{ borderColor: isQuestionDropdownOpen ? persona.theme.primary : '' }}
                  >
                    <span className="font-medium">{questionCount} Items</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isQuestionDropdownOpen ? 'rotate-180' : ''}`} style={{ color: isQuestionDropdownOpen ? persona.theme.primary : (isDarkMode ? '#94a3b8' : '#64748b') }} />
                  </div>

                  {isQuestionDropdownOpen && (
                    <div className={`absolute top-full left-0 w-full mt-2 rounded-xl border overflow-hidden z-50 backdrop-blur-md ${isDarkMode ? 'bg-[#0f0f0f]/90 border-white/10' : 'bg-white border-slate-100'}`}>
                      {[5, 10, 15, 20].map(num => (
                        <div
                          key={num}
                          onClick={() => { setQuestionCount(num); setIsQuestionDropdownOpen(false); }}
                          className={`px-3 py-1.5 text-[11px] cursor-pointer transition-colors duration-200 ${questionCount === num ? (isDarkMode ? 'bg-white/10 font-bold' : 'bg-slate-100 font-bold') : (isDarkMode ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900')}`}
                          style={{ color: questionCount === num ? persona.theme.primary : '' }}
                        >
                          {num} Items
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 lg:flex-none w-full lg:w-auto">
                  <button onClick={startRealQuiz} disabled={isGenerating || !rawFile} className="w-full lg:w-auto flex items-center justify-center gap-1.5 h-7 px-4 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50" style={{ background: `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary})` }}>
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Main Area: Upload & History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

              {/* Left Panel: Upload PDF */}
              <div className={`flex-1 flex flex-col p-4 md:p-5 rounded-xl border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="mb-4">
                  <h3 className="text-[14px] font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    Upload Material
                  </h3>
                  <p className={`text-[13px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upload a Material (PDF, TXT, MD) to automatically generate an interactive practice quiz.</p>
                  {apiProvider && (
                    <div className="mt-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                      Pemberitahuan: Anda sedang menggunakan API kustom ({apiProvider.toUpperCase()}). Pemrosesan berkas PDF/Dokumen hanya didukung penuh menggunakan Google Gemini default.
                    </div>
                  )}
                </div>
                <div
                  onClick={() => !activeFile && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-colors duration-300 min-h-[250px] ${!activeFile ? 'cursor-pointer' : ''} ${isDragging ? (isDarkMode ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/5') : (isDarkMode ? 'border-white/10 bg-black/20 hover:border-[var(--color-primary)]/50 hover:bg-white/5' : 'border-slate-300 bg-slate-50 hover:border-[var(--color-primary)] hover:bg-slate-100')}`}
                  style={{ '--color-primary': persona.theme.primary }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" />
                  {activeFile ? (
                    <div className={`w-full max-w-[320px] p-5 rounded-2xl border flex flex-col items-center text-center relative group overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                      <div className="absolute top-3 right-3">
                        <button onClick={(e) => { e.stopPropagation(); setActiveFile(null); setRawFile(null); }} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-red-400' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={`p-4 rounded-full mb-3 ${isDarkMode ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`} style={{ color: persona.theme.primary }}>
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className={`text-[14px] font-bold truncate w-full px-4 mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeFile.name}</h4>
                      <p className={`text-[11px] font-medium uppercase tracking-widest ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>Ready to generate exam</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className={`p-4 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                        <UploadCloud className="w-10 h-10" style={{ color: persona.theme.primary }} />
                      </div>
                      <div>
                        <p className={`text-[15px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{isDragging ? "Drop to upload" : "Drop your Material (PDF, TXT, MD) here"}</p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Or click to select a file from your computer</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Recent Exams */}
              <div className={`flex-1 flex flex-col p-4 md:p-5 rounded-xl border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <History className={`w-4 h-4`} style={{ color: persona.theme.primary }} />
                    <h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Recent Exams</h3>
                  </div>
                  {examHistory.length > 0 && (
                    <button onClick={() => { if (confirm("Clear all history?")) saveHistory([]); }} className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider">Clear All</button>
                  )}
                </div>

                {examHistory.length > 0 ? (
                  <div className="flex flex-col gap-2.5 overflow-y-auto scrollbar-thin pr-2 flex-1 pb-4">
                    {[...examHistory].reverse().map(ex => (
                      <div key={ex.id} onClick={() => reopenExam(ex)} className={`p-2.5 md:p-3 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden ${isDarkMode ? 'bg-[#111111] border border-white/5 hover:border-white/10' : 'bg-white border border-slate-200 hover:border-slate-300 hover:'}`}>
                        <h4 className={`font-bold text-[12px] mb-1 pl-0.5 transition-colors leading-tight break-words ${isDarkMode ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-black'}`}>{ex.title}</h4>
                        <div className="flex items-center justify-between pl-0.5 mt-1.5">
                          <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <History className="w-3 h-3" />
                            {ex.date}
                          </div>
                          <span className={`text-[9px] md:text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                            Score: {ex.score}/{ex.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center flex-1 rounded-2xl border border-dashed text-center ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                    <History className={`w-7 h-7 mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No exams yet.</p>
                    <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Upload a PDF to start practicing!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center transition-all duration-500 w-full max-w-5xl mx-auto h-full py-4 sm:py-6 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
            {questions.length === 0 ? (
              <div className="text-center opacity-80 flex flex-col items-center justify-center h-full">
                <Trophy className={`w-16 h-16 md:w-20 md:h-20 mb-3 ${isDarkMode ? 'text-slate-800' : 'text-slate-300'}`} />
                <p className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading simulation...</p>
              </div>
            ) : isFinished ? (
              <div className="text-center flex flex-col items-center justify-center w-full px-4 h-full">
                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-5 border-4 backdrop-blur-xl ${score >= questions.length / 2 ? (isDarkMode ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-white text-green-600 border-green-400') : (isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-white text-pink-600 border-pink-400')}`}>
                  <span className="text-3xl md:text-5xl font-bold">{score}/{questions.length}</span>
                </div>
                <h2 className={`text-2xl md:text-4xl font-bold mb-2 tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Exam Finished!</h2>
                <p className={`text-[14px] md:text-[16px] mb-8 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>You've completed the simulation. Your score is {score} out of {questions.length}.</p>
                <button onClick={closeExam} className="flex items-center justify-center gap-1.5 h-7 px-4 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50 mx-auto" style={{ background: `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary})` }}><Home className="w-3.5 h-3.5" /> Close & Rest</button>
              </div>
            ) : (
              <div className="w-full flex flex-col h-full overflow-hidden">
                {/* Question Card */}
                <div className={`w-full p-5 md:p-6 rounded-2xl mb-6 border shrink-0 relative z-20 ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'}`}>

                  {/* Header / Meta */}
                  <div className={`flex justify-between items-center mb-6 pb-6 border-b border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <button onClick={closeExam} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500'}`}>
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Progress</span>
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                            <CheckCircle2 className="w-3 h-3" /> {score}
                          </div>
                        </div>
                        <span className={`text-[13px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Question {currentIndex + 1} of {questions.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {!isAnswered ? (
                        <button onClick={checkAnswer} disabled={selectedAnswer === null} className="flex items-center justify-center gap-1.5 h-7 px-3 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary})` }}>
                          Check <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : currentIndex < questions.length - 1 ? (
                        <button onClick={nextQuestion} className="flex items-center justify-center gap-1.5 h-7 px-3 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50" style={{ background: `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary})` }}>
                          Next <span className="hidden sm:inline">Question</span> <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={handleFinish} className="flex items-center justify-center gap-1.5 h-7 px-4 bg-emerald-500 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50">
                          Finish <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 className={`text-[16px] md:text-[20px] font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {questions[currentIndex]?.question}
                  </h3>
                </div>

                {/* Options List & Actions container (scrollable) */}
                <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {(questions[currentIndex]?.options || []).map((opt, idx) => {
                      const isCorrect = idx === questions[currentIndex]?.answerIndex;
                      const isSelected = selectedAnswer === idx;

                      let text = opt;
                      let prefix = "";
                      if (opt.match(/^[A-D]\.\s/)) {
                        prefix = opt.substring(0, 1);
                        text = opt.substring(3);
                      }

                      let btnClass = "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group active:scale-[0.99] ";
                      let letterClass = "w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors duration-300 ";
                      let textClass = "text-[14px] font-medium leading-relaxed flex-1 transition-colors duration-300 ";

                      let btnStyle = { '--color-primary': persona.theme.primary };
                      let letterStyle = {};

                      if (!isAnswered) {
                        if (isSelected) {
                          btnClass += isDarkMode
                            ? "border-transparent "
                            : "border-transparent ";
                          btnStyle.backgroundColor = `color-mix(in srgb, ${persona.theme.primary} 12%, transparent)`;
                          letterStyle.backgroundColor = persona.theme.primary;
                          letterClass += "text-white ";
                          textClass += isDarkMode ? "text-white" : "text-slate-900 font-bold";
                        } else {
                          btnClass += isDarkMode
                            ? "border-white/5 bg-[#111111] hover:bg-white/5"
                            : "border-slate-200 bg-white hover:bg-slate-50";
                          letterClass += isDarkMode
                            ? "bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900";
                          textClass += isDarkMode ? "text-slate-300 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900";
                        }
                      } else if (isCorrect) {
                        btnClass += isDarkMode ? "border-emerald-500/40 bg-emerald-500/10" : "border-emerald-400 bg-emerald-50/50 ";
                        letterClass += isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700";
                        textClass += isDarkMode ? "text-emerald-300" : "text-emerald-800";
                      } else if (isSelected) {
                        btnClass += isDarkMode ? "border-rose-500/40 bg-rose-500/10" : "border-rose-300 bg-rose-50/50 ";
                        letterClass += isDarkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600";
                        textClass += isDarkMode ? "text-rose-300" : "text-rose-800";
                      } else {
                        btnClass += isDarkMode ? "opacity-60 cursor-default border-white/5 bg-transparent" : "opacity-60 cursor-default border-slate-100 bg-transparent";
                        letterClass += isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400";
                        textClass += isDarkMode ? "text-slate-500" : "text-slate-500";
                      }

                      return (
                        <button key={idx} disabled={isAnswered} onClick={() => handleAnswer(idx)} className={btnClass} style={btnStyle}>
                          <div className={letterClass} style={letterStyle}>{prefix || String.fromCharCode(65 + idx)}</div>
                          <span className={textClass}>{text}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {isAnswered && (
                    <div className={`p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-[#1a1a1a] border border-white/5' : 'bg-slate-50 border border-slate-100'}`} style={{ '--color-primary': persona.theme.primary }}>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2`} style={{ color: persona.theme.primary }}>
                        <BrainCircuit className="w-4 h-4" /> AI Explanation
                      </h4>
                      <p className={`text-[14px] leading-relaxed font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {questions[currentIndex]?.correctExplanation || "No explanation provided."}
                      </p>

                      {questions[currentIndex]?.wrongExplanations && questions[currentIndex]?.wrongExplanations.length > 0 && (
                        <div className={`mt-5 pt-5 border-t border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
                          <ul className={`text-[13px] space-y-3 opacity-90 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {questions[currentIndex].wrongExplanations.map((wrong, wIdx) => (
                              <li key={wIdx} className="flex gap-3 font-medium leading-relaxed text-[13px]">
                                <span className="mt-1 font-bold shrink-0" style={{ color: persona.theme.primary }}>•</span>
                                <span>{wrong}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* (Action Buttons moved to top header) */}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
