import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

// Updated to make properties optional so Sidebar can be used without all props in Layout.tsx
export interface SidebarProps {
  conversations?: Conversation[];
  activeId?: string | null;
  onNewChat?: () => void;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

export interface ChatInterfaceProps {
  conversation: Conversation | null;
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
}

export interface HeaderProps {
  model: string;
  onModelChange: (model: string) => void;
}

// Added LayoutProps to fix the missing export error in Layout.tsx
export interface LayoutProps {
  children: React.ReactNode;
}