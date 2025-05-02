import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Card, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { apiService } from '../api/apiClient';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const pageSize = 10; // Could be made configurable

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        if (searchTerm) {
          // Use search term if available
          response = await apiService.vehicles.getAll(page, pageSize, searchTerm);
        } else {
          // Otherwise get all vehicles
          response = await apiService.vehicles.getAll(page, pageSize);
        }
        
        // Handle response data
        const { data } = response;
        
        if (data) {
          // Update vehicles list - adjust based on your actual API response structure
          setVehicles(data.vehicles || data.results || data);
          
          // Update pagination data if available from API
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalVehicles(data.pagination.totalItems || data.vehicles?.length || 0);
          } else {
            // Estimate if not provided (may not be accurate)
            setTotalPages(Math.ceil((data.total || data.vehicles?.length || data.length) / pageSize));
            setTotalVehicles(data.total || data.vehicles?.length || data.length || 0);
          }
        } else {
          setVehicles([]);
          setTotalPages(1);
          setTotalVehicles(0);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError(err.response?.data?.message || 'Failed to fetch vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, [page, searchTerm, pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.vehicles.delete(vehicleId);
      // Refresh the vehicle list
      setVehicles(vehicles.filter(vehicle => vehicle._id !== vehicleId));
      // Optionally adjust total counts
      setTotalVehicles(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError(err.response?.data?.message || 'Failed to delete vehicle. Please try again.');
    }
  };

  // Function to count vehicles by type
  const getVehicleTypeCounts = () => {
    const typeCounts = {};
    vehicles.forEach(vehicle => {
      const type = vehicle.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return typeCounts;
  };

  const vehicleTypeCounts = getVehicleTypeCounts();

  return (
    <Container fluid>
      <h1 className="mb-4">Vehicles</h1>
      
      <Row className="mb-4">
        {Object.entries(vehicleTypeCounts).map(([type, count]) => (
          <Col md={3} sm={6} key={type} className="mb-3">
            <Card className="card-dashboard bg-info text-white">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="mb-0">{type}</h6>
                    <h2 className="mb-0">{count}</h2>
                  </div>
                  <div>
                    <h1><i className="bi bi-car-front"></i></h1>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                placeholder="Search vehicles by make, model, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Loading vehicles...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Make</th>
                      <th>Model</th>
                      <th>Year</th>
                      <th>Owner</th>
                      <th>License Plate</th>
                      <th>Type</th>
                      <th>Tracks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle._id} className="align-middle">
                        <td>{vehicle.make || 'N/A'}</td>
                        <td>{vehicle.model || 'N/A'}</td>
                        <td>{vehicle.year || 'N/A'}</td>
                        <td>{vehicle.username || vehicle.userId?.username || 'N/A'}</td>
                        <td>{vehicle.licenseplate || vehicle.licensePlate || 'N/A'}</td>
                        <td>{vehicle.type || 'N/A'}</td>
                        <td>{vehicle.trackCount || vehicle.statistics?.totalTracks || 0}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => window.location.href = `/vehicles/${vehicle._id}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {vehicles.length === 0 && (
                <p className="text-center my-4">No vehicles found matching your criteria.</p>
              )}
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Showing {vehicles.length} of {totalVehicles} vehicles (Page {page} of {totalPages})
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    className="me-2"
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-primary"
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Vehicles; 