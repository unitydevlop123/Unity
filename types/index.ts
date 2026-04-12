import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rawContent?: string;
  timestamp: Date;
  type?: 'text' | 'image';
  prompt?: string;
  edited?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  pinned?: boolean;
}

export interface LayoutProps {
  children: React.ReactNode;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  isSidebarOpen?: boolean;
  conversations?: Conversation[];
  activeId?: string | null;
  onSelectConversation?: (id: string) => void;
  isChatActive?: boolean;
  onVideosClick?: () => void;
}

export interface SidebarProps {
  conversations?: Conversation[];
  activeId?: string | null;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onOpenSettings?: () => void;
  isOpen?: boolean;
  onToggleSidebar?: () => void;
  onPinChat?: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onVideosClick?: () => void;
}

export interface HeaderProps {
  isChatActive: boolean;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
}