import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick: () => void;
  onNewChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick, onNewChat }) => {
  return (
    <div className={styles.header}>
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open menu">
        <span className={styles.menuLine} />
        <span className={styles.menuLine} style={{ width: '16px' }} />
      </button>

      {title ? (
        <div className={styles.titleBlock}>
          <div className={styles.titlePill}>
            <span className={styles.title}>{title}</span>
            <svg className={styles.pillChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      ) : (
        <div className={styles.titleBlock} />
      )}

      <button className={styles.newChatBtn} onClick={onNewChat} aria-label="New chat">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>
    </div>
  );
};

export default Header;
