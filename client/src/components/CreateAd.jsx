import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './CreateAd.css';
 
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
    <div
      className="admin-form-modal"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
        {/* Content */}
        <div className="create-ad-content">
          <div className="create-ad-grid">
            {/* Left Column - Form + Image Upload */}
            <div className="create-ad-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Sponsor *</label>
                  <select 
                    value={selectedSponsor} 
                    onChange={(e) => setSelectedSponsor(e.target.value)} 
                    required
                  >
                    <option value="" disabled>Select sponsor</option>
                    {sponsors.map(sponsor => (
                      <option key={sponsor._id} value={sponsor._id}>{sponsor.businessName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Offer Text *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 15% OFF" 
                    value={offerText} 
                    onChange={(e) => setOfferText(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Ad Image *</label>
                  <div className="create-ad-upload-area">
                    <input 
                      type="file" 
                      id="ad-image-input" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      required 
                    />
                    <label htmlFor="ad-image-input">
                      <span className="upload-icon">📷</span>
                      <p className="upload-text">Drag image here or click</p>
                      <p className="upload-hint">JPG, PNG (Max 5MB)</p>
                    </label>
                  </div>
                </div>

                {error && <p className="create-ad-error">{error}</p>}

                <div className="create-ad-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={onClose} 
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Image Preview */}
            <div className="create-ad-preview">
              {preview ? (
                <>
                  <label>Preview</label>
                  <img src={preview} alt="Ad preview" />
                </>
              ) : (
                <div className="create-ad-preview-placeholder">
                  🖼️
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAd;
