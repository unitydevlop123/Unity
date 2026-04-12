import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToVerify: () => void;
  onNavigateToPinLogin: () => void;
  onSuccess: () => void;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateToRegister, onNavigateToPinLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const res = await login(trimmedEmail, password);
    
    if (res.success) {
      // Step 1 Success: Email + Password match. 
      // ALWAYS proceed to Step 2: PIN Verification (2FA) for every login.
      sessionStorage.setItem('pending_login_profile', JSON.stringify(res.profile));
      onNavigateToPinLogin();
    } else {
      setError(res.message || 'Invalid email or password.');
    }
    setIsLoading(false);
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your UnityDev AI account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label>Email address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoFocus
              placeholder="name@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-primary-btn" disabled={isLoading}>
            {isLoading ? 'Checking credentials...' : 'Continue'}
          </button>
        </form>

        <button className="auth-secondary-link" onClick={onNavigateToRegister}>
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
};

export default Login;