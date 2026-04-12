import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="search-bar">
      <div className="search-input">
        <Search size={18} className="search-icon" />
        <span className="search-text">Search</span>
      </div>
      <style>{`
        .search-bar {
          padding: 8px 12px;
          background: transparent;
          width: 100%;
          box-sizing: border-box;
        }
        
        .search-input {
          background: rgba(28, 28, 30, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          box-sizing: border-box;
        }
        
        .search-icon {
          color: #8e8e93;
        }
        
        .search-text {
          color: #8e8e93;
          font-size: 17px;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
