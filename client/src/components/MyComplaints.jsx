import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ComplaintDetailsModal from './ComplaintDetailsModal';

import '../App.css';

const MyComplaints = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (!user || !user.email) {
      return;
    }

    const fetchMyComplaints = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:5002/api/v1/mycomplaints`, {
          withCredentials: true,
        });

        setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch your complaints');
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyComplaints();
  }, [user]);

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedComplaint(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="my-complaints-container">
      <div className="my-complaints-header">
        <h2>My Complaints</h2>
      </div>
      <div className="my-complaints-body">
        {loading ? (
          <p>Loading your complaints...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : complaints.length === 0 ? (
          <p>No complaints found for you.</p>
        ) : (
          <div className="complaints-card-container">

            {/* Toolbar */}
            <div className="complaints-toolbar">
              <div className="search-box">
                🔍 Search by title, description, or category...
              </div>
              <div className="toolbar-actions">
                <button className="icon-btn">⟳</button>
                <button className="icon-btn">⬇ Export</button>
              </div>
            </div>

            {/* Table */}
            <div className="complaints-list">
              {complaints.map((complaint, index) => (
                  <div className="complaint-row" key={complaint._id}>

                    <div className="complaint-id">
                      #{index + 1}
                    </div>

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
                      <strong>{user?.name || 'N/A'}</strong>
                      <span>{user?.email || 'N/A'}</span>
                    </div>

                    <div className={`status-pill status-${complaint.status.toLowerCase().replace(/\s/g, '-')}`}>
                      {complaint.status}
                    </div>

                    <div className="complaint-actions">
                      <button className="primary-btn" onClick={() => handleViewDetails(complaint)}>
                        View
                      </button>
                    </div>

                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      {showDetailsModal && (
        <ComplaintDetailsModal complaint={selectedComplaint} onClose={handleCloseDetailsModal} />
      )}
    </div>
  );
};

export default MyComplaints;
