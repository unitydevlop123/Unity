import React, { useState } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, 
  DollarSign, CreditCard, ArrowUpRight, 
  ArrowDownRight, Activity, PieChart,
  ArrowRight, Download, Filter, Search,
  MoreVertical, Eye, X, RefreshCw,
  Globe, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import './FinancePage.css';

interface FinancePageProps {
  isCompact: boolean;
}

const FinancePage: React.FC<FinancePageProps> = ({ isCompact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<any | null>(null);

  const transactions = [
    { id: 'TX-9942', user: 'Neo_Matrix', type: 'Deposit', amount: '+ $12,400.00', status: 'Confirmed', date: '2024-03-28 14:32:00', color: 'emerald', network: 'Neural Net V9', fee: '$12.00' },
    { id: 'TX-9941', user: 'Ghost_Core', type: 'Withdrawal', amount: '- $2,150.00', status: 'Pending', date: '2024-03-27 09:15:22', color: 'amber', network: 'Legacy Bank', fee: '$5.00' },
    { id: 'TX-9940', user: 'Unity_Node', type: 'Deposit', amount: '+ $5,000.00', status: 'Confirmed', date: '2024-03-26 18:45:10', color: 'emerald', network: 'Neural Net V9', fee: '$0.00' },
    { id: 'TX-9939', user: 'Void_Walker', type: 'Withdrawal', amount: '- $840.00', status: 'Failed', date: '2024-03-25 11:20:05', color: 'red', network: 'Crypto Bridge', fee: '$2.50' },
    { id: 'TX-9938', user: 'Cipher_Punk', type: 'Deposit', amount: '+ $3,200.00', status: 'Confirmed', date: '2024-03-25 08:10:00', color: 'emerald', network: 'Neural Net V9', fee: '$3.20' },
    { id: 'TX-9937', user: 'Data_Wraith', type: 'Withdrawal', amount: '- $15,000.00', status: 'Confirmed', date: '2024-03-24 16:55:30', color: 'emerald', network: 'Offshore Node', fee: '$45.00' },
  ];

  const filteredTx = transactions.filter(tx => 
    tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Liquidity', value: '$4,284,902', icon: Wallet, color: 'emerald', trend: '+12.5%' },
    { label: 'Daily Volume', value: '$142,400', icon: Activity, color: 'blue', trend: '+5.2%' },
    { label: 'Active Wallets', value: '12,240', icon: CreditCard, color: 'purple', trend: '+24.1%' },
    { label: 'Revenue Share', value: '84.2%', icon: PieChart, color: 'amber', trend: 'STABLE' }
  ];

  return (
    <div className={`finance-container ${isCompact ? 'compact' : ''}`}>
      <div className="fi-content-wrapper">
        <header className="finance-header">
          <div className="title-section">
            <h1>Financial System</h1>
            <p>Monitor global capital flow and neural liquidity</p>
          </div>
          <div className="action-buttons">
            <button className="export-btn">
              <Download size={14} />
              EXPORT
            </button>
            <button className="inject-btn">
              <TrendingUp size={14} />
              INJECT
            </button>
          </div>
        </header>

        <div className="fi-stats-grid">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label} 
              className="fi-stat-card finance-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="fi-stat-icon-box">
                <stat.icon size={20} />
              </div>
              <div className="fi-stat-info">
                <span className="fi-stat-label">{stat.label}</span>
                <div className="fi-stat-value-row">
                  <h2 className="fi-stat-value">{stat.value}</h2>
                  <span className={`fi-stat-trend ${stat.trend.startsWith('+') ? 'up' : 'stable'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
              <div className="fi-stat-progress">
                <div className="fi-progress-bg" />
                <motion.div 
                  className="fi-progress-fill" 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="fi-controls">
          <div className="fi-search-box">
            <Search size={16} className="text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by TX ID or User..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="fi-filters-scroll">
            <div className="fi-filters">
              <button className="fi-filter-btn">
                <Filter size={14} />
                Filters
              </button>
              <div className="fi-divider" />
              <div className="fi-stats">
                <span className="fi-stat-item"><CreditCard size={14} /> {transactions.length} Total</span>
                <span className="fi-stat-item"><TrendingUp size={14} /> {transactions.filter(t => t.type === 'Deposit').length} Deposits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fi-main-layout">
          <div className="fi-ledger-container">
            <div className="fi-ledger-grid">
              {filteredTx.length === 0 ? (
                <div className="fi-empty-state">
                  <Search size={32} className="text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">No transactions found matching your search.</p>
                </div>
              ) : (
                filteredTx.map((tx, i) => (
                  <motion.div 
                    key={tx.id} 
                    className="fi-tx-card finance-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    style={{ zIndex: activeMenu === tx.id ? 50 : 1, position: 'relative' }}
                  >
                    <div className="fi-tx-card-header">
                      <div className="fi-tx-user-cell">
                        <div className={`fi-tx-avatar ${tx.type.toLowerCase()}`}>
                          {tx.type === 'Deposit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div className="fi-tx-user-info">
                          <span className="fi-tx-user-name">{tx.user}</span>
                          <span className="fi-tx-id">{tx.id}</span>
                        </div>
                      </div>
                      
                      <div className="fi-tx-card-actions">
                        <button 
                          className="fi-action-btn-small"
                          onClick={() => setActiveMenu(activeMenu === tx.id ? null : tx.id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenu === tx.id && (
                            <motion.div 
                              className="fi-dropdown-menu"
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            >
                              <div className="fi-dropdown-header">TX ACTIONS</div>
                              <button onClick={() => { setViewingTx(tx); setActiveMenu(null); }}>
                                <Eye size={14} /> View Details
                              </button>
                              <button onClick={() => { setActiveMenu(null); }}>
                                <RefreshCw size={14} /> Retry Transaction
                              </button>
                              <button onClick={() => { setActiveMenu(null); }}>
                                <Download size={14} /> Download Receipt
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="fi-tx-card-body">
                      <div className="fi-tx-amount-row">
                        <span className={`fi-tx-amount-large ${tx.color}`}>{tx.amount}</span>
                        <div className={`fi-tx-status-badge ${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </div>
                      </div>
                      
                      <div className="fi-tx-card-details">
                        <div className="fi-tx-detail-pill">
                          <Globe size={12} />
                          <span>{tx.network}</span>
                        </div>
                        <div className="fi-tx-detail-pill">
                          <Activity size={12} />
                          <span>Fee: {tx.fee}</span>
                        </div>
                        <div className="fi-tx-detail-pill">
                          <Calendar size={12} />
                          <span>{tx.date.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="fi-side-panel">
            <div className="fi-distribution-card">
              <div className="fi-side-header">
                <PieChart size={18} className="text-blue-500" />
                <h3>Asset Distribution</h3>
              </div>
              
              <div className="fi-dist-visual-container">
                <div className="fi-dist-ring-large" />
                <div className="fi-dist-center-info">
                  <span className="fi-dist-percent">100%</span>
                  <span className="fi-dist-sub">Allocated</span>
                </div>
              </div>

              <div className="fi-dist-legend-list">
                {[
                  { label: 'Neural Nodes', value: '45%', color: 'emerald' },
                  { label: 'Data Storage', value: '30%', color: 'blue' },
                  { label: 'Compute Power', value: '25%', color: 'purple' }
                ].map((item) => (
                  <div key={item.label} className="fi-legend-row">
                    <div className={`fi-legend-marker ${item.color}`} />
                    <span className="fi-legend-name">{item.label}</span>
                    <span className="fi-legend-val">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fi-activity-card mt-4">
              <div className="fi-side-header">
                <Activity size={18} className="text-purple-500" />
                <h3>Market Pulse</h3>
              </div>
              <div className="fi-pulse-list">
                {[
                  { label: 'BTC/USD', value: '$68,402.12', change: '+2.4%' },
                  { label: 'ETH/USD', value: '$3,842.50', change: '+1.8%' },
                  { label: 'SOL/USD', value: '$184.22', change: '-0.5%' }
                ].map((m) => (
                  <div key={m.label} className="fi-pulse-item">
                    <span className="fi-pulse-label">{m.label}</span>
                    <div className="fi-pulse-values">
                      <span className="fi-pulse-val">{m.value}</span>
                      <span className={`fi-pulse-change ${m.change.startsWith('+') ? 'up' : 'down'}`}>{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {viewingTx && (
          <motion.div className="fi-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="fi-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="fi-modal-header">
                <h2>Transaction Details</h2>
                <button onClick={() => setViewingTx(null)}><X size={20} /></button>
              </div>
              <div className="fi-modal-body">
                <div className="fi-tx-large-amount">
                  <span className={`amount ${viewingTx.color}`}>{viewingTx.amount}</span>
                  <span className={`status ${viewingTx.status.toLowerCase()}`}>{viewingTx.status}</span>
                </div>
                
                <div className="fi-modal-section">
                  <h4>Information</h4>
                  <div className="fi-details-grid">
                    <div className="fi-detail-item">
                      <span className="label">Transaction ID</span>
                      <span className="value font-mono text-xs">{viewingTx.id}</span>
                    </div>
                    <div className="fi-detail-item">
                      <span className="label">User</span>
                      <span className="value">{viewingTx.user}</span>
                    </div>
                    <div className="fi-detail-item">
                      <span className="label">Date & Time</span>
                      <span className="value">{viewingTx.date}</span>
                    </div>
                    <div className="fi-detail-item">
                      <span className="label">Type</span>
                      <span className="value">{viewingTx.type}</span>
                    </div>
                    <div className="fi-detail-item">
                      <span className="label">Network</span>
                      <span className="value">{viewingTx.network}</span>
                    </div>
                    <div className="fi-detail-item">
                      <span className="label">Network Fee</span>
                      <span className="value">{viewingTx.fee}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="fi-modal-footer">
                <button className="fi-btn-cancel" onClick={() => setViewingTx(null)}>Close</button>
                <button className="fi-btn-save">Download Receipt</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancePage;
