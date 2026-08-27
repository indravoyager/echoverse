import { useState, useRef, useEffect, useMemo } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Pencil, X, Check, Copy, Globe, ChevronDown, Loader2, Reply } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);

// Rehype plugin: walk HTML AST and wrap query matches in <mark>
const makeHighlightPlugin = (query) => {
  if (!query) return null;
  return () => (tree) => {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    function walk(node, parent, idx) {
      if (node.type === 'text' && node.value) {
        const matchRegex = new RegExp(`(${escaped})`, 'gi');
        if (matchRegex.test(node.value)) {
          const parts = node.value.split(new RegExp(`(${escaped})`, 'gi')).filter(Boolean);
          const exact = new RegExp(`^${escaped}$`, 'i');
          const newNodes = parts.map(part =>
            exact.test(part)
              ? { type: 'element', tagName: 'mark', properties: { className: ['search-highlight'] }, children: [{ type: 'text', value: part }] }
              : { type: 'text', value: part }
          );
          if (parent && typeof idx === 'number') parent.children.splice(idx, 1, ...newNodes);
        }
      }
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) walk(node.children[i], node, i);
      }
    }
    walk(tree, null, null);
  };
};

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const codeProps = children.props || {};
  const className = codeProps.className || '';
  const match = /language-(\w+)/.exec(className);
  const codeContent = codeProps.children || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(codeContent).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = match ? match[1] : 'text';

  return (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-white/10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{language}</span>
        <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
        PreTag="div"
      >
        {String(codeContent).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

export default function MessageBubble({ message, persona, onEdit, onReply, onOpenGallery, isFirstInGroup = true, isLastInGroup = true, userAvatar, searchQuery = '', isNew = false, isLatestAI = false, allPersonas, onMentionClick }) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(message.content);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const isTouchDevice = useRef(false);
  const textareaRef = useRef(null);

  const processedContent = useMemo(() => {
    let content = displayedContent;
    if (content && allPersonas && allPersonas.length > 0) {
      const sorted = [...allPersonas].sort((a,b) => b.name.length - a.name.length);
      sorted.forEach(p => {
        const regex = new RegExp(`(^|[\\s.,!?"'(\\[\\-*_])@(${p.name})(?=[\\s.,!?"')\\]\\-*_]|$)`, 'gi');
        content = content.replace(regex, `$1[**@$2**](persona:${p.id})`);
      });
    }
    return content;
  }, [displayedContent, allPersonas]);

  // Sync displayedContent with incoming message content
  useEffect(() => {
    setDisplayedContent(message.content);
    setEditContent(message.content);
  }, [message.content]);

  // Dispatch custom scroll event when new message appears instantly
  useEffect(() => {
    if (isNew && !isUser) {
      window.dispatchEvent(new CustomEvent('ai-typing-step'));
    }
  }, [isNew, isUser]);

  // Close actions when clicking outside
  const bubbleRef = useRef(null);
  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActions]);

  const handleTouchStart = () => {
    isTouchDevice.current = true;
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowActions(true);
    }, 500); // Long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={twMerge(clsx(
        "flex w-full [-webkit-touch-callout:none]",
        isUser ? "justify-end" : "justify-start",
        isLastInGroup ? "mb-3" : "mb-0.5"
      ))}
    >
      <div className={twMerge(clsx(
        "flex max-w-[96%] md:max-w-[85%] lg:max-w-[75%] gap-1.5 md:gap-2 min-w-0 relative group",
        isUser ? "flex-row-reverse" : "flex-row"
      ))}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5 w-9 md:w-10">
          {isFirstInGroup ? (
            isUser ? (
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)] flex items-center justify-center text-white font-bold text-xs border border-white/20 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  "U"
                )}
              </div>
            ) : (
              <img
                src={persona?.avatar}
                alt={persona?.name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] object-cover scale-110"
              />
            )
          ) : (
            <div className="w-9 h-9 md:w-10 md:h-10"></div>
          )}
        </div>

        <div
          ref={bubbleRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowActions(true);
          }}
          onClick={() => {
            if (isTouchDevice.current) {
              if (isLongPress.current) {
                isLongPress.current = false;
                return;
              }
              if (showActions) setShowActions(false);
            } else {
              if (!showActions) setShowActions(true);
              else setShowActions(false);
            }
          }}
          className={twMerge(clsx(
            "transition-shadow min-w-0 break-words relative flex flex-col",
            message.image ? "p-1 w-fit max-w-[280px] sm:max-w-[380px]" : "px-3.5 py-1.5 md:px-4 md:py-2",
            isUser
              ? "bg-[var(--color-brand-magenta)] text-white"
              : "bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200",
            (() => {
              const base = "rounded-xl";
              if (isUser) {
                if (isFirstInGroup && isLastInGroup) return `${base} rounded-tr-none`;
                if (isFirstInGroup && !isLastInGroup) return `${base} rounded-tr-none rounded-br-sm`;
                if (!isFirstInGroup && !isLastInGroup) return `${base} rounded-tr-sm rounded-br-sm`;
                if (!isFirstInGroup && isLastInGroup) return `${base} rounded-tr-sm`;
              } else {
                if (isFirstInGroup && isLastInGroup) return `${base} rounded-tl-none`;
                if (isFirstInGroup && !isLastInGroup) return `${base} rounded-tl-none rounded-bl-sm`;
                if (!isFirstInGroup && !isLastInGroup) return `${base} rounded-tl-sm rounded-bl-sm`;
                if (!isFirstInGroup && isLastInGroup) return `${base} rounded-tl-sm`;
              }
            })(),
            isEditing && isUser && "w-full sm:w-[400px]"
          ))}
        >
          {/* Chat Bubble Tail */}
          {isFirstInGroup && (
            isUser ? (
              <svg width="8" height="13" viewBox="0 0 8 13" className="absolute top-0 -right-[7.5px] text-[var(--color-brand-magenta)] pointer-events-none overflow-visible">
                <path fill="currentColor" d="M0,0 C4,0 7,1 8,4 C6,5 3,8 0,12 Z" />
              </svg>
            ) : (
              <svg width="8" height="13" viewBox="0 0 8 13" className="absolute top-[-1px] -left-[7.5px] text-white dark:text-[#1a1a1a] pointer-events-none z-10 overflow-visible">
                <path fill="currentColor" d="M8,0 C4,0 1,1 0,4 C2,5 5,8 8,12 Z" />
                <path fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="1" transform="translate(0, 0.5)" d="M8,0 C4,0 1,1 0,4 C2,5 5,8 8,12" />
              </svg>
            )
          )}

          {/* Replied Message Snippet */}
          {message.replyTo && (
            <div 
              className={twMerge(clsx(
                "mb-1.5 p-2 rounded-lg border-l-4 text-left cursor-pointer transition-opacity hover:opacity-90 max-w-[280px] sm:max-w-[380px]",
                isUser 
                  ? "bg-black/10 border-white/40" 
                  : "bg-slate-100 dark:bg-white/5 border-[var(--color-brand-magenta)]"
              ))}
              onClick={(e) => {
                e.stopPropagation();
                // We'll scroll to the original message if data-search-id or similar is found
                // The ChatInterface uses data-search-id for highlighting, we can use it, or just data-msg-id
                const el = document.querySelector(`[data-msg-id="${message.replyTo.id}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <div className={clsx(
                "text-[11px] font-bold mb-0.5",
                isUser ? "text-white" : "text-[var(--color-brand-magenta)]"
              )}>
                {message.replyTo.role === 'user' ? 'You' : persona?.name || 'AI'}
              </div>
              <div className={clsx(
                "text-[12px] truncate max-w-[200px] sm:max-w-[300px]",
                isUser ? "text-white/80" : "text-slate-600 dark:text-slate-400"
              )}>
                {message.replyTo.content || 'Attachment'}
              </div>
            </div>
          )}

          {/* Uploaded Attachment */}
          {message.image && (
            <>
              {typeof message.image === 'string' || message.image.type?.startsWith('image/') ? (
                <div className={message.content ? "mb-0.5" : ""}>
                  <img
                    src={typeof message.image === 'string' ? message.image : message.image.url}
                    alt="User uploaded attachment"
                    draggable="false"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (onOpenGallery) onOpenGallery(message.image);
                    }}
                    onLoad={() => window.dispatchEvent(new Event('chat-image-loaded'))}
                    className="w-full max-h-[400px] object-cover rounded-xl  hover:opacity-90 transition-opacity cursor-zoom-in bg-black/5 dark:bg-black/20"
                  />
                </div>
              ) : (
                <div className={twMerge("flex items-center gap-3 bg-white/20 dark:bg-black/20 p-3 rounded-xl border border-white/30 dark:border-white/5  max-w-[250px]", message.content ? "mb-0.5" : "")}>
                  <div className="p-2 bg-white/20 dark:bg-black/20 rounded-lg text-white">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate text-white">{message.image.name}</span>
                    <span className="text-[10px] text-white/70">Uploading...</span>
                  </div>
                </div>
              )}
            </>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2.5 w-full animate-in fade-in duration-200">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  // Move cursor to end
                  const len = e.target.value.length;
                  e.target.setSelectionRange(len, len);
                }}
                className="w-full bg-black/10 hover:bg-black/15 focus:bg-black/20 text-white placeholder-white/50 border border-black/5 focus:border-white/20 rounded-xl p-3 outline-none transition-all resize-none text-[14px] md:text-[15px] font-medium leading-relaxed custom-scrollbar"
                rows={1}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                  className="px-4 py-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                  disabled={!editContent.trim() || editContent === message.content}
                  className="px-4 py-1.5 rounded-full bg-white text-[var(--color-brand-magenta)] hover:bg-slate-100 disabled:opacity-50 disabled:bg-white/50 disabled:text-[var(--color-brand-magenta)]/50 text-xs font-bold transition-all  flex items-center gap-1.5"
                >
                  <Check size={14} className="stroke-[3]" /> Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Markdown Content */}
              <div className={twMerge(clsx(
                "prose prose-sm max-w-none text-[14px] md:text-[15px] font-normal leading-relaxed md:leading-[1.6] prose-ul:my-1 prose-li:my-0.5 prose-headings:font-bold prose-strong:font-bold select-none sm:select-text [-webkit-touch-callout:none]",
                message.image ? "prose-p:m-0" : "prose-p:my-0.5",
                isUser ? "prose-invert text-white prose-p:text-white prose-headings:text-white prose-a:text-sky-300 hover:prose-a:text-sky-100 prose-a:underline prose-strong:text-white" : "prose-slate dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300 prose-a:underline prose-code:text-[var(--color-brand-purple)]",
                message.image && message.content && "px-1.5 pb-0 pt-0.5 md:px-2 md:pb-0 md:pt-0.5"
              ))}>
                <ReactMarkdown
                  urlTransform={(value) => value}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, searchQuery ? makeHighlightPlugin(searchQuery) : undefined].filter(Boolean)}
                  components={{
                    a: ({ node, href, children, ...props }) => {
                      if (href?.startsWith('persona:')) {
                        const targetId = href.split(':')[1];
                        return (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMentionClick?.(targetId); }}
                            className="inline-flex items-center gap-1 bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)] font-bold px-1.5 py-0 rounded-md hover:bg-[var(--color-brand-magenta)]/20 transition-colors mx-0.5"
                          >
                            {children}
                          </button>
                        );
                      }
                      return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
                    },
                    pre: CodeBlock,
                    code: ({ node, className, children, ...props }) => (
                      <code className={clsx(className, "bg-black/5 dark:bg-[#252525] px-1.5 py-0.5 rounded-md text-[var(--color-brand-magenta)] font-mono text-xs before:content-none after:content-none")} {...props}>
                        {children}
                      </code>
                    ),
                    img: ({ node, src, alt, ...props }) => {
                      let fixedSrc = src;
                      if (src && src.includes('pollinations.ai')) {
                        try { fixedSrc = encodeURI(decodeURI(src)); }
                        catch (e) { fixedSrc = encodeURI(src); }
                      }
                      return (
                        <div className="relative my-3 rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse -z-10 flex items-center justify-center">
                            <span className="text-xs text-slate-400 font-bold">Loading...</span>
                          </div>
                          <img
                            src={fixedSrc}
                            alt={alt || "AI Image"}
                            draggable="false"
                            className="max-w-full h-auto object-cover border border-slate-200 dark:border-white/10  [-webkit-touch-callout:none]"
                            style={{ minHeight: '150px' }}
                            onLoad={() => window.dispatchEvent(new Event('chat-image-loaded'))}
                            {...props}
                          />
                        </div>
                      );
                    }
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>

              {/* Search Sources Indicator */}
              {!isUser && message.searchData && (
                <div className="mt-3 border-t border-slate-200 dark:border-white/10 pt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsSourcesExpanded(!isSourcesExpanded); }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[var(--color-brand-magenta)] dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    <Globe size={12} />
                    <span>Searching the Web</span>
                    <ChevronDown size={12} className={clsx("transition-transform", isSourcesExpanded && "rotate-180")} />
                  </button>

                  {isSourcesExpanded && message.searchData.sources && (
                    <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {message.searchData.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-slate-50 dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5 hover:border-[var(--color-brand-magenta)]/50 transition-colors truncate"
                          title={source.title}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">{source.title}</span>
                          <span className="text-slate-400 dark:text-slate-500 block truncate mt-0.5">{source.uri}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className={twMerge(clsx(
                "text-[9px] mt-0.5 font-normal tracking-wide select-none self-end flex items-center gap-1",
                isUser ? "text-white/70" : "text-slate-400 dark:text-slate-500",
                message.image && "pr-1.5"
              ))}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isUser && <Check size={10} className="opacity-80" />}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className={clsx(
            "absolute flex items-center gap-1.5 px-2 py-1 bg-white/90 dark:bg-[#252525]/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10  transition-all duration-200 z-20",
            isUser ? "right-0 -top-10 md:top-0 md:right-full md:mr-2" : "left-0 -top-10 md:top-0 md:left-full md:ml-2",
            showActions && !isEditing ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-1"
          )}>
            {onReply && (
              <button
                onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
                className="p-1.5 text-slate-500 hover:text-[var(--color-brand-magenta)] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors tooltip-trigger"
                title="Reply"
              >
                <Reply size={14} />
              </button>
            )}
            {isUser && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowActions(false); }}
                className="p-1.5 text-slate-500 hover:text-[var(--color-brand-magenta)] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors tooltip-trigger"
                title="Edit Message"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(message.content);
                setShowActions(false);
              }}
              className="p-1.5 text-slate-500 hover:text-[var(--color-brand-magenta)] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors tooltip-trigger"
              title="Salin Teks"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
