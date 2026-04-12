import React, { useState, useRef } from 'react';
import { Camera, Loader2, Check, ArrowLeft, ChevronRight, Copy, User, Shield, Globe, Info, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { firebaseRest } from '../../services/firebaseRest';
import { useAuth } from '../../context/AuthContext';
import './EditProfileModal.css';

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || user.name?.toLowerCase().replace(/\s+/g, '') || '');
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingField, setEditingField] = useState<'name' | 'username' | 'email' | 'bio' | 'location' | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');

  React.useEffect(() => {
    if (editingField !== 'username') return;

    const validateUsername = async () => {
      if (!username || username.length === 0) {
        setUsernameStatus('idle');
        setUsernameError('');
        return;
      }

      if (!/^[a-z]/.test(username)) {
        setUsernameStatus('invalid');
        setUsernameError('Username must start with a lowercase letter.');
        return;
      }
      
      if (/[^a-z0-9]/.test(username)) {
        setUsernameStatus('invalid');
        setUsernameError('No spaces or symbols allowed. Only lowercase letters and numbers.');
        return;
      }

      if (username.length < 5) {
        setUsernameStatus('invalid');
        setUsernameError('Username must be at least 5 characters long.');
        return;
      }

      setUsernameStatus('checking');
      setUsernameError('');
      
      const result = await firebaseRest.checkUsernameAvailability(username, user.email);
      if (result.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
        setUsernameError('This username is already taken.');
        setUsernameSuggestions(result.suggestions || []);
      }
    };

    const timeoutId = setTimeout(validateUsername, 200); // Reduced from 500ms to 200ms
    return () => clearTimeout(timeoutId);
  }, [username, editingField, user.email]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await firebaseRest.uploadProfileImage(user.email, file);
      setPhotoURL(url);
      // Optimistically update photoURL in global state if we want it instant
      updateUser({ ...user, photoURL: url });
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const newEmail = email.trim().toLowerCase();
    
    // Optimistic Update: Update global state immediately
    const updatedUser = { ...user, name, username, photoURL, email: newEmail, id: newEmail, bio, location };
    updateUser(updatedUser);
    
    // Instant feedback: Close modal or show success
    // The user said "instantly update", so let's close it right away or show a quick success state
    setIsSaving(true);
    
    try {
      if (newEmail !== user.email) {
        const exists = await firebaseRest.checkUserExists(newEmail);
        if (exists) {
          alert("This email is already in use by another account.");
          // Revert optimistic update
          updateUser(user);
          setIsSaving(false);
          return;
        }
        
        await firebaseRest.migrateUserEmail(user.email, newEmail);
        
        const keysToMigrate = [
          'unitydev_history',
          'unitydev_binge',
          'unitydev_settings',
          'stream_search_history',
          'unitydev_stream_videos'
        ];
        
        keysToMigrate.forEach(prefix => {
          const oldKey = `${prefix}_${user.email}`;
          const newKey = `${prefix}_${newEmail}`;
          const data = localStorage.getItem(oldKey);
          if (data) {
            localStorage.setItem(newKey, data);
            localStorage.removeItem(oldKey);
          }
        });
      }

      await firebaseRest.updateProfile(newEmail, {
        name,
        username,
        photoURL,
        bio,
        location
      });
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      // Revert optimistic update on error
      updateUser(user);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const link = `unitydev.app/@${username || 'user'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Row = ({ label, value, onClick, showChevron = true, icon: Icon }: { label: string, value: string, onClick?: () => void, showChevron?: boolean, icon?: any }) => (
    <div className="ep-row" onClick={onClick}>
      <span className="ep-row-label">{label}</span>
      <div className="ep-row-value-container">
        <span className="ep-row-value">{value}</span>
        {Icon && <Icon size={16} className="text-zinc-500" />}
        {showChevron && <ChevronRight size={18} className="text-zinc-600" />}
      </div>
    </div>
  );

  if (editingField) {
    const fieldLabels: Record<string, string> = {
      name: 'Name',
      username: 'Username',
      email: 'Email',
      bio: 'Bio',
      location: 'Location'
    };

    return (
      <div className="ep-edit-field-view">
        <div className="ep-header">
          <button 
            onClick={() => {
              if (editingField === 'username' && (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'checking')) {
                setUsername(user.username || user.name?.toLowerCase().replace(/\s+/g, '') || '');
              }
              setEditingField(null);
            }} 
            className="ep-back-btn"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="ep-header-title">Edit {fieldLabels[editingField]}</h2>
          <div style={{ flex: 1 }}></div>
          <button 
            onClick={() => {
              if (editingField === 'username' && (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'checking')) {
                return;
              }
              setEditingField(null);
            }} 
            style={{ 
              color: (editingField === 'username' && (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'checking')) ? '#64748b' : 'var(--app-accent)', 
              fontWeight: 600, 
              padding: '0.5rem',
              cursor: (editingField === 'username' && (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'checking')) ? 'not-allowed' : 'pointer'
            }}
          >
            Done
          </button>
        </div>
        <div className="ep-input-container">
          {editingField === 'email' || editingField === 'location' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ep-locked-field-container"
            >
              <div className="ep-locked-icon-wrapper">
                <Lock size={32} />
              </div>
              <h3 className="ep-locked-title">Secure Field</h3>
              <p className="ep-locked-description">
                {editingField === 'email' 
                  ? "For security purposes, your email address cannot be changed directly from your public profile settings. To update your email or other sensitive personal data, please visit the Account Settings menu."
                  : "To maintain a safe and authentic community, manual location updates are disabled. Your location is securely verified and updated automatically based on your active region to prevent fraudulent activity."}
              </p>
              <div className="ep-locked-current-value">
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '8px', display: 'block', marginLeft: '4px' }}>
                  Current {fieldLabels[editingField]}
                </span>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', color: '#fff', fontSize: '15px' }}>
                  {editingField === 'email' ? email : (location || 'Not set')}
                </div>
              </div>
            </motion.div>
          ) : editingField === 'bio' ? (
            <div style={{ position: 'relative' }}>
              <textarea 
                className="ep-textarea"
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 100))}
                placeholder="Write a short bio..."
                autoFocus
              />
              <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '12px', color: '#64748b' }}>
                {bio.length}/100
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                className="ep-input"
                style={{ 
                  borderColor: editingField === 'username' ? 
                    (usernameStatus === 'available' ? '#22c55e' : 
                     (usernameStatus === 'invalid' || usernameStatus === 'taken' ? '#ef4444' : 'rgba(255,255,255,0.1)')) 
                    : 'rgba(255,255,255,0.1)'
                }}
                value={
                  editingField === 'name' ? name : 
                  editingField === 'username' ? username : ''
                }
                onChange={e => {
                  if (editingField === 'name') setName(e.target.value);
                  if (editingField === 'username') setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                }}
                placeholder={`Add ${editingField}`}
                autoFocus
              />
              {editingField === 'username' && usernameStatus === 'checking' && (
                <div style={{ position: 'absolute', right: '16px', top: '16px' }}>
                  <Loader2 size={18} className="animate-spin text-zinc-400" />
                </div>
              )}
              {editingField === 'username' && usernameStatus === 'available' && (
                <div style={{ position: 'absolute', right: '16px', top: '16px' }}>
                  <Check size={18} className="text-green-500" />
                </div>
              )}
            </div>
          )}
          {editingField !== 'email' && editingField !== 'location' && (
            <div className="ep-input-hint">
              {editingField === 'username' ? (
                <>
                  <p style={{ color: usernameStatus === 'available' ? '#22c55e' : (usernameStatus === 'invalid' || usernameStatus === 'taken' ? '#ef4444' : '#64748b') }}>
                    {usernameError || (usernameStatus === 'available' ? 'Username is available!' : 'Usernames must start with a lowercase letter, contain at least 5 characters, and have no spaces or symbols.')}
                  </p>
                  {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ color: '#fff', marginBottom: '8px', fontSize: '13px' }}>Suggested usernames:</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {usernameSuggestions.map(s => (
                          <button 
                            key={s} 
                            onClick={() => setUsername(s)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '100px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : editingField === 'name' ? 'Your name is how you will appear to other members of the squad.' : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="ep-header">
        <button className="ep-back-btn" onClick={onClose}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="ep-header-title">Edit Profile</h2>
      </div>

      <div className="ep-content">
        {/* User Glassmorphism Card (Matches AI Usage) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ep-glass-card"
        >
          <div className="ep-avatar-section">
            <div className="ep-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
              {isUploading && (
                <div className="ep-avatar-overlay" style={{ opacity: 1 }}>
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
              )}
              <img 
                src={photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=10b981&color=fff`} 
                alt="Profile" 
                className="ep-avatar-img"
              />
              <div className="ep-avatar-overlay">
                <Camera size={28} className="text-white drop-shadow-md" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept="image/*"
              />
            </div>
            <button 
              className="ep-change-photo-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Photo
            </button>
          </div>
        </motion.div>

        {/* Section A: Identity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="ep-section-title">
            <User size={14} />
            Personal Information
          </div>
          <div className="ep-glass-card" style={{ padding: 0 }}>
            <Row label="Name" value={name || 'Add name'} onClick={() => setEditingField('name')} />
            <Row label="Username" value={username || 'Add username'} onClick={() => setEditingField('username')} />
            <Row 
              label="Profile Link" 
              value={copied ? 'Copied!' : `unitydev.app/@${username || 'user'}`} 
              onClick={handleCopyLink}
              showChevron={false}
              icon={copied ? Check : Copy}
            />
          </div>
        </motion.div>

        {/* Section B: Basic Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="ep-section-title">
            <Info size={14} />
            Basic Info
          </div>
          <div className="ep-glass-card" style={{ padding: 0 }}>
            <Row label="Bio" value={bio ? (bio.length > 25 ? bio.slice(0, 25) + '...' : bio) : 'Add a bio'} onClick={() => setEditingField('bio')} />
            <Row label="Location" value={location || 'Add location'} onClick={() => setEditingField('location')} />
            <Row label="Email" value={email || 'Add email'} onClick={() => setEditingField('email')} />
          </div>
        </motion.div>
      </div>

      {/* Floating Action Bar */}
      <div className="ep-action-bar">
        <button onClick={onClose} className="ep-btn-cancel">
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="ep-btn-save"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;
