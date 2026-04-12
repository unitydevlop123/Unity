import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, PlusCircle, Zap, Mic } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { getPublicVideos, Video } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import { firebaseRest } from '../services/firebaseRest';
import './VideoPage.css';

interface VideoPageProps {
  video: Video;
  onBack: () => void;
  onVideoSelect: (video: Video) => void;
  onAddToBingeList?: (video: Video) => void;
  theme: 'red' | 'gold' | 'blue' | 'green';
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const VideoPage: React.FC<VideoPageProps> = ({ video, onBack, onVideoSelect, onAddToBingeList, theme, showNotification }) => {
  const themeColor = theme === 'gold' ? 'bg-amber-600' : 
                    theme === 'blue' ? 'bg-blue-600' :
                    theme === 'green' ? 'bg-emerald-600' : 'bg-red-600';
  const themeGlow = theme === 'gold' ? 'shadow-amber-500/50' : 
                   theme === 'blue' ? 'shadow-blue-500/50' :
                   theme === 'green' ? 'shadow-emerald-500/50' : 'shadow-red-500/50';
  const { user } = useAuth();
  const [player, setPlayer] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [qualityBadge, setQualityBadge] = useState<string>('HD');
  const [qualitySetting, setQualitySetting] = useState<string>('auto');
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Speed Test & Buffering State
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);
  const bufferCountRef = useRef(0);
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSpeedTesting, setIsSpeedTesting] = useState(true);

  // Random Squad Count
  const squadCount = React.useMemo(() => {
    const options = ["1.5k", "500k", "200", "800k", "100", "2.5M", "10k", "50k", "1M", "300", "750k", "4.2M", "8.1k", "12k", "900"];
    return options[Math.floor(Math.random() * options.length)];
  }, [video.id]);

  // 1. Speed Test Gate
  useEffect(() => {
    let isMounted = true;
    const runSpeedTest = async () => {
      try {
        const startTime = performance.now();
        // Fetch a ~100KB image to test speed
        const response = await fetch(`https://picsum.photos/1000/1000?cacheBust=${Date.now()}`);
        const blob = await response.blob();
        const endTime = performance.now();
        
        const durationInSeconds = (endTime - startTime) / 1000;
        const sizeInBits = blob.size * 8;
        const speedBps = sizeInBits / durationInSeconds;
        const speedMbps = speedBps / (1024 * 1024);
        
        if (isMounted) {
          setSpeedMbps(speedMbps);
          setIsSpeedTesting(false);
          if (speedMbps < 3.5) {
            if (showNotification) {
              showNotification("Slow connection detected. Video may buffer.", "info");
            }
          }
        }
      } catch (e) {
        // If fetch fails completely, assume offline/too slow
        if (isMounted) {
          setIsSpeedTesting(false);
          if (showNotification) {
            showNotification("Could not verify connection speed. Video may buffer.", "info");
          }
        }
      }
    };

    runSpeedTest();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. The "Unstable" Killswitch (Buffering)
  const handleBuffer = () => {
    bufferCountRef.current += 1;

    if (bufferCountRef.current > 5) {
      onBack();
      if (showNotification) {
        showNotification("Connection too unstable. Video playback stopped.", "error");
      }
      return;
    }

    // Reset buffer count after 30 seconds
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
    }
    bufferTimerRef.current = setTimeout(() => {
      bufferCountRef.current = 0;
    }, 30000);
  };

  useEffect(() => {
    return () => {
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current);
      }
    };
  }, []);

  // Active Killswitch: Instant Kick-Out on offline
  useEffect(() => {
    const handleOffline = () => {
      onBack();
      if (showNotification) {
        showNotification("You don't have enough internet connection.", "error");
      }
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [onBack, showNotification]);

  useEffect(() => {
    // Get quality setting
    try {
      const cached = localStorage.getItem(`unitydev_settings_${user?.email}`);
      if (cached) {
        const settings = JSON.parse(cached);
        const quality = settings.videoQuality || (settings.stream4K ? '4k' : '1080p');
        setQualitySetting(quality);
        
        let badge = 'HD';
        if (quality === '4k-hdr') badge = '4K HDR';
        else if (quality === '4k') badge = '4K';
        else if (quality === '1080p') badge = '1080p';
        else if (quality === '720p') badge = '720p';
        else if (quality === '480p') badge = 'SD';
        else if (quality === 'auto') badge = 'Auto';
        
        setQualityBadge(badge);
      }
    } catch (e) {
      console.error("Error reading quality settings", e);
    }
  }, [video.id, user?.email]);

  // Reset state when video changes
  useEffect(() => {
    setRelatedVideos([]);
    setPage(1);
    setHasMore(true);
    setIsFetching(false);
    setLoading(true);
  }, [video.id, video.channel]);

  // Fetch related videos (Infinite Scroll)
  useEffect(() => {
    const fetchRelated = async () => {
      if (isFetching) return;
      
      setIsFetching(true);
      try {
        // Use 'owner:' prefix to filter by channel directly.
        // We pass empty category '' to avoid the strict 20-minute filter in videoService.
        // This ensures we show ALL videos from the channel (except < 1 min default).
        const newVideos = await getPublicVideos(page, `owner:${video.channel}`, '', 20);
        
        // Filter out current video
        const filteredNew = newVideos.filter(v => v.id !== video.id);
        
        setRelatedVideos(prev => {
          if (page === 1) {
            return filteredNew;
          }
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNew = filteredNew.filter(v => !existingIds.has(v.id));
          return [...prev, ...uniqueNew];
        });

        // If we get 0 videos, we assume we reached the end. 
        // Checking < 20 is too strict if some filtering happened on the server/service side.
        if (newVideos.length === 0) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load related videos", err);
      } finally {
        setIsFetching(false);
        setLoading(false);
      }
    };

    fetchRelated();
  }, [page, video.channel]); // Trigger fetch when page changes

  // Scroll Listener for Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        if (!isFetching && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching, hasMore, loading]);

  const handleStreamClick = () => {
    if (player && typeof player.isDisposed === 'function' && !player.isDisposed()) {
      try {
        player.volume(1);
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((e: any) => console.error("Play prevented", e));
        }
        if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      } catch (e) {
        console.error("Error starting stream:", e);
      }
    }
  };

  return (
    <div className="video-page">
      <div className="video-content-wrapper elite-layout">
        <div className="video-sticky-top">
          <div className="video-header" style={{ display: 'none' }}>
            {/* Back button removed as per request */}
          </div>
          
            <div className="video-section relative">
              {speedMbps !== null && speedMbps < 3.5 && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-black/60 px-2 py-1.5 rounded-md backdrop-blur-sm border border-white/10">
                  <div className={`w-1 h-2 rounded-sm ${speedMbps > 1.0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className={`w-1 h-3 rounded-sm ${speedMbps > 2.0 ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                  <div className={`w-1 h-4 rounded-sm ${speedMbps > 3.0 ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                  <span className="text-[10px] text-white ml-1 font-mono font-bold">{speedMbps.toFixed(1)} Mbps</span>
                </div>
              )}
              <VideoPlayer
                key={video.id}
                videoId={video.id}
                poster={video.thumbnail}
                autoplay={true}
                quality={qualitySetting}
                onReady={(p) => setPlayer(p)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onBuffer={handleBuffer}
                onExitFullscreen={() => {
                  onBack();
                }}
                theme={theme}
              />
            </div>

          <div className="video-details">
            <h1 className="video-title">{video.title}</h1>
            <div className="video-stats flex items-center gap-2">
              <span>{video.views}</span>
              <span className="dot-separator">•</span>
              <span>{video.time}</span>
              <span className="dot-separator">•</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                qualityBadge.includes('4K') ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                qualityBadge === '1080p' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 
                'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {qualityBadge}
              </span>
            </div>

            <div className="video-actions-row">
              <div className="channel-info">
                <img 
                  src={video.avatar} 
                  alt={video.channel} 
                  className="channel-avatar" 
                  referrerPolicy="no-referrer" 
                />
                <div className="channel-text">
                  <div className="channel-name">
                    {video.channel}
                    {video.isVerified && <CheckCircle size={14} className="verified-icon" />}
                  </div>
                  <div className="subscriber-count">
                    {squadCount} Squad
                  </div>
                </div>
              </div>
              <div className="action-stack">
                <button className={`binge-action-btn bg-blue-600 shadow-lg shadow-blue-500/50`} onClick={() => onAddToBingeList && onAddToBingeList(video)}>
                  <PlusCircle size={16} />
                  <span>Binge List</span>
                </button>
                <button className={`stream-button inline-stream bg-red-600 shadow-lg shadow-red-500/50`} onClick={handleStreamClick}>
                  <span className="stream-text">STREAM</span>
                  <span className="stream-wave"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {(!loading && relatedVideos.length === 0) ? null : (
          <div className="video-up-next-section">
            <h3 className="up-next-title">UP NEXT</h3>
            {loading ? (
              <div className="loading-related">Loading related videos...</div>
            ) : (
              <div className="related-videos-list">
                {relatedVideos.map((relVideo) => (
                  <div 
                    key={relVideo.id} 
                    className="related-video-card"
                    onClick={() => onVideoSelect(relVideo)}
                  >
                    <div className="related-thumbnail-container">
                      <img src={relVideo.thumbnail} alt={relVideo.title} className="related-thumbnail" referrerPolicy="no-referrer" />
                      <span className="related-duration">{relVideo.duration}</span>
                      
                      {/* Add to Binge List Button */}
                      <button 
                        className={`binge-add-btn-small ${themeColor} shadow-lg ${themeGlow}`} 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToBingeList && onAddToBingeList(relVideo);
                        }}
                        title="Add to Binge List"
                      >
                        <PlusCircle size={14} />
                      </button>
                    </div>
                    <div className="related-info">
                      <h4 className="related-title">{relVideo.title}</h4>
                      <div className="related-channel">
                        {relVideo.channel}
                        {relVideo.isVerified && <CheckCircle size={12} className="verified-icon" />}
                      </div>
                      <div className="related-stats">
                        {relVideo.views} • {relVideo.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Glass Back Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button 
            className={`glass-floating-back-btn ${themeColor} shadow-lg ${themeGlow}`}
            onClick={onBack}
        >
            <ArrowLeft size={22} strokeWidth={2.5} />
            <span className="text-[11px] font-bold tracking-wider">BACK</span>
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
