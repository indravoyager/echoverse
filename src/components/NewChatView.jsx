import { useDeferredValue, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search, User, Leaf, Cpu, ArrowLeft, ArrowRight } from 'lucide-react';

export default function NewChatView({
  personas,
  setViewMode,
  searchQuery,
  setSearchQuery,
  newChatFilter,
  setNewChatFilter,
  visibleContactsCount,
  setVisibleContactsCount,
  onSelectPersona,
  personaAccessEnabled
}) {
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredNewChatFilter = useDeferredValue(newChatFilter);

  useEffect(() => {
    setVisibleContactsCount(30);
  }, [setVisibleContactsCount]);

  const visiblePersonas = personas.filter(p => !p.isHidden && (personaAccessEnabled || p.isApp));

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
      <div className="flex items-center justify-between mb-4 shrink-0 -mt-1 pr-2">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">
          New Chat
        </h2>
        <button
          onClick={() => setViewMode('list')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </div>
      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[var(--color-brand-magenta)]/30 rounded-full pl-9 pr-4 py-1.5 text-[13px] font-medium text-slate-800 dark:text-white focus:outline-none transition-colors placeholder:font-normal"
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 mb-4 shrink-0">
          <button
            onClick={() => setNewChatFilter('all')}
            className={clsx(
              "px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
              newChatFilter === 'all' 
                ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" 
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            )}
          >
            All ({visiblePersonas.length})
          </button>
          <button
            onClick={() => setNewChatFilter('personas')}
            className={clsx(
              "px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
              newChatFilter === 'personas' 
                ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" 
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            )}
          >
            Persona ({visiblePersonas.filter(p => !p.isApp).length})
          </button>
          <button
            onClick={() => setNewChatFilter('apps')}
            className={clsx(
              "px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
              newChatFilter === 'apps' 
                ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" 
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            )}
          >
            Tools ({visiblePersonas.filter(p => p.isApp).length})
          </button>
        </div>
        <div 
          className="flex-1 overflow-y-auto pr-2 pb-10"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
              setVisibleContactsCount(prev => prev + 30);
            }
          }}
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 mt-1">Contacts on Echo ATURAI</div>
          {[...visiblePersonas]
            .filter(p => (!deferredSearchQuery.trim() || p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())))
            .filter(p => {
              if (deferredNewChatFilter === 'personas') return !p.isApp;
              if (deferredNewChatFilter === 'apps') return p.isApp;
              return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, visibleContactsCount)
            .map(persona => (
            <button
              key={persona.id}
              onClick={() => {
                onSelectPersona(persona.id);
                setViewMode('list');
                setSearchQuery('');
              }}
              className="w-full flex items-center py-2 px-3 mb-0.5 rounded-xl transition-all duration-300 relative group overflow-hidden border border-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-left"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0  z-10 relative bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10">
                {persona.avatar ? (
                  <img src={persona.avatar} alt={persona.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0 z-10">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="font-medium text-[15px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{persona.name}</span>
                    {persona.isOnDevice && ((persona.appId === 'bgremover' || persona.id === 'app_bgremover') ? <Cpu size={14} className="text-green-500 fill-green-500/20 shrink-0" /> : <Leaf size={14} className="text-green-500 fill-green-500/20 shrink-0" />)}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
