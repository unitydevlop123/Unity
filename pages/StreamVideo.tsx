import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, Zap, PlusCircle, Library, Bell, Search, Cast, MoreVertical, Bot, Loader2, BadgeCheck, ArrowLeft, Mic, Clock, ArrowUpLeft, Inbox } from 'lucide-react';
import { getPublicVideos, Video } from '../services/videoService';
import { firebaseRest } from '../services/firebaseRest';
import { useAuth } from '../context/AuthContext';
import { callStreamAI } from '../services/streamAI/streamClassifier';
import './StreamVideo.css';

interface StreamVideoProps {
  onBack?: () => void;
  onVideoSelect?: (video: Video) => void;
  onUserClick?: () => void;
  onInboxClick?: () => void;
  onAddToBingeList?: (video: Video) => void;
  onVideosLoaded?: (videos: Video[]) => void;
  theme: 'red' | 'gold' | 'blue' | 'green';
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const VideoSkeleton = () => (
  <div className="video-card flex flex-col mb-6">
    <div className="w-full aspect-video bg-zinc-800/50 rounded-xl mb-4 relative overflow-hidden">
      <div className="shimmer-overlay absolute inset-0" />
    </div>
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0 relative overflow-hidden">
        <div className="shimmer-overlay absolute inset-0" />
      </div>
      <div className="flex flex-col flex-1 gap-2">
        <div className="h-4 bg-zinc-800/50 rounded w-3/4 relative overflow-hidden">
          <div className="shimmer-overlay absolute inset-0" />
        </div>
        <div className="h-3 bg-zinc-800/50 rounded w-1/2 relative overflow-hidden">
          <div className="shimmer-overlay absolute inset-0" />
        </div>
      </div>
    </div>
  </div>
);

const StreamVideo: React.FC<StreamVideoProps> = ({ onBack, onVideoSelect, onUserClick, onInboxClick, onAddToBingeList, onVideosLoaded, theme, showNotification }) => {
  const themeColor = theme === 'gold' ? 'bg-amber-600' : 
                    theme === 'blue' ? 'bg-blue-600' :
                    theme === 'green' ? 'bg-emerald-600' : 'bg-red-600';
  const themeGlow = theme === 'gold' ? 'shadow-amber-500/50' : 
                   theme === 'blue' ? 'shadow-blue-500/50' :
                   theme === 'green' ? 'shadow-emerald-500/50' : 'shadow-red-500/50';
  const themeText = theme === 'gold' ? 'text-amber-500' : 
                    theme === 'blue' ? 'text-blue-500' :
                    theme === 'green' ? 'text-emerald-500' : 'text-red-500';
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const key = user ? `unitydev_stream_videos_Explore_${user.email}` : 'unitydev_stream_videos_Explore_guest';
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const key = user ? `unitydev_stream_videos_Explore_${user.email}` : 'unitydev_stream_videos_Explore_guest';
      const cached = localStorage.getItem(key);
      return cached ? false : true;
    } catch (e) {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const key = user ? `stream_search_history_${user.email}` : 'stream_search_history_guest';
      const saved = localStorage.getItem(key);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };
  
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchVideos = async (pageNum: number, isInitial: boolean = false, query: string = searchQuery, cat: string = activeCategory, isRefresh: boolean = false) => {
    try {
      if (isInitial && !isRefresh) {
        const key = user ? `unitydev_stream_videos_${cat}_${user.email}` : `unitydev_stream_videos_${cat}_guest`;
        const cached = localStorage.getItem(key);
        
        if (cached) {
          const cachedData = JSON.parse(cached);
          setVideos(cachedData);
          // If we have cached data, we don't show the full-page loader
          setLoading(false);
        } else {
          // No cache, show skeletons
          setLoading(true);
        }
      }
      else if (!isInitial && !isRefresh) setLoadingMore(true);
      
      let data: Video[] = [];
      data = await getPublicVideos(pageNum, query, cat, 30);
      
      if (isInitial || isRefresh) {
        setVideos(data);
        if (onVideosLoaded) onVideosLoaded(data);
        
        // Update cache
        if (!query && pageNum === 1) {
          const key = user ? `unitydev_stream_videos_${cat}_${user.email}` : `unitydev_stream_videos_${cat}_guest`;
          localStorage.setItem(key, JSON.stringify(data));
        }
        
        if (data.length === 0 && !query && cat === 'Explore') setError("Failed to load videos from UnityDev Stream.");
        else setError(null);
      } else {
        const existingIds = new Set(videos.map(v => v.id));
        const newVideos = data.filter(v => !existingIds.has(v.id));
        
        setVideos(prev => [...prev, ...newVideos]);
        
        if (onVideosLoaded && newVideos.length > 0) {
          onVideosLoaded(newVideos);
        }
      }
    } catch (err: any) {
      if (isInitial || isRefresh) setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCategoryClick = (catName: string) => {
    setActiveCategory(catName);
    setSearchQuery('');
    setIsSearching(false);
    setPage(1);
    
    // Instant Category Switching - Check cache immediately
    const key = user ? `unitydev_stream_videos_${catName}_${user.email}` : `unitydev_stream_videos_${catName}_guest`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setVideos(JSON.parse(cached));
    } else {
      setVideos([]); // Clear if no cache to show skeletons
    }
    
    fetchVideos(1, true, '', catName);
  };

  const handleSearchClick = () => {
    if (!navigator.onLine) {
      if (showNotification) {
        showNotification("You don't have enough internet connection to search.", "error");
      }
      return;
    }
    setIsSearching(true);
  };

  const handleSearchSubmit = async (e?: React.FormEvent, query?: string) => {
    if (!navigator.onLine) {
      if (e) e.preventDefault();
      if (showNotification) {
        showNotification("You don't have enough internet connection to search.", "error");
      }
      return;
    }
    if (e) e.preventDefault();
    const rawQuery = query || searchQuery;
    if (!rawQuery.trim()) return;
    
    setIsSearching(false);
    setLoading(true); // Show loading while AI processes
    setVideos([]); // Clear current videos
    
    // 1. AI Query Enhancement
    let finalQuery = rawQuery;
    try {
      const aiResponse = await callStreamAI([
        { 
          role: 'system', 
          content: 'You are an expert video search query optimizer for Dailymotion. The user will give you a natural language request. Your job is to extract the core search keywords to find exactly what they want. Return ONLY the optimized search string. No quotes, no explanations. Example: User: "I want to watch some funny cat videos" -> You: "funny cat videos". User: "show me full length american action movies" -> You: "full length american action movies".' 
        },
        { role: 'user', content: rawQuery }
      ]);
      
      if (aiResponse && aiResponse.content) {
        finalQuery = aiResponse.content.trim().replace(/^["']|["']$/g, '');
      }
    } catch (err) {
      console.error("AI Search enhancement failed:", err);
      // Fallback to raw query
    }

    const newHistory = [rawQuery, ...searchHistory.filter(q => q !== rawQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    const key = user ? `stream_search_history_${user.email}` : 'stream_search_history_guest';
    localStorage.setItem(key, JSON.stringify(newHistory));

    setSearchQuery(finalQuery);
    setActiveCategory('All');
    setPage(1);
    fetchVideos(1, true, finalQuery, 'All');
  };

  const getSearchSuggestions = () => {
    if (!searchQuery.trim()) {
      return searchHistory.map(text => ({ text, type: 'history' }));
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    
    // Live Suggestions from API
    const apiMatches = liveSuggestions.map(text => ({ text, type: 'suggestion' }));
      
    // Filter history
    const historyMatches = searchHistory
      .filter(h => h.toLowerCase().includes(lowerQuery))
      .map(text => ({ text, type: 'history' }));
      
    // Combine and deduplicate (prefer suggestion over history if same text)
    const combinedMap = new Map();
    apiMatches.forEach(item => combinedMap.set(item.text.toLowerCase(), item));
    historyMatches.forEach(item => {
      if (!combinedMap.has(item.text.toLowerCase())) {
        combinedMap.set(item.text.toLowerCase(), item);
      }
    });
    
    const combined = Array.from(combinedMap.values());
    return combined.length > 0 ? combined : [{ text: searchQuery, type: 'suggestion' }];
  };

  const clearHistory = () => {
    setSearchHistory([]);
    const key = user ? `stream_search_history_${user.email}` : 'stream_search_history_guest';
    localStorage.removeItem(key);
  };

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span className="text-white">{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="font-bold text-white">{part}</span>
          ) : (
            <span key={i} className="text-zinc-400">{part}</span>
          )
        )}
      </span>
    );
  };

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  useEffect(() => {
    if (!isSearching || !searchQuery.trim()) {
      setLiveSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await getPublicVideos(1, searchQuery, 'All', 10);
        const titles = Array.from(new Set(data.map(v => v.title))).slice(0, 6);
        setLiveSuggestions(titles);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearching]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 0 && scrollContainerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, 80)); 
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      isRefreshingRef.current = true;
      setPullDistance(60);
      
      const refreshPage = Math.floor(Math.random() * 10) + 1;
      setPage(refreshPage);
      
      fetchVideos(refreshPage, true, searchQuery, activeCategory, true).then(() => {
        setPullDistance(0);
        setIsRefreshing(false);
        setTimeout(() => { isRefreshingRef.current = false; }, 100);
      });
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  useEffect(() => {
    fetchVideos(1, true, '', 'Explore');
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      sceneStates = scenes.map(scene => scene.init(width, height));
    };
    window.addEventListener('resize', handleResize);

    const scenes = [
      {
        text: "UNITY DEV STREAM",
        init: (w: number, h: number) => {
           // 3D Warp Speed / Starfield
           return Array.from({length: 150}, () => ({
             x: (Math.random() - 0.5) * w * 2,
             y: (Math.random() - 0.5) * h * 2,
             z: Math.random() * w
           }));
        },
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: any[]) => {
           ctx.fillStyle = '#020205';
           ctx.fillRect(0, 0, w, h);
           
           ctx.save();
           ctx.translate(w / 2, h / 2);
           state.forEach(p => {
             p.z -= 2 + time * 0.5; // Speed up slightly over time
             if (p.z <= 0) {
               p.z = w;
               p.x = (Math.random() - 0.5) * w * 2;
               p.y = (Math.random() - 0.5) * h * 2;
             }
             let sx = (p.x / p.z) * w;
             let sy = (p.y / p.z) * w;
             let px = (p.x / (p.z + 5)) * w;
             let py = (p.y / (p.z + 5)) * w;
             
             ctx.beginPath();
             ctx.moveTo(px, py);
             ctx.lineTo(sx, sy);
             ctx.strokeStyle = `rgba(0, 255, 200, ${1 - p.z/w})`;
             ctx.lineWidth = 2;
             ctx.stroke();
           });
           ctx.restore();

           // TEXT ANIMATION 1: Rotating 3D-style Boxes
           ctx.save();
           ctx.translate(w / 2, h / 2);
           
           // Draw rotating decorative boxes around the text
           ctx.save();
           ctx.rotate(time * 0.4);
           ctx.strokeStyle = 'rgba(0, 255, 200, 0.6)';
           ctx.lineWidth = 2;
           ctx.strokeRect(-110, -110, 220, 220);
           ctx.rotate(Math.PI / 4);
           ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
           ctx.strokeRect(-110, -110, 220, 220);
           ctx.restore();

           ctx.font = '900 22px Inter, sans-serif';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           // Gradient fill
           let grad = ctx.createLinearGradient(-100, 0, 100, 0);
           grad.addColorStop(0, '#00ffc8');
           grad.addColorStop(1, '#ffffff');
           ctx.fillStyle = grad;
           
           ctx.shadowColor = '#00ffc8';
           ctx.shadowBlur = 15;
           // @ts-ignore
           ctx.letterSpacing = "2px";
           ctx.fillText("UNITY DEV STREAM", 0, 0);
           ctx.restore();
        }
      },
      {
        text: "ENDLESS ENTERTAINMENT",
        init: (w: number, h: number) => {
           // Cinematic Bokeh / Light Leaks
           return Array.from({length: 25}, () => ({
             x: Math.random() * w, y: Math.random() * h,
             r: Math.random() * 60 + 20,
             vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
             hue: Math.random() * 40 + 320 // Pinks, purples, reds
           }));
        },
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: any[]) => {
           ctx.fillStyle = '#0a0005';
           ctx.fillRect(0, 0, w, h);

           ctx.globalCompositeOperation = 'screen';
           state.forEach(p => {
             p.x += p.vx; p.y += p.vy;
             if (p.x < -p.r) p.x = w + p.r; if (p.x > w + p.r) p.x = -p.r;
             if (p.y < -p.r) p.y = h + p.r; if (p.y > h + p.r) p.y = -p.r;

             let grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
             grad.addColorStop(0, `hsla(${p.hue}, 100%, 50%, 0.3)`);
             grad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
             ctx.fill();
           });
           ctx.globalCompositeOperation = 'source-over';

           // TEXT ANIMATION 2: Typewriter Effect
           ctx.save();
           ctx.translate(w / 2, h / 2);
           ctx.font = '800 20px Inter, sans-serif';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           // Radial gradient fill
           let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
           grad.addColorStop(0, '#ffffff');
           grad.addColorStop(1, '#ff0055');
           ctx.fillStyle = grad;
           
           ctx.shadowColor = '#ff0055';
           ctx.shadowBlur = 40;
           // @ts-ignore
           ctx.letterSpacing = "4px";
           
           let fullText = "ENDLESS ENTERTAINMENT";
           let charCount = Math.floor(time * 15); // Reveal 15 chars per second
           let currentText = fullText.substring(0, charCount);
           
           // Add blinking cursor
           if (charCount < fullText.length || Math.floor(time * 4) % 2 === 0) {
               currentText += "_";
           }
           
           ctx.fillText(currentText, 0, 0);
           ctx.restore();
        }
      },
      {
        text: "WATCH ESPORTS & GAMING",
        init: (w: number, h: number) => {
           return { offset: 0 };
        },
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: any) => {
           ctx.fillStyle = '#050014';
           ctx.fillRect(0, 0, w, h);

           // 3D Perspective Grid
           state.offset = (state.offset + 2) % 40;
           ctx.strokeStyle = 'rgba(150, 0, 255, 0.4)';
           ctx.lineWidth = 1.5;
           
           ctx.beginPath();
           // Horizontal lines with perspective
           for(let y = 0; y < h; y += 15) {
              let py = h - Math.pow(y / h, 2) * h + state.offset * (y/h);
              if (py > 0 && py < h) {
                  ctx.moveTo(0, py); ctx.lineTo(w, py);
              }
           }
           // Vertical radiating lines
           for(let x = -w; x < w * 2; x += 40) {
              ctx.moveTo(w/2, 0); ctx.lineTo(x, h);
           }
           ctx.stroke();

           // TEXT ANIMATION 3: Glitch Effect
           ctx.save();
           ctx.translate(w / 2, h / 2);
           ctx.transform(1, 0, -0.2, 1, 0, 0); // Dynamic italic shear
           ctx.font = '900 22px Inter, sans-serif';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           let text = "WATCH ESPORTS & GAMING";
           let isGlitch = Math.random() < 0.15; // 15% chance to glitch on any frame
           
           // Draw glitch layers
           if (isGlitch) {
               ctx.fillStyle = 'rgba(255, 0, 100, 0.8)';
               ctx.fillText(text, -6, 3);
               ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
               ctx.fillText(text, 6, -3);
           }
           
           // Main text with stroke
           ctx.strokeStyle = '#ffffff';
           ctx.lineWidth = 1;
           ctx.strokeText(text, 0, 0);
           
           ctx.shadowColor = '#b026ff';
           ctx.shadowBlur = 10;
           ctx.fillStyle = '#ffffff';
           ctx.fillText(text, 0, 0);
           ctx.restore();
        }
      },
      {
        text: "HAVE FUN MAKE MOMENTS",
        init: (w: number, h: number) => {
           return { phase: 0 };
        },
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: any) => {
           ctx.fillStyle = '#000810';
           ctx.fillRect(0, 0, w, h);

           state.phase += 0.02;
           
           // Abstract flowing waves
           for(let i = 0; i < 5; i++) {
               ctx.beginPath();
               ctx.moveTo(0, h/2);
               for(let x = 0; x <= w; x += 20) {
                   let y = h/2 + Math.sin(x * 0.01 + state.phase + i) * 40 * Math.sin(state.phase * 0.5);
                   ctx.lineTo(x, y);
               }
               ctx.strokeStyle = `rgba(0, 150, 255, ${0.1 + i*0.05})`;
               ctx.lineWidth = 2 + i;
               ctx.stroke();
           }

           // TEXT ANIMATION 4: Cinematic Slow Zoom & Fade
           ctx.save();
           ctx.translate(w / 2, h / 2);
           
           let scale = 0.85 + (time * 0.04); // Slowly scale up
           ctx.scale(scale, scale);
           
           let alpha = Math.min(1, time / 1.5); // Fade in over 1.5s
           
           ctx.font = '300 22px Inter, sans-serif'; // Thin, elegant font
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           // Linear gradient fill
           let grad = ctx.createLinearGradient(0, -20, 0, 20);
           grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
           grad.addColorStop(1, `rgba(0, 150, 255, ${alpha})`);
           ctx.fillStyle = grad;
           
           ctx.shadowColor = `rgba(0, 150, 255, ${alpha})`;
           ctx.shadowBlur = 20;
           // @ts-ignore
           ctx.letterSpacing = "3px";
           ctx.fillText("HAVE FUN MAKE MOMENTS", 0, 0);
           ctx.restore();
        }
      },
      {
        text: "GLOBAL CREATOR NETWORK",
        init: (w: number, h: number) => {
           // Plexus Node Network
           return Array.from({length: 40}, () => ({
             x: Math.random() * w, y: Math.random() * h,
             vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8
           }));
        },
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: any[]) => {
           ctx.fillStyle = '#0a0a0a';
           ctx.fillRect(0, 0, w, h);

           ctx.lineWidth = 1;
           state.forEach((p, i) => {
             p.x += p.vx; p.y += p.vy;
             if (p.x < 0 || p.x > w) p.vx *= -1;
             if (p.y < 0 || p.y > h) p.vy *= -1;
             
             ctx.beginPath();
             ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
             ctx.fillStyle = '#ffaa00';
             ctx.fill();

             for(let j=i+1; j<state.length; j++) {
                let p2 = state[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 90) {
                   ctx.beginPath();
                   ctx.moveTo(p.x, p.y);
                   ctx.lineTo(p2.x, p2.y);
                   ctx.strokeStyle = `rgba(255, 170, 0, ${1 - dist/90})`;
                   ctx.stroke();
                }
             }
           });

           // TEXT ANIMATION 5: Hacker Data Decode
           ctx.save();
           ctx.translate(w / 2, h / 2);
           ctx.font = '700 20px Inter, monospace';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           // Gold/Amber gradient
           let grad = ctx.createLinearGradient(0, -20, 0, 20);
           grad.addColorStop(0, '#ffaa00');
           grad.addColorStop(1, '#ffcc55');
           ctx.fillStyle = grad;
           
           ctx.shadowColor = '#ffaa00';
           ctx.shadowBlur = 20;
           // @ts-ignore
           ctx.letterSpacing = "1px";
           
           let targetText = "GLOBAL CREATOR NETWORK";
           let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
           let display = "";
           
           for(let i=0; i<targetText.length; i++) {
               if (targetText[i] === " ") { 
                   display += " "; 
                   continue; 
               }
               // Reveal characters sequentially, scramble the ones currently "decoding"
               if (time * 15 > i + 10) {
                   display += targetText[i]; // Fully decoded
               } else if (time * 15 > i) {
                   display += chars[Math.floor(Math.random() * chars.length)]; // Scrambling
               } else {
                   display += ""; // Not yet appeared
               }
           }
           
           ctx.fillText(display, 0, 0);
           
           // Scanline overlay effect
           ctx.globalCompositeOperation = 'destination-in';
           ctx.fillStyle = 'rgba(0,0,0,0.5)';
           for(let i=0; i<40; i+=4) {
               ctx.fillRect(-150, -20 + i, 300, 2);
           }
           ctx.globalCompositeOperation = 'source-over';
           
           ctx.restore();
        }
      }
    ];

    let sceneStates: any[] = scenes.map(scene => scene.init(width, height));
    let startTime = performance.now();

    const draw = (currentTime: number) => {
      let elapsed = (currentTime - startTime) / 1000;
      let sceneIndex = Math.floor(elapsed / 5) % scenes.length;
      let localTime = elapsed % 5;
      
      // Crossfade transition logic
      let fadeAlpha = 1;
      if (localTime < 0.5) {
        fadeAlpha = localTime / 0.5;
      } else if (localTime > 4.5) {
        fadeAlpha = (5 - localTime) / 0.5;
      }

      ctx.globalAlpha = 1;
      scenes[sceneIndex].draw(ctx, width, height, localTime, sceneStates[sceneIndex]);
      
      // OVERLAY LOADING STATE ON CANVAS
      if (loading && videos.length === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        // @ts-ignore
        ctx.letterSpacing = "4px";
        ctx.fillText("LOADING STREAM DATA...", width / 2, height - 20);
        ctx.restore();
      }

      // Apply fade out/in effect
      if (fadeAlpha < 1) {
         ctx.globalAlpha = 1 - fadeAlpha;
         ctx.fillStyle = '#000000';
         ctx.fillRect(0, 0, width, height);
         ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 200 &&
        !loadingMore
      ) {
        setPage(prev => prev + 1);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingMore]);

  useEffect(() => {
    if (page > 1 && !isRefreshingRef.current) {
        fetchVideos(page, false, searchQuery, activeCategory);
    }
  }, [page]);

  const categories = [
    { name: 'Explore', icon: <Compass size={20} /> },
    { name: 'All' },
    { name: 'AI PICKS' },
    { name: 'Chinese Martial Art Drama' },
    { name: 'American Movies' },
    { name: 'Chinese animie movies 4k' },
    { name: 'Super Hero Movies' },
    { name: 'Korean Drama' },
    { name: 'Gaming' },
    { name: 'Games' },
    { name: 'Music' },
    { name: 'Music Hits' },
    { name: 'AI Recently Uploaded' },
  ];

  return (
    <div className="stream-video-page font-sans bg-[#0a0a0a] text-white h-screen flex flex-col overflow-hidden">
      {/* Sticky Header Wrapper */}
      <div className="sticky-header-container fixed top-0 left-0 right-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]">
        {/* Dynamic Canvas Background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-[-1] pointer-events-none" />

        {/* Top Header Section */}
        <header className="glass-header flex items-center justify-between relative z-10 border-b-0">
            <div className="flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform overflow-hidden bg-black/20 backdrop-blur-sm drop-shadow-[0_0_10px_rgba(16,163,127,0.8)]">
                    <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
                </div>
                <span className="font-bold text-lg tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">UnityDev</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-200 relative z-10">
            {showInstallPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className={`px-3 py-1 text-xs font-bold rounded-full ${themeColor} text-white shadow-lg active:scale-95 transition-transform`}
                >
                  Install App
                </button>
            )}
            <Cast size={22} strokeWidth={1.5} className="hover:text-white transition-colors active:scale-90 transform cursor-pointer" />
            <div className="relative hover:text-white transition-colors active:scale-90 transform cursor-pointer">
                <Bell size={22} strokeWidth={1.5} />
                <div className={`absolute -top-1 -right-1 ${themeColor} text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-[#0a0a0a]`}>9+</div>
            </div>
            <Search size={22} strokeWidth={1.5} className="hover:text-white transition-colors active:scale-90 transform cursor-pointer" onClick={handleSearchClick} />
            </div>
        </header>

        {/* Full-Screen Search Overlay */}
        {isSearching && (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in slide-in-from-right fade-in duration-200">
            {/* Search Header */}
            <div className="search-overlay-header flex items-center px-4 py-3 gap-3 border-b border-white/10 bg-black">
              <ArrowLeft 
                size={24} 
                className="text-white cursor-pointer active:scale-90 transition-transform" 
                onClick={() => setIsSearching(false)} 
              />
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-zinc-900 rounded-xl px-4 py-3">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Stream"
                  className="bg-transparent text-white text-lg outline-none w-full placeholder-zinc-400"
                />
              </form>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform">
                <Mic size={24} className="text-white" />
              </div>
            </div>

            {/* Search Suggestions / History */}
            <div className="search-overlay-content flex-1 overflow-y-auto bg-black">
              {getSearchSuggestions().map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between px-4 py-4 hover:bg-white/5 cursor-pointer active:bg-white/10 transition-colors border-b border-[#222222]"
                  onClick={() => handleSearchSubmit(undefined, item.text)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {item.type === 'history' ? (
                      <Clock size={24} className="text-zinc-400 shrink-0" />
                    ) : (
                      <Search size={24} className="text-zinc-400 shrink-0" />
                    )}
                    <span className="text-lg truncate">
                      {item.type === 'suggestion' ? renderHighlightedText(item.text, searchQuery) : <span className="text-white">{item.text}</span>}
                    </span>
                  </div>
                  <ArrowUpLeft size={24} className="text-zinc-500 shrink-0" />
                </div>
              ))}

              {/* Clear History Button */}
              {searchHistory.length > 0 && !searchQuery.trim() && (
                <div className="px-4 py-6 flex justify-center">
                  <button 
                    onClick={clearHistory}
                    className="text-zinc-400 text-sm font-medium hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                  >
                    Clear search history
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Pills - Now inside the wrapper */}
        <div className="category-container flex items-center gap-3 px-4 overflow-x-auto scrollbar-hide relative z-10 border-t border-white/5">
            <div 
                className={`category-pill rounded-lg p-2 shrink-0 cursor-pointer active:scale-95 ${activeCategory === 'Explore' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('Explore')}
            >
                <Compass size={20} />
            </div>
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1"></div>
            {categories.slice(1).map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap category-pill active:scale-95 ${
                        activeCategory === cat.name ? `${themeColor} bg-opacity-100 text-white shadow-lg ${themeGlow}` : 'text-white'
                    }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
      </div>

      {/* Main Video Feed */}
      <div 
        className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-4 pt-28 relative overscroll-y-contain touch-pan-y" 
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        <div 
          className={`absolute top-0 left-0 w-full flex justify-center items-end pb-3 overflow-hidden z-20 ${startY === 0 ? 'transition-all duration-300' : ''}`}
          style={{ height: `${pullDistance}px`, opacity: pullDistance / 50 }}
        >
          <div className="bg-zinc-800 rounded-full p-2 shadow-lg">
            <Loader2 
              className={`${themeText} ${isRefreshing ? 'animate-spin' : ''}`} 
              size={24} 
              style={isRefreshing ? {} : { transform: `rotate(${pullDistance * 5}deg)` }} 
            />
          </div>
        </div>

        <div 
          className={`min-h-full ${startY === 0 ? 'transition-transform duration-300' : ''}`}
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {/* Background Refresh Indicator */}
          {loading && videos.length > 0 && (
            <div className={`flex items-center justify-center gap-2 py-2 mb-2 ${themeColor.replace('bg-', 'bg-')}/10 rounded-lg border ${themeColor.replace('bg-', 'border-')}/20 animate-pulse`}>
              <Loader2 size={14} className={`animate-spin ${themeText}`} />
              <span className={`text-[10px] font-medium ${themeText} uppercase tracking-wider`}>Updating Feed...</span>
            </div>
          )}

          {loading && videos.length === 0 ? (
            <div className="flex flex-col gap-4">
              {[...Array(6)].map((_, i) => <VideoSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-white">No videos found</p>
              <p className="text-sm mt-2 text-center">We couldn't find any videos for "{searchQuery || activeCategory}".<br/>Try searching for something else.</p>
            </div>
          ) : (
            <div className="flex flex-col">
                {videos.map((video, index) => (
                  <div 
                    key={`${video.id}-${index}`} 
                    className="video-card flex flex-col cursor-pointer"
                    onClick={() => onVideoSelect && onVideoSelect(video)}
                  >
                      {/* Thumbnail */}
                      <div className="video-thumbnail-container w-full aspect-video bg-zinc-900 relative mb-4">
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover video-thumbnail" referrerPolicy="no-referrer" />
                          
                          {/* Add to Binge List Button */}
                          <button 
                            className={`binge-add-btn ${themeColor} bg-opacity-100 shadow-lg ${themeGlow}`} 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToBingeList && onAddToBingeList(video);
                            }}
                            title="Add to Binge List"
                          >
                            <PlusCircle size={18} />
                          </button>

                          <div className={`timestamp-badge absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium ${video.isLive ? 'bg-red-600 text-white flex items-center gap-1 border-none' : 'text-white'}`}>
                              {video.isLive && <Zap size={10} fill="currentColor" />}
                              {video.duration}
                          </div>
                      </div>

                      {/* Details Row */}
                      <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-[1.5px] border-white/20 flex items-center justify-center bg-[#2c2c2e] mt-1">
                              {video.avatar ? (
                                  <img 
                                    src={video.avatar} 
                                    alt={video.channel} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-[#00c853] to-[#00e676] ${video.avatar ? 'hidden' : ''}`}>
                                  {video.channel ? video.channel.charAt(0).toUpperCase() : 'C'}
                              </div>
                          </div>
                          
                          {/* Text Info */}
                          <div className="flex flex-col flex-1 min-w-0">
                              <h3 className="video-title leading-snug line-clamp-2">
                                  {video.title}
                              </h3>
                              <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                  <span className="video-channel">{video.channel}</span>
                                  {video.isVerified && <BadgeCheck size={14} className="text-blue-400 fill-blue-400/10" />}
                              </div>
                                  <div className="video-meta flex items-center gap-1">
                                      <span>{video.views}</span>
                                      <span className="text-[10px] opacity-50">•</span>
                                      <span>{video.time}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Menu Icon */}
                          <div className="shrink-0 pt-1 opacity-60 hover:opacity-100 transition-opacity active:scale-90 transform">
                              <MoreVertical size={20} className="text-white" />
                          </div>
                      </div>
                  </div>
              ))}
              {loadingMore && (
                  <div className="flex justify-center items-center py-6">
                      <Loader2 className={`animate-spin ${themeText}`} size={28} />
                  </div>
              )}
          </div>
        )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav flex justify-around items-start px-2 fixed bottom-0 w-full z-50 h-[calc(80px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
        <div className="nav-item active flex flex-col items-center gap-1 w-1/5 cursor-pointer">
            <Home size={22} strokeWidth={1.5} fill="currentColor" className="bottom-nav-icon" />
            <span className="text-[10px] font-medium text-center w-full">Home</span>
        </div>
        <div 
            className="nav-item text-zinc-400 hover:text-white flex flex-col items-center gap-1 w-1/5 cursor-pointer"
            onClick={onBack}
        >
            <Bot size={22} strokeWidth={1.5} className="bottom-nav-icon" />
            <span className="text-[10px] font-medium text-center w-full">AI</span>
        </div>
        <div className="create-button flex flex-col items-center justify-center w-1/5 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
            <PlusCircle size={40} strokeWidth={1.2} className={`${themeColor.replace('bg-', 'text-')} fill-zinc-800`} />
        </div>
        <div 
            className="nav-item text-zinc-400 hover:text-white flex flex-col items-center gap-1 w-1/5 cursor-pointer"
            onClick={onInboxClick}
        >
            <Inbox size={22} strokeWidth={1.5} className="bottom-nav-icon" />
            <span className="text-[10px] font-medium text-center w-full">Inbox</span>
        </div>
        <div 
            className="nav-item text-zinc-400 hover:text-white flex flex-col items-center gap-1 w-1/5 cursor-pointer"
            onClick={onUserClick}
        >
            <div className="w-8 h-8 rounded-full overflow-hidden border-[1.5px] border-white/20 flex items-center justify-center bg-[#2c2c2e]">
                {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-[#00c853] to-[#00e676]">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                )}
            </div>
            <span className="text-[10px] font-medium text-center w-full">You</span>
        </div>
      </nav>
    </div>
  );
};

export default StreamVideo;
