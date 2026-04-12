
import React, { useState, useMemo } from 'react';
import { SidebarProps } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface ExtendedSidebarProps extends SidebarProps {
  t: any;
  onDeleteChat?: (id: string) => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onStreamVideosClick?: () => void;
  onLiveChatClick?: () => void;
  onOpenChatV2?: () => void;
  isLoading?: boolean;
}

const Sidebar: React.FC<ExtendedSidebarProps> = ({ 
  conversations = [],
  activeId = null,
  onNewChat = () => {},
  onSelectConversation = (id: string) => {},
  onDeleteChat = (id: string) => {},
  onToggleSidebar = () => {},
  onOpenSettings = () => {},
  onPinChat = () => {},
  onRenameChat = () => {},
  onLoginClick = () => {},
  onSignupClick = () => {},
  onStreamVideosClick = () => {},
  onLiveChatClick = () => {},
  onOpenChatV2 = () => {},
  isLoading = false,
  isOpen = true,
  t
}) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = useMemo(() => {
    let list = [...conversations];
    
    // Filter by search
    if (searchTerm.trim()) {
      list = list.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Sort: Pinned first, then by timestamp
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [conversations, searchTerm]);

  const displayList = filteredConversations.slice(0, visibleCount);
  const hasMore = filteredConversations.length > visibleCount;

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-icon-btn" onClick={onToggleSidebar} title="Close Sidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          <span className="ml-2 text-sm font-medium hidden sm:inline">Close</span>
        </button>
        <button className="sidebar-new-chat-btn" onClick={onNewChat} title={t.newChat}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="ml-2 text-sm font-medium">New Chat</span>
        </button>
      </div>

      <div className="sidebar-search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="sidebar-scroll-area">
        <div className="sidebar-section">
          <h3 className="section-title">{t.history}</h3>
          {isLoading ? (
            <div className="skeleton-container">
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          ) : displayList.length === 0 ? (
            <div className="empty-history">{searchTerm ? "No chats found" : t.noHistory}</div>
          ) : (
            <>
              {displayList.map((item) => (
                <div 
                  key={item.id}
                  className={`sidebar-item group ${activeId === item.id ? 'active' : ''} ${item.pinned ? 'pinned' : ''}`}
                  onClick={() => onSelectConversation(item.id)}
                  style={{ touchAction: 'manipulation' }}
                >
                  {editingId === item.id ? (
                    <form className="rename-form" onSubmit={(e) => handleRenameSubmit(e, item.id)}>
                      <input 
                        autoFocus
                        className="rename-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={(e) => handleRenameSubmit(e as any, item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </form>
                  ) : (
                    <>
                      <span className="item-text">
                        {item.pinned && (
                          <svg className="pin-indicator" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C10.34 2 9 3.34 9 5V11L7 14V16H11V21L12 22L13 21V16H17V14L15 11V5C15 3.34 13.66 2 12 2Z"></path>
                          </svg>
                        )}
                        {item.title}
                      </span>
                      <div className="item-actions opacity-0 group-hover:opacity-100">
                        <button 
                          className="action-btn" 
                          title={item.pinned ? "Unpin" : "Pin"}
                          onClick={(e) => { e.stopPropagation(); onPinChat(item.id); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={item.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2C10.34 2 9 3.34 9 5V11L7 14V16H11V21L12 22L13 21V16H17V14L15 11V5C15 3.34 13.66 2 12 2Z"></path>
                          </svg>
                        </button>
                        <button 
                          className="action-btn" 
                          title="Rename"
                          onClick={(e) => handleStartRename(e, item.id, item.title)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); onDeleteChat(item.id); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {hasMore && (
                <button className="load-more-btn" onClick={() => setVisibleCount(prev => prev + 20)}>
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="footer-action-item" onClick={onOpenChatV2}>
          <div className="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 9h8"></path>
              <path d="M8 13h6"></path>
            </svg>
          </div>
          <span className="footer-text">2nd AI Chat</span>
        </div>

        <div className="footer-action-item video-placeholder" onClick={onStreamVideosClick}>
          <div className="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <span className="footer-text">Stream Movie</span>
        </div>

        {!user ? (
          <>
            <div className="footer-action-item" onClick={onLoginClick}>
              <div className="footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </div>
              <span className="footer-text">{t.login}</span>
            </div>
            
            <div className="footer-action-item" onClick={onSignupClick}>
              <div className="footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <span className="footer-text">{t.signup}</span>
            </div>
          </>
        ) : null}

        <div className="footer-action-item" onClick={onLiveChatClick}>
          <div className="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span className="footer-text">Live Chat Room</span>
        </div>

        <div className="footer-action-item" onClick={onOpenSettings}>
          <div className="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <span className="footer-text">{t.settings}</span>
        </div>

        <div className="upgrade-pill" onClick={() => {
          const notification = document.createElement('div');
          notification.className = 'custom-upgrade-notification';
          notification.innerHTML = `
            <div class="notification-content">
              <h3>UnityDev Pro Coming Soon!</h3>
              <p>We are working on putting plan functionality upgrade for users who doesn't want restrictions.</p>
              <button onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
          `;
          document.body.appendChild(notification);
          
          // Auto remove after 5 seconds
          setTimeout(() => {
            if (document.body.contains(notification)) {
              notification.remove();
            }
          }, 5000);
        }}>
          <div className="star-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="upgrade-text">
            <b>Free Plan</b>
            <span>Get UnityDev Pro</span>
          </div>
        </div>
        
        <div className="user-profile">
          <div className="avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <span className="user-name">{user ? (user.name || user.username || user.email.split('@')[0]) : 'Guest'}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
