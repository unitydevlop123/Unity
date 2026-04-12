import React, { useState, useEffect, useRef } from 'react';
import { encodeEmail } from '../utils/emailEncoder';
import { firebaseRest } from '../services/firebaseRest';
import './Login.css';

interface RegisterProps {
  onNavigateToLogin: () => void;
  onNavigateToVerify: () => void;
  onClose: () => void;
}

const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

type RegisterStep = 'profile' | 'create-pin' | 'confirm-pin';

const Register: React.FC<RegisterProps> = ({ onNavigateToLogin, onNavigateToVerify, onClose }) => {
  const [step, setStep] = useState<RegisterStep>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userPin, setUserPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState({ label: '', color: '#3c3c4a', width: '0%' });
  
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordComplex = hasMinLength && hasNumber && hasSymbol;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  useEffect(() => {
    if (!password) {
      setStrength({ label: '', color: '#3c3c4a', width: '0%' });
      return;
    }
    let count = 0;
    if (password.length >= 6) count++;
    if (password.length >= 10) count++;
    if (hasNumber) count++;
    if (hasSymbol) count++;
    if (/[A-Z]/.test(password)) count++;

    let s = { label: 'Weak', color: '#cf3d3d', width: '20%' };
    if (count >= 5) s = { label: 'Strong', color: '#10a37f', width: '100%' };
    else if (count >= 3) s = { label: 'Medium', color: '#f59e0b', width: '60%' };
    setStrength(s);
  }, [password]);

  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your name');
    if (!isEmailValid) return setError('Please enter a valid email address');
    if (!isPasswordComplex) return setError('Password must be 6+ chars, include a number and symbol');
    if (!passwordsMatch) return setError('Passwords do not match');

    setIsLoading(true);
    try {
      // CRITICAL: We encode the email and force lowercase for consistency
      const folder = encodeEmail(email);
      const url = `${FIREBASE_URL}/users/${folder}/profile.json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Step 1 Fetch Error: ${response.status} ${response.statusText}`);
        throw new Error(`Database error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data !== null && !data.error) {
        setError('❌ This email is already registered. Please sign in.');
        setIsLoading(false);
        return;
      }
      
      setStep('create-pin');
    } catch (err: any) {
      console.error("Step 1 Exception:", err);
      setError(`Connection error (${err.message}). Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInput = (index: number, value: string, currentPin: string[], setPin: (p: string[]) => void, refs: React.RefObject<(HTMLInputElement | null)[]>) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;
    
    const newPin = [...currentPin];
    newPin[index] = digit;
    setPin(newPin);
    
    if (digit && index < 3) {
      setTimeout(() => {
        refs.current?.[index + 1]?.focus();
      }, 10);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, currentPin: string[], refs: React.RefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs.current?.[index - 1]?.focus();
    }
    
    if (!/^[0-9]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
      }
    }
  };

  const handleCreatePinContinue = () => {
    const pinStr = userPin.join('');
    if (pinStr.length < 4) return setError('Please enter a 4-digit PIN');
    setError('');
    setStep('confirm-pin');
  };

  const handleFinalSubmit = async () => {
    const finalUserPin = userPin.join('');
    const finalConfirmPin = confirmPin.join('');

    if (finalUserPin !== finalConfirmPin) {
      return setError('PINs do not match. Please try again.');
    }

    setIsLoading(true);
    setError('');

    try {
      const folder = encodeEmail(email);

      // STEP 1.5: CLEAR OLD DATA IF EXISTS
      try {
        await firebaseRest.deleteUserAccount(email);
      } catch (e) {
        console.warn("Failed to clear old data, continuing...", e);
      }

      // STEP 2: SAVE ALL USER DATA TO FIREBASE (Awaiting each one for safety)

      // 2a. Save profile.json
      const profileRes = await fetch(`${FIREBASE_URL}/users/${folder}/profile.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: name,
          password: password,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          verified: true
        })
      });
      if (!profileRes.ok) throw new Error(`Profile Save Failed: ${profileRes.status}`);

      // 2b. Save settings.json
      const settingsRes = await fetch(`${FIREBASE_URL}/users/${folder}/settings.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          darkMode: true,
          selectedModel: 'llama-3.3-70b-versatile',
          language: 'English',
          notifications: true
        })
      });
      if (!settingsRes.ok) throw new Error(`Settings Save Failed: ${settingsRes.status}`);

      // 2c. Save pin.json
      const pinRes = await fetch(`${FIREBASE_URL}/users/${folder}/pin.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: finalUserPin,
          created_at: new Date().toISOString(),
          attempts: 0
        })
      });
      if (!pinRes.ok) throw new Error(`PIN Save Failed: ${pinRes.status}`);

      // 2d. Initialize conversations folder
      const convRes = await fetch(`${FIREBASE_URL}/users/${folder}/conversations/placeholder.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Folder created',
          timestamp: new Date().toISOString()
        })
      });
      if (!convRes.ok) throw new Error(`Workspace Init Failed: ${convRes.status}`);

      // SUCCESS: Notify parent and redirect
      onNavigateToVerify();
    } catch (err: any) {
      console.error("Registration Save Error:", err);
      setError(`Registration failed: ${err.message}`);
    } finally {
      setIsLoading(false);
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

        <div className="step-indicator">
          <div className={`step-dot ${step === 'profile' ? 'active' : 'done'}`}></div>
          <div className={`step-dot ${step === 'create-pin' ? 'active' : step === 'confirm-pin' ? 'done' : ''}`}></div>
          <div className={`step-dot ${step === 'confirm-pin' ? 'active' : ''}`}></div>
        </div>

        <h1 className="auth-title">
          {step === 'profile' && 'Create account'}
          {step === 'create-pin' && 'Create security PIN'}
          {step === 'confirm-pin' && 'Confirm your PIN'}
        </h1>
        <p className="auth-subtitle">
          {step === 'profile' && 'Join UnityDev AI today'}
          {step === 'create-pin' && 'Choose a 4-digit code for your account'}
          {step === 'confirm-pin' && 'Please re-type your PIN to verify'}
        </p>

        {error && <div className="auth-error mb-4">{error}</div>}

        {step === 'profile' && (
          <form onSubmit={handleStep1Continue} className="auth-form">
            <div className="form-group">
              <label>Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. John Doe" disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" className={email && !isEmailValid ? 'invalid' : ''} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>Password {strength.label && <span className="strength-text" style={{ color: strength.color }}>{strength.label}</span>}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 characters" disabled={isLoading} />
              {password && (
                <div className="strength-container">
                  <div className="strength-bar-bg"><div className="strength-bar-fill" style={{ width: strength.width, backgroundColor: strength.color }}></div></div>
                  <div className="validation-hint">6+ chars, number, and symbol required</div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" className={confirmPassword && !passwordsMatch ? 'invalid' : ''} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <button type="submit" className="auth-primary-btn" disabled={isLoading || !isEmailValid || !isPasswordComplex || !passwordsMatch}>
              {isLoading ? 'Checking system...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'create-pin' && (
          <div className="auth-form text-center">
            <div className="pin-inputs-grid">
              {userPin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { pinInputRefs.current[idx] = el; }}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoFocus={idx === 0}
                  value={digit}
                  onChange={e => handlePinInput(idx, e.target.value, userPin, setUserPin, pinInputRefs)}
                  onKeyDown={e => handlePinKeyDown(idx, e, userPin, pinInputRefs)}
                  className="pin-digit-input"
                />
              ))}
            </div>
            <button className="auth-primary-btn w-full mt-10" onClick={handleCreatePinContinue}>Set PIN</button>
            <button className="auth-secondary-link" onClick={() => setStep('profile')}>Go back</button>
          </div>
        )}

        {step === 'confirm-pin' && (
          <div className="auth-form text-center">
            <div className="pin-inputs-grid">
              {confirmPin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { confirmPinInputRefs.current[idx] = el; }}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoFocus={idx === 0}
                  value={digit}
                  onChange={e => handlePinInput(idx, e.target.value, confirmPin, setConfirmPin, confirmPinInputRefs)}
                  onKeyDown={e => handlePinKeyDown(idx, e, confirmPin, confirmPinInputRefs)}
                  className="pin-digit-input"
                />
              ))}
            </div>
            <button className="auth-primary-btn w-full mt-10" onClick={handleFinalSubmit} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Confirm & Register'}
            </button>
            <button className="auth-secondary-link" onClick={() => setStep('create-pin')}>Change PIN</button>
          </div>
        )}

        {step === 'profile' && (
          <button className="auth-secondary-link" onClick={onNavigateToLogin}>
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default Register;