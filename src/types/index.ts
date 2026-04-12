export type Mode = 'instant' | 'expert';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // for images
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughtSeconds?: number;
  thoughtContent?: string;   // actual reasoning text
  isStreaming?: boolean;     // true while AI is still responding
  streamingThought?: string; // live thought text during streaming
  timestamp: Date;
  attachments?: AttachedFile[];
}

export interface Chat {
  id: string;
  title: string;
  mode: Mode;
  messages: Message[];
  createdAt: Date;
  pinned?: boolean;
  remixedFrom?: string; // remix code ID this chat was imported from
}

export interface EmptyStateProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export interface ImagePreviewProps {
  messages: Message[];
  selectedIds: string[];
  allMessages: Message[];
  onClose: () => void;
}
