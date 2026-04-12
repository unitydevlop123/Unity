import React, { useState } from 'react';
import { firebaseRest } from '../../services/firebaseRest';
import '../../pages/Login.css';

interface UpdateEmailModalProps {
  userEmail: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({ userEmail, onClose, onSuccess }) => {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (newEmail === userEmail) {
      setError('New email must be different from current email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const exists = await firebaseRest.checkUserExists(newEmail);
      if (exists) {
        setError('This email is already registered to another account');
        setIsLoading(false);
        return;
      }

      await firebaseRest.updateEmail(userEmail, newEmail);
      onSuccess(newEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
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
        
        <h1 className="auth-title">Update Email</h1>
        <p className="auth-subtitle">Enter your new email address.</p>

        <form onSubmit={handleSubmit} className="auth-form" style={{ width: '100%' }}>
          <div className="form-group">
            <label>New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g., new@example.com"
              required
            />
          </div>

          {error && <div className="auth-error mt-4">{error}</div>}

          <button 
            type="submit"
            disabled={isLoading || !newEmail}
            className="auth-primary-btn w-full mt-10"
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateEmailModal;
