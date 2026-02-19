import React, { useEffect, useState } from 'react';
import '../App.css'; // Assuming you have some basic styling in App.css

const MyUploadedMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMedia = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/v1/media/me', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setMedia(data.media);
        }
      } catch (error) {
        console.error("Error fetching user media:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMedia();
  }, []);

  if (loading) {
    return <div className="my-uploaded-media-container"><p>Loading media...</p></div>;
  }

  if (!media || media.length === 0) {
    return (
      <div className="my-uploaded-media-container">
        <h3>My Uploaded Media</h3>
        <p>You haven't uploaded any media yet.</p>
      </div>
    );
  }

  return (
    <div className="my-uploaded-media-container">
      <h3>My Uploaded Media</h3>
      <div className="media-grid">
        {media.map((mediaItem) => (
          <div key={mediaItem._id} className="media-card">
            {mediaItem.type === 'video' ? (
              <video src={mediaItem.url} controls className="media-image" />
            ) : (
              <img src={mediaItem.url} alt={mediaItem.title || 'Uploaded Media'} className="media-image" />
            )}
            {mediaItem.title && <h4>{mediaItem.title}</h4>}
            {mediaItem.description && <p>{mediaItem.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyUploadedMedia;
