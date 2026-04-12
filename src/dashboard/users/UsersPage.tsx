import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, 
  MoreVertical, Shield, ShieldAlert, ShieldCheck,
  Mail, Calendar, Activity, Trash2, Ban, CheckCircle,
  Eye, Edit2, Unlock, Info, LogOut, Globe, Clock, List, X,
  Key, Smartphone, CreditCard, RefreshCw, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dashboardService, UserProfile } from '../services/dashboardService';
import { banUser, verifyUser, deleteUser } from '../actions/userActions';
import './UsersPage.css';

interface UsersPageProps {
  isCompact: boolean;
}

const UsersPage: React.FC<UsersPageProps> = ({ isCompact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Modal States
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [banDetailsUser, setBanDetailsUser] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await dashboardService.fetchUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBanToggle = async (user: UserProfile) => {
    // For demo purposes, we will toggle locally to show immediate UI feedback
    const updatedUsers = users.map(u => {
      if (u.user_email === user.user_email) {
        return { 
          ...u, 
          is_banned: !u.is_banned, 
          status: !u.is_banned ? 'Banned' : 'Active',
          ban_reason: !u.is_banned ? 'Manual ban by admin' : undefined
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    setActiveMenu(null);
    showToast(`User ${user.display_name} has been ${!user.is_banned ? 'banned' : 'unbanned'}.`);
    
    // In a real app, call the API
    // await banUser(user.user_email);
  };

  const handleLogoutUser = (user: UserProfile) => {
    setActiveMenu(null);
    showToast(`Session terminated for ${user.display_name}.`);
  };

  const handleResetPassword = (user: UserProfile) => {
    setActiveMenu(null);
    showToast(`Password reset link sent to ${user.user_email}.`);
  };

  const handleForceSync = (user: UserProfile) => {
    setActiveMenu(null);
    showToast(`Forced data sync initiated for ${user.display_name}.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updatedUsers = users.map(u => u.user_email === editingUser.user_email ? editingUser : u);
      setUsers(updatedUsers);
      setEditingUser(null);
      showToast(`User ${editingUser.display_name} updated successfully.`);
    }
  };

  const handleBan = async (email: string) => {
    const success = await banUser(email);
    if (success) loadUsers();
    setActiveMenu(null);
  };

  const handleVerify = async (email: string) => {
    const success = await verifyUser(email);
    if (success) loadUsers();
    setActiveMenu(null);
  };

  const handleDelete = async (email: string) => {
    if (window.confirm(`Are you sure you want to delete node ${email}?`)) {
      const success = await deleteUser(email);
      if (success) loadUsers();
    }
    setActiveMenu(null);
  };

  return (
    <div className={`us-page ${isCompact ? 'compact' : ''}`}>
      <div className="us-content-wrapper">
        <header className="us-header">
          <div className="us-title-group">
            <h1 className="us-title">User Management</h1>
            <p className="us-subtitle">Control and monitor system access nodes</p>
          </div>
          <button className="us-add-btn" onClick={loadUsers}>
            <Activity size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        <div className="us-controls">
          <div className="us-search-box">
            <Search size={16} className="text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by UID or Alias..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="us-filters-scroll">
            <div className="us-filters">
              <button className="us-filter-btn">
                <Filter size={14} />
                Filters
              </button>
              <div className="us-divider" />
              <div className="us-stats">
                <span className="us-stat-item"><Users size={14} /> {users.length} Total</span>
                <span className="us-stat-item"><Activity size={14} /> {users.filter(u => u.status === 'Active' && !u.is_banned).length} Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="us-user-list">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="us-empty-state">
              <Users size={32} className="text-zinc-600 mb-3" />
              <p className="text-zinc-400 text-sm">No users found matching your search.</p>
            </div>
          ) : (
            filteredUsers.map((user, i) => (
              <motion.div 
                key={user.user_email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="us-user-card"
                style={{ zIndex: activeMenu === user.user_email ? 50 : 1, position: 'relative' }}
              >
                <div className="us-card-header">
                  <div className="us-user-cell">
                    <div className="us-avatar">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="us-avatar-img" />
                      ) : (
                        user.display_name?.[0] || '?'
                      )}
                    </div>
                    <div className="us-user-info">
                      <span className="us-user-name">{user.display_name || 'Unknown'}</span>
                      <span className="us-user-email">{user.user_email}</span>
                    </div>
                  </div>
                  
                  <div className="us-card-actions">
                    <button 
                      className="us-action-btn"
                      onClick={() => setActiveMenu(activeMenu === user.user_email ? null : user.user_email)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    <AnimatePresence>
                      {activeMenu === user.user_email && (
                        <motion.div 
                          className="us-dropdown-menu"
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        >
                          <div className="us-dropdown-scroll-area">
                            <div className="us-dropdown-header">USER ACTIONS</div>
                            <button onClick={() => { setViewingUser(user); setActiveMenu(null); }}>
                              <Eye size={14} /> View User
                            </button>
                            <button onClick={() => { setEditingUser(user); setActiveMenu(null); }}>
                              <Edit2 size={14} /> Edit User
                            </button>
                            
                            <div className="h-px bg-white/10 my-1" />
                            
                            {user.is_banned ? (
                              <>
                                <button onClick={() => handleBanToggle(user)} className="text-emerald-400">
                                  <Unlock size={14} /> Unban User
                                </button>
                                <button onClick={() => { setBanDetailsUser(user); setActiveMenu(null); }} className="text-zinc-300">
                                  <Info size={14} /> Check Ban Details
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleBanToggle(user)} className="text-amber-400">
                                <Ban size={14} /> Ban User
                              </button>
                            )}
                            
                            <div className="h-px bg-white/10 my-1" />
                            
                            <button onClick={() => handleResetPassword(user)} className="text-blue-400">
                              <Key size={14} /> Reset Password
                            </button>
                            <button onClick={() => handleForceSync(user)} className="text-purple-400">
                              <RefreshCw size={14} /> Force Data Sync
                            </button>
                            <button onClick={() => handleLogoutUser(user)} className="text-orange-400">
                              <LogOut size={14} /> Logout User
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="us-card-body">
                  <div className="us-card-stats-grid">
                    <div className="us-stat-pill">
                      <Activity size={12} className="text-emerald-400" />
                      <span>{user.neural_link_id || 'NL-PENDING'}</span>
                    </div>
                    <div className="us-stat-pill">
                      <Globe size={12} className="text-blue-400" />
                      <span>{user.ip_location || 'Unknown'}</span>
                    </div>
                    <div className="us-stat-pill">
                      <Clock size={12} className="text-purple-400" />
                      <span>{user.watch_time || '0h 0m'}</span>
                    </div>
                    <div className="us-stat-pill">
                      <List size={12} className="text-amber-400" />
                      <span>{user.bing_list_count || 0} Bing List</span>
                    </div>
                  </div>

                  <div className="us-card-footer">
                    <div className={`us-role-badge ${(user.role || 'User').toLowerCase().replace(' ', '-')}`}>
                      {user.role === 'Super Admin' ? <ShieldAlert size={12} /> : user.role === 'Moderator' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {user.role || 'User'}
                    </div>
                    
                    <div className="us-status-indicator">
                      <span className={`us-status-dot ${user.is_banned ? 'banned' : (user.status || 'Active').toLowerCase()}`}>
                        {user.is_banned ? 'Banned' : (user.status || 'Active')}
                      </span>
                    </div>

                    <div className="us-date-cell">
                      <Calendar size={12} />
                      {user.last_active || 'Unknown'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modals & Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className="us-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toastMessage}
          </motion.div>
        )}

        {viewingUser && (
          <motion.div className="us-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="us-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="us-modal-header">
                <h2>User Details</h2>
                <button onClick={() => setViewingUser(null)}><X size={20} /></button>
              </div>
              <div className="us-modal-body us-modal-scrollable">
                <div className="us-modal-profile">
                  <div className="us-avatar large">
                    {viewingUser.avatar_url ? <img src={viewingUser.avatar_url} alt="Avatar" className="us-avatar-img" /> : viewingUser.display_name[0]}
                  </div>
                  <div className="us-modal-profile-info">
                    <h3>{viewingUser.display_name}</h3>
                    <p>{viewingUser.user_email}</p>
                    <span className="us-role-badge">{viewingUser.role}</span>
                  </div>
                </div>
                
                <div className="us-modal-section">
                  <h4>Security & Access</h4>
                  <div className="us-details-grid">
                    <div className="us-detail-item">
                      <span className="label"><Key size={12} /> Password Hash</span>
                      <span className="value font-mono text-xs">{viewingUser.password || '********'}</span>
                    </div>
                    <div className="us-detail-item">
                      <span className="label"><Shield size={12} /> Security Key (4-Digit)</span>
                      <span className="value font-mono text-xs">{viewingUser.security_key || '----'}</span>
                    </div>
                    <div className="us-detail-item">
                      <span className="label"><CreditCard size={12} /> Subscription Tier</span>
                      <span className="value">{viewingUser.subscription || 'Free'}</span>
                    </div>
                    <div className="us-detail-item">
                      <span className="label"><Smartphone size={12} /> Primary Device</span>
                      <span className="value">{viewingUser.device_info || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="us-modal-section">
                  <h4>Watch History ({viewingUser.watch_count || 0} total)</h4>
                  {viewingUser.watch_history && viewingUser.watch_history.length > 0 ? (
                    <ul className="us-history-list">
                      {viewingUser.watch_history.map((item, idx) => (
                        <li key={idx}>
                          <span className="title">{item.title}</span>
                          <span className="date">{item.watched_at}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="us-empty-text">No watch history available.</p>}
                </div>

                <div className="us-modal-section">
                  <h4>Bing List ({viewingUser.bing_list_count || 0} items)</h4>
                  {viewingUser.bing_list && viewingUser.bing_list.length > 0 ? (
                    <ul className="us-history-list">
                      {viewingUser.bing_list.map((item, idx) => (
                        <li key={idx}>
                          <span className="title">{item.title}</span>
                          <span className="date">{item.added_at}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="us-empty-text">Bing list is empty.</p>}
                </div>
              </div>
              <div className="us-modal-footer">
                <button className="us-btn-cancel" onClick={() => setViewingUser(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingUser && (
          <motion.div className="us-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="us-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="us-modal-header">
                <h2>Edit User</h2>
                <button onClick={() => setEditingUser(null)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="us-modal-form">
                <div className="us-modal-body us-modal-scrollable">
                  <div className="us-form-group">
                    <label>Display Name</label>
                    <input 
                      type="text" 
                      value={editingUser.display_name} 
                      onChange={e => setEditingUser({...editingUser, display_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="us-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={editingUser.user_email} 
                      onChange={e => setEditingUser({...editingUser, user_email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="us-form-group">
                    <label>Role</label>
                    <select 
                      value={editingUser.role} 
                      onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                    >
                      <option value="User">User</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="us-form-group">
                    <label>Subscription Tier</label>
                    <select 
                      value={editingUser.subscription || 'Free'} 
                      onChange={e => setEditingUser({...editingUser, subscription: e.target.value})}
                    >
                      <option value="Free">Free</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="us-form-group">
                    <label>Password (Leave blank to keep current)</label>
                    <input 
                      type="password" 
                      placeholder="********"
                      onChange={e => setEditingUser({...editingUser, password: e.target.value || editingUser.password})}
                    />
                  </div>
                  <div className="us-form-group">
                    <label>Security Key (4-Digit)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      pattern="\d{4}"
                      value={editingUser.security_key || ''} 
                      onChange={e => setEditingUser({...editingUser, security_key: e.target.value})}
                    />
                  </div>
                </div>
                <div className="us-modal-footer">
                  <button type="button" className="us-btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button type="submit" className="us-btn-save">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {banDetailsUser && (
          <motion.div className="us-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="us-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="us-modal-header">
                <h2>Ban Details</h2>
                <button onClick={() => setBanDetailsUser(null)}><X size={20} /></button>
              </div>
              <div className="us-modal-body">
                <div className="us-ban-alert">
                  <ShieldAlert size={32} className="text-red-500" />
                  <h3>Account Suspended</h3>
                  <p><strong>User:</strong> {banDetailsUser.display_name}</p>
                  <p><strong>Reason:</strong> {banDetailsUser.ban_reason || 'No specific reason provided.'}</p>
                </div>
              </div>
              <div className="us-modal-footer">
                <button className="us-btn-cancel" onClick={() => setBanDetailsUser(null)}>Close</button>
                <button className="us-btn-save" onClick={() => { handleBanToggle(banDetailsUser); setBanDetailsUser(null); }}>Unban User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
