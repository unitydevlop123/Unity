import React, { useState, useCallback } from 'react';
import {
  getMyRemixCodes,
  deleteMyRemixCode,
  MyRemixCode,
} from '@/lib/remix';
import styles from './MyRemixCodes.module.css';

interface MyRemixCodesProps {
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────
function formatExpiry(expiresAt: number | null, createdAt: number): string {
  if (!expiresAt) return 'Never expires';
  const now = Date.now();
  if (now > expiresAt) return 'Expired';
  const diff = expiresAt - now;
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `Expires in ${d}d ${h % 24}h`;
  return `Expires in ${h}h`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(expiresAt: number | null): boolean {
  return expiresAt !== null && Date.now() > expiresAt;
}

// ── Individual code card ────────────────────────────────────
const CodeCard: React.FC<{
  code: MyRemixCode;
  onCopy: (fullCode: string) => void;
  onDelete: (id: string) => void;
  copiedId: string | null;
}> = ({ code, onCopy, onDelete, copiedId }) => {
  const expired = isExpired(code.expiresAt);
  const limitReached = code.maxUses !== null && code.useCount >= code.maxUses;
  const progress = code.maxUses
    ? Math.min(100, (code.useCount / code.maxUses) * 100)
    : null;

  const statusColor = expired || limitReached ? '#ff3b30' : '#22c55e';
  const statusLabel = expired
    ? 'Expired'
    : limitReached
    ? 'Limit reached'
    : 'Active';

  return (
    <div className={`${styles.card} ${expired || limitReached ? styles.cardDead : ''}`}>
      {/* Top row */}
      <div className={styles.cardTop}>
        <div className={styles.codeIdWrap}>
          <span className={styles.codePrefix}>UnityDev</span>
          <span className={styles.codeDash}>·</span>
          <span className={styles.codeId}>{code.id}</span>
        </div>
        <span className={styles.statusDot} style={{ background: statusColor }} />
        <span className={styles.statusLabel} style={{ color: statusColor }}>{statusLabel}</span>
      </div>

      {/* Chat title */}
      <div className={styles.chatTitle} title={code.chatTitle}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {code.chatTitle.length > 36 ? code.chatTitle.slice(0, 34) + '…' : code.chatTitle}
      </div>

      {/* Meta row */}
      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatDate(code.createdAt)}
        </span>
        <span className={styles.metaDot}>·</span>
        <span className={styles.metaItem} style={{ color: expired ? '#ff3b30' : 'var(--text-muted)' }}>
          {formatExpiry(code.expiresAt, code.createdAt)}
        </span>
      </div>

      {/* Usage section */}
      <div className={styles.usageSection}>
        <div className={styles.usageHeader}>
          <div className={styles.usageLeft}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span className={styles.usageLabel}>
              {code.useCount} {code.useCount === 1 ? 'person' : 'people'} remixed
            </span>
          </div>
          <span className={styles.usageLimit}>
            {code.maxUses !== null
              ? `${code.useCount} / ${code.maxUses}`
              : `${code.useCount} / ∞`}
          </span>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                  : progress >= 80
                  ? 'linear-gradient(90deg,#f97316,#ea580c)'
                  : 'linear-gradient(90deg,#7c3aed,#6d28d9)',
              }}
            />
          </div>
        )}

        {/* People avatars placeholder */}
        {code.useCount > 0 && (
          <div className={styles.userPills}>
            {code.usedByIds.slice(0, 5).map((uid, i) => (
              <div key={uid} className={styles.userPill} title={`User #${i + 1}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            ))}
            {code.useCount > 5 && (
              <div className={styles.userPillMore}>+{code.useCount - 5}</div>
            )}
            <span className={styles.userPillLabel}>
              {code.useCount === 1 ? 'used this code' : 'used this code'}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.copyBtn} ${copiedId === code.id ? styles.copyBtnDone : ''}`}
          onClick={() => onCopy(code.id)}
          disabled={expired || limitReached}
        >
          {copiedId === code.id ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy Code
            </>
          )}
        </button>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(code.id)}
          aria-label="Delete code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Main panel ──────────────────────────────────────────────
const MyRemixCodes: React.FC<MyRemixCodesProps> = ({ onClose }) => {
  const [codes, setCodes] = useState<MyRemixCode[]>(() => getMyRemixCodes());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const handleCopy = useCallback(async (codeId: string) => {
    const code = codes.find(c => c.id === codeId);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.fullCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = code.fullCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(codeId);
    setTimeout(() => setCopiedId(null), 2000);
  }, [codes]);

  const handleDelete = useCallback((id: string) => {
    deleteMyRemixCode(id);
    setCodes(prev => prev.filter(c => c.id !== id));
  }, []);

  const filtered = codes.filter(c => {
    if (filter === 'active') {
      const expired = isExpired(c.expiresAt);
      const limitReached = c.maxUses !== null && c.useCount >= c.maxUses;
      return !expired && !limitReached;
    }
    if (filter === 'expired') {
      return isExpired(c.expiresAt) || (c.maxUses !== null && c.useCount >= c.maxUses);
    }
    return true;
  });

  const activeCount = codes.filter(c => !isExpired(c.expiresAt) && !(c.maxUses !== null && c.useCount >= c.maxUses)).length;
  const totalUses = codes.reduce((s, c) => s + c.useCount, 0);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className={styles.title}>My Remix Codes</span>
          <div style={{ width: 44 }} />
        </div>

        {/* Stats bar */}
        {codes.length > 0 && (
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{codes.length}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: '#22c55e' }}>{activeCount}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum} style={{ color: '#a78bfa' }}>{totalUses}</span>
              <span className={styles.statLabel}>Total Uses</span>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {codes.length > 0 && (
          <div className={styles.filterTabs}>
            {(['all', 'active', 'expired'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={styles.body}>
          {codes.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </div>
              <p className={styles.emptyTitle}>No codes yet</p>
              <p className={styles.emptyDesc}>
                Generate a Remix code from any chat using the Remix button. Your codes will appear here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No {filter} codes</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filtered.map(code => (
                <CodeCard
                  key={code.id}
                  code={code}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRemixCodes;
