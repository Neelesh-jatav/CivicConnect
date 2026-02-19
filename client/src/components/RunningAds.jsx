import React, { useState, useEffect } from 'react';

const RunningAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="admin-form-container" style={{maxWidth: '800px'}}>
      
      {loading && <p>Loading ads...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Sponsor</th>
              <th>Offer</th>
              <th>Status</th>
              <th>Duration</th>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RunningAds;
