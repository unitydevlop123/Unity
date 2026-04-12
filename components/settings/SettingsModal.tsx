
import React, { useState, useEffect } from 'react';
import SettingsTabGeneral from './SettingsTabGeneral';
import SettingsTabPrivacy from './SettingsTabPrivacy';
import SettingsTabAbout from './SettingsTabAbout';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  model: string;
  setModel: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  t: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  darkMode, 
  setDarkMode,
  model,
  setModel,
  language,
  setLanguage,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'about'>('general');
  const [isNavOpen, setIsNavOpen] = useState(true);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div 
        className={`settings-modal ${!isNavOpen ? 'nav-collapsed' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h2 className="settings-title">{t.settings}</h2>
            <button 
              className="settings-nav-toggle mobile-only" 
              onClick={() => setIsNavOpen(false)}
              title="Close Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
          </div>
          <nav className="settings-nav">
            <button 
              className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => { setActiveTab('general'); if (window.innerWidth < 768) setIsNavOpen(false); }}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span> 
              <span className="nav-text">{t.general}</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => { setActiveTab('privacy'); if (window.innerWidth < 768) setIsNavOpen(false); }}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span> 
              <span className="nav-text">{t.privacy}</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => { setActiveTab('about'); if (window.innerWidth < 768) setIsNavOpen(false); }}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span> 
              <span className="nav-text">{t.about}</span>
            </button>
          </nav>
        </div>
        
        <div className="settings-content">
          <div className="settings-content-header">
            <button 
              className="settings-nav-toggle" 
              onClick={() => setIsNavOpen(!isNavOpen)}
              title={isNavOpen ? "Hide Menu" : "Show Menu"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M3 6h18M3 18h18"></path>
              </svg>
            </button>
            <span className="active-tab-label">
              {activeTab === 'general' ? t.general : activeTab === 'privacy' ? t.privacy : t.about}
            </span>
            <button className="close-btn" onClick={onClose} title="Close Settings">×</button>
          </div>
          
          <div className="tab-container">
            {activeTab === 'general' && (
              <SettingsTabGeneral 
                darkMode={darkMode} 
                setDarkMode={setDarkMode}
                model={model}
                setModel={setModel}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            )}
            {activeTab === 'privacy' && <SettingsTabPrivacy />}
            {activeTab === 'about' && <SettingsTabAbout t={t} />}
          </div>

          <div className="settings-footer">
            <button className="primary-btn save-btn" onClick={onClose}>{t.done}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
