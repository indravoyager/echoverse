import { useState, useEffect } from 'react';
import { Monitor, Lock, Heart, Compass, Sparkles, SquarePen, Leaf, Cpu, ArrowLeft } from 'lucide-react';

export default function HomeView({ onAskElysia, onOpenSidebar, onExploreTools, pinnedPersonas = [], personas = [], onSelectPersona }) {
  const [showKickNotice, setShowKickNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('chatworld_kick_notice') === 'true') {
      setShowKickNotice(true);
      sessionStorage.removeItem('chatworld_kick_notice');
    }
  }, []);

  const pinnedItems = personas.filter(p => pinnedPersonas.includes(p.id));
  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-[73px] px-6 flex items-center z-20 sm:hidden">
        <button onClick={onOpenSidebar} aria-label="Open Sidebar Menu" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center max-w-3xl w-full text-center p-4 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-500">
        {showKickNotice && (
          <div className="mb-6 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-4 duration-300">
            You have been disconnected from Chat World for being idle.
          </div>
        )}

        {/* Illustration */}
        <div className="w-48 h-24 mb-4 relative flex items-center justify-center">
           <div className="relative flex items-center justify-center">
              <Monitor size={72} className="text-slate-700 dark:text-slate-300" strokeWidth={1} />
           </div>
        </div>

        {/* Text */}
        <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
          Send messages and boost your productivity. Click the <strong>Tools</strong> label or the <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded mx-1 align-text-bottom text-slate-500 dark:text-slate-400 p-0.5"><SquarePen size={16} /></span> icon in the sidebar to add and pin your favorite tools!
        </p>

        {pinnedItems.length > 0 ? (
          <div className="w-full max-w-2xl xl:max-w-3xl mt-4">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-center">Quick Access</h4>
            <div className="flex flex-wrap justify-center gap-3 w-full">
              {pinnedItems.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectPersona?.(app.id)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all group w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] hover:border-[var(--color-brand-magenta)]/30"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  </div>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-[var(--color-brand-magenta)] transition-colors text-left w-full flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{app.name}</span>
                    {app.isOnDevice && ((app.appId === 'bgremover' || app.id === 'app_bgremover') ? <Cpu size={14} className="text-green-500 fill-green-500/20 shrink-0" /> : <Leaf size={14} className="text-green-500 fill-green-500/20 shrink-0" />)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <button onClick={onExploreTools || onOpenSidebar} className="flex flex-col items-center gap-2 p-4 w-28 rounded-2xl bg-transparent border border-transparent transition-colors group">
              <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-full text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
                <Compass size={20} className="text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Explore Tools</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 w-full flex justify-center z-30">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center px-4">
          <Lock size={12} className="shrink-0" />
          <span>All files and data are processed 100% locally on your device</span>
        </div>
      </div>
    </div>
  );
}
