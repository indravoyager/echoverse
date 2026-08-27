import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ApiErrorModal({ themeColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('API Key Required');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleApiError = (event) => {
      const rawError = event.detail?.error;
      if (!rawError) return;

      let errMsg = rawError.message || String(rawError);

      // Try parsing nested JSON error from Google SDK
      try {
        const jsonMatch = errMsg.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error && parsed.error.message) {
            errMsg = parsed.error.message;
          } else if (Array.isArray(parsed) && parsed[0]?.error?.message) {
            errMsg = parsed[0].error.message;
          }
        }
      } catch (err) {}

      // Categorize the error
      if (errMsg.includes("Fitur ini membutuhkan API Key pribadi") || errMsg.includes("API Key is missing")) {
        setTitle("API Key Required");
        setMessage("This feature requires a personal Gemini API Key. Please configure it in the Settings menu to continue.");
      } else if (errMsg.includes("API key not valid")) {
        setTitle("Invalid API Key");
        setMessage("The API key you provided is invalid. Please check your Settings and try again.");
      } else if (errMsg.includes("Quota exceeded") || errMsg.toLowerCase().includes("quota")) {
        setTitle("Quota Exceeded");
        setMessage("Your Gemini API Key has exceeded its usage quota. Please check your Google Cloud Console billing.");
      } else if (errMsg.includes("invalid authentication credentials") || errMsg.includes("OAuth")) {
        setTitle("Invalid Authentication");
        setMessage("The API key or model name provided is invalid or not recognized by Google. Please verify your API Key and Model Name in Settings.");
      } else {
        setTitle("AI Service Error");
        setMessage(errMsg);
      }

      setIsOpen(true);
    };

    window.addEventListener('gemini_api_error', handleApiError);
    return () => window.removeEventListener('gemini_api_error', handleApiError);
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white dark:bg-[#0f0f0f] rounded-2xl p-6 max-w-sm w-full  border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 text-left">
          {title}
        </h3>
        
        <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 text-left leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-4 justify-end items-center w-full">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 rounded-lg text-white font-semibold text-[14px] transition-colors "
            style={{ backgroundColor: themeColor || '#ec4899' }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
