import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const RaiseComplaint = ({ onClose, toggleLoginModal, user, onComplaintSubmitted }) => {
  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    images: [], // Re-introduced
    category: '',
    state: '',
    pincode: '',
    district: '',
    landmark: '',
  });
  const [imagePreviews, setImagePreviews] = useState([]); // Re-introduced
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Handle ESC Key Close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle Click Outside (Backdrop)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    setComplaintData({ ...complaintData, [e.target.name]: e.target.value });
  };

  // Re-introduced image handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setComplaintData({ ...complaintData, images: files });

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index) => {
    const newImages = complaintData.images.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    setComplaintData({ ...complaintData, images: newImages });
    setImagePreviews(newImagePreviews);
  };

  const handleGetOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        toast.success('OTP sent to your email!');
      } else {
        toast.error(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error('An error occurred while sending OTP.');
      console.error(err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
      } else {
        toast.error(data.message || 'Failed to verify OTP.');
        setOtpVerified(false);
      }
    } catch (err) {
      toast.error('An error occurred while verifying OTP.');
      console.error(err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all required fields
    if (!complaintData.title || !complaintData.title.trim()) {
      toast.error('Please enter an issue title.');
      setLoading(false);
      return;
    }

    if (!complaintData.description || !complaintData.description.trim()) {
      toast.error('Please enter a description.');
      setLoading(false);
      return;
    }

    if (!complaintData.category) {
      toast.error('Please select a category.');
      setLoading(false);
      return;
    }

    if (!otpVerified) {
      toast.error('Please verify your email with OTP before submitting.');
      setLoading(false);
      return;
    }

    const formData = new FormData(); // Use FormData for images
    formData.append('title', complaintData.title);
    formData.append('description', complaintData.description);
    formData.append('category', complaintData.category);
    formData.append('state', complaintData.state);
    formData.append('pincode', complaintData.pincode);
    formData.append('district', complaintData.district);
    formData.append('landmark', complaintData.landmark);
    complaintData.images.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('http://localhost:5002/api/v1/complaint', {
        method: 'POST',
        body: formData, // Send FormData
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 401) {
        toast.error('You need to be logged in to raise a complaint. Please log in.');
        onClose(); // Close complaint modal
        toggleLoginModal(); // Open login modal
        return;
      }

      if (data.success) {
        toast.success('Complaint submitted successfully!');
        if (onComplaintSubmitted) {
          onComplaintSubmitted();
        }
        // Reset form state
        setComplaintData({ title: '', description: '', images: [], category: '', state: '', pincode: '', district: '', landmark: '' });
        setImagePreviews([]);
        setEmail(user?.email || '');
        setOtp('');
        setOtpSent(false);
        setOtpVerified(false);
        setStep(1);
        onClose(); // Close the modal on successful submission
      } else {
        toast.error(data.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      toast.error('An error occurred during complaint submission: ' + err.message);
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-backdrop" onClick={handleBackdropClick}>
      <div className="report-page">
      {/* HEADER */}
      <div className="report-header">
        <h2>Report New Issue</h2>
        <span className="step-indicator">Step {step} of 3</span>
        <button className="back-btn" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="report-body">
        {/* LEFT PANEL */}
        <div className="report-left">
          <div className="card progress-card">
            <h4>Progress</h4>

            <div className={`progress-step ${step === 1 ? 'active' : ''}`}>
              <span>1</span>
              <div>
                <strong>Describe Issue</strong>
                <p>Add details and media</p>
              </div>
            </div>

            <div className={`progress-step ${step === 2 ? 'active' : ''}`}>
              <span>2</span>
              <div>
                <strong>Categorize</strong>
                <p>Select type & category</p>
              </div>
            </div>

            <div className={`progress-step ${step === 3 ? 'active' : ''}`}>
              <span>3</span>
              <div>
                <strong>Verify & Submit</strong>
                <p>Email OTP</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="report-right">
          <div className="card form-card">
            {/* USER INFO */}
            {user && (
              <div className="user-info-display" style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#1f2937' }}><strong>Logged in as:</strong> {user.name || 'N/A'}</p>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#1f2937' }}><strong>Email:</strong> {user.email || 'N/A'}</p>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <label>Issue Title *</label>
                <input
                  name="title"
                  value={complaintData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the issue"
                  required
                />

                <label>Description *</label>
                <textarea
                  name="description"
                  value={complaintData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Provide detailed description..."
                  required
                />

                <label>Add Media</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />

                {imagePreviews.length > 0 && (
                  <div className="preview-grid">
                    {imagePreviews.map((img, i) => (
                      <div key={i} className="preview-box">
                        <img src={img} alt="" />
                        <button type="button" onClick={() => handleRemoveImage(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <button className="continue-btn" onClick={() => {
                  if (!complaintData.title || !complaintData.title.trim()) {
                    toast.error('Please enter an issue title.');
                    return;
                  }
                  if (!complaintData.description || !complaintData.description.trim()) {
                    toast.error('Please enter a description.');
                    return;
                  }
                  setStep(2);
                }}>
                  Continue →
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <label>Category *</label>
                <select
                  name="category"
                  value={complaintData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Road">Road</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Accident">Accident</option>
                  <option value="Disaster">Disaster</option>
                  <option value="Custom">Custom</option>
                </select>

                <label>State *</label>
                <select
                  name="state"
                  value={complaintData.state}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select state</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>

                <label>District *</label>
                <input
                  name="district"
                  type="text"
                  value={complaintData.district}
                  onChange={handleInputChange}
                  placeholder="Enter your district"
                  required
                />

                <label>Pincode *</label>
                <input
                  name="pincode"
                  type="text"
                  value={complaintData.pincode}
                  onChange={handleInputChange}
                  placeholder="Enter pincode (6 digits)"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />

                <label>Landmark (Optional)</label>
                <input
                  name="landmark"
                  type="text"
                  value={complaintData.landmark}
                  onChange={handleInputChange}
                  placeholder="Enter nearby landmark"
                />

                <div className="step-actions">
                  <button className="secondary-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="continue-btn" onClick={() => {
                    if (!complaintData.category) {
                      toast.error('Please select a category before continuing.');
                      return;
                    }
                    if (!complaintData.state) {
                      toast.error('Please select a state.');
                      return;
                    }
                    if (!complaintData.district) {
                      toast.error('Please enter a district.');
                      return;
                    }
                    if (!complaintData.pincode) {
                      toast.error('Please enter a valid pincode.');
                      return;
                    }
                    setStep(3);
                  }}>Continue →</button>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <label>Email *</label>
                <div className="otp-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email ? 'Email' : 'Enter your email'}
                    required
                    disabled={otpSent || !!user}
                  />
                  <button type="button" onClick={handleGetOtp} disabled={otpSent || otpLoading}>
                    {otpLoading ? 'Sending...' : 'Get OTP'}
                  </button>
                </div>

                {otpSent && !otpVerified && (
                  <>
                    <label>Enter OTP</label>
                    <div className="otp-row">
                      <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
                      <button type="button" onClick={handleVerifyOtp} disabled={otpLoading || !otp}>
                        {otpLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </>
                )}

                {otpVerified && <p className="success-text">OTP Verified ✔</p>}

                <div className="step-actions">
                  <button type="button" className="secondary-btn" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className="continue-btn" disabled={!otpVerified || loading}>
                    {loading ? 'Submitting...' : 'Submit Issue'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RaiseComplaint;