import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LiveMessage, PollData } from '../../services/roomCommands';
import MessageRenderer from './MarkdownRenderer';
import { Smile, Copy, Trash2, ThumbsUp, ThumbsDown, MoreHorizontal, Heart, Reply, Paperclip, Gamepad2 } from 'lucide-react';
import './LiveMessageItem.css';

interface LiveMessageItemProps {
  msg: LiveMessage;
  isCurrentUser: boolean;
  onReply: (msg: LiveMessage) => void;
  onReact: (msgId: string, emoji: string) => void;
  onDelete: (msgId: string, forEveryone: boolean) => void;
  onVote: (msgId: string, optionId: string) => void;
  currentUserId: string;
  allMessages: LiveMessage[];
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const EXTENDED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯', '👏', '🤔', '👀', '✨', '🙌', '🚀', '💡', '✅', '❌', '🤷'];

const LiveMessageItem: React.FC<LiveMessageItemProps> = ({ 
  msg, isCurrentUser, onReply, onReact, onDelete, onVote, currentUserId, allMessages, showNotification 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showExtendedEmojis, setShowExtendedEmojis] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  // Handle long press
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (msg.isDeleted) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startX.current = clientX;
    startY.current = clientY;
    setIsPressed(true);
    
    pressTimer.current = setTimeout(() => {
      setShowActions(true);
      setShowExtendedEmojis(false);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); // 500ms long press for better responsiveness
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (msg.isDeleted) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // If vertical movement is more than horizontal, it's a scroll, not a swipe
    // We use a small buffer (absDiffX > 5) to allow for slight horizontal movement during scroll
    if (absDiffY > absDiffX && !isSwiping) {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      setIsPressed(false);
      return;
    }
    
    // Cancel long press if moved significantly in any direction
    if (absDiffX > 10 || absDiffY > 10) {
      setIsPressed(false);
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    }

    // Swipe to reply logic (swipe right)
    // Threshold of 30px before we start showing the swipe to prevent accidental slides during scrolling
    if (diffX > 30 && diffX < 150) {
      setIsSwiping(true);
      setSwipeOffset(diffX - 30);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    
    if (swipeOffset > 60) {
      onReply(msg);
    }
    
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setShowActions(false);
    if (showNotification) showNotification('Message copied to clipboard', 'success');
  };

  const renderPoll = (poll: PollData) => {
    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
    const maxVotes = Math.max(...poll.options.map(opt => opt.votes?.length || 0));

    return (
      <div className="poll-container">
        <div className="poll-question">{poll.question}</div>
        <div className="poll-options">
          {poll.options.map(opt => {
            const votesCount = opt.votes?.length || 0;
            const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
            const hasVoted = opt.votes?.includes(currentUserId);
            
            let statusClass = 'average';
            if (totalVotes > 0) {
              if (votesCount === maxVotes) statusClass = 'winning';
              else if (votesCount === 0) statusClass = 'losing';
            }

            return (
              <div 
                key={opt.id} 
                className={`poll-option ${hasVoted ? 'voted' : ''} ${statusClass}`}
                onClick={() => onVote(msg.id, opt.id)}
              >
                <div className="poll-option-bg" style={{ width: `${percentage}%` }}></div>
                <div className="poll-option-content">
                  <span className="poll-option-text">
                    {hasVoted && <span className="vote-checkmark">✅</span>}
                    {opt.text}
                  </span>
                  {totalVotes > 0 && <span className="poll-option-percent">{percentage}%</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="poll-footer">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • Click to vote
          {poll.allowMultiple && ' • Multiple answers allowed'}
        </div>
      </div>
    );
  };

  const renderReactions = () => {
    if (!msg.reactions || Object.keys(msg.reactions).length === 0) return null;
    
    return (
      <div className="reactions-container">
        {Object.entries(msg.reactions).map(([emoji, users]) => (
          <div 
            key={emoji} 
            className={`reaction-badge ${users.includes(currentUserId) ? 'active' : ''}`}
            onClick={() => onReact(msg.id, emoji)}
          >
            {emoji} <span className="reaction-count">{users.length}</span>
          </div>
        ))}
      </div>
    );
  };

  if (msg.deletedFor?.includes(currentUserId)) {
    return null; // Don't render if user deleted it for themselves
  }

  return (
    <>
      <div 
        id={`live-msg-${msg.id}`}
        className={`message-wrapper ${isCurrentUser ? 'user' : 'other'} ${msg.isAI ? 'ai-message' : ''} ${showActions ? 'has-actions-open' : ''}`}
        ref={messageRef}
      >
        <div className="message-sender">
          {isCurrentUser ? 'You' : msg.senderName}
        </div>
        
        <div className="message-interaction-area" style={{ position: 'relative' }}>
          {/* Swipe Reply Icon Indicator */}
          <div 
            className="swipe-reply-indicator" 
            style={{ 
              opacity: swipeOffset / 60,
              transform: `translateX(${Math.min(swipeOffset - 40, 0)}px)`
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
          </div>

          <div 
            className={`message ${isCurrentUser ? 'user' : 'assistant'} ${msg.isDeleted ? 'deleted' : ''} ${isPressed ? 'pressed' : ''} ${showActions ? 'action-open' : ''}`}
            style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.2s ease-out' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <div className="message-content disable-select">
              {msg.isDeleted ? (
                <span className="deleted-text">🚫 This message was deleted</span>
              ) : (
                <>
                  {msg.replyTo && (
                    <div 
                      className="replied-message-preview"
                      onClick={() => {
                        const el = document.getElementById(`live-msg-${msg.replyTo}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('highlight-pulse');
                          setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="replied-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 14 4 9 9 4"></polyline>
                          <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                        </svg>
                      </span>
                      <span className="replied-text">
                        {allMessages.find(m => m.id === msg.replyTo)?.text.substring(0, 40) || 'Replied to a message'}
                        {(allMessages.find(m => m.id === msg.replyTo)?.text.length || 0) > 40 ? '...' : ''}
                      </span>
                    </div>
                  )}
                  {msg.poll ? renderPoll(msg.poll) : <MessageRenderer content={msg.text} />}
                </>
              )}
            </div>
          </div>
          {!msg.isDeleted && renderReactions()}
        </div>
      </div>

      {/* Action Menu Popup (Bottom Drawer) - Rendered via Portal to ensure it's not constrained by parent overflow/transform */}
      {showActions && !msg.isDeleted && createPortal(
        <>
          <div className="message-actions-backdrop" onClick={() => setShowActions(false)}></div>
          <div className="message-actions-popup">
            <div className="drawer-handle"></div>
            
            <div className="action-grid">
              <button className="action-grid-item" onClick={() => { onReact(msg.id, '❤️'); setShowActions(false); }}>
                <div className="icon-circle"><Heart size={20} /></div>
                <span>Heart</span>
              </button>
              <button className="action-grid-item" onClick={() => { onReply(msg); setShowActions(false); }}>
                <div className="icon-circle"><Reply size={20} /></div>
                <span>Reply</span>
              </button>
              <button className="action-grid-item" onClick={() => setShowExtendedEmojis(!showExtendedEmojis)}>
                <div className="icon-circle"><Smile size={20} /></div>
                <span>Emoji</span>
              </button>
              <button className="action-grid-item" onClick={() => { alert('Attach feature coming soon!'); setShowActions(false); }}>
                <div className="icon-circle"><Paperclip size={20} /></div>
                <span>Attach</span>
              </button>
              <button className="action-grid-item" onClick={() => { alert('Games feature coming soon!'); setShowActions(false); }}>
                <div className="icon-circle"><Gamepad2 size={20} /></div>
                <span>Games</span>
              </button>
              <button className="action-grid-item" onClick={() => { onReact(msg.id, '👍'); setShowActions(false); }}>
                <div className="icon-circle"><ThumbsUp size={20} /></div>
                <span>Like</span>
              </button>
              <button className="action-grid-item" onClick={() => { onReact(msg.id, '👎'); setShowActions(false); }}>
                <div className="icon-circle"><ThumbsDown size={20} /></div>
                <span>Dislike</span>
              </button>
              <button className="action-grid-item" onClick={handleCopy}>
                <div className="icon-circle"><Copy size={20} /></div>
                <span>Copy</span>
              </button>
            </div>

            {showExtendedEmojis && (
              <div className="quick-emojis extended">
                {EXTENDED_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowActions(false); }}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className="delete-options">
              <button className="delete-btn" onClick={() => { onDelete(msg.id, false); setShowActions(false); }}>
                <Trash2 size={18} /> Delete for me
              </button>
              {isCurrentUser && (
                <button className="delete-btn everyone" onClick={() => { onDelete(msg.id, true); setShowActions(false); }}>
                  <Trash2 size={18} /> Delete for everyone
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default LiveMessageItem;
