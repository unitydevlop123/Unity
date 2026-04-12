import React from 'react';
import { ArrowLeft, Cpu } from 'lucide-react';
import { STREAM_MODELS } from '../models-list';
import '../../../styles/SettingsShared.css';

interface ModelListPageProps {
  onBack: () => void;
}

const ModelListPage: React.FC<ModelListPageProps> = ({ onBack }) => {
  return (
    <div className="settings-page" style={{ zIndex: 90 }}>
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Model List</h2>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">Available Models</div>
          <div className="settings-card">
            {STREAM_MODELS.map((model, index) => (
              <div key={model.internal} className="settings-row" style={{ cursor: 'default', borderBottom: index === STREAM_MODELS.length - 1 ? 'none' : undefined }}>
                <div className="settings-row-content">
                  <div className="settings-row-icon">
                    <Cpu size={20} />
                  </div>
                  <div className="settings-row-text">
                    <span className="settings-row-title">{model.name}</span>
                    <span className="settings-row-subtitle">{model.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelListPage;
