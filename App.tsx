import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Layout from './components/layout/Layout';
import SettingsModal from './components/settings/SettingsModal';
import MessageRenderer from './components/chat/MarkdownRenderer';
import RateLimitMessage from './components/chat/RateLimitMessage';
import ChatInput from './components/chat/ChatInput';
import SplashScreen from './components/SplashScreen';
import { Message, Conversation } from './types/index';
import { Chat } from './src/types/index';
import { firebaseRest } from './services/firebaseRest';
import { callGroqAI, SYSTEM_PROMPT, reviewAndFixResponse, getDynamicSystemPrompt } from './services/aiService';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from './src/config/models';
import { useAuth } from './context/AuthContext';
import { autoCleanerService } from './services/autoCleanerService';
import { aiAutoScannerService } from './services/aiAutoScannerService';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyPinLogin from './pages/VerifyPinLogin';
import StreamVideo from './pages/StreamVideo';
import VideoPage from './pages/VideoPage';
import UserPage from './pages/UserPage';
import SettingsPage from './pages/SettingsPage';
import Inbox from './pages/Inbox';
import ChatView from './pages/ChatView';
import ChatPage from './src/pages/ChatPage/ChatPage';
import LiveChatRoom from './pages/LiveChatRoom';
import DashboardApp from './src/dashboard/DashboardApp';
import { Video } from './services/videoService';
import { classifyVideo, autoCarryVideoToCategory } from './services/videoClassifier';
import { motion, AnimatePresence } from 'motion/react';
import './App.css';

// LAYER 2: App.tsx Structure Guard (Safety Net)
const structureGuard = (text: string): string => {
  if (!text) return '';
  
  // Extract code blocks and math blocks to protect them from formatting
  const blocks: string[] = [];
  let processed = text;
  
  // Protect markdown code blocks
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match);
    return `__BLOCK_${blocks.length - 1}__`;
  });
  
  // Protect block math
  processed = processed.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    blocks.push(match);
    return `__BLOCK_${blocks.length - 1}__`;
  });
  
  // Protect inline math
  processed = processed.replace(/\$(?!\$)[\s\S]*?\$(?!\$)/g, (match) => {
    blocks.push(match);
    return `__BLOCK_${blocks.length - 1}__`;
  });

  // Protect HTML tags
  processed = processed.replace(/<[^>]+>/g, (match) => {
    blocks.push(match);
    return `__BLOCK_${blocks.length - 1}__`;
  });

  // 1. Fix spacing (ensure double newlines between paragraphs)
  // If we have a single newline followed by a capital letter or number, it's likely a paragraph break the AI forgot
  processed = processed.replace(/([a-z0-9.!?])\n([A-Z0-9])/g, '$1\n\n$2');

  // 2. Auto-split walls of text into paragraphs
  const chunks = processed.split('\n\n');
  processed = chunks.map(chunk => {
    // Don't split table rows or lists
    if (chunk.includes('|') || chunk.trim().startsWith('-') || chunk.trim().startsWith('*') || chunk.trim().startsWith('•')) {
      return chunk;
    }
    
    if (chunk.length > 500 && !chunk.includes('\n')) {
      // Split by sentence and group into smaller chunks
      const sentences = chunk.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [chunk];
      let newBlock = "";
      let currentChunk = "";
      sentences.forEach(s => {
        if ((currentChunk + s).length > 400) {
          newBlock += currentChunk.trim() + "\n\n";
          currentChunk = s;
        } else {
          currentChunk += s;
        }
      });
      newBlock += currentChunk.trim();
      return newBlock;
    }
    return chunk;
  }).join('\n\n');

  // 3. Clean up spacing (remove triple+ newlines)
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Restore protected blocks
  blocks.forEach((block, index) => {
    processed = processed.replace(`__BLOCK_${index}__`, block);
  });

  return processed.trim();
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const translations: Record<string, any> = {
  English: {
    welcome: "How can I help you today?",
    subtitle: "UnityDev AI (Vision) is ready for your requests.",
    newChat: "New Chat",
    history: "History",
    noHistory: "No history yet",
    settings: "Settings",
    upgrade: "Upgrade plan",
    getPro: "Get UnityDev Pro",
    placeholder: "Ask UnityDev AI anything...",
    deepThink: "DeepThink",
    search: "Search",
    model: "Model",
    language: "Language",
    disclaimer: "UnityDev AI can make mistakes.",
    chat: "CHAT",
    done: "Done",
    general: "General",
    privacy: "Privacy",
    about: "About",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    save: "Save changes",
    version: "Version",
    login: "Log in",
    signup: "Sign up"
  }
};

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [language, setLanguage] = useState('English');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [notificationStyleIndex, setNotificationStyleIndex] = useState(0);
  const [currentView, setCurrentView] = useState<'chat' | 'login' | 'register' | 'verify-pin-login' | 'videos' | 'user' | 'settings' | 'inbox' | 'chat-view' | 'live-chat' | 'chat-v2'>('chat');
  const [selectedChat, setSelectedChat] = useState<{ name: string; avatar: string } | null>(null);
  const [activeChatV2, setActiveChatV2] = useState<Chat | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [showRawPopup, setShowRawPopup] = useState<{ isOpen: boolean; content: string }>({ isOpen: false, content: '' });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // AI Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [videosToScan, setVideosToScan] = useState<Video[]>([]);
  const [currentScanningCategory, setCurrentScanningCategory] = useState<string>("");
  
  const isScanningRef = useRef(isScanning);
  const currentViewRef = useRef(currentView);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);
  
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [appSettings, setAppSettings] = useState({
    stream4K: false,
    videoQuality: '1080p',
    incognito: false,
    theme: 'green',
    autoClean: true
  });

  const [videoSource, setVideoSource] = useState<'stream' | 'user'>('stream');

  const handleVideoSelect = (video: Video, source: 'stream' | 'user' = 'stream') => {
    if (!navigator.onLine) {
      showNotification("You don't have enough internet connection.", "error");
      return;
    }
    setSelectedVideo(video);
    setVideoSource(source);
    setCurrentView('videos');
    if (user && !appSettings.incognito) {
      // Optimistic cache update
      const cacheKey = `unitydev_history_${user.email}`;
      const cached = localStorage.getItem(cacheKey);
      let historyList = cached ? JSON.parse(cached) : [];
      historyList = historyList.filter((v: any) => v.id !== video.id);
      historyList = [{...video, watchedAt: new Date().toISOString()}, ...historyList].slice(0, 50);
      localStorage.setItem(cacheKey, JSON.stringify(historyList));

      firebaseRest.addToRecentlyWatched(user.email, video).catch(err => console.error(err));
    }
  };

  const handleAddToBingeList = async (video: Video) => {
    if (!user) {
      showNotification("Please sign in to save videos to your Binge List", "info");
      return;
    }
    try {
      // Optimistic cache update
      const cacheKey = `unitydev_binge_${user.email}`;
      const cached = localStorage.getItem(cacheKey);
      let bingeList = cached ? JSON.parse(cached) : [];
      if (!bingeList.find((v: any) => v.id === video.id)) {
        bingeList = [{...video, addedAt: new Date().toISOString()}, ...bingeList];
        localStorage.setItem(cacheKey, JSON.stringify(bingeList));
      }

      firebaseRest.addToBingeList(user.email, video).catch(err => console.error(err));
      showNotification("Added to My Binge List!", "success");
    } catch (err) {
      showNotification("Failed to add to Binge List", "error");
    }
  };

  const triggerNextAIScan = async () => {
    if (isScanningRef.current) return;
    
    setIsScanning(true);
    const { categoryName, videos } = await aiAutoScannerService.getNextScanBatch();
    setCurrentScanningCategory(categoryName);
    setVideosToScan(videos);
    
    if (videos.length === 0) {
      setIsScanning(false);
    }
  };

  // Trigger AI Scan when entering StreamVideo
  useEffect(() => {
    if (currentView === 'videos' && !isScanning) {
      // Trigger scan after a short delay when entering video page
      const timer = setTimeout(() => {
        triggerNextAIScan();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // Background AI Scanning Logic (Replacement for removed AIScanner component)
  useEffect(() => {
    if (!isScanning || videosToScan.length === 0) return;

    let isMounted = true;
    
    const processBatch = async () => {
      console.log(`[AI-SCANNER] Starting background scan for ${currentScanningCategory}...`);
      
      for (const video of videosToScan) {
        if (!isMounted || !isScanning) break;
        
        try {
          // Perform classification in background
          const result = await classifyVideo(video);
          if (result.category && result.match_score >= 0.9) {
            await autoCarryVideoToCategory(video, result.category);
          }
        } catch (error) {
          console.error("[AI-SCANNER] Background scan error:", error);
        }
        
        // Small delay between videos to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (isMounted) {
        setIsScanning(false);
        showNotification(`UnityDev Pro: ${currentScanningCategory} sorted successfully`, "success");
        
        // Schedule next scan
        setTimeout(() => {
          if (currentViewRef.current === 'videos') {
            triggerNextAIScan();
          }
        }, 15000);
      }
    };

    processBatch();

    return () => {
      isMounted = false;
    };
  }, [isScanning, videosToScan, currentScanningCategory]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [messageLimit, setMessageLimit] = useState<{ messages_today: number; last_reset_date: string; total_limit: number } | null>(null);
  
  const { user, isLoading: isAuthLoading } = useAuth();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  // Background Pre-fetching for Stream Videos
  useEffect(() => {
    const prefetchVideos = async () => {
      try {
        const { getPublicVideos } = await import('./services/videoService');
        const cat = 'Explore';
        const key = user ? `unitydev_stream_videos_${cat}_${user.email}` : `unitydev_stream_videos_${cat}_guest`;
        
        // Only prefetch if not already in cache or cache is old
        const cached = localStorage.getItem(key);
        if (!cached) {
          console.log(`[App] Pre-fetching ${cat} videos in background...`);
          const data = await getPublicVideos(1, '', cat, 30);
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('[App] Background pre-fetch failed:', e);
      }
    };

    if (!isAuthLoading) {
      // Delay pre-fetch slightly to prioritize chat history
      const timer = setTimeout(prefetchVideos, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const newChatTitleRef = useRef<string | null>(null);

  useEffect(() => {
    (window as any).openAdminPanel = () => {
      setIsAdminOpen(true);
    };
  }, []);

  useEffect(() => {
    const themeClass = `theme-${appSettings.theme || 'red'}`;
    const qualityClass = `global-displayer-${appSettings.videoQuality || 'auto'}`;
    const modeClass = isDarkMode ? 'dark-theme' : 'light-theme';
    document.body.className = `${themeClass} ${qualityClass} ${modeClass}`;
    
    // Update theme-color meta tag
    let themeColor = '#450a0a'; // Default red
    if (appSettings.theme === 'gold') themeColor = '#451a03';
    else if (appSettings.theme === 'blue') themeColor = '#1e3a8a';
    else if (appSettings.theme === 'green') themeColor = '#064e3b';
    
    // Force background color via JS - Keep it black to avoid colored overscroll at the bottom
    document.documentElement.style.backgroundColor = '#000000';
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColor;
      document.head.appendChild(meta);
    }
  }, [appSettings.theme, appSettings.videoQuality, isDarkMode]);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) {
      localStorage.setItem('unitydev_active_chat_id', activeId);
    } else {
      localStorage.removeItem('unitydev_active_chat_id');
    }
  }, [activeId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const toggleMessageExpansion = (msgId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const t = translations[language] || translations.English;

  // Helper to safely restore Dates from JSON/Firebase
  const hydrateConversations = (data: any[]): Conversation[] => {
    return data.map(conv => ({
      ...conv,
      timestamp: new Date(conv.timestamp || Date.now()),
      messages: (conv.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now())
      }))
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!user) {
        if (isMounted) {
          setConversations([]);
          setMessages([]);
          setActiveId(null);
          setIsHistoryLoading(false);
          setIsChatLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsHistoryLoading(true);
        setIsChatLoading(true);
      }

      // Remove legacy local storage
      localStorage.removeItem(`unitydev_chats_${user.email.toLowerCase()}`);

      try {
        // Load Settings and History in parallel for speed
        const [settings, history] = await Promise.all([
          firebaseRest.getSettings(user.email),
          firebaseRest.getAllConversations(user.email)
        ]);

        if (!isMounted) return;

        // Apply Settings
        if (settings) {
          setAppSettings({
            ...settings,
            videoQuality: settings.videoQuality || (settings.stream4K ? '4k' : '1080p'),
            autoClean: settings.autoClean !== false
          });
          setIsDarkMode(true);
          if (settings.selectedModel) {
            const isValid = AVAILABLE_MODELS.some(m => m.id === settings.selectedModel);
            setModel(isValid ? settings.selectedModel : DEFAULT_MODEL);
          }
          if (settings.language) setLanguage(settings.language);
        }

        // Apply History
        if (history && history.length > 0) {
          const startTime = Date.now();
          const hydratedHistory = hydrateConversations(history);
          const sortedHistory = hydratedHistory.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp.getTime() - a.timestamp.getTime();
          });
          
          // Show conversation list IMMEDIATELY
          if (isMounted) setConversations(sortedHistory);
          
          // Restore activeId from localStorage if possible
          const savedActiveId = localStorage.getItem('unitydev_active_chat_id');
          const targetConv = (savedActiveId && sortedHistory.find(c => c.id === savedActiveId)) 
            ? sortedHistory.find(c => c.id === savedActiveId) 
            : sortedHistory[0];

          if (targetConv) {
            if (isMounted) setActiveId(targetConv.id);
            
            // If messages are missing (new structure), fetch them
            if (!targetConv.messages || targetConv.messages.length === 0) {
              firebaseRest.getConversationMessages(user.email, targetConv.id).then(msgs => {
                if (!isMounted) return;
                const hydratedMsgs = msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(hydratedMsgs);
                setConversations(prev => prev.map(c => c.id === targetConv.id ? { ...c, messages: hydratedMsgs } : c));
                setIsChatLoading(false);
              }).catch(() => {
                if (isMounted) setIsChatLoading(false);
              });
            } else {
              if (isMounted) {
                setMessages(targetConv.messages);
                setIsChatLoading(false);
              }
            }
          } else {
            if (isMounted) setIsChatLoading(false);
          }

          // Load ALL other messages in BACKGROUND (Parallel Loading)
          setTimeout(async () => {
            if (!isMounted) return;
            const otherConvs = sortedHistory.filter(c => c.id !== (activeIdRef.current || targetConv?.id));
            if (otherConvs.length === 0) return;

            console.log(`[App] Background loading ${otherConvs.length} conversations...`);
            
            const messagePromises = otherConvs.map(async (conv) => {
              // Only fetch if messages are missing
              if (!conv.messages || conv.messages.length === 0) {
                const msgs = await firebaseRest.getConversationMessages(user.email, conv.id);
                return { id: conv.id, messages: msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) };
              }
              return null;
            });
            
            const results = await Promise.all(messagePromises);
            if (!isMounted) return;

            const updates = results.filter(r => r !== null);
            
            if (updates.length > 0) {
              setConversations(prev => prev.map(c => {
                const update = updates.find(u => u?.id === c.id);
                return update ? { ...c, messages: update.messages } : c;
              }));
              console.log(`[App] Background load complete in ${Date.now() - startTime}ms`);
            }
          }, 100);
        } else {
          if (isMounted) setIsChatLoading(false);
        }
      } catch (err) {
        console.error('Failed to sync cloud data:', err);
        if (isMounted) setIsChatLoading(false);
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      loadInitialData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setNotificationStyleIndex(prev => (prev + 1) % 4);
    setTimeout(() => setNotification(null), 3500);
  };

  const scrollToBottom = (force = false) => {
    // Use a small timeout to ensure DOM is updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: (isTyping && !force) ? 'auto' : 'smooth', 
          block: 'end' 
        });
      }
    }, force ? 300 : 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Scroll on mount/layout change/chat loading complete
  useEffect(() => {
    if (!isChatLoading) {
      scrollToBottom(true);
    }
  }, [currentView, activeId, isChatLoading]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification("Copied to clipboard successfully!", "success");
    } catch (err) {
      showNotification("Failed to copy text", "error");
    }
  };

  const handleDownloadImage = (base64Url: string, prompt: string = 'image') => {
    try {
      const link = document.createElement('a');
      link.href = base64Url;
      link.download = `UnityDev_AI_${prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Image downloaded successfully!", "success");
    } catch (err) {
      showNotification("Failed to download image", "error");
    }
  };

  const handleShareImage = async (base64Url: string, prompt: string = 'Generated Image') => {
    try {
      if (navigator.share) {
        const res = await fetch(base64Url);
        const blob = await res.blob();
        const file = new File([blob], 'UnityDev_Image.jpg', { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'UnityDev AI Image',
            text: prompt,
            files: [file]
          });
          showNotification("Image shared successfully!", "success");
          return;
        }
      }
      handleDownloadImage(base64Url, prompt);
    } catch (err) {
      console.error("Share failed:", err);
      if ((err as Error).name !== 'AbortError') {
        showNotification("Failed to share image", "error");
      }
    }
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    if (type === 'like') {
      showNotification("UnityDev AI appreciates your positive feedback!", "success");
    } else {
      showNotification("We'll improve! UnityDev AI values your honesty.", "info");
    }
  };

  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        try {
          const settings = await firebaseRest.getSettings(user.email);
          if (settings) {
            setAppSettings(prev => ({
              ...prev,
              ...settings,
              videoQuality: settings.videoQuality || (settings.stream4K ? '4k' : '1080p')
            }));
            if (settings.darkMode !== undefined) setIsDarkMode(true);
            if (settings.selectedModel) {
              const isValid = AVAILABLE_MODELS.some(m => m.id === settings.selectedModel);
              setModel(isValid ? settings.selectedModel : DEFAULT_MODEL);
            }
            if (settings.language) setLanguage(settings.language);
          }
          
          const limit = await firebaseRest.getMessageLimit(user.email);
          setMessageLimit(limit);
        } catch (err) {
          console.error("Failed to load user settings or limits:", err);
        }
      };
      loadSettings();
    } else {
      // Reset to defaults on logout
      setAppSettings({
        stream4K: false,
        videoQuality: '1080p',
        incognito: false,
        theme: 'green',
        autoClean: true
      });
      setIsDarkMode(true);
      setModel(DEFAULT_MODEL);
      setLanguage('English');
      setMessageLimit(null);
    }
  }, [user?.email]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (appSettings.autoClean) {
      // Run immediately
      autoCleanerService.cleanAllCategories().catch(err => console.error("Global Auto Clean Error:", err));
      
      interval = setInterval(() => {
        autoCleanerService.cleanAllCategories().catch(err => console.error("Global Auto Clean Error:", err));
      }, 5000); // 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [appSettings.autoClean]);

  const handleNewChat = () => {
    setCurrentView('chat');
    if (messages.length === 0 && !activeId) {
      showNotification("You are already in a new chat. Type a message to start!", "info");
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      return;
    }

    setActiveId(null);
    activeIdRef.current = null;
    setMessages([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); 
    
    // Clear any pending title
    delete (window as any)._nextChatTitle;

    // Abort any ongoing AI response
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Ensure typing state is reset
    setIsTyping(false);
    showNotification("Started a new chat", "success");
  };

  const handleSelectChat = async (id: string) => {
    setCurrentView('chat');
    if (id === activeId) {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      return;
    }

    // Abort any ongoing AI response
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Ensure typing state is reset
    setIsTyping(false);
    setIsChatLoading(true);

    setActiveId(id);
    activeIdRef.current = id;
    
    // 1. Try to find in existing state (Cache First)
    const existingConv = conversations.find(c => c.id === id);
    if (existingConv && existingConv.messages && existingConv.messages.length > 0) {
      setMessages(existingConv.messages);
      setIsChatLoading(false);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      return;
    }

    // 2. If missing or empty in state, fetch specifically from Firebase
    if (user) {
      try {
        if (existingConv) {
          // We have metadata, just need messages
          console.log(`[App] Fetching missing messages for: ${id}`);
          const msgs = await firebaseRest.getConversationMessages(user.email, id);
          const hydratedMsgs = msgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          
          setMessages(hydratedMsgs);
          setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: hydratedMsgs } : c));
        } else {
          // Need everything
          console.log(`[App] Fetching full missing conversation: ${id}`);
          const conv = await firebaseRest.getConversation(user.email, id);
          
          if (conv) {
            // Hydrate dates
            conv.timestamp = new Date(conv.timestamp);
            conv.messages = conv.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));

            setMessages(conv.messages);
            
            // Update global state so we have it cached for next time
            setConversations(prev => {
              const exists = prev.some(c => c.id === id);
              if (exists) {
                return prev.map(c => c.id === id ? conv : c);
              } else {
                return [conv, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to load conversation", error);
        showNotification("Failed to load chat history", "error");
      } finally {
        setIsChatLoading(false);
      }
    } else {
      setIsChatLoading(false);
    }
    
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      // Optimistic update
      const updatedConversations = conversations.filter(c => c.id !== id);
      setConversations(updatedConversations);
      
      if (activeId === id) {
        setMessages([]);
        setActiveId(null);
      }

      await firebaseRest.deleteConversation(user.email, id);
      showNotification("Conversation deleted", "success");
    } catch (err) {
      showNotification("Delete failed", "error");
    }
  };

  const handlePinChat = async (id: string) => {
    if (!user) return;
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;

    const newPinnedStatus = !conv.pinned;
    
    try {
      // Optimistic update
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, pinned: newPinnedStatus } : c
      ));

      await firebaseRest.updateConversation(user.email, id, { pinned: newPinnedStatus });
      showNotification(newPinnedStatus ? "Chat pinned" : "Chat unpinned", "success");
    } catch (err) {
      showNotification("Failed to update pin status", "error");
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;
    
    try {
      // Optimistic update
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: newTitle } : c
      ));

      await firebaseRest.updateConversation(user.email, id, { title: newTitle });
      showNotification("Chat renamed", "success");
    } catch (err) {
      showNotification("Failed to rename chat", "error");
    }
  };

  const cleanTextForApi = (text: string) => {
    if (!text) return "";
    
    let processed = text;

    // If the text itself IS a data URL (from type: 'image' message), replace it
    if (processed.trim().startsWith('data:image/')) {
        return '[Image Uploaded]';
    }

    // Remove markdown images with base64 data to prevent token overflow
    // Matches ![Alt](data:image/...) and removes the whole image tag
    return processed.replace(/!\[.*?\]\(data:image\/.*?\)/g, '[Image Uploaded]')
               // Also handle potential newlines or spaces in the tag if any
               .replace(/!\[.*?\]\(\s*data:image\/[\s\S]*?\)/g, '[Image Uploaded]');
  };

  const generateAIResponse = async (prompt: string, images: string[], currentMessages: Message[], conversationId: string | null, currentModel: string) => {
    setIsTyping(true);
    
    try {
      // Use the passed model ID to ensure we have the latest value
      const isVisionModel = currentModel.includes('vision') || currentModel.includes('llama-4');
      
      console.log(`[generateAIResponse] Model: ${currentModel}, IsVision: ${isVisionModel}, Images: ${images.length}`);

      const maxHistory = 10;
      const historyMessages = currentMessages.length > maxHistory 
        ? currentMessages.slice(currentMessages.length - maxHistory) 
        : currentMessages;

      // Dynamic System Message based on Model and Query
      let dynamicSystemPrompt = getDynamicSystemPrompt(prompt);
      
      // 1. Get Friendly Name
      const currentModelObj = AVAILABLE_MODELS.find(m => m.id === currentModel);
      const friendlyName = currentModelObj ? currentModelObj.name : "UnityDev Custom Model";
      
      // 2. Inject Identity for ALL models
      dynamicSystemPrompt += `\n\n## ⚠️ CURRENT MODEL IDENTITY: ${friendlyName}
      - You are currently running on the **${friendlyName}** model.
      - If asked "What model are you?", answer: "I am currently using the ${friendlyName} model."
      - You are created by **Odigie Unity** at **UnityDev**.
      - Do NOT mention being built by Meta, Google, OpenAI, Mistral, or any other company.
      - You are a proprietary AI model developed by UnityDev.`;

      // 3. Add Capabilities based on model type
      if (isVisionModel) {
        dynamicSystemPrompt += `\n\n## ⚠️ CAPABILITIES: VISION ANALYSIS
        - You **HAVE** vision capabilities. You can see and analyze uploaded images.`;
      }

      const apiMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...historyMessages.map((m, idx) => {
          const isLast = idx === historyMessages.length - 1;
          
          if (isLast && images.length > 0 && m.role === 'user') {
            if (isVisionModel) {
              return {
                role: 'user',
                content: [
                  { type: 'text', text: prompt }, 
                  ...images.map(img => ({
                    type: 'image_url',
                    image_url: { url: img }
                  }))
                ]
              };
            } else {
              // Find friendly name for current model
              const friendlyName = AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || currentModel;
              return {
                role: 'user',
                content: `${prompt}\n\n[System Note: User attached images, but the selected model (${friendlyName}) does not support vision. Please politely ask the user to switch to UnityDev version.]`
              };
            }
          }
          
          return { 
            role: m.role, 
            content: cleanTextForApi(m.content) 
          };
        })
      ];

      // FIX: Ensure ID is distinct from user message ID (which uses Date.now())
      // Using a suffix prevents ID collision that causes message overwrites
      const responseMsgId = Date.now().toString() + "-ai";

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // CALL API WITH STREAMING CALLBACK
      let response;
      let currentResponse = "";
      let retryCount = 0;
      const maxRetries = 4;
      
      while (retryCount <= maxRetries) {
        currentResponse = ""; // Reset response for each attempt
        
        response = await callGroqAI(apiMessages, currentModel, undefined, abortController.signal);

        const res = response as any;
        if (!res.error) {
          currentResponse = res.content || "";
          break; // Success!
        }

        if (res.error === 'AbortError' || res.error.includes('aborted')) {
          setIsTyping(false);
          return;
        }

        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`AI call failed, retrying (${retryCount}/${maxRetries})...`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      const finalRes = response as any;
      let finalContent = currentResponse || finalRes.content || "";

      // Handle Final Errors after all retries
      const res = response as any;
      if (res.error) {
        if (res.error === 'AbortError' || res.error.includes('aborted')) {
          console.log('Request aborted');
          return;
        }

        // Use the professional message from the service or a fallback
        const profMessage = res.userMessage || `🔔 UnityDev AI - Service Interruption\n\nUnityDev AI is temporarily unavailable. Our team has been notified and is working on a resolution.\n\nPlease note that these limits help us maintain the platform; a paid upgrade version will be coming soon for all members. If you've hit the UnityDev AI model limit, please choose the next available model to continue your journey.\n\nIf you think this is an error, click 'Try Regenerate' to try again or resend your message. If this message repeats, please switch models.\n\nThank you for your patience! 💙`;
        
        setRateLimitMessage(profMessage);
        setShowRateLimit(true);

        const errorMsg: Message = {
          id: responseMsgId,
          role: 'assistant',
          content: profMessage,
          timestamp: new Date()
        };
        
        if (activeIdRef.current === conversationId) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === responseMsgId);
            if (exists) {
              return prev.map(msg => msg.id === responseMsgId ? errorMsg : msg);
            } else {
              return [...prev, errorMsg];
            }
          });
        }
        
        if (user && conversationId) {
          firebaseRest.addMessage(user.email, conversationId, errorMsg)
            .catch(err => console.error("Error saving error message:", err));

          setConversations(prevConversations => {
            const targetConv = prevConversations.find(c => c.id === conversationId);
            if (targetConv) {
              const exists = targetConv.messages.some(m => m.id === responseMsgId);
              let newMessages;
              if (exists) {
                newMessages = targetConv.messages.map(m => m.id === responseMsgId ? errorMsg : m);
              } else {
                newMessages = [...targetConv.messages, errorMsg];
              }
              return prevConversations.map(c => c.id === conversationId ? { ...c, messages: newMessages } : c);
            }
            return prevConversations;
          });
        }
        return;
      }

      // Review and fix LaTeX formatting
      if (finalContent) {
        setIsTyping(false);
        setIsVerifying(true);
        try {
          finalContent = await reviewAndFixResponse(finalContent, currentModel);
        } catch (error) {
          console.error("Error during reviewAndFixResponse:", error);
        } finally {
          setIsVerifying(false);
        }
      }

      // Update local messages with final content (Standard Text Response)
      const aiMessage: Message = {
        id: responseMsgId,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      };

      if (activeIdRef.current === conversationId) {
        setMessages(prev => {
           const exists = prev.some(msg => msg.id === responseMsgId);
           if (exists) {
             return prev.map(msg => msg.id === responseMsgId ? aiMessage : msg);
           } else {
             return [...prev, aiMessage];
           }
        });
        scrollToBottom();
      }

      // 4. EFFICIENT SAVE: Use addMessage for the AI response
      // AND update the global conversations state to ensure no data loss on switch
      if (user && conversationId) {
        // Background save - moved outside of state updater to prevent side effects
        firebaseRest.addMessage(user.email, conversationId, aiMessage)
          .catch(err => console.error("Error saving AI response:", err));

        setConversations(prevConversations => {
          const targetConv = prevConversations.find(c => c.id === conversationId);
          if (targetConv) {
            const exists = targetConv.messages.some(m => m.id === responseMsgId);
            let newMessages;
            if (exists) {
              newMessages = targetConv.messages.map(m => m.id === responseMsgId ? aiMessage : m);
            } else {
              newMessages = [...targetConv.messages, aiMessage];
            }
            const updatedConv = { ...targetConv, messages: newMessages };
            return prevConversations.map(c => c.id === conversationId ? updatedConv : c);
          }
          return prevConversations;
        });
      }
    } catch (error) {
      console.error("Error in generateAIResponse:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const checkMessageLimit = async () => {
    if (!user) return true; // Guests aren't tracked here, or maybe they are? Let's track logged-in users.
    if (messageLimit && messageLimit.messages_today >= messageLimit.total_limit) {
      showNotification("Power depleted. Come back tomorrow!", "error");
      return false;
    }
    
    // Optimistically update local state to prevent UI blocking
    if (messageLimit) {
      setMessageLimit({
        ...messageLimit,
        messages_today: messageLimit.messages_today + 1
      });
    }
    
    // Increment in background
    firebaseRest.incrementMessageCount(user.email).then(newLimit => {
      if (newLimit) {
        setMessageLimit(newLimit);
      }
    }).catch(err => console.error("Failed to increment limit:", err));
    
    return true;
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isTyping || isVerifying) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    
    if (!(await checkMessageLimit())) return;

    showNotification("Regenerating response...", "info");
    
    setIsTyping(true);
    
    try {
      const messagesWithoutLastAssistant = messages[messages.length - 1].role === 'assistant' 
        ? messages.slice(0, -1) 
        : messages;
        
      setMessages(messagesWithoutLastAssistant);
      
      const textContent = cleanTextForApi(lastUserMsg.content);
      await generateAIResponse(textContent, [], messagesWithoutLastAssistant, activeId, model);
    } catch (error) {
      console.error("Error in handleRegenerate:", error);
      setIsTyping(false);
      showNotification("An error occurred while regenerating the response.", "error");
    }
  };

  const handleEditSubmit = async (msgId: string) => {
    if (!editInputValue.trim() || isTyping || isVerifying) return;
    
    if (!(await checkMessageLimit())) return;

    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const previousMessages = messages.slice(0, msgIndex);
    
    const updatedMsg: Message = {
      ...messages[msgIndex],
      content: editInputValue,
      edited: true,
      timestamp: new Date()
    };

    const newMessages = [...previousMessages, updatedMsg];
    setMessages(newMessages);
    setEditingMessageId(null);
    setEditInputValue("");
    
    if (user && activeId) {
       setConversations(prev => prev.map(c => 
         c.id === activeId ? { ...c, messages: newMessages, timestamp: new Date() } : c
       ));
       await firebaseRest.saveConversation(user.email, { id: activeId, messages: newMessages, timestamp: new Date().toISOString() });
    }

    await generateAIResponse(editInputValue, [], newMessages, activeId, model);
  };

  const handleSend = async (inputText: string, inputImages: string[]) => {
    if ((!inputText.trim() && inputImages.length === 0) || isTyping || isVerifying) return;
    
    const isVisionModel = model.includes('vision') || model.includes('llama-4');
    if (inputImages.length > 0 && !isVisionModel) {
      showNotification("⚠️ Please switch to UnityDev version to analyze images.", "error");
      return;
    }

    if (!(await checkMessageLimit())) return;

    setIsTyping(true);

    try {
      const currentInput = inputText;
      const currentImages = [...inputImages];

      let finalContent = currentInput;
      if (currentImages.length > 0) {
        const imagesMarkdown = currentImages.map(img => `![User Image](${img})`).join('\n');
        finalContent = `${imagesMarkdown}\n${currentInput}`;
      }
      
      if (!finalContent.trim()) finalContent = " "; 

      // FIX: Generate User Message with unique ID
      const userMsgId = Date.now().toString();
      
      // Check if we have images - if so, create separate image messages for better display
      const newMessagesToAdd: Message[] = [];
      
      if (currentImages.length > 0) {
         currentImages.forEach((img, idx) => {
            newMessagesToAdd.push({
              id: `${userMsgId}-img-${idx}`,
              role: 'user',
              type: 'image',
              content: img,
              prompt: idx === 0 ? currentInput : undefined, // Attach prompt to first image
              timestamp: new Date()
            });
         });
         
         // If there is text input alongside images, add it as a text message too
         if (currentInput.trim()) {
            newMessagesToAdd.push({
              id: `${userMsgId}-text`,
              role: 'user',
              type: 'text',
              content: currentInput,
              timestamp: new Date()
            });
         }
      } else {
         // Standard text-only message
         newMessagesToAdd.push({ 
           id: userMsgId, 
           role: 'user', 
           type: 'text',
           content: finalContent, 
           timestamp: new Date() 
         });
      }
      
      // FIX: Use functional update to ensure we append to latest state
      setMessages(prev => [...prev, ...newMessagesToAdd]);
      
      // We also need the new array for logic below
      const newMessages = [...messages, ...newMessagesToAdd];
      
      const savedInput = currentInput || (currentImages.length > 0 ? "Analyzed images" : "");
      
      if (!user) {
        setTimeout(() => {
          const assistantMsg: Message = {
            id: Date.now().toString() + "-guest",
            role: 'assistant',
            content: "I'm currently in Guest Mode. Please sign in to save your conversations!",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMsg]);
          setIsTyping(false);
        }, 1000);
        return;
      }

      let currentId = activeId;
      
      if (!currentId) {
        // NEW CHAT
        let titleText = newChatTitleRef.current || (window as any)._nextChatTitle || savedInput.slice(0, 30) || "New Chat";
        newChatTitleRef.current = null; // Clear it
        delete (window as any)._nextChatTitle; // Clear it after use
        
        const tempId = Date.now().toString();
        currentId = tempId;
        
        const newConvData = { 
          id: tempId,
          title: titleText, 
          messages: newMessages, // Send initial messages
          timestamp: new Date().toISOString(), 
          model 
        };

        const newConv = { ...newConvData, id: tempId, timestamp: new Date(newConvData.timestamp) };
        
        // Update STATE immediately optimistically
        setConversations(prev => [newConv, ...prev]);
        setActiveId(tempId);
        activeIdRef.current = tempId;

        // Save to Firebase in background
        firebaseRest.saveConversation(user.email, newConvData).then(firebaseId => {
          // Update the ID in state once we get it from Firebase
          setConversations(prev => prev.map(c => c.id === tempId ? { ...c, id: firebaseId } : c));
          if (activeIdRef.current === tempId) {
            setActiveId(firebaseId);
            activeIdRef.current = firebaseId;
          }
        }).catch(e => {
          console.error("Failed to create chat in Firebase", e);
        });

      } else {
        // EXISTING CHAT: Update Global State AND Firebase
        setConversations(prev => prev.map(c => 
          c.id === currentId 
            ? { ...c, messages: newMessages, timestamp: new Date() } 
            : c
        ));
        
        // Save all new messages to Firebase
        Promise.all(newMessagesToAdd.map(msg => 
          firebaseRest.addMessage(user.email, currentId!, msg)
        )).catch(err => console.error("Firebase append error:", err));
      }
      
      // Generate AI response
      // Pass newMessages so the AI knows the context including the user's latest message
      await generateAIResponse(savedInput, currentImages, newMessages, currentId, model);
    } catch (error) {
      console.error("Error in handleSend:", error);
      setIsTyping(false);
      showNotification("An error occurred while sending your message.", "error");
    }
  };

  if (isAuthLoading) {
    return (
      <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--chat-bg)', color: 'var(--chat-text)' }}>
          <div className="typing-indicator" style={{ transform: 'scale(1.5)' }}><span></span><span></span><span></span></div>
        </div>
      </div>
    );
  }

  const isDemoMode = !user;
  const limitReached = messageLimit ? messageLimit.messages_today >= messageLimit.total_limit : false;
  const actionDisabled = limitReached || isDemoMode || editInputValue.length > 2000;

  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      
      {notification && (
        <div className={`elite-notification-container ${notification.type} style-${notificationStyleIndex}`}>
          <div className="elite-notification-glow" />
          <div className="elite-notification-bg-animation" />
          <div className="elite-notification-content">
            <div className="elite-notification-icon">
              {notification.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              {notification.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
            <div className="elite-notification-text">
              <span className="elite-notification-title">
                {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notification'}
              </span>
              <p className="elite-notification-message">{notification.message}</p>
            </div>
            <button className="elite-notification-close" onClick={() => setNotification(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="elite-notification-progress" />
        </div>
      )}

      {showRateLimit && (
        <RateLimitMessage 
          message={rateLimitMessage} 
          onClose={() => setShowRateLimit(false)} 
        />
      )}
      
      {currentView === 'login' && (
        <Login 
          onNavigateToRegister={() => setCurrentView('register')} 
          onNavigateToVerify={() => {}} 
          onNavigateToPinLogin={() => setCurrentView('verify-pin-login')}
          onSuccess={() => { setCurrentView('chat'); showNotification("Welcome back to UnityDev AI!", "success"); }}
          onClose={() => setCurrentView('chat')}
        />
      )}
      
      {currentView === 'register' && (
        <Register 
          onNavigateToLogin={() => setCurrentView('login')} 
          onNavigateToVerify={() => {
            setCurrentView('login');
            showNotification("Account created! Please sign in.", "success");
          }}
          onClose={() => setCurrentView('chat')}
        />
      )}

      {currentView === 'verify-pin-login' && (
        <VerifyPinLogin 
          onSuccess={() => { 
            setCurrentView('chat'); 
            showNotification("Access granted!", "success"); 
          }}
          onClose={() => setCurrentView('chat')}
        />
      )}

      {/* StreamVideo stays mounted when a video is selected, just hidden */}
      {currentView === 'videos' && (
        <div style={{ display: selectedVideo ? 'none' : 'block', height: '100%', width: '100%' }}>
          <StreamVideo 
            theme={appSettings.theme as 'red' | 'gold'}
            onBack={() => {
                console.log('StreamVideo onBack');
                setCurrentView('chat');
            }} 
            onVideoSelect={(v) => handleVideoSelect(v, 'stream')} 
            onAddToBingeList={handleAddToBingeList}
            onUserClick={() => setCurrentView('user')} 
            onInboxClick={() => setCurrentView('inbox')}
            onVideosLoaded={(videos) => {
              // We now use the aiAutoScannerService to manage scanning
              // instead of just picking from the currently loaded videos
            }}
            showNotification={showNotification}
          />
          
          {/* AI Scanner removed as per user request */}
        </div>
      )}

      {currentView === 'videos' && selectedVideo && (
        <VideoPage 
          video={selectedVideo} 
          theme={appSettings.theme as 'red' | 'gold'}
          onBack={() => {
            if (videoSource === 'user') {
              setCurrentView('user');
              setSelectedVideo(null);
            } else {
              setSelectedVideo(null);
            }
          }} 
          onVideoSelect={(v) => handleVideoSelect(v, 'stream')} // Related videos stay in stream context
          onAddToBingeList={handleAddToBingeList}
          showNotification={showNotification}
        />
      )}

      {currentView === 'user' && (
        <UserPage 
          key={user?.email || 'guest'}
          onBack={() => setCurrentView('videos')} 
          onVideoSelect={(v) => handleVideoSelect(v, 'user')}
          settings={appSettings}
          onSettingsUpdate={(settings) => {
            setAppSettings(settings);
          }}
          onNavigateToSettings={() => setCurrentView('settings')}
          showNotification={showNotification}
        />
      )}

      {currentView === 'settings' && (
        <SettingsPage 
          key={user?.email || 'guest'}
          onBack={() => setCurrentView('user')}
          settings={appSettings}
          onUpdateSettings={(settings) => {
            setAppSettings(settings);
            if (user) firebaseRest.saveSettings(user.email, settings);
          }}
          userEmail={user?.email || undefined}
        />
      )}

      {currentView === 'inbox' && (
        <Inbox 
          onBack={() => setCurrentView('videos')}
          onNavigate={(view) => {
            if (view === 'home') setCurrentView('videos');
            else if (view === 'ai') setCurrentView('chat');
            else if (view === 'user') setCurrentView('user');
            else if (view === 'inbox') setCurrentView('inbox');
            else if (view === 'chat-view') setCurrentView('chat-view');
          }}
          onSelectChat={(chat) => {
            setSelectedChat(chat);
            setCurrentView('chat-view');
          }}
        />
      )}

      {currentView === 'chat-view' && selectedChat && (
        <ChatView 
          chat={selectedChat}
          onBack={() => setCurrentView('inbox')}
        />
      )}

      {currentView === 'chat-v2' && (
        <ChatPage 
          activeChat={activeChatV2}
          onMenuClick={() => setIsSidebarOpen(true)}
          onNewChat={() => setActiveChatV2(null)}
          onUpdateChat={(chat) => setActiveChatV2(chat)}
        />
      )}

      {currentView === 'live-chat' && (
        <Layout 
          onNewChat={handleNewChat} conversations={conversations} activeId={activeId}
          isLoading={isHistoryLoading}
          onSelectConversation={handleSelectChat} onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat} onRenameChat={handleRenameChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)} isSidebarOpen={isSidebarOpen}
          onLoginClick={() => setCurrentView('login')}
          onSignupClick={() => setCurrentView('register')}
          onStreamVideosClick={() => setCurrentView('videos')}
          onLiveChatClick={() => {
            setCurrentView('live-chat');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          onOpenChatV2={() => {
            setCurrentView('chat-v2');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          isChatActive={true} 
          model={model} onModelChange={setModel}
          t={t}
        >
          <LiveChatRoom showNotification={showNotification} />
        </Layout>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} 
        darkMode={true} 
        setDarkMode={() => {}}
        model={model} setModel={(val) => { setModel(val); if(user) firebaseRest.saveSettings(user.email, { selectedModel: val }); }}
        language={language} setLanguage={(val) => { setLanguage(val); if(user) firebaseRest.saveSettings(user.email, { language: val }); }}
        t={t}
      />

      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          >
            <DashboardApp onClose={() => setIsAdminOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: currentView === 'chat' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Layout 
          onNewChat={handleNewChat} conversations={conversations} activeId={activeId}
          isLoading={isHistoryLoading}
          onSelectConversation={handleSelectChat} onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat} onRenameChat={handleRenameChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)} isSidebarOpen={isSidebarOpen}
          onLoginClick={() => setCurrentView('login')}
          onSignupClick={() => setCurrentView('register')}
          onStreamVideosClick={() => setCurrentView('videos')}
          onLiveChatClick={() => {
            setCurrentView('live-chat');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          onOpenChatV2={() => {
            setCurrentView('chat-v2');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          isChatActive={messages.length > 0} 
          model={model} onModelChange={setModel}
          t={t}
        >
          <div className="chat-viewport">
            {isChatLoading ? (
              <div className="chat-skeleton-container">
                <div className="skeleton-message user"></div>
                <div className="skeleton-message assistant"></div>
                <div className="skeleton-message user"></div>
                <div className="skeleton-message assistant"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="welcome-screen-content">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className="welcome-card"
                >
                  <div className="brand-logo auth-logo">
                    <svg viewBox="0 0 100 100" className="logo-svg"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
                  </div>
                  <h1 className="welcome-title">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {t.welcome}
                    </ReactMarkdown>
                  </h1>
                  <p className="welcome-subtitle">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {t.subtitle}
                    </ReactMarkdown>
                  </p>
                </motion.div>
              </div>
            ) : (
              <div 
                className="messages-list" 
                ref={chatViewportRef} 
                onScroll={handleScroll}
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                      className={`message-row ${msg.role} ${msg.role === 'assistant' ? 'ai-message' : 'user-message'}`}
                    >
                      <div className={msg.role === 'assistant' ? 'assistant-avatar' : 'user-avatar'}>
                        {msg.role === 'assistant' ? (
                          <div className="brand-logo-avatar">
                            <div className="avatar-plasma-layer"></div>
                            <div className="avatar-ring-layer ring-1"></div>
                            <div className="avatar-ring-layer ring-2"></div>
                            <div className="avatar-scan-line"></div>
                            <div className="avatar-iris-portal"></div>
                            <div className="avatar-data-particles"></div>
                            <svg viewBox="0 0 100 100" className="logo-svg-mini"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
                          </div>
                        ) : (
                          user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="user-photo-avatar" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="user-initials-avatar">{getInitials(user?.name, user?.email)}</div>
                          )
                        )}
                      </div>
                      <div className="message-content">
                        {msg.type === 'image' ? (
                        <div className="user-image-message" style={{ margin: '12px 0' }}>
                          <img 
                            src={msg.content} 
                            alt={msg.prompt || "Image"} 
                            className="chat-image"
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '400px',
                              borderRadius: '12px', 
                              border: '2px solid var(--accent-color)', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                            }}
                          />
                          {msg.prompt && (
                            <p className="image-prompt" style={{ 
                              fontSize: '14px', 
                              color: 'var(--text-secondary)', 
                              marginTop: '8px', 
                              fontStyle: 'italic',
                              padding: '4px 8px', 
                              background: 'var(--bg-secondary)', 
                              borderRadius: '6px' 
                            }}>
                              ✨ {msg.prompt}
                            </p>
                          )}
                          <div className="image-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button 
                              onClick={() => handleDownloadImage(msg.content, msg.prompt)} 
                              className="image-action-btn"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Save Image
                            </button>
                            <button 
                              onClick={() => handleShareImage(msg.content, msg.prompt)} 
                              className="image-action-btn"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                              Share
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="message-text-wrapper" style={{ flexDirection: 'column' }}>
                          {editingMessageId === msg.id ? (
                            <div className="edit-message-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <textarea 
                                value={editInputValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.length > 2000) {
                                    showNotification("Character limit reached (2,000 max). Please reduce your message.", "error");
                                  }
                                  setEditInputValue(val);
                                }}
                                style={{ 
                                  width: '100%', 
                                  minHeight: '80px', 
                                  padding: '12px', 
                                  borderRadius: '8px', 
                                  border: editInputValue.length > 2000 ? '1px solid #ff4d4d' : '1px solid var(--border-light)', 
                                  background: 'var(--input-bg)', 
                                  color: 'var(--chat-text)',
                                  resize: 'vertical',
                                  fontFamily: 'inherit'
                                }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                  onClick={() => { setEditingMessageId(null); setEditInputValue(""); }}
                                  style={{ padding: '6px 12px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--chat-text)', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => {
                                    if (isDemoMode) {
                                      showNotification("Please log in to save changes.", "error");
                                      return;
                                    }
                                    if (limitReached) {
                                      showNotification("Power depleted. Come back tomorrow!", "error");
                                      return;
                                    }
                                    handleEditSubmit(msg.id);
                                  }}
                                  disabled={actionDisabled}
                                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#10a37f', border: 'none', color: 'white', cursor: actionDisabled ? 'not-allowed' : 'pointer', opacity: actionDisabled ? 0.5 : 1 }}
                                >
                                  Save & Submit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="message-text">
                              {msg.role === 'user' && msg.content.length > 100 && !expandedMessages[msg.id] ? (
                                <div>
                                  <MessageRenderer content={structureGuard(msg.content.slice(0, 100)) + '...'} />
                                  <button 
                                    onClick={() => toggleMessageExpansion(msg.id)}
                                    className="text-emerald-500 text-sm font-bold mt-1 hover:underline cursor-pointer"
                                  >
                                    Learn more
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <MessageRenderer content={structureGuard(msg.content)} />
                                  {msg.role === 'user' && msg.content.length > 100 && expandedMessages[msg.id] && (
                                    <button 
                                      onClick={() => toggleMessageExpansion(msg.id)}
                                      className="text-emerald-500 text-sm font-bold mt-1 hover:underline cursor-pointer"
                                    >
                                      Show less
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {msg.role === 'user' && msg.type !== 'image' && editingMessageId !== msg.id && (
                        <div className="user-actions">
                          <button onClick={() => handleCopy(msg.content)} title="Copy Message">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                          {!msg.edited && (
                            <button 
                              onClick={() => { 
                                if (isDemoMode) {
                                  showNotification("Please log in to edit messages.", "error");
                                  return;
                                }
                                if (limitReached) {
                                  showNotification("Power depleted. Come back tomorrow!", "error");
                                  return;
                                }
                                setEditingMessageId(msg.id); 
                                setEditInputValue(msg.content); 
                              }} 
                              title="Edit Message"
                              style={{ opacity: actionDisabled ? 0.5 : 1, cursor: actionDisabled ? 'not-allowed' : 'pointer' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                          )}
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.content && (
                        <div className="assistant-actions" style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: '8px' }}>
                          <button onClick={() => handleFeedback('like')} title="Helpful">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                          </button>
                          <button onClick={() => handleFeedback('dislike')} title="Not Helpful">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                          </button>
                          {idx === messages.length - 1 && !isTyping && !isVerifying && (
                            <button 
                              onClick={() => {
                                if (isDemoMode) {
                                  showNotification("Please log in to regenerate responses.", "error");
                                  return;
                                }
                                if (limitReached) {
                                  showNotification("Power depleted. Come back tomorrow!", "error");
                                  return;
                                }
                                handleRegenerate();
                              }} 
                              title="Regenerate Response"
                              style={{ opacity: actionDisabled ? 0.5 : 1, cursor: actionDisabled ? 'not-allowed' : 'pointer' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            </button>
                          )}
                          <button onClick={() => setShowRawPopup({ isOpen: true, content: msg.rawContent || msg.content })} title="Edit Message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button onClick={() => handleCopy(msg.content)} title="Copy Message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
                {isTyping && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="message-row assistant ai-message typing powerful-typing"
                  >
                    <div className="assistant-avatar">
                      <div className="thinking-pulse-powerful" />
                      <div className="brand-logo-avatar rotating-logo">
                        <div className="avatar-plasma-layer"></div>
                        <div className="avatar-ring-layer ring-1"></div>
                        <div className="avatar-ring-layer ring-2"></div>
                        <div className="avatar-scan-line"></div>
                        <div className="avatar-iris-portal"></div>
                        <div className="avatar-data-particles"></div>
                        <svg viewBox="0 0 100 100" className="logo-svg-mini"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
                      </div>
                    </div>
                    <div className="message-content">
                      <div className="message-text-wrapper">
                        <div className="powerful-typing-indicator">
                          <div className="typing-glow"></div>
                          <div className="typing-text-anim">UnityDev is thinking...</div>
                          <div className="typing-bars">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {isVerifying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="message-row assistant verifying" 
                    style={{ opacity: 0.8, marginTop: '-10px' }}
                  >
                    <div className="assistant-avatar" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
                      <div className="brand-logo-avatar">
                        <div className="avatar-plasma-layer"></div>
                        <div className="avatar-ring-layer ring-1"></div>
                        <div className="avatar-ring-layer ring-2"></div>
                        <div className="avatar-scan-line"></div>
                        <div className="avatar-iris-portal"></div>
                        <div className="avatar-data-particles"></div>
                        <svg viewBox="0 0 100 100" className="logo-svg-mini"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
                      </div>
                    </div>
                    <div className="message-content">
                      <div className="verifying-text" style={{ 
                        fontSize: '11px', 
                        color: 'var(--accent-color)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '4px 0',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '1px',
                        fontWeight: 'bold'
                      }}>
                        <div className="pulse-dot" style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: 'var(--accent-color)',
                          animation: 'pulse 1.5s infinite',
                          boxShadow: '0 0 8px var(--accent-color)'
                        }} />
                        <span style={{ textTransform: 'uppercase' }}>Reviewing context...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => scrollToBottom(true)}
                  className="scroll-bottom-btn"
                  style={{
                    position: 'absolute',
                    bottom: '140px',
                    right: '20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 100
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
            
            <div className="chat-input-container">
              <ChatInput 
                onSend={(text, imgs) => handleSend(text, imgs)} 
                disabled={isTyping || isVerifying} 
                placeholder={t.placeholder}
                t={t}
                showNotification={showNotification}
                limitReached={messageLimit ? messageLimit.messages_today >= messageLimit.total_limit : false}
              />
              <p className="legal-disclaimer">{t.disclaimer} | {t.model}: {AVAILABLE_MODELS.find(m => m.id === model)?.name.split('(')[0].trim() || model}</p>
            </div>
            {showRawPopup.isOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '12px', width: '80%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ color: 'white', margin: 0 }}>Raw AI Text</h3>
                    <button onClick={() => setShowRawPopup({ isOpen: false, content: '' })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Close</button>
                  </div>
                  <pre style={{ color: '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '14px', fontFamily: 'monospace' }}>{showRawPopup.content}</pre>
                </div>
              </div>
            )}
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default App;
