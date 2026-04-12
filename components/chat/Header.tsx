import React from 'react';
import { Plus, Edit3 } from 'lucide-react';

interface HeaderProps {
  scrolled?: boolean;
}

export default function Header({ scrolled }: HeaderProps) {
  return (
    <div className={`header ${scrolled ? 'scrolled' : ''}`}>
      <button className="icon-btn edit-btn">Edit</button>
      <h1 className="title">Chats</h1>
      <div className="actions">
        <button className="icon-btn">
          <Plus size={24} strokeWidth={2} />
        </button>
        <button className="icon-btn">
          <Edit3 size={22} strokeWidth={2} />
        </button>
      </div>
      <style>{`
        .header {
          position: fixed;
          top: 0;
          z-index: 100;

          background: #212121; /* Default dark */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          border-bottom: none; /* Removed line for high-end look */
          
          /* Layout properties */
          left: 0;
          right: 0;
          margin: 0 auto;
          max-width: 430px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 12px;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;
          height: 70px; /* Reduced height */
          transition: all 0.25s ease;
          padding-top: env(safe-area-inset-top);
        }

        :global(.light-theme) .header {
          background: #ffffff;
        }

        :global(.theme-red) .header {
          background: #b91c1c !important;
        }

        :global(.theme-gold) .header {
          background: #b45309 !important;
        }

        :global(.theme-blue) .header {
          background: #1d4ed8 !important;
        }

        :global(.theme-green) .header {
          background: #047857 !important;
        }
        
        .header.scrolled {
          height: 60px;
        }
        
        .edit-btn {
          font-size: 16px;
          font-weight: 500;
          width: auto;
          padding: 0 14px;
        }
        
        .title {
          font-size: 17px;
          font-weight: 600;
          color: var(--chat-text);
          margin: 0;
          transition: all 0.2s ease;
        }
        
        .header.scrolled .title {
          transform: scale(0.9);
          opacity: 0.9;
        }
        
        .actions {
          display: flex;
          gap: 8px;
        }
        
        .icon-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--sidebar-hover); /* Permanent background for premium look */
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border for premium look */
          color: var(--chat-text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        :global(.light-theme) .icon-btn {
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .icon-btn:active {
          background: var(--sidebar-active);
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
