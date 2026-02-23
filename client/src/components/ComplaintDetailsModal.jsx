import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ComplaintDetailsModal.css';

const ComplaintDetailsModal = ({ complaint, onClose, onUpdateComplaint, isOfficer }) => {
  const [status, setStatus] = useState(complaint?.status || '');
  const [department, setDepartment] = useState(complaint?.department || '');
  const [officer, setOfficer] = useState(complaint?.officer?._id || (typeof complaint?.officer === 'string' ? complaint?.officer : '') || '');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP & Closure States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resolutionImages, setResolutionImages] = useState(null);
  const [officers, setOfficers] = useState([]);

  React.useEffect(() => {
    if (status === 'Allocated to Officer') {
      const fetchOfficers = async () => {
        try {
          const { data } = await axios.get('http://localhost:5002/api/v1/admin/officers', {
            withCredentials: true
          });
          if (data.success) {
            setOfficers(data.officers);
          }
        } catch (error) {
          console.error('Failed to fetch officers', error);
        }
      };
      fetchOfficers();
    }
  }, [status]);

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

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `http://localhost:5002/api/v1/complaint/${complaint._id}/send-close-otp`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        setOtpSent(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseComplaint = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('otp', otp);
      formData.append('finalComments', description); // Use description as final comments
      
      if (resolutionImages) {
        for (let i = 0; i < resolutionImages.length; i++) {
          formData.append('resolutionImages', resolutionImages[i]);
        }
      }

      const { data } = await axios.put(
        `http://localhost:5002/api/v1/complaint/${complaint._id}/close`,
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (data.success) {
        toast.success('Complaint closed successfully');
        if (onUpdateComplaint) onUpdateComplaint(data.complaint);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToAdmin = async () => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('status', 'Resolved');
    formData.append('description', description || 'Work completed. Submitted to Admin.');
    if (department) formData.append('department', department);
    if (officer) formData.append('officer', officer);

    if (resolutionImages) {
      for (let i = 0; i < resolutionImages.length; i++) {
        formData.append('resolutionImages', resolutionImages[i]);
      }
    }

    try {
      const { data } = await axios.put(`http://localhost:5002/api/v1/complaint/${complaint._id}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success && onUpdateComplaint) {
        onUpdateComplaint(data.complaint);
        toast.success('Work submitted to Admin successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit to admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (status === 'Closed') {
      toast.error('Please use the OTP verification section to close the complaint.');
      return;
    }

    if (status === 'Allocated to Department' && !department) {
      toast.error('Please select a department.');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('status', status);
    formData.append('description', description);
    if (department) formData.append('department', department);
    if (officer) formData.append('officer', officer);

    if ((status === 'Resolved' || (isOfficer && status === 'In Progress')) && resolutionImages) {
      for (let i = 0; i < resolutionImages.length; i++) {
        formData.append('resolutionImages', resolutionImages[i]);
      }
    }

    try {
      const { data } = await axios.put(`http://localhost:5002/api/v1/complaint/${complaint._id}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
              {/* User Evidence */}
              <div style={{ flex: 1 }}>
                <div className="section-title">🖼️ Evidence (User)</div>
                <div className="images-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {complaint.images?.map((img, i) => (
                    <img 
                      key={i} 
                      src={img.url} 
                      alt={`user-evidence-${i}`} 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #ddd' }}
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                  {(!complaint.images || complaint.images.length === 0) && (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No user images attached.</p>
                  )}
                </div>
              </div>

              {/* Admin Resolution */}
              {complaint.resolutionImages?.length > 0 && (
                <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                  <div className="section-title">✅ Resolution (Admin)</div>
                  <div className="images-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {complaint.resolutionImages.map((img, i) => (
                      <img 
                        key={i} 
                        src={img.url} 
                        alt={`resolution-${i}`} 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #22c55e' }}
                        onClick={() => window.open(img.url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
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
          {onUpdateComplaint && complaint.status !== 'Closed' && !(isOfficer && complaint.status === 'Resolved') && (
            <div className="detail-card update-status">
              <h4>⚙️ Update Status</h4>
              <select 
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (e.target.value !== 'Closed') {
                    setOtpSent(false);
                    setOtp('');
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
              >
                <option value={complaint.status} disabled>{complaint.status} (Current)</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {status === 'Closed' ? (
                <div className="otp-section" style={{ marginTop: '10px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '13px', color: '#166534', marginBottom: '10px', fontWeight: '500' }}>
                    🔒 Security Check: Closing a complaint requires OTP verification from the user.
                  </p>

                  {!otpSent ? (
                    <button 
                      className="btn-accept" 
                      onClick={handleSendOtp} 
                      disabled={loading}
                      style={{ width: '100%', background: '#4f46e5', marginTop: '5px' }}
                    >
                      {loading ? 'Sending...' : '📩 Send OTP to User'}
                    </button>
                  ) : (
                    <div className="otp-verify-form">
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Enter OTP</label>
                        <input
                          type="text"
                          placeholder="6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Final Remarks</label>
                        <textarea
                          placeholder="Closing comments..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '60px' }}
                        ></textarea>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Resolution Evidence (Optional)</label>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={(e) => setResolutionImages(e.target.files)}
                          style={{ fontSize: '12px', marginTop: '4px' }}
                        />
                      </div>

                      <button 
                        className="btn-accept" 
                        onClick={handleCloseComplaint} 
                        disabled={loading}
                        style={{ width: '100%', background: '#059669' }}
                      >
                        {loading ? 'Verifying...' : '🔐 Verify & Close'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
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

                  {status === 'Allocated to Officer' && !isOfficer && (
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Select Officer:</label>
                      <select 
                        value={officer} 
                        onChange={(e) => setOfficer(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      >
                        <option value="">-- Select Officer --</option>
                        <optgroup label="Level A Officers">
                          {officers.filter(o => o.officerLevel === 'A').map(off => (
                            <option key={off._id} value={off._id}>{off.name} ({off.email})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Level B Officers">
                          {officers.filter(o => o.officerLevel === 'B').map(off => (
                            <option key={off._id} value={off._id}>{off.name} ({off.email})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {(status === 'Resolved' || (isOfficer && status === 'In Progress')) && (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>{status === 'Resolved' ? 'Upload Resolution Proof' : 'Upload Work/Progress Images'}</label>
                      <label 
                        htmlFor="resolution-upload" 
                        className="btn-secondary"
                        style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 16px', fontSize: '13px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        📷 Choose Images
                      </label>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                        {resolutionImages ? `${resolutionImages.length} file(s) selected` : 'No files selected'}
                      </span>
                      <input
                        id="resolution-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setResolutionImages(e.target.files)}
                        style={{ display: 'none' }}
                      />
                    </div>
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
                    {isOfficer && (
                      <button 
                        className="btn-accept" 
                        onClick={handleSubmitToAdmin} 
                        disabled={loading}
                        style={{ marginLeft: '10px', background: '#2563eb' }}
                      >
                        {loading ? '⏳ Submitting...' : '📤 Submit to Admin'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {isOfficer && complaint.status === 'Resolved' && (
            <div className="detail-card">
               <h4 style={{color: '#059669', marginBottom: '8px'}}>✅ Work Submitted</h4>
               <p style={{fontSize: '14px', color: '#4b5563'}}>
                 You have submitted this complaint to the Admin. You cannot make further changes unless the Admin requests revisions.
               </p>
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