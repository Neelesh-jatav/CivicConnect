import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import Modal from './Modal';
import Register from './Register';
import AnalyticsDashboard from './AnalyticsDashboard'; // Import the new component
import '../App.css';

const AdminDashboard = ({ toggleAddAdminModal }) => {
  const [showComplaintsOptions, setShowComplaintsOptions] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAllComplaintsTable, setShowAllComplaintsTable] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState('Get All');
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [showManageUsersOptions, setShowManageUsersOptions] = useState(false); // New state
  const [showAllUsersTable, setShowAllUsersTable] = useState(false);
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [showAnalyticsOptions, setShowAnalyticsOptions] = useState(true);

  useEffect(() => {
    if (showAllComplaintsTable) {
      const fetchAllComplaints = async () => {
        try {
          setLoading(true);
          const { data } = await axios.get('http://localhost:5002/api/v1/complaints', {
            withCredentials: true,
          });

          setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
          setError(null);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch complaints');
          setComplaints([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAllComplaints();
    }
  }, [showAllComplaintsTable]);

  const handleManageComplaintsClick = () => {
    const isOpening = !showComplaintsOptions;
    setShowComplaintsOptions(isOpening);
    setShowAllComplaintsTable(isOpening);
    if (isOpening) {
      setComplaintFilter('Get All');
    }
    setShowManageUsersOptions(false);
    setShowAnalyticsOptions(false);
  };

  const handleComplaintOptionClick = (option) => {
    setComplaintFilter(option);
    setShowAllComplaintsTable(true);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedComplaint(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleUsersClick = () => {
    setShowManageUsersOptions(!showManageUsersOptions); // Toggle user options
    setShowComplaintsOptions(false); // Close complaints options if open
    setShowAllComplaintsTable(false); // Hide complaints table
    setShowAnalyticsOptions(false); // Close analytics options if open
  };

  const handleAddNewAdminClick = () => {
    console.log('Add New Admin button clicked');
    toggleAddAdminModal(); // Call the prop to open the Add Admin modal
  };

  const handleAddNewOfficerClick = () => {
    setShowAddOfficerModal(true);
  };

  const handleCloseAddOfficerModal = () => {
    setShowAddOfficerModal(false);
  };

  const handleUpdateComplaint = (updatedComplaint) => {
    setComplaints((prevComplaints) =>
      prevComplaints.map((complaint) =>
        complaint._id === updatedComplaint._id ? updatedComplaint : complaint
      )
    );
    setSelectedComplaint(updatedComplaint); // Update selected complaint in dashboard state as well
  };

  const handleGetAllUsersClick = async () => {
    console.log('Get All Users button clicked');
    setShowAllUsersTable(true);
    try {
      setUserLoading(true);
      const { data } = await axios.get('http://localhost:5002/api/v1/admin/users', {
        withCredentials: true,
      });
      setUsers(Array.isArray(data.users) ? data.users : []);
      setUserError(null);
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    console.log(`Delete user with ID: ${userId}`);
    try {
      await axios.delete(`http://localhost:5002/api/v1/admin/user/${userId}`, {
        withCredentials: true,
      });
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSuspendUser = async (userId, isSuspended) => {
    console.log(`${isSuspended ? 'Unsuspend' : 'Suspend'} user with ID: ${userId}`);
    try {
      await axios.put(`http://localhost:5002/api/v1/admin/user/${userId}/suspend`, { isSuspended: !isSuspended }, {
        withCredentials: true,
      });
      setUsers(users.map((user) =>
        user._id === userId ? { ...user, isSuspended: !isSuspended } : user
      ));
    } catch (err) {
      console.error('Failed to suspend/unsuspend user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user suspension status');
    }
  };

  const handleAnalyticsClick = () => {
    setShowAnalyticsOptions(!showAnalyticsOptions);
    setShowComplaintsOptions(false);
    setShowManageUsersOptions(false);
    setShowAllComplaintsTable(false);
    setShowAllUsersTable(false);
  };

  return (
    <div className="admin-dashboard-page">
    
    <div className="admin-dashboard-header">
      <h2>Admin Dashboard</h2>
      <p>Welcome to the CivicConnect Admin Portal!</p>
    </div>

    {/* ACTION BAR — ALWAYS VISIBLE */}
    <div className="admin-action-bar">
      <button className="admin-action-btn" onClick={handleAnalyticsClick}>
        Analytics
      </button>

      <button className="admin-action-btn" onClick={handleManageComplaintsClick}>
        Manage Complaints
      </button>

      <button className="admin-action-btn" onClick={handleUsersClick}>
        Manage Users
      </button>

      <button className="admin-action-btn" onClick={handleAddNewAdminClick}>
        Add New Admin
      </button>

      <button className="admin-action-btn" onClick={handleAddNewOfficerClick}>
        Add New Officer
      </button>
    </div>

    {showComplaintsOptions && (
      <div className="complaint-filter-bar">
        <button
          className={`filter-pill ${complaintFilter === 'Get All' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Get All')}
        >
          All
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Pending' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Pending')}
        >
          Pending
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Accepted' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Accepted')}
        >
          Accepted
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Allocated to Department' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Allocated to Department')}
        >
          Dept Allocated
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Officer Allocated' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Officer Allocated')}
        >
          Officer Allocated
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'In Progress' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('In Progress')}
        >
          In Progress
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Solved' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Solved')}
        >
          Solved
        </button>

        <button
          className={`filter-pill ${complaintFilter === 'Rejected' ? 'active' : ''}`}
          onClick={() => handleComplaintOptionClick('Rejected')}
        >
          Rejected
        </button>
      </div>
    )}

    {showManageUsersOptions && (
      <div className="user-options-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        <button className="btn" onClick={handleGetAllUsersClick}>Get All Users</button>
      </div>
    )}
    
    {showAnalyticsOptions && <AnalyticsDashboard />}

      {showAllUsersTable && (
        <div className="all-users-section">
          <h3>All Users Overview</h3>
          {userLoading ? (
            <p>Loading users...</p>
          ) : userError ? (
            <p className="error-message">Error: {userError}</p>
          ) : users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user._id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.isSuspended ? 'Suspended' : 'Active'}</td>
                      <td>
                        <button className="btn btn-danger" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                        <button className={`btn ${user.isSuspended ? 'btn-success' : 'btn-warning'}`} onClick={() => handleSuspendUser(user._id, user.isSuspended)}>
                          {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAllComplaintsTable && (
        <div className="all-complaints-section">
          <h3>
            {complaintFilter === 'Get All' ? 'All Complaints Overview' : `${complaintFilter} Complaints`}
          </h3>
          {loading ? (
            <p>Loading all complaints...</p>
          ) : error ? (
            <p className="error-message">Error: {error}</p>
          ) : complaints.length === 0 ? (
            <p>No complaints found.</p>
          ) : (
            <div className="complaints-card-container">

              {/* Toolbar */}
              <div className="complaints-toolbar">
                <div className="search-box">
                  🔍 Search by title, description, or category...
                </div>
                <div className="toolbar-actions">
                  <button className="icon-btn">⟳</button>
                  <button className="icon-btn">⬇ Export</button>
                </div>
              </div>

              {/* Table */}
              <div className="complaints-list">
                {complaints
                  .filter((complaint) => {
                    if (complaintFilter === 'Get All') return true;
                    if (complaintFilter === 'Pending') return complaint.status === 'Pending';
                    if (complaintFilter === 'Accepted') return complaint.status === 'Accepted';
                    if (complaintFilter === 'Allocated to Department') return complaint.status === 'Allocated to Department';
                    if (complaintFilter === 'Officer Allocated') return complaint.status === 'Allocated to Officer';
                    if (complaintFilter === 'In Progress') return complaint.status === 'In Progress';
                    if (complaintFilter === 'Solved') return complaint.status === 'Resolved' || complaint.status === 'Closed';
                    if (complaintFilter === 'Rejected') return complaint.status === 'Rejected';
                    return true;
                  })
                  .map((complaint, index) => (
                    <div className="complaint-row" key={complaint._id}>

                      <div className="complaint-id">
                        #{index + 1}
                      </div>

                      <div className="complaint-img-box">
                        {complaint.images && complaint.images.length > 0 ? (
                          <img src={complaint.images[0].url} alt="Complaint" />
                        ) : (
                          <span style={{ fontSize: '20px' }}>📷</span>
                        )}
                      </div>

                      <div className="complaint-main">
                        <h4>{complaint.title}</h4>
                        <p className="complaint-meta">
                          {complaint.category} • {formatDate(complaint.createdAt)}
                        </p>
                      </div>

                      <div className="complaint-user">
                        <strong>{complaint.user?.name || 'N/A'}</strong>
                        <span>{complaint.user?.email || 'N/A'}</span>
                      </div>

                      <div className={`status-pill status-${complaint.status.toLowerCase().replace(/\s/g, '-')}`}>
                        {complaint.status}
                      </div>

                      <div className="complaint-actions">
                        <button className="primary-btn" onClick={() => handleViewDetails(complaint)}>
                          View
                        </button>
                      </div>

                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showDetailsModal && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={handleCloseDetailsModal}
          onUpdateComplaint={handleUpdateComplaint}
        />
      )}

      {showAddOfficerModal && (
        <Modal isOpen={showAddOfficerModal} onClose={handleCloseAddOfficerModal}>
          <Register isOfficerRegistration={true} onClose={handleCloseAddOfficerModal} />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
