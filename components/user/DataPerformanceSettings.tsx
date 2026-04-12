import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Wifi, 
  Database, 
  Zap, 
  Activity,
  Loader2,
  Check
} from 'lucide-react';
import '../../styles/SettingsShared.css';

interface DataPerformanceSettingsProps {
  onBack: () => void;
}

const DataPerformanceSettings: React.FC<DataPerformanceSettingsProps> = ({ onBack }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [cacheSize, setCacheSize] = useState("Calculating...");
  const [dataSaver, setDataSaver] = useState(() => {
    return localStorage.getItem('unity_data_saver') === 'true';
  });
  const [cleared, setCleared] = useState(false);

  React.useEffect(() => {
    // Estimate cache size
    const estimateCache = async () => {
      let totalBytes = 0;

      // 1. Calculate LocalStorage Size (Focus on app keys)
      try {
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            // Count all keys, but we'll only clear specific ones later
            const value = localStorage.getItem(key);
            totalBytes += (key.length + (value ? value.length : 0)) * 2;
          }
        }
      } catch (e) {
        console.warn("LocalStorage access failed", e);
      }

      // 2. Calculate Storage API Usage (IndexedDB, ServiceWorker, etc.)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const { usage } = await navigator.storage.estimate();
          if (usage) {
            totalBytes += usage;
          }
        } catch (e) {
          console.warn("Storage estimate failed", e);
        }
      }

      // 3. Format Output
      if (totalBytes > 0) {
        const mb = (totalBytes / (1024 * 1024)).toFixed(2);
        setCacheSize(`${mb} MB`);
      } else {
        setCacheSize("0.00 MB"); 
      }
    };
    estimateCache();
  }, [cleared]); // Re-run when cleared state changes

  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      // Clear Cache Storage (Service Workers / Fetch Cache)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      
      // Clear Local Storage (App Specific Data)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('unitydev_') || 
          key.startsWith('stream_') || 
          key.includes('firebase') // Be careful with auth, but usually safe to clear cache
        )) {
          // Don't clear auth tokens if we want to keep them logged in
          // Assuming auth is handled via context/session, but let's be safe and keep 'user' or 'auth' keys if they exist separately
          // actually, let's just clear the heavy stuff: history, binge, settings, cached videos
          if (!key.includes('auth') && !key.includes('token')) {
             keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Simulate processing time for better UX
      setTimeout(() => {
        setCacheSize("0.00 MB");
        setIsClearing(false);
        setCleared(true);
        setTimeout(() => setCleared(false), 2000);
      }, 1000);
    } catch (e) {
      console.error("Failed to clear cache", e);
      setIsClearing(false);
    }
  };

  const toggleDataSaver = () => {
    const newValue = !dataSaver;
    setDataSaver(newValue);
    localStorage.setItem('unity_data_saver', String(newValue));
  };

  return (
    <div className="settings-page" style={{ zIndex: 100 }}>
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Data & Performance</h2>
      </div>

      <div className="settings-content">
        {/* The Optimizer Section */}
        <div className="settings-section">
          <div className="settings-section-header">The Optimizer</div>
          <div className="settings-card">
            
            {/* Clear App Cache */}
            <button className="settings-row" onClick={handleClearCache} disabled={isClearing || cacheSize === "0 KB"}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Trash2 size={20} className={cleared ? "text-emerald-500" : ""} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Clear App Cache</span>
                  <span className="settings-row-subtitle">
                    {isClearing ? "Optimizing..." : cleared ? "Optimized!" : `Free up space • ${cacheSize}`}
                  </span>
                </div>
              </div>
              {isClearing ? (
                <Loader2 size={18} className="animate-spin text-zinc-500" />
              ) : cleared ? (
                <Check size={18} className="text-emerald-500" />
              ) : (
                <span className="text-xs font-mono text-zinc-500 border border-zinc-700 px-2 py-1 rounded">
                  CLEAN
                </span>
              )}
            </button>

            {/* Data Saver Mode */}
            <div className="settings-row" onClick={toggleDataSaver}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Wifi size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Data Saver Mode</span>
                  <span className="settings-row-subtitle">Load efficient thumbnails to save MBs</span>
                </div>
              </div>
              <button className={`settings-toggle ${dataSaver ? 'active' : ''}`}>
                <div className="settings-toggle-thumb" />
              </button>
            </div>

          </div>
        </div>

        {/* Tracker Data Usage */}
        <div className="settings-section">
          <div className="settings-section-header">Analytics</div>
          <div className="settings-card opacity-60">
            <button className="settings-row cursor-not-allowed">
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Activity size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Tracker Data Usage</span>
                  <span className="settings-row-subtitle">Detailed network analytics • Coming Soon</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">
                PRO
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataPerformanceSettings;
