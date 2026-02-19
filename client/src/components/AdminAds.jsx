import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import AddSponsor from "./AddSponsor";
import CreateAd from "./CreateAd";
import RunningAds from "./RunningAds";

const AdminAds = () => {
  const [sponsors, setSponsors] = useState([]);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [activeTab, setActiveTab] = useState('sponsors'); // 'sponsors' or 'runningAds'

  const fetchSponsors = async () => {
    try {
        const res = await fetch("http://localhost:5002/api/v1/admin/sponsors", {
            credentials: "include",
        });
        if (!res.ok) {
            console.error('Failed to fetch sponsors with status:', res.status);
            // Throw an error to be caught by the catch block
            throw new Error(`Failed to fetch sponsors. Status: ${res.status}`);
        }
        const data = await res.json();
        setSponsors(data.sponsors || []);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        // Here you could set an error state to show a message to the user
    }
  };


  useEffect(() => {
    if (activeTab === 'sponsors') {
      fetchSponsors();
    }
  }, [activeTab]);

  return (
    <div className="admin-ads-page">
      {/* Header */}
      <div className="admin-ads-header">
        <div>
          <h2>Ads & Sponsors</h2>
          <p>Manage sponsors, advertisements and visibility</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sponsors')}
        >
          Sponsors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'runningAds' ? 'active' : ''}`}
          onClick={() => setActiveTab('runningAds')}
        >
          Running Ads
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content">
        {activeTab === 'sponsors' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Sponsors List</h3>
              <button className="admin-action-btn primary" onClick={() => setShowAddSponsor(true)}>
                ➕ Add Sponsor
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Featured</th>
                  <th>Verified</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr key={s._id} className="sponsor-row">
                    <td className="business-cell">
                      <div className="business-avatar">
                        {s.businessName?.charAt(0)}
                      </div>
                      <div>
                        <strong>{s.businessName}</strong>
                        <div className="sub-text">{s.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-chip">{s.category}</span>
                    </td>
                    <td>{s.location?.city || "—"}</td>
                    <td>
                      {s.isFeatured && <span className="badge featured">Featured</span>}
                    </td>
                    <td>
                      {s.isVerified ? <span className="badge verified">✔ Verified</span> : <span className="badge unverified">Pending</span>}
                    </td>
                    <td>
                      <span className={`status-pill ${s.isActive ? "active" : "inactive"}`}>
                        {s.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'runningAds' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Running Advertisements</h3>
              <button className="admin-action-btn secondary" onClick={() => setShowCreateAd(true)}>
                🎨 Create Ad
              </button>
            </div>
            <RunningAds />
          </div>
        )}
      </div>


      {/* Modals */}
      {showAddSponsor && (
        <Modal isOpen onClose={() => setShowAddSponsor(false)}>
          <AddSponsor onClose={() => setShowAddSponsor(false)} onSponsorAdded={fetchSponsors} />
        </Modal>
      )}

      {showCreateAd && (
        <Modal isOpen onClose={() => setShowCreateAd(false)}>
          <CreateAd onClose={() => setShowCreateAd(false)} />
        </Modal>
      )}
    </div>
  );
};

export default AdminAds;