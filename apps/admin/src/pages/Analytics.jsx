import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import apiClient from '../api/apiClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year
  const [analytics, setAnalytics] = useState({
    usersOverTime: [],
    tracksOverTime: [],
    speedDistribution: [],
    vehicleTypes: [],
    popularRoutes: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, you'd make real API calls
        // const responses = await Promise.all([
        //   apiClient.get(`/api/analytics/users?timeRange=${timeRange}`),
        //   apiClient.get(`/api/analytics/tracks?timeRange=${timeRange}`),
        //   apiClient.get('/api/analytics/speed-distribution'),
        //   apiClient.get('/api/analytics/vehicle-types'),
        //   apiClient.get('/api/analytics/popular-routes'),
        // ]);
        
        // Mock data for development
        setTimeout(() => {
          // Generate mock data based on selected time range
          const periods = timeRange === 'day' ? 24 : 
                         timeRange === 'week' ? 7 : 
                         timeRange === 'month' ? 30 : 12;
          
          const usersData = Array.from({ length: periods }, (_, i) => {
            const value = Math.floor(Math.random() * 100) + 50;
            const label = timeRange === 'day' ? `${i}:00` : 
                         timeRange === 'week' ? `Day ${i+1}` : 
                         timeRange === 'month' ? `Day ${i+1}` : `Month ${i+1}`;
            return { name: label, users: value };
          });
          
          const tracksData = Array.from({ length: periods }, (_, i) => {
            const value = Math.floor(Math.random() * 200) + 100;
            const label = timeRange === 'day' ? `${i}:00` : 
                         timeRange === 'week' ? `Day ${i+1}` : 
                         timeRange === 'month' ? `Day ${i+1}` : `Month ${i+1}`;
            return { name: label, tracks: value };
          });
          
          const speedData = [
            { name: '0-20 km/h', value: 15 },
            { name: '21-40 km/h', value: 25 },
            { name: '41-60 km/h', value: 30 },
            { name: '61-80 km/h', value: 20 },
            { name: '80+ km/h', value: 10 },
          ];
          
          const vehicleData = [
            { name: 'Sedan', count: 45 },
            { name: 'SUV', count: 25 },
            { name: 'Truck', count: 15 },
            { name: 'Electric', count: 10 },
            { name: 'Other', count: 5 },
          ];
          
          const routeData = [
            { name: 'City Center Loop', count: 120 },
            { name: 'Highway 101', count: 80 },
            { name: 'Beach Route', count: 65 },
            { name: 'Mountain Pass', count: 40 },
            { name: 'Countryside Drive', count: 30 },
          ];
          
          setAnalytics({
            usersOverTime: usersData,
            tracksOverTime: tracksData,
            speedDistribution: speedData,
            vehicleTypes: vehicleData,
            popularRoutes: routeData
          });
          
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to fetch analytics data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeRange]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading analytics data...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Analytics</h1>
        
        <Form.Group>
          <Form.Select 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            style={{ width: '200px' }}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </Form.Select>
        </Form.Group>
      </div>
      
      {/* User Growth Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">User Growth</h5>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.usersOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" name="Active Users" />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Tracks Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">Track Activity</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.tracksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tracks" fill="#82ca9d" name="Recorded Tracks" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Smaller Charts Row */}
      <Row>
        {/* Speed Distribution */}
        <Col md={4} className="mb-4">
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">Speed Distribution</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.speedDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.speedDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Vehicle Types */}
        <Col md={4} className="mb-4">
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">Vehicle Types</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  layout="vertical"
                  data={analytics.vehicleTypes}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Popular Routes */}
        <Col md={4} className="mb-4">
          <Card className="card-dashboard">
            <Card.Body>
              <h5 className="mb-3">Popular Routes</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.popularRoutes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#FF8042" name="Number of Trips" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Export Button */}
      <div className="text-center mb-4">
        <Button variant="outline-primary">
          Export Analytics Data
        </Button>
      </div>
    </Container>
  );
};

export default Analytics; 