import React from 'react';

export default function StatusBar() {
  return (
    <div className="status-bar">
      <span className="time">9:41</span>
      <div className="status-icons">
        <span className="signal">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <rect x="12" y="2" width="2" height="8" rx="1" fill="white"/>
            <rect x="8" y="4" width="2" height="6" rx="1" fill="white"/>
            <rect x="4" y="6" width="2" height="4" rx="1" fill="white"/>
            <rect x="0" y="8" width="2" height="2" rx="1" fill="white"/>
          </svg>
        </span>
        <span className="lte">LTE</span>
        <span className="battery">
          <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
            <rect x="0.5" y="0.5" width="23" height="11" rx="2.5" stroke="white" strokeOpacity="0.35"/>
            <rect x="2" y="2" width="19" height="9" rx="1.5" fill="white"/>
            <path d="M25 4.5C25.2761 4.5 25.5 4.72386 25.5 5V8C25.5 8.27614 25.2761 8.5 25 8.5V4.5Z" fill="white" fillOpacity="0.4" stroke="white"/>
          </svg>
        </span>
      </div>
      <style>{`
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 20px 4px;
          background: #000;
        }
        
        .time {
          font-size: 17px;
          font-weight: 600;
          color: #fff;
        }
        
        .status-icons {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .lte {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
}
