import React from 'react';
import { ChevronLeft, MoreVertical, Phone, Video } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  avatar: string;
  onBack: () => void;
}

export default function ChatHeader({ name, avatar, onBack }: ChatHeaderProps) {
  return (
    <div className="chat-header-container">
      <div className="left-section">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={28} color="#0088cc" />
          <span className="back-text">Back</span>
        </button>
        <div className="user-info">
          <img src={avatar} alt={name} className="header-avatar" />
          <div className="text-info">
            <span className="header-name">{name}</span>
            <span className="header-status">online</span>
          </div>
        </div>
      </div>
      <div className="right-section">
        <button className="header-icon-btn">
          <Phone size={20} />
        </button>
        <button className="header-icon-btn">
          <Video size={22} />
        </button>
        <button className="header-icon-btn">
          <MoreVertical size={20} />
        </button>
      </div>
      <style>{`
        .chat-header-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          margin: 0 auto;
          max-width: 430px;
          height: 60px;
          background: #212121; /* Default dark */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: none; /* Removed line for high-end look */
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          z-index: 100;
          padding-top: env(safe-area-inset-top);
          box-sizing: content-box;
        }

        :global(.light-theme) .chat-header-container {
          background: #ffffff;
        }

        :global(.theme-red) .chat-header-container {
          background: #b91c1c !important;
        }

        :global(.theme-gold) .chat-header-container {
          background: #b45309 !important;
        }

        :global(.theme-blue) .chat-header-container {
          background: #1d4ed8 !important;
        }

        :global(.theme-green) .chat-header-container {
          background: #047857 !important;
        }

        .left-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .back-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 4px;
          margin-left: -4px;
        }

        .back-text {
          color: #0088cc;
          font-size: 17px;
          margin-left: -4px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .text-info {
          display: flex;
          flex-direction: column;
        }

        .header-name {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }

        .header-status {
          font-size: 12px;
          color: #8e8e93;
        }

        .right-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 8px;
        }

        .header-icon-btn {
          background: var(--sidebar-hover); /* Permanent background for premium look */
          border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border for premium look */
          color: #0088cc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 10px;
          transition: all 0.2s;
        }

        :global(.light-theme) .header-icon-btn {
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .header-icon-btn:active {
          background: var(--sidebar-active);
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
