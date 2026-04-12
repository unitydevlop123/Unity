import React, { useState, useCallback } from 'react';
import Header from '../components/chat/Header';
import Stories from '../components/chat/Stories';
import SearchBar from '../components/chat/SearchBar';
import ChatList from '../components/chat/ChatList';
import BottomNav from '../components/layout/BottomNav';

interface InboxProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
  onSelectChat?: (chat: { name: string; avatar: string }) => void;
}

export default function Inbox({ onBack, onNavigate, onSelectChat }: InboxProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 10 && !isScrolled) {
      setIsScrolled(true);
    } else if (scrollTop <= 10 && isScrolled) {
      setIsScrolled(false);
    }
  }, [isScrolled]);

  return (
    <div className="inbox-container app">
      <Header scrolled={isScrolled} />
      <div className="scroll-area" onScroll={handleScroll}>
        <div className={`collapsible-header ${isScrolled ? 'header-hidden' : ''}`}>
          <div className="large-title-wrapper">
            <h1 className="large-title">Chats</h1>
          </div>
        </div>
        <div className="stories-wrapper">
          <Stories />
        </div>
        <div className="search-wrapper">
          <SearchBar />
        </div>
        <div className="chat-list-container">
          <ChatList onSelectChat={onSelectChat} />
        </div>
      </div>
      <BottomNav 
        activeTab="inbox" 
        onTabChange={(tab) => {
          if (onNavigate) {
            onNavigate(tab);
          }
        }} 
      />
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #000;
        }
        
        .app {
          max-width: 430px;
          width: 100%;
          margin: 0 auto;
          height: 100vh;
          background: #000;
          color: #fff;
          display: flex;
          flex-direction: column;
        }
        
        .scroll-area {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          background: transparent;
          padding-top: 90px;
        }
        
        .scroll-area::-webkit-scrollbar {
          display: none;
        }

        .collapsible-header {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: max-height, opacity, transform;
          max-height: 300px;
          opacity: 1;
          overflow: hidden;
          flex-shrink: 0;
          background: transparent;
          z-index: 90;
          width: 100%;
          box-sizing: border-box;
        }

        .collapsible-header.header-hidden {
          opacity: 0;
          max-height: 0;
          pointer-events: none;
          transform: translateY(-40px);
        }
        
        .large-title-wrapper {
          padding: 0 16px 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: left center;
          width: 100%;
          box-sizing: border-box;
        }

        .large-title {
          font-size: 34px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .header-hidden .large-title-wrapper {
          transform: scale(0.5) translateY(-20px);
          opacity: 0;
        }
        
        .stories-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top center;
          transform: scale(1);
          padding-bottom: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .header-hidden .stories-wrapper {
          transform: scale(0.8);
        }

        .search-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
          opacity: 1;
          padding-bottom: 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .header-hidden .search-wrapper {
          transform: translateY(-20px);
          opacity: 0;
        }
        
        .chat-list-container {
          padding-bottom: 100px; /* Extra space for the glass bottom bar */
          width: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
