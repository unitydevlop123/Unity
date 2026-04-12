import React, { useState, useRef, useCallback } from 'react';
import { Chat } from '@/types';
import Settings from '@/components/features/Settings/Settings';
import UnityDevLogo from '@/components/features/Logo/UnityDevLogo';
import styles from './Sidebar.module.css';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onPinChat: (id: string) => void;
  onAddChat?: (chat: Chat) => void;
  existingChats?: Chat[];
}

interface ContextMenuState {
  chatId: string;
  title: string;
}

function groupChatsByDate(chats: Chat[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pinned = chats.filter(c => (c as any).pinned);
  const unpinned = chats.filter(c => !(c as any).pinned);

  const groups: Record<string, Chat[]> = {};

  if (pinned.length > 0) {
    groups['Pinned'] = pinned;
  }

  unpinned.forEach(chat => {
    const date = new Date(chat.createdAt);
    let label: string;
    if (date >= todayStart) {
      label = 'Today';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(chat);
  });

  const order = ['Pinned', 'Today', ...Object.keys(groups).filter(k => k !== 'Pinned' && k !== 'Today')];
  return order.filter(k => groups[k]).map(label => ({ label, chats: groups[label] }));
}

// ── Individual chat item with long-press ─────────────────────
interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onLongPress: (chat: Chat) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onSelect, onLongPress }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const start = useCallback(() => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(chat);
    }, 500);
  }, [chat, onLongPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!didLongPress.current) onSelect();
  }, [onSelect]);

  const isPinned = !!(chat as any).pinned;
  const isRemixed = !!(chat as any).remixedFrom;

  return (
    <button
      className={`${styles.chatItem} ${isActive ? styles.active : ''} ${isPinned ? styles.pinned : ''}`}
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchMove={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onClick={handleClick}
    >
      <div className={styles.chatItemInner}>
        <span className={styles.chatItemText}>
          {chat.title.length > 28 ? chat.title.slice(0, 26) + '...' : chat.title}
        </span>
        {isRemixed && (
          <span className={styles.remixBadge}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            Remixed
          </span>
        )}
      </div>
      {isPinned && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={styles.pinIcon}>
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
        </svg>
      )}
    </button>
  );
};

// ── Context Menu ─────────────────────────────────────────────
interface ContextMenuProps {
  chat: ContextMenuState;
  isPinned: boolean;
  onRename: () => void;
  onPin: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  chat, isPinned, onRename, onPin, onDelete, onClose
}) => (
  <div className={styles.ctxBackdrop} onClick={onClose}>
    <div className={styles.ctxContainer} onClick={e => e.stopPropagation()}>
      {/* Chat title preview */}
      <div className={styles.ctxTitleRow}>
        <span className={styles.ctxTitle}>{chat.title}</span>
      </div>

      {/* Actions card */}
      <div className={styles.ctxCard}>
        <button className={styles.ctxItem} onClick={onRename}>
          <span className={styles.ctxLabel}>Rename</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <div className={styles.ctxDivider} />
        <button className={styles.ctxItem} onClick={onPin}>
          <span className={styles.ctxLabel}>{isPinned ? 'Unpin' : 'Pin'}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" opacity="0"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <path d="M5 10h14"/>
            <path d="M8 6l4 4 4-4"/>
            <line x1="12" y1="14" x2="12" y2="22"/>
          </svg>
        </button>
        <div className={styles.ctxDivider} />
        <button className={`${styles.ctxItem} ${styles.ctxDelete}`} onClick={onDelete}>
          <span className={styles.ctxLabel}>Delete</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
);

// ── Rename Modal ─────────────────────────────────────────────
interface RenameModalProps {
  initialTitle: string;
  onDone: (title: string) => void;
  onCancel: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ initialTitle, onDone, onCancel }) => {
  const [value, setValue] = useState(initialTitle);

  return (
    <div className={styles.renameBackdrop} onClick={onCancel}>
      <div className={styles.renameModal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.renameTitle}>Rename Chat</h3>
        <input
          className={styles.renameInput}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') onDone(value.trim() || initialTitle);
          }}
        />
        <div className={styles.renameBtns}>
          <button className={styles.renameCancelBtn} onClick={onCancel}>Cancel</button>
          <div className={styles.renameVDivider} />
          <button
            className={styles.renameDoneBtn}
            onClick={() => onDone(value.trim() || initialTitle)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ──────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({
  chats, activeChatId, isOpen, onClose, onSelectChat, onNewChat,
  onRenameChat, onDeleteChat, onPinChat, onAddChat, existingChats,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameTarget, setRenameTarget] = useState<ContextMenuState | null>(null);

  const groups = groupChatsByDate(chats);

  const handleLongPress = useCallback((chat: Chat) => {
    setContextMenu({ chatId: chat.id, title: chat.title });
  }, []);

  const handleRename = () => {
    if (!contextMenu) return;
    setRenameTarget(contextMenu);
    setContextMenu(null);
  };

  const handlePin = () => {
    if (!contextMenu) return;
    onPinChat(contextMenu.chatId);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    onDeleteChat(contextMenu.chatId);
    setContextMenu(null);
  };

  const handleRenameDone = (newTitle: string) => {
    if (!renameTarget) return;
    onRenameChat(renameTarget.chatId, newTitle);
    setRenameTarget(null);
  };

  const contextChat = contextMenu
    ? chats.find(c => c.id === contextMenu.chatId)
    : null;

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <UnityDevLogo size={28} />
          </div>
          <span className={styles.sidebarTitle}>UnityDeV AI</span>
          <button
            className={styles.headerNewBtn}
            onClick={() => { onNewChat(); onClose(); }}
            aria-label="New chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {groups.map(group => (
            <div key={group.label} className={styles.group}>
              <div className={styles.groupLabel}>{group.label}</div>
              {group.chats.map(chat => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => { onSelectChat(chat.id); onClose(); }}
                  onLongPress={handleLongPress}
                />
              ))}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.avatar}>
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=40&h=40&fit=crop&crop=center"
              alt="avatar"
              className={styles.avatarImg}
            />
          </div>
          <span className={styles.userName}>Odigie Unity</span>
          <button
            className={styles.moreBtn}
            aria-label="More options"
            onClick={() => setSettingsOpen(true)}
          >
            <span>•••</span>
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          chat={contextMenu}
          isPinned={!!(contextChat as any)?.pinned}
          onRename={handleRename}
          onPin={handlePin}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <RenameModal
          initialTitle={renameTarget.title}
          onDone={handleRenameDone}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        existingChats={existingChats ?? chats}
        onOpenMemoryMap={() => {
          setSettingsOpen(false);
          window.dispatchEvent(new CustomEvent('open-memory-map'));
        }}
        onImportRemix={(chat) => {
          onAddChat?.(chat);
          setSettingsOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;
