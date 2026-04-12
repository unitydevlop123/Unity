import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  HelpCircle, 
  Clock, 
  Heart, 
  ChevronRight, 
  Edit2, 
  Activity,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  PlusCircle,
  Sparkles,
  MapPin,
  Copy,
  Check,
  Power
} from 'lucide-react';
import { Video } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import { firebaseRest } from '../services/firebaseRest';
import { fetchSessionDetails } from '../src/utils/sessionUtils';
import EditProfileModal from '../components/user/EditProfileModal';
import AppSettingsModal from '../components/user/AppSettingsModal';
import ActivityLogModal from '../components/user/ActivityLogModal';
import FeedbackModal from '../components/user/FeedbackModal';
import SettingsMenu from './settings-menu/SettingsMenu';
import './UserPage.css';

interface UserPageProps {
  onBack: () => void;
  onVideoSelect: (video: Video) => void;
  onSettingsUpdate: (settings: any) => void;
  onNavigateToSettings: () => void;
  settings: any;
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const UserPage: React.FC<UserPageProps> = ({ onBack, onVideoSelect, onSettingsUpdate, onNavigateToSettings, settings, showNotification }) => {
  const { user, logout, updateUser } = useAuth();
  const [recentlyWatched, setRecentlyWatched] = useState<Video[]>([]);
  const [bingeList, setBingeList] = useState<Video[]>([]);
  const [squadCount, setSquadCount] = useState<number>(0);
  
  // Initialize from cache on mount
  useEffect(() => {
    if (user?.email) {
      try {
        const historyCached = localStorage.getItem(`unitydev_history_${user.email}`);
        const bingeCached = localStorage.getItem(`unitydev_binge_${user.email}`);
        const squadCached = localStorage.getItem(`unitydev_squad_${user.email}`);
        if (historyCached) setRecentlyWatched(JSON.parse(historyCached));
        if (bingeCached) setBingeList(JSON.parse(bingeCached));
        if (squadCached) setSquadCount(parseInt(squadCached, 10) || 0);
      } catch (e) {
        console.error("Failed to load cached user data:", e);
      }
    } else {
      // Clear state if no user
      setRecentlyWatched([]);
      setBingeList([]);
      setSquadCount(0);
    }
  }, [user?.email]);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'edit' | 'settings' | 'activity' | 'feedback' | null>(null);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUsername = () => {
    const username = user?.username || user?.name?.toLowerCase().replace(/\s+/g, '') || 'user';
    navigator.clipboard.writeText(`@${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const [history, binge, squad] = await Promise.all([
        firebaseRest.getRecentlyWatched(user.email),
        firebaseRest.getBingeList(user.email),
        firebaseRest.getSquadCount(user.email)
      ]);
      setRecentlyWatched(history as Video[]);
      setBingeList(binge as Video[]);
      setSquadCount(squad as number);
      
      // Update cache
      localStorage.setItem(`unitydev_history_${user.email}`, JSON.stringify(history));
      localStorage.setItem(`unitydev_binge_${user.email}`, JSON.stringify(binge));
      localStorage.setItem(`unitydev_squad_${user.email}`, squad.toString());
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Fetch location immediately when entering User Page for faster updates
  useEffect(() => {
    if (user) {
      const fetchLocation = async () => {
        try {
          const details = await fetchSessionDetails();
          if (details.location && details.location !== 'Unknown' && details.location !== 'Unable to detect location') {
            const newLocation = `${details.location} ${details.flag_emoji || ''}`.trim();
            
            // Check for unusual activity (location change)
            if (user.location && 
                user.location !== 'Unknown' && 
                user.location !== 'Unable to detect location' && 
                user.location !== newLocation) {
              const msg = `New location change from ${user.location}. Was this you?`;
              if (showNotification) {
                showNotification(`Unusual Activity: ${msg}`, 'error');
              }
            }

            if (user.location !== newLocation) {
              updateUser({ location: newLocation });
            }
          }
        } catch (err) {
          console.error("Failed to fetch location on User Page:", err);
        }
      };
      fetchLocation();
    }
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      onBack();
    }
  };

  const handleSettingsOptionSelect = (option: 'edit' | 'settings' | 'activity' | 'feedback' | 'logout') => {
    if (option === 'logout') {
      handleLogout();
    } else {
      setActiveModal(option);
      // We keep showSettingsPage true so the modal opens on top of it, 
      // or we could close it. Let's keep it open to return to settings after closing modal?
      // Actually, modals usually overlay everything. 
      // If we want to mimic a navigation stack, we might want to keep SettingsMenu visible.
      // But the modals in this app seem to be full screen or large overlays.
      // Let's keep SettingsMenu open.
    }
  };

  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [scrollTransform, setScrollTransform] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Tuck-away logic
    if (scrollTop > lastScrollTop && scrollTop > 50) {
      setIsHeaderVisible(false);
    } else if (scrollTop < lastScrollTop) {
      setIsHeaderVisible(true);
    }
    setLastScrollTop(scrollTop);

    // Existing fade/shrink logic
    const opacity = Math.max(0, 1 - scrollTop / 150);
    const transform = Math.min(20, (scrollTop / 150) * 20);
    setScrollOpacity(opacity);
    setScrollTransform(transform);
  };

  if (!user) {
    return (
      <div className="user-page-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please log in to view your profile</p>
          <button className="pill-btn primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page-container">
      {showSettingsPage && (
        <SettingsMenu 
          onBack={() => setShowSettingsPage(false)} 
          onOptionSelect={handleSettingsOptionSelect}
          userEmail={user.email || ''}
          settings={settings}
          onUpdateSettings={onSettingsUpdate}
          theme={settings?.theme || 'green'}
          showNotification={showNotification}
        />
      )}

      {/* Top Header with Back Button - Hide when Settings Menu is open */}
      {!showSettingsPage && (
        <div className={`user-page-header ${isHeaderVisible ? '' : 'hidden'}`}>
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-actions">
            <Settings 
              size={22} 
              className="header-icon" 
              onClick={() => setShowSettingsPage(true)} 
            />
          </div>
        </div>
      )}

      <div className="user-scroll-content" onScroll={handleScroll}>
        {/* 1. Identity Zone */}
        <section className="identity-zone">
          <div className="profile-header" style={{ opacity: scrollOpacity, transform: `translateY(-${scrollTransform}px)` }}>
            <div className={`avatar-wrapper ${squadCount >= 100 ? 'squad-leader-glow' : ''}`} onClick={() => setActiveModal('edit')}>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10a37f&color=fff`} 
                alt="User Avatar" 
                className="profile-avatar" 
              />
              <div className="elite-badge">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div className="profile-info">
              <h1 className="username">{user.name || 'UnityDev Elite'}</h1>
              <div className="user-username">
                <span>@{user.username || user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} onClick={handleCopyUsername} />}
              </div>
              <p className="user-handle">{user.email} • Elite Member</p>
              
              {(user.bio || user.location) && (
                <div className="user-bio-section">
                  {user.bio && <p className="user-bio">{user.bio}</p>}
                  {user.location && (
                    <div className="user-location">
                      <MapPin size={14} />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="user-stats-grid">
                <span className="stat-item top-row border-right">{bingeList.length} Saved</span>
                <span className="stat-item top-row border-right">{recentlyWatched.length} Watched</span>
                <span className="stat-item top-row premium">Premium</span>
                
                <div className="stat-btn">
                  {squadCount} Squad
                </div>
                <div className="stat-btn message-btn">
                  Message
                  <span className="unread-badge"></span>
                </div>
                <div className="stat-btn">
                  {squadCount} Member
                </div>
              </div>
              <div className="action-row">
                <button className="pill-btn secondary" onClick={() => setActiveModal('edit')}>
                  <Edit2 size={16} />
                  <span>Edit Profile</span>
                </button>
                <button className="pill-btn secondary" onClick={() => setActiveModal('activity')}>
                  <Activity size={16} />
                  <span>Activity</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Content Library */}
        <section className="content-library">
          {/* Recently Watched */}
          <div className="library-section">
            <div className="section-header">
              <div className="header-left">
                <Clock size={20} className="section-icon red-icon" />
                <h2 className="section-title">Recently Watched</h2>
              </div>
              <button className="view-all-pill">View all</button>
            </div>
            {recentlyWatched.length > 0 ? (
              <div className="horizontal-scroll">
                {recentlyWatched.map(video => (
                  <div key={`history-${video.id}`} className="demo-video-card group relative" onClick={() => onVideoSelect(video)}>
                    <div className="demo-thumb-container">
                      <img src={video.thumbnail} alt={video.title} className="demo-thumb" referrerPolicy="no-referrer" />
                      <span className="demo-duration">{video.duration}</span>
                      
                      {/* Remove from Recently Watched Button */}
                      <button 
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (user) {
                            setRecentlyWatched(prev => prev.filter(v => v.id !== video.id));
                            firebaseRest.removeFromRecentlyWatched(user.email, video.id).catch(err => console.error(err));
                          }
                        }}
                        title="Remove from History"
                      >
                        <PlusCircle size={16} className="rotate-45" />
                      </button>
                    </div>
                    <div className="demo-info">
                      <h3 className="demo-title">{video.title}</h3>
                      <p className="demo-meta">{video.channel} • {video.views}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-library-state">
                <p>No recently watched videos yet.</p>
              </div>
            )}
          </div>

          {/* My Binge List */}
          <div className="library-section">
            <div className="section-header">
              <div className="header-left">
                <Heart size={20} className="section-icon red-icon" />
                <h2 className="section-title">My Binge List</h2>
              </div>
              <button className="view-all-pill">View all</button>
            </div>
            {bingeList.length > 0 ? (
              <div className="horizontal-scroll">
                {bingeList.map(video => (
                  <div key={`binge-${video.id}`} className="demo-video-card group relative" onClick={() => onVideoSelect(video)}>
                    <div className="demo-thumb-container">
                      <img src={video.thumbnail} alt={video.title} className="demo-thumb" referrerPolicy="no-referrer" />
                      <span className="demo-duration">{video.duration}</span>
                      
                      {/* Remove from Binge List Button */}
                      <button 
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (user) {
                            setBingeList(prev => prev.filter(v => v.id !== video.id));
                            firebaseRest.removeFromBingeList(user.email, video.id).catch(err => console.error(err));
                          }
                        }}
                        title="Remove from Binge List"
                      >
                        <PlusCircle size={16} className="rotate-45" />
                      </button>
                    </div>
                    <div className="demo-info">
                      <h3 className="demo-title">{video.title}</h3>
                      <p className="demo-meta">{video.channel} • {video.views}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-library-state">
                <p>Your Binge List is empty. Add some videos!</p>
              </div>
            )}
          </div>
        </section>

        {/* 3. Command Center */}
        <section className="command-center">
          <div className="menu-list">
            <div className="menu-item" onClick={() => setActiveModal('activity')}>
              <div className="menu-left">
                <MessageSquare size={20} className="menu-icon" />
                <span>Activity Log</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
            <div className="menu-item" onClick={() => setShowSettingsPage(true)}>
              <div className="menu-left">
                <Settings size={20} className="menu-icon" />
                <span>Settings Menu</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
            <div className="menu-item" onClick={() => setActiveModal('feedback')}>
              <div className="menu-left">
                <HelpCircle size={20} className="menu-icon" />
                <span>Help & Feedback</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
            <div className="menu-item" onClick={() => alert("Power button clicked")}>
              <div className="menu-left">
                <Power size={20} className="menu-icon text-amber-500" />
                <span>Power</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
            <div className="menu-item logout" onClick={handleLogout}>
              <div className="menu-left">
                <LogOut size={20} className="menu-icon text-red-500" />
                <span className="text-red-500">Log Out</span>
              </div>
            </div>
          </div>
        </section>

        <div className="footer-spacer"></div>
      </div>

      {/* Modals */}
      {activeModal === 'edit' && (
        <EditProfileModal 
          user={user} 
          onClose={() => setActiveModal(null)} 
          onUpdate={loadData} 
        />
      )}
      {activeModal === 'settings' && (
        <AppSettingsModal 
          user={user} 
          onClose={() => setActiveModal(null)} 
          onUpdate={onSettingsUpdate} 
          onOpenActivityLog={() => setActiveModal('activity')}
          onOpenFeedback={() => setActiveModal('feedback')}
        />
      )}
      {activeModal === 'activity' && (
        <ActivityLogModal 
          user={user} 
          onClose={() => setActiveModal(null)} 
        />
      )}
      {activeModal === 'feedback' && (
        <FeedbackModal 
          user={user} 
          onClose={() => setActiveModal(null)} 
        />
      )}
    </div>
  );
};

export default UserPage;
