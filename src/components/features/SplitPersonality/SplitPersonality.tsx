import React, { useEffect, useRef, useState, useCallback } from 'react';
import { streamChatCompletion } from '@/lib/aiservice';
import styles from './SplitPersonality.module.css';

interface SplitPersonalityProps {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  modelId: string;
  onComplete: (fullDebate: string) => void;
  onClose: () => void;
}

interface CharacterState {
  content: string;   // final answer only (no <think>)
  thinking: string;  // thought content stripped from <think>
  done: boolean;
}

// Character definitions
const CHAR_A = {
  name: 'The Advocate',
  color: '#4d9ef7',
  gradient: 'linear-gradient(135deg, #1e40af, #4d9ef7)',
  icon: '⚡',
  role: "You strongly SUPPORT and defend the positive side of the user's topic. Be persuasive, confident, cite advantages.",
};

const CHAR_B = {
  name: 'The Skeptic',
  color: '#f97316',
  gradient: 'linear-gradient(135deg, #c2410c, #f97316)',
  icon: '🔥',
  role: "You strongly CHALLENGE and critique the user's topic. Be direct, cite drawbacks, risks, counterpoints.",
};

const JUDGE = {
  name: 'The Judge',
  color: '#a78bfa',
  gradient: 'linear-gradient(135deg, #6d28d9, #a78bfa)',
  icon: '⚖️',
};

// ── Streaming ref type ────────────────────────────────────────
interface StreamRef {
  answer: string;
  thinking: string;
  inThink: boolean;
  buffer: string;
}

const SplitPersonality: React.FC<SplitPersonalityProps> = ({
  userMessage, conversationHistory, modelId, onComplete, onClose
}) => {
  const [charA, setCharA] = useState<CharacterState>({ content: '', thinking: '', done: false });
  const [charB, setCharB] = useState<CharacterState>({ content: '', thinking: '', done: false });
  const [judgeContent, setJudgeContent] = useState('');
  const [judgeDone, setJudgeDone] = useState(false);
  const [phase, setPhase] = useState<'debating' | 'judging' | 'done'>('debating');

  const charARef = useRef<StreamRef>({ answer: '', thinking: '', inThink: false, buffer: '' });
  const charBRef = useRef<StreamRef>({ answer: '', thinking: '', inThink: false, buffer: '' });
  const judgeRef = useRef('');

  useEffect(() => {
    startDebate();
  }, []);

  // Parse streaming delta — separate <think>…</think> from answer
  const applyChunk = useCallback((ref: React.MutableRefObject<StreamRef>, delta: string) => {
    const buf = ref.current;
    buf.buffer += delta;
    while (buf.buffer.length > 0) {
      if (buf.inThink) {
        const closeIdx = buf.buffer.indexOf('</think>');
        if (closeIdx !== -1) {
          buf.thinking += buf.buffer.slice(0, closeIdx);
          buf.buffer = buf.buffer.slice(closeIdx + 8);
          buf.inThink = false;
        } else {
          buf.thinking += buf.buffer;
          buf.buffer = '';
        }
      } else {
        const openIdx = buf.buffer.indexOf('<think>');
        if (openIdx !== -1) {
          buf.answer += buf.buffer.slice(0, openIdx);
          buf.buffer = buf.buffer.slice(openIdx + 7);
          buf.inThink = true;
        } else {
          const partial = buf.buffer.match(/<(?:t(?:h(?:i(?:n(?:k)?)?)?)?)?$/);
          if (partial) {
            buf.answer += buf.buffer.slice(0, partial.index);
            buf.buffer = buf.buffer.slice(partial.index ?? buf.buffer.length);
            break;
          } else {
            buf.answer += buf.buffer;
            buf.buffer = '';
          }
        }
      }
    }
  }, []);

  // Wrap one character's stream in a Promise so we can await it
  const streamCharacter = (
    ref: React.MutableRefObject<StreamRef>,
    setState: React.Dispatch<React.SetStateAction<CharacterState>>,
    char: typeof CHAR_A,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<void> => {
    return new Promise((resolve) => {
      streamChatCompletion(
        {
          modelId,
          messages: [...history, { role: 'user', content: userMessage }],
          systemPrompt: `${char.role}\n\nRespond in 3-4 sentences max. Be bold and direct. Sign off as "${char.name}".`,
          temperature: 0.85,
          maxTokens: 400,
        },
        (chunk) => {
          applyChunk(ref, chunk);
          setState({ content: ref.current.answer, thinking: ref.current.thinking, done: false });
        },
        (full) => {
          applyChunk(ref, '');
          const cleanFull = full.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          ref.current.answer = ref.current.answer.trim() || cleanFull;
          setState({ content: ref.current.answer, thinking: ref.current.thinking, done: true });
          resolve();
        },
        (err) => {
          console.error(`${char.name} error:`, err);
          ref.current.answer = char === CHAR_A
            ? 'I strongly support this perspective — the benefits are clear and undeniable.'
            : 'I have serious doubts about this approach — the risks outweigh the rewards.';
          setState({ content: ref.current.answer, thinking: '', done: true });
          resolve();
        }
      );
    });
  };

  const startDebate = async () => {
    const history = conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // ── Step 1: Stream Advocate fully, then Skeptic, then Judge ──
    await streamCharacter(charARef, setCharA, CHAR_A, history);
    await streamCharacter(charBRef, setCharB, CHAR_B, history);
    startJudge();
  };

  const startJudge = () => {
    setPhase('judging');

    streamChatCompletion(
      {
        modelId,
        messages: [
          { role: 'user', content: `The topic: "${userMessage}"\n\nAdvocate said: "${charARef.current.answer}"\n\nSkeptic said: "${charBRef.current.answer}"\n\nAs the neutral Judge, give a fair 2-3 sentence verdict. Name who makes the stronger argument and why. Be decisive.` },
        ],
        systemPrompt: `You are a calm, neutral Judge. Analyze both sides fairly and deliver a clear verdict. Be concise (2-3 sentences). Start with "Verdict:" and end by naming the winner.`,
        temperature: 0.5,
        maxTokens: 200,
      },
      (chunk) => {
        judgeRef.current += chunk;
        setJudgeContent(judgeRef.current);
      },
      (full) => {
        judgeRef.current = full;
        setJudgeContent(full);
        setJudgeDone(true);
        setPhase('done');

        // Build final combined message (clean, no <think>)
        const combined = `__DEBATE__\n**⚡ The Advocate:**\n${charARef.current.answer}\n\n**🔥 The Skeptic:**\n${charBRef.current.answer}\n\n**⚖️ Judge's Verdict:**\n${full}`;
        onComplete(combined);
      },
      (err) => {
        console.error('Judge error:', err);
        const fallback = 'Verdict: Both sides raise valid points. The stronger argument depends on individual context and priorities.';
        judgeRef.current = fallback;
        setJudgeContent(fallback);
        setJudgeDone(true);
        setPhase('done');
        const combined = `__DEBATE__\n**⚡ The Advocate:**\n${charARef.current.answer}\n\n**🔥 The Skeptic:**\n${charBRef.current.answer}\n\n**⚖️ Judge's Verdict:**\n${fallback}`;
        onComplete(combined);
      }
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>⚖️</div>
          <div>
            <div className={styles.headerTitle}>Split-Personality Debate</div>
            <div className={styles.headerSub}>Two minds, one verdict</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Topic */}
        <div className={styles.topic}>
          <span className={styles.topicLabel}>Topic</span>
          <p className={styles.topicText}>
            {userMessage.length > 80 ? userMessage.slice(0, 78) + '…' : userMessage}
          </p>
        </div>

        <div className={styles.body}>
          {/* Character A */}
          <CharacterCard
            char={CHAR_A}
            content={charA.content}
            thinking={charA.thinking}
            done={charA.done}
            side="advocate"
          />

          <div className={styles.vsRow}>
            <div className={styles.vsDivider} />
            <span className={styles.vsText}>VS</span>
            <div className={styles.vsDivider} />
          </div>

          {/* Character B */}
          <CharacterCard
            char={CHAR_B}
            content={charB.content}
            thinking={charB.thinking}
            done={charB.done}
            side="skeptic"
          />

          {/* Judge */}
          {(phase === 'judging' || phase === 'done') && (
            <div className={styles.judgeSection}>
              <div className={styles.judgeHeader}>
                <div className={styles.judgeIcon} style={{ background: JUDGE.gradient }}>
                  {JUDGE.icon}
                </div>
                <div>
                  <div className={styles.judgeName}>{JUDGE.name}</div>
                  <div className={styles.judgeRole}>Neutral verdict</div>
                </div>
                {!judgeDone && <div className={styles.judgingBadge}>Deliberating…</div>}
                {judgeDone && <div className={styles.verdictBadge}>Verdict In</div>}
              </div>
              <div className={styles.judgeContent}>
                {judgeContent || <span className={styles.placeholder}>…</span>}
                {!judgeDone && <span className={styles.cursor} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'done' && (
          <div className={styles.footer}>
            <button className={styles.addToChat} onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Debate added to chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Character Card ────────────────────────────────────────────────────────────
interface CharProps {
  char: typeof CHAR_A;
  content: string;
  thinking: string;
  done: boolean;
  side: 'advocate' | 'skeptic';
}

const CharacterCard: React.FC<CharProps> = ({ char, content, thinking, done, side }) => {
  const [thinkOpen, setThinkOpen] = useState(false);
  const hasThinking = thinking.trim().length > 0;

  return (
    <div className={`${styles.charCard} ${styles[side]}`}>
      <div className={styles.charHeader}>
        <div className={styles.charIcon} style={{ background: char.gradient }}>
          {char.icon}
        </div>
        <div className={styles.charName} style={{ color: char.color }}>{char.name}</div>
        {!done && <div className={styles.streamingBadge}>Speaking…</div>}
      </div>

      {/* Collapsible thinking section — tap to reveal */}
      {(hasThinking || (!done && !content)) && (
        <div className={styles.thinkBlock}>
          <button
            className={styles.thinkToggle}
            onClick={() => setThinkOpen(v => !v)}
            aria-expanded={thinkOpen}
          >
            {!done && <span className={styles.thinkDot} />}
            <span className={styles.thinkLabel}>
              {done
                ? `💭 View reasoning (${thinking.trim().split(/\s+/).length} words)`
                : '💭 Thinking…'}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              style={{ transform: thinkOpen ? 'rotate(90deg)' : 'none', transition: '0.2s', marginLeft: 'auto', flexShrink: 0 }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          {thinkOpen && (
            <div className={styles.thinkContent}>
              {thinking.trim().split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className={styles.thinkLine}>{line}</p>
              ))}
              {!done && <span className={styles.cursor} />}
            </div>
          )}
        </div>
      )}

      <div className={styles.charContent}>
        {content || (done ? null : <span className={styles.placeholder}>Preparing argument…</span>)}
        {!done && content && <span className={styles.cursor} />}
      </div>
    </div>
  );
};

export default SplitPersonality;
