import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';
import { apiService } from '../api/apiClient';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTracks: 0,
    totalVehicles: 0,
    totalDistance: 0,
    recentTracks: [],
    recentUsers: [],
    tracksByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use Promise.all to fetch multiple endpoints
        const [summaryResponse, userGrowthResponse, trackActivityResponse] = await Promise.all([
          apiService.analytics.getSummary(),
          apiService.analytics.getUserGrowth('month'),
          apiService.analytics.getTrackActivity('month')
        ]);
        
        // Get recent users (5 most recent)
        const recentUsersResponse = await apiService.users.getAll(1, 5);
        
        // Get recent tracks (5 most recent)
        const recentTracksResponse = await apiService.tracks.getAll(1, 5);
        
        // Process the data
        const summaryData = summaryResponse.data;
        const userGrowthData = userGrowthResponse.data;
        const trackActivityData = trackActivityResponse.data;
        const recentUsersData = recentUsersResponse.data;
        const recentTracksData = recentTracksResponse.data;
        
        // Prepare tracks by month data for the chart
        const tracksByMonth = Array.isArray(trackActivityData) 
          ? trackActivityData.map(item => ({
              month: item.period || item.month,
              count: item.count
            }))
          : [];
        
        // Prepare recent tracks data
        const recentTracks = Array.isArray(recentTracksData?.tracks || recentTracksData)
          ? (recentTracksData?.tracks || recentTracksData).map(track => ({
              id: track._id,
              description: track.description || 'No description',
              user: track.username || track.userId?.username || 'Unknown',
              distance: track.distance || 0,
              date: track.startTime ? new Date(track.startTime).toLocaleDateString() : 'N/A'
            }))
          : [];
          
        // Prepare recent users data
        const recentUsers = Array.isArray(recentUsersData?.users || recentUsersData)
          ? (recentUsersData?.users || recentUsersData).map(user => ({
              id: user._id,
              username: user.username || 'N/A',
              name: user.name || 'N/A',
              joinDate: user.createdAt || user.registrationDate ? 
                new Date(user.createdAt || user.registrationDate).toLocaleDateString() : 'N/A'
            }))
          : [];
        
        setStats({
          totalUsers: summaryData?.users?.total || 0,
          totalTracks: summaryData?.tracks?.total || 0,
          totalVehicles: summaryData?.vehicles?.total || 0,
          totalDistance: summaryData?.tracks?.totalDistance || 0, // km
          recentTracks,
          recentUsers,
          tracksByMonth
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-dashboard bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Users</h6>
                  <h2 className="mb-0">{stats.totalUsers}</h2>
                </div>
                <PeopleIcon style={{ fontSize: 40 }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="card-dashboard bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Tracks</h6>
                  <h2 className="mb-0">{stats.totalTracks}</h2>
                </div>
                <MapIcon style={{ fontSize: 40 }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="card-dashboard bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Vehicles</h6>
                  <h2 className="mb-0">{stats.totalVehicles}</h2>
                </div>
                <DirectionsCarIcon style={{ fontSize: 40 }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="card-dashboard bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Distance</h6>
                  <h2 className="mb-0">{stats.totalDistance.toLocaleString()} km</h2>
                </div>
                <SpeedIcon style={{ fontSize: 40 }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">Tracks Created By Month</h5>
              {stats.tracksByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.tracksByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#007bff" name="Track Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center my-5">No track activity data available.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Data */}
      <Row>
        <Col md={6}>
          <Card className="card-dashboard">
            <Card.Header>
              <h5 className="mb-0">Recent Tracks</h5>
            </Card.Header>
            <Card.Body>
              {stats.recentTracks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>User</th>
                        <th>Distance</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTracks.map(track => (
                        <tr key={track.id} className="hover-row">
                          <td>{track.description}</td>
                          <td>{track.user}</td>
                          <td>{track.distance.toFixed(2)} km</td>
                          <td>{track.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No recent tracks found.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="card-dashboard">
            <Card.Header>
              <h5 className="mb-0">New Users</h5>
            </Card.Header>
            <Card.Body>
              {stats.recentUsers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Join Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map(user => (
                        <tr key={user.id} className="hover-row">
                          <td>{user.username}</td>
                          <td>{user.name}</td>
                          <td>{user.joinDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No recent users found.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 