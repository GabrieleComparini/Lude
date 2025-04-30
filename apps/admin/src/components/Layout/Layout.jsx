import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css'; // Create this file for basic styling

const Layout = () => {
  return (
    <div className="layout-container">
      <aside className="sidebar">
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/vehicles">Vehicles</Link></li>
            {/* Add more links as needed */}
          </ul>
        </nav>
      </aside>
      <main className="content-area">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default Layout; 