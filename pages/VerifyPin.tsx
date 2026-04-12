import React, { useState, useRef, useEffect } from 'react';
import { useVerification } from '../context/VerificationContext';
import { pinService } from '../services/pinService';
import { firebaseRest } from '../services/firebaseRest';
import './VerifyPin.css';

interface VerifyPinProps {
  onSuccess: () => void;
  onClose: () => void;
}

const VerifyPin: React.FC<VerifyPinProps> = ({ onSuccess, onClose }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { verificationData, clearVerification } = useVerification();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Recovery email from sessionStorage if Context is lost
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const recoveredEmail = sessionStorage.getItem('pending_verification_email');
    if (recoveredEmail) {
      setSessionEmail(recoveredEmail);
    }
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
    const emailToVerify = verificationData?.email || sessionEmail;
    
    if (!emailToVerify) {
      setError('Verification session expired. Please register again.');
      return;
    }

    const inputPin = pin.join('');
    if (inputPin.length < 4) {
      setError('Enter your 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const dbPin = await firebaseRest.getPin(emailToVerify);
      
      console.log("DEBUG [VerifyPin]: Verifying for:", emailToVerify);
      console.log("DEBUG [VerifyPin]: Entered PIN:", inputPin, "DB Code:", dbPin?.code);

      if (!dbPin) {
        setError('Verification session expired');
        return;
      }

      if (pinService.isBlocked(dbPin.last_attempt, dbPin.attempts)) {
        setError('Too many attempts. Blocked for 5 minutes.');
        return;
      }

      if (pinService.isExpired(dbPin.expires_at)) {
        setError('PIN session has expired. Please register again.');
        return;
      }

      if (inputPin === String(dbPin.code)) {
        await firebaseRest.setVerified(emailToVerify);
        await firebaseRest.updatePin(emailToVerify, { verified: true });
        
        // Clean up session storage
        sessionStorage.removeItem('pending_verification_email');
        sessionStorage.removeItem('pending_verification_name');
        
        clearVerification();
        onSuccess();
      } else {
        const newAttempts = (dbPin.attempts || 0) + 1;
        await firebaseRest.updatePin(emailToVerify, { 
          attempts: newAttempts,
          last_attempt: new Date().toISOString()
        });
        setError(`Wrong PIN. ${3 - newAttempts} attempts left.`);
      }
    } catch (err) {
      console.error("DEBUG [VerifyPin]: Verification error:", err);
      setError('Verification failed');
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

        <h1 className="auth-title">Verify PIN</h1>
        <p className="auth-subtitle">Enter the 4-digit PIN you created for {verificationData?.email || sessionEmail}</p>

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
          {isVerifying ? 'Verifying...' : 'Verify PIN'}
        </button>
      </div>
    </div>
  );
};

export default VerifyPin;