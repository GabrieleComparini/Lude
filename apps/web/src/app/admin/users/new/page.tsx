'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserForm } from '@/components/admin/UserForm';
import apiClient from '@/lib/api/client';

interface User {
  id?: string;
  username: string;
  email: string;
  password?: string;
  name?: string;
  isAdmin: boolean;
}

export default function NewUser() {
  const router = useRouter();
  
  const handleCreateUser = async (userData: User) => {
    try {
      // This would be replaced with an actual API call
      // await apiClient.post('/api/admin/users', userData);
      
      // Simulate API call
      console.log('Creating user:', userData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to users list on success
      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating user:', err);
      throw new Error(err.message || 'Failed to create user');
    }
  };
  
  return (
    <AdminLayout title="Add New User">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-text-primary">Create User Account</h2>
        <UserForm onSubmit={handleCreateUser} />
      </div>
    </AdminLayout>
  );
} 