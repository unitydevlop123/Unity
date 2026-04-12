export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of user emails/ids
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  allowChange: boolean;
  creatorId: string;
}

export interface LiveMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  isAI?: boolean;
  replyTo?: string; // ID of the message being replied to
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  deletedFor?: string[]; // array of userIds who deleted it for themselves
  isDeleted?: boolean; // true if deleted for everyone
  poll?: PollData;
}

export const parseCommand = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.startsWith('/poll')) {
    return { type: 'poll', args: trimmed.replace('/poll', '').trim() };
  }
  return null;
};
