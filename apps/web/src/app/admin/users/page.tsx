'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  tracksCount: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // const response = await apiClient.get(`/api/admin/users?page=${currentPage}&search=${searchTerm}`);
        // setUsers(response.data.users);
        // setTotalPages(response.data.totalPages);
        
        // For now, using mock data
        setTimeout(() => {
          const mockUsers: User[] = Array.from({ length: 10 }, (_, i) => ({
            id: `user-${i + 1}`,
            username: `user${i + 1}`,
            email: `user${i + 1}@example.com`,
            name: `User ${i + 1}`,
            isAdmin: i === 0,
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            lastLogin: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
            tracksCount: Math.floor(Math.random() * 20)
          }));
          
          setUsers(mockUsers);
          setTotalPages(5);
          setLoading(false);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // await apiClient.delete(`/api/admin/users/${userId}`);
        // Filter out the deleted user from the current state
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully.');
      } catch (err: any) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      // await apiClient.patch(`/api/admin/users/${userId}`, { isAdmin: !currentStatus });
      // Update the user in the current state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
      alert(`User admin status ${!currentStatus ? 'granted' : 'revoked'} successfully.`);
    } catch (err: any) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <AdminLayout title="Users Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">All Users</h2>
        <Link href="/admin/users/new" className="btn-primary">
          Add New User
        </Link>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="flex-grow px-4 py-2 bg-surface border border-border rounded-l text-text-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-r"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded"></div>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-surface border border-border rounded-lg">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-4 py-3 text-left text-text-primary">Username</th>
                <th className="px-4 py-3 text-left text-text-primary">Email</th>
                <th className="px-4 py-3 text-left text-text-primary">Name</th>
                <th className="px-4 py-3 text-left text-text-primary">Joined</th>
                <th className="px-4 py-3 text-left text-text-primary">Tracks</th>
                <th className="px-4 py-3 text-center text-text-primary">Admin</th>
                <th className="px-4 py-3 text-right text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-surface">
                  <td className="px-4 py-3 text-text-primary">{user.username}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.name || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.tracksCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.isAdmin 
                          ? 'bg-green-500 bg-opacity-10 text-green-500 border border-green-500' 
                          : 'bg-gray-500 bg-opacity-10 text-gray-500 border border-gray-500'
                      }`}
                    >
                      {user.isAdmin ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link 
                      href={`/admin/users/${user.id}`} 
                      className="inline-block px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      className={`inline-block px-3 py-1 text-sm rounded ${
                        user.isAdmin
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="inline-block px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          No users found.
        </div>
      )}

      {/* Pagination */}
      {users.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-text-secondary">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-surface border border-border rounded text-text-primary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-surface border border-border rounded text-text-primary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 