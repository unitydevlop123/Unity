import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, VolumeX } from 'lucide-react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src?: string;
  videoId?: string;
  poster?: string;
  autoplay?: boolean;
  quality?: string; // e.g., 'auto', '480p', '720p', '1080p', '4k'
  onReady?: (player: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onExitFullscreen?: () => void;
  onBuffer?: () => void;
  theme?: 'red' | 'gold' | 'blue' | 'green';
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoId,
  poster,
  autoplay = true,
  quality = 'auto',
  onReady,
  onPlay,
  onPause,
  onTimeUpdate,
  onExitFullscreen,
  onBuffer,
  theme = 'red'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // New Overlay State: 'loading' (0-3s) | 'ready' (3s+) | 'playing' (after tap) | 'hidden' (after 4s)
  const [overlayState, setOverlayState] = useState<'loading' | 'ready' | 'playing' | 'hidden'>('loading');
  const [readyMessage, setReadyMessage] = useState('TAP SCREEN TO PLAY');

  // Theme-based styling
  const solidColor = theme === 'gold' 
    ? '#D4AF37' 
    : theme === 'blue'
    ? '#2563eb'
    : theme === 'green'
    ? '#059669'
    : '#FF0000'; // Unity Red

  const gradientClass = theme === 'gold' 
    ? 'bg-gradient-to-r from-amber-600 to-amber-800' 
    : theme === 'blue'
    ? 'bg-gradient-to-r from-blue-600 to-blue-800'
    : theme === 'green'
    ? 'bg-gradient-to-r from-emerald-600 to-emerald-800'
    : 'bg-gradient-to-r from-red-600 to-red-800';
    
  const shadowClass = theme === 'gold'
    ? 'shadow-[0_0_20px_rgba(245,158,11,0.5)]'
    : theme === 'blue'
    ? 'shadow-[0_0_20px_rgba(59,130,246,0.5)]'
    : theme === 'green'
    ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)]'
    : 'shadow-[0_0_20px_rgba(220,38,38,0.5)]';

  // Extract video ID if only src is provided
  const actualVideoId = (videoId || (src ? src.split('/').pop() : ''))?.trim();

  // Phase 1: Loading (0-3s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setOverlayState(prev => prev === 'loading' ? 'ready' : prev);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Phase 3: Playback detected -> Wait 10s -> Start Fading -> Hide
  useEffect(() => {
    if (hasStarted && overlayState === 'ready') {
      // Change the message after 6 seconds of showing "TAP SCREEN TO PLAY"
      const textTimer = setTimeout(() => {
        setReadyMessage('PLEASE WAIT FOR 10 SECONDS WE CHECK INTERNET CONNECTION');
      }, 6000);

      // 1. Wait 16 seconds while keeping the overlay visible
      const waitTimer = setTimeout(() => {
        setOverlayState('playing'); // This triggers the CSS opacity transition to 0
        
        // 2. Wait for the transition to finish (e.g., 1s) then remove from DOM
        setTimeout(() => {
          setOverlayState('hidden');
        }, 1000);
      }, 16000);
      
      return () => {
        clearTimeout(textTimer);
        clearTimeout(waitTimer);
      };
    }
  }, [hasStarted, overlayState]);

  // Fallback: Detect iframe interaction via window blur (focus lost to iframe)
  // This ensures we catch the "tap" even if the player message is delayed
  useEffect(() => {
    const handleBlur = () => {
      if (document.activeElement === iframeRef.current) {
        setHasStarted(true);
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Fallback: If the user clicks anywhere on the container, assume they are trying to play
  const handleContainerClick = () => {
    if (!hasStarted) {
      setHasStarted(true);
    }
  };

  const handleUnmute = () => {
    if (iframeRef.current) {
      // 1. Standard Dailymotion Embed API (most reliable for simple embeds)
      // 'volume=1' sets volume to 100%
      // 'muted=0' explicitly un-mutes
      iframeRef.current.contentWindow?.postMessage('volume=1', '*');
      iframeRef.current.contentWindow?.postMessage('muted=0', '*');
      
      // 2. JSON API (for newer player versions)
      // Covers both 'setVolume' and 'setMuted' commands
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({
        command: 'setVolume',
        parameters: [1]
      }), '*');
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({
        command: 'setMuted',
        parameters: [false]
      }), '*');
      
      // 3. Legacy/Alternative formats just to be safe
      iframeRef.current.contentWindow?.postMessage('unmute', '*');

      // Force state update immediately for UI responsiveness
      setIsMuted(false);
    }
  };

  useEffect(() => {
    if (!actualVideoId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        // Verify origin if possible, but Dailymotion embeds can come from various domains
        // For now, check if data is from Dailymotion player
        if (!event.data) return;

        let eventName = '';
        let eventData: any = {};

        if (typeof event.data === 'string') {
          if (event.data.startsWith('{')) {
             try {
               const data = JSON.parse(event.data);
               if (data.event) {
                 eventName = data.event;
                 eventData = data;
               }
             } catch (e) {
               // Ignore invalid JSON
             }
          } else {
            const params = new URLSearchParams(event.data);
            eventName = params.get('event') || '';
            
            // Parse other params
            params.forEach((value, key) => {
                if (key !== 'event') eventData[key] = value;
            });
          }
        } else if (typeof event.data === 'object') {
            // Handle object messages directly
            if (event.data.event) {
                eventName = event.data.event;
                eventData = event.data;
            }
        }

        switch (eventName) {
          case 'apiready':
            setIsReady(true);
            // Let native autoplay handle the playback, do not spam postMessage here
            break;
          case 'play':
          case 'playing':
          case 'video_start':
          case 'ad_start':
          case 'ad_play':
            setHasStarted(true);
            onPlay?.();
            break;
          case 'pause':
            onPause?.();
            break;
          case 'waiting':
            onBuffer?.();
            break;
          case 'timeupdate':
            if (eventData.time) {
              const time = parseFloat(eventData.time);
              if (!isNaN(time)) {
                  onTimeUpdate?.(time);
              }
            }
            // Also ensure overlay is gone if time is updating
            setHasStarted(true);
            break;
          case 'volumechange':
            if (eventData.volume !== undefined) {
              const vol = parseFloat(eventData.volume);
              const muted = eventData.muted === 'true';
              if (vol > 0 && !muted) {
                setIsMuted(false);
              } else {
                setIsMuted(true);
              }
            }
            break;
          case 'fullscreen_change':
            // Dailymotion sends 'true' or 'false' as string
            const isFs = eventData.fullscreen === 'true';
            setIsFullscreen(isFs);
            if (!isFs) {
               onExitFullscreen?.();
            }
            break;
        }
      } catch (err) {
        console.error("Error handling video player message:", err);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [actualVideoId, onPlay, onPause, onTimeUpdate, onExitFullscreen]);

  useEffect(() => {
    if (isReady && onReady && iframeRef.current) {
      // Create a player interface wrapper for external control
      const playerWrapper = {
        play: () => {
          iframeRef.current?.contentWindow?.postMessage('play', '*');
        },
        pause: () => {
          iframeRef.current?.contentWindow?.postMessage('pause', '*');
        },
        volume: (vol?: number) => {
          if (vol !== undefined) {
             // Dailymotion expects volume 0-1
             iframeRef.current?.contentWindow?.postMessage(`volume=${vol}`, '*');
          }
          return 1; // Mock getter
        },
        requestFullscreen: () => {
           // Fullscreen must be triggered by user interaction on the iframe itself usually,
           // but we can try sending the command
           iframeRef.current?.contentWindow?.postMessage('fullscreen', '*');
        },
        currentTime: () => 0, // Difficult to get synchronously via postMessage
        isDisposed: () => false
      };
      
      onReady(playerWrapper);
    }
  }, [isReady, onReady]);

  // Removed retry autoplay logic to prevent spamming the player with postMessage commands

  if (!actualVideoId) return null;

  // Construct embed URL with API enabled
  // api=postMessage is crucial for external control
  // controls=1 to allow user to use default controls if needed
  // autoplay=1&mute=1 forces autoplay, which browsers allow for iframes
  
  // Check Data Saver Mode
  const isDataSaver = localStorage.getItem('unity_data_saver') === 'true';
  
  let qualityParam = '';
  if (isDataSaver) {
    qualityParam = '&quality=380';
  } else if (quality) {
    switch (quality) {
      case '480p': qualityParam = '&quality=380'; break;
      case '720p': qualityParam = '&quality=720'; break;
      case '1080p': qualityParam = '&quality=1080'; break;
      case '4k': qualityParam = '&quality=2160'; break;
      case '4k-hdr': qualityParam = '&quality=2160'; break;
      case 'auto': qualityParam = ''; break;
      default: qualityParam = '';
    }
  }

  // HARDCODED DEMO LINK REMOVED - RESTORING DYNAMIC VIDEO ID
  // Added queue-autoplay-next=1 to force the player to treat this as a playlist item, which often bypasses strict autoplay blocks
  const embedUrl = `https://www.dailymotion.com/embed/video/${actualVideoId}?autoplay=1&mute=1&queue-autoplay-next=1&api=postMessage`;

  return (
    <div 
      className={`video-player-container ${isFullscreen ? 'is-fullscreen' : ''} ${hasStarted ? 'has-started' : ''}`} 
      style={{ width: '100%', height: '100%', minHeight: '200px', background: 'black', position: 'relative' }}
      onClick={handleContainerClick}
    >
      <div className="video-player-blinder"></div>
      <div className="bottom-stealth-mask"></div>
      
      <div className="universal-lockdown-crop" style={{ position: 'relative', width: '100%', height: '93%', overflow: 'hidden', margin: '0 auto' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', width: '100%' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          allow="autoplay; fullscreen"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '110%', 
            border: 'none',
            marginTop: '-7%'
          }}
          allowFullScreen
        ></iframe>
        
        {/* THE UNITY DEV WIDE-BAR LOCKDOWN */}
        
        {/* 1. Full-Width Top Bar: Solid Opaque 50px Bar to completely bury Dailymotion branding */}
        <div 
          className="absolute top-0 left-0 w-full z-[10002] flex items-center justify-center pointer-events-none select-none overflow-hidden unity-shield" 
          style={{ 
            height: '50px', 
            opacity: 1,
            backgroundColor: solidColor,
            boxShadow: theme === 'gold' ? '0 4px 20px rgba(212,175,55,0.5)' : '0 4px 20px rgba(255,0,0,0.5)'
          }}
        >
          <span className="text-white font-black tracking-[0.4em] text-sm drop-shadow-lg uppercase">UNITY DEV</span>
        </div>

        {/* 2. Full Screen Notification Overlay System */}
        {overlayState !== 'hidden' && (
          <div 
            className={`absolute inset-0 z-[10003] flex flex-col items-center justify-center transition-opacity duration-500 ${overlayState === 'playing' ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              background: 'rgba(0,0,0,0.88)', 
              backdropFilter: 'blur(8px)',
              pointerEvents: overlayState === 'loading' ? 'auto' : 'none' // Block clicks during loading, allow pass-through when ready
            }}
          >
            {overlayState === 'loading' ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
                <span className="text-white font-bold tracking-widest text-sm">UPDATING SYSTEM...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-bounce text-center px-4">
                <div className={`p-6 rounded-full ${gradientClass} ${shadowClass} bg-opacity-90`}>
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>
                <span className="text-white/90 font-black tracking-widest text-sm drop-shadow-md max-w-[80%] uppercase">{readyMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. The "Dead Zone" Top Bar: Invisible wall blocking clicks on Share/Settings icons */}
        <div className="absolute top-0 left-0 w-full h-16 z-[10001] cursor-default"></div>
      </div>
    </div>
  </div>
);
};

export default VideoPlayer;
