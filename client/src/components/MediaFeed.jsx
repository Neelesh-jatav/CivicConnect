import React, { useEffect, useState } from 'react';
import './MediaFeed.css'; // We'll create this CSS file later

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '');

const MediaFeed = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchMedia = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/media/feed`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMedia(data.media); // API should return { media: [...] }
      } catch (error) {
        console.error("Error fetching media:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  if (loading) {
    return <div className="media-feed-container">Loading media...</div>;
  }

  if (error) {
    return <div className="media-feed-container">Error: {error.message}</div>;
  }

  return (
    <div className="media-feed-container">
      <h2>User Uploaded Media</h2>
      <div className="media-reels-container">
        {media.length > 0 ? (
          media.map((item) => (
            <div key={item._id} className="media-card">
              <div className="media-header">
                {item.user && item.user.avatar && <img src={item.user.avatar} alt={item.user.name || 'User Avatar'} className="profile-avatar" />}
                {item.user && item.user.name && <span className="profile-name">{item.user.name}</span>}
              </div>
              <img src={item.url} alt={item.title} className="media-image" />
              <div className="media-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No media uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default MediaFeed;
