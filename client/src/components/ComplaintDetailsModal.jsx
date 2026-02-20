import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ComplaintDetailsModal.css';

const ComplaintDetailsModal = ({ complaint, onClose, onUpdateComplaint }) => {
  const [status, setStatus] = useState(complaint?.status || '');
  const [department, setDepartment] = useState(complaint?.department || '');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!complaint) return null;

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'Pending': ['Accepted', 'Rejected'],
      'Accepted': ['Allocated to Department', 'Allocated to Officer'],
      'Allocated to Department': ['In Progress', 'Resolved'],
      'Allocated to Officer': ['In Progress', 'Resolved'],
      'In Progress': ['Resolved'],
      'Resolved': ['Closed', 'In Progress'],
      'Rejected': ['Pending'],
      'Closed': ['Pending']
    };
    return statusFlow[currentStatus] || [];
  };

  const nextStatuses = getNextStatuses(complaint.status);

  const handleUpdate = async () => {
    if (status === 'Allocated to Department' && !department) {
      toast.error('Please select a department.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put(
        `http://localhost:5002/api/v1/complaint/${complaint._id}`,
        { status, department, description },
        { withCredentials: true }
      );
      if (data.success && onUpdateComplaint) {
        onUpdateComplaint(data.complaint);
        toast.success('Complaint updated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="complaint-details-overlay" onClick={onClose}>
      <div className="complaint-details-modal" onClick={e => e.stopPropagation()}>
      <div className="complaint-details-header">
        <button className="close-btn" onClick={onClose}>← Back</button>
        <div>
          <h2>📋 Complaint Details</h2>
        </div>
      </div>

      <div className="complaint-details-grid">
        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* Title Card */}
          <div className="detail-card title-card">
            <h3>💬 {complaint.title}</h3>
            <span className={`status-pill status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
              {complaint.status}
            </span>
            <div className="complaint-id">🆔 {complaint._id.substr(-6).toUpperCase()}</div>
          </div>

          {/* Description */}
          <div className="detail-card description-card">
            <div className="section-title">📝 Description</div>
            <p>{complaint.description}</p>
          </div>

          {/* Location */}
          <div className="detail-card">
            <div className="section-title">📍 Location Details</div>
            <div className="location-grid">
              <div className="location-item"><strong>State</strong> {complaint.state}</div>
              <div className="location-item"><strong>District</strong> {complaint.district}</div>
              <div className="location-item"><strong>Pincode</strong> {complaint.pincode}</div>
              {complaint.landmark && <div className="location-item"><strong>Landmark</strong> {complaint.landmark}</div>}
            </div>
          </div>

          {/* Images */}
          <div className="detail-card">
            <div className="section-title">🖼️ Evidence</div>
            <div className="images-grid">
              {complaint.images?.map((img, i) => (
                <img 
                  key={i} 
                  src={img.url} 
                  alt={`evidence-${i}`} 
                  onClick={() => window.open(img.url, '_blank')}
                />
              ))}
              {(!complaint.images || complaint.images.length === 0) && (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>No images attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          {/* Assignment */}
          <div className="detail-card assignment-card">
            <h4>👤 Filed By</h4>
            <div className="assignment-row"><strong>Name:</strong> {complaint.user?.name || 'N/A'}</div>
            <div className="assignment-row"><strong>Email:</strong> {complaint.user?.email || 'N/A'}</div>
            <div className="assignment-row"><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</div>
          </div>

          {/* Update Status */}
          {onUpdateComplaint && complaint.status !== 'Closed' && (
            <div className="detail-card update-status">
              <h4>⚙️ Update Status</h4>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
              >
                <option value={complaint.status} disabled>{complaint.status} (Current)</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {status === 'Allocated to Department' && (
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
                >
                  <option value="">Select Department</option>
                  <option value="Road">Road</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Disaster">Disaster</option>
                </select>
              )}

              <textarea
                placeholder="Add a note or update description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <div className="status-actions">
                <button className="btn-accept" onClick={handleUpdate} disabled={loading}>
                  {loading ? '⏳ Updating...' : '✅ Update Status'}
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="detail-card">
            <h4>⏱️ Timeline</h4>
            <div className="timeline">
              {complaint.statusHistory?.slice().reverse().map((history, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div style={{ fontWeight: '600' }}>{history.status}</div>
                    <span>{new Date(history.timestamp).toLocaleString()}</span>
                    {history.description && <div style={{ marginTop: '4px', fontSize: '12px' }}>{history.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ComplaintDetailsModal;