import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const Register = ({ isAdminRegistration, isOfficerRegistration, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [avatar, setAvatar] = useState(null);

  const [verificationToken, setVerificationToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userType, setUserType] = useState('user');
  const [officerLevel, setOfficerLevel] = useState('A');

  /* ================= SEND OTP ================= */
  const sendOtpHandler = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5002/api/v1/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to send OTP');
        return;
      }

      toast.success(data.message);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while sending OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtpHandler = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5002/api/v1/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'OTP verification failed');
        return;
      }

      toast.success(data.message);
      setVerificationToken(data.verificationToken);
      setOtpVerified(true);
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during OTP verification');
    } finally {
      setLoading(false);
    }
  };

  /* ================= REGISTER ================= */
  const registerHandler = async () => {
    if (!otpVerified) {
      toast.error('Please verify OTP first');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password and Confirm Password do not match');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('verificationToken', verificationToken);

      if (avatar) formData.append('avatar', avatar);
      if (isAdminRegistration) formData.append('role', userType);
      if (isOfficerRegistration) formData.append('officerLevel', officerLevel);

      const response = await fetch('http://localhost:5002/api/v1/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 409 ||
          data.error?.toLowerCase().includes('already')
        ) {
          toast.info('User already registered. Please login.');
        } else {
          toast.error(data.error || 'Registration failed');
        }
        return;
      }

      toast.success('Registration successful!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORM SUBMIT ================= */
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (loading) return;

    if (!otpSent) sendOtpHandler();
    else if (!otpVerified) verifyOtpHandler();
    else registerHandler();
  };

  /* ================= INPUT CHANGE ================= */
  const onChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'avatar') setAvatar(files[0]);
    if (name === 'name') setName(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
    if (name === 'otp') setOtp(value);
    if (name === 'userType') setUserType(value);
    if (name === 'officerLevel') setOfficerLevel(value);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <h2 className="auth-title">Sign Up</h2>
        <p className="auth-subtitle">Create your CivicConnect account</p>

        <form onSubmit={onSubmitHandler}>
          <input name="name" placeholder="Name" value={name} onChange={onChange} required />

          <input type="file" name="avatar" accept="image/*" onChange={onChange} />

          {avatar && (
            <img
              src={URL.createObjectURL(avatar)}
              alt="preview"
              onLoad={(e) => URL.revokeObjectURL(e.target.src)}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                margin: '10px auto',
                objectFit: 'cover',
              }}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={onChange}
            required
            disabled={otpSent}
          />

          <input type="password" name="password" placeholder="Password" value={password} onChange={onChange} required />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={onChange}
            required
          />

          {isOfficerRegistration && (
            <select name="officerLevel" value={officerLevel} onChange={onChange}>
              <option value="A">Level A</option>
              <option value="B">Level B</option>
            </select>
          )}

          {otpSent && (
            <input name="otp" placeholder="Enter OTP" value={otp} onChange={onChange} required />
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? 'Please wait...'
              : !otpSent
              ? 'Send OTP'
              : !otpVerified
              ? 'Verify OTP'
              : 'Register'}
          </button>
        </form>
      </div>

      <footer className="auth-footer">
        © 2026 CivicConnect. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Register;
