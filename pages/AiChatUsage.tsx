import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  User, 
  Clock, 
  Activity, 
  Shield, 
  TrendingUp, 
  Globe,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firebaseRest } from '../services/firebaseRest';
import '../styles/SettingsShared.css';
import './AiChatUsage.css';

interface AiChatUsageProps {
  onBack: () => void;
  theme?: 'red' | 'gold' | 'blue' | 'green';
}

const AiChatUsage: React.FC<AiChatUsageProps> = ({ onBack, theme = 'green' }) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [usagePercent, setUsagePercent] = useState(0);
  const [messagesSent, setMessagesSent] = useState(0);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (user?.email) {
      firebaseRest.getMessageLimit(user.email).then(data => {
        if (data) {
          setMessagesSent(data.messages_today);
          setLimit(data.total_limit);
          setUsagePercent(Math.min(100, (data.messages_today / data.total_limit) * 100));
        }
      });
    }
  }, [user?.email]);

  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnight());
    }, 1000);

    setTimeLeft(calculateTimeUntilMidnight());
    return () => clearInterval(timer);
  }, []);

  const getBatteryIcon = () => {
    if (usagePercent < 30) return <BatteryFull className="text-accent" size={24} style={{ color: 'var(--app-accent)' }} />;
    if (usagePercent < 70) return <BatteryMedium className="text-yellow-500" size={24} />;
    return <BatteryLow className="text-red-500" size={24} />;
  };

  const getBatteryColor = () => {
    if (usagePercent < 50) {
      return 'bg-accent shadow-accent';
    }
    if (usagePercent < 85) return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  };

  return (
    <div className="ai-usage-page">
      <div className="usage-header">
        <button className="usage-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="usage-header-title">⚡ AI Power Usage</h2>
      </div>

      <div className="usage-content">
        {/* User Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="user-status-card"
        >
          <div className="user-info-main">
            <div className="user-avatar-wrapper">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="user-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <div className="user-avatar-placeholder">
                  <User size={32} />
                </div>
              )}
              <div className="status-indicator">
                <div className="status-dot-pulse"></div>
              </div>
            </div>
            <div className="user-details">
              <h3 className="user-name">{user?.name || 'UnityDev User'}</h3>
              <div className="user-badge">
                <Shield size={12} className="mr-1" />
                <span>VERIFIED PRO MEMBER</span>
              </div>
            </div>
          </div>
          <div className="live-traffic-tag">
            <Globe size={14} className="animate-pulse" style={{ color: 'var(--app-accent)' }} />
            <span>LIVE TRAFFIC ACTIVE</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <div className="stat-icon-box themed-icon-box">
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Messages Sent</span>
              <span className="stat-value">{messagesSent}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <div className="stat-icon-box themed-icon-box">
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Power Left</span>
              <span className="stat-value">{limit - messagesSent}</span>
            </div>
          </motion.div>
        </div>

        {/* Battery Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="battery-section"
        >
          <div className="section-header">
            <div className="flex items-center gap-2">
              {getBatteryIcon()}
              <span className="text-white font-medium">AI POWER LEVEL</span>
            </div>
            <span className="text-zinc-400 text-sm">{100 - usagePercent}% Remaining</span>
          </div>

          <div className="battery-container">
            <div className="battery-body">
              <div 
                className={`battery-level ${getBatteryColor()}`}
                style={{ width: `${100 - usagePercent}%` }}
              >
                <div className="battery-glare"></div>
              </div>
            </div>
            <div className="battery-tip"></div>
          </div>

          <div className="usage-meta">
            <div className="meta-item">
              <Zap size={14} style={{ color: 'var(--app-accent)' }} />
              <span>{messagesSent} / {limit} Messages Sent</span>
            </div>
            <div className="meta-item">
              <Clock size={14} />
              <span>Reset in: <span className="text-white font-mono">{timeLeft}</span></span>
            </div>
          </div>
        </motion.div>

        {/* Reset Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="reset-info-card"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 themed-icon-box rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-white font-medium">Automatic Reset</h4>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Your AI Power battery automatically recharges to 100% every day at 12:00 AM (Midnight). 
                Stay transparent, stay fair.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scrolling Ticker */}
      <div className="ticker-container">
        <div className="ticker-wrapper">
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            SYSTEM ONLINE: 99.9% UPTIME
          </div>
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            AI ENGINE: OPTIMIZED
          </div>
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            GLOBAL TRAFFIC: STABLE
          </div>
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            UNITYDEV PRO: ACTIVE
          </div>
          {/* Duplicate for seamless loop */}
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            SYSTEM ONLINE: 99.9% UPTIME
          </div>
          <div className="ticker-item">
            <span className="ticker-dot"></span>
            AI ENGINE: OPTIMIZED
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatUsage;
