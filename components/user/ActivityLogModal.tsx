import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Play, Heart, Calendar, Trash2, Film, Sparkles } from 'lucide-react';
import { firebaseRest } from '../../services/firebaseRest';
import '../../styles/SettingsShared.css';

interface ActivityLogModalProps {
  user: any;
  onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ user, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activityData, historyData, bingeData] = await Promise.all([
          firebaseRest.getActivityLog(user.email),
          firebaseRest.getRecentlyWatched(user.email),
          firebaseRest.getBingeList(user.email)
        ]);

        // Create a lookup map for images based on video titles
        const map: Record<string, string> = {};
        
        // Helper to add to map
        const addToMap = (list: any[]) => {
          if (Array.isArray(list)) {
            list.forEach(item => {
              if (item.title && (item.thumbnail || item.image || item.poster)) {
                map[item.title.toLowerCase()] = item.thumbnail || item.image || item.poster;
              }
            });
          }
        };

        addToMap(historyData);
        addToMap(bingeData);
        setImageMap(map);

        const sortedLogs = (activityData || []).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedLogs);
      } catch (err) {
        console.error("Failed to fetch activity data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.email]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
  };

  const groupedLogs = logs.reduce((acc: any, log: any) => {
    const date = formatDate(log.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('binge') || lower.includes('list')) return <Heart size={12} className="fill-current" />;
    if (lower.includes('watch') || lower.includes('play')) return <Play size={12} className="fill-current" />;
    return <Sparkles size={12} />;
  };

  const getActionStyle = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('binge') || lower.includes('list')) {
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
    if (lower.includes('watch') || lower.includes('play')) {
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      console.log("Clearing all history for:", user.email);
      await Promise.all([
        firebaseRest.clearRecentlyWatched(user.email),
        firebaseRest.clearBingeList(user.email),
        firebaseRest.clearActivityLog(user.email)
      ]);
      setLogs([]);
      setShowConfirm(false);
      alert("All history cleared successfully.");
    } catch (err) {
      console.error("Failed to clear all history:", err);
      alert("Failed to clear history. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header bg-black/90 backdrop-blur-xl border-b border-white/5">
        <button onClick={onClose} className="settings-back-btn hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col ml-4">
          <h2 className="text-lg font-bold text-white leading-none">Activity History</h2>
          <span className="text-xs text-zinc-500 mt-1 font-medium">Your recent interactions</span>
        </div>
      </div>

      {/* Content */}
      <div className="settings-content p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase">Loading History...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 px-8">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900/50 flex items-center justify-center border border-white/5 rotate-3">
              <Clock size={32} className="text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No History Yet</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Start watching movies or adding them to your list to see your activity here.
              </p>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {Object.entries(groupedLogs).map(([date, dateLogs]: [string, any]) => (
              <div key={date} className="mb-8">
                {/* Date Header - Non-sticky for smooth flow */}
                <div className="px-6 py-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-black px-2 border border-white/5 rounded-full py-1">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="px-4 space-y-3">
                  {dateLogs.map((log: any, index: number) => (
                    <div 
                      key={index} 
                      className="group relative flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 overflow-hidden"
                    >
                      {/* Hover Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        {(log.metadata?.image || imageMap[log.details?.toLowerCase()]) ? (
                          <div className="w-16 h-24 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                            <img 
                              src={log.metadata?.image || imageMap[log.details?.toLowerCase()]} 
                              alt={log.details} 
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-24 rounded-lg bg-zinc-800/50 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                            <Film size={24} className="text-zinc-600" />
                          </div>
                        )}
                        
                        {/* Action Icon Badge */}
                        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black ${getActionStyle(log.action).split(' ')[0].replace('text-', 'bg-').replace('-400', '-500').replace('-500', '-600')}`}>
                          {getActionIcon(log.action)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getActionStyle(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-600 font-mono">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        
                        <h3 className="text-base font-semibold text-white truncate pr-2 group-hover:text-red-500 transition-colors">
                          {log.details}
                        </h3>
                        
                        {log.metadata?.type && (
                          <p className="text-xs text-zinc-500 mt-1 capitalize flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600" />
                            {log.metadata.type}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {logs.length > 0 && (
        <div className="settings-footer flex justify-center bg-black/95 backdrop-blur-2xl border-t border-white/10 py-6 px-4 z-[1000]">
           <button 
             onClick={() => setShowConfirm(true)}
             className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-red-600/10 border border-red-600/20 hover:bg-red-600 hover:border-red-600 transition-all duration-300 w-full max-w-xs shadow-lg shadow-red-900/20 active:scale-95 cursor-pointer touch-manipulation"
           >
             <Trash2 size={18} className="text-red-500 group-hover:text-white" />
             <span className="text-sm font-bold text-red-500 group-hover:text-white">Clear All History</span>
           </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isClearing && setShowConfirm(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Clear All History?</h3>
            <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">
              This will permanently remove your recently watched videos, binge list, and activity logs. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClearAll}
                disabled={isClearing}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  "Yes, Clear Everything"
                )}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isClearing}
                className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogModal;
