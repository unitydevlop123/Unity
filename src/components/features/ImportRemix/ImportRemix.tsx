import React, { useState } from 'react';
import { decodeRemixCode, consumeRemixCode } from '@/lib/remix';
import { Chat } from '@/types';
import styles from './ImportRemix.module.css';

interface ImportRemixProps {
  onImport: (chat: Chat) => void;
  onClose: () => void;
  existingChats?: Chat[];
}

const ImportRemix: React.FC<ImportRemixProps> = ({ onImport, onClose, existingChats = [] }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const existingChatIds = existingChats.map(c => c.id);

  const handleImport = () => {
    setError(null);
    if (!code.trim()) {
      setError('Please paste a Remix code first.');
      return;
    }
    setImporting(true);
    setTimeout(() => {
      const result = decodeRemixCode(code.trim(), existingChatIds);
      if (!result.ok || !result.chat) {
        setError(result.error ?? 'Invalid code.');
        setImporting(false);
        return;
      }

      // Build the new chat with remixedFrom marker
      const newChatId = Date.now().toString();
      const remixedChat: Chat = {
        ...result.chat,
        id: newChatId,
        title: result.chat.title.replace(/^🔀\s*/, ''), // strip old emoji if any
        createdAt: new Date(),
        pinned: false,
        remixedFrom: result.codeId, // marks it as a remixed chat
      };

      // Record the use so limits are tracked
      if (result.codeId) {
        consumeRemixCode(result.codeId, newChatId);
      }

      setSuccess(true);
      setTimeout(() => {
        onImport(remixedChat);
        onClose();
      }, 800);
      setImporting(false);
    }, 500);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 014-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.title}>Import Remix</span>
            <span className={styles.subtitle}>Paste a Remix code to continue a chat</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.label}>Remix Code</p>
          <textarea
            className={styles.input}
            placeholder="UnityDev-XXXXXX-… (paste full code)"
            value={code}
            onChange={e => { setCode(e.target.value); setError(null); }}
            rows={4}
            autoFocus
            spellCheck={false}
          />
          {error && (
            <div className={styles.errorRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          <p className={styles.hint}>
            You'll get a copy of the conversation. The original isn't affected.
            Codes start with <strong>UnityDev-</strong>
          </p>
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.importBtn} ${success ? styles.importBtnSuccess : ''}`}
            onClick={handleImport}
            disabled={importing || success}
          >
            {success ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Chat Imported!
              </>
            ) : importing ? 'Importing…' : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
                Import & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportRemix;
