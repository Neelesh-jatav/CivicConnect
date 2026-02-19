import React, { useEffect, useState } from 'react';
import './TrendingIssues.css';

const ISSUE_ICONS = {
  Road: '🕳️',
  Electricity: '💡',
  Water: '🚰',
  Garbage: '🗑️',
  Accident: '🚑',
  Default: '❗',
};

const TrendingIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingIssues = async () => {
      try {
        const res = await fetch('http://localhost:5002/api/v1/complaints/trending', {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch trending issues');
        }

        const data = await res.json();

        if (data.success) {
          setIssues(data.trendingIssues || []);
        } else {
          setIssues([]);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load trending issues');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingIssues();
  }, []);

  return (
    <div className="trending-card">
      <h3>Trending Issues</h3>

      {loading && <p className="muted">Loading...</p>}
      {!loading && error && <p className="error">{error}</p>}

      {!loading && !error && (
        <ul className="trending-list">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <li key={issue.category} className="trending-item">
                <span className="icon">
                  {ISSUE_ICONS[issue.category] || ISSUE_ICONS.Default}
                </span>
                <span className="label">{issue.category}</span>
                <span className="count">{issue.count}</span>
              </li>
            ))
          ) : (
            <p className="muted">No trending issues</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default TrendingIssues;
