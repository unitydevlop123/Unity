
import React, { useState } from 'react';
import { Power, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '../../services/aiService';
import { firebaseRest } from '../../services/firebaseRest';
import { useAuth } from '../../context/AuthContext';

interface GeneralProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  model: string;
  setModel: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  t?: any;
}

const SettingsTabGeneral: React.FC<GeneralProps> = ({ 
  darkMode, setDarkMode, 
  model, setModel, 
  language, setLanguage 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="settings-tab-content">
      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Theme</span>
          <span className="setting-description">Dark mode is locked.</span>
        </div>
        <button 
          className="toggle-switch active" 
          disabled
        >
          🌙 Dark
        </button>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Default Model</span>
          <span className="setting-description">Select your preferred AI model.</span>
        </div>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="setting-select">
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} - {m.description}
            </option>
          ))}
        </select>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Language</span>
          <span className="setting-description">Choose your preferred display language.</span>
        </div>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="setting-select">
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Chinese">Chinese</option>
        </select>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Power</span>
          <span className="setting-description">System power management.</span>
        </div>
        <button 
          onClick={() => alert("Power button clicked")}
          style={{ 
            padding: '8px 16px', 
            background: '#f59e0b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Power size={16} />
          Power
        </button>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Voucher VIP</span>
          <span className="setting-description">Redeem exclusive access</span>
        </div>
        <button 
          onClick={() => {
            if ((window as any).openAdminPanel) {
              (window as any).openAdminPanel();
            }
          }}
          style={{ 
            padding: '8px 16px', 
            background: 'var(--accent-color, #10a37f)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={16} />
          Redeem
        </button>
      </div>

      {user && (
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Account</span>
            <span className="setting-description">Sign out of your account on this device.</span>
          </div>
          <button 
            onClick={logout}
            style={{ 
              padding: '8px 16px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsTabGeneral;
