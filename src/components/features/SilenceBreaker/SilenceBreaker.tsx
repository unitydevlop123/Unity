import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './SilenceBreaker.module.css';

interface SilenceBreakerProps {
  inputValue: string;       // current textarea value
  isDisabled: boolean;      // chat is streaming / disabled
  onSuggest: (text: string) => void; // inject suggestion into input
  onSend: (text: string) => void;    // send directly
  enabled: boolean;
}

const SUGGESTIONS = [
  "Need help finishing that thought?",
  "Stuck? I can complete that for you.",
  "Want me to rephrase what you're trying to say?",
  "Looks like you might be struggling — want a hint?",
  "I can help you say that more clearly.",
  "Take your time — or let me suggest something.",
];

const COMPLETIONS = [
  "…could you explain this in simpler terms?",
  "…what would you recommend?",
  "…can you give me an example?",
  "…is there a better way to do this?",
  "…what are the pros and cons?",
];

const HESITATION_MS = 10_000; // 10 seconds of typing without sending

const SilenceBreaker: React.FC<SilenceBreakerProps> = ({
  inputValue, isDisabled, onSuggest, onSend, enabled
}) => {
  const [visible, setVisible] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [completion, setCompletion] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValueRef = useRef('');
  const lastChangeRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (!enabled || isDisabled) { clear(); return; }

    // User cleared the input — hide
    if (!inputValue.trim()) {
      clear();
      prevValueRef.current = '';
      return;
    }

    // Input changed — reset dismissed state so it can show again
    if (inputValue !== prevValueRef.current) {
      prevValueRef.current = inputValue;
      lastChangeRef.current = Date.now();
      setDismissed(false);
      setVisible(false);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        if (dismissed) return;
        const s = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
        const c = inputValue + COMPLETIONS[Math.floor(Math.random() * COMPLETIONS.length)];
        setSuggestion(s);
        setCompletion(c);
        setVisible(true);
      }, HESITATION_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputValue, isDisabled, enabled, dismissed, clear]);

  if (!visible || !enabled) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div className={styles.icon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <p className={styles.message}>{suggestion}</p>
          <button
            className={styles.dismissBtn}
            onClick={() => { setVisible(false); setDismissed(true); }}
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => { onSuggest(completion); setVisible(false); setDismissed(true); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Complete my sentence
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => { onSend(inputValue); setVisible(false); setDismissed(true); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
            Send as-is
          </button>
        </div>
      </div>
    </div>
  );
};

export default SilenceBreaker;
