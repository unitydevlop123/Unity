
import React from 'react';
import './RateLimitMessage.css';

interface RateLimitProps {
  message: string;
  onClose: () => void;
}

const RateLimitMessage: React.FC<RateLimitProps> = ({ message, onClose }) => {
  const paragraphs = message.split('\n\n').filter(p => p.trim());
  const title = paragraphs[0].replace('🔔 ', '');
  const content = paragraphs.slice(1);

  return (
    <div className="rate-limit-overlay">
      <div className="rate-limit-card flyer-style">
        <div className="flyer-banner">
          <img 
            src="https://picsum.photos/seed/ai-tech/800/400" 
            alt="UnityDev AI" 
            className="flyer-image"
            referrerPolicy="no-referrer"
          />
          <div className="flyer-logo-container">
            <svg viewBox="0 0 100 100" className="flyer-logo">
              <circle cx="50" cy="50" r="48" fill="#10a37f" />
              <path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        <div className="rate-limit-content">
          <h2 className="flyer-title">{title}</h2>
          <div className="flyer-body">
            {content.map((paragraph, i) => (
              <p key={i} className="flyer-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        
        <div className="flyer-footer">
          <button className="rate-limit-button flyer-button" onClick={onClose}>
            Got it, UnityDev
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitMessage;
