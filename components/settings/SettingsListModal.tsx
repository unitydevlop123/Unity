import React, { useEffect } from 'react';
import './SettingsListModal.css';

interface SettingsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAppSettings: () => void;
  t: any;
}

const SettingsListModal: React.FC<SettingsListModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenAppSettings,
  t
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-list-overlay" onClick={onClose}>
      <div 
        className="settings-list-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-list-header">
          <h2 className="settings-list-title">{t.settings}</h2>
          <button className="settings-list-close" onClick={onClose} title="Close">×</button>
        </div>
        
        <div className="settings-list-content">
          <button className="settings-list-item" onClick={onOpenAppSettings}>
            <span>App Settings</span>
            <span className="settings-list-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          </button>
          
          {/* Future settings files can be added here */}
        </div>
      </div>
    </div>
  );
};

export default SettingsListModal;
