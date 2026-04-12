import React, { useState } from 'react';
import { 
  X, 
  Search, 
  User, 
  Users, 
  Shield, 
  Smartphone, 
  Wifi, 
  Monitor, 
  Moon, 
  ChevronRight,
  Trash2,
  RefreshCcw,
  Sparkles,
  Power
} from 'lucide-react';
import { autoCleanerService } from '../services/autoCleanerService';
import './SettingsPage.css';

interface SettingsPageProps {
  onBack: () => void;
  settings: {
    stream4K: boolean;
    incognito: boolean;
    theme: string;
  };
  onUpdateSettings: (newSettings: any) => void;
  userEmail?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, settings, onUpdateSettings, userEmail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ removed: number; moved: number } | null>(null);

  const handleToggle4K = () => {
    onUpdateSettings({ ...settings, stream4K: !settings.stream4K });
  };

  const handleThemeChange = (theme: string) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleAutoClean = async () => {
    if (isCleaning) return;
    setIsCleaning(true);
    setCleanResult(null);
    try {
      const result = await autoCleanerService.cleanAllCategories();
      setCleanResult({ removed: result.totalRemoved, moved: result.totalMoved });
      setTimeout(() => setCleanResult(null), 5000);
    } catch (err) {
      console.error("Auto Clean Error:", err);
    } finally {
      setIsCleaning(false);
    }
  };

  const filteredSections = [
    {
      title: 'Account',
      items: [
        { id: 'general', icon: User, label: 'General', action: () => console.log('General') },
        { id: 'switch', icon: Users, label: 'Switch Account', action: () => console.log('Switch') },
        { id: 'family', icon: Shield, label: 'Family Center', action: () => console.log('Family') },
      ]
    },
    {
      title: 'Video & Audio Preferences',
      items: [
        { 
          id: 'quality', 
          icon: Monitor, 
          label: '4K Streaming', 
          type: 'toggle', 
          value: settings.stream4K, 
          action: handleToggle4K 
        },
        { 
          id: 'data', 
          icon: Wifi, 
          label: 'Data Saver', 
          type: 'toggle', 
          value: false, // Placeholder
          action: () => console.log('Data Saver') 
        },
        {
          id: 'theme',
          icon: Moon,
          label: 'App Theme',
          type: 'select',
          value: settings.theme,
          action: () => setActiveSubMenu('theme')
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'power', icon: Power, label: 'Power', action: () => alert('Power button clicked') }
      ]
    }
  ];

  // Filter logic could be added here if needed based on searchQuery

  return (
    <div className="settings-page-container">
      {/* Header */}
      <div className="settings-header">
        <button className="close-btn" onClick={onBack}>
          <X size={28} color="white" />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      {/* Search Bar */}
      <div className="settings-search-container">
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search settings" 
            className="settings-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Settings List */}
      <div className="settings-content">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="settings-section">
            <h3 className="section-header-text">{section.title}</h3>
            <div className="section-items">
              {section.items.map((item) => (
                <div key={item.id} className="setting-row" onClick={item.type === 'toggle' ? item.action : item.action}>
                  <div className="row-left">
                    <item.icon size={24} className="row-icon" />
                    <span className="row-label">{item.label}</span>
                  </div>
                  
                  <div className="row-right">
                    {item.type === 'toggle' ? (
                      <div className={`toggle-switch ${item.value ? 'active' : ''}`}>
                        <div className="toggle-knob"></div>
                      </div>
                    ) : item.type === 'select' ? (
                      <div className="row-value">
                        <span className="value-text capitalize">{item.value}</span>
                        <ChevronRight size={20} className="row-arrow" />
                      </div>
                    ) : item.type === 'button' ? (
                      <div className="row-value">
                        {isCleaning && <RefreshCcw size={18} className="animate-spin mr-2" />}
                        <ChevronRight size={20} className="row-arrow" />
                      </div>
                    ) : (
                      <ChevronRight size={20} className="row-arrow" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {cleanResult && (
          <div className="clean-result-toast">
            <Sparkles size={18} />
            <span>Cleaned! Removed: {cleanResult.removed}, Moved: {cleanResult.moved}</span>
          </div>
        )}
      </div>

      {/* Theme Sub-menu Overlay (Simple implementation for now) */}
      {activeSubMenu === 'theme' && (
        <div className="submenu-overlay">
          <div className="submenu-header">
            <button onClick={() => setActiveSubMenu(null)} className="back-btn-sub">
              <ChevronRight size={24} className="rotate-180" />
            </button>
            <h2>App Theme</h2>
          </div>
          <div className="submenu-content">
            {['red', 'gold', 'blue', 'green'].map(theme => (
              <div 
                key={theme} 
                className="setting-row" 
                onClick={() => { handleThemeChange(theme); setActiveSubMenu(null); }}
              >
                <span className="capitalize">{theme}</span>
                {settings.theme === theme && <div className="check-mark">✓</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
