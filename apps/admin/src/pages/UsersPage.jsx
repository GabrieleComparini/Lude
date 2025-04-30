import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../api/adminService'; // Import the API function
// Optional: Add some basic styling for the table
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedUsers = await getAllUsers();
        // Ensure fetchedUsers is an array before setting state
        setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError('Failed to load users. Please check the console for details.');
        setUsers([]); // Clear users on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <h1>User Management</h1>

      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              {/* Add more columns as needed (e.g., Created At, Actions) */}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id || user.id}> {/* Use a unique key */} 
                  <td>{user._id || user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || 'N/A'}</td>
                  {/* Add more cells corresponding to columns */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No users found.</td> {/* Adjust colSpan if you add columns */}
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsersPage; 