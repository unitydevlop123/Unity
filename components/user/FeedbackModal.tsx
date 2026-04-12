import React, { useState } from 'react';
import { ArrowLeft, Send, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { firebaseRest } from '../../services/firebaseRest';
import '../../styles/SettingsShared.css';

interface FeedbackModalProps {
  user: any;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ user, onClose }) => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || rating === 0) return;

    setIsSending(true);
    try {
      await firebaseRest.sendFeedback(user.email, {
        message,
        rating,
        timestamp: new Date().toISOString()
      });
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      alert("Failed to send feedback. Please try again.");
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="settings-page">
        <div className="settings-content flex flex-col items-center justify-center h-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Thank You!</h2>
            <p className="text-zinc-400 max-w-xs mx-auto">Your feedback helps us make Unity TV better for everyone.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button onClick={onClose} className="settings-back-btn">
          <ArrowLeft size={24} />
        </button>
        <h2 className="settings-header-title">Send Feedback</h2>
      </div>

      {/* Content */}
      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">Rate your experience</div>
          <div className="settings-card p-6 flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={32} 
                  className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} 
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-2">
            {rating === 0 ? 'Tap a star to rate' : 
             rating === 5 ? 'Excellent!' : 
             rating === 4 ? 'Good' : 
             rating === 3 ? 'Okay' : 
             rating === 2 ? 'Could be better' : 'Poor'}
          </p>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">Tell us more</div>
          <div className="settings-card p-4">
            <div className="settings-input-group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind? Report a bug, suggest a feature, or just say hi."
                className="settings-input settings-textarea bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 mt-2 px-2">
            <AlertCircle size={14} className="text-zinc-500 mt-0.5" />
            <p className="text-xs text-zinc-500">
              Your feedback is anonymous unless you mention your contact info.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="settings-footer">
        <button 
          onClick={onClose}
          className="settings-btn settings-btn-secondary"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSending || !message.trim() || rating === 0}
          className="settings-btn settings-btn-primary"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Send size={18} />
              <span>Send Feedback</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
