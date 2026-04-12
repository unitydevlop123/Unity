import React, { useState } from 'react';
import { firebaseRest } from '../../services/firebaseRest';

const SettingsTabAbout: React.FC<{ t: any }> = ({ t }) => {
  const [clickCount, setClickCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const handleVersionClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setShowAdmin(true);
      alert('🔧 Developer Mode Enabled');
    }
  };

  return (
    <div className="settings-tab-content about-tab">
      <div className="about-header">
        <div className="about-logo">
          <svg viewBox="0 0 100 100" width="64" height="64">
            <circle cx="50" cy="50" r="48" fill="#1e3a8a" />
            <path d="M25,55 Q40,30 60,45 T85,55 Q70,75 50,75 Q30,75 25,55" fill="white" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="45" cy="50" r="4" fill="#1e3a8a" />
          </svg>
        </div>
        <div className="about-title-group">
          <h2 className="about-app-name">UnityDev AI</h2>
          <span 
            className="about-version" 
            onClick={handleVersionClick}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Version Info"
          >
            {t.version} v1.0.0
          </span>
        </div>
      </div>
      
      <div className="about-details">
        <p>Made by: <strong>UnityDev</strong></p>
        <p>A high-fidelity AI chat interface designed for power users and developers.</p>
      </div>

      <div className="about-links">
        <a href="#" className="about-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
        <a href="#" className="about-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
        <a href="#" className="about-link" onClick={(e) => e.preventDefault()}>Documentation</a>
      </div>
    </div>
  );
};

export default SettingsTabAbout;