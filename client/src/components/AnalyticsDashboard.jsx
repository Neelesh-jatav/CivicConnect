import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import './AnalyticsDashboard.css'; // Assuming you'll create this CSS file

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '');

const AnalyticsDashboard = () => {
  const [complaintStats, setComplaintStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    averageResolutionTime: 'N/A',
  });

  const [complaintsByCategory, setComplaintsByCategory] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Fetch Complaint Stats
        const statsResponse = await axios.get(`${API_BASE_URL}/api/v1/admin/complaints/stats`, { withCredentials: true });
        console.log('Stats Response:', statsResponse.data);
        if (statsResponse.data && statsResponse.data.stats) {
          setComplaintStats(statsResponse.data.stats);
        } else {
          console.warn('Stats data not found in response:', statsResponse.data);
        }

        // Fetch Complaints by Category
        const categoryResponse = await axios.get(`${API_BASE_URL}/api/v1/admin/complaints/category-distribution`, { withCredentials: true });
        console.log('Category Response:', categoryResponse.data);
        if (categoryResponse.data && categoryResponse.data.complaintsByCategory) {
          setComplaintsByCategory(categoryResponse.data.complaintsByCategory);
        } else {
          console.warn('Category data not found in response:', categoryResponse.data);
        }

        // Fetch Complaint Trends
        const trendsResponse = await axios.get(`${API_BASE_URL}/api/v1/admin/complaints/trends`, { withCredentials: true });
        console.log('Trends Response:', trendsResponse.data);
        if (trendsResponse.data && trendsResponse.data.complaintTrends) {
          // Format trend data for recharts (e.g., "1/2023" to "Jan 2023")
          const formattedTrends = trendsResponse.data.complaintTrends.map(item => ({
            ...item,
            name: new Date(0, parseInt(item.name.split('/')[0]) - 1).toLocaleString('default', { month: 'short' }) + ' ' + item.name.split('/')[1],
          }));
          setComplaintTrends(formattedTrends);
        } else {
          console.warn('Trends data not found in response:', trendsResponse.data);
        }

      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF69B4'];

  if (loading) {
    return <div className="analytics-dashboard">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-dashboard" style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h2>Analytics Dashboard</h2>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Complaints</h3>
          <p>{complaintStats.totalComplaints}</p>
        </div>
        <div className="stat-card">
          <h3>Resolved Complaints</h3>
          <p>{complaintStats.resolvedComplaints}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Complaints</h3>
          <p>{complaintStats.pendingComplaints}</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Resolution Time</h3>
          <p>{complaintStats.averageResolutionTime}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaintsByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Complaint Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[{ name: 'Resolved', value: complaintStats.resolvedComplaints }, { name: 'Pending', value: complaintStats.pendingComplaints }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[{ name: 'Resolved', value: complaintStats.resolvedComplaints }, { name: 'Pending', value: complaintStats.pendingComplaints }].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Complaint Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complaintTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="complaints" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;