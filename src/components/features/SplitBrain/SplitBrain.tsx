import React, { useEffect, useRef, useState } from 'react';
import { AI_MODELS, chatCompletion } from '@/lib/aiservice';
import styles from './SplitBrain.module.css';

// ── Inline markdown renderer (mirrors ChatMessage) ─────────────
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return segments.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={`${keyPrefix}-b${j}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={`${keyPrefix}-c${j}`} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', fontSize: '0.88em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    return <React.Fragment key={`${keyPrefix}-t${j}`}>{part}</React.Fragment>;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const output: React.ReactNode[] = [];
  let paraLines: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (paraLines.length === 0) return;
    const content: React.ReactNode[] = [];
    paraLines.forEach((l, i) => {
      content.push(...parseInline(l, `p${key}-${i}`));
      if (i < paraLines.length - 1) content.push(<br key={`br${key}-${i}`} />);
    });
    output.push(<p key={`para-${key++}`} style={{ margin: '0 0 8px', lineHeight: 1.6, fontSize: 15, color: 'var(--text-primary)' }}>{content}</p>);
    paraLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushPara();
      output.push(<hr key={`hr-${key++}`} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '10px 0' }} />);
      continue;
    }
    if (trimmed === '') { flushPara(); continue; }
    if (/^\d+\.\s/.test(line)) {
      flushPara();
      output.push(<p key={`li-${key++}`} style={{ margin: '2px 0', paddingLeft: 16, fontSize: 15, color: 'var(--text-primary)' }}>{parseInline(line, `li${key}`)}</p>);
      continue;
    }
    if (/^[\-\*]\s/.test(line)) {
      flushPara();
      output.push(<p key={`bul-${key++}`} style={{ margin: '2px 0', paddingLeft: 16, fontSize: 15, color: 'var(--text-primary)' }}>{'• '}{parseInline(line.slice(2), `bul${key}`)}</p>);
      continue;
    }
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      flushPara();
      const lvl = hm[1].length;
      const sz = lvl === 1 ? 18 : lvl === 2 ? 16 : 15;
      const wt = lvl === 1 ? 700 : 600;
      output.push(<p key={`h-${key++}`} style={{ margin: '10px 0 4px', fontSize: sz, fontWeight: wt, color: 'var(--text-primary)' }}>{parseInline(hm[2], `hd${key}`)}</p>);
      continue;
    }
    paraLines.push(line);
  }
  flushPara();
  return output;
}

// ── Parse <think> tags from raw response ──────────────────────
function parseThinkTags(raw: string): { thought: string; answer: string } {
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/i);
  const thought = thinkMatch ? thinkMatch[1].trim() : '';
  const answer = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return { thought, answer };
}

interface SplitBrainProps {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
  primaryModelId: string;
  onPickWinner: (content: string, modelId: string) => void;
  onClose: () => void;
}

interface PanelState {
  answer: string;   // clean answer (think tags stripped)
  thought: string;  // thought content if any
  loading: boolean;
  error: boolean;
}

const SplitBrain: React.FC<SplitBrainProps> = ({
  userMessage,
  conversationHistory,
  systemPrompt,
  primaryModelId,
  onPickWinner,
  onClose,
}) => {
  const [left, setLeft] = useState<PanelState>({ answer: '', thought: '', loading: true, error: false });
  const [right, setRight] = useState<PanelState>({ answer: '', thought: '', loading: true, error: false });
  const [picked, setPicked] = useState<'left' | 'right' | null>(null);
  const [leftThoughtOpen, setLeftThoughtOpen] = useState(false);
  const [rightThoughtOpen, setRightThoughtOpen] = useState(false);

  const hasFetched = useRef(false);

  const modelInfo = AI_MODELS.find(m => m.id === primaryModelId);
  const modelLabel = modelInfo?.label ?? primaryModelId;

  // Build the messages array once
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Call the SAME model twice in parallel — each finishes independently
    const callA = chatCompletion({
      modelId: primaryModelId,
      messages,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });

    const callB = chatCompletion({
      modelId: primaryModelId,
      messages,
      systemPrompt,
      temperature: 0.8, // slightly different temperature for variation
      maxTokens: 1500,
    });

    // Each resolves independently — no waiting for the other
    callA
      .then(result => {
        const { thought, answer } = parseThinkTags(result.content);
        setLeft({ answer, thought, loading: false, error: false });
      })
      .catch(err => {
        console.error('Split-Brain A error:', err);
        setLeft({ answer: '', thought: '', loading: false, error: true });
      });

    callB
      .then(result => {
        const { thought, answer } = parseThinkTags(result.content);
        setRight({ answer, thought, loading: false, error: false });
      })
      .catch(err => {
        console.error('Split-Brain B error:', err);
        setRight({ answer: '', thought: '', loading: false, error: true });
      });
  }, []); // Run once on mount

  const handlePick = (side: 'left' | 'right') => {
    if (picked) return;
    setPicked(side);
    const winner = side === 'left' ? left : right;
    setTimeout(() => {
      onPickWinner(winner.answer, primaryModelId);
      onClose();
    }, 700);
  };

  const bothDone = !left.loading && !right.loading;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brainIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4d9ef7" strokeWidth="2">
              <rect x="2" y="3" width="9" height="18" rx="2"/>
              <rect x="13" y="3" width="9" height="18" rx="2"/>
            </svg>
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.title}>Split-Brain Mode</span>
            <span className={styles.modelPill}>{modelLabel}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Question bar */}
        <div className={styles.questionBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.5 }}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className={styles.questionText}>
            {userMessage.length > 90 ? userMessage.slice(0, 88) + '…' : userMessage}
          </span>
        </div>

        {/* Side-by-side panels */}
        <div className={styles.panels}>

          {/* LEFT — Response A */}
          <div className={`${styles.panel} ${picked === 'left' ? styles.panelWinner : picked === 'right' ? styles.panelLoser : ''}`}>
            <div className={styles.panelHeader}>
              <div className={styles.modelBadge} style={{ background: 'rgba(77,158,247,0.15)', color: '#4d9ef7' }}>A</div>
              <span className={styles.modelName}>Response A</span>
              {left.loading && <div className={styles.dot} />}
            </div>
            <div className={styles.panelBody}>
              {left.loading ? (
                <PanelLoading />
              ) : left.error ? (
                <PanelError />
              ) : (
                <>
                  {left.thought ? (
                    <div className={styles.thoughtBlock}>
                      <button
                        className={styles.thoughtBtn}
                        onClick={() => setLeftThoughtOpen(v => !v)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        <span>Thought</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: leftThoughtOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      {leftThoughtOpen && (
                        <div className={styles.thoughtContent}>
                          {left.thought.split('\n').filter(l => l.trim()).map((line, i) => (
                            <p key={i} className={styles.thoughtLine}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className={styles.responseText}>{renderMarkdown(left.answer)}</div>
                </>
              )}
            </div>
            {!left.loading && !left.error && !picked && (
              <button
                className={`${styles.pickBtn} ${styles.pickBtnLeft}`}
                onClick={() => handlePick('left')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Pick A
              </button>
            )}
            {picked === 'left' && <div className={styles.winnerBanner}>🏆 Winner!</div>}
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.vsCircle}>VS</div>
          </div>

          {/* RIGHT — Response B */}
          <div className={`${styles.panel} ${picked === 'right' ? styles.panelWinner : picked === 'left' ? styles.panelLoser : ''}`}>
            <div className={styles.panelHeader}>
              <div className={styles.modelBadge} style={{ background: 'rgba(255,160,50,0.15)', color: '#ff9f2f' }}>B</div>
              <span className={styles.modelName}>Response B</span>
              {right.loading && <div className={styles.dot} style={{ background: '#ff9f2f' }} />}
            </div>
            <div className={styles.panelBody}>
              {right.loading ? (
                <PanelLoading />
              ) : right.error ? (
                <PanelError />
              ) : (
                <>
                  {right.thought ? (
                    <div className={styles.thoughtBlock}>
                      <button
                        className={styles.thoughtBtn}
                        onClick={() => setRightThoughtOpen(v => !v)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        <span>Thought</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: rightThoughtOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      {rightThoughtOpen && (
                        <div className={styles.thoughtContent}>
                          {right.thought.split('\n').filter(l => l.trim()).map((line, i) => (
                            <p key={i} className={styles.thoughtLine}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className={styles.responseText}>{renderMarkdown(right.answer)}</div>
                </>
              )}
            </div>
            {!right.loading && !right.error && !picked && (
              <button
                className={`${styles.pickBtn} ${styles.pickBtnRight}`}
                onClick={() => handlePick('right')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Pick B
              </button>
            )}
            {picked === 'right' && <div className={styles.winnerBanner}>🏆 Winner!</div>}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {bothDone && !picked
            ? 'Both responses use your selected model — pick the better one'
            : !bothDone
            ? 'Both responses generating simultaneously…'
            : null}
        </div>
      </div>
    </div>
  );
};

// Shimmer loading state for a panel
const PanelLoading: React.FC = () => (
  <div className={styles.streamingPlaceholder}>
    {[100, 75, 85, 60, 90].map((w, i) => (
      <div key={i} className={styles.shimmer} style={{ width: `${w}%` }} />
    ))}
  </div>
);

// Error state for a panel
const PanelError: React.FC = () => (
  <div className={styles.errorState}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>Response unavailable</span>
  </div>
);

export default SplitBrain;
