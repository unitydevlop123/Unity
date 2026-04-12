import React from 'react';
import { 
  Gamepad2, Play, Users, 
  Clock, Eye, MessageSquare, 
  Trash2, Search, Filter, Activity,
  Plus, MoreHorizontal, Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import './GamesPage.css';

interface GamesPageProps {
  isCompact: boolean;
}

const GamesPage: React.FC<GamesPageProps> = ({ isCompact }) => {
  const videos = [
    { id: '1', title: 'Cyberpunk 2077: Phantom Liberty', author: 'Ghost_Admin', views: '1.2M', date: '2d ago', duration: '12:44', category: 'Action', thumbnail: 'https://picsum.photos/seed/game1/800/450' },
    { id: '2', title: 'Elden Ring: Shadow of the Erdtree', author: 'Neo_Matrix', views: '842K', date: '4d ago', duration: '24:12', category: 'RPG', thumbnail: 'https://picsum.photos/seed/game2/800/450' },
    { id: '3', title: 'Starfield: Constellation Guide', author: 'Unity_Node', views: '420K', date: '1w ago', duration: '15:30', category: 'Sci-Fi', thumbnail: 'https://picsum.photos/seed/game3/800/450' },
    { id: '4', title: "Baldur's Gate 3: Speedrun", author: 'Trinity_Core', views: '2.4M', date: '2w ago', duration: '42:01', category: 'Strategy', thumbnail: 'https://picsum.photos/seed/game4/800/450' },
  ];

  return (
    <div className={`ga-page ${isCompact ? 'compact' : ''}`}>
      <header className="ga-header">
        <div className="ga-title-group">
          <h1 className="ga-title">Content Hub</h1>
          <p className="ga-subtitle">Manage global gaming content & neural media streams</p>
        </div>
        <div className="ga-header-actions">
          <div className="ga-search-box">
            <Search size={18} className="text-white/20" />
            <input type="text" placeholder="Search library..." />
          </div>
          <button className="ga-add-btn">
            <Plus size={18} />
            Upload Content
          </button>
        </div>
      </header>

      <div className="ga-categories">
        {['All Content', 'Action', 'RPG', 'Sci-Fi', 'Strategy', 'Simulation'].map((cat, i) => (
          <button key={cat} className={`ga-cat-btn ${i === 0 ? 'active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="ga-content-grid">
        {videos.map((video, i) => (
          <motion.div 
            key={video.id} 
            className="ga-video-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="ga-thumb-wrapper">
              <img src={video.thumbnail} alt={video.title} className="ga-thumb" />
              <div className="ga-thumb-overlay">
                <div className="ga-play-btn">
                  <Play size={24} fill="currentColor" />
                </div>
              </div>
              <div className="ga-badge category">{video.category}</div>
              <div className="ga-badge duration">{video.duration}</div>
            </div>
            <div className="ga-video-info">
              <h3 className="ga-video-title">{video.title}</h3>
              <div className="ga-video-meta">
                <span className="ga-author">{video.author}</span>
                <span className="ga-dot">•</span>
                <span className="ga-views">{video.views} views</span>
                <span className="ga-dot">•</span>
                <span className="ga-date">{video.date}</span>
              </div>
              <div className="ga-video-actions">
                <div className="ga-social-stats">
                  <span className="ga-social-item"><Eye size={14} /> {video.views}</span>
                  <span className="ga-social-item"><MessageSquare size={14} /> 1.2k</span>
                </div>
                <div className="ga-action-group">
                  <button className="ga-icon-btn"><Share2 size={16} /></button>
                  <button className="ga-icon-btn danger"><Trash2 size={16} /></button>
                  <button className="ga-icon-btn"><MoreHorizontal size={16} /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
