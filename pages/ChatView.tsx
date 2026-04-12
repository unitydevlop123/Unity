import React from 'react';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';

interface ChatViewProps {
  chat?: {
    name: string;
    avatar: string;
  };
  onBack: () => void;
}

export default function ChatView({ chat, onBack }: ChatViewProps) {
  // Default data if none provided
  const chatData = chat || {
    name: 'Unity',
    avatar: 'https://csspicker.dev/api/image/?q=young+man&image_type=photo'
  };

  return (
    <div className="chat-view-container app">
      <ChatHeader 
        name={chatData.name} 
        avatar={chatData.avatar} 
        onBack={onBack} 
      />
      <div className="chat-scroll-area">
        <MessageList />
      </div>
      <MessageInput />
      <style>{`
        .chat-view-container {
          max-width: 430px;
          width: 100%;
          margin: 0 auto;
          height: 100vh;
          background: #000;
          color: #fff;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .chat-scroll-area {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          background: #000;
          padding-top: calc(60px + env(safe-area-inset-top));
          padding-bottom: calc(60px + env(safe-area-inset-bottom));
        }

        .chat-scroll-area::-webkit-scrollbar {
          display: none;
        }

        /* iOS-like background pattern if needed */
        .chat-scroll-area::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%);
          z-index: -1;
        }
      `}</style>
    </div>
  );
}
