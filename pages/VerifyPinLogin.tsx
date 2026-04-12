import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseRest } from '../services/firebaseRest';
import { pinService } from '../services/pinService';
import './VerifyPin.css';

interface VerifyPinLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

const VerifyPinLogin: React.FC<VerifyPinLoginProps> = ({ onSuccess, onClose }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { finalizeLogin } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  let profileData = null;
  try {
    const savedProfile = sessionStorage.getItem('pending_login_profile');
    if (savedProfile && savedProfile !== 'undefined') {
      profileData = JSON.parse(savedProfile);
    }
  } catch (e) {
    console.error("Error parsing profile data", e);
  }

  useEffect(() => {
    if (!profileData) {
      onClose();
    }
    inputRefs.current[0]?.focus();
  }, [profileData]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;
    
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    
    if (digit && index < 3) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (!/^[0-9]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
      }
    }
  };

  const handleVerify = async () => {
    if (!profileData) return;
    const inputPin = pin.join('');
    if (inputPin.length < 4) {
      setError('Enter your 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      console.log(`[VerifyPinLogin] Fetching PIN for: ${profileData.email}`);
      const dbPin = await firebaseRest.getPin(profileData.email);
      
      console.log("[VerifyPinLogin] DB Response:", dbPin);
      console.log(`[VerifyPinLogin] Comparing Input: '${inputPin}' vs DB: '${dbPin?.code}'`);

      if (!dbPin) {
        setError(`Security error: PIN record not found for ${profileData.email}. Please contact support or register again.`);
        return;
      }
      
      if (dbPin.code === undefined || dbPin.code === null) {
        setError('Security error: PIN code missing in database.');
        return;
      }

      if (pinService.isBlocked(dbPin.last_attempt, dbPin.attempts)) {
        setError('Too many attempts. Blocked for 5 minutes.');
        return;
      }

      // STRICT STRING COMPARISON
      const inputStr = String(inputPin).trim();
      const dbStr = String(dbPin.code).trim();

      if (inputStr === dbStr) {
        console.log("[VerifyPinLogin] Success! PIN matched.");
        finalizeLogin(profileData);
        sessionStorage.removeItem('pending_login_profile');
        onSuccess();
      } else {
        console.warn("[VerifyPinLogin] Mismatch! Incrementing attempts.");
        const newAttempts = (dbPin.attempts || 0) + 1;
        await firebaseRest.updatePin(profileData.email, { 
          attempts: newAttempts,
          last_attempt: new Date().toISOString()
        });
        setError(`Wrong PIN. ${3 - newAttempts} attempts left.`);
      }
    } catch (err: any) {
      console.error("[VerifyPinLogin] Exception:", err);
      setError('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-close-x" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 100 100" className="logo-svg">
            <circle cx="50" cy="50" r="48" fill="#10a37f" />
            <path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="auth-title">2-Step Login</h1>
        <p className="auth-subtitle">Secure verification for {profileData?.email}. Enter your 4-digit security PIN.</p>

        <div className="pin-inputs">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { if (el) inputRefs.current[idx] = el; }}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="pin-field"
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <div className="auth-error mt-4">{error}</div>}

        <button 
          className="auth-primary-btn w-full mt-8" 
          onClick={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying PIN...' : 'Verify & Login'}
        </button>
      </div>
    </div>
  );
};

export default VerifyPinLogin;