import React from 'react';
import '../App.css';

const Helpline = () => {
  return (
    <div className="helpline-container">
      <div className="helpline-hero">
        <h1>Helpline Support</h1>
        <p>Connect with our support team via audio or video call</p>
      </div>

      <div className="helpline-services">
        <div className="service-card">
          <div className="service-icon live-chat">💬</div>
          <h3>Live Chat</h3>
          <p>Chat with support team in real-time</p>
        </div>

        <div className="service-card">
          <div className="service-icon emergency">🆘</div>
          <h3>Emergency</h3>
          <p>Urgent assistance available</p>
        </div>

        <div className="service-card">
          <div className="service-icon schedule">⏰</div>
          <h3>Schedule Call</h3>
          <p>Book a call at your preferred time</p>
        </div>
      </div>

      <div className="helpline-info-section">
        <div className="support-hours">
          <div className="hours-icon">⏱️</div>
          <div className="hours-content">
            <h3>Support Hours</h3>
            <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM</p>
            <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM</p>
            <p><strong>Emergency Hotline:</strong> <span className="highlight">24/7</span></p>
          </div>
        </div>
      </div>

      <div className="helpline-team-section">
        <h2>Available Support Team</h2>

        <div className="support-team-cards">
          <div className="team-card">
            <div className="team-header">
              <img src="https://i.pravatar.cc/150?u=municipal" alt="Municipal Support" className="team-avatar" />
              <div className="team-info">
                <h3>Municipal Support</h3>
                <p className="team-role">General Inquiries</p>
                <p className="team-service">Customer Service</p>
              </div>
              <span className="online-status">●</span>
            </div>
            <div className="team-actions">
              <button className="btn-audio">
                📞 Audio Call
              </button>
              <button className="btn-video">
                📹 Video Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Helpline;
