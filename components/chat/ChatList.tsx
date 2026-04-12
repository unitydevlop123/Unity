import React from 'react';
import { Pin, VolumeX, Check, CheckCheck, Verified } from 'lucide-react';

const chats = [
  {
    id: 1,
    name: 'Unity',
    avatar: 'https://csspicker.dev/api/image/?q=young+man&image_type=photo',
    message: '4017694450638971|10|2030|258\n4017694450263333|10|2030|2...',
    time: 'Thu',
    pinned: true,
    read: true,
  },
  {
    id: 2,
    name: 'ثغرات نت مجاني مصر',
    avatar: 'https://csspicker.dev/api/image/?q=wifi+logo&image_type=photo',
    message: '❤️ هل من مصلى على النبى محمد اليوم\nhttps://t.me/wifiegypt https://t....',
    time: '1:55 AM',
    muted: true,
    unread: 5,
  },
  {
    id: 3,
    name: 'eSIM FREE',
    avatar: 'https://csspicker.dev/api/image/?q=chip+tech&image_type=photo',
    message: 'Kingdom ⚡\nHonest sale 💯 🤝 Spotify 1-m...',
    time: '9:40 AM',
    muted: true,
    unread: 166,
  },
  {
    id: 4,
    name: 'TronLink Official Gr...',
    avatar: 'https://csspicker.dev/api/image/?q=blue+logo&image_type=photo',
    message: 'TronLink GUARDIAN\n😡😡😡😡 Beware of scamm...',
    time: '9:40 AM',
    verified: true,
    muted: true,
    unread: 477,
  },
  {
    id: 5,
    name: 'Esim free chat',
    avatar: 'https://csspicker.dev/api/image/?q=esim+logo&image_type=photo',
    message: '.\nحد من اسكندريه',
    time: '9:40 AM',
    muted: true,
    unread: 19,
  },
  {
    id: 6,
    name: 'شراء وتبادل شرائح ...',
    avatar: 'https://csspicker.dev/api/image/?q=sim+card&image_type=photo',
    message: '\'🦕',
    time: '9:39 AM',
    muted: true,
    unread: 181,
  },
  {
    id: 7,
    name: '不吃香菜UDD',
    avatar: 'https://csspicker.dev/api/image/?q=asian+logo&image_type=photo',
    message: 'GIF',
    time: '9:39 AM',
    unread: 7500,
  },
];

const formatUnread = (count: number) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(count >= 10000 ? 0 : 1) + 'K';
  }
  return count.toString();
};

interface ChatListProps {
  onSelectChat?: (chat: { name: string; avatar: string }) => void;
}

export default function ChatList({ onSelectChat }: ChatListProps) {
  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div 
          key={chat.id} 
          className="chat-item"
          onClick={() => onSelectChat?.({ name: chat.name, avatar: chat.avatar })}
        >
          <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
          <div className="chat-content">
            <div className="chat-header">
              <div className="chat-name-row">
                <span className="chat-name">{chat.name}</span>
                {chat.verified && <Verified size={14} className="verified-icon" fill="#0088cc" color="#0088cc" />}
                {chat.muted && <VolumeX size={14} className="muted-icon" />}
              </div>
              <div className="chat-meta">
                {chat.read && <CheckCheck size={16} className="read-icon" />}
                <span className="chat-time">{chat.time}</span>
              </div>
            </div>
            <div className="chat-footer">
              <p className="chat-message">{chat.message}</p>
              <div className="chat-actions">
                {chat.pinned && <Pin size={14} className="pinned-icon" />}
                {!!chat.unread && chat.unread > 0 && (
                  <span className={`unread-badge ${chat.muted ? 'muted' : ''}`}>
                    {formatUnread(chat.unread)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <style>{`
            .chat-list {
              width: 100%;
              display: flex;
              flex-direction: column;
            }

            .chat-item {
              display: flex;
              align-items: flex-start;
              padding: 8px 12px;
              gap: 12px;
              background: transparent;
              position: relative;
              width: 100%;
              box-sizing: border-box;
              overflow: hidden;
            }
            
            .chat-item::after {
              content: '';
              position: absolute;
              bottom: 0;
              right: 0;
              width: calc(100% - 80px);
              height: 0.5px;
              background: rgba(255, 255, 255, 0.08);
            }
            
            .chat-item:last-child::after {
              display: none;
            }
            
            .chat-avatar {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              object-fit: cover;
              flex-shrink: 0;
            }
            
            .chat-content {
              flex: 1;
              min-width: 0;
              padding-top: 4px;
              overflow: hidden;
            }
            
            .chat-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2px;
              width: 100%;
            }
            
            .chat-name-row {
              display: flex;
              align-items: center;
              gap: 4px;
              flex: 1;
              min-width: 0;
            }
            
            .chat-name {
              font-size: 16px;
              font-weight: 600;
              color: #fff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .verified-icon {
              color: #0088cc;
            }
            
            .muted-icon {
              color: #8e8e93;
            }
            
            .chat-meta {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            
            .read-icon {
              color: #0088cc;
            }
            
            .chat-time {
              font-size: 13px;
              color: #8e8e93;
            }
            
            .chat-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 8px;
              width: 100%;
            }
            
            .chat-message {
              font-size: 15px;
              color: #8e8e93;
              line-height: 1.35;
              white-space: pre-line;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            
            .chat-actions {
              display: flex;
              align-items: center;
              gap: 6px;
              flex-shrink: 0;
            }
            
            .pinned-icon {
              color: #8e8e93;
              transform: rotate(45deg);
            }
            
            .unread-badge {
              background: #0088cc;
              color: #fff;
              font-size: 12px;
              font-weight: 600;
              height: 20px;
              min-width: 20px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 6px;
              box-sizing: border-box;
              line-height: 1;
            }
            
            .unread-badge.muted {
              background: #8e8e93;
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
