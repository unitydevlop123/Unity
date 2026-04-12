import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const stories = [
  { id: 1, name: 'ELITES', image: 'https://csspicker.dev/api/image/?q=abstract+circle&image_type=photo', hasStory: true },
  { id: 2, name: 'Z/NG/OYO/...', image: 'https://csspicker.dev/api/image/?q=portrait+man&image_type=photo', hasStory: true },
  { id: 3, name: 'Z/🟢4394/...', image: 'https://csspicker.dev/api/image/?q=group+people&image_type=photo', hasStory: true, online: true },
  { id: 4, name: 'Z/NG/DEL/...', image: 'https://csspicker.dev/api/image/?q=woman+portrait&image_type=photo', hasStory: true },
];

export default function Stories() {
  const { user } = useAuth();

  const getInitials = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="stories">
      <div className="story-item my-story">
        <div className="story-avatar">
          <div className="avatar-circle">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="My Story" 
                className="story-img-me" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="avatar-letter">{getInitials()}</span>
            )}
          </div>
          <div className="add-btn">
            <Plus size={12} strokeWidth={3} />
          </div>
        </div>
        <span className="story-name">My Story</span>
      </div>
      
      {stories.map((story) => (
        <div key={story.id} className="story-item">
          <div className={`story-ring ${story.hasStory ? 'has-story' : ''}`}>
            <img src={story.image} alt={story.name} className="story-img" referrerPolicy="no-referrer" />
            {story.online && <div className="online-indicator"></div>}
          </div>
          <span className="story-name">{story.name}</span>
        </div>
      ))}
      
      <style>{`
        .stories {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          overflow-x: auto;
          background: transparent;
          scrollbar-width: none;
          width: 100%;
          box-sizing: border-box;
        }
        
        .stories::-webkit-scrollbar {
          display: none;
        }
        
        .story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 64px;
        }
        
        .story-avatar {
          position: relative;
          width: 64px;
          height: 64px;
        }
        
        .avatar-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5a623 0%, #f8e71c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .story-img-me {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        
        .avatar-letter {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        
        .add-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          background: #0088cc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border: 3px solid #000;
        }
        
        .story-ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          padding: 3px;
          position: relative;
        }
        
        .story-ring.has-story {
          background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%);
        }
        
        .story-img {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #000;
        }
        
        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #00c853;
          border-radius: 50%;
          border: 3px solid #000;
        }
        
        .story-name {
          font-size: 11px;
          color: #fff;
          text-align: center;
          max-width: 64px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
