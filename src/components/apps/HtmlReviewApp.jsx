import { useState, useRef, useCallback, useMemo } from 'react';
import { RotateCcw, Copy, Check, Code2, Eye, Maximize2, Minimize2, Play, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: #0f172a;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.1) 0px, transparent 50%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #f8fafc;
      overflow: hidden;
    }

    .portfolio-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .greeting-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: #818cf8;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #818cf8;
      border-radius: 50%;
      box-shadow: 0 0 8px #818cf8;
    }

    h1 {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .highlight {
      background: linear-gradient(to right, #818cf8, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p.description {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 32px;
    }

    .skill-tag {
      background: rgba(255, 255, 255, 0.07);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .skill-tag:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-primary {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(to right, #6366f1, #ec4899);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-2px);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      transform: translateY(-2px);
    }

    .btn-secondary svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
  </style>
</head>
<body>
  <div class="portfolio-card">
    <div class="greeting-tag">
      <div class="dot"></div>
      <span>Available for freelance</span>
    </div>
    
    <h1>Hello, I'm <br><span class="highlight">Ellie Aturai</span></h1>
    <p class="description">A passionate Frontend Engineer crafting fluid web experiences, modern user interfaces, and high-fidelity code bases.</p>
    
    <div class="skills-grid">
      <span class="skill-tag">React.js</span>
      <span class="skill-tag">TailwindCSS</span>
      <span class="skill-tag">Vite</span>
      <span class="skill-tag">Figma</span>
      <span class="skill-tag">Web Animation</span>
    </div>
    
    <div class="action-group">
      <a href="#" class="btn-primary">
        <span>Say Hello</span>
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </a>
      <a href="#" class="btn-secondary" title="View GitHub">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      </a>
    </div>
  </div>
</body>
</html>`;

function highlightHTML(rawSrc) {
  // Convert leading spaces to indent markers
  const INDENT_MARKER = '\uE000';
  const src = rawSrc.split('\n').map(line => {
    const match = line.match(/^ +/);
    if (match) {
      return match[0].replace(/ {2}/g, INDENT_MARKER) + line.substring(match[0].length);
    }
    return line;
  }).join('\n');

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const C = (color, text) => '<span style="color:' + color + '">' + text + '</span>';

  // Brighter VS Code Dark+ Palette (Matches user screenshot perfectly but more vibrant)
  const T = {
    text: '#ffffff',     // Brighter white for brackets, braces, and text
    tag: '#5cc1ff',      // Bright Blue (html, head, style, <, >)
    attr: '#82d8ff',     // Bright Light Blue (class, id)
    str: '#f5a882',      // Bright Orange/Peach (strings)
    comment: '#82d966',  // Bright Green
    doctype: '#5cc1ff',  // Bright Blue
    prop: '#82d8ff',     // Bright Light Blue (margin, padding)
    num: '#c3e88d',      // Bright Light Green (0, 20px)
    hex: '#f5a882',      // Bright Orange/Peach (#667eea)
    sel: '#f2cc81',      // Bright Gold (.card, body, h1)
    func: '#82d8ff',     // Bright Light Blue (rgba, linear-gradient)
    val: '#f5a882'       // Bright Orange/Peach (center, flex, border-box)
  };

  const out = [];
  let i = 0;
  let inStyle = false;

  while (i < src.length) {
    // HTML comment
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      const ce = end === -1 ? src.length : end + 3;
      out.push(C(T.comment, esc(src.slice(i, ce))));
      i = ce;
    }
    // Tag
    else if (src[i] === '<') {
      const gt = src.indexOf('>', i);
      if (gt === -1) { out.push(C(T.text, esc(src.slice(i)))); break; }
      const tag = src.slice(i, gt + 1);

      if (/^<style/i.test(tag)) inStyle = true;
      if (/^<\/style/i.test(tag)) inStyle = false;

      // DOCTYPE
      if (/^<!doctype/i.test(tag)) {
        out.push(C(T.doctype, esc(tag)));
      } else {
        const m = tag.match(/^(<\/?)(\w[\w-]*)([\s\S]*?)(\/?>)$/);
        if (m) {
          out.push(C(T.tag, esc(m[1]))); // < or </
          out.push(C(T.tag, esc(m[2]))); // tag name
          // Parse attributes
          const attrs = m[3];
          let ai = 0;
          while (ai < attrs.length) {
            const ws = attrs.slice(ai).match(/^\s+/);
            if (ws) { out.push(ws[0]); ai += ws[0].length; continue; }
            // attr="val" or attr='val'
            const av = attrs.slice(ai).match(/^([\w-]+)(=)("[^"]*"|'[^']*')/);
            if (av) {
              out.push(C(T.attr, av[1]));
              out.push(C(T.text, '='));
              out.push(C(T.str, esc(av[3])));
              ai += av[0].length;
              continue;
            }
            // standalone attr
            const ao = attrs.slice(ai).match(/^[\w-]+/);
            if (ao) { out.push(C(T.attr, ao[0])); ai += ao[0].length; continue; }
            out.push(esc(attrs[ai]));
            ai++;
          }
          out.push(C(T.tag, esc(m[4]))); // > or />
        } else {
          out.push(C(T.tag, esc(tag)));
        }
      }
      i = gt + 1;
    }
    // Plain text / CSS content
    else {
      const nt = src.indexOf('<', i);
      const te = nt === -1 ? src.length : nt;
      const textContent = src.slice(i, te);

      if (inStyle) {
        let css = esc(textContent);
        // Split CSS into Selector and Body { ... } blocks for perfect coloring
        css = css.replace(/([^{]+)(\{)([^}]+)(\})/g, (match, selector, openBrace, body, closeBrace) => {
          // Selectors (.card, body, h1) -> Gold
          let s = selector.replace(/([*.#a-zA-Z0-9_-]+)/g, C(T.sel, '$1'));

          // Body (properties, values, numbers, hex, functions)
          let b = body.replace(/("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8})|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|deg|s|ms)?\b)|([a-zA-Z-]+)(?=\s*:)|([a-zA-Z-]+)(?=\s*\()|([a-zA-Z-]+)/g, (m, str, hex, num, prop, func, val) => {
            if (str) return C(T.str, str);
            if (hex) return C(T.hex, hex);
            if (num) return C(T.num, num);
            if (prop) return C(T.prop, prop);
            if (func) return C(T.func, func);
            if (val) return C(T.val, val);
            return m;
          });

          return s + C(T.text, openBrace) + b + C(T.text, closeBrace);
        });
        out.push(css);
      } else {
        out.push(C(T.text, esc(textContent)));
      }
      i = te;
    }
  }

  let result = out.join('');
  // Replace indent markers with actual styled spans. 
  // Using padding-block to extend the border vertically across the line-height gap.
  // Using a solid color (#404040 is ~15% white over #1e1e1e) so overlaps don't darken.
  result = result.replace(/\uE000/g, '<span style="border-left: 1px solid #404040; padding-top: 0.4em; padding-bottom: 0.4em; margin-left: -1px;">  </span>');
  return result;
}

import { useCopyToClipboard } from '../theme/useCopyToClipboard';

export default function HtmlReviewApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [previewHtml, setPreviewHtml] = useState(DEFAULT_HTML);
  const [activeTab, setActiveTab] = useState('split');
  const { copied, copy } = useCopyToClipboard();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const textareaRef = useRef(null);

  const handleReset = () => {
    if (confirm('Reset to the default HTML template?')) {
      setHtml(DEFAULT_HTML);
      setPreviewHtml(DEFAULT_HTML);
    }
  };

  const handleRun = () => {
    setPreviewHtml(html);
  };

  const handleCopy = useCallback(() => {
    copy(html);
  }, [html, copy]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      setHtml(prev => prev.substring(0, start) + '  ' + prev.substring(end));

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const highlighted = useMemo(() => highlightHTML(html), [html]);
  const isDirty = html !== previewHtml;

  // Process preview HTML to inject safety scripts preventing routing loops and forcing external links to _blank
  const processedPreviewHtml = useMemo(() => {
    if (!previewHtml) return '';
    const injectScript = `
      <script>
        document.addEventListener('click', function(e) {
          var anchor = e.target.closest('a');
          if (anchor) {
            var href = anchor.getAttribute('href');
            if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) {
              e.preventDefault();
            } else {
              anchor.target = '_blank';
            }
          }
        });
      </script>
    `;
    if (previewHtml.includes('</body>')) {
      return previewHtml.replace('</body>', injectScript + '</body>');
    }
    return previewHtml + injectScript;
  }, [previewHtml]);

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      {/* Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full">
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
        <div className="flex items-center gap-2">
          <div className="md:hidden flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 mr-2">
            <button onClick={() => setActiveTab('edit')} className={clsx("p-1.5 rounded text-slate-500", activeTab === 'edit' && "bg-white dark:bg-slate-800  text-slate-800 dark:text-white")}><Code2 size={16} /></button>
            <button onClick={() => setActiveTab('preview')} className={clsx("p-1.5 rounded text-slate-500", activeTab === 'preview' && "bg-white dark:bg-slate-800  text-slate-800 dark:text-white")}><Eye size={16} /></button>
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">

          {/* Code Editor (Left Half) */}
          <div className={clsx(
            "w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 shrink-0 min-h-[400px]",
            activeTab === 'preview' ? "hidden lg:flex" : "flex",
            activeTab === 'edit' ? "lg:w-full" : "lg:w-1/2"
          )}>
            <div className="h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center px-4 shrink-0 rounded-t-xl">
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Code2 size={14} style={{ color: persona.theme.primary }} /> HTML Code
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  {html.length.toLocaleString()} chars
                </span>
                <button
                  onClick={handleRun}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 active:scale-95 uppercase tracking-widest"
                  style={{ backgroundColor: persona.theme.primary }}
                  title="Run Code"
                >
                  <Play size={14} className="fill-current" />
                  Run
                </button>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden rounded-b-xl">
              {/* Highlighted layer behind */}
              <pre
                className="absolute inset-0 p-5 font-mono text-[13px] leading-relaxed overflow-auto custom-scrollbar pointer-events-none whitespace-pre-wrap break-words m-0"
                style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4'
                }}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
              />
              {/* Transparent textarea on top */}
              <textarea
                ref={textareaRef}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={(e) => {
                  const pre = e.target.previousElementSibling;
                  if (pre) {
                    pre.scrollTop = e.target.scrollTop;
                    pre.scrollLeft = e.target.scrollLeft;
                  }
                }}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent focus:outline-none resize-none font-mono p-5 text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                placeholder="Type your HTML here..."
                spellCheck="false"
                style={{ caretColor: '#fff', tabSize: 2 }}
              />
            </div>
          </div>

          {/* Preview (Right Half) */}
          <div
            className={clsx(
              "w-full bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[400px]",
              activeTab === 'edit' ? "hidden lg:flex lg:w-1/2" : "flex flex-1"
            )}
          >
            <div className="h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center px-4 shrink-0 rounded-t-xl">
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Play size={14} className={isDirty ? "text-amber-500" : "text-green-500"} />
                Output {isDirty && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider ml-1 bg-amber-500/10 px-2 py-0.5 rounded-full">Stale</span>}
              </span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
            <div className="flex-1 relative bg-white rounded-b-xl overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={processedPreviewHtml}
                title="HTML Preview"
                className="w-full h-full border-0 absolute inset-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Preview Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col">
          <div className="h-[40px] bg-slate-900 flex justify-between items-center px-4 shrink-0">
            <span className="text-[13px] font-bold text-white flex items-center gap-2">
              <Eye size={14} /> Fullscreen Output
              {isDirty && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider ml-1 bg-amber-500/10 px-2 py-0.5 rounded-full">Stale</span>}
            </span>
            <div className="flex items-center gap-3">
              {isDirty && (
                <button
                  onClick={handleRun}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 active:scale-95 uppercase tracking-widest"
                  style={{ backgroundColor: persona.theme.primary }}
                  title="Run Code"
                >
                  <Play size={14} className="fill-current" />
                  Run
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/10 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
              >
                <Minimize2 size={14} /> Exit
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <iframe
              srcDoc={processedPreviewHtml}
              title="HTML Preview Fullscreen"
              className="w-full h-full border-0 absolute inset-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
