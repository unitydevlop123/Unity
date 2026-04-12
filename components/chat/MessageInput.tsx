import React, { useState } from 'react';
import { Paperclip, Mic, Send, Smile } from 'lucide-react';

export default function MessageInput() {
  const [message, setMessage] = useState('');

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <button className="input-icon-btn">
          <Paperclip size={22} color="#8e8e93" />
        </button>
        <div className="text-input-field">
          <input 
            type="text" 
            placeholder="Message" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-box"
          />
          <button className="input-icon-btn emoji-btn">
            <Smile size={22} color="#8e8e93" />
          </button>
        </div>
        <button className="input-icon-btn send-btn">
          {message.trim() ? (
            <div className="send-circle">
              <Send size={18} color="#fff" fill="#fff" />
            </div>
          ) : (
            <Mic size={22} color="#8e8e93" />
          )}
        </button>
      </div>
      <style>{`
        .message-input-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          margin: 0 auto;
          max-width: 430px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 12px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
          z-index: 100;
          box-sizing: border-box;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .text-input-field {
          flex: 1;
          background: #1c1c1e;
          border-radius: 20px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .input-box {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 16px;
          outline: none;
          padding: 0;
          margin: 0;
        }

        .input-box::placeholder {
          color: #8e8e93;
        }

        .input-icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: all 0.2s ease;
        }

        .input-icon-btn:active {
          opacity: 0.6;
          transform: scale(0.9);
        }

        .send-circle {
          width: 32px;
          height: 32px;
          background: #0088cc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: -4px;
        }
      `}</style>
    </div>
  );
}
