import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import apiClient, { apiService } from '../api/apiClient';

const APITester = () => {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/users');
  const [requestBody, setRequestBody] = useState('');
  const [queryParams, setQueryParams] = useState('page=1&limit=10');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [endpointHistory, setEndpointHistory] = useState([
    '/api/users?page=1&limit=10',
    '/api/tracks?page=1&limit=10',
    '/api/vehicles?page=1&limit=10',
    '/api/analytics/summary'
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      let url = endpoint;
      if (queryParams && !url.includes('?')) {
        url += `?${queryParams}`;
      }
      
      let requestConfig = {
        method,
        url,
      };
      
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        try {
          requestConfig.data = JSON.parse(requestBody);
        } catch (err) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      console.log('Sending request:', requestConfig);
      const result = await apiClient(requestConfig);
      
      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: result.headers,
      });
      
      // Add to history if not already there
      if (!endpointHistory.includes(url)) {
        setEndpointHistory(prev => [url, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error('API test error:', err);
      setError({
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const setHistoryEndpoint = (url) => {
    setEndpoint(url.split('?')[0] || url);
    setQueryParams(url.split('?')[1] || '');
  };

  const commonEndpoints = [
    { name: 'Get Users List', endpoint: '/api/users', method: 'GET', params: 'page=1&limit=10' },
    { name: 'Get Tracks List', endpoint: '/api/tracks', method: 'GET', params: 'page=1&limit=10' },
    { name: 'Get Vehicles List', endpoint: '/api/vehicles', method: 'GET', params: 'page=1&limit=10' },
    { name: 'Get User Profile', endpoint: '/api/users/profile', method: 'GET' },
    { name: 'Get Analytics Summary', endpoint: '/api/analytics/summary', method: 'GET' },
    { name: 'Search Users', endpoint: '/api/users/search', method: 'GET', params: 'q=john' },
  ];

  return (
    <Container fluid>
      <h1 className="mb-4">API Tester</h1>
      
      <Row>
        <Col md={5}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Request</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Method</Form.Label>
                  <Form.Select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Endpoint</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={endpoint} 
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/users"
                  />
                  <Form.Text className="text-muted">
                    Base URL: {apiClient.defaults.baseURL}
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Query Parameters</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={queryParams} 
                    onChange={(e) => setQueryParams(e.target.value)}
                    placeholder="q=searchterm&limit=10"
                  />
                </Form.Group>
                
                {['POST', 'PUT', 'PATCH'].includes(method) && (
                  <Form.Group className="mb-3">
                    <Form.Label>Request Body (JSON)</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={5} 
                      value={requestBody} 
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                    />
                  </Form.Group>
                )}
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Common Endpoints</h5>
            </Card.Header>
            <Card.Body>
              <div className="list-group">
                {commonEndpoints.map((item, index) => (
                  <Button 
                    key={index}
                    variant="outline-secondary"
                    className="text-start mb-2"
                    onClick={() => {
                      setMethod(item.method);
                      setEndpoint(item.endpoint);
                      setQueryParams(item.params || '');
                      if (item.body) {
                        setRequestBody(item.body);
                      }
                    }}
                  >
                    <span className="badge bg-primary me-2">{item.method}</span>
                    {item.name}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={7}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Response</h5>
            </Card.Header>
            <Card.Body>
              {loading && (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Sending request...</p>
                </div>
              )}
              
              {error && (
                <Alert variant="danger">
                  <h5>Error</h5>
                  <p><strong>Message:</strong> {error.message}</p>
                  {error.status && (
                    <p><strong>Status:</strong> {error.status} {error.statusText}</p>
                  )}
                  {error.data && (
                    <>
                      <p><strong>Response:</strong></p>
                      <pre className="bg-dark text-light p-3 rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
                        {JSON.stringify(error.data, null, 2)}
                      </pre>
                    </>
                  )}
                </Alert>
              )}
              
              {response && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className={`badge ${response.status < 400 ? 'bg-success' : 'bg-danger'}`}>
                      Status: {response.status} {response.statusText}
                    </h5>
                    <span className="text-muted">
                      {Object.keys(response.headers || {}).length} Headers
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        const el = document.createElement('textarea');
                        el.value = JSON.stringify(response.data, null, 2);
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert('Response copied to clipboard!');
                      }}
                      className="mb-2"
                    >
                      Copy Response
                    </Button>
                    {response.data && (
                      <pre className="bg-dark text-light p-3 rounded" style={{ maxHeight: '500px', overflow: 'auto' }}>
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
              
              {!loading && !error && !response && (
                <div className="text-center p-5 text-muted">
                  <p>Send a request to see the response here</p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">History</h5>
            </Card.Header>
            <Card.Body>
              {endpointHistory.length > 0 ? (
                <div className="list-group">
                  {endpointHistory.map((url, index) => (
                    <Button 
                      key={index}
                      variant="outline-secondary"
                      className="text-start mb-2"
                      onClick={() => setHistoryEndpoint(url)}
                    >
                      {url}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No history yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default APITester; 