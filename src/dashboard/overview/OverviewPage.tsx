import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Zap, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Globe, Shield,
  Cpu, Database, Terminal, CreditCard, DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { dashboardService, Message } from '../services/dashboardService';
import './OverviewPage.css';

interface OverviewPageProps {
  isCompact: boolean;
}

const OverviewPage: React.FC<OverviewPageProps> = ({ isCompact }) => {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '...', change: '...', icon: Users, color: '#00f2ff' },
    { label: 'Total Transactions', value: '...', change: '...', icon: CreditCard, color: '#00ff88' },
    { label: 'Revenue (24h)', value: '...', change: '...', icon: DollarSign, color: '#f59e0b' },
    { label: 'Active Nodes', value: '...', change: 'STABLE', icon: Globe, color: '#bc00ff' },
  ]);
  const [logs, setLogs] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [systemStats, messages] = await Promise.all([
      dashboardService.fetchSystemStats(),
      dashboardService.fetchMessages()
    ]);

    // Simulating user and transaction data for the dashboard
    const totalUsers = Math.floor(Math.random() * 5000) + 15000;
    const totalTransactions = Math.floor(Math.random() * 10000) + 45000;
    const revenue = Math.floor(Math.random() * 5000) + 12000;

    setStats([
      { label: 'Total Users', value: totalUsers.toLocaleString(), change: '+12%', icon: Users, color: '#00f2ff' },
      { label: 'Total Transactions', value: totalTransactions.toLocaleString(), change: '+8%', icon: CreditCard, color: '#00ff88' },
      { label: 'Revenue (24h)', value: `$${revenue.toLocaleString()}`, change: '+15%', icon: DollarSign, color: '#f59e0b' },
      { label: 'Active Nodes', value: systemStats.activeNodes.toLocaleString(), change: 'STABLE', icon: Globe, color: '#bc00ff' },
    ]);

    setLogs(messages.slice(0, 5));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`ov-page ${isCompact ? 'compact' : ''}`}>
      <header className="ov-header">
        <div className="ov-title-group">
          <h1 className="ov-title">Dashboard Overview</h1>
          <p className="ov-subtitle">Real-time platform metrics and system diagnostics</p>
        </div>
        <div className="ov-badge">
          <div className="ov-badge-dot" />
          Live Feed
        </div>
      </header>

      <div className="ov-stats-grid">
        {stats.map((stat, i) => {
          const isUp = stat.change.startsWith('+');
          const isStable = stat.change === 'STABLE';
          const changeColor = isUp ? '#10b981' : isStable ? '#f59e0b' : '#ef4444';
          
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="ov-stat-card"
            >
              <div 
                className="ov-stat-icon-box"
                style={{ 
                  background: `${stat.color}15`, 
                  color: stat.color,
                  border: `1px solid ${stat.color}30`
                }}
              >
                <stat.icon size={20} />
              </div>
              <div className="ov-stat-info">
                <span className="ov-stat-label">{stat.label}</span>
                <div className="ov-stat-value-row">
                  <span className="ov-stat-value">{stat.value}</span>
                  <span 
                    className="ov-stat-change"
                    style={{ color: changeColor }}
                  >
                    {isUp ? <ArrowUpRight size={12} /> : isStable ? null : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="ov-main-grid">
        <div className="ov-chart-section">
          <div className="ov-section-header">
            <h2 className="ov-section-title">Network Traffic</h2>
            <div className="ov-tabs">
              <button className="ov-tab active">24h</button>
              <button className="ov-tab">7d</button>
              <button className="ov-tab">30d</button>
            </div>
          </div>
          <div className="ov-chart-placeholder">
            <div className="ov-chart-grid" />
            <div className="chart-container flex items-end justify-between gap-2 px-8 w-full h-full pt-20">
              {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100, 40, 70, 45, 90, 65, 80].map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  className="flex-1 group relative"
                >
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-600/20 to-emerald-500/60 rounded-t-lg transition-all duration-500 group-hover:from-emerald-500 group-hover:to-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                    style={{ height: '100%' }}
                  />
                </motion.div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="ov-chart-label text-white/20 font-mono text-[10px] uppercase tracking-widest">Visualizing Neural Pulse...</p>
            </div>
          </div>
        </div>

        <div className="ov-side-column">
          <div className="ov-nodes-card">
            <h2 className="ov-section-title" style={{ marginBottom: '1rem' }}>Global Nodes</h2>
            <Globe className="ov-globe-icon" />
            <div className="flex justify-between text-xs text-zinc-400 mb-2 font-medium">
              <span>Active Nodes</span>
              <span className="text-white font-mono">{stats[3].value}</span>
            </div>
            <div className="ov-progress-bar">
              <div className="ov-progress-fill" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="ov-logs-card mt-4">
            <h2 className="ov-section-title" style={{ marginBottom: '1rem' }}>System Logs</h2>
            <div className="ov-logs-list">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={log.message_id} className="ov-log-entry">
                  <span className="text-[10px] font-mono text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[11px] font-medium text-zinc-300 truncate">
                    {log.content}
                  </span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 py-8">
                  <Terminal size={24} />
                  <span className="text-[10px] uppercase mt-2">No active logs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
