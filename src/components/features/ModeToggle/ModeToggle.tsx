import React from 'react';
import { Mode } from '@/types';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.toggle}>
        <button
          className={`${styles.option} ${mode === 'instant' ? styles.active : ''}`}
          onClick={() => onChange('instant')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={mode === 'instant' ? '#4d9ef7' : '#8e8e93'} xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>UnityDeV AI</span>
        </button>
        <button
          className={`${styles.option} ${mode === 'expert' ? styles.active : ''}`}
          onClick={() => onChange('expert')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={mode === 'expert' ? '#fff' : '#8e8e93'} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L8.5 8.5H2l5.5 4-2 7L12 16l6.5 3.5-2-7L22 8.5h-6.5L12 2z"/>
          </svg>
          <span>UnityDev Pro</span>
        </button>
      </div>

      <p className={styles.description}>
        {mode === 'instant'
          ? 'Fast responses for everyday conversations'
          : 'Deep reasoning for complex problems'}
      </p>
    </div>
  );
};

export default ModeToggle;
