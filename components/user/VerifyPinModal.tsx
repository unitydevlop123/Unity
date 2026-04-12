import React, { useState, useRef, useEffect } from 'react';
import { firebaseRest } from '../../services/firebaseRest';
import { pinService } from '../../services/pinService';
import '../../pages/Login.css';
import '../../pages/VerifyPin.css';

interface VerifyPinModalProps {
  userEmail: string;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

const VerifyPinModal: React.FC<VerifyPinModalProps> = ({ 
  userEmail, 
  onSuccess, 
  onClose,
  title = "Security Verification",
  subtitle = "Enter your 4-digit PIN to continue"
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
    const inputPin = pin.join('');
    if (inputPin.length < 4) {
      setError('Enter your 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const dbPin = await firebaseRest.getPin(userEmail);

      if (!dbPin || dbPin.code === undefined || dbPin.code === null) {
        setError(`Security error: PIN record not found for ${userEmail}.`);
        return;
      }

      if (pinService.isBlocked(dbPin.last_attempt, dbPin.attempts)) {
        setError('Too many attempts. Blocked for 5 minutes.');
        return;
      }

      const inputStr = String(inputPin).trim();
      const dbStr = String(dbPin.code).trim();

      if (inputStr === dbStr) {
        // Reset attempts
        await firebaseRest.updatePin(userEmail, {
          ...dbPin,
          attempts: 0,
          last_attempt: null
        });
        onSuccess();
      } else {
        const newAttempts = (dbPin.attempts || 0) + 1;
        await firebaseRest.updatePin(userEmail, {
          ...dbPin,
          attempts: newAttempts,
          last_attempt: new Date().toISOString()
        });
        setError(`Incorrect PIN. ${3 - newAttempts > 0 ? 3 - newAttempts + ' attempts left.' : 'Blocked for 5 minutes.'}`);
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="auth-page" style={{ zIndex: 3000 }}>
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

        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <div className="pin-inputs">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="pin-field"
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <div className="auth-error mt-4">{error}</div>}

        <button 
          className="auth-primary-btn w-full mt-8"
          onClick={handleVerify}
          disabled={isVerifying || pin.join('').length < 4}
        >
          {isVerifying ? 'Verifying...' : 'Verify Identity'}
        </button>
      </div>
    </div>
  );
};

export default VerifyPinModal;
