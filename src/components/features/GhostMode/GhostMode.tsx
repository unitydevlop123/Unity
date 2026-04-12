import React, { useState, useEffect } from 'react';
import styles from './GhostMode.module.css';

interface GhostModeMessageProps {
  content: string;
  isStreaming?: boolean;
}

// Maps message themes to emoji hints
function generateEmojiHints(content: string): string[] {
  const lower = content.toLowerCase();
  const hints: string[] = [];

  // Topic detection → emoji
  if (lower.includes('money') || lower.includes('salary') || lower.includes('pay') || lower.includes('earn') || lower.includes('price') || lower.includes('cost')) hints.push('💰');
  if (lower.includes('work') || lower.includes('job') || lower.includes('career') || lower.includes('profession')) hints.push('💼');
  if (lower.includes('love') || lower.includes('relationship') || lower.includes('partner') || lower.includes('date')) hints.push('❤️');
  if (lower.includes('health') || lower.includes('exercise') || lower.includes('fitness') || lower.includes('diet') || lower.includes('sleep')) hints.push('💪');
  if (lower.includes('code') || lower.includes('program') || lower.includes('software') || lower.includes('develop') || lower.includes('debug')) hints.push('💻');
  if (lower.includes('learn') || lower.includes('study') || lower.includes('education') || lower.includes('school') || lower.includes('course')) hints.push('📚');
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation') || lower.includes('flight') || lower.includes('hotel')) hints.push('✈️');
  if (lower.includes('food') || lower.includes('eat') || lower.includes('cook') || lower.includes('recipe') || lower.includes('restaurant')) hints.push('🍽️');
  if (lower.includes('think') || lower.includes('consider') || lower.includes('reflect') || lower.includes('ponder')) hints.push('🤔');
  if (lower.includes('warn') || lower.includes('caution') || lower.includes('careful') || lower.includes('avoid') || lower.includes('risk')) hints.push('⚠️');
  if (lower.includes('success') || lower.includes('achieve') || lower.includes('win') || lower.includes('accomplish') || lower.includes('great')) hints.push('🏆');
  if (lower.includes('idea') || lower.includes('suggest') || lower.includes('recommend') || lower.includes('tip') || lower.includes('trick')) hints.push('💡');
  if (lower.includes('time') || lower.includes('schedule') || lower.includes('deadline') || lower.includes('plan') || lower.includes('week')) hints.push('⏰');
  if (lower.includes('happy') || lower.includes('joy') || lower.includes('fun') || lower.includes('enjoy') || lower.includes('excit')) hints.push('😄');
  if (lower.includes('sad') || lower.includes('difficult') || lower.includes('hard') || lower.includes('struggle') || lower.includes('challenge')) hints.push('😤');
  if (lower.includes('ask') || lower.includes('question') || lower.includes('wonder') || lower.includes('curious')) hints.push('🤝');
  if (lower.includes('business') || lower.includes('company') || lower.includes('startup') || lower.includes('market')) hints.push('📈');
  if (lower.includes('data') || lower.includes('research') || lower.includes('statistic') || lower.includes('study') || lower.includes('report')) hints.push('📊');

  // Sentiment-based fallbacks
  if (hints.length === 0) {
    if (lower.includes('!') || lower.includes('great') || lower.includes('amazing') || lower.includes('perfect')) {
      hints.push('🌟', '✅', '🎯');
    } else if (lower.includes('?') || lower.includes('however') || lower.includes('but') || lower.includes('although')) {
      hints.push('🤔', '💭', '⚖️');
    } else {
      hints.push('💡', '📝', '✨');
    }
  }

  // Return exactly 3 unique hints
  const unique = [...new Set(hints)];
  while (unique.length < 3) {
    const fallbacks = ['✨', '💬', '🔍', '📝', '🎯'];
    for (const f of fallbacks) {
      if (!unique.includes(f)) { unique.push(f); break; }
    }
  }
  return unique.slice(0, 3);
}

export const GhostModeMessage: React.FC<GhostModeMessageProps> = ({ content, isStreaming }) => {
  const [revealed, setRevealed] = useState(false);
  const [hints] = useState(() => generateEmojiHints(content));
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      const t = setTimeout(() => setHintVisible(true), 200);
      return () => clearTimeout(t);
    }
  }, [isStreaming]);

  if (isStreaming) {
    return (
      <div className={styles.ghostStreaming}>
        <div className={styles.ghostDot} />
        <div className={styles.ghostDot} style={{ animationDelay: '0.15s' }} />
        <div className={styles.ghostDot} style={{ animationDelay: '0.3s' }} />
      </div>
    );
  }

  if (revealed) {
    return (
      <div className={styles.revealedContent}>
        {content}
        <button className={styles.reHideBtn} onClick={() => setRevealed(false)} title="Hide again">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.ghostContainer} ${hintVisible ? styles.ghostVisible : ''}`}>
      <div className={styles.ghostBlur}>
        <div className={styles.blurText}>{content.slice(0, 60)}</div>
      </div>
      <div className={styles.ghostOverlay}>
        <div className={styles.hintRow}>
          {hints.map((emoji, i) => (
            <span
              key={i}
              className={styles.hintEmoji}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className={styles.hintLabel}>Hint — tap to reveal</p>
        <button className={styles.revealBtn} onClick={() => setRevealed(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Reveal Answer
        </button>
      </div>
    </div>
  );
};

export default GhostModeMessage;
