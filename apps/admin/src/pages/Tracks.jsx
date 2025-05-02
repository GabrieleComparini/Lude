import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Form, InputGroup, Alert, Badge, Spinner } from 'react-bootstrap';
import { apiService } from '../api/apiClient';

const Tracks = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const [filter, setFilter] = useState('all');
  const pageSize = 10; // Could be made configurable

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        if (searchTerm) {
          // API doesn't have search endpoint yet, you can add it later
          response = await apiService.tracks.getAll(page, pageSize, filter !== 'all' ? filter : '');
        } else {
          response = await apiService.tracks.getAll(page, pageSize, filter !== 'all' ? filter : '');
        }
        
        // Handle response data
        const { data } = response;
        
        if (data) {
          // Update tracks list - adjust based on your actual API response structure
          setTracks(data.tracks || data.results || data);
          
          // Update pagination data if available from API
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalTracks(data.pagination.totalItems || data.tracks?.length || 0);
          } else {
            // Estimate if not provided (may not be accurate)
            setTotalPages(Math.ceil((data.total || data.tracks?.length || data.length) / pageSize));
            setTotalTracks(data.total || data.tracks?.length || data.length || 0);
          }
        } else {
          setTracks([]);
          setTotalPages(1);
          setTotalTracks(0);
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err.response?.data?.message || 'Failed to fetch tracks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, [page, searchTerm, filter, pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.tracks.delete(trackId);
      // Refresh the track list
      setTracks(tracks.filter(track => track._id !== trackId));
      // Optionally adjust total counts
      setTotalTracks(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting track:', err);
      setError(err.response?.data?.message || 'Failed to delete track. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container fluid>
      <h1 className="mb-4">Tracks</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between flex-wrap">
            <Form onSubmit={handleSearch} className="mb-3 mb-md-0 flex-grow-1 me-md-3">
              <InputGroup>
                <Form.Control
                  placeholder="Search tracks by description or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="primary">
                  Search
                </Button>
              </InputGroup>
            </Form>
            
            <div className="d-flex align-items-center">
              <span className="me-2">Filter:</span>
              <Form.Select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                <option value="all">All Tracks</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Loading tracks...</p>
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
                      <th>Description</th>
                      <th>User</th>
                      <th>Date</th>
                      <th>Distance</th>
                      <th>Duration</th>
                      <th>Avg Speed</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((track) => (
                      <tr key={track._id} className="align-middle">
                        <td>{track.description || 'N/A'}</td>
                        <td>{track.username || track.userId?.username || 'N/A'}</td>
                        <td>{formatDate(track.startTime)}</td>
                        <td>{(track.distance || 0).toFixed(2)} km</td>
                        <td>{formatDuration(track.duration)}</td>
                        <td>{(track.avgSpeed || 0).toFixed(1)} km/h</td>
                        <td>
                          <Badge bg={track.isPublic ? "success" : "secondary"}>
                            {track.isPublic ? "Public" : "Private"}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => window.location.href = `/tracks/${track._id}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteTrack(track._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {tracks.length === 0 && (
                <p className="text-center my-4">No tracks found matching your criteria.</p>
              )}
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Showing {tracks.length} of {totalTracks} tracks (Page {page} of {totalPages})
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

export default Tracks; 