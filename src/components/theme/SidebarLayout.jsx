import { AppShell } from './AppShell';

export const SidebarLayout = ({
  persona,
  onOpenSidebar,
  onOpenPersonaInfo,
  onReset,
  resetLabel,
  sidebarContent,
  mainContent,
  className = ""
}) => {
  return (
    <AppShell
      persona={persona}
      onOpenSidebar={onOpenSidebar}
      onOpenPersonaInfo={onOpenPersonaInfo}
      onReset={onReset}
      resetLabel={resetLabel}
      fullHeight={true}
    >
      <div className={`flex flex-col lg:flex-row gap-6 w-full lg:h-full ${className}`}>
        {/* Settings/Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
          {sidebarContent}
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 lg:h-full relative">
          {mainContent}
        </div>
      </div>
    </AppShell>
  );
};


