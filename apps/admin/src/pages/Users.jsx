import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Form, InputGroup, Alert, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { apiService } from '../api/apiClient';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 10; // Could be made configurable

  // Stato per il modale di creazione utente
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    name: '',
    isAdmin: false
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Log API URL for debugging
  useEffect(() => {
    console.log('API URL:', import.meta.env.VITE_API_URL || 'No API URL set in environment variables');
    console.log('Admin Token:', localStorage.getItem('adminToken') ? 'Token exists' : 'No token found');
    
    // Test API connectivity
    const testApiConnection = async () => {
      try {
        // Try a simple API call to test connectivity
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://lude-backend.onrender.com'}/`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('API Connection Test Response:', data);
      } catch (error) {
        console.error('API Connection Test Failed:', error);
      }
    };
    
    testApiConnection();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (searchTerm) {
        // Search for users with the term
        response = await apiService.users.search(searchTerm, page, pageSize);
      } else {
        // Get all users with pagination
        response = await apiService.users.getAll(page, pageSize);
      }
      
      // Handle response data - format will depend on your API
      const { data } = response;
      
      if (data) {
        // Update users list - adjust based on your actual API response structure
        setUsers(data.users || data.results || data);
        
        // Update pagination data if available from API
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalUsers(data.pagination.totalItems || data.users?.length || 0);
        } else {
          // Estimate if not provided (may not be accurate)
          setTotalPages(Math.ceil((data.total || data.users?.length || data.length) / pageSize));
          setTotalUsers(data.total || data.users?.length || data.length || 0);
        }
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.users.delete(userId);
      // Refresh the user list
      setUsers(users.filter(user => user._id !== userId));
      // Optionally adjust total counts
      setTotalUsers(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user. Please try again.');
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
    });
  };

  // Gestisce i cambiamenti nei campi del form
  const handleCreateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Resetta il form
  const resetCreateForm = () => {
    setNewUser({
      email: '',
      password: '',
      username: '',
      name: '',
      isAdmin: false
    });
    setCreateError(null);
    setCreateSuccess(false);
  };

  // Chiude il modale e resetta lo stato
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  // Invia il form per creare un nuovo utente
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      // Validazione
      if (!newUser.email || !newUser.password || !newUser.username) {
        throw new Error('Please fill all required fields (email, password, username)');
      }

      console.log('Attempting to create user:', { 
        email: newUser.email, 
        username: newUser.username,
        // Don't log the password for security
        isAdmin: newUser.isAdmin
      });

      // Chiamata API per creare un nuovo utente
      const response = await apiService.users.create(newUser);
      console.log('Create user API response:', response);
      
      setCreateSuccess(true);
      fetchUsers(); // Aggiorna la lista utenti
      
      // Chiudi automaticamente il modale dopo 2 secondi
      setTimeout(() => {
        handleCloseCreateModal();
      }, 2000);
    } catch (err) {
      console.error('Error creating user:', err);
      
      // Enhanced error logging
      if (err.response) {
        console.error('API Error Response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('API Error Request (no response received):', err.request);
      } else {
        console.error('Error setting up the request:', err.message);
      }
      
      setCreateError(err.response?.data?.message || err.message || 'Failed to create user. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Users</h1>
        <Button 
          variant="success"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-person-plus me-1"></i> Create User
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                placeholder="Search users by name, username, or email..."
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
          <p className="mt-3">Loading users...</p>
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
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Tracks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="align-middle">
                        <td>{user.username}</td>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.createdAt || user.registrationDate)}</td>
                        <td>{user.statistics?.totalTracks || user.trackCount || 0}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => window.location.href = `/users/${user._id}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {users.length === 0 && (
                <p className="text-center my-4">No users found matching your criteria.</p>
              )}
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Showing {users.length} of {totalUsers} users (Page {page} of {totalPages})
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

      {/* Modale per creare un nuovo utente */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createSuccess && (
            <Alert variant="success">
              User created successfully!
            </Alert>
          )}
          
          {createError && (
            <Alert variant="danger">
              {createError}
            </Alert>
          )}
          
          <Form onSubmit={handleCreateUser}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleCreateInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleCreateInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={newUser.username}
                    onChange={handleCreateInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleCreateInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isAdmin"
                label="Admin Privileges"
                checked={newUser.isAdmin}
                onChange={handleCreateInputChange}
              />
              <Form.Text className="text-muted">
                Admin users can access the admin panel and manage all data.
              </Form.Text>
            </Form.Group>
            
            <div className="mt-4 d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={handleCloseCreateModal} 
                className="me-2"
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={createLoading}
              >
                {createLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Users; 