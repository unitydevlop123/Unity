import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Bot, 
  Film, 
  Tv, 
  Check,
  Zap
} from 'lucide-react';
import '../../styles/SettingsShared.css';

interface NotificationSettingsProps {
  onBack: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const [newMovieAlerts, setNewMovieAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(false);

  return (
    <div className="settings-page" style={{ zIndex: 100 }}>
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Notification Control</h2>
      </div>

      <div className="settings-content">
        {/* The Silent Mode Section */}
        <div className="settings-section">
          <div className="settings-section-header">The Silent Mode</div>
          <div className="settings-card">
            
            {/* New Movie Alerts */}
            <div className="settings-row" onClick={() => setNewMovieAlerts(!newMovieAlerts)}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Film size={20} className={newMovieAlerts ? "text-emerald-500" : ""} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">New Movie Alerts</span>
                  <span className="settings-row-subtitle">
                    Get notified for new "American Movie" uploads
                  </span>
                </div>
              </div>
              <button className={`settings-toggle ${newMovieAlerts ? 'active' : ''}`}>
                <div className="settings-toggle-thumb" />
              </button>
            </div>

            {/* AI Suggestions */}
            <div className="settings-row" onClick={() => setAiSuggestions(!aiSuggestions)}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Bot size={20} className={aiSuggestions ? "text-amber-500" : ""} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">AI Suggestions</span>
                  <span className="settings-row-subtitle">
                    Receive "Pick of the Day" recommendations
                  </span>
                </div>
              </div>
              <button className={`settings-toggle ${aiSuggestions ? 'active' : ''}`}>
                <div className="settings-toggle-thumb" />
              </button>
            </div>

          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="settings-section">
          <div className="settings-section-header">Advanced Filters</div>
          <div className="settings-card opacity-60">
            <div className="settings-row cursor-not-allowed">
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Tv size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Channel Specific Alerts</span>
                  <span className="settings-row-subtitle">Coming Soon</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">
                LOCKED
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationSettings;
