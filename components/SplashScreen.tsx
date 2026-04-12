import React, { useEffect, useRef } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="brand-logo auth-logo">
          <svg viewBox="0 0 100 100" className="logo-svg"><circle cx="50" cy="50" r="48" fill="#10a37f" /><path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" /></svg>
        </div>
        <h1 className="splash-title">UNITYDEV PRO</h1>
        <p className="splash-subtitle">ELITE STREAMING EXPERIENCE</p>
      </div>
    </div>
  );
};

export default SplashScreen;
