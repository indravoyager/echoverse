import { useState, useEffect, useRef, startTransition, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import {
  loadChats,
  saveChats,
  loadUserName,
  saveUserName,
  loadUserAvatar,
  loadUnreadCounts,
  saveUnreadCounts,
  loadAffinityLevels,
  saveAffinityLevels,
  loadMemories,
  saveMemories,
  loadMoods,
  saveMoods,
  loadPinnedPersonas,
  savePinnedPersonas,
  loadArchivedPersonas,
  saveArchivedPersonas,
  loadApiConfig,
  saveApiConfig,
  loadBgEffects,
  saveGlobalTheme,
  loadGlobalTheme,
  loadCustomPersonas,
  saveCustomPersonas,
  loadCustomTags,
  saveCustomTags,
  loadToolVisibility,
  saveToolVisibility,
  loadPersonaAccess
} from '../lib/db';
import { generateResponse, setApiConfig as setAiApiConfig } from '../lib/ai';
import { ResponseParser } from '../services/ai/ResponseParser';
import { personaService } from '../services/persona/PersonaService';
import { toolRegistryService } from '../services/registry/ToolRegistry.jsx';
import { ThemeService } from '../services/theme/ThemeService';

/**
 * Custom Hook: useEchoManager
 * Centralized State Management, Routing, DB Persistence, and AI Messaging Pipeline.
 */
export function useEchoManager(
  staticPersonas = personaService.getStaticPersonas(),
  appComponents = toolRegistryService.getAppComponents()
) {
  const location = useLocation();
  const navigate = useNavigate();

  // Single Source of Truth: derive active persona ID directly from URL pathname
  const activePersonaId = useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/' || pathname === '/sns' || pathname === '/sns/') return 'home';
    let slug = pathname;
    if (slug.startsWith('/sns/')) {
      slug = slug.replace('/sns/', '');
    } else if (slug.startsWith('/')) {
      slug = slug.substring(1);
    }
    if (slug) {
      const isApp = appComponents.some((app) => app.id === slug);
      return isApp ? `app_${slug}` : slug;
    }
    return 'home';
  }, [location.pathname, appComponents]);

  const [chatHistory, setChatHistory] = useState({});
  const [isTypingMap, setIsTypingMap] = useState({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState('list');
  const [isDarkMode, setIsDarkMode] = useState(() => ThemeService.getInitialDarkMode());

  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [affinityLevels, setAffinityLevels] = useState({});
  const [memories, setMemories] = useState({});
  const [moods, setMoods] = useState({});
  const [pinnedPersonas, setPinnedPersonas] = useState([]);
  const [archivedPersonas, setArchivedPersonas] = useState([]);
  const [apiConfig, setApiConfigState] = useState({
    useCustom: false,
    provider: 'gemini',
    customKey: '',
    customModel: ''
  });
  const [bgEffectsEnabled, setBgEffectsEnabled] = useState(false);
  const [globalThemeId, setGlobalThemeId] = useState('slate');
  const [customPersonas, setCustomPersonas] = useState([]);
  const [customTags, setCustomTags] = useState([]);

  // Initialize visitedApps based on current active persona
  const [visitedApps, setVisitedApps] = useState(() => {
    if (activePersonaId.startsWith('app_')) {
      const appId = activePersonaId.replace('app_', '');
      return { [appId]: true };
    }
    return {};
  });

  const [toolVisibility, setToolVisibility] = useState({});
  const [personaAccessEnabled, setPersonaAccessEnabled] = useState(true);

  const allPersonas = useMemo(
    () => personaService.combinePersonas(customPersonas),
    [customPersonas]
  );
  const activePersona = useMemo(
    () => personaService.findPersonaById(allPersonas, activePersonaId),
    [allPersonas, activePersonaId]
  );
  const currentMessages = chatHistory[activePersonaId] || [];

  const activePersonaIdRef = useRef(activePersonaId);
  useEffect(() => {
    activePersonaIdRef.current = activePersonaId;
  }, [activePersonaId]);

  // Apply Dark Mode Class to HTML
  useEffect(() => {
    ThemeService.applyDarkMode(isDarkMode);
  }, [isDarkMode]);

  const handleSetDarkMode = useCallback((val, e) => {
    const nextVal = typeof val === 'function' ? val(isDarkMode) : val;

    if (!document.startViewTransition) {
      setIsDarkMode(nextVal);
      return;
    }

    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode(nextVal);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
        ],
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  }, [isDarkMode]);

  // Initial DB Bootstrap
  useEffect(() => {
    let isMounted = true;

    const initDB = async () => {
      try {
        const [
          chatResults,
          savedName,
          savedAvatar,
          savedUnread,
          savedAffinity,
          savedMemories,
          savedMoods,
          savedPinned,
          savedArchived,
          savedApi,
          savedBgEffects,
          savedTheme,
          loadedCustomPersonas,
          loadedCustomTags,
          loadedVisibility,
          savedPersonaAccess
        ] = await Promise.all([
          Promise.all(allPersonas.map(async (p) => ({ id: p.id, saved: await loadChats(p.id) }))),
          loadUserName(),
          loadUserAvatar(),
          loadUnreadCounts(),
          loadAffinityLevels(),
          loadMemories(),
          loadMoods(),
          loadPinnedPersonas(),
          loadArchivedPersonas(),
          loadApiConfig(),
          loadBgEffects(),
          loadGlobalTheme(),
          loadCustomPersonas(),
          loadCustomTags(),
          loadToolVisibility(),
          loadPersonaAccess()
        ]);

        const initialHistory = {};
        for (const { id, saved } of chatResults) {
          if (saved && saved.length > 0) {
            const updated = saved.map((msg) => {
              if (new Date(msg.timestamp).getFullYear() < 2026) {
                return { ...msg, timestamp: new Date().toISOString() };
              }
              return msg;
            });
            initialHistory[id] = updated;
            if (JSON.stringify(updated) !== JSON.stringify(saved)) {
              saveChats(id, updated);
            }
          } else {
            initialHistory[id] = [];
          }
        }

        const finalName = savedName || `User#${Math.floor(1000 + Math.random() * 9000)}`;
        if (!savedName) saveUserName(finalName);

        if (savedAffinity) {
          let migrated = false;
          const newAffinity = { ...savedAffinity };
          Object.keys(newAffinity).forEach((id) => {
            if (newAffinity[id] < 10) {
              newAffinity[id] += 50;
              migrated = true;
            }
          });
          if (migrated) saveAffinityLevels(newAffinity);
        }

        if (isMounted) {
          setUserName(finalName);
          if (savedAvatar) setUserAvatar(savedAvatar);
          if (savedUnread) setUnreadCounts(savedUnread);
          if (savedAffinity) setAffinityLevels(savedAffinity);
          if (savedMemories) setMemories(savedMemories);
          if (savedMoods) setMoods(savedMoods);
          setPinnedPersonas(savedPinned || []);
          if (savedArchived) setArchivedPersonas(savedArchived);

          if (savedApi) {
            setApiConfigState(savedApi);
            setAiApiConfig(savedApi);
          }

          setBgEffectsEnabled(savedBgEffects);

          if (savedTheme) {
            const themeMigration = {
              priestess: 'slate',
              firefly: 'teal',
              elysia: 'rose',
              kafka: 'amethyst',
              silver_wolf: 'azure',
              clara: 'ruby'
            };
            const mappedTheme = themeMigration[savedTheme] || savedTheme;
            if (GLOBAL_THEMES[mappedTheme] || mappedTheme.startsWith('#')) {
              setGlobalThemeId(mappedTheme);
            }
          }

          if (loadedCustomPersonas?.length > 0) setCustomPersonas(loadedCustomPersonas);
          if (loadedCustomTags?.length > 0) setCustomTags(loadedCustomTags);
          if (loadedVisibility) setToolVisibility(loadedVisibility);
          setPersonaAccessEnabled(savedPersonaAccess === null ? true : savedPersonaAccess);

          setChatHistory(initialHistory);
          setIsDbLoaded(true);
        }
      } catch (err) {
        console.error('[useEchoManager] Error initializing database:', err);
        if (isMounted) setIsDbLoaded(true);
      }
    };

    initDB();

    return () => {
      isMounted = false;
    };
  }, []);

  // Inject initial persona welcome message if empty
  useEffect(() => {
    if (!isDbLoaded) return;
    const activePers = allPersonas.find((p) => p.id === activePersonaId);
    if (!activePers || activePers.isApp) return;

    const currentHistory = chatHistory[activePersonaId] || [];
    if (currentHistory.length === 0) {
      const initialMsgs = (activePers.initialMessages || []).map((msg) => ({
        ...msg,
        timestamp: new Date().toISOString()
      }));
      if (initialMsgs.length > 0) {
        saveChats(activePersonaId, initialMsgs);
        setChatHistory((prev) => {
          if ((prev[activePersonaId] || []).length === 0) {
            return { ...prev, [activePersonaId]: initialMsgs };
          }
          return prev;
        });
      }
    }
  }, [activePersonaId, isDbLoaded]);

  const handleSelectPersona = useCallback((id) => {
    startTransition(() => {
      setIsMobileSidebarOpen(false);
      setSidebarView('list');
    });

    if (id === 'home') {
      if (location.pathname !== '/' && location.pathname !== '/sns') navigate('/');
      return;
    }

    const urlSlug = id.startsWith('app_') ? id.replace('app_', '') : id;
    if (location.pathname !== `/${urlSlug}` && location.pathname !== `/sns/${urlSlug}`) {
      navigate(`/${urlSlug}`);
    }

    const persona = allPersonas.find((p) => p.id === id);
    if (persona?.isApp) {
      setVisitedApps((prev) => {
        if (prev[persona.appId]) return prev;
        const keys = Object.keys(prev);
        const next = { ...prev };
        if (keys.length >= 5) {
          delete next[keys[0]]; // Prune oldest app to keep memory clean
        }
        next[persona.appId] = true;
        return next;
      });
      setToolVisibility((prev) => {
        if (prev[id] !== true) {
          const next = { ...prev, [id]: true };
          saveToolVisibility(next);
          return next;
        }
        return prev;
      });
    }

    setUnreadCounts((prev) => {
      if (!prev[id]) return prev;
      const newCounts = { ...prev, [id]: 0 };
      saveUnreadCounts(newCounts);
      return newCounts;
    });
  }, [allPersonas, location.pathname, navigate]);

  const handleAddPersona = useCallback((persona) => {
    setCustomPersonas((prev) => {
      const updated = [...prev, persona];
      saveCustomPersonas(updated);
      return updated;
    });
  }, []);

  const handleEditPersona = useCallback((persona) => {
    setCustomPersonas((prev) => {
      const updated = prev.map((p) => (p.id === persona.id ? persona : p));
      saveCustomPersonas(updated);
      return updated;
    });
  }, []);

  const handleDeletePersona = useCallback((personaId) => {
    setCustomPersonas((prev) => {
      const updated = prev.filter((p) => p.id !== personaId);
      saveCustomPersonas(updated);
      return updated;
    });
    if (activePersonaId === personaId) handleSelectPersona(allPersonas[0].id);
  }, [activePersonaId, allPersonas, handleSelectPersona]);

  const handleSaveTag = useCallback((tag) => {
    setCustomTags((prev) => {
      let newTags;
      if (prev.find((t) => t.id === tag.id)) {
        newTags = prev.map((t) => (t.id === tag.id ? tag : t));
      } else {
        newTags = [...prev, tag];
      }
      saveCustomTags(newTags);
      return newTags;
    });
  }, []);

  const handleDeleteTag = useCallback((tagId) => {
    setCustomTags((prev) => {
      const newTags = prev.filter((t) => t.id !== tagId);
      saveCustomTags(newTags);
      return newTags;
    });
  }, []);

  const generateAndSaveAIResponse = useCallback(async (messagesForAI, targetPersonaId, targetPersona) => {
    setIsTypingMap((prev) => ({ ...prev, [targetPersonaId]: true }));
    try {
      const personaAffinity = affinityLevels[targetPersonaId] !== undefined ? affinityLevels[targetPersonaId] : 50;
      const personaMemories = memories[targetPersonaId] || [];
      const personaMood = moods[targetPersonaId] || 'Normal';

      const { text: aiResponseText, searchData } = await generateResponse(
        messagesForAI,
        targetPersona,
        userName,
        null,
        personaAffinity,
        personaMemories,
        personaMood,
        allPersonas
      );

      const { cleanText, newMemories, detectedMood } = ResponseParser.extractMemoriesAndMood(aiResponseText);
      let rawAiText = cleanText;

      if (newMemories.length > 0) {
        setMemories((prev) => {
          const current = prev[targetPersonaId] || [];
          const updated = { ...prev, [targetPersonaId]: [...current, ...newMemories] };
          saveMemories(updated);
          return updated;
        });
      }

      if (detectedMood !== 'Normal') {
        setMoods((prev) => {
          const updated = { ...prev, [targetPersonaId]: detectedMood };
          saveMoods(updated);
          return updated;
        });

        setAffinityLevels((prev) => {
          let currentAffinity = prev[targetPersonaId] !== undefined ? prev[targetPersonaId] : 50;
          const normalizedMood = detectedMood.toLowerCase();
          if (['senang', 'bahagia', 'malu'].includes(normalizedMood)) {
            currentAffinity = Math.min(100, currentAffinity + 2);
          } else if (['normal', 'terkejut'].includes(normalizedMood)) {
            currentAffinity = Math.min(100, currentAffinity + 1);
          } else if (['marah', 'sedih', 'kecewa'].includes(normalizedMood)) {
            currentAffinity = Math.max(0, currentAffinity - 2);
          }
          const updatedAffinity = { ...prev, [targetPersonaId]: currentAffinity };
          saveAffinityLevels(updatedAffinity);
          return updatedAffinity;
        });
      }

      const responseParts = rawAiText.split('|').map((s) => s.trim()).filter(Boolean);
      const newAiMsgs = responseParts.map((part, index) => ({
        id: Date.now().toString() + '-' + index,
        role: 'ai',
        content: part,
        timestamp: new Date().toISOString(),
        mood: detectedMood,
        searchData: index === responseParts.length - 1 ? searchData : undefined
      }));

      const minTypingMs = 2000;
      const startTime = Date.now();
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTypingMs - elapsed);

      setTimeout(() => {
        setChatHistory((prevLive) => {
          const currentLiveMsgs = prevLive[targetPersonaId] || messagesForAI;
          // Append new AI messages onto live chat history preserving any interim user messages
          const finalMessages = [...currentLiveMsgs, ...newAiMsgs];
          saveChats(targetPersonaId, finalMessages);

          if (targetPersonaId !== activePersonaIdRef.current) {
            setUnreadCounts((prevCounts) => {
              const newCounts = { ...prevCounts, [targetPersonaId]: (prevCounts[targetPersonaId] || 0) + 1 };
              saveUnreadCounts(newCounts);
              return newCounts;
            });
          }

          return { ...prevLive, [targetPersonaId]: finalMessages };
        });
        setIsTypingMap((prevTyping) => ({ ...prevTyping, [targetPersonaId]: false }));
      }, remaining);
    } catch (error) {
      const isRateLimit = error.message?.includes('Rate Limit');
      const errorMsg = {
        id: Date.now().toString(),
        role: 'ai',
        content: isRateLimit
          ? `[Sistem] ⚠️ ${error.message}`
          : targetPersona.offlineMessage || `Maaf, sepertinya koneksiku sedang ada gangguan... 📡`,
        timestamp: new Date().toISOString()
      };
      setChatHistory((prev) => {
        const finalMessages = [...messagesForAI, errorMsg];
        saveChats(targetPersonaId, finalMessages);
        return { ...prev, [targetPersonaId]: finalMessages };
      });
      setIsTypingMap((prev) => ({ ...prev, [targetPersonaId]: false }));
    }
  }, [affinityLevels, allPersonas, memories, moods, userName]);

  const handleSendMessage = useCallback(async (content, image = null, replyTo = null) => {
    if ((!content.trim() && !image) || !activePersona) return;

    const newUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      image,
      timestamp: new Date().toISOString()
    };
    if (replyTo) {
      newUserMsg.replyTo = {
        id: replyTo.id,
        role: replyTo.role,
        content: replyTo.content
      };
    }

    const newMessages = [...(chatHistory[activePersonaId] || []), newUserMsg];
    setChatHistory((prev) => ({ ...prev, [activePersonaId]: newMessages }));
    await saveChats(activePersonaId, newMessages);

    await generateAndSaveAIResponse(newMessages, activePersonaId, activePersona);
  }, [activePersona, activePersonaId, chatHistory, generateAndSaveAIResponse]);

  const handleEdit = useCallback(async (messageId, newContent) => {
    if (!newContent.trim() || !activePersona) return;

    const messages = chatHistory[activePersonaId] || [];
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const oldMessage = messages[messageIndex];
    const newMessages = [
      ...messages.slice(0, messageIndex),
      {
        id: messageId,
        role: 'user',
        content: newContent,
        image: oldMessage.image,
        timestamp: new Date().toISOString()
      }
    ];

    setChatHistory((prev) => ({ ...prev, [activePersonaId]: newMessages }));
    await saveChats(activePersonaId, newMessages);

    await generateAndSaveAIResponse(newMessages, activePersonaId, activePersona);
  }, [activePersona, activePersonaId, chatHistory, generateAndSaveAIResponse]);

  // Resume interrupted AI generations if page was refreshed mid-stream
  useEffect(() => {
    if (!isDbLoaded) return;

    const timeoutId = setTimeout(() => {
      Object.keys(chatHistory).forEach((personaId) => {
        const msgs = chatHistory[personaId];
        if (msgs?.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.role === 'user' && !isTypingMap[personaId]) {
            const targetPersona = allPersonas.find((p) => p.id === personaId);
            if (targetPersona && !targetPersona.isApp) {
              console.log(`[useEchoManager] Resuming interrupted chat for ${targetPersona.name}...`);
              generateAndSaveAIResponse(msgs, personaId, targetPersona);
            }
          }
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isDbLoaded, chatHistory, isTypingMap, allPersonas, generateAndSaveAIResponse]);

  const handleTogglePin = useCallback((personaId) => {
    setPinnedPersonas((prev) => {
      let newPinned = prev || [];
      if (newPinned.includes(personaId)) {
        newPinned = newPinned.filter((id) => id !== personaId);
      } else {
        newPinned = [...newPinned, personaId];
      }
      savePinnedPersonas(newPinned);
      return newPinned;
    });
  }, []);

  const handleToggleArchive = useCallback((personaId) => {
    setArchivedPersonas((prev) => {
      let newArchived = prev || [];
      if (newArchived.includes(personaId)) {
        newArchived = newArchived.filter((id) => id !== personaId);
      } else {
        newArchived = [...newArchived, personaId];
      }
      saveArchivedPersonas(newArchived);
      return newArchived;
    });
  }, []);

  const handleClearChat = useCallback(async (targetPersonaId) => {
    const pId = targetPersonaId || activePersonaId;
    const targetPersona = allPersonas.find((p) => p.id === pId);
    if (!targetPersona) return;

    setChatHistory((prev) => ({ ...prev, [pId]: [] }));
    await saveChats(pId, []);
  }, [activePersonaId, allPersonas]);

  const handleRemoveFromMain = useCallback((id) => {
    setToolVisibility((prev) => {
      const next = { ...prev, [id]: false };
      saveToolVisibility(next);
      return next;
    });
    if (activePersonaId === id) {
      handleSelectPersona('home');
    }
  }, [activePersonaId, handleSelectPersona]);

  const handleUpdateApiConfig = useCallback((config) => {
    setApiConfigState(config);
    saveApiConfig(config);
    setAiApiConfig(config);
  }, []);

  const handleUpdateGlobalTheme = useCallback((themeId) => {
    setGlobalThemeId(themeId);
    saveGlobalTheme(themeId);
  }, []);

  return {
    activePersonaId,
    chatHistory,
    isTypingMap,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    sidebarView,
    setSidebarView,
    isDarkMode,
    setIsDarkMode: handleSetDarkMode,
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
    setApiConfig: handleUpdateApiConfig,
    bgEffectsEnabled,
    setBgEffectsEnabled,
    globalThemeId,
    setGlobalThemeId: handleUpdateGlobalTheme,
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
  };
}
