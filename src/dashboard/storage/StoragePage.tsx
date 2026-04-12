import React from 'react';
import { 
  HardDrive, Database, Cloud, 
  Server, Activity, Shield, 
  ArrowUpRight, ArrowDownRight, Search, Filter,
  Cpu, Zap, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import './StoragePage.css';

interface StoragePageProps {
  isCompact: boolean;
}

const StoragePage: React.FC<StoragePageProps> = ({ isCompact }) => {
  const nodes = [
    { id: '1', name: 'Alpha_Core', type: 'SSD Cluster', capacity: '2.4 TB', used: '1.2 TB', status: 'Optimal', color: 'emerald', health: 98 },
    { id: '2', name: 'Beta_Node', type: 'HDD Array', capacity: '12.0 TB', used: '8.4 TB', status: 'Warning', color: 'amber', health: 72 },
    { id: '3', name: 'Gamma_Cloud', type: 'Virtual Node', capacity: '50.0 TB', used: '12.5 TB', status: 'Optimal', color: 'blue', health: 100 },
    { id: '4', name: 'Delta_Backup', type: 'Cold Storage', capacity: '100.0 TB', used: '42.0 TB', status: 'Optimal', color: 'purple', health: 95 },
  ];

  return (
    <div className={`st-page ${isCompact ? 'compact' : ''}`}>
      <header className="st-header">
        <div className="st-title-group">
          <h1 className="st-title">Storage Infrastructure</h1>
          <p className="st-subtitle">Manage global data clusters & neural storage nodes</p>
        </div>
        <div className="st-header-actions">
          <div className="st-cluster-status">
            <div className="st-status-indicator active" />
            <div className="st-status-info">
              <span className="st-status-label">Cluster Health</span>
              <span className="st-status-value">94.2% Optimal</span>
            </div>
          </div>
          <button className="st-action-btn primary">
            <RefreshCw size={18} />
            Sync Nodes
          </button>
        </div>
      </header>

      <div className="st-overview-grid">
        <div className="st-overview-card main">
          <div className="st-card-header">
            <Database size={24} className="text-blue-500" />
            <h3>Global Capacity</h3>
          </div>
          <div className="st-capacity-visual">
            <div className="st-capacity-bar">
              <div className="st-capacity-fill" style={{ width: '64%' }}>
                <div className="st-capacity-glow" />
              </div>
            </div>
            <div className="st-capacity-stats">
              <div className="st-cap-stat">
                <span className="label">Used Space</span>
                <span className="value">64.1 TB</span>
              </div>
              <div className="st-cap-stat text-right">
                <span className="label">Total Available</span>
                <span className="value">164.4 TB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="st-overview-card mini">
          <Cpu size={20} className="text-purple-500" />
          <span className="label">Active Nodes</span>
          <span className="value">124</span>
        </div>
        <div className="st-overview-card mini">
          <Zap size={20} className="text-amber-500" />
          <span className="label">I/O Throughput</span>
          <span className="value">12.4 GB/s</span>
        </div>
      </div>

      <div className="st-nodes-section">
        <div className="st-section-header">
          <div className="st-section-title">
            <Server size={20} className="text-blue-500" />
            <h3>Node Registry</h3>
          </div>
          <div className="st-section-actions">
            <div className="st-search">
              <Search size={16} />
              <input type="text" placeholder="Search nodes..." />
            </div>
            <button className="st-filter-btn"><Filter size={16} /></button>
          </div>
        </div>

        <div className="st-nodes-grid">
          {nodes.map((node, i) => (
            <motion.div 
              key={node.id} 
              className="st-node-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="st-node-header">
                <div className={`st-node-icon ${node.color}`}>
                  <HardDrive size={20} />
                </div>
                <div className={`st-node-status ${node.status.toLowerCase()}`}>
                  {node.status}
                </div>
              </div>
              <div className="st-node-info">
                <h4 className="st-node-name">{node.name}</h4>
                <span className="st-node-type">{node.type}</span>
              </div>
              <div className="st-node-usage">
                <div className="st-usage-header">
                  <span>{node.used} / {node.capacity}</span>
                  <span>{Math.round((parseFloat(node.used) / parseFloat(node.capacity)) * 100)}%</span>
                </div>
                <div className="st-usage-bar">
                  <div 
                    className={`st-usage-fill ${node.color}`} 
                    style={{ width: `${(parseFloat(node.used) / parseFloat(node.capacity)) * 100}%` }} 
                  />
                </div>
              </div>
              <div className="st-node-footer">
                <div className="st-health-indicator">
                  <Activity size={12} />
                  <span>Health: {node.health}%</span>
                </div>
                <button className="st-node-action"><Shield size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoragePage;
