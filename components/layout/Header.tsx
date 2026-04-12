import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_MODELS } from '../../services/aiService';
import './Header.css';

interface HeaderProps {
  isChatActive: boolean;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  model: string;
  onModelChange: (model: string) => void;
  t: any;
}

const Header: React.FC<HeaderProps> = ({ 
  isChatActive,
  onNewChat = () => {},
  onToggleSidebar = () => {},
  onOpenSettings = () => {},
  model,
  onModelChange,
  t
}) => {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Find name or use ID
  const currentModelObj = AVAILABLE_MODELS.find(m => m.id === model);
  let displayName = currentModelObj ? currentModelObj.name : 'Select Model';
  
  // Shorten the display name for the pill (remove content in parentheses)
  displayName = displayName.split('(')[0].trim();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsModelOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn" title={t.settings} onClick={onToggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="header-center">
        <div className="model-selector-container" ref={dropdownRef}>
          <div className="relative">
            <button 
              className="model-selector-pill" 
              onClick={() => setIsModelOpen(!isModelOpen)}
            >
              {displayName}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isModelOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div className={`model-dropdown ${isModelOpen ? 'open' : ''}`}>
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m.id)}
                  className={`model-option ${model === m.id ? 'active' : ''}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn new-chat-header-btn" onClick={onNewChat} title={t.newChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="ml-1 text-sm font-medium hidden xs:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};

export default Header;