import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Users, SendHorizontal, Loader2, Globe, Reply, X, Trash2, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import MessageBubble from '../MessageBubble';
import { loadChatWorldMessages, saveChatWorldMessages } from '../../lib/db';

export default function ChatWorldApp({ persona, isActive, unreadCount, isDarkMode, userName, userAvatar, onOpenSidebar, onOpenPersonaInfo, onNewMessage, onCloseApp }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [tagId, setTagId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeActionId, setActiveActionId] = useState(null);
  const [renderLimit, setRenderLimit] = useState(64);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const lastMessageId = useRef(null);
  const isUserScrolling = useRef(false);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const isTouchDevice = useRef(false);
  const backgroundStartTime = useRef(null);
  const lastMessageTimeRef = useRef(Date.now());
  const lastUserSentTimeRef = useRef(Date.now());
  const lastSyncTimeRef = useRef(0);

  // Use props passed from App.jsx and check for secret admin login (12-char code)
  const rawBaseName = userName || 'Guest';
  const isAdminLogin = rawBaseName === 'X7v9Pq2LmWk5';
  const baseName = isAdminLogin ? 'ivy' : rawBaseName;
  const avatar = userAvatar || null;

  const [tinyAvatar, setTinyAvatar] = useState(null);

  // Resize avatar payload to 48x48 for state optimization
  useEffect(() => {
    if (!avatar) {
      setTinyAvatar(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 48, 48);
      setTinyAvatar(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = avatar;
  }, [avatar]);

  // Load atau buat Discord-like Tag (#1234)
  useEffect(() => {
    let savedTag = localStorage.getItem('chatworld_tag');
    let savedNameForTag = localStorage.getItem('chatworld_basename');

    if (isAdminLogin) {
      savedTag = '520';
      localStorage.setItem('chatworld_tag', '520');
      localStorage.setItem('chatworld_basename', rawBaseName);
    } else if (!savedTag || savedNameForTag !== rawBaseName || savedTag === '520') {
      const newTag = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit angka acak
      localStorage.setItem('chatworld_tag', newTag);
      localStorage.setItem('chatworld_basename', rawBaseName);
      savedTag = newTag;
    }
    setTagId(savedTag);
  }, [rawBaseName, isAdminLogin]);

  // Timer cooldown pengiriman pesan
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fullUsername = `${baseName}#${tagId}`;

  // Reset tinggi textarea kalau input kosong atau berubah
  useLayoutEffect(() => {
    if (textareaRef.current) {
      if (inputValue === '') {
        textareaRef.current.style.height = 'auto';
      } else {
        // Prevent layout thrashing on every keystroke by only updating if scrollHeight > clientHeight
        if (textareaRef.current.scrollHeight > textareaRef.current.clientHeight) {
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
      }
    }
  }, [inputValue]);

  // Scroll ke bawah otomatis tiap ada pesan baru
  useLayoutEffect(() => {
    if (messages.length > 0) {
      const currentLastMsg = messages[messages.length - 1];
      const isNewMessage = currentLastMsg.id !== lastMessageId.current;

      if (isNewMessage) {
        const isFirstLoad = lastMessageId.current === null;
        lastMessageId.current = currentLastMsg.id;
        const isMe = currentLastMsg.user === fullUsername;

        if (!isFirstLoad && !isMe && onNewMessage) {
          onNewMessage();
        }

        if (isFirstLoad || !isUserScrolling.current || isMe) {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: isFirstLoad ? 'auto' : 'smooth'
            });
          }
        }
      }
    }
  }, [messages, fullUsername]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Jika jarak ke bawah kurang dari 100px, anggap sedang di bawah
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isUserScrolling.current = !isNearBottom;

    // Lazy load pesan lama saat scroll ke atas
    if (scrollTop < 300 && renderLimit < messages.length) {
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;

      setRenderLimit(prev => Math.min(prev + 16, messages.length));

      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
        }
      }, 0);
    }
  };

  // Click outside to close action menu
  useEffect(() => {
    if (!activeActionId) return;
    const handleClickOutside = () => setActiveActionId(null);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeActionId]);

  // Local Messages Fetch
  useEffect(() => {
    if (!tagId) return;

    const fetchMessages = async () => {
      setFetchError(false);
      const data = await loadChatWorldMessages();
      setMessages(data);
      setIsConnected(true);
      setLocalMode(true);
      if (data.length > 0) {
        lastMessageTimeRef.current = new Date(data[data.length - 1].timestamp || new Date()).getTime();
      }
    };

    fetchMessages();

    // Auto-Kick (Silent Reader) Check Loop - Hemat koneksi
    const interval = setInterval(() => {
      const now = Date.now();
      if (isActive !== false) {
        const timeSinceLastUserAction = now - lastUserSentTimeRef.current;
        if (timeSinceLastUserAction > 1920000) { // 32 menit
          sessionStorage.setItem('chatworld_kick_notice', 'true');
          if (onCloseApp) onCloseApp();
        }
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [tagId, isActive, onCloseApp]);

  const getDynamicCooldown = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('chatworld_daily_stats');
      let stats = { date: today, count: 0 };

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          stats = parsed;
        }
      }

      stats.count += 1;
      localStorage.setItem('chatworld_daily_stats', JSON.stringify(stats));

      // Jika sudah kirim 8 chat atau lebih hari ini, cooldown jadi 32 detik
      return stats.count >= 8 ? 32 : 8;
    } catch (e) {
      return 8; // Fallback jika localStorage error
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setMessages(prev => {
      const next = prev.filter(m => m.id !== msgId);
      saveChatWorldMessages(next);
      return next;
    });
    setActiveActionId(null);
  };
  const censorText = (text) => {
    if (!text) return text;
    // Daftar kata kotor (Bisa ditambah sesuai kebutuhan)
    const badWords = [
      'anjing', 'bangsat', 'kontol', 'memek', 'ngentot', 'babi', 'goblok', 
      'tolol', 'jembut', 'peler', 'pepek', 'bitch', 'fuck', 'shit', 'asshole', 
      'dick', 'pussy', 'cunt', 'bajingan', 'lonte', 'pelacur', 'kimak', 'pukimak', 
      'kampret', 'sialan', 'tai', 'bgst', 'njing', 'kntl', 'mmk', 'gblk', 'pantat', 'bego'
    ];
    let censored = text;
    badWords.forEach(word => {
      // Gunakan Regex \b untuk exact match (case insensitive)
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      censored = censored.replace(regex, '*'.repeat(word.length));
    });
    return censored;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || cooldown > 0) return;

    const textToSend = censorText(inputValue.trim());
    setInputValue('');
    setIsSending(true);

    const newMsg = {
      id: Date.now().toString(),
      user: fullUsername,
      message: textToSend,
      avatar: avatar,
      replyTo: replyingTo ? { id: replyingTo.id, user: replyingTo.user, content: replyingTo.message } : null,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => {
      const next = [...prev, newMsg];
      saveChatWorldMessages(next);
      return next;
    });

    setReplyingTo(null);
    setIsSending(false);
    setCooldown(getDynamicCooldown());
    lastUserSentTimeRef.current = Date.now(); // Reset timer karena user aktif ngirim chat
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      // In ChatWorld, msg.timestamp is present. If it's missing, fallback to now.
      const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
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

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30"></div>

      {/* Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} aria-label="Buka Sidebar" className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft size={24} />
          </button>

          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] object-cover scale-110 cursor-pointer hover:scale-125 transition-transform shrink-0"
            style={{ borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)` }}
          />

          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'} shrink-0`}></span>
              <span className="truncate -translate-y-[1px]">
                {localMode ? 'Local Dev Mode' : (isConnected ? 'Connected to Global Relay' : 'Connecting...')}
              </span>
            </div>
          </div>
        </div>

        {/* Indikator Online Users */}

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
          <Users size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {onlineCount} Online
          </span>
        </div>
      </div>

      {/* Tampilan Error Jika Belum Setup ENV */}
      {fetchError && (
        <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-3 z-10 relative">
          <Globe size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">Upstash Redis Configuration Missing</h3>
            <p className="text-[13px] text-red-700 dark:text-red-300">
              Please make sure you have added <strong>KV_REST_API_URL</strong> and <strong>KV_REST_API_TOKEN</strong> to your <code>.env</code> file. The Chat World requires a database to function.
            </p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-6 pb-0 relative z-10 chat-scroll will-change-transform [scrollbar-gutter:stable]"
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 flex flex-col min-h-full justify-end">
          {messages.length === 0 && !fetchError ? null : (
            Object.entries(groupMessagesByDate(messages.length > renderLimit ? messages.slice(-renderLimit) : messages)).map(([dateStr, msgs]) => (
              <div key={dateStr} className="relative flex flex-col w-full">
                <div className="flex justify-center mb-6 mt-2 pointer-events-none z-10">
                  <span className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {dateStr}
                  </span>
                </div>
                {msgs.map((msg, idx) => {
                  const isMe = msg.user === fullUsername;

                  return (
                    <div key={msg.id || idx} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'} mb-2 group/msg`}>

                  {/* Username Tag (Outside Bubble, Top) */}
                  <div className={`flex items-baseline gap-1.5 mb-1 px-1 w-full max-w-[96%] md:max-w-[85%] lg:max-w-[75%] ${isMe ? 'justify-end pr-11 md:pr-12' : 'justify-start pl-11 md:pl-12'}`}>
                    <span className={`text-[12px] font-bold truncate ${msg.user === 'ivy#520' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {msg.user.split('#')[0]}
                    </span>
                    <span className={`text-[10px] font-medium shrink-0 ${msg.user === 'ivy#520' ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      #{msg.user.split('#')[1]}
                    </span>
                  </div>

                  <div className={`flex gap-1.5 md:gap-2 max-w-[96%] md:max-w-[85%] lg:max-w-[75%] min-w-0 relative group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar (Now aligns with the Bubble/Tail) */}
                    <div className="flex-shrink-0 mt-0.5 w-9 md:w-10">
                      {isMe ? (
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)] flex items-center justify-center text-white font-bold text-xs border border-white/20 overflow-hidden">
                          {msg.avatar ? (
                            <img src={msg.avatar} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            msg.user.charAt(0).toUpperCase()
                          )}
                        </div>
                      ) : (
                        <img
                          src={msg.avatar || `https://ui-avatars.com/api/?name=${msg.user.split('#')[0]}&background=random`}
                          alt="Avatar"
                          className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] object-cover scale-110"
                        />
                      )}
                    </div>

                    {/* Message Content Area */}
                    <div
                      className={`flex flex-col min-w-0 ${isMe ? 'items-end' : 'items-start'} relative`}
                      onTouchStart={() => {
                        isTouchDevice.current = true;
                        isLongPress.current = false;
                        pressTimer.current = setTimeout(() => {
                          isLongPress.current = true;
                          setActiveActionId(msg.id || idx);
                        }, 500);
                      }}
                      onTouchEnd={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
                      onTouchMove={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveActionId(msg.id || idx);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTouchDevice.current) {
                          if (isLongPress.current) { isLongPress.current = false; return; }
                          if (activeActionId === (msg.id || idx)) setActiveActionId(null);
                        } else {
                          if (activeActionId !== (msg.id || idx)) setActiveActionId(msg.id || idx);
                          else setActiveActionId(null);
                        }
                      }}
                    >

                      {/* Bubble */}
                      <div
                        className={`relative flex flex-col px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl min-w-0 break-words ${isMe
                          ? 'text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none'
                          }`}
                        style={isMe ? { backgroundColor: persona.theme.primary } : {}}
                      >
                        {/* Chat Bubble Tail */}
                        {isMe ? (
                          <svg width="8" height="13" viewBox="0 0 8 13" className="absolute top-0 -right-[7.5px] pointer-events-none overflow-visible" style={{ color: persona.theme.primary }}>
                            <path fill="currentColor" d="M0,0 C4,0 7,1 8,4 C6,5 3,8 0,12 Z" />
                          </svg>
                        ) : (
                          <svg width="8" height="13" viewBox="0 0 8 13" className="absolute top-[-1px] -left-[7.5px] text-white dark:text-[#1a1a1a] pointer-events-none z-10 overflow-visible">
                            <path fill="currentColor" d="M8,0 C4,0 1,1 0,4 C2,5 5,8 8,12 Z" />
                            <path fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="1" transform="translate(0, 0.5)" d="M8,0 C4,0 1,1 0,4 C2,5 5,8 8,12" />
                          </svg>
                        )}

                        {/* Replied Message Snippet inside Bubble */}
                        {msg.replyTo && (
                          <div
                            className={`mb-1.5 p-2 rounded-lg border-l-4 text-left cursor-pointer transition-opacity hover:opacity-90 w-fit max-w-[240px] sm:max-w-[340px] ${isMe
                              ? "bg-black/10 border-white/40"
                              : "bg-slate-100 dark:bg-white/5 border-[var(--color-brand-magenta)]"
                              }`}
                          >
                            <div className={`text-[11px] font-bold mb-0.5 ${isMe ? "text-white" : "text-[var(--color-brand-magenta)]"}`}>
                              {msg.replyTo.user.split('#')[0]}
                            </div>
                            <div className={`text-[12px] truncate max-w-[200px] sm:max-w-[300px] ${isMe ? "text-white/80" : "text-slate-600 dark:text-slate-400"}`}>
                              {msg.replyTo.content}
                            </div>
                          </div>
                        )}

                        <div className="text-[14px] md:text-[15px] font-normal leading-relaxed md:leading-[1.6] whitespace-pre-wrap">
                          {msg.message}
                        </div>

                        {/* Timestamp */}
                        <div className={`text-[9px] mt-0.5 font-normal tracking-wide select-none self-end flex items-center gap-1 ${isMe ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 ml-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons (Hover/Click) */}
                      <div className={`absolute flex items-center gap-1.5 px-2 py-1 bg-white/90 dark:bg-[#252525]/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 transition-all duration-200 z-20 ${isMe ? "right-0 -top-10 md:top-0 md:right-full md:mr-2" : "left-0 -top-10 md:top-0 md:left-full md:ml-2"
                        } ${activeActionId === (msg.id || idx)
                          ? "opacity-100 visible translate-y-0"
                          : "opacity-0 invisible translate-y-1"
                        }`}>
                        {fullUsername === 'ivy#520' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                            className="p-1.5 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors tooltip-trigger"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                          className="p-1.5 text-slate-500 hover:text-[var(--color-brand-magenta)] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors tooltip-trigger"
                          title="Reply"
                        >
                          <Reply size={14} />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} className="h-0 shrink-0" />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-2 pb-1.5 pt-1 md:px-4 md:pb-2 md:pt-1 z-20 shrink-0 bg-transparent flex flex-col gap-1.5">
        {replyingTo && (
          <div className="max-w-4xl mx-auto w-full px-2">
            <div className="bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-[var(--color-brand-primary)]/50 rounded-xl p-3 flex items-start justify-between" style={{ "--color-brand-primary": persona.theme.primary }}>
              <div className="flex flex-col min-w-0 pr-4 border-l-4 border-[var(--color-brand-primary)] pl-3">
                <span className="text-[11px] font-bold text-[var(--color-brand-primary)] flex items-center gap-1.5">
                  <Reply size={12} />
                  Replying to {replyingTo.user.split('#')[0]}
                </span>
                <span className="text-[13px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                  {replyingTo.message}
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto w-full relative flex flex-col bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-1 md:p-1 rounded-full shadow-[0_15px_35px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.4)] focus-within:border-[var(--color-brand-primary)]/50 focus-within:shadow-[0_15px_35px_-10px_color-mix(in_srgb,var(--color-brand-primary)_30%,transparent)] transition-shadow duration-500" style={{ "--color-brand-primary": persona.theme.primary }}>
          <div className="flex items-center gap-1 md:gap-2 w-full">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message as ${fullUsername}...`}
              className="flex-1 max-h-[120px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-normal resize-none outline-none py-[7px] md:py-[9px] px-4 md:px-4 text-[15px] md:text-[14px] font-sans leading-snug disabled:opacity-50 overflow-hidden ml-2"
              rows={1}
              disabled={fetchError}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || fetchError || cooldown > 0}
              className="w-8 h-8 md:w-[32px] md:h-[32px] rounded-full bg-[var(--color-brand-primary)] hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 mr-1 flex items-center justify-center"
            >
              {cooldown > 0 ? <span className="text-[12px] font-bold">{cooldown}</span> : (isSending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} className="ml-0.5" />)}
            </button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Tip: You can hide Chat World by long-pressing its contact and moving it to archive.
          </p>
        </div>
      </div>
    </div>
  );
}
