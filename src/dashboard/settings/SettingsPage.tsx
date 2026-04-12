import React from 'react';
import { 
  Settings, Shield, Bell, 
  Globe, Lock, User, 
  Database, Terminal, Activity,
  Cpu, Zap, RefreshCw, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import './SettingsPage.css';

interface SettingsPageProps {
  isCompact: boolean;
  onToggleCompact: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isCompact, onToggleCompact }) => {
  const sections = [
    {
      id: 'ui',
      title: 'Interface Settings',
      icon: Zap,
      items: [
        { 
          label: 'Compact Mode', 
          desc: 'Reduce padding and font sizes for high-density information display', 
          icon: Activity, 
          status: isCompact ? 'Active' : 'Disabled',
          isToggle: true,
          value: isCompact,
          onToggle: onToggleCompact
        },
      ]
    },
    {
      id: 'security',
      title: 'Security Protocols',
      icon: Shield,
      items: [
        { label: 'Two-Factor Authentication', desc: 'Biometric & hardware key verification', icon: Lock, status: 'Active' },
        { label: 'Global Encryption', desc: 'AES-256-GCM protocol for data streams', icon: Shield, status: 'Enabled' },
        { label: 'Session Management', desc: 'Automatic termination after inactivity', icon: Activity, status: '30m' },
      ]
    },
    {
      id: 'system',
      title: 'System Configuration',
      icon: Cpu,
      items: [
        { label: 'API Access Keys', desc: 'Manage third-party integration tokens', icon: Terminal, status: '12 Active' },
        { label: 'Database Sync', desc: 'Real-time synchronization frequency', icon: Database, status: 'Instant' },
        { label: 'Network Latency', desc: 'Global edge node optimization', icon: Globe, status: 'Optimized' },
      ]
    }
  ];

  return (
    <div className={`se-page ${isCompact ? 'compact' : ''}`}>
      <header className="se-header">
        <div className="se-title-group">
          <h1 className="se-title">System Protocols</h1>
          <p className="se-subtitle">Configure global system parameters & security layers</p>
        </div>
        <div className="se-header-actions">
          <div className="se-config-status">
            <div className="se-status-indicator verified" />
            <div className="se-status-info">
              <span className="se-status-label">Config Status</span>
              <span className="se-status-value">Verified & Encrypted</span>
            </div>
          </div>
          <button className="se-action-btn primary">
            <RefreshCw size={18} />
            Reset Defaults
          </button>
        </div>
      </header>

      <div className="se-content">
        {sections.map((section, idx) => (
          <motion.div 
            key={section.id} 
            className="se-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="se-section-header">
              <section.icon size={20} className="text-zinc-500" />
              <h3>{section.title}</h3>
            </div>
            <div className="se-items-list">
              {section.items.map((item, i) => (
                <div key={item.label} className="se-item group">
                  <div className="se-item-main">
                    <div className="se-item-icon">
                      <item.icon size={20} />
                    </div>
                    <div className="se-item-info">
                      <h4 className="se-item-label">{item.label}</h4>
                      <p className="se-item-desc">{item.desc}</p>
                    </div>
                  </div>
                  <div className="se-item-actions">
                    {item.isToggle ? (
                      <button 
                        className={`se-toggle ${item.value ? 'active' : ''}`}
                        onClick={item.onToggle}
                      >
                        <div className="se-toggle-thumb" />
                      </button>
                    ) : (
                      <span className="se-item-status">{item.status}</span>
                    )}
                    <button className="se-item-btn">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div 
          className="se-danger-zone"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="se-danger-header">
            <Zap size={20} className="text-red-500" />
            <h3>Critical Operations</h3>
          </div>
          <div className="se-danger-content">
            <div className="se-danger-text">
              <h4>Wipe System Data</h4>
              <p>Permanently delete all records and reset the infrastructure. This action is irreversible.</p>
            </div>
            <button className="se-danger-btn">Initiate Wipe</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
