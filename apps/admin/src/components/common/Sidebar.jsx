import React from 'react';
import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import InsightsIcon from '@mui/icons-material/Insights';
import CodeIcon from '@mui/icons-material/Code';

const Sidebar = ({ collapsed }) => {
  const sidebarClass = collapsed ? 'sidebar sidebar-collapsed' : 'sidebar';
  
  return (
    <div className={sidebarClass}>
      <div className="p-3 text-center">
        <h4 className={collapsed ? 'd-none' : ''}>Lude Admin</h4>
        {collapsed && <h4>L</h4>}
      </div>
      
      <Nav className="flex-column">
        <Nav.Item>
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <DashboardIcon className="me-3" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/users"
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <PeopleIcon className="me-3" />
            {!collapsed && <span>Users</span>}
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/tracks"
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <MapIcon className="me-3" />
            {!collapsed && <span>Tracks</span>}
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/vehicles"
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <DirectionsCarIcon className="me-3" />
            {!collapsed && <span>Vehicles</span>}
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/analytics"
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <InsightsIcon className="me-3" />
            {!collapsed && <span>Analytics</span>}
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/api-tester"
            className={({ isActive }) => 
              `nav-link d-flex align-items-center p-3 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            <CodeIcon className="me-3" />
            {!collapsed && <span>API Tester</span>}
          </NavLink>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar; 