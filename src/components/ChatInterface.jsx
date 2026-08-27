import { useRef, useEffect, useLayoutEffect, useState, useDeferredValue, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, X, Heart, Book, Trash2, Search, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import ImageGalleryModal from './ImageGalleryModal';
import { saveMemories } from '../lib/db';
import { clsx } from 'clsx';

function ChatInterface({ persona, messages, onSendMessage, onEdit, isTyping, onOpenSidebar, onOpenPersonaInfo, affinityLevel, currentMood, memories, setMemories, userAvatar, onClearChat, allPersonas, onSelectPersona }) {
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [renderLimit, setRenderLimit] = useState(30);
  const [unreadInCurrentChat, setUnreadInCurrentChat] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mentionConfirmId, setMentionConfirmId] = useState(null);
  const activeMemories = memories?.[persona.id] || [];
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const matchRefsMap = useRef({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);
  const scrollFrame = useRef(null);
  const prevPersonaIdRef = useRef(persona?.id);
  const prevMessagesLengthRef = useRef(messages?.length || 0);
  const hasScrolledInitially = useRef(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);
  const galleryImages = useMemo(() => {
    return messages.filter(m => m.image).map(m => m.image);
  }, [messages]);

  const handleOpenGallery = (image) => {
    const index = galleryImages.findIndex(img => img === image);
    if (index !== -1) setActiveGalleryIndex(index);
  };

  const checkIsAtBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 150;
  };

  const scrollToBottom = (smooth = true) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const handleScroll = () => {
    if (scrollFrame.current) return;
    scrollFrame.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (!el) {
        scrollFrame.current = null;
        return;
      }
      const atBottom = checkIsAtBottom();
      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
      if (atBottom) {
        setUnreadInCurrentChat(0);
      }

      if (el.scrollTop < 300 && renderLimit < messages.length) {
        const currentScrollHeight = el.scrollHeight;
        const currentScrollTop = el.scrollTop;

        setRenderLimit(prev => Math.min(prev + 30, messages.length));

        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            scrollContainerRef.current.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
          }
        }, 0);
      }

      scrollFrame.current = null;
    });
  };

  // Handle container resize (e.g. mobile keyboard opens): if at bottom, scroll to bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let prevHeight = container.clientHeight;

    const observer = new ResizeObserver((entries) => {
      const newHeight = entries[0].contentRect.height;
      // If height shrinks (e.g. keyboard opens)
      if (newHeight < prevHeight) {
        // Calculate distance to bottom BEFORE the shrink occurred
        const distanceToBottomBeforeShrink = container.scrollHeight - container.scrollTop - prevHeight;

        // If we were at the bottom (with a generous 200px tolerance)
        if (distanceToBottomBeforeShrink <= 200) {
          // Force scroll to new bottom instantly using rAF to prevent spammy jitter
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
        }
      }
      prevHeight = newHeight;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Continuous auto-scroll on AI typing typewriter steps
  useEffect(() => {
    const handleTypingStep = () => {
      if (isAtBottomRef.current) {
        scrollToBottom(false);
      }
    };
    window.addEventListener('ai-typing-step', handleTypingStep);

    const handleImageLoad = () => {
      if (isAtBottomRef.current) {
        scrollToBottom(false);
      }
    };
    window.addEventListener('chat-image-loaded', handleImageLoad);

    return () => {
      window.removeEventListener('ai-typing-step', handleTypingStep);
      window.removeEventListener('chat-image-loaded', handleImageLoad);
    };
  }, []);

  useLayoutEffect(() => {
    const isPersonaChange = prevPersonaIdRef.current !== persona?.id;
    const isNewMessage = messages?.length > prevMessagesLengthRef.current;
    const isInitialLoad = !hasScrolledInitially.current;

    if (isInitialLoad || isPersonaChange) {
      if (isPersonaChange) setRenderLimit(30);
      scrollToBottom(false);
      isAtBottomRef.current = true;
      hasScrolledInitially.current = true;
      setUnreadInCurrentChat(0);
    } else if (isNewMessage) {
      if (isAtBottomRef.current) {
        scrollToBottom(true);
      } else {
        setUnreadInCurrentChat(prev => prev + (messages.length - prevMessagesLengthRef.current));
      }
    } else if (isTyping && isAtBottomRef.current) {
      scrollToBottom(true);
    }

    prevPersonaIdRef.current = persona?.id;
    prevMessagesLengthRef.current = messages?.length || 0;
  }, [messages, isTyping, persona?.id]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Expand render limit ONLY when user actually starts typing to prevent violent scroll jitter
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setRenderLimit(messages.length);
    }
  }, [searchQuery, messages.length]);

  // Scroll to current match — use querySelector for reliable DOM targeting
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;
    const matches = messages.filter(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q));
    const match = matches[searchMatchIndex];
    if (!match) return;

    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      // Use data attribute to reliably find the element in DOM
      const el = container.querySelector(`[data-search-id="${match.id}"]`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = elRect.top - containerRect.top + container.scrollTop;
        const scrollTarget = relativeTop - container.clientHeight / 2 + el.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [searchMatchIndex, searchQuery, messages]);

  if (!persona) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-500 dark:text-slate-400">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-xl font-bold text-slate-800 dark:text-slate-200">Welcome to</span>
          <div className="flex items-center ml-1 font-jakarta select-text">
            <h2 className="font-extrabold text-xl tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)]">Echo</span>
              <span className="text-slate-900 dark:text-white">verse</span>
            </h2>
          </div>
        </div>
        <p className="text-sm font-medium">Please select a persona from the sidebar to begin.</p>
      </div>
    );
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = new Date(msg.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateString = '';
      if (date.toDateString() === today.toDateString()) {
        dateString = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Yesterday';
      } else {
        dateString = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(msg);
    });
    return groups;
  };

  const getMoodEmoji = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'senang': return '(✿◠‿◠)';
      case 'bahagia': return '(≧◡≦)';
      case 'sedih': return '(╥﹏╥)';
      case 'marah': return '(๑•̀ㅂ•́)و✧';
      case 'malu': return '(⁄ ⁄•⁄ω⁄•⁄ ⁄)';
      case 'terkejut': return '(⊙_⊙)';
      case 'normal': return '(・_・;)';
      default: return '(・_・;)';
    }
  };

  // Search computation
  const normalizedQuery = deferredSearchQuery.toLowerCase().trim();
  const searchMatches = normalizedQuery
    ? messages.filter(m => typeof m.content === 'string' && m.content.toLowerCase().includes(normalizedQuery))
    : [];
  const currentMatchId = searchMatches[searchMatchIndex]?.id || null;

  const closeSearch = () => { setIsSearchOpen(false); setSearchQuery(''); setSearchMatchIndex(0); matchRefsMap.current = {}; };
  const goToNext = () => { if (searchMatches.length > 0) setSearchMatchIndex(i => (i + 1) % searchMatches.length); };
  const goToPrev = () => { if (searchMatches.length > 0) setSearchMatchIndex(i => (i - 1 + searchMatches.length) % searchMatches.length); };
  const onSearchKey = (e) => {
    if (e.key === 'Enter') { e.shiftKey ? goToPrev() : goToNext(); }
    else if (e.key === 'Escape') { closeSearch(); }
  };

  const moodEmoji = getMoodEmoji(currentMood);

  return (
    <div className="flex-1 flex flex-col bg-transparent h-full overflow-hidden relative">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30">
      </div>
      {/* Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        {/* Left Side: Avatar and Name */}
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} aria-label="Buka Sidebar" className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border border-[var(--color-brand-magenta)]/50 bg-white dark:bg-[#030303] object-cover scale-110 cursor-pointer hover:scale-125 transition-transform shrink-0"
          />
          <div className="min-w-0">
            <h2 className="font-medium text-slate-800 dark:text-white text-lg truncate">{persona.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className={clsx("w-2 h-2 rounded-full transition-colors duration-300 shrink-0", isTyping ? "bg-[var(--color-brand-magenta)] animate-pulse" : "bg-green-500")}></span>
              {isTyping ? <TypingIndicator /> : <span className="truncate -translate-y-[1px]">Online {currentMood && ` ${moodEmoji}`}</span>}
            </div>
          </div>
        </div>

        {/* Right Side: Search & Memory OR Search Input */}
        <div className="flex items-center justify-end flex-1 min-w-0 h-full">
          <AnimatePresence mode="wait" initial={false}>
            {!isSearchOpen ? (
              <motion.div key="normal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
                className="flex items-center gap-2 shrink-0">
                <button onClick={() => setIsSearchOpen(true)} aria-label="Cari Pesan" className="p-2 rounded-full text-slate-500 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 transition-all" title="Search messages">
                  <Search size={18} />
                </button>
                <button onClick={() => setIsMemoryModalOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 font-semibold text-[13px] transition-colors" title="Memory Book">
                  <Book size={18} />
                  <span className="hidden md:inline">Memory</span>
                </button>
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '100%' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
                className="flex items-center gap-2 h-8 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-full px-3 w-full max-w-[240px]  ml-auto">
                <Search size={14} className="text-[var(--color-brand-magenta)] opacity-70 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchMatchIndex(0); }}
                  onKeyDown={onSearchKey}
                  placeholder="Search..."
                  className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium text-[13px] outline-none"
                />
                {normalizedQuery && (
                  <span className="text-xs font-medium text-slate-400 shrink-0 hidden sm:inline">
                    {searchMatches.length > 0 ? `${searchMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                  </span>
                )}
                <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-white/10 pl-1 ml-1 shrink-0">
                  <button onClick={goToPrev} aria-label="Hasil sebelumnya" disabled={searchMatches.length === 0} className="p-1 rounded-md text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 disabled:opacity-30 transition-colors">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={goToNext} aria-label="Hasil selanjutnya" disabled={searchMatches.length === 0} className="p-1 rounded-md text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 disabled:opacity-30 transition-colors">
                    <ChevronDown size={16} />
                  </button>
                  <button onClick={closeSearch} aria-label="Tutup pencarian" className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pt-6 pb-0 chat-scroll will-change-transform [scrollbar-gutter:stable]"
        style={{ transform: 'translateZ(0)' }}
        onScroll={handleScroll}
      >
        <div key={persona.id} className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 flex flex-col min-h-full justify-end">
          <AnimatePresence initial={false}>
            {Object.entries(groupMessagesByDate(messages.length > renderLimit ? messages.slice(-renderLimit) : messages)).map(([dateStr, msgs]) => (
              <div key={dateStr} className="relative flex flex-col w-full">
                <div className="flex justify-center mb-6 mt-2 pointer-events-none z-10">
                  <span className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {dateStr}
                  </span>
                </div>
                {msgs.map((msg, index) => {
                  const isNewMessage = Date.now() - new Date(msg.timestamp).getTime() < 1000;
                  const prevMsg = msgs[index - 1];
                  const nextMsg = msgs[index + 1];
                  const isFirstInGroup = !prevMsg || prevMsg.role !== msg.role;
                  const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;

                  return (() => {
                    const isMatch = normalizedQuery && typeof msg.content === 'string' && msg.content.toLowerCase().includes(normalizedQuery);
                    return (
                      <div
                        key={msg.id || `${dateStr}-${index}`}
                        data-search-id={isMatch ? msg.id : undefined}
                        data-msg-id={msg.id}
                        className="w-full"
                      >
                        <MessageBubble
                          message={msg}
                          persona={persona}
                          onEdit={onEdit}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          userAvatar={userAvatar}
                          searchQuery={normalizedQuery}
                          isNew={isNewMessage}
                          isLatestAI={msg.role === 'ai' && msg.id === messages[messages.length - 1]?.id}
                          onOpenGallery={handleOpenGallery}
                          onReply={(msg) => setReplyingTo(msg)}
                          allPersonas={allPersonas}
                          onMentionClick={(id) => setMentionConfirmId(id)}
                        />
                      </div>
                    );
                  })();
                })}
              </div>
            ))}
          </AnimatePresence>


          <div ref={messagesEndRef} className="h-0 shrink-0" />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => scrollToBottom(true)}
            aria-label="Scroll ke bawah"
            className="absolute bottom-32 md:bottom-36 right-6 md:right-10 z-30 p-2 md:p-2.5 rounded-full bg-white dark:bg-[#1a1a1a] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-[var(--color-brand-magenta)] transition-all hover:scale-110 active:scale-95"
          >
            <ArrowDown size={18} />
            {unreadInCurrentChat > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-brand-magenta)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1a1a1a]  animate-in zoom-in">
                {unreadInCurrentChat > 99 ? '99+' : unreadInCurrentChat}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <ChatInput
        onSendMessage={(content, image) => {
          onSendMessage(content, image, replyingTo);
          setReplyingTo(null);
        }}
        disabled={isTyping}
        replyingTo={replyingTo}
        personaName={persona.name}
        allPersonas={allPersonas}
        onCancelReply={() => setReplyingTo(null)}
        onFocus={() => {
          if (isAtBottomRef.current) {
            let count = 0;
            const interval = setInterval(() => {
              scrollToBottom(false);
              count++;
              if (count > 10) clearInterval(interval); // spam for ~500ms
            }, 50);
          }
        }}
      />
      {/* Memory Modal */}
      {isMemoryModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-200"
          onClick={() => setIsMemoryModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 max-w-md w-full  border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Book size={20} style={{ color: persona?.theme?.primary || 'var(--color-brand-magenta)' }} />
                Memory Book
              </h3>
              <button onClick={() => setIsMemoryModalOpen(false)} aria-label="Tutup Memory" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>

            {/* Affinity Bar - Compact Inline */}
            <div className="mb-5 shrink-0 flex items-center gap-3">
              <Heart size={18} style={{ color: persona?.theme?.primary || 'var(--color-brand-magenta)', fill: persona?.theme?.primary || 'var(--color-brand-magenta)' }} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Affinity Level</span>
                  <span className="text-xs font-bold" style={{ color: persona?.theme?.primary || 'var(--color-brand-magenta)' }}>{affinityLevel}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${affinityLevel}%`,
                      background: persona?.theme ? `linear-gradient(to right, ${persona.theme.primary}, ${persona.theme.secondary})` : 'var(--color-brand-magenta)'
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-3 shrink-0">
              Notes about you that <strong>{persona?.name}</strong> will always remember.
            </p>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {activeMemories.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-slate-500 italic bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                  No memories yet.<br />Try sharing something about yourself!
                </div>
              ) : (
                <div className="flex flex-col">
                  {activeMemories.map((mem, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 py-3 border-b border-slate-100 dark:border-white/5 last:border-0 group">
                      <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">{mem}</p>
                      <button
                        onClick={() => {
                          setMemories(prev => {
                            const updated = [...activeMemories];
                            updated.splice(idx, 1);
                            const newMemState = { ...prev, [persona.id]: updated };
                            saveMemories(newMemState);
                            return newMemState;
                          });
                        }}
                        aria-label="Hapus Memory"
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Mention Confirmation Modal */}
      {mentionConfirmId && (() => {
        const targetPersona = allPersonas?.find(p => p.id === mentionConfirmId);
        if (!targetPersona) return null;
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-200"
            onClick={() => setMentionConfirmId(null)}
          >
            <div
              className="bg-white dark:bg-[#0f0f0f] rounded-xl p-5 max-w-sm w-full  border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <img src={targetPersona.avatar} alt={targetPersona.name} className="w-16 h-16 rounded-full mb-3 object-cover  border border-slate-200 dark:border-white/10" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Beralih Obrolan?</h3>
                <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-5">
                  Apakah Anda ingin berpindah obrolan ke <strong>{targetPersona.name}</strong>?
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setMentionConfirmId(null)}
                    className="flex-1 py-2 rounded-lg font-bold text-[13px] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onSelectPersona(mentionConfirmId);
                      setMentionConfirmId(null);
                    }}
                    className="flex-1 py-2 rounded-lg font-bold text-[13px] text-white transition-opacity hover:opacity-90 "
                    style={{ background: `linear-gradient(to right, ${targetPersona.theme.primary}, ${targetPersona.theme.secondary})` }}
                  >
                    Ya, Beralih
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Advanced Image Gallery Modal */}
      {activeGalleryIndex !== null && (
        <ImageGalleryModal
          images={galleryImages}
          initialIndex={activeGalleryIndex}
          onClose={() => setActiveGalleryIndex(null)}
        />
      )}
    </div>
  );
}

export default memo(ChatInterface);

