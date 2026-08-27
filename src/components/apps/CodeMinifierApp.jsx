import { useState } from 'react';
import { SidebarLayout } from '../theme/SidebarLayout';
import { CustomSelect } from '../theme/CustomSelect';
import { Button } from '../theme/Button';
import { Copy, Trash2, Check, FileJson, Code, LayoutTemplate, FileCode2, Wand2, Paintbrush, Zap, Sparkles } from 'lucide-react';
import { useCopyToClipboard } from '../theme/useCopyToClipboard';

export default function CodeMinifierApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const { copied: isCopied, copy } = useCopyToClipboard();

  const minifyJS = (code) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/ ([=+\-*/<>!&|{}();,\[\]]) /g, '$1') // Remove spaces around operators
      .replace(/([=+\-*/<>!&|{}();,\[\]]) /g, '$1')
      .replace(/ ([=+\-*/<>!&|{}();,\[\]])/g, '$1')
      .trim();
  };

  const minifyCSS = (code) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*{\s*/g, '{') // Remove space around braces
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';') // Remove space around semicolons
      .replace(/\s*:\s*/g, ':') // Remove space around colons
      .trim();
  };

  const minifyHTML = (code) => {
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const detectLanguage = (code) => {
    if (code.includes('</div>') || code.includes('</script>') || code.includes('</body>')) return 'html';
    if (code.includes('{') && code.includes(';') && (code.includes('color:') || code.includes('margin:') || code.includes('padding:'))) return 'css';
    return 'js'; // default fallback
  };

  const handleMinify = () => {
    if (!inputCode.trim()) return;

    let langToUse = language;
    if (langToUse === 'auto') {
      langToUse = detectLanguage(inputCode);
    }

    let minified = '';
    try {
      if (langToUse === 'js') minified = minifyJS(inputCode);
      else if (langToUse === 'css') minified = minifyCSS(inputCode);
      else if (langToUse === 'html') minified = minifyHTML(inputCode);

      setOutputCode(minified);
    } catch (error) {
      setOutputCode('Error minifying code. Ensure syntax is valid.');
    }
  };

  const copyToClipboard = () => copy(outputCode);

  const handleReset = () => {
    setInputCode('');
    setOutputCode('');
  };

  const languageOptions = [
    { value: 'auto', label: 'Auto-Detect', icon: Wand2 },
    { value: 'js', label: 'JavaScript (.js)', icon: FileJson },
    { value: 'css', label: 'CSS (.css)', icon: Paintbrush },
    { value: 'html', label: 'HTML (.html)', icon: LayoutTemplate }
  ];

  return (
    <SidebarLayout
      persona={persona}
      onOpenSidebar={onOpenSidebar}
      onOpenPersonaInfo={onOpenPersonaInfo}
      onReset={handleReset}
      resetLabel="Clear Workspace"
      sidebarContent={
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
          <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center rounded-t-xl shrink-0">
            <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Code className="w-4 h-4 text-slate-400" />
              Configuration
            </h3>
          </div>
          <div className="p-3.5 flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Language</label>
              <CustomSelect
                value={language}
                onChange={setLanguage}
                options={languageOptions}
                themeColor={persona.theme.primary}
              />
            </div>

            <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><FileCode2 size={12} /> Supported Formats</h4>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium">JS, CSS, HTML. Removes comments and whitespace.</p>
            </div>

            <Button
              variant="full-action"
              onClick={handleMinify}
              disabled={!inputCode.trim()}
              themeColor={persona.theme.primary}
              icon={Zap}
              label="MINIFY CODE"
            />
          </div>
        </div>
      }
      mainContent={
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
          {/* Raw Input */}
          <div className="lg:flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-400" /> Raw Input Code
              </h3>
              {inputCode && (
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                  {inputCode.length.toLocaleString()} CHARS
                </span>
              )}
            </div>
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Paste your unminified HTML, CSS, or JS code here..."
              className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-[13px] font-mono text-slate-800 dark:text-slate-200 focus:ring-0 custom-scrollbar leading-relaxed min-h-[200px]"
            />
          </div>

          {/* Minified Output */}
          <div className="lg:flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative">
            <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: persona.theme.primary }} /> Minified Output
              </h3>
              {outputCode && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 tracking-wider">
                    SAVED: {inputCode.length > 0 ? Math.round((1 - (outputCode.length / inputCode.length)) * 100) : 0}%
                    ({(inputCode.length - outputCode.length).toLocaleString()} chars)
                  </span>
                  <Button
                    onClick={copyToClipboard}
                    variant="header-action"
                    themeColor={isCopied ? '#10b981' : persona.theme.primary}
                    icon={isCopied ? Check : Copy}
                    label={isCopied ? 'COPIED!' : 'COPY'}
                  />
                </div>
              )}
            </div>
            <textarea
              readOnly
              value={outputCode}
              placeholder="Minified result will appear here..."
              className="flex-1 w-full bg-transparent resize-none p-4 focus:outline-none text-[13px] font-mono text-slate-800 dark:text-slate-200 focus:ring-0 custom-scrollbar leading-relaxed min-h-[200px]"
            />
          </div>
        </div>
      }
    />
  );
}
