import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tracks from './pages/Tracks';
import Vehicles from './pages/Vehicles';
import Analytics from './pages/Analytics';
import APITester from './pages/APITester';
import Login from './pages/Login';

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <>
          <Sidebar collapsed={sidebarCollapsed} />
          <div
            className={`main-content ${
              sidebarCollapsed ? 'sidebar-collapsed' : ''
            }`}
          >
            <Header toggleSidebar={toggleSidebar} />
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tracks"
                element={
                  <ProtectedRoute>
                    <Tracks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-tester"
                element={
                  <ProtectedRoute>
                    <APITester />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </div>
  );
};

export default App; 