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
      <h2>My Complaints</h2>
      {loading ? (
        <p>Loading your complaints...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : complaints.length === 0 ? (
        <p>No complaints found for you.</p>
      ) : (
        <div className="complaints-table-container">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Complaint ID</th>
                <th>Title</th>
                <th>User Name</th>
                <th>User Email</th>
                <th>Status</th>
                <th>Category</th>
                <th>Filed On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint, index) => (
                <tr key={complaint._id}>
                  <td>{index + 1}</td>
                  <td>{complaint._id}</td>
                  <td>{complaint.title}</td>
                  <td>{user ? user.name : 'N/A'}</td>
                  <td>{user ? user.email : 'N/A'}</td>
                  <td>{complaint.status}</td>
                  <td>{complaint.category}</td>
                  <td>{formatDate(complaint.createdAt)}</td>
                  <td>
                    <button className="btn btn-details" onClick={() => handleViewDetails(complaint)}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showDetailsModal && (
        <ComplaintDetailsModal complaint={selectedComplaint} onClose={handleCloseDetailsModal} />
      )}
    </div>
  );
};

export default MyComplaints;