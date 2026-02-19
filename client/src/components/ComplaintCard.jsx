import React from 'react';
import '../App.css'; // For styling

const ComplaintCard = ({ complaint, onViewDetails }) => {
  const getStatusClassName = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Resolved':
        return 'status-resolved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="complaint-card">
      <div className="card-header">
        <h4 className="card-title">{complaint.title}</h4>
        <span className={`complaint-status ${getStatusClassName(complaint.status)}`}>
          {complaint.status}
        </span>
      </div>
      <div className="card-body">
        <p className="card-category">Category: {complaint.category}</p>
        <p className="card-date">Filed On: {formatDate(complaint.createdAt)}</p>
      </div>
      <div className="card-footer">
        <button className="btn btn-details" onClick={() => onViewDetails(complaint)}>View Details</button>
      </div>
    </div>
  );
};

export default ComplaintCard;
