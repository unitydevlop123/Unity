import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutProps } from '../../types/index';
import './Layout.css';

interface ExtendedLayoutProps extends LayoutProps {
  t: any;
  onDeleteChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onStreamVideosClick?: () => void;
  onLiveChatClick?: () => void;
  onOpenChatV2?: () => void;
  isLoading?: boolean;
}

const Layout: React.FC<ExtendedLayoutProps> = ({ 
  children, 
  onNewChat,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteChat,
  onPinChat,
  onRenameChat,
  isChatActive = false,
  onToggleSidebar,
  onOpenSettings,
  onLoginClick,
  onSignupClick,
  onStreamVideosClick,
  onLiveChatClick,
  onOpenChatV2,
  isSidebarOpen = true,
  model,
  onModelChange,
  isLoading = false,
  t
}) => {
  return (
    <div className={`app-container ${!isSidebarOpen ? 'sidebar-hidden' : 'sidebar-open'}`}>
      {/* Mobile Backdrop to close sidebar */}
      <div className="sidebar-backdrop" onClick={onToggleSidebar} />
      
      <Sidebar 
        conversations={conversations} 
        activeId={activeId} 
        onNewChat={onNewChat} 
        onSelectConversation={onSelectConversation}
        onDeleteChat={onDeleteChat}
        onPinChat={onPinChat}
        onRenameChat={onRenameChat}
        isOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={onOpenSettings}
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onStreamVideosClick={onStreamVideosClick}
        onLiveChatClick={onLiveChatClick}
        onOpenChatV2={onOpenChatV2}
        isLoading={isLoading}
        t={t}
      />
      <div className="main-wrapper">
        <Header 
          isChatActive={isChatActive}
          onNewChat={onNewChat}
          onToggleSidebar={onToggleSidebar}
          onOpenSettings={onOpenSettings}
          model={model}
          onModelChange={onModelChange}
          t={t}
        />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;