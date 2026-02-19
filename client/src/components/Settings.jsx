import React from 'react';
import Feedback from './Feedback';
import './Settings.css';

const Settings = ({ theme, toggleTheme }) => {
  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Personalization</h3>
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Dark Mode</span>
            <p className="setting-desc">Switch between light and dark themes</p>
          </div>
          <label className="theme-switch">
            <input 
              type="checkbox" 
              checked={theme === 'dark'} 
              onChange={toggleTheme} 
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Feedback</h3>
        <Feedback />
      </div>
    </div>
  );
};

export default Settings;