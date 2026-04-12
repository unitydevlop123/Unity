import { User, MessageCircle, Settings, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { user } = useAuth();
  
  // Get initials or first letter for fallback
  const getInitials = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="bottom-nav">
      <div className="nav-content">
        <button 
          className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} 
          onClick={() => onTabChange?.('contacts')}
        >
          <User size={28} strokeWidth={1.5} className={activeTab === 'contacts' ? 'active-icon' : ''} />
          <span className={`nav-label ${activeTab === 'contacts' ? 'active' : ''}`}>Contacts</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`} 
          onClick={() => onTabChange?.('inbox')}
        >
          <div className="chat-icon-wrapper">
            <MessageCircle size={28} strokeWidth={1.5} className={activeTab === 'inbox' ? 'active-icon' : ''} />
            <span className="badge">2.2K</span>
          </div>
          <span className={`nav-label ${activeTab === 'inbox' ? 'active' : ''}`}>Chats</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => onTabChange?.('settings')}
        >
          <div className={`settings-avatar-container ${activeTab === 'settings' ? 'active-avatar' : ''}`}>
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="avatar-fallback">{getInitials()}</div>
            )}
          </div>
          <span className={`nav-label ${activeTab === 'settings' ? 'active' : ''}`}>Settings</span>
        </button>
      </div>
      
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          width: 100%;
          z-index: 100;

          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          border-top: 1px solid rgba(255,255,255,0.08);
          
          /* Layout properties */
          left: 0;
          right: 0;
          margin: 0 auto;
          max-width: 430px;
          border-radius: 20px 20px 0 0;
          height: calc(65px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-around;
          transform: translate3d(0, 0, 0);
          will-change: backdrop-filter;
        }
        
        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex: 1;
          height: 100%;
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #8e8e93;
          cursor: pointer;
          height: 100%;
          flex: 1;
          transition: all 0.2s ease;
        }
        
        .nav-item.active {
          color: #00c853;
        }
        
        .active-icon {
          color: #00c853;
          fill: #00c853;
          filter: drop-shadow(0 0 8px rgba(0, 200, 83, 0.6));
        }
        
        .nav-label {
          font-size: 11px;
          font-weight: 500;
        }
        
        .nav-label.active {
          color: #00c853;
          text-shadow: 0 0 8px rgba(0, 200, 83, 0.4);
        }
        
        .chat-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .badge {
          position: absolute;
          top: -6px;
          right: -10px;
          background: #ff453a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
          border: 2px solid #000;
        }
        
        .settings-avatar-container {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          background: #2c2c2e;
        }
        
        .active-avatar {
          border-color: #00c853;
          box-shadow: 0 0 10px rgba(0, 200, 83, 0.5);
          transform: scale(1.1);
        }
        
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
