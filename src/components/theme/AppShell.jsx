import { AppHeader } from './AppHeader';

export const AppShell = ({ 
  persona, 
  onOpenSidebar, 
  onOpenPersonaInfo, 
  onReset, 
  resetLabel, 
  children,
  className = "flex flex-col lg:h-full gap-4",
  fullHeight = false
}) => {
  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30"></div>
      
      {/* Header */}
      <AppHeader 
        persona={persona} 
        onOpenSidebar={onOpenSidebar} 
        onOpenPersonaInfo={onOpenPersonaInfo} 
        onReset={onReset} 
        resetLabel={resetLabel}
      />

      {/* Main Workspace */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 ${fullHeight ? 'flex flex-col' : ''}`}>
        <div className={className}>
          {children}
        </div>
      </div>
    </div>
  );
};
