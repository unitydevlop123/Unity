import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  time: string;
  sender: 'me' | 'other';
  status?: 'sent' | 'read';
}

const mockMessages: Message[] = [
  { id: 1, text: "Hey! How's it going?", time: "10:00 AM", sender: 'other' },
  { id: 2, text: "I'm doing great, thanks! Just working on the new chat app demo. 🚀", time: "10:01 AM", sender: 'me', status: 'read' },
  { id: 3, text: "That sounds awesome! Can't wait to see the final result.", time: "10:02 AM", sender: 'other' },
  { id: 4, text: "It's coming along nicely. The glassmorphism effect looks really clean on iOS.", time: "10:03 AM", sender: 'me', status: 'read' },
  { id: 5, text: "I agree, it's very modern and sleek. Keep it up!", time: "10:05 AM", sender: 'other' },
  { id: 6, text: "Will do! I'll send you a link to the beta soon.", time: "10:06 AM", sender: 'me', status: 'sent' },
];

export default function MessageList() {
  return (
    <div className="message-list-container">
      <div className="date-separator">
        <span className="date-text">March 24</span>
      </div>
      {mockMessages.map((msg) => (
        <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}`}>
          <div className={`message-bubble ${msg.sender}`}>
            <p className="message-text">{msg.text}</p>
            <div className="message-meta">
              <span className="message-time">{msg.time}</span>
              {msg.sender === 'me' && (
                <div className="status-icon">
                  {msg.status === 'read' ? (
                    <CheckCheck size={14} color="#4cd964" />
                  ) : (
                    <Check size={14} color="#8e8e93" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <style>{`
        .message-list-container {
          display: flex;
          flex-direction: column;
          padding: 16px 12px;
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .date-separator {
          display: flex;
          justify-content: center;
          margin: 12px 0;
        }

        .date-text {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .message-bubble-wrapper {
          display: flex;
          width: 100%;
        }

        .message-bubble-wrapper.me {
          justify-content: flex-end;
        }

        .message-bubble-wrapper.other {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 75%;
          padding: 8px 12px;
          border-radius: 18px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .message-bubble.me {
          background: #0088cc;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.other {
          background: #262628;
          color: #fff;
          border-bottom-left-radius: 4px;
        }

        .message-text {
          font-size: 16px;
          line-height: 1.4;
          margin: 0;
          word-wrap: break-word;
        }

        .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 2px;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .status-icon {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
