import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import '../App.css';

const OfficerDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5002/api/v1/officer/complaints', {
        withCredentials: true,
      });
      setComplaints(data.complaints || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching assigned complaints:', err);
      setError('Failed to fetch assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedComplaint(null);
  };

  const handleUpdateComplaint = (updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === updatedComplaint._id ? updatedComplaint : c))
    );
    setSelectedComplaint(updatedComplaint);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h2>Officer Dashboard</h2>
        <p>Manage your assigned complaints and tasks.</p>
      </div>

      <div className="all-complaints-section">
        <h3>Assigned Tasks</h3>
        {loading ? (
          <p>Loading tasks...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : complaints.length === 0 ? (
          <p>No complaints assigned to you yet.</p>
        ) : (
          <div className="complaints-list">
            {complaints.map((complaint, index) => (
              <div className="complaint-row" key={complaint._id}>
                <div className="complaint-id">#{index + 1}</div>
                
                <div className="complaint-img-box">
                  {complaint.images && complaint.images.length > 0 ? (
                    <img src={complaint.images[0].url} alt="Complaint" />
                  ) : (
                    <span style={{ fontSize: '20px' }}>📷</span>
                  )}
                </div>

                <div className="complaint-main">
                  <h4>{complaint.title}</h4>
                  <p className="complaint-meta">
                    {complaint.category} • {formatDate(complaint.createdAt)}
                  </p>
                </div>

                <div className="complaint-user">
                  <strong>{complaint.user?.name || 'N/A'}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>{complaint.user?.email}</span>
                </div>

                <div className={`status-pill status-${complaint.status.toLowerCase().replace(/\s/g, '-')}`}>
                  {complaint.status}
                </div>

                <div className="complaint-actions">
                  <button className="primary-btn" onClick={() => handleViewDetails(complaint)}>
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailsModal && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={handleCloseDetailsModal}
          onUpdateComplaint={handleUpdateComplaint}
          isOfficer={true}
        />
      )}
    </div>
  );
};

export default OfficerDashboard;