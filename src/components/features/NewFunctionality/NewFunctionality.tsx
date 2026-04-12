import React, { useState } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import styles from './NewFunctionality.module.css';

interface NewFunctionalityProps {
  onClose: () => void;
}

interface FeatureItem {
  key: 'echoRepliesEnabled' | 'ghostModeEnabled' | 'splitPersonalityEnabled' | 'silenceBreakerEnabled';
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  difficulty: string;
}

const FEATURES: FeatureItem[] = [
  {
    key: 'echoRepliesEnabled',
    emoji: '🪞',
    name: 'Echo Replies',
    tagline: 'AI mirrors your writing style',
    description: 'AI analyzes your last 10 messages — vocabulary, tone, emoji use — then mirrors it back in every response. Feels like it truly gets you.',
    color: '#4d9ef7',
    difficulty: '⭐⭐⭐',
  },
  {
    key: 'ghostModeEnabled',
    emoji: '👻',
    name: 'Ghost Mode',
    tagline: 'Hidden answers with emoji hints',
    description: 'AI answers are hidden until you tap "Reveal". But first, 3 emoji hints tease what\'s coming — adding mystery and suspense to every response.',
    color: '#a78bfa',
    difficulty: '⭐⭐',
  },
  {
    key: 'splitPersonalityEnabled',
    emoji: '⚖️',
    name: 'Split-Personality Debate',
    tagline: 'Two characters debate, one judge decides',
    description: 'Ask anything and watch The Advocate and The Skeptic argue both sides. A neutral Judge then delivers the final verdict.',
    color: '#f97316',
    difficulty: '⭐⭐⭐⭐',
  },
  {
    key: 'silenceBreakerEnabled',
    emoji: '⏰',
    name: 'Silence Breaker',
    tagline: 'AI notices when you\'re stuck',
    description: 'If you type but don\'t send for 10 seconds, AI gently offers to complete your sentence or send it as-is. Never get stuck again.',
    color: '#22c55e',
    difficulty: '⭐⭐⭐',
  },
];

const NewFunctionality: React.FC<NewFunctionalityProps> = ({ onClose }) => {
  const { settings, setSetting } = useAppSettings();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const handleToggle = (key: FeatureItem['key']) => {
    setSetting(key, !settings[key]);
  };

  const enabledCount = FEATURES.filter(f => settings[f.key]).length;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.handle} />

          {/* Header */}
          <div className={styles.header}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className={styles.headerCenter}>
              <span className={styles.headerTitle}>New Functionality</span>
              <span className={styles.headerBadge}>{enabledCount} active</span>
            </div>
            <div style={{ width: 44 }} />
          </div>

          <p className={styles.headerSub}>
            Experimental features that push the boundaries of AI chat. All off by default.
          </p>

          {/* Feature list */}
          <div className={styles.body}>
            {FEATURES.map(feature => {
              const isOn = settings[feature.key];
              const isExpanded = expandedKey === feature.key;

              return (
                <div
                  key={feature.key}
                  className={`${styles.featureCard} ${isOn ? styles.featureCardOn : ''}`}
                  style={isOn ? { borderColor: feature.color + '40', background: feature.color + '08' } : {}}
                >
                  {/* Main row */}
                  <div className={styles.featureRow}>
                    <button
                      className={styles.featureLeft}
                      onClick={() => setExpandedKey(isExpanded ? null : feature.key)}
                      aria-expanded={isExpanded}
                    >
                      <div
                        className={styles.featureEmoji}
                        style={isOn ? { background: feature.color + '20' } : {}}
                      >
                        {feature.emoji}
                      </div>
                      <div className={styles.featureInfo}>
                        <div className={styles.featureName} style={isOn ? { color: feature.color } : {}}>
                          {feature.name}
                        </div>
                        <div className={styles.featureTagline}>{feature.tagline}</div>
                      </div>
                    </button>

                    <div className={styles.featureRight}>
                      <Toggle
                        checked={isOn}
                        onChange={() => handleToggle(feature.key)}
                        color={feature.color}
                      />
                    </div>
                  </div>

                  {/* Expanded description */}
                  {isExpanded && (
                    <div className={styles.featureExpanded}>
                      <p className={styles.featureDesc}>{feature.description}</p>
                      <div className={styles.featureMeta}>
                        <span className={styles.difficultyLabel}>Complexity: {feature.difficulty}</span>
                        <span
                          className={styles.statusLabel}
                          style={{ color: isOn ? feature.color : 'var(--text-muted)' }}
                        >
                          {isOn ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <p className={styles.footerNote}>
              These features are experimental and may behave unexpectedly. Toggle them off anytime.
            </p>
          </div>
        </div>
      </div>

    </>
  );
};

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: () => void; color: string }> = ({ checked, onChange, color }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    style={{
      width: 50,
      height: 28,
      borderRadius: 14,
      border: 'none',
      background: checked ? color : 'var(--bg-quaternary)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3,
      left: checked ? 25 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    }} />
  </button>
);

export default NewFunctionality;
