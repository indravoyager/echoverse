import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, FileText } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled, onFocus, replyingTo, onCancelReply, personaName, allPersonas }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      textareaRef.current.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
    }
  }, [text]);

  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    matchStart: -1,
    matchEnd: -1,
  });

  const filteredPersonas = allPersonas
    ? allPersonas
      .filter(p => p.name.toLowerCase().includes(mentionState.query.toLowerCase()))
      .slice(0, 5)
    : [];

  const safeSelectedIndex = Math.min(mentionState.selectedIndex, Math.max(0, filteredPersonas.length - 1));

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = newText.slice(0, cursor);
    // Allow any characters except @ and newline, up to 30 characters.
    const match = /(?:^|\\s)@([^@\\n]{0,30})$/.exec(textBeforeCursor);

    if (match) {
      const query = match[1];
      setMentionState(prev => ({
        ...prev,
        isOpen: true,
        query,
        matchStart: cursor - query.length - 1,
        matchEnd: cursor,
        selectedIndex: prev.isOpen ? prev.selectedIndex : 0
      }));
    } else {
      setMentionState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const insertMention = (persona) => {
    const before = text.slice(0, mentionState.matchStart);
    const after = text.slice(mentionState.matchEnd);
    const insertText = `@${persona.name} `;
    const newText = before + insertText + after;
    setText(newText);
    setMentionState(prev => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionState.matchStart + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImage({ url: dataUrl, type: 'image/jpeg', name: file.name });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or TXT
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage({
          url: event.target.result,
          type: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((text.trim() || image) && !disabled) {
      onSendMessage(text, image);
      setText('');
      setImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (mentionState.isOpen && filteredPersonas.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: Math.max(0, safeSelectedIndex - 1) }));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: Math.min(filteredPersonas.length - 1, safeSelectedIndex + 1) }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredPersonas[safeSelectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, isOpen: false }));
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-2 pb-1 pt-1 md:px-4 md:pb-2 md:pt-1 z-20 pointer-events-none bg-transparent">
      <div className="max-w-4xl w-full mx-auto relative pointer-events-auto">
        {image && (
          <div className="absolute bottom-full left-4 md:left-6 mb-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="relative inline-flex items-center gap-2.5 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 pr-4 rounded-full ">
              {image.type?.startsWith('image/') || typeof image === 'string' ? (
                <img src={image.url || image} alt="Preview" className="h-10 w-10 object-cover rounded-full border border-slate-200 dark:border-white/10" />
              ) : (
                <div className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[var(--color-brand-magenta)]" />
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                {image.name || "Attachment"}
              </span>
              <button
                type="button"
                aria-label="Hapus lampiran"
                onClick={() => setImage(null)}
                className="absolute -top-1 -right-1 bg-slate-800 dark:bg-slate-700 text-white rounded-full p-1 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors "
              >
                <X size={10} />
              </button>
            </div>
          </div>
        )}

        {replyingTo && (
          <div className="absolute bottom-full left-4 md:left-6 mb-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="relative inline-flex flex-col bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-2.5 pr-8 rounded-xl  border-l-4 border-l-[var(--color-brand-magenta)]">
              <span className="text-[11px] font-bold text-[var(--color-brand-magenta)] mb-0.5">
                Replying to {replyingTo.role === 'user' ? 'You' : personaName || 'AI'}
              </span>
              <span className="text-[12px] text-slate-600 dark:text-slate-400 max-w-[200px] sm:max-w-[300px] truncate">
                {replyingTo.content || "Attachment"}
              </span>
              <button
                type="button"
                onClick={onCancelReply}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                title="Cancel reply"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Mention Popup */}
        {mentionState.isOpen && filteredPersonas.length > 0 && (
          <div className="absolute bottom-full left-4 md:left-6 mb-3 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl  w-[250px] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {filteredPersonas.map((p, index) => (
              <button
                key={p.id}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${index === safeSelectedIndex
                    ? 'bg-slate-100 dark:bg-white/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                onClick={() => insertMention(p)}
                onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: index }))}
              >
                <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-1 md:p-1 rounded-full shadow-[0_15px_35px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.4)] focus-within:border-[var(--color-brand-magenta)]/50 focus-within:shadow-[0_15px_35px_-10px_color-mix(in_srgb,var(--color-brand-magenta)_30%,transparent)] transition-all duration-500"
        >
          <div className="flex items-center gap-1 md:gap-2 w-full">
            <input
              type="file"
              accept="image/*,.pdf,.txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              type="button"
              aria-label="Lampirkan gambar"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1 md:p-1.5 rounded-full text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex-shrink-0 ml-1"
              title="Attach an image"
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder={image ? "Add a message..." : "Type your message..."}
              className="flex-1 max-h-[120px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-normal resize-none outline-none py-[7px] md:py-[9px] px-3 md:px-3 text-[15px] md:text-[14px] font-sans leading-snug disabled:opacity-50 overflow-hidden"
              rows={1}
            />

            <button
              type="submit"
              aria-label="Kirim pesan"
              onMouseDown={(e) => e.preventDefault()}
              disabled={(!text.trim() && !image) || disabled}
              className="w-6 h-6 md:w-[28px] md:h-[28px] rounded-full bg-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 mr-1 flex items-center justify-center"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
