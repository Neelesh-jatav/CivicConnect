import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import TrendingIssues from './TrendingIssues';
import './Impact.css';

const Impact = ({ user }) => {
  const [stats, setStats] = useState({
    reports: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchComplaintStats = async () => {
      try {
        const res = await fetch('http://localhost:5002/api/v1/my-complaints', {
          credentials: 'include',
        });
        const data = await res.json();

        if (data.success) {
          const reports = data.complaints.length;
          const resolved = data.complaints.filter(
            c => c.status === 'Resolved' || c.status === 'Closed'
          ).length;

          setStats({ reports, resolved });
        } else {
          toast.error(data.message || 'Failed to fetch complaint stats.');
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred while fetching complaint stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintStats();
  }, [user]);

  return (
    <>
      <div className="impact-card">
        <h3>Your Impact</h3>

        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <div className="impact-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.reports}</span>
              <span className="stat-label">Reports</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.resolved}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
        )}
      </div>
          </>
  );
};

export default Impact;
