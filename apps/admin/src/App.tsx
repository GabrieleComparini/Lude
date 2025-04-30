import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import VehiclesPage from './pages/VehiclesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Nested routes will render inside Layout's <Outlet /> */}
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        {/* Add other routes here */}
      </Route>
      {/* Add routes outside the main layout if needed, e.g., Login */}
    </Routes>
  );
}

export default App;
