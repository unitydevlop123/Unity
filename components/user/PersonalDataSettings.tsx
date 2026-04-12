import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ChevronRight,
  KeyRound,
  Smartphone
} from 'lucide-react';
import '../../styles/SettingsShared.css';
import VerifyPinModal from './VerifyPinModal';
import ChangePasswordModal from './ChangePasswordModal';
import UpdateEmailModal from './UpdateEmailModal';

import { useAuth } from '../../context/AuthContext';

interface PersonalDataSettingsProps {
  onBack: () => void;
  userEmail: string;
}

const PersonalDataSettings: React.FC<PersonalDataSettingsProps> = ({ onBack, userEmail }) => {
  const { updateUser } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [activeAction, setActiveAction] = useState<'password' | 'email' | null>(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(userEmail);

  useEffect(() => {
    setCurrentEmail(userEmail);
  }, [userEmail]);

  const handleActionClick = (action: 'password' | 'email') => {
    setActiveAction(action);
    setIsPinVerified(false);
  };

  const handlePinSuccess = () => {
    setIsPinVerified(true);
  };

  const handleCloseModal = () => {
    setActiveAction(null);
    setIsPinVerified(false);
  };

  return (
    <div className="settings-page" style={{ zIndex: 100 }}>
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Personal Data</h2>
      </div>

      <div className="settings-content">
        {/* The Vault Section */}
        <div className="settings-section">
          <div className="settings-section-header">Personal Security (The Vault)</div>
          <div className="settings-card">
            
            {/* Change Password */}
            <button className="settings-row" onClick={() => handleActionClick('password')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <KeyRound size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Change Password</span>
                  <span className="settings-row-subtitle">Update your secure access key</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

            {/* Update Email */}
            <button className="settings-row" onClick={() => handleActionClick('email')}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <Mail size={20} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Update Email</span>
                  <span className="settings-row-subtitle">{currentEmail}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </button>

          </div>
        </div>

        {/* 2FA Section */}
        <div className="settings-section">
          <div className="settings-section-header">Enhanced Protection</div>
          <div className="settings-card">
            <div className="settings-row" onClick={() => setIs2FAEnabled(!is2FAEnabled)}>
              <div className="settings-row-content">
                <div className="settings-row-icon">
                  <ShieldCheck size={20} className={is2FAEnabled ? "text-emerald-500" : ""} />
                </div>
                <div className="settings-row-text">
                  <span className="settings-row-title">Two-Factor Authentication</span>
                  <span className="settings-row-subtitle">
                    {is2FAEnabled ? "Active • Protected" : "Add an extra layer of security"}
                  </span>
                </div>
              </div>
              <button className={`settings-toggle ${is2FAEnabled ? 'active' : ''}`}>
                <div className="settings-toggle-thumb" />
              </button>
            </div>
            {is2FAEnabled && (
              <div className="px-4 py-3 bg-emerald-500/10 border-t border-emerald-500/20">
                <p className="text-xs text-emerald-400 flex items-center gap-2">
                  <ShieldCheck size={12} />
                  Coming Soon: SMS & Authenticator App support
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      {activeAction && !isPinVerified && (
        <VerifyPinModal
          userEmail={currentEmail}
          onSuccess={handlePinSuccess}
          onClose={handleCloseModal}
          title="Security Verification"
          subtitle={`Enter your 4-digit PIN to ${activeAction === 'password' ? 'change your password' : 'update your email'}`}
        />
      )}

      {activeAction === 'password' && isPinVerified && (
        <ChangePasswordModal
          userEmail={currentEmail}
          onClose={handleCloseModal}
          onSuccess={() => {
            alert('Password updated successfully!');
            handleCloseModal();
          }}
        />
      )}

      {activeAction === 'email' && isPinVerified && (
        <UpdateEmailModal
          userEmail={currentEmail}
          onClose={handleCloseModal}
          onSuccess={(newEmail) => {
            alert('Email updated successfully!');
            updateUser({ email: newEmail, id: newEmail });
            setCurrentEmail(newEmail);
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

export default PersonalDataSettings;
