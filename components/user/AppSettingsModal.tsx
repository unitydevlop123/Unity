import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Loader2, 
  Monitor, 
  Shield, 
  Palette, 
  ChevronRight, 
  ArrowLeft, 
  Activity, 
  HelpCircle,
  Moon,
  Zap,
  Eye,
  Download,
  Trash2,
  Power
} from 'lucide-react';
import { firebaseRest } from '../../services/firebaseRest';
import '../../styles/SettingsShared.css';

interface AppSettingsModalProps {
  user: any;
  onClose: () => void;
  onUpdate: (settings: any) => void;
  onOpenActivityLog: () => void;
  onOpenFeedback: () => void;
}

type ViewState = 'main' | 'video' | 'appearance' | 'privacy';

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ user, onClose, onUpdate, onOpenActivityLog, onOpenFeedback }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(`unitydev_settings_${user?.email}`);
      const parsed = cached ? JSON.parse(cached) : {};
      return { 
        videoQuality: parsed.videoQuality || (parsed.stream4K ? '4k' : '1080p'),
        incognito: parsed.incognito || false, 
        theme: parsed.theme || 'green' 
      };
    } catch (e) {
      return { videoQuality: '1080p', incognito: false, theme: 'green' };
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('main');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await firebaseRest.getSettings(user.email);
        if (data) {
          const newSettings = {
            videoQuality: data.videoQuality || (data.stream4K ? '4k' : '1080p'),
            incognito: data.incognito || false,
            theme: data.theme || 'green'
          };
          setSettings(newSettings);
          localStorage.setItem(`unitydev_settings_${user.email}`, JSON.stringify(newSettings));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, [user.email]);

  const handleToggle = (key: keyof typeof settings) => {
    if (key === 'videoQuality') return; // Handled separately
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await firebaseRest.saveSettings(user.email, settings);
      localStorage.setItem(`unitydev_settings_${user.email}`, JSON.stringify(settings));
      onUpdate(settings);
      onClose();
    } catch (err) {
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderMainView = () => (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-header">Preferences</div>
        <div className="settings-card">
          <button className="settings-row" onClick={() => setCurrentView('video')}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Monitor size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Video Quality</span>
                <span className="settings-row-subtitle">Resolution and playback</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>

          <button className="settings-row" onClick={() => setCurrentView('appearance')}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Palette size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Appearance</span>
                <span className="settings-row-subtitle">Theme and colors</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Data & Privacy</div>
        <div className="settings-card">
          <button className="settings-row" onClick={onOpenActivityLog}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Activity size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Activity Log</span>
                <span className="settings-row-subtitle">View your history</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>

          <button className="settings-row" onClick={() => setCurrentView('privacy')}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Shield size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Privacy Settings</span>
                <span className="settings-row-subtitle">Incognito and data</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Support</div>
        <div className="settings-card">
          <button className="settings-row" onClick={onOpenFeedback}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <HelpCircle size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Help & Feedback</span>
                <span className="settings-row-subtitle">Contact support</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>
      
      <div className="text-center py-4">
        <p className="text-xs text-zinc-600 font-medium tracking-widest">UNITY TV v1.0.2</p>
      </div>
    </div>
  );

  const renderVideoView = () => {
    const qualityOptions = [
      { id: 'auto', label: 'Auto (Recommended)', desc: 'Adjusts to your connection speed' },
      { id: '480p', label: 'Low (SD - 480p)', desc: 'For slow connections • 0.3GB/hr' },
      { id: '720p', label: 'Medium (HD - 720p)', desc: 'Standard mobile quality • 0.7GB/hr' },
      { id: '1080p', label: 'High (Full HD - 1080p)', desc: 'Standard desktop quality • 1.5GB/hr' },
      { id: '4k', label: 'Ultra HD (4K - 2160p)', desc: 'Premium clarity • 7GB/hr' },
      { id: '4k-hdr', label: '4K HDR', desc: 'Ultimate brightness & color • 12GB/hr' },
    ];

    return (
      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">Streaming Quality</div>
          <div className="settings-card">
            {qualityOptions.map((option) => (
              <div 
                key={option.id}
                className="settings-row cursor-pointer"
                onClick={() => {
                  if (settings.videoQuality === option.id) {
                    // If turning off the currently active one, default to 'auto'
                    // If it's already 'auto', we just leave it as 'auto' to ensure something is selected
                    setSettings(prev => ({ ...prev, videoQuality: 'auto' }));
                  } else {
                    setSettings(prev => ({ ...prev, videoQuality: option.id }));
                  }
                }}
              >
                <div className="settings-row-content">
                  <div className="settings-row-text">
                    <span className="settings-row-title">{option.label}</span>
                    <span className="settings-row-subtitle">{option.desc}</span>
                  </div>
                </div>
                <button className={`settings-toggle ${settings.videoQuality === option.id ? 'active' : ''}`}>
                  <div className="settings-toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 px-4 mt-2">
            Higher quality uses significantly more data. 4K HDR requires a compatible display and high-speed internet.
          </p>
        </div>
      </div>
    );
  };

  const renderAppearanceView = () => (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-header">App Theme</div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleThemeChange('red')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${settings.theme === 'red' ? 'bg-red-900/20 border-red-600' : 'bg-zinc-900 border-white/5 hover:border-white/10'}`}
          >
            <div className="w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-900/50" />
            <span className={`text-sm font-medium ${settings.theme === 'red' ? 'text-white' : 'text-zinc-400'}`}>Unity Red</span>
          </button>
          <button 
            onClick={() => handleThemeChange('gold')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${settings.theme === 'gold' ? 'bg-amber-900/20 border-amber-600' : 'bg-zinc-900 border-white/5 hover:border-white/10'}`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-600 shadow-lg shadow-amber-900/50" />
            <span className={`text-sm font-medium ${settings.theme === 'gold' ? 'text-white' : 'text-zinc-400'}`}>Stealth Gold</span>
          </button>
          <button 
            onClick={() => handleThemeChange('blue')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${settings.theme === 'blue' ? 'bg-blue-900/20 border-blue-600' : 'bg-zinc-900 border-white/5 hover:border-white/10'}`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-900/50" />
            <span className={`text-sm font-medium ${settings.theme === 'blue' ? 'text-white' : 'text-zinc-400'}`}>Deep Blue</span>
          </button>
          <button 
            onClick={() => handleThemeChange('green')}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${settings.theme === 'green' ? 'bg-emerald-900/20 border-emerald-600' : 'bg-zinc-900 border-white/5 hover:border-white/10'}`}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-900/50" />
            <span className={`text-sm font-medium ${settings.theme === 'green' ? 'text-white' : 'text-zinc-400'}`}>Emerald Green</span>
          </button>
        </div>
      </div>
      
      <div className="settings-section mt-6">
        <div className="settings-section-header">Interface</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Moon size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Dark Mode</span>
                <span className="settings-row-subtitle">Always on</span>
              </div>
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyView = () => (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-header">Browsing</div>
        <div className="settings-card">
          <div className="settings-row" onClick={() => handleToggle('incognito')}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Eye size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Incognito Mode</span>
                <span className="settings-row-subtitle">Don't save watch history</span>
              </div>
            </div>
            <button className={`settings-toggle ${settings.incognito ? 'active' : ''}`}>
              <div className="settings-toggle-thumb" />
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section mt-6">
        <div className="settings-section-header">Data Management</div>
        <div className="settings-card">
          <button className="settings-row">
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Download size={20} />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Export Data</span>
                <span className="settings-row-subtitle">Download your history</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
          <button className="settings-row" onClick={() => alert("Power button clicked")}>
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Power size={20} className="text-amber-500" />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Power</span>
                <span className="settings-row-subtitle">System power management</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
          <button className="settings-row">
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title text-red-500">Delete Account</span>
                <span className="settings-row-subtitle">Permanently remove data</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="settings-section mt-6">
        <div className="settings-section-header">Exclusive</div>
        <div className="settings-card">
          <button 
            className="settings-row" 
            onClick={() => {
              if ((window as any).openAdminPanel) {
                (window as any).openAdminPanel();
              }
            }}
          >
            <div className="settings-row-content">
              <div className="settings-row-icon">
                <Zap size={20} className="text-amber-500" />
              </div>
              <div className="settings-row-text">
                <span className="settings-row-title">Voucher VIP</span>
                <span className="settings-row-subtitle">Redeem exclusive access</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

    </div>
  );

  const getTitle = () => {
    switch (currentView) {
      case 'video': return 'Video Quality';
      case 'appearance': return 'Appearance';
      case 'privacy': return 'Privacy';
      default: return 'App Settings';
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        {currentView !== 'main' ? (
          <button onClick={() => setCurrentView('main')} className="settings-back-btn">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <button onClick={onClose} className="settings-back-btn">
            <ArrowLeft size={24} />
          </button>
        )}
        <h2 className="settings-header-title">{getTitle()}</h2>
      </div>

      {/* Content */}
      {currentView === 'main' && renderMainView()}
      {currentView === 'video' && renderVideoView()}
      {currentView === 'appearance' && renderAppearanceView()}
      {currentView === 'privacy' && renderPrivacyView()}

      {/* Footer */}
      <div className="settings-footer">
        <button 
          onClick={onClose}
          className="settings-btn settings-btn-secondary"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="settings-btn settings-btn-primary"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

export default AppSettingsModal;
