import React, { useEffect, useState } from 'react';
import '../App.css';

const PublicUserProfile = ({ userId, onBack }) => {
  const [media, setMedia] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMedia = async () => {
      try {
        const response = await fetch(`http://localhost:5002/api/v1/media/user/${userId}`);
        const data = await response.json();
        if (data.success) {
          setMedia(data.media);
          if (data.media.length > 0) {
            setUser(data.media[0].user);
          }
        }
      } catch (error) {
        console.error("Error fetching user media:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserMedia();
    }
  }, [userId]);

  return (
    <div className="profile-page">
      <div className="profile-left">
        <div className="profile-card">
            <button onClick={onBack} className="back-btn" style={{marginBottom: '10px', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '16px'}}>← Back</button>
            {user ? (
                <>
                <div className="profile-avatar-container">
                    <img 
                    src={user.avatar?.url || 'https://i.pravatar.cc/150'} 
                    alt="User Avatar" 
                    className="profile-avatar-large"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                    />
                </div>
                <h2 className="profile-name">{user.name || 'User'}</h2>
                </>
            ) : (
                loading ? <p>Loading user...</p> : <p>User not found</p>
            )}
        </div>
      </div>

      <div className="profile-right">
        <div className="tab-content">
            <h3>User Media</h3>
            {loading ? (
                <p>Loading media...</p>
            ) : media.length > 0 ? (
                <div className="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {media.map((item) => (
                        <div key={item._id} className="media-card">
                            {item.type === 'video' ? (
                                <video src={item.url} controls style={{ width: '100%', borderRadius: '8px' }} />
                            ) : (
                                <img src={item.url} alt={item.title} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '200px' }} />
                            )}
                            <p style={{marginTop: '8px', fontSize: '14px'}}>{item.title || item.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No media uploaded by this user.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PublicUserProfile;