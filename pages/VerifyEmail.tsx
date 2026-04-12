import React, { useState, useRef, useEffect } from 'react';
import { useVerification } from '../context/VerificationContext';
import { verificationService } from '../services/verificationService';
import { emailService } from '../services/emailService';
import './VerifyEmail.css';

interface VerifyEmailProps {
  onSuccess: () => void;
  onClose: () => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ onSuccess, onClose }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const { verificationData, clearVerification } = useVerification();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!verificationData) return;
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    const result = verificationService.validateCode(
      fullCode, 
      verificationData.code, 
      verificationData.expiresAt
    );

    if (result.valid) {
      setTimeout(() => {
        clearVerification();
        onSuccess();
      }, 1000);
    } else {
      setError(result.error || 'Invalid code');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !verificationData) return;
    
    setError('');
    const newCode = verificationService.generateCode();
    await emailService.sendVerificationEmail(verificationData.email, newCode);
    setResendTimer(60);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
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

        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">We sent a 6-digit code to {verificationData?.email}</p>

        {/* FALLBACK MODE UI */}
        <div className="fallback-code-box">
          <span className="fallback-label">DEBUG FALLBACK:</span>
          <span className="fallback-value">{verificationData?.code || "------"}</span>
        </div>

        <div className="verify-container">
          {error && <div className="auth-error mb-4">{error}</div>}
          
          <div className="code-inputs">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { if (el) inputRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="code-field"
                disabled={isVerifying}
              />
            ))}
          </div>

          <button 
            className="auth-primary-btn w-full mt-8" 
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>

          <div className="resend-section">
            <button 
              className={`resend-link ${resendTimer > 0 ? 'disabled' : ''}`}
              onClick={handleResend}
              disabled={resendTimer > 0}
            >
              Resend code {resendTimer > 0 && `(${resendTimer}s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;