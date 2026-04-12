import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Activity, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Shield,
  User,
  Lock,
  Zap,
  Bell,
  Smartphone,
  Cpu,
  Trash2,
  RefreshCcw,
  Sparkles,
  Clock,
  Power
} from 'lucide-react';
import PersonalDataSettings from '../../components/user/PersonalDataSettings';
import DataPerformanceSettings from '../../components/user/DataPerformanceSettings';
import NotificationSettings from '../../components/user/NotificationSettings';
import SessionManager from '../../components/user/SessionManager';
import ModelListPage from '../../src/stream/pages/ModelListPage';
import AiChatUsage from '../AiChatUsage';
import { autoCleanerService } from '../../services/autoCleanerService';
import { QRCodeSVG } from 'qrcode.react';
import JTPowerDemo from '../../components/user/JTPowerDemo';
import '../../styles/SettingsShared.css';

interface SettingsMenuProps {
  onBack: () => void;
  onOptionSelect: (option: 'edit' | 'settings' | 'activity' | 'feedback' | 'logout') => void;
  userEmail?: string;
  settings?: any;
  onUpdateSettings?: (settings: any) => void;
  theme: 'red' | 'gold' | 'blue' | 'green';
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type SubMenu = 'main' | 'personal' | 'data' | 'notifications' | 'sessions' | 'models' | 'ai-usage';

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onOptionSelect, userEmail, settings, onUpdateSettings, theme, showNotification }) => {
  const themeColor = theme === 'gold' ? 'bg-amber-600' : 
                    theme === 'blue' ? 'bg-blue-600' :
                    theme === 'green' ? 'bg-emerald-600' : 'bg-red-600';
  const themeText = theme === 'gold' ? 'text-amber-500' : 
                   theme === 'blue' ? 'text-blue-500' :
                   theme === 'green' ? 'text-emerald-500' : 'text-red-500';
  const [currentView, setCurrentView] = useState<SubMenu>('main');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ removed: number; moved: number } | null>(null);
  const [showPowerDemo, setShowPowerDemo] = useState(false);

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

  const isAutoCleanEnabled = settings?.autoClean || false;

  const toggleAutoClean = () => {
    if (onUpdateSettings && settings) {
      onUpdateSettings({ ...settings, autoClean: !isAutoCleanEnabled });
    }
  };

  if (currentView === 'personal') {
    return <PersonalDataSettings onBack={() => setCurrentView('main')} userEmail={userEmail || ''} />;
  }

  if (currentView === 'data') {
    return <DataPerformanceSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'sessions') {
    return <SessionManager onBack={() => setCurrentView('main')} showNotification={showNotification} />;
  }

  if (currentView === 'models') {
    return <ModelListPage onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'ai-usage') {
    return <AiChatUsage onBack={() => setCurrentView('main')} theme={theme} />;
  }

  return (
    <div className="settings-page" style={{ zIndex: 90 }}>
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Settings</h2>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">Account</div>
          <div className="settings-card">
            <button className="settings-row" onClick={() => onOptionSelect('edit')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <User size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Edit Profile</span>
                  <span className="settings-row-subtitle">Change your avatar and name</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => setCurrentView('personal')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Lock size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Personal Data</span>
                  <span className="settings-row-subtitle">Password, Email & Security</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => setCurrentView('sessions')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Smartphone size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Session Manager</span>
                  <span className="settings-row-subtitle">Manage active devices</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">App Preferences</div>
          <div className="settings-card">
            <button className="settings-row" onClick={() => onOptionSelect('settings')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Settings size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">App Settings</span>
                  <span className="settings-row-subtitle">Theme, playback, and display</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => setCurrentView('models')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Cpu size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Model List</span>
                  <span className="settings-row-subtitle">View available AI models</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => setCurrentView('data')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Zap size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Data & Performance</span>
                  <span className="settings-row-subtitle">Cache, optimization & storage</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => setCurrentView('notifications')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Bell size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Notification Control</span>
                  <span className="settings-row-subtitle">Alerts & AI suggestions</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">AI & Maintenance</div>
          <div className="settings-card">
            <button className="settings-row" onClick={() => setCurrentView('ai-usage')}>
              <div className="settings-row-content">
                <div className="settings-row-icon text-emerald-500">
                  <Zap size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">AI Power Usage</span>
                  <span className="settings-row-subtitle">Check your daily message limits</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={handleAutoClean} disabled={isCleaning}>
              <div className="settings-row-content">
                <div className={`settings-row-icon ${isCleaning ? 'animate-spin' : ''}`}>
                  {isCleaning ? <RefreshCcw size={20} /> : <Trash2 size={20} />}
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">{isCleaning ? 'Cleaning Database...' : 'Manual Cleaner'}</span>
                  <span className="settings-row-subtitle">Remove miscategorized videos now</span>
                </div>
              </div>
              {!isCleaning && <ChevronRight size={18} className="text-zinc-600" />}
            </button>

            <div className="settings-row">
              <div className="settings-row-content">
                <div className={`settings-row-icon ${isAutoCleanEnabled ? themeText : ''}`}>
                  <Clock size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Automatic Cleaning</span>
                  <span className="settings-row-subtitle">Run cleaner every 5 seconds</span>
                </div>
              </div>
              <button 
                onClick={toggleAutoClean}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ${isAutoCleanEnabled ? themeColor : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isAutoCleanEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">Share App</div>
          <div className="settings-card flex flex-col items-center justify-center py-6 gap-4">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG value={window.location.href} size={150} level="H" includeMargin={false} />
            </div>
            <div className="text-center px-4">
              <h3 className="text-white font-medium mb-1">Scan to Install</h3>
              <p className="text-zinc-400 text-sm">Scan this QR code with any phone to open and install UnityDev Pro instantly.</p>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">Support</div>
          <div className="settings-card">
            <button className="settings-row" onClick={() => onOptionSelect('feedback')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <HelpCircle size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Help & Feedback</span>
                  <span className="settings-row-subtitle">Get help or send us feedback</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            <button className="settings-row" onClick={() => onOptionSelect('activity')}>
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
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-card">
            <button className="settings-row" onClick={() => setShowPowerDemo(!showPowerDemo)}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Power size={20} className="text-amber-500" />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Power</span>
                  <span className="settings-row-subtitle">System power management</span>
                </div>
              </div>
              <ChevronRight size={18} className={`text-zinc-600 transition-transform duration-200 ${showPowerDemo ? 'rotate-90' : ''}`} />
            </button>
            {showPowerDemo && <JTPowerDemo />}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-card border-red-900/30 bg-red-900/10">
            <button className="settings-row border-none hover:bg-red-900/20" onClick={() => onOptionSelect('logout')}>
              <div className="settings-row-content">
                <div className="settings-row-icon bg-red-500/10 text-red-500">
                  <LogOut size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title text-red-500">Log Out</span>
                  <span className="settings-row-subtitle text-red-500/70">{userEmail}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="settings-section">
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
                  <Sparkles size={20} className="text-amber-500" />
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

        {cleanResult && (
          <div className="clean-result-toast">
            <Sparkles size={18} />
            <span>Cleaned! Removed: {cleanResult.removed}, Moved: {cleanResult.moved}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsMenu;
