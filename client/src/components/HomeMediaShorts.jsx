import React, { useEffect, useState } from "react";
import Modal from './Modal';
import { toast } from 'react-toastify';
import './CommunityShorts.css';

const HomeMediaShorts = ({ onUserClick, onConnectionChange }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState(() => {
    const saved = localStorage.getItem('connectionStatuses');
    return saved ? JSON.parse(saved) : {};
  });
  const [connectedUsersDetails, setConnectedUsersDetails] = useState(() => {
    const saved = localStorage.getItem('connectedUsersDetails');
    return saved ? JSON.parse(saved) : {};
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [mediaToShare, setMediaToShare] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5002/api/v1/media/feed", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("MEDIA FEED:", data.media);
        const shuffled = [...(data.media || [])].sort(() => Math.random() - 0.5);
        setMedia(shuffled);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching shorts:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('connectionStatuses', JSON.stringify(connectionStatuses));
  }, [connectionStatuses]);

  useEffect(() => {
    localStorage.setItem('connectedUsersDetails', JSON.stringify(connectedUsersDetails));
  }, [connectedUsersDetails]);

  const handleLike = async (mediaId) => {
    try {
      // Optimistic update
      setMedia((prevMedia) =>
        prevMedia.map((item) => {
          if (item._id === mediaId) {
            // Check if user has already liked (this logic depends on if backend returns 'isLiked' or if we check user ID in likes array)
            // For simplicity, we'll just increment/decrement based on a toggle assumption or just increment for now if we don't have user ID context easily available here without prop drilling
            // A better approach is to check if the current user's ID is in the likes array.
            // Assuming we don't have the current user ID readily available in this component's scope to check 'includes', 
            // we will just rely on the backend response or a simple toggle if we had the user ID.
            // For this implementation, let's just call the API and update with the returned data or just increment for visual feedback.
            return item; 
          }
          return item;
        })
      );

      const response = await fetch(`http://localhost:5002/api/v1/media/${mediaId}/like`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
         setMedia((prevMedia) => prevMedia.map(item => item._id === mediaId ? { ...item, likes: data.likes } : item));
      }
    } catch (error) {
      console.error("Error liking media:", error);
    }
  };

  const handleCommentSubmit = async (mediaId) => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5002/api/v1/media/${mediaId}/comment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setMedia((prevMedia) => prevMedia.map(item => item._id === mediaId ? { ...item, comments: data.comments } : item));
        setCommentText("");
        setActiveCommentId(null); // Close input after submit
      }
    } catch (error) {
      console.error("Error commenting on media:", error);
    }
  };

  const disconnectUser = async (userId) => {
    try {
      const response = await fetch('http://localhost:5002/api/v1/user/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setConnectionStatuses(prev => ({ ...prev, [userId]: 'none' }));
        if (onConnectionChange) {
          onConnectionChange();
        }
        toast.info("Disconnected");
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      toast.error("Failed to disconnect");
    }
  };

  const handleConnectToggle = async (user, currentStatus, e) => {
    e.stopPropagation();
    const userId = user?._id;
    if (!userId) return;

    if (currentStatus === 'connected' || currentStatus === 'pending') {
      const ConfirmAction = ({ closeToast }) => (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#333' }}>
            Disconnect from <strong>{user.name || 'User'}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={closeToast}
              style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                disconnectUser(userId);
                closeToast();
              }}
              style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      );

      toast(<ConfirmAction />, {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        icon: false
      });
    } else {
      try {
        const response = await fetch('http://localhost:5002/api/v1/user/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setConnectionStatuses(prev => ({ ...prev, [userId]: 'connected' }));
          setConnectedUsersDetails(prev => ({ ...prev, [userId]: user }));
          if (onConnectionChange) {
            onConnectionChange();
          }
        }
      } catch (error) {
        console.error('Error connecting user:', error);
      }
    }
  };

  const handleShareClick = (item) => {
    setMediaToShare(item);
    setShareModalOpen(true);
  };

  const handleCopyLink = () => {
    if (!mediaToShare) return;
    const link = `${window.location.origin}/media/${mediaToShare._id}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard!");
    });
  };

  const handleSendToConnection = (user) => {
    toast.success(`Shared with ${user.name}!`);
    setShareModalOpen(false);
  };

  const getConnectedUsers = () => {
    const connectedIds = Object.keys(connectionStatuses).filter(id => connectionStatuses[id] === 'connected');
    const uniqueUsers = [];
    const seenIds = new Set();

    media.forEach(item => {
      if (item.user && connectedIds.includes(item.user._id) && !seenIds.has(item.user._id)) {
        uniqueUsers.push(item.user);
        seenIds.add(item.user._id);
      }
    });
    return uniqueUsers;
  };

  const connectedUsers = getConnectedUsers();

  return (
    <div className="shorts-panel">
      <div className="section-header shorts-header-sticky">
        <h3>COMMUNITY SHORTS</h3>
        <span className="sponsored-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>FEED</span>
      </div>

      <div className="shorts-list">
        {loading && <p>Loading shorts...</p>}

        {!loading && media.length === 0 && (
          <p style={{ color: "#9ca3af" }}>No community posts yet</p>
        )}

        {media.map(item => (
          <div key={item._id} className="short-card">
            
            {/* Header */}
            <div
              className="short-header clickable"
              onClick={(e) => {
                e.stopPropagation();
                if (onUserClick) {
                  onUserClick(item.user?._id);
                }
              }}
            >
              <img
                src={item.user?.avatar?.url || item.user?.avatar || "https://i.pravatar.cc/40"}
                className="short-avatar"
                alt="user"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
              />
              <div>
                <strong>{item.user?.name || item.user?.username || "User"}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <button
                onClick={(e) => handleConnectToggle(item.user, connectionStatuses[item.user?._id] || 'none', e)}
              >
                {connectionStatuses[item.user?._id] === 'connected' ? 'Connected' : (connectionStatuses[item.user?._id] === 'pending' ? 'Pending' : 'Follow')}
              </button>
            </div>

            {/* Media */}
            {item.type === "video" ? (
              <video src={item.url} controls muted />
            ) : (
              <img loading="lazy" src={item.url} alt="post" />
            )}

            {/* Caption */}
            <p className="short-caption">
              {item.title && <strong>{item.title}</strong>}
              {item.title && item.description && <br />}
              {item.description}
              {!item.description && !item.title && item.caption}
            </p>

            {/* Actions */}
            <div className="short-actions">
              <span onClick={() => handleLike(item._id)}>❤️ {item.likes?.length || 0}</span>
              <span onClick={() => setActiveCommentId(activeCommentId === item._id ? null : item._id)}>
                💬 {item.comments?.length || 0}
              </span>
              <span onClick={() => handleShareClick(item)}>🔄 Share</span>
            </div>

            {/* Comment Input */}
            {activeCommentId === item._id && (
              <div className="comments-section" style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                {/* Comments List */}
                {item.comments && item.comments.length > 0 && (
                  <div className="comments-list" style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '12px' }}>
                    {item.comments.map((comment, index) => (
                      <div key={index} className="comment-item" style={{ marginBottom: '8px', fontSize: '13px' }}>
                        <strong style={{ color: '#1f2937' }}>{comment.user?.name || 'User'}: </strong>
                        <span style={{ color: '#6b7280' }}>{comment.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="comment-input-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#f9fafb', color: '#1f2937' }}
                  />
                  <button onClick={() => handleCommentSubmit(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff7a18', fontWeight: 'bold', fontSize: '13px', padding: '0 4px' }}>
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {shareModalOpen && (
        <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>Share this post</h3>
            
            <div style={{ margin: '20px 0', padding: '10px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {`${window.location.origin}/media/${mediaToShare?._id}`}
              </span>
              <button onClick={handleCopyLink} style={{ border: 'none', background: 'transparent', color: '#dc5d20', fontWeight: 'bold', cursor: 'pointer' }}>
                Copy
              </button>
            </div>

            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '15px', color: '#374151' }}>Send to Connections</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {connectedUsers.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>No connected users found.</p>
                ) : (
                  connectedUsers.map(conn => (
                  <div key={conn._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={conn.avatar?.url || conn.avatar || "https://i.pravatar.cc/40"} alt={conn.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}/>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{conn.name || conn.username || "User"}</span>
                    </div>
                    <button 
                      onClick={() => handleSendToConnection(conn)}
                      style={{ padding: '6px 16px', borderRadius: '20px', background: '#dc5d20', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      Send
                    </button>
                  </div>
                )))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HomeMediaShorts;