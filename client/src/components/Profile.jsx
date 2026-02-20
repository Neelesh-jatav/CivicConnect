import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../App.css';
import MyUploadedMedia from './MyUploadedMedia';
import MediaUpload from './MediaUpload';
import Modal from './Modal';
import TrendingIssues from './TrendingIssues';
import './TrendingIssues.css';

const Profile = ({ user, setCurrentView, onMediaUploadSuccess, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCropMode, setShowCropMode] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      if (activeTab === 'complaints') {
        fetchMyComplaints();
      } else if (activeTab === 'statistics') {
        fetchStatistics();
      }
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'connections') {
      const statuses = JSON.parse(localStorage.getItem('connectionStatuses') || '{}');
      const details = JSON.parse(localStorage.getItem('connectedUsersDetails') || '{}');
      const users = Object.keys(statuses)
        .filter(id => statuses[id] === 'connected')
        .map(id => details[id])
        .filter(u => u);
      setConnectedUsers(users);
    }
  }, [activeTab]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/mycomplaints', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/mycomplaints', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.complaints) {
        const allComplaints = data.complaints;
        const resolved = allComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
        const inProgress = allComplaints.filter(c => c.status === 'Allocated to Officer' || c.status === 'Accepted').length;
        const pending = allComplaints.filter(c => c.status === 'Pending').length;

        setStatistics({
          totalComplaints: allComplaints.length,
          resolved,
          inProgress,
          pending,
          totalLikes: 56,
          contributions: 12,
        });
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePasswordHandler = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/password/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Password updated successfully");
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfileClick = () => {
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditAvatarPreview(user.avatar?.url || 'https://i.pravatar.cc/150');
    setShowEditProfileModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImageFile(file)) {
      handleImageSelectForCrop(file);
    }
  };

  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image format (JPG, PNG, GIF, WebP)');
      return false;
    }
    
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateImageFile(file)) {
        handleImageSelectForCrop(file);
      }
    }
  };

  const clearImageSelection = () => {
    setEditAvatar(null);
    setEditAvatarPreview(user.avatar?.url || 'https://i.pravatar.cc/150');
    setShowCropMode(false);
    setCropImage(null);
  };

  const handleImageSelectForCrop = (imageFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImage(e.target.result);
      setShowCropMode(true);
      setCropPosition({ x: 0, y: 0 });
      setCropScale(1);
    };
    reader.readAsDataURL(imageFile);
  };

  const applyCrop = () => {
    if (!cropImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    
    image.onload = () => {
      const size = 200; // Crop to 200x200
      const scaledWidth = image.width * cropScale;
      const scaledHeight = image.height * cropScale;

      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(
        image,
        cropPosition.x,
        cropPosition.y,
        scaledWidth,
        scaledHeight,
        0,
        0,
        size,
        size
      );

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], 'profile-image.png', { type: 'image/png' });
        setEditAvatar(croppedFile);
        setEditAvatarPreview(canvas.toDataURL());
        setShowCropMode(false);
        setCropImage(null);
        toast.success('Image cropped successfully!');
      }, 'image/png');
    };
    image.src = cropImage;
  };

  const handleCropDrag = (e) => {
    if (e.buttons === 0) return; // No mouse button pressed
    const sensitivity = 2;
    setCropPosition(prev => ({
      x: Math.max(-500, Math.min(500, prev.x - e.movementX * sensitivity)),
      y: Math.max(-500, Math.min(500, prev.y - e.movementY * sensitivity))
    }));
  };

  const handleCropZoom = (e) => {
    e.preventDefault();
    const wheelDelta = e.deltaY > 0 ? -0.05 : 0.05;
    setCropScale(prev => Math.max(0.5, Math.min(3, prev + wheelDelta)));
  };

  const updateProfileHandler = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    const formData = new FormData();
    formData.append('name', editName);
    formData.append('phone', editPhone);
    if (editAvatar) {
      formData.append('avatar', editAvatar);
    }

    try {
      const response = await fetch('http://localhost:5002/api/v1/me/update', {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        if (onProfileUpdate) onProfileUpdate(data.user);
        setShowEditProfileModal(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-container">Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      {/* Left Side - Profile Info */}
      <div className="profile-left">
        <div className="profile-card">
          <div className="profile-avatar-container">
            <img
              src={user.avatar?.url || 'https://i.pravatar.cc/150'}
              alt="User Avatar"
              className="profile-avatar-large"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
            />
          </div>
          <h2 className="profile-name">{user.name || 'User'}</h2>
          <p className="profile-status">Active community member</p>

          <button className="btn btn-edit" onClick={handleEditProfileClick}>✏️ Edit Profile</button>
          <button className="btn btn-edit" style={{ marginTop: '10px', backgroundColor: '#4b5563' }} onClick={() => setShowPasswordModal(true)}>🔒 Change Password</button>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{complaints.length || 0}</span>
              <span className="stat-label">Complaints</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics?.resolved || 0}</span>
              <span className="stat-label">Resolved</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics?.totalLikes || 56}</span>
              <span className="stat-label">Likes</span>
            </div>
          </div>

          <div className="profile-contact">
            <div className="contact-item">
              <span className="icon">📱</span>
              <span>{user.phone || '+1234567890'}</span>
            </div>
            <div className="contact-item">
              <span className="icon">📧</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Complaints & Statistics */}
      <div className="profile-right">
        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            My Complaints
          </button>
          <button
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Media
          </button>
          <button
            className={`tab ${activeTab === 'my-media' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-media')}
          >
            Your Media
          </button>
          <button
            className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* My Complaints Tab */}
          {activeTab === 'complaints' && (
            <div className="complaints-card-container">
              <div className="complaints-toolbar">
                <input type="text" placeholder="Search complaints..." className="search-box" />
                </div>
              <div className="complaints-list">
                {loading ? (
                  <p>Loading complaints...</p>
                ) : complaints.length > 0 ? (
                  complaints.map((complaint) => (
                    <div key={complaint._id} className="complaint-row">
                      <div className="complaint-id">#{complaint._id.substr(-4)}</div>
                      <div className="complaint-img-box">
                        {complaint.images && complaint.images.length > 0 ? (
                          <img src={complaint.images[0].url} alt="Complaint" />
                        ) : (
                          <span style={{ fontSize: '20px' }}>📷</span>
                        )}
                      </div>
                      <div className="complaint-main">
                        <h4>{complaint.title}</h4>
                        <div className="complaint-meta">
                          {new Date(complaint.createdAt).toLocaleDateString()} • {complaint.district}
                        </div>
                      </div>
                      <div className="complaint-user">
                        <strong>{complaint.category}</strong>
                        <span>{complaint.department || 'Unassigned'}</span>
                      </div>
                      <div className={`status-pill status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {complaint.status === 'Allocated to Officer' ? 'In Progress' : complaint.status}
                      </div>
                      <button className="primary-btn">View</button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No complaints yet. <a onClick={() => setCurrentView('home')}>File one now!</a></p>
                )}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="statistics-container">
              {loading ? (
                <p>Loading statistics...</p>
              ) : (
                <>
                  {/* Your Impact */}
                  <div className="stats-section">
                    <h3>Your Impact</h3>
                    <div className="impact-cards">
                      <div className="impact-card active-reporter">
                        <div className="impact-icon">👤</div>
                        <h4>Active Reporter</h4>
                        <p>{complaints.length || 0}+ complaints filed</p>
                      </div>
                      <div className="impact-card problem-solver">
                        <div className="impact-icon">✅</div>
                        <h4>Problem Solver</h4>
                        <p>{statistics?.resolved || 0} issues resolved</p>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Status Breakdown */}
                  <div className="stats-section">
                    <h3>Complaint Status Breakdown</h3>
                    <div className="status-breakdown">
                      <div className="breakdown-item">
                        <span className="status-label">Resolved</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(statistics?.resolved / (statistics?.totalComplaints || 1)) * 100}%`,
                              background: '#22c55e',
                            }}
                          />
                        </div>
                        <span className="status-count">{statistics?.resolved || 0}</span>
                      </div>

                      <div className="breakdown-item">
                        <span className="status-label">In Progress</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(statistics?.inProgress / (statistics?.totalComplaints || 1)) * 100}%`,
                              background: '#f97316',
                            }}
                          />
                        </div>
                        <span className="status-count">{statistics?.inProgress || 0}</span>
                      </div>

                      <div className="breakdown-item">
                        <span className="status-label">Pending</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(statistics?.pending / (statistics?.totalComplaints || 1)) * 100}%`,
                              background: '#d1d5db',
                            }}
                          />
                        </div>
                        <span className="status-count">{statistics?.pending || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Community Impact */}
                  <div className="stats-section">
                    <h3>Community Impact</h3>
                    <div className="impact-numbers">
                      <div className="impact-number">
                        <span className="number">{statistics?.totalLikes || 0}</span>
                        <span className="label">Total Likes</span>
                      </div>
                      <div className="impact-number">
                        <span className="number">{statistics?.contributions || 0}</span>
                        <span className="label">Contributions</span>
                      </div>
                    </div>
                  </div>

                  {/* Trending Issues in profile page*/}
                  <TrendingIssues />
                </>
              )}
            </div>
          )}


          {/* Upload Media Tab */}
          {activeTab === 'upload' && (
            <MediaUpload
              onClose={() => setActiveTab('complaints')}
              onMediaUploadSuccess={() => {
                if (onMediaUploadSuccess) {
                  onMediaUploadSuccess();
                }
                setActiveTab('my-media');
              }}
            />
          )}

          {activeTab === 'my-media' && (
            <MyUploadedMedia />
          )}

          {activeTab === 'connections' && (
            <div className="connections-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>My Connections</h3>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#4b5563', userSelect: 'none' }}
                  onClick={() => setRequireConfirmation(!requireConfirmation)}
                >
                  <span>Require Confirmation</span>
                  <div
                    style={{
                      width: '44px',
                      height: '24px',
                      background: requireConfirmation ? '#dc5d20' : '#d1d5db',
                      borderRadius: '99px',
                      position: 'relative',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#fff',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: requireConfirmation ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              </div>
              <div className="connection-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Pending Requests</h4>
                <p className="empty-state" style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>No pending requests.</p>
              </div>
              <div className="connection-section">
                <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>My Network</h4>
                {connectedUsers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                    {connectedUsers.map(u => (
                      <div key={u._id} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center', background: '#fff' }}>
                        <img
                          src={u.avatar?.url || u.avatar || 'https://i.pravatar.cc/150'}
                          alt={u.name}
                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                        />
                        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'User'}</div>
                        <button
                          style={{ fontSize: '11px', padding: '4px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => {
                            if (window.confirm('Disconnect?')) {
                              const statuses = JSON.parse(localStorage.getItem('connectionStatuses') || '{}');
                              statuses[u._id] = 'none';
                              localStorage.setItem('connectionStatuses', JSON.stringify(statuses));
                              setConnectedUsers(prev => prev.filter(user => user._id !== u._id));
                            }
                          }}
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state" style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>You haven't connected with anyone yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <div className="auth-card glass" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <h2 className="auth-title">Change Password</h2>
          <form onSubmit={changePasswordHandler}>
            <input type="password" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type="submit" className="auth-btn" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </Modal>

      {/* Image Crop Modal */}
      <Modal isOpen={showCropMode} onClose={() => setShowCropMode(false)}>
        <div className="auth-card glass" style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
          <h2 className="auth-title">Crop Profile Image</h2>
          
          {cropImage && (
            <div style={{ marginBottom: '20px' }}>
              {/* Crop Preview Area */}
              <div
                style={{
                  position: 'relative',
                  width: '280px',
                  height: '280px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  border: '4px solid #ff955f',
                  overflow: 'hidden',
                  background: '#f9fafb',
                  boxShadow: '0 8px 24px rgba(220, 93, 32, 0.15)',
                  cursor: 'grab'
                }}
                onMouseMove={handleCropDrag}
                onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                onWheel={handleCropZoom}
              >
                <img
                  src={cropImage}
                  alt="Crop preview"
                  style={{
                    width: `${100 * cropScale}%`,
                    height: `${100 * cropScale}%`,
                    objectFit: 'cover',
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px)`,
                    cursor: 'grab',
                    userSelect: 'none'
                  }}
                  draggable={false}
                />
              </div>

              {/* Controls */}
              <div style={{ background: '#fafafa', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
                    Zoom: {Math.round(cropScale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={cropScale}
                    onChange={(e) => setCropScale(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      cursor: 'pointer',
                      accentColor: '#ff955f'
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
                  💡 Drag image to position • Scroll to zoom
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCropMode(false);
                    setCropImage(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f3f4f6';
                  }}
                >
                  ✕ Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #ff955f 0%, #ff3100 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(255, 107, 29, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 29, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 29, 0.3)';
                  }}
                >
                  ✓ Apply Crop
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)}>
        <div className="auth-card glass" style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
          <h2 className="auth-title">Edit Profile</h2>
          <form onSubmit={updateProfileHandler}>
            {/* Image Upload Section */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div
                className="image-upload-container"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  padding: '24px',
                  border: '2px dashed',
                  borderColor: isDragOver ? '#ff955f' : '#d1d5db',
                  borderRadius: '16px',
                  background: isDragOver ? '#fff5f0' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <img
                    src={editAvatarPreview}
                    alt="Avatar Preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #dc5d20',
                      boxShadow: '0 4px 12px rgba(220, 93, 32, 0.2)'
                    }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-5px',
                    right: '-5px',
                    background: '#ff955f',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>📷</div>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}
                    >{isDragOver ? '📂 Drop your image here' : '🖼️ Drop image or click to browse'}</p>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>JPG, PNG, GIF, WebP • Max 5MB</p>
                </div>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: '0',
                    cursor: 'pointer',
                    left: '0',
                    top: '0'
                  }}
                />
              </div>
              {editAvatar && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file && validateImageFile(file)) {
                          handleImageSelectForCrop(file);
                        }
                      };
                      input.click();
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#bfdbfe';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#dbeafe';
                    }}
                  >
                    🔄 Change Image
                  </button>
                  <button
                    type="button"
                    onClick={clearImageSelection}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      background: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fee2e2';
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </div>

            {/* Name Input */}
            <input
              type="text"
              placeholder="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '12px',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff955f';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 149, 95, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Phone Input */}
            <input
              type="text"
              placeholder="Phone Number"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '20px',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff955f';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 149, 95, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-btn"
              disabled={profileLoading}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: profileLoading ? '#9ca3af' : 'linear-gradient(135deg, #ff955f 0%, #ff3100 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: profileLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: profileLoading ? 0.7 : 1
              }}
            >
              {profileLoading ? 'Updating...' : '✓ Save Changes'}
            </button>
          </form>

          {/* Hidden canvas for cropping */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
