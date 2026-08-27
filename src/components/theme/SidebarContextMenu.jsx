import { Archive, ArchiveRestore, Pin, Trash2, X } from 'lucide-react';

export const SidebarContextMenu = ({
  persona,
  menuPos,
  archivedPersonas = [],
  pinnedPersonas = [],
  onToggleArchive,
  onTogglePin,
  onDeleteChat,
  onRemoveTool
}) => {
  if (!persona) return null;
  const isPinned = pinnedPersonas.includes(persona.id);
  const isArchived = archivedPersonas.includes(persona.id);

  return (
    <div
      className="fixed z-[200] w-52 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/10 py-1 persona-menu-container animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleArchive(persona.id);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
      >
        {isArchived ? (
          <>
            <ArchiveRestore size={13} className="text-[var(--color-brand-magenta)]" />
            Unarchive chat
          </>
        ) : (
          <>
            <Archive size={13} className="text-slate-400" />
            Archive chat
          </>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(persona.id);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
      >
        <Pin size={13} className={isPinned ? "text-[var(--color-brand-magenta)]" : "text-slate-400"} />
        {isPinned ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>

      {!persona.isApp && (
        <>
          <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(persona.id);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors whitespace-nowrap"
          >
            <Trash2 size={13} />
            Delete Chat
          </button>
        </>
      )}

      {persona.isApp && (
        <>
          <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTool(persona.id);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors whitespace-nowrap"
          >
            <X size={13} />
            Remove Tool
          </button>
        </>
      )}
    </div>
  );
};
