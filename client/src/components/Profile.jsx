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
    if (file) {
      setEditAvatar(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
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

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)}>
        <div className="auth-card glass" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <h2 className="auth-title">Edit Profile</h2>
          <form onSubmit={updateProfileHandler}>
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <img
                src={editAvatarPreview}
                alt="Avatar Preview"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '2px solid #dc5d20' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
              />
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ fontSize: '12px' }}
              />
            </div>
            <input type="text" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <input type="text" placeholder="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            <button type="submit" className="auth-btn" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
