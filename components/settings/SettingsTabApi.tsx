import React from 'react';

const SettingsTabApi: React.FC = () => {
  return (
    <div className="settings-tab-content">
      <div className="setting-item flex-col">
        <div className="setting-info">
          <span className="setting-label">API Status</span>
          <span className="setting-description">UnityDev AI is currently running in Demo Mode.</span>
        </div>
        <div className="input-with-action">
          <input 
            type="text" 
            className="setting-input" 
            placeholder="DEMO_MODE_ACTIVE"
            value="DEMO_MODE"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsTabApi;