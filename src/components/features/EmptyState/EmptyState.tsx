import React from 'react';
import { Mode, EmptyStateProps } from '@/types';
import ModeToggle from '@/components/features/ModeToggle/ModeToggle';
import UnityDevLogo from '@/components/features/Logo/UnityDevLogo';
import styles from './EmptyState.module.css';

const EmptyState: React.FC<EmptyStateProps> = ({ mode, onModeChange }) => {
  const modeLabel = mode === 'expert' ? 'UnityDev Pro' : 'UnityDeV AI';

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.iconTitle}>
          <UnityDevLogo size={64} />
          <h1 className={styles.title}>Start chatting with {modeLabel}</h1>
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>
    </div>
  );
};

export default EmptyState;
