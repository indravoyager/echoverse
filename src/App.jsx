import { Suspense, memo, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { Loader2 } from 'lucide-react';
import HomeView from './components/HomeView';
import { saveUserAvatar } from './lib/db';
import { useEchoManager } from './hooks/useEchoManager';
import { GLOBAL_THEMES } from './config/themes';
import { toolRegistryService, lazyWithRetry } from './services/registry/ToolRegistry.jsx';
import { ThemeService } from './services/theme/ThemeService';

const ChatInterface = lazyWithRetry(() => import('./components/ChatInterface'));
const ImageCropperModal = lazyWithRetry(() => import('./components/ImageCropperModal'));
const ApiErrorModal = lazyWithRetry(() => import('./components/ApiErrorModal'));

/**
 * Memoized Tool Container
 * Prevents hidden (inactive) tools from re-rendering when parent App state updates.
 */
const ToolItemContainer = memo(
  function ToolItemContainer({
    Component,
    toolPersona,
    isActive,
    unreadCount,
    isDarkMode,
    userName,
    userAvatar,
    onCloseApp,
    onOpenSidebar,
    onOpenPersonaInfo,
    onNewMessage
  }) {
    return (
      <div
        className={isActive ? 'app-container-active' : 'app-container-hidden'}
        style={{
          display: isActive ? 'flex' : 'none',
          flex: 1,
          width: '100%',
          height: '100%',
          flexDirection: 'column'
        }}
      >
        <Component
          persona={toolPersona}
          isActive={isActive}
          unreadCount={unreadCount}
          isDarkMode={isDarkMode}
          userName={userName}
          userAvatar={userAvatar}
          onCloseApp={onCloseApp}
          onOpenSidebar={onOpenSidebar}
          onOpenPersonaInfo={onOpenPersonaInfo}
          onNewMessage={onNewMessage}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // If the tool was inactive and remains inactive, SKIP re-rendering completely!
    if (!prevProps.isActive && !nextProps.isActive) {
      return true;
    }
    // If activation state changed, re-render!
    if (prevProps.isActive !== nextProps.isActive) {
      return false;
    }
    // If active, check essential props
    return (
      prevProps.unreadCount === nextProps.unreadCount &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.userName === nextProps.userName &&
      prevProps.userAvatar === nextProps.userAvatar &&
      prevProps.toolPersona === nextProps.toolPersona &&
      prevProps.Component === nextProps.Component
    );
  }
);

function App() {
  const appComponents = toolRegistryService.getAppComponents();

  const {
    activePersonaId,
    chatHistory,
    isTypingMap,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    sidebarView,
    setSidebarView,
    isDarkMode,
    setIsDarkMode,
    isDbLoaded,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    selectedImageForCrop,
    setSelectedImageForCrop,
    unreadCounts,
    setUnreadCounts,
    affinityLevels,
    memories,
    setMemories,
    moods,
    pinnedPersonas,
    archivedPersonas,
    apiConfig,
    setApiConfig,
    bgEffectsEnabled,
    setBgEffectsEnabled,
    globalThemeId,
    setGlobalThemeId,
    customPersonas,
    customTags,
    visitedApps,
    toolVisibility,
    personaAccessEnabled,
    setPersonaAccessEnabled,
    allPersonas,
    activePersona,
    currentMessages,
    handleSelectPersona,
    handleAddPersona,
    handleEditPersona,
    handleDeletePersona,
    handleSaveTag,
    handleDeleteTag,
    handleSendMessage,
    handleEdit,
    handleTogglePin,
    handleToggleArchive,
    handleClearChat,
    handleRemoveFromMain
  } = useEchoManager();

  // Preload ChatInterface on mount for instant persona tab switching
  useEffect(() => {
    import('./components/ChatInterface');
  }, []);

  const handleTogglePersonaInfo = useCallback(() => {
    setSidebarView((prev) => {
      if (prev === 'info') {
        return 'list';
      } else {
        setIsMobileSidebarOpen(true);
        return 'info';
      }
    });
  }, [setSidebarView, setIsMobileSidebarOpen]);

  const themeStyles = ThemeService.getThemeStyles(globalThemeId);

  return (
    <div
      style={themeStyles}
      className="flex w-full h-[100dvh] text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-[var(--color-brand-magenta)]/20 relative bg-slate-50 dark:bg-[#0a0a0a]"
    >
      {/* Background Effects */}
      <div className="tech-grid" />

      {bgEffectsEnabled && (
        <>
          <div className="tech-glow" />
          <div className="ambient-nebula-1" />
          <div className="ambient-nebula-2" />
        </>
      )}

      {/* Database Hydration Overlay */}
      <div
        className={`fixed inset-0 z-[998] bg-white dark:bg-[#030303] transition-opacity duration-1000 ease-in-out pointer-events-none ${
          isDbLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {isDbLoaded && (
        <div className="flex-1 flex w-full h-full relative bg-transparent text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
          {/* Sidebar */}
          <Sidebar
            personas={allPersonas}
            activePersonaId={activePersonaId}
            onSelectPersona={handleSelectPersona}
            onGoHome={() => handleSelectPersona('home')}
            onOpenSettings={() => setIsMobileSidebarOpen(false)}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            viewMode={sidebarView}
            setViewMode={setSidebarView}
            chatHistory={chatHistory}
            unreadCounts={unreadCounts}
            affinityLevels={affinityLevels}
            memories={memories}
            setMemories={setMemories}
            userName={userName}
            userAvatar={userAvatar}
            pinnedPersonas={pinnedPersonas}
            onTogglePin={handleTogglePin}
            archivedPersonas={archivedPersonas}
            onToggleArchive={handleToggleArchive}
            onClearChat={handleClearChat}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            bgEffectsEnabled={bgEffectsEnabled}
            setBgEffectsEnabled={setBgEffectsEnabled}
            globalThemeId={globalThemeId}
            setGlobalThemeId={setGlobalThemeId}
            apiConfig={apiConfig}
            setApiConfig={setApiConfig}
            customPersonas={customPersonas}
            onAddPersona={handleAddPersona}
            onEditPersona={handleEditPersona}
            onDeletePersona={handleDeletePersona}
            customTags={customTags}
            onSaveTag={handleSaveTag}
            onDeleteTag={handleDeleteTag}
            setUserAvatar={setUserAvatar}
            setSelectedImageForCrop={setSelectedImageForCrop}
            setUserName={setUserName}
            toolVisibility={toolVisibility}
            personaAccessEnabled={personaAccessEnabled}
            setPersonaAccessEnabled={setPersonaAccessEnabled}
            onRemoveFromMain={handleRemoveFromMain}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex w-full h-full relative overflow-hidden">
            {/* 1. Home View */}
            <div
              style={{
                display: activePersonaId === 'home' ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                flexDirection: 'column'
              }}
            >
              {activePersonaId === 'home' && (
                <HomeView
                  pinnedPersonas={pinnedPersonas}
                  personas={allPersonas}
                  onSelectPersona={handleSelectPersona}
                  onAskElysia={() => {
                    const elysia = allPersonas.find((p) => p.id === 'elysia');
                    if (elysia) handleSelectPersona(elysia.id);
                  }}
                  onExploreTools={() => {
                    setSidebarView('new_chat');
                    setIsMobileSidebarOpen(true);
                  }}
                  onOpenSidebar={() => {
                    setSidebarView('list');
                    setIsMobileSidebarOpen(true);
                  }}
                />
              )}
            </div>

            {/* 2. Persona Chat Interface */}
            <div
              style={{
                display: !activePersona?.isApp && activePersonaId !== 'home' ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                flexDirection: 'column'
              }}
            >
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-300 dark:text-slate-700" size={32} />
                  </div>
                }
              >
                {!activePersona?.isApp && activePersonaId !== 'home' && (
                  <ChatInterface
                    persona={activePersona}
                    messages={currentMessages}
                    onSendMessage={handleSendMessage}
                    onEdit={handleEdit}
                    isTyping={isTypingMap[activePersonaId] || false}
                    onOpenSidebar={() => {
                      setSidebarView('list');
                      setIsMobileSidebarOpen(true);
                    }}
                    onOpenPersonaInfo={handleTogglePersonaInfo}
                    affinityLevel={
                      affinityLevels[activePersonaId] !== undefined ? affinityLevels[activePersonaId] : 50
                    }
                    currentMood={moods[activePersonaId] || 'Normal'}
                    memories={memories}
                    setMemories={setMemories}
                    userAvatar={userAvatar}
                    onClearChat={handleClearChat}
                    allPersonas={allPersonas}
                    onSelectPersona={handleSelectPersona}
                  />
                )}
              </Suspense>
            </div>

            {/* 3. Specialized Tools */}
            <div
              style={{
                display: activePersona?.isApp ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                flexDirection: 'column'
              }}
            >
              <Suspense
                fallback={
                  activePersona?.isApp ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-500 gap-3">
                      <Loader2 className="animate-spin w-8 h-8 text-[var(--color-brand-magenta)]" />
                      <span className="font-medium text-sm">Loading Tool...</span>
                    </div>
                  ) : null
                }
              >
                {appComponents.map(({ id, Component }) => {
                  if (!visitedApps[id]) return null;
                  const toolPersona = allPersonas.find((p) => p.appId === id);
                  if (!toolPersona) return null;
                  const isActive = activePersona?.isApp && activePersona.appId === id;
                  return (
                    <ToolItemContainer
                      key={id}
                      Component={Component}
                      toolPersona={toolPersona}
                      isActive={isActive}
                      unreadCount={unreadCounts[toolPersona.id] || 0}
                      isDarkMode={isDarkMode}
                      userName={userName}
                      userAvatar={userAvatar}
                      onCloseApp={() => handleSelectPersona('home')}
                      onOpenSidebar={() => {
                        setSidebarView('list');
                        setIsMobileSidebarOpen(true);
                      }}
                      onOpenPersonaInfo={handleTogglePersonaInfo}
                      onNewMessage={() => {
                        setUnreadCounts((prev) => ({
                          ...prev,
                          [toolPersona.id]: (prev[toolPersona.id] || 0) + 1
                        }));
                      }}
                    />
                  );
                })}
              </Suspense>
            </div>
          </div>

          {/* Image Cropper Modal */}
          {selectedImageForCrop && (
            <Suspense fallback={null}>
              <ImageCropperModal
                imageSrc={selectedImageForCrop}
                onCancel={() => setSelectedImageForCrop(null)}
                onComplete={async (croppedAreaPixels) => {
                  try {
                    const { getCroppedImg } = await import('./lib/cropImage');
                    const croppedImageBase64 = await getCroppedImg(
                      selectedImageForCrop,
                      croppedAreaPixels,
                      128
                    );
                    if (croppedImageBase64) {
                      setUserAvatar(croppedImageBase64);
                      saveUserAvatar(croppedImageBase64);
                    }
                  } catch (err) {
                    console.error('Error cropping image', err);
                  } finally {
                    setSelectedImageForCrop(null);
                  }
                }}
              />
            </Suspense>
          )}

          {/* Global API Error Modal */}
          <Suspense fallback={null}>
            <ApiErrorModal themeColor={GLOBAL_THEMES[globalThemeId]?.primary} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default App;
