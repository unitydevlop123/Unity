import React, { useState } from 'react';
import { Chat } from '@/types';
import { createRemixCode, RemixExpiry } from '@/lib/remix';
import styles from './RemixModal.module.css';

interface RemixModalProps {
  chat: Chat;
  onClose: () => void;
}

const RemixModal: React.FC<RemixModalProps> = ({ chat, onClose }) => {
  const [expiry, setExpiry] = useState<RemixExpiry>('7d');
  const [maxUsesEnabled, setMaxUsesEnabled] = useState(false);
  const [maxUsesValue, setMaxUsesValue] = useState(10);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Block remixing a chat that was itself remixed
  const isAlreadyRemixed = !!chat.remixedFrom;

  const handleGenerate = () => {
    if (isAlreadyRemixed) return;
    setGenerating(true);
    setTimeout(() => {
      const maxUses = maxUsesEnabled ? maxUsesValue : null;
      const newCode = createRemixCode(chat, expiry, maxUses);
      setCode(newCode);
      setGenerating(false);
    }, 600);
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel: Record<RemixExpiry, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    'never': 'Never',
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.title}>Remix Chat</span>
            <span className={styles.subtitle}>Share this conversation with anyone</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Already-remixed block */}
          {isAlreadyRemixed && (
            <div className={styles.blockedBanner}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              <span>Remixed chats cannot be re-remixed. This prevents infinite remix chains.</span>
            </div>
          )}

          {/* Chat preview */}
          <div className={styles.chatPreview}>
            <div className={styles.chatPreviewIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className={styles.chatPreviewInfo}>
              <span className={styles.chatPreviewTitle}>{chat.title}</span>
              <span className={styles.chatPreviewMeta}>{chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Config — only when not blocked and code not yet generated */}
          {!isAlreadyRemixed && !code && (
            <>
              {/* Expiry */}
              <p className={styles.sectionLabel}>Code expiration</p>
              <div className={styles.expiryGroup}>
                {(['24h', '7d', 'never'] as RemixExpiry[]).map(opt => (
                  <button
                    key={opt}
                    className={`${styles.expiryBtn} ${expiry === opt ? styles.expiryBtnActive : ''}`}
                    onClick={() => setExpiry(opt)}
                  >
                    {expiryLabel[opt]}
                  </button>
                ))}
              </div>

              {/* Max uses */}
              <div className={styles.maxUsesRow}>
                <div className={styles.maxUsesLeft}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <div className={styles.maxUsesLabel}>
                    <span className={styles.rowLabel}>Limit uses</span>
                    <span className={styles.rowSub}>Max people who can remix</span>
                  </div>
                </div>
                <div className={styles.maxUsesControls}>
                  {maxUsesEnabled && (
                    <input
                      type="number"
                      className={styles.maxUsesInput}
                      value={maxUsesValue}
                      min={1}
                      max={999}
                      onChange={e => {
                        const v = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                        setMaxUsesValue(v);
                      }}
                    />
                  )}
                  <button
                    role="switch"
                    aria-checked={maxUsesEnabled}
                    onClick={() => setMaxUsesEnabled(v => !v)}
                    className={`${styles.toggle} ${maxUsesEnabled ? styles.toggleOn : ''}`}
                  >
                    <span className={`${styles.toggleKnob} ${maxUsesEnabled ? styles.toggleKnobOn : ''}`} />
                  </button>
                </div>
              </div>

              <p className={styles.hint}>
                Anyone with the Remix code can import this chat and continue the conversation.
                {maxUsesEnabled ? ` Limited to ${maxUsesValue} use${maxUsesValue !== 1 ? 's' : ''}.` : ''}
              </p>
            </>
          )}

          {/* Generated code */}
          {!isAlreadyRemixed && code && (
            <div className={styles.codeSection}>
              <p className={styles.sectionLabel}>Your Remix Code</p>
              <div className={styles.codeBox}>
                <span className={styles.codePrefix}>UnityDev</span>
                <span className={styles.codeDivider}>·</span>
                <span className={styles.codeText}>{code.split('-')[1]}</span>
                <span className={styles.codeDivider}>·</span>
                <span className={styles.codeEncoded}>{code.split('-').slice(2).join('-').slice(0, 14)}…</span>
              </div>
              <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy Full Code
                  </>
                )}
              </button>
              <p className={styles.hint} style={{ marginTop: 12 }}>
                Share this code. Recipients paste it in Settings → Import Remix.
                {expiry !== 'never' ? ` Expires in ${expiryLabel[expiry]}.` : ' Never expires.'}
                {maxUsesEnabled ? ` Max ${maxUsesValue} use${maxUsesValue !== 1 ? 's' : ''}.` : ''}
              </p>
              <button className={styles.regenerateBtn} onClick={() => setCode(null)}>
                Generate a new code
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        {!isAlreadyRemixed && !code && (
          <div className={styles.footer}>
            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <span className={styles.generating}>Generating…</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                  </svg>
                  Generate Remix Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemixModal;
