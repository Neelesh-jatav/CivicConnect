import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './RunningAds.css';

const RunningAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [editFormData, setEditFormData] = useState({
    offerText: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        // Assuming there's an endpoint to get all ads for admins.
        // If not, this needs to be created.
        const response = await fetch('http://localhost:5002/api/v1/ads');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setAds(data.ads);
        } else {
          setError('Failed to fetch ads.');
        }
      } catch (err) {
        setError('An error occurred while fetching ads.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const getStatus = (ad) => {
    const today = new Date();
    const startDate = new Date(ad.startDate);
    const endDate = new Date(ad.endDate);

    if (!ad.isActive) return { text: 'Disabled', className: 'inactive' };
    if (today < startDate) return { text: 'Scheduled', className: 'scheduled' };
    if (today > endDate) return { text: 'Expired', className: 'expired' };
    return { text: 'Active', className: 'active' };
  };

  const handleEditAd = (adId) => {
    const ad = ads.find(a => a._id === adId);
    if (ad) {
      setEditingAd(ad);
      setPreviewUrl(ad.image.url);
      setEditImage(null);
      setEditFormData({
        offerText: ad.offerText || '',
        startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
        endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
      });
      setShowEditModal(true);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setIsCropping(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const finalizeCrop = async () => {
    if (croppedAreaPixels && previewUrl) {
      try {
        const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
        const croppedFile = new File([croppedBlob], editImage.name, {
          type: 'image/jpeg',
        });
        setEditImage(croppedFile);
        setIsCropping(false);
        // Show the cropped preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(croppedFile);
      } catch (err) {
        console.error('Error cropping image:', err);
        setError('Error cropping image');
      }
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;

    try {
      setUpdating(true);
      const formData = new FormData();
      
      if (editImage) {
        formData.append('image', editImage);
      }

      // Add form fields
      formData.append('offerText', editFormData.offerText);
      formData.append('startDate', editFormData.startDate);
      formData.append('endDate', editFormData.endDate);

      const response = await fetch(`http://localhost:5002/api/v1/admin/ads/${editingAd._id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the ad in the list
        setAds(ads.map(ad => ad._id === editingAd._id ? data.ad : ad));
        setSuccess('Ad updated successfully!');
        setShowEditModal(false);
        setEditingAd(null);
        setEditImage(null);
        setPreviewUrl(null);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update ad.');
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while updating the ad.';
      setError(errorMsg);
      console.error('Error updating ad:', err);
    } finally {
      setUpdating(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAd(null);
    setEditImage(null);
    setPreviewUrl(null);
    setIsCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setEditFormData({
      offerText: '',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="admin-form-container" style={{maxWidth: '480px'}}>
      
      {loading && <p>Loading ads...</p>}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Sponsor</th>
              <th>Offer</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map(ad => {
              const status = getStatus(ad);
              return (
                <tr key={ad._id}>
                  <td>
                    <img src={ad.image.url} alt={ad.offerText} style={{ width: '100px', height: 'auto', borderRadius: '8px' }} />
                  </td>
                  <td>{ad.sponsor?.businessName || 'N/A'}</td>
                  <td>{ad.offerText}</td>
                  <td>
                    <span className={`status-pill ${status.className}`}>
                      {status.text}
                    </span>
                  </td>
                  <td>
                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn-edit-ad" onClick={() => handleEditAd(ad._id)}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Edit Ad Modal */}
      {showEditModal && editingAd && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="edit-ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Ad Image</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="edit-ad-form">
                {!isCropping ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="ad-image">Ad Image</label>
                      <div className="image-upload-section">
                        <input 
                          type="file" 
                          id="ad-image" 
                          accept="image/*" 
                          onChange={handleImageSelect}
                          className="file-input"
                        />
                        <label htmlFor="ad-image" className="file-label">
                          Choose Image
                        </label>
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="image-preview">
                        <p>Preview:</p>
                        <img src={previewUrl} alt="Ad Preview" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cropper-wrapper">
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={16 / 9}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={handleCropComplete}
                    />
                  </div>
                )}

                <div className="form-info">
                  <p><strong>Sponsor:</strong> {editingAd.sponsor?.businessName || 'N/A'}</p>
                  
                  <div className="form-group">
                    <label htmlFor="offer-text">Offer Text:</label>
                    <input
                      type="text"
                      id="offer-text"
                      name="offerText"
                      value={editFormData.offerText}
                      onChange={handleFormChange}
                      className="form-input"
                      placeholder="Enter offer text"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="start-date">Start Date:</label>
                    <input
                      type="date"
                      id="start-date"
                      name="startDate"
                      value={editFormData.startDate}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end-date">End Date:</label>
                    <input
                      type="date"
                      id="end-date"
                      name="endDate"
                      value={editFormData.endDate}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {!isCropping ? (
                <>
                  <button className="btn-cancel" onClick={closeEditModal} disabled={updating}>Cancel</button>
                  <button 
                    className="btn-save" 
                    onClick={handleUpdateAd} 
                    disabled={updating || !editFormData.offerText || !editFormData.startDate || !editFormData.endDate}
                  >
                    {updating ? 'Updating...' : 'Update Ad'}
                  </button>
                </>
              ) : (
                <>
                  <div className="crop-controls">
                    <label htmlFor="zoom-slider" className="zoom-label">Zoom:</label>
                    <input
                      id="zoom-slider"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="zoom-slider"
                    />
                    <span className="zoom-display">{zoom.toFixed(2)}x</span>
                  </div>
                  <button className="btn-cancel" onClick={() => { setIsCropping(false); setPreviewUrl(null); }} disabled={updating}>Cancel</button>
                  <button className="btn-crop" onClick={finalizeCrop}>
                    Crop Image
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningAds;
