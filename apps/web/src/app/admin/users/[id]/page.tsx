'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserForm } from '@/components/admin/UserForm';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name?: string;
  isAdmin: boolean;
}

export default function EditUser() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // const response = await apiClient.get(`/api/admin/users/${userId}`);
        // setUser(response.data);
        
        // For now, using mock data
        setTimeout(() => {
          setUser({
            id: userId,
            username: `user${userId.split('-')[1]}`,
            email: `user${userId.split('-')[1]}@example.com`,
            name: `User ${userId.split('-')[1]}`,
            isAdmin: userId.split('-')[1] === '1'
          });
          setLoading(false);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to load user data');
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUser();
    }
  }, [userId]);
  
  const handleUpdateUser = async (userData: User) => {
    try {
      // This would be replaced with an actual API call
      // await apiClient.put(`/api/admin/users/${userId}`, userData);
      
      // Simulate API call
      console.log('Updating user:', userData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to users list on success
      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw new Error(err.message || 'Failed to update user');
    }
  };
  
  return (
    <AdminLayout title="Edit User">
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      ) : user ? (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-text-primary">Edit User: {user.username}</h2>
          <UserForm 
            user={user} 
            onSubmit={handleUpdateUser} 
            isEditing 
          />
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          User not found.
        </div>
      )}
    </AdminLayout>
  );
} 