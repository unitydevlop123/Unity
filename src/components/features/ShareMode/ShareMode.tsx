import React from 'react';
import { Message, Chat } from '@/types';
import styles from './ShareMode.module.css';

interface ShareModeProps {
  messages: Message[];
  chat: Chat;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  onCreateImage: () => void;
  onRemix: () => void;
}

const ShareMode: React.FC<ShareModeProps> = ({
  messages, selectedIds, onToggle, onClose, onCreateImage, onRemix
}) => {
  const count = selectedIds.length;

  return (
    <>
      {/* Selection header */}
      <div className={styles.selectionHeader}>
        <button className={styles.closeSelBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span className={styles.selectionTitle}>
          {count === 0 ? 'Select turns' : `${count} conversation turn${count > 1 ? 's' : ''} sele...`}
        </span>
      </div>

      {/* Selectable messages */}
      <div className={styles.messagesList}>
        {messages.filter(m => m.role === 'assistant').map(msg => {
          const selected = selectedIds.includes(msg.id);
          return (
            <button
              key={msg.id}
              className={`${styles.selectableRow} ${selected ? styles.selected : ''}`}
              onClick={() => onToggle(msg.id)}
            >
              <div className={`${styles.circle} ${selected ? styles.circleSelected : ''}`}>
                {selected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div className={styles.previewText} style={{ opacity: selected ? 1 : 0.7 }}>
                {msg.content.slice(0, 120)}{msg.content.length > 120 ? '...' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div className={styles.actionBar}>
        <button className={styles.createLinkBtn} onClick={onRemix}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Remix
        </button>
        <button
          className={styles.createImageBtn}
          onClick={onCreateImage}
          disabled={count === 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Create image
        </button>
      </div>
    </>
  );
};

export default ShareMode;
