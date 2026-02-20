import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Helpline from './components/Helpline';
import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import Modal from './components/Modal';
import RaiseComplaint from './components/RaiseComplaint';
import Notifications from './Notifications';
import Settings from './components/Settings';



import MyComplaints from './components/MyComplaints'; // New import
import AdminDashboard from './components/AdminDashboard'; // New import
import MediaUpload from './components/MediaUpload'; // New import for MediaUpload
import MediaFeed from './components/MediaFeed'; // New import for MediaFeed
import AnalyticsDashboard from './components/AnalyticsDashboard'; // New import for AnalyticsDashboard
import AdsCarousel from './components/AdsCarousel'; // New import for Ads Carousel
import AdminAds from './components/AdminAds'; // New import for Admin Ads
import HomeMediaShorts from './components/HomeMediaShorts'; // New import for Home Media Shorts
import PublicUserProfile from './components/PublicUserProfile'; // New import for Public User Profile
import CivicConnectLogo from './assets/CivicConnectLogo.png';
import Impact from './components/Impact';
import TrendingIssues from './components/TrendingIssues';

function App() {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const toggleAddAdminModal = () => {
    setShowAddAdminModal(!showAddAdminModal);
  };
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRaiseComplaintModal, setShowRaiseComplaintModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // New state to manage main content view
  const [viewingUserId, setViewingUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchNotifications = async () => {
    if (user) {
      try {
        const res = await fetch('http://localhost:5002/api/v1/notifications', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('http://localhost:5002/api/v1/me', {
          credentials: 'include',
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log('Not logged in');
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleRegisterModal = () => {
    setShowRegisterModal(!showRegisterModal);
  };

  const toggleLoginModal = () => {
    setShowLoginModal(!showLoginModal);
  };

  

  const toggleRaiseComplaintModal = () => {
    if (!isLoggedIn) {
      toast.warning('Please login to report an issue');
      setShowLoginModal(true);
    } else {
      setShowRaiseComplaintModal(!showRaiseComplaintModal);
    }
  };

  

  

  

  

  

  const handleLoginSuccess = (loggedInUser) => {
    setIsLoggedIn(true);
    setUser(loggedInUser);
    toast.success(`Welcome back, ${loggedInUser.name || 'User'} 👋`);
    if (loggedInUser.role === 'admin') {
      setCurrentView('adminDashboard');
    }
    setShowLoginModal(false); // Close login modal
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/v1/logout', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        toast.info('Logged out successfully 👋');
        setIsLoggedIn(false);
        setUser(null);
        setNotifications([]);
        setSidebarOpen(false);
        setCurrentView('home');
      } else {
        toast.error(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('An error occurred during logout');
    }
  };

  const handleUserClick = (userId) => {
    setViewingUserId(userId);
    setCurrentView('publicProfile');
  };

  const handleNavigation = (link) => {
    if (link === '/my-complaints') {
      setCurrentView('myComplaints');
    }
  };

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={theme}
      />
      <header className="App-header">
        <div className="header-content-wrapper">
          <div className="header-left">
            {/* <button className="hamburger-btn" onClick={toggleSidebar}>
              <svg viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button> */}
            {/* <div className="logo-container">
              <img src={CivicConnectLogo} alt="CivicConnect Logo" className="logo-svg" />
              <div className="logo-text">
                <h1>CivicConnect</h1>
                <p className="tagline">
                  {user && user.role === 'admin' ? 'Community Complaint resolving portal' : 'Community Complaint raise portal'}
                </p>
              </div>
            </div> */}
          </div>
          {user && user.role === 'admin' && (
            <div className="admin-portal-heading">
              <h2>Admin Portal</h2>
            </div>
          )}
          <div className="header-right">
            <input type="text" placeholder="Search..." className="search-input" />
            {!isLoggedIn ? (
              <button className="btn btn-login" onClick={toggleLoginModal}>Login</button>
            ) : (
              <button className="btn btn-profile" onClick={() => { setCurrentView('profile'); }}>Profile</button>
            )}
            <button className="btn btn-register" onClick={toggleRegisterModal}>Register</button>
          </div>
        </div>
      </header>
      <div className="main-container">
        <nav className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <h2>CivicConnect</h2>
            <p>Community Issue Reporting</p>
          </div>

          {/* User Info */}
          {isLoggedIn && (
            <div className="sidebar-user">
              <img
                src={user?.avatar?.url || user?.avatar || 'https://i.pravatar.cc/100'}
                alt="user"
                className="sidebar-avatar"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
              />
              <div>
                <span className="username">{user?.email?.split('@')[0]}</span>
                <span className="phone">{user?.phone}</span>
              </div>
              <span className="verified">✔</span>
            </div>
          )}

          <div className="sidebar-scroll">
            {/* Main */}
            <div className="sidebar-section">
              <p className="section-title">MAIN</p>

              <a className={`sidebar-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}>
                🏠 <span>Home</span>
              </a>

              <a className="sidebar-item" onClick={toggleRaiseComplaintModal}>
                ➕ <span>Report Issue</span>
              </a>

              <a className={`sidebar-item notification ${currentView === 'notifications' ? 'active' : ''}`} onClick={() => { setCurrentView('notifications'); setSidebarOpen(false); }}>
                🔔 <span>Notifications</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="badge">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </a>

              <a className={`sidebar-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }}>
                👤 <span>Profile</span>
              </a>

              <a className={`sidebar-item ${currentView === 'helpline' ? 'active' : ''}`}>
                🎧 <span onClick={() => { setCurrentView('helpline'); setSidebarOpen(false); }}>Helpline</span>
              </a>
            </div>

            {/* Admin */}
            {user && user.role === 'admin' && (
              <div className="sidebar-section">
                <p className="section-title">ADMINISTRATION</p>

                <a className={`sidebar-item ${currentView === 'adminDashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('adminDashboard'); setSidebarOpen(false); }}>
                  🛡 <span>Admin Dashboard</span>
                </a>
                <a
                  className={`sidebar-item ${currentView === "ads" ? "active" : ""}`}
                  onClick={() => setCurrentView("ads")}
                >
                  📢 <span>Ads & Sponsors</span>
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            <a className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}>
              ⚙ <span>Settings</span>
            </a>

            {isLoggedIn && (
              <a className="sidebar-item logout" onClick={handleLogout}>
                🚪 <span>Logout</span>
              </a>
            )}
          </div>
        </nav>
        <main className="content">
          {currentView === 'home' && (
            <>
              <section className="hero">
                <div className="hero-content">
                  <h2>Voice Your Concerns. Drive Change.</h2>
                  <p>The easiest way to report and track non-emergency issues in your community.</p>
                  <button className="btn btn-cta" onClick={toggleRaiseComplaintModal}>File a Complaint</button>
                </div>
              </section>
              
              <section className="features">
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </div>
                  <h3>Easy Reporting</h3>
                  <p>Quickly submit complaints with our simple, guided form.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                  <h3>Track Progress</h3>
                  <p>Stay updated on the status of your complaints in real-time.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  </div>
                  <h3>Public Transparency</h3>
                  <p>View and support complaints submitted by other community members.</p>
                </div>
              </section>
              <section className="home-ads-layout">
                {/* LEFT — Community Shorts */}
                <div className="home-left-column">
                  <HomeMediaShorts onUserClick={handleUserClick} onConnectionChange={fetchNotifications} />
                </div>

                {/* CENTER — Impact + Trending (stacked into one card) */}
                <div className="home-center-column">
                  <div className="center-stack">
                    {isLoggedIn && <Impact user={user} />}
                    <TrendingIssues />
                  </div>
                </div>

                {/* RIGHT — Ads */}
                <div className="home-right-column">
                  <div className="local-partners-header">
                    <div className="partners-icon">🤝</div>
                    <div className="partners-content">
                      <h3>Local Partners</h3>
                      <span className="sponsored-badge-new">SPONSORED</span>
                    </div>
                  </div>
                  <AdsCarousel />
                </div>
              </section>
            </>
          )}

          {currentView === 'adminDashboard' && (
            <AdminDashboard toggleAddAdminModal={toggleAddAdminModal} />
          )}

          {currentView === "ads" && <AdminAds />}

          {currentView === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {currentView === 'notifications' && (
            <Notifications
              notifications={notifications}
              setNotifications={setNotifications}
              onNavigate={handleNavigation}
            />
          )}

          {currentView === 'profile' && (
            <Profile user={user} setCurrentView={setCurrentView} onProfileUpdate={(updatedUser) => setUser(updatedUser)} />
          )}

          {currentView === 'publicProfile' && (
            <PublicUserProfile userId={viewingUserId} onBack={() => setCurrentView('home')} />
          )}

          {currentView === 'myComplaints' && (
            <MyComplaints user={user} />
          )}

          {currentView === 'media' && (
            <MediaUpload
              user={user}
              onClose={() => setCurrentView('profile')}
              onMediaUploadSuccess={(newMedia) => {
                setUser((prevUser) => ({
                  ...prevUser,
                  media: [...(prevUser.media || []), newMedia],
                }));
                setCurrentView('profile'); // Optionally go back to profile after upload
              }}
            />
          )}
          {currentView === 'settings' && (
            <Settings theme={theme} toggleTheme={toggleTheme} />
          )}

          {currentView === 'helpline' && (
            <Helpline />
          )}
          
          <footer className="footer">
            <p>&copy; 2026 CivicConnect. All Rights Reserved.</p>
          </footer>
        </main>
      </div>

      {/* Modals */}
      <Modal isOpen={showRegisterModal} onClose={toggleRegisterModal}>
        <Register />
      </Modal>

      <Modal isOpen={showAddAdminModal} onClose={() => setShowAddAdminModal(false)}>
        <Register isAdminRegistration={true} onClose={() => setShowAddAdminModal(false)} />
      </Modal>

      <Modal isOpen={showLoginModal} onClose={toggleLoginModal}>
        <Login onLoginSuccess={handleLoginSuccess} onClose={toggleLoginModal} />
      </Modal>

      <Modal isOpen={showRaiseComplaintModal} onClose={toggleRaiseComplaintModal}>
        <RaiseComplaint onClose={toggleRaiseComplaintModal} toggleLoginModal={toggleLoginModal} user={user} onComplaintSubmitted={fetchNotifications} />
      </Modal>

      {currentView === 'mediaFeed' && (
        <MediaFeed />
      )}
    </div>
  );
}

export default App;