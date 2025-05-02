import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = ({ toggleSidebar }) => {
  const { logout, adminUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container fluid>
        <Button 
          variant="outline-light" 
          className="me-2" 
          onClick={toggleSidebar}
        >
          <MenuIcon />
        </Button>
        
        <Navbar.Brand href="/">Lude Admin</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Item className="d-flex align-items-center me-3">
              <AccountCircleIcon className="me-1" />
              <span>{adminUser?.name || 'Admin'}</span>
            </Nav.Item>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogoutIcon className="me-1" />
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 