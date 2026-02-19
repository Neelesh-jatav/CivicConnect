import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
 
const CreateAd = ({ onClose, onAdCreated }) => {
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [offerText, setOfferText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    // Fetch sponsors for the dropdown
    const fetchSponsors = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/v1/admin/sponsors', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setSponsors(data.sponsors);
        } else {
          console.error('Failed to fetch sponsors:', data.message);
        }
      } catch (err) {
        console.error('Failed to fetch sponsors', err);
      }
    };
    fetchSponsors();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
        setError('Please select an image for the ad.');
        return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('sponsor', selectedSponsor);
    formData.append('offerText', offerText);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('image', image);

    try {
      const response = await fetch('http://localhost:5002/api/v1/admin/ads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Advertisement created successfully!');
        if(onAdCreated) onAdCreated();
        onClose();
      } else {
        setError(data.message || 'Failed to create ad.');
      }
    } catch (err) {
      setError('An error occurred while creating the ad.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-modal">
      <div className="admin-form-card">
        <h2 className="auth-title">Create Ad</h2>
        <p className="auth-subtitle">Launch a new advertisement</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sponsor*</label>
            <select value={selectedSponsor} onChange={(e) => setSelectedSponsor(e.target.value)} required>
              <option value="" disabled>Select a sponsor</option>
              {sponsors.map(sponsor => (
                <option key={sponsor._id} value={sponsor._id}>{sponsor.businessName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Ad Image*</label>
            <input type="file" accept="image/*" onChange={handleImageChange} required />
             {preview && <img src={preview} alt="Ad preview" style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }}/>}
          </div>
          <div className="form-group">
            <label>Offer Text</label>
            <input type="text" placeholder="e.g., 15% OFF for community cleanup" value={offerText} onChange={(e) => setOfferText(e.target.value)} />
          </div>
          <div className="form-group" id="ad-start-date">
            <label>Start Date*</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/>
          </div>
          <div className="form-group" id="ad-end-date">
            <label>End Date*</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
