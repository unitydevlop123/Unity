import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Message } from '@/types';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { GhostModeMessage } from '@/components/features/GhostMode/GhostMode';
import MarkdownRenderer from '../../../../components/chat/MarkdownRenderer';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: Message;
  onShare?: (messageId: string) => void;
}

function formatFileType(mime: string, name: string): string {
  if (mime.startsWith('image/')) return mime.split('/')[1].toUpperCase();
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('word')) return 'DOCX';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLSX';
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

// ── Debate card renderer (for __DEBATE__ messages in main chat) ─────────────
function isDebateMessage(text: string): boolean {
  return text.startsWith('__DEBATE__\n');
}

function renderDebateCards(text: string): React.ReactNode {
  const body = text.replace(/^__DEBATE__\n/, '');

  const advocateMatch = body.match(/\*\*⚡ The Advocate:\*\*\n([\s\S]*?)(?=\n\n\*\*🔥|$)/);
  const skepticMatch  = body.match(/\*\*🔥 The Skeptic:\*\*\n([\s\S]*?)(?=\n\n\*\*⚖️|$)/);
  const judgeMatch    = body.match(/\*\*⚖️ Judge's Verdict:\*\*\n([\s\S]*)/);

  const advocateText = advocateMatch ? advocateMatch[1].trim() : '';
  const skepticText  = skepticMatch  ? skepticMatch[1].trim()  : '';
  const judgeText    = judgeMatch    ? judgeMatch[1].trim()    : '';

  // Label row — just icon badge + name, no card border
  const labelRow = (icon: string, gradient: string, name: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, marginTop: 14 }}>
      <span style={{
        width: 26, height: 26, borderRadius: 7, fontSize: 13,
        background: gradient,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{name}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {advocateText && (
        <>
          {labelRow('⚡', 'linear-gradient(135deg,#1e40af,#4d9ef7)', 'The Advocate', '#4d9ef7')}
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--text-primary)' }}>{advocateText}</p>
        </>
      )}
      {skepticText && (
        <>
          {labelRow('🔥', 'linear-gradient(135deg,#c2410c,#f97316)', 'The Skeptic', '#f97316')}
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--text-primary)' }}>{skepticText}</p>
        </>
      )}
      {judgeText && (
        <>
          {labelRow('⚖️', 'linear-gradient(135deg,#6d28d9,#a78bfa)', "Judge's Verdict", '#a78bfa')}
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--text-primary)' }}>{judgeText}</p>
        </>
      )}
    </div>
  );
}

const FileDocIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="4" width="36" height="40" rx="4" fill="#2563eb" opacity="0.9"/>
    <path d="M28 4v10h10" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M14 22h20M14 28h20M14 34h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Thought Panel ────────────────────────────────────────────────────────────
interface ThoughtPanelProps {
  isStreaming: boolean;
  streamingText: string;
  finalText?: string;
  thoughtSeconds?: number;
}

const ThoughtPanel: React.FC<ThoughtPanelProps> = ({
  isStreaming, streamingText, finalText, thoughtSeconds
}) => {
  // Auto-open while streaming, user can toggle once done
  const [open, setOpen] = useState(isStreaming);
  const thoughtRef = useRef<HTMLDivElement>(null);

  // Auto-open when streaming starts; auto-close when streaming ends
  useEffect(() => {
    if (isStreaming) {
      setOpen(true);
    } else {
      // streaming just finished — collapse the thought panel
      setOpen(false);
    }
  }, [isStreaming]);

  // Auto-scroll thought panel while streaming
  useEffect(() => {
    if (isStreaming && open && thoughtRef.current) {
      thoughtRef.current.scrollTop = thoughtRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming, open]);

  const displayText = isStreaming ? streamingText : (finalText || streamingText);
  const label = isStreaming
    ? 'Thinking…'
    : `Thought for ${thoughtSeconds ?? 0} seconds`;

  return (
    <div className={styles.thoughtPanel}>
      <button
        className={styles.thoughtBtn}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {isStreaming && <span className={styles.thinkSpinner} />}
        <span>{label}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.2s', flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {open && (
        <div className={styles.thoughtContent} ref={thoughtRef}>
          {displayText
            ? displayText.split('\n').filter(l => l.trim()).map((line, i) => (
                <p key={i} className={styles.thoughtLine}>
                  {i === 0 && <span className={styles.thoughtBullet}>•</span>}
                  {line}
                </p>
              ))
            : <p className={styles.thoughtLine} style={{ fontStyle: 'italic', opacity: 0.5 }}>Reasoning…</p>
          }
          {isStreaming && <span className={styles.streamCursor} />}
        </div>
      )}
    </div>
  );
};

// ── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
  onCopy: () => void;
  onSelectText: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onShare?: () => void;
  onClose: () => void;
  isUser: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  onCopy, onSelectText, onRegenerate, onLike, onDislike, onShare, onClose, isUser
}) => {
  const items = [
    { label: 'Copy', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>, action: onCopy },
    { label: 'Select text', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></svg>, action: onSelectText },
    ...(!isUser ? [
      { label: 'Regenerate', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>, action: onRegenerate ?? (() => {}) },
      { label: 'Like', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>, action: onLike ?? (() => {}) },
      { label: 'Dislike', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>, action: onDislike ?? (() => {}) },
      { label: 'Share', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, action: onShare ?? (() => {}) },
    ] : []),
  ];

  return (
    <div className={styles.menuBackdrop} onClick={onClose}>
      <div className={styles.contextMenu} onClick={e => e.stopPropagation()}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            <button
              className={styles.menuItem}
              onClick={() => { item.action(); onClose(); }}
            >
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={styles.menuIcon}>{item.icon}</span>
            </button>
            {i < items.length - 1 && <div className={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ── Select Text Modal ────────────────────────────────────────────────────────
interface SelectTextModalProps {
  text: string;
  onClose: () => void;
}

const SelectTextModal: React.FC<SelectTextModalProps> = ({ text, onClose }) => (
  <div className={styles.selectBackdrop} onClick={onClose}>
    <div className={styles.selectSheet} onClick={e => e.stopPropagation()}>
      <div className={styles.selectHeader}>
        <span className={styles.selectTitle}>Select text</span>
        <button className={styles.selectClose} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className={styles.selectBody}>
        <p className={styles.selectText}>{text}</p>
      </div>
    </div>
  </div>
);

// ── Main ChatMessage Component ───────────────────────────────────────────────
const ChatMessage: React.FC<ChatMessageProps> = ({ message, onShare }) => {
  const { settings } = useAppSettings();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSelectText = () => {
    setSelectOpen(true);
  };

  const startLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setMenuOpen(true);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (message.role === 'user') {
    return (
      <>
        <div className={styles.userRow}>
          {message.attachments && message.attachments.length > 0 && (
            <div className={styles.userAttachments}>
              <div className={styles.fileCards}>
                {message.attachments.map(att => (
                  <div key={att.id} className={styles.fileCard}>
                    <div className={styles.fileCardIcon}>
                      {att.dataUrl ? (
                        <img src={att.dataUrl} alt={att.name} className={styles.fileThumb} />
                      ) : (
                        <FileDocIcon />
                      )}
                    </div>
                    <div className={styles.fileCardInfo}>
                      <span className={styles.fileCardName}>{att.name.length > 18 ? att.name.slice(0, 16) + '…' : att.name}</span>
                      <span className={styles.fileCardMeta}>
                        {formatFileType(att.type, att.name)} {formatBytes(att.size)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {message.content && (
            <div
              className={styles.userBubble}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onClick={handleClick}
            >
              {message.content}
            </div>
          )}
        </div>
        {menuOpen && (
          <ContextMenu
            isUser={true}
            onCopy={handleCopy}
            onSelectText={handleSelectText}
            onClose={() => setMenuOpen(false)}
          />
        )}
        {selectOpen && (
          <SelectTextModal text={message.content} onClose={() => setSelectOpen(false)} />
        )}
      </>
    );
  }

  // ── Assistant message
  const hasThought = message.isStreaming
    ? (message.streamingThought !== undefined)  // shows panel as soon as <think> detected
    : (!!message.thoughtContent || (message.thoughtSeconds !== undefined && message.thoughtSeconds > 0));

  // Ghost Mode — wrap completed assistant messages
  const useGhostMode = settings.ghostModeEnabled && !message.isStreaming && message.role === 'assistant' && message.content;

  if (useGhostMode) {
    return (
      <div className={styles.assistantRow}>
        <GhostModeMessage content={message.content} isStreaming={false} />
      </div>
    );
  }

  return (
    <>
      <div className={styles.assistantRow}>
        {/* Thought panel — shown during streaming or if there's thought content */}
        {hasThought && (
          <ThoughtPanel
            isStreaming={!!message.isStreaming}
            streamingText={message.streamingThought ?? ''}
            finalText={message.thoughtContent}
            thoughtSeconds={message.thoughtSeconds}
          />
        )}

        {/* Main content — only shown once not streaming or content exists */}
        {message.content ? (
          <div
            className={styles.assistantContent}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onClick={handleClick}
          >
            {isDebateMessage(message.content)
              ? renderDebateCards(message.content)
              : <MarkdownRenderer content={message.content} />}
            {message.isStreaming && <span className={styles.streamCursor} />}
          </div>
        ) : message.isStreaming ? null : null}

        {/* Actions — only once done streaming */}
        {!message.isStreaming && message.content && (
          <div className={styles.actions}>
            <div className={styles.leftActions}>
              <button className={styles.actionBtn} onClick={handleCopy} title="Copy">
                {copied ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4d9ef7" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                )}
              </button>
              <button className={styles.actionBtn} title="Like">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
              </button>
              <button className={styles.actionBtn} title="Dislike">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
              </button>
              <button className={styles.actionBtn} title="Retry">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              </button>
            </div>
            <button
              className={styles.actionBtn}
              title="Share"
              onClick={() => onShare?.(message.id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>
        )}
      </div>
      {menuOpen && (
        <ContextMenu
          isUser={false}
          onCopy={handleCopy}
          onSelectText={handleSelectText}
          onRegenerate={() => {}}
          onLike={() => {}}
          onDislike={() => {}}
          onShare={() => onShare?.(message.id)}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {selectOpen && (
        <SelectTextModal text={message.content} onClose={() => setSelectOpen(false)} />
      )}
    </>
  );
};

export default ChatMessage;
