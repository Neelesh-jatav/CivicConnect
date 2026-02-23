import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Feedback = ({ user }) => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        toast.success('Feedback sent successfully!');
      } else {
        toast.error(data.message || 'Failed to send feedback');
      }
    } catch (error) {
      toast.error('An error occurred while sending feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="feedback-container" style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p>Please log in to send feedback.</p>
      </div>
    );
  }

  return (
    <div className="feedback-container" style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>Send Feedback</h2>
      <p>We value your feedback! Please share your thoughts below.<br/>Feedback will be sent to <b>neeleshkumar22j@gmail.com</b>.</p>
      {submitted ? (
        <div style={{ color: 'green', marginTop: 16 }}>
          Thank you for your feedback!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            placeholder="Enter your feedback here..."
            required
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={loading}>
            {loading ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
