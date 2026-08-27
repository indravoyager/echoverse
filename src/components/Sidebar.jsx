import { useState, useRef, useEffect, lazy, Suspense, useDeferredValue, memo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Settings, X, Gift, Heart, Sparkles, Pin, Search, ChevronDown, Trash2, Plus, Archive, ArchiveRestore, Info, BookOpen, Zap, SquarePen, ArrowLeft, User, Leaf, Cpu, ArrowRight } from 'lucide-react';
import { getAppTagline, getAppDetails } from '../lib/appRegistry';
import { ConfirmModal } from './theme/ConfirmModal';
import { SidebarContextMenu } from './theme/SidebarContextMenu';
import { GLOBAL_THEMES } from '../config/themes';
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const NewChatView = lazy(() => import('./NewChatView'));
const PersonaBuilder = lazy(() => import('./PersonaBuilder'));
const TagBuilder = lazy(() => import('./TagBuilder'));

function Sidebar({ personas, activePersonaId, onSelectPersona, onGoHome, onOpenSettings, isOpen, onClose, viewMode = 'list', setViewMode, chatHistory, unreadCounts, affinityLevels, userName, userAvatar, pinnedPersonas, onTogglePin, archivedPersonas = [], onToggleArchive, onClearChat, isDarkMode, setIsDarkMode, bgEffectsEnabled, setBgEffectsEnabled, globalThemeId, setGlobalThemeId, apiConfig, setApiConfig, customPersonas, onAddPersona, onEditPersona, onDeletePersona, customTags = [], onSaveTag, onDeleteTag, setUserAvatar, setSelectedImageForCrop, setUserName, toolVisibility, onRemoveFromMain, personaAccessEnabled, setPersonaAccessEnabled }) {
  const activePersona = personas.find(p => p.id === activePersonaId);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'favorites', 'personas', 'apps'
  const deferredFilterMode = useDeferredValue(filterMode);
  const [newChatFilter, setNewChatFilter] = useState('all'); // 'all', 'personas', 'apps'
  const [visibleContactsCount, setVisibleContactsCount] = useState(30);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [deleteConfirmPersonaId, setDeleteConfirmPersonaId] = useState(null);
  const [removeToolConfirmId, setRemoveToolConfirmId] = useState(null);
  const [pressedPersonaId, setPressedPersonaId] = useState(null);
  const [personaToEdit, setPersonaToEdit] = useState(null);
  const [tagToEdit, setTagToEdit] = useState(null);

  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const handleTouchStart = (e, personaId) => {
    isLongPressRef.current = false;
    setPressedPersonaId(personaId);
    const rect = e.currentTarget.getBoundingClientRect();

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setMenuPos({ top: rect.bottom + 4, left: Math.max(16, rect.left + 20) });
      setOpenMenuId(personaId);
      setPressedPersonaId(null);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEndOrMove = () => {
    setPressedPersonaId(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePersonaClick = (personaId) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onSelectPersona(personaId);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('.persona-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    queueMicrotask(() => {
      setVisibleContactsCount(15);
    });
  }, [searchQuery, newChatFilter, viewMode]);

  const getLastMessage = (personaId) => {
    const messages = chatHistory?.[personaId];
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  const getFormatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getSnippet = (persona, lastMsg) => {
    if (persona.isApp) {
      return getAppTagline(persona.appId, persona.role);
    }
    if (!lastMsg) return "No messages yet";
    if (lastMsg.image || lastMsg.attachment) return "📷 Attachment";
    return lastMsg.content;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 sm:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <div className={twMerge(clsx(
        "w-80 sm:w-[20%] sm:min-w-[320px] sm:max-w-[450px] h-full border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] sm:bg-white/95 sm:dark:bg-[#0a0a0a]/95 sm:backdrop-blur-md flex flex-col flex-shrink-0 z-50 sm:shadow-none transition-transform duration-300 ease-out absolute sm:relative will-change-transform print-hide",
        isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      ))}>
        <div className="h-[73px] px-6 flex justify-between items-center shrink-0">
          <button onClick={onGoHome} className="flex items-center hover:opacity-80 transition-opacity outline-none text-left select-text font-jakarta">
            <h2 className="font-extrabold text-xl tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)]">Echo</span>
              <span className="text-slate-900 dark:text-white">verse</span>
            </h2>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'new_chat' ? 'list' : 'new_chat')}
              aria-label="New Chat"
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                viewMode === 'new_chat'
                  ? "text-[var(--color-brand-magenta)] bg-[var(--color-brand-magenta)]/10"
                  : "text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10"
              )}
            >
              <SquarePen size={20} />
            </button>
            <button onClick={onClose} aria-label="Tutup Sidebar" className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={24} />
            </button>
          </div>
        </div>

        {viewMode === 'list' && filterMode !== 'archived' && (
          <div className="px-4 pb-2 shrink-0 flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[var(--color-brand-magenta)]/30 rounded-full pl-9 pr-8 py-1.5 text-[13px] font-medium text-slate-800 dark:text-white focus:outline-none transition-colors placeholder:font-normal"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 -mt-1">
              <button onClick={() => setFilterMode('all')} className={clsx("px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors", filterMode === 'all' ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}>All</button>
              <button onClick={() => setFilterMode('favorites')} className={clsx("px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors", filterMode === 'favorites' ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}>Favorites</button>
              <button onClick={() => setFilterMode('apps')} className={clsx("px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors", filterMode === 'apps' ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}>Tools</button>
              {customTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setFilterMode(tag.id)}
                  className={clsx("px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors", filterMode === tag.id ? "bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)]" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}
                >
                  {tag.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setTagToEdit(null);
                  setViewMode('build_tag');
                }}
                className="flex items-center justify-center w-7 h-[26px] rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 transition-colors flex-shrink-0 ml-0.5"
                title="Buat Tag Baru"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-2" style={{ scrollbarGutter: 'stable' }}>
          {viewMode === 'settings' ? (
            <Suspense fallback={<div className="flex items-center justify-center w-full h-full min-h-[300px]"><div className="w-8 h-8 border-[3px] border-[var(--color-brand-magenta)]/20 border-t-[var(--color-brand-magenta)] rounded-full animate-spin"></div></div>}>
              <SettingsPanel
                onBack={() => setViewMode('list')}
                userName={userName}
                setUserName={setUserName}
                userAvatar={userAvatar}
                setSelectedImageForCrop={setSelectedImageForCrop}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                bgEffectsEnabled={bgEffectsEnabled}
                setBgEffectsEnabled={setBgEffectsEnabled}
                globalThemeId={globalThemeId}
                setGlobalThemeId={setGlobalThemeId}
                apiConfig={apiConfig}
                setApiConfig={setApiConfig}
                customPersonas={customPersonas}
                onAddPersona={() => {
                  setPersonaToEdit(null);
                  setViewMode('build_persona');
                }}
                onEditPersona={(persona) => {
                  setPersonaToEdit(persona);
                  setViewMode('build_persona');
                }}
                onDeletePersona={onDeletePersona}
                customTags={customTags}
                onAddTag={() => {
                  setTagToEdit(null);
                  setViewMode('build_tag');
                }}
                onEditTag={(tag) => {
                  setTagToEdit(tag);
                  setViewMode('build_tag');
                }}
                onDeleteTag={onDeleteTag}
                personaAccessEnabled={personaAccessEnabled}
                setPersonaAccessEnabled={setPersonaAccessEnabled}
              />
            </Suspense>
          ) : viewMode === 'build_persona' ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--color-brand-magenta)] border-t-transparent rounded-full animate-spin"></div></div>}>
              <PersonaBuilder
                initialData={personaToEdit}
                onSave={(persona) => {
                  if (personaToEdit) {
                    onEditPersona(persona);
                  } else {
                    onAddPersona(persona);
                  }
                  setViewMode('settings');
                }}
                onCancel={() => setViewMode('settings')}
              />
            </Suspense>
          ) : viewMode === 'build_tag' ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--color-brand-magenta)] border-t-transparent rounded-full animate-spin"></div></div>}>
              <TagBuilder
                personas={personas}
                initialData={tagToEdit}
                onSave={(tag) => {
                  onSaveTag(tag);
                  setViewMode('settings');
                }}
                onCancel={() => setViewMode('settings')}
              />
            </Suspense>
          ) : viewMode === 'info' && activePersona ? (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
              <div className="flex items-center justify-between mb-4 shrink-0 -mt-1 pr-2">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                  Profile Info
                </h2>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <img
                  src={activePersona.avatar}
                  alt={activePersona.name}
                  loading="lazy"
                  className="w-20 h-20 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] object-cover mb-4 animate-in zoom-in duration-300"
                  style={{
                    borderColor: activePersona.theme.primary
                  }}
                />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">{activePersona.name}</h3>
                <span className="text-[11px] font-medium px-3 py-1 rounded-full border" style={{ color: activePersona.theme.primary, backgroundColor: `color-mix(in srgb, ${activePersona.theme.primary} 5%, transparent)`, borderColor: `color-mix(in srgb, ${activePersona.theme.primary} 20%, transparent)` }}>
                  {activePersona.role}
                </span>
              </div>

              {(activePersona.details || activePersona.isApp) && (() => {
                const isTool = activePersona.isApp;
                const toolDetails = isTool ? getAppDetails(activePersona.appId) : null;

                return (
                  <div className="space-y-2.5 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150 fill-mode-both text-left">
                    {/* Item 1 */}
                    <div className="bg-transparent p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                        {isTool ? <Info size={16} className="text-blue-500" /> : <Gift size={16} className="text-pink-500" />}
                      </div>
                      <div className="min-w-0 w-full">
                        <h4 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          {isTool ? 'Description' : 'Birthday'}
                        </h4>
                        <p className="text-[13px] text-slate-800 dark:text-slate-200 font-normal whitespace-pre-line break-words">
                          {isTool ? toolDetails.description : activePersona.details?.birthday}
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-transparent p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                        {isTool ? <BookOpen size={16} className="text-emerald-500" /> : <Heart size={16} className="text-red-500" />}
                      </div>
                      <div className="min-w-0 w-full">
                        <h4 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          {isTool ? 'How To Use' : 'Likes'}
                        </h4>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-snug whitespace-pre-line break-words">
                          {isTool ? toolDetails.howToUse : activePersona.details?.likes}
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-transparent p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                        {isTool ? <Zap size={16} className="text-amber-500" /> : <Sparkles size={16} className="text-blue-500" />}
                      </div>
                      <div className="min-w-0 w-full">
                        <h4 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          {isTool ? 'Features' : 'Character'}
                        </h4>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-snug whitespace-pre-line break-words">
                          {isTool ? toolDetails.features : activePersona.details?.character}
                        </p>
                      </div>
                    </div>

                    {/* Pin Button */}
                    <button
                      onClick={() => onTogglePin?.(activePersona.id)}
                      className="w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold text-[13px]"
                    >
                      <Pin size={16} className={pinnedPersonas?.includes(activePersona.id) ? "fill-current" : "text-slate-500"} style={pinnedPersonas?.includes(activePersona.id) ? { color: activePersona.theme.primary } : {}} />
                      <span className={pinnedPersonas?.includes(activePersona.id) ? "" : "text-slate-700 dark:text-slate-300"} style={pinnedPersonas?.includes(activePersona.id) ? { color: activePersona.theme.primary } : {}}>
                        {pinnedPersonas?.includes(activePersona.id) ? "Unpin Tool" : "Pin Tool"}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : viewMode === 'new_chat' ? (
            <Suspense fallback={<div className="flex items-center justify-center w-full h-full min-h-[300px]"><div className="w-8 h-8 border-[3px] border-[var(--color-brand-magenta)]/20 border-t-[var(--color-brand-magenta)] rounded-full animate-spin"></div></div>}>
              <NewChatView
                personas={personas}
                setViewMode={setViewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                newChatFilter={newChatFilter}
                setNewChatFilter={setNewChatFilter}
                visibleContactsCount={visibleContactsCount}
                setVisibleContactsCount={setVisibleContactsCount}
                onSelectPersona={onSelectPersona}
                personaAccessEnabled={personaAccessEnabled}
              />
            </Suspense>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              {filterMode === 'archived' && (
                <div className="flex flex-col mb-4 animate-in fade-in slide-in-from-right-4 duration-300 -mt-1 pr-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">Archived</h2>
                    <button onClick={() => setFilterMode('all')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400">
                    These chats stay archived when new messages are received.
                  </div>
                </div>
              )}
              {filterMode === 'all' && archivedPersonas?.length > 0 && searchQuery.trim() === '' && (
                <button
                  onClick={() => setFilterMode('archived')}
                  className="w-full flex items-center gap-3 py-2 px-3 mb-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent group"
                >
                  <div className="w-10 flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:text-[var(--color-brand-magenta)] transition-colors">
                      <Archive size={15} />
                    </div>
                  </div>
                  <div className="flex-1 text-[13px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                    Archived
                  </div>
                </button>
              )}
              {[...personas]
                .filter(persona => {
                  if (persona.isHidden || persona.id === 'app_chatworld') return false;

                  const isArchived = archivedPersonas?.includes(persona.id);
                  const isSearching = deferredSearchQuery.trim() !== '';
                  const matchesSearch = !isSearching || persona.name.toLowerCase().includes(deferredSearchQuery.toLowerCase());

                  if (!matchesSearch) return false;

                  if (deferredFilterMode === 'archived') return isArchived;

                  // If not searching, hide archived chats from normal views
                  if (isArchived && !isSearching) return false;

                  const hasChatHistory = chatHistory && chatHistory[persona.id] && chatHistory[persona.id].length > 0;
                  const isPinned = pinnedPersonas?.includes(persona.id);
                  const isApp = persona.isApp;

                  if (!personaAccessEnabled && !isApp) return false;

                  if (!isSearching && deferredFilterMode === 'all') {
                    if (persona.id === activePersonaId) {
                      // Do not filter out the currently active chat/tool
                    } else if (isApp) {
                      const visibility = toolVisibility?.[persona.id];
                      const isVisible = visibility !== undefined ? visibility : false;
                      if (!isVisible && !isPinned) return false;
                    } else {
                      if (!hasChatHistory && !isPinned) {
                        return false;
                      }
                    }
                  }

                  const customTag = customTags.find(t => t.id === deferredFilterMode);
                  const matchesFilter = deferredFilterMode === 'all' ? true :
                    deferredFilterMode === 'favorites' ? pinnedPersonas?.includes(persona.id) :
                      deferredFilterMode === 'personas' ? !persona.isApp :
                        deferredFilterMode === 'apps' ? persona.isApp :
                          customTag ? customTag.members.includes(persona.id) : false;

                  return matchesFilter;
                })
                .sort((a, b) => {
                  const aPinned = pinnedPersonas?.includes(a.id) ? 1 : 0;
                  const bPinned = pinnedPersonas?.includes(b.id) ? 1 : 0;

                  // 1. Pinned vs Unpinned
                  if (aPinned !== bPinned) return bPinned - aPinned;

                  // 2. Both Pinned: sort by order they were pinned (older pins at the top)
                  if (aPinned && bPinned) {
                    return pinnedPersonas.indexOf(a.id) - pinnedPersonas.indexOf(b.id);
                  }

                  // 3. Both Unpinned:
                  const aLast = getLastMessage(a.id);
                  const bLast = getLastMessage(b.id);

                  // If both have messages, sort by newest message
                  if (aLast && bLast) {
                    return new Date(bLast.timestamp) - new Date(aLast.timestamp);
                  }

                  // If 'a' has a message but 'b' doesn't, 'a' goes first
                  if (aLast && !bLast) return -1;
                  // If 'b' has a message but 'a' doesn't, 'b' goes first
                  if (!aLast && bLast) return 1;

                  // If neither has messages, sort alphabetically
                  return a.name.localeCompare(b.name);
                })
                .map((persona) => {
                  const isActive = activePersonaId === persona.id;
                  const isPressed = pressedPersonaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => handlePersonaClick(persona.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ top: e.clientY || (rect.bottom + 4), left: e.clientX || rect.left });
                        setOpenMenuId(persona.id);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, persona.id)}
                      onTouchEnd={handleTouchEndOrMove}
                      onTouchMove={handleTouchEndOrMove}
                      onMouseLeave={handleTouchEndOrMove}
                      className={twMerge(
                        clsx(
                          "w-full flex items-center space-x-3 py-2 px-3 rounded-xl transition-all duration-200 text-left group mb-0.5 select-none [-webkit-touch-callout:none]",
                          isActive
                            ? "bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 "
                            : "hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent",
                          isPressed && "bg-slate-200/60 dark:bg-white/10 scale-[0.98] border-slate-300/50 dark:border-white/20"
                        )
                      )}
                    >
                      <div className="relative">
                        <img
                          src={persona.avatar}
                          alt={persona.name}
                          loading="lazy"
                          className={twMerge(
                            clsx(
                              "w-10 h-10 rounded-full border border-slate-200 dark:border-white/10  bg-white dark:bg-[#1a1a1a] object-cover transition-transform duration-300",
                              isActive ? "scale-110" : "group-hover:scale-105"
                            )
                          )}
                        />
                        {isActive && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0f0f0f] rounded-full "></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={twMerge(clsx(
                            "text-sm font-medium transition-colors select-none pointer-events-none flex items-center gap-1.5 min-w-0",
                            isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 group-hover:text-[var(--color-brand-magenta)]"
                          ))}>
                            <span className="truncate">{persona.name}</span>
                            {persona.isOnDevice && ((persona.appId === 'bgremover' || persona.id === 'app_bgremover') ? <Cpu size={14} className="text-green-500 fill-green-500/20 shrink-0" /> : <Leaf size={14} className="text-green-500 fill-green-500/20 shrink-0" />)}
                          </h3>
                          <div className="flex items-center shrink-0 ml-2 relative">
                            {/* Time and unread status */}
                            <div className="flex items-center gap-1.5 transition-all duration-200 group-hover:opacity-0 group-hover:translate-x-2 select-none pointer-events-none">
                              {pinnedPersonas?.includes(persona.id) && (
                                <Pin size={12} className="fill-current text-[var(--color-brand-magenta)] animate-in zoom-in duration-200" />
                              )}
                              <span className={clsx(
                                "text-[10px] font-normal transition-colors select-none",
                                (unreadCounts?.[persona.id] > 0) ? "text-[var(--color-brand-magenta)]" : "text-slate-400 dark:text-slate-500"
                              )}>
                                {getFormatTime(getLastMessage(persona.id)?.timestamp)}
                              </span>
                            </div>

                            {/* Hover Arrow */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === persona.id) {
                                  setOpenMenuId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, left: rect.left });
                                  setOpenMenuId(persona.id);
                                }
                              }}
                              aria-label="Buka menu opsi"
                              className="absolute right-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all text-slate-500 dark:text-slate-400 z-10"
                            >
                              <ChevronDown size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={clsx(
                            "text-xs truncate font-normal select-none pointer-events-none",
                            (unreadCounts?.[persona.id] > 0) ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                          )}>
                            {getSnippet(persona, getLastMessage(persona.id))}
                          </p>
                          {unreadCounts?.[persona.id] > 0 && (
                            <div className="w-4 h-4 bg-[var(--color-brand-magenta)] rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0  animate-in zoom-in duration-200">
                              {unreadCounts[persona.id]}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Mini Profile Card */}
        <div className="h-[60px] px-4 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-white/[0.02] flex items-center">
          <div className="flex items-center gap-3 w-full">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand-magenta)] to-[var(--color-brand-purple)] flex items-center justify-center text-white font-bold overflow-hidden border border-[var(--color-brand-magenta)]/50">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="translate-y-[1px] leading-none text-sm">{userName ? (userName === 'X7v9Pq2LmWk5' ? 'I' : userName.charAt(0).toUpperCase()) : 'I'}</span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 ml-1 -translate-y-[1px]">
              <div className="font-medium text-slate-800 dark:text-white text-lg leading-tight truncate mb-[1px]">
                {userName === 'X7v9Pq2LmWk5' ? 'ivy' : userName}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span className="truncate">Online</span>
              </div>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'settings' || viewMode === 'build_persona' ? 'list' : 'settings')}
              className="p-1.5 text-slate-400 hover:text-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/10 rounded-lg transition-colors"
              title="Preferences"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed-position Context Menu — rendered outside overflow container */}
      {openMenuId && (() => {
        const persona = personas.find(p => p.id === openMenuId);
        if (!persona) return null;
        return (
          <SidebarContextMenu
            persona={persona}
            menuPos={menuPos}
            archivedPersonas={archivedPersonas}
            pinnedPersonas={pinnedPersonas}
            onToggleArchive={(id) => {
              onToggleArchive?.(id);
              setOpenMenuId(null);
            }}
            onTogglePin={(id) => {
              onTogglePin?.(id);
              setOpenMenuId(null);
            }}
            onDeleteChat={(id) => {
              setDeleteConfirmPersonaId(id);
              setOpenMenuId(null);
            }}
            onRemoveTool={(id) => {
              setRemoveToolConfirmId(id);
              setOpenMenuId(null);
            }}
          />
        );
      })()}

      {/* Premium Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={!!deleteConfirmPersonaId}
        onClose={() => setDeleteConfirmPersonaId(null)}
        onConfirm={() => {
          onClearChat?.(deleteConfirmPersonaId);
          setDeleteConfirmPersonaId(null);
        }}
        title={`Delete chat with ${personas.find(p => p.id === deleteConfirmPersonaId)?.name}?`}
        message="Messages will be removed from all devices."
        confirmLabel="Delete"
        variant="danger"
        themeColor={GLOBAL_THEMES[globalThemeId]?.primary}
      />

      <ConfirmModal
        isOpen={!!removeToolConfirmId}
        onClose={() => setRemoveToolConfirmId(null)}
        onConfirm={() => {
          onRemoveFromMain?.(removeToolConfirmId);
          setRemoveToolConfirmId(null);
        }}
        title={`Remove ${personas.find(p => p.id === removeToolConfirmId)?.name}?`}
        message="This tool will be hidden from the main display. You can re-add it anytime from the Contacts menu."
        confirmLabel="Remove"
        variant="danger"
        themeColor={GLOBAL_THEMES[globalThemeId]?.primary}
      />
    </>
  );
}

export default memo(Sidebar);

