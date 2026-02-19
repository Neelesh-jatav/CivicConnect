import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const ImageUploadCheck = ({ onClose, toggleLoginModal }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadedImageUrl(null); // Clear previous upload
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image to upload.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', selectedFile); // 'image' should match the field name in multer middleware

    try {
      const response = await fetch('http://localhost:5002/api/v1/upload/test', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        onClose();
        toggleLoginModal();
        return;
      }

      if (data.success) {
        setUploadedImageUrl(data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.message || 'Failed to upload image.');
      }
    } catch (err) {
      toast.error('An error occurred during image upload.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload-check-container">
      <div className="image-upload-check-header">
        <h2>Test Image Upload to Cloudinary</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="image-upload-check-content">

        <div className="form-group">
          <label htmlFor="imageFile">Select Image</label>
          <input
            type="file"
            id="imageFile"
            name="imageFile"
            accept="image/*"
            onChange={handleFileChange}
            className="form-control-file"
          />
        </div>

        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={loading || !selectedFile}>
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>

        {uploadedImageUrl && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Uploaded Image Preview:</p>
            <img src={uploadedImageUrl} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd' }} />
            <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>URL: {uploadedImageUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadCheck;