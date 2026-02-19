import React, { useState } from 'react';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send this to a backend or email service
    setSubmitted(true);
  };

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
          <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
