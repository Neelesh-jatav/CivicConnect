import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const MediaUpload = ({ onClose, onMediaUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.error('Please select an image to upload.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', image);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await fetch('http://localhost:5002/api/v1/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Media uploaded successfully!');
        onMediaUploadSuccess(data.media);
        onClose();
      } else {
        toast.error(data.message || 'Failed to upload media.');
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      toast.error('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="media-upload-card">
    <h3 className="media-title">Add Media</h3>

    <form onSubmit={handleSubmit} className="upload-form">

      {/* SIMPLE FILE INPUT */}
      <div className="form-group">
        <label>Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>

      {/* TITLE */}
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
      </div>

      {/* DESCRIPTION */}
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows="3"
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="upload-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!image || loading}
        >
          {loading ? 'Uploading...' : 'Upload Media'}
        </button>
      </div>
    </form>
  </div>
);
};

export default MediaUpload;
