import React, { useEffect, useState } from 'react';
import './MyUploadedMedia.css';
import { toast } from 'react-toastify';

const MyUploadedMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUserMedia = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/v1/media/me', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setMedia(data.media);
        }
      } catch (error) {
        console.error("Error fetching user media:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMedia();
  }, []);

  const handleMediaClick = (mediaItem) => {
    setSelectedMedia(mediaItem);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const handleNavigate = (direction) => {
    const currentIndex = media.findIndex(m => m._id === selectedMedia._id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % media.length;
    } else {
      nextIndex = (currentIndex - 1 + media.length) % media.length;
    }
    setSelectedMedia(media[nextIndex]);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5002/api/v1/media/${selectedMedia._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // Remove deleted media from list
        const updatedMedia = media.filter(m => m._id !== selectedMedia._id);
        setMedia(updatedMedia);
        
        // Close lightbox and confirmation
        setSelectedMedia(null);
        setShowDeleteConfirm(false);
        
        toast.success('Image and post deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Error deleting image. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditClick = () => {
    setEditFormData({
      title: selectedMedia.title || '',
      description: selectedMedia.description || '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5002/api/v1/media/${selectedMedia._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
        }),
      });
      const data = await response.json();

      if (data.success) {
        // Update media in list
        const updatedMedia = media.map(m => 
          m._id === selectedMedia._id 
            ? { ...m, title: editFormData.title, description: editFormData.description }
            : m
        );
        setMedia(updatedMedia);
        
        // Update selected media
        setSelectedMedia(prev => ({
          ...prev,
          title: editFormData.title,
          description: editFormData.description,
        }));
        
        setShowEditModal(false);
        toast.success('Post updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Error updating post. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  if (loading) {
    return <div className="my-uploaded-media-container"><p>Loading media...</p></div>;
  }

  if (!media || media.length === 0) {
    return (
      <div className="my-uploaded-media-container">
        <h3>My Uploaded Media</h3>
        <p>You haven't uploaded any media yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="my-uploaded-media-container">
        <h3>My Uploaded Media</h3>
        <div className="media-grid">
          {media.map((mediaItem) => (
            <div 
              key={mediaItem._id} 
              className="media-card"
              onClick={() => handleMediaClick(mediaItem)}
            >
              {mediaItem.type === 'video' ? (
                <video src={mediaItem.url} className="media-image" />
              ) : (
                <img src={mediaItem.url} alt={mediaItem.title || 'Uploaded Media'} className="media-image" />
              )}
              {mediaItem.title && <h4>{mediaItem.title}</h4>}
              {mediaItem.description && <p>{mediaItem.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Modal */}
      {selectedMedia && (
        <div className="media-lightbox-overlay" onClick={handleCloseModal}>
          <div className="media-lightbox-container" onClick={(e) => e.stopPropagation()}>
            {/* Action Buttons Group */}
            <div className="lightbox-button-group">
              <button className="lightbox-close" onClick={handleCloseModal} title="Close gallery">✕</button>
              <button className="lightbox-edit" onClick={handleEditClick} title="Edit this post">✎</button>
              <button className="lightbox-delete" onClick={handleDeleteClick} title="Delete this image">🗑️</button>
            </div>

            {/* Navigation Arrows */}
            {media.length > 1 && (
              <>
                <button className="lightbox-nav prev" onClick={() => handleNavigate('prev')}>❮</button>
                <button className="lightbox-nav next" onClick={() => handleNavigate('next')}>❯</button>
              </>
            )}

            {/* Media Display */}
            <div className="lightbox-content">
              {selectedMedia.type === 'video' ? (
                <video src={selectedMedia.url} controls autoPlay className="lightbox-media" />
              ) : (
                <img src={selectedMedia.url} alt={selectedMedia.title || 'Media'} className="lightbox-media" />
              )}
            </div>

            {/* Media Info */}
            <div className="lightbox-info">
              {selectedMedia.title && <h2>{selectedMedia.title}</h2>}
              {selectedMedia.description && <p>{selectedMedia.description}</p>}
              <span className="lightbox-counter">
                {media.findIndex(m => m._id === selectedMedia._id) + 1} / {media.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay" onClick={handleCancelEdit}>
          <div className="edit-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Post</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  placeholder="Enter post title"
                  maxLength="200"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  placeholder="Enter post description"
                  rows="5"
                  maxLength="1000"
                />
              </div>

              <div className="edit-modal-actions">
                <button 
                  type="button"
                  className="btn-cancel-edit" 
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-save-edit" 
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirm-delete-overlay" onClick={handleCancelDelete}>
          <div className="confirm-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete This Post?</h3>
            <p>This will permanently delete the image and all related information including title, description, likes, comments, and shares.</p>
            <p className="warning-text">⚠️ This action cannot be undone.</p>
            <div className="confirm-delete-actions">
              <button 
                className="btn-cancel" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyUploadedMedia;
