import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const Login = ({ onLoginSuccess, onClose }) => {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot/Reset Password States
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const loginHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5002/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // IMPORTANT: Send and receive cookies with the request
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user); // Pass the user data to the success handler
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('An error occurred during login.');
    }
  };

  const forgotPasswordHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok) {
        toast.info(data.message);
        setView('reset');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordHandler = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/password/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp, password: newPassword, confirmPassword: confirmNewPassword }),
        credentials: 'include',
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok) {
        toast.success('Password reset successful! You are now logged in.');
        onLoginSuccess(data.user);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'forgot') {
    return (
      <div className="auth-page">
        <div className="auth-card glass">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive an OTP</p>
          <form onSubmit={forgotPasswordHandler}>
            <input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
          </form>
          <div className="auth-links">
            <span onClick={() => setView('login')}>Back to Login</span>
          </div>
        </div>
        <footer className="auth-footer">© 2026 CivicConnect. All Rights Reserved.</footer>
      </div>
    );
  }

  if (view === 'reset') {
    return (
      <div className="auth-page">
        <div className="auth-card glass">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter OTP and new password</p>
          <form onSubmit={resetPasswordHandler}>
            <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
          <div className="auth-links">
            <span onClick={() => setView('login')}>Back to Login</span>
          </div>
        </div>
        <footer className="auth-footer">© 2026 CivicConnect. All Rights Reserved.</footer>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <h2 className="auth-title">Login</h2>
        <p className="auth-subtitle">Nice to see you again!</p>

        <form onSubmit={loginHandler}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn">
            Sign In →
          </button>
        </form>

        <div className="auth-links">
          <span onClick={() => setView('forgot')}>Forgot Password?</span>
        </div>
      </div>

      <footer className="auth-footer">
        © 2026 CivicConnect. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Login;
