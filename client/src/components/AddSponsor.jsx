import React, { useState } from 'react';
import { toast } from 'react-toastify';
 
const AddSponsor = ({ onClose, onSponsorAdded }) => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sponsorData = {
      businessName,
      category,
      description,
      location: { city, area },
      phone,
      website,
    };

    try {
      const response = await fetch('http://localhost:5002/api/v1/admin/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sponsorData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Sponsor added successfully!');
        onSponsorAdded();
        onClose();
      } else {
        setError(data.message || 'Failed to add sponsor.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-modal">
      <div className="admin-form-card">
        <h2 className="auth-title">Add Sponsor</h2>
        <p className="auth-subtitle">Register a new sponsor</p>
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Business Name*</label>
                <input type="text" placeholder="e.g. Sparkle Cleaning Co." value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </div>
            <div className="form-group">
                <label>Category</label>
                <input type="text" placeholder="e.g. Cleaning Services" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Short description of the business" value={description} onChange={(e) => setDescription(e.target.value)} rows="3"></textarea>
            </div>
            <div className="form-group" id="sponsor-city">
                <label>City</label>
                <input type="text" placeholder="e.g. New York" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form-group" id="sponsor-area">
                <label>Area</label>
                <input type="text" placeholder="e.g. Brooklyn" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="form-group" id="sponsor-phone">
                <label>Phone</label>
                <input type="text" placeholder="+1 234 567 890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group" id="sponsor-website">
                <label>Website</label>
                <input type="text" placeholder="www.example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          
          {error && <p className="error-message">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Sponsor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSponsor;
