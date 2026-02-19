import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const OtpCheck = ({ onClose, toggleLoginModal, user }) => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const handleGetOtp = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5002/api/v1/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        onClose();
        toggleLoginModal();
        return;
      }

      if (data.success) {
        setOtpSent(true);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error('An error occurred while sending OTP.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5002/api/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        onClose();
        toggleLoginModal();
        return;
      }

      if (data.success) {
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
      } else {
        toast.error(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error('An error occurred during OTP verification.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-check-container">
      <div className="otp-check-header">
        <h2>Test OTP Sending & Verification</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="otp-check-content">

        {!otpSent ? (
          <button type="button" className="btn btn-info" onClick={handleGetOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Get OTP'}
          </button>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ marginBottom: '10px' }}>An OTP has been sent to your registered email address. Enter it below to verify.</p>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleGetOtp} disabled={loading}>
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || otpVerified}>
                {loading ? 'Verifying...' : (otpVerified ? 'Verified!' : 'Verify OTP')}
              </button>
            </div>
          </form>
        )}

        {otpVerified && <p style={{ marginTop: '10px', color: '#4CAF50' }}>OTP is successfully verified.</p>}
      </div>
    </div>
  );
};

export default OtpCheck;