import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', background: '#000', color: '#fff', gap: 16
    }}>
      <h1 style={{ fontSize: 48, fontWeight: 700 }}>404</h1>
      <p style={{ color: '#8e8e93', fontSize: 18 }}>Page not found</p>
      <a href="/" style={{ color: '#4d9ef7', fontSize: 16 }}>Go home</a>
    </div>
  );
};

export default NotFound;
