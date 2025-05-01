'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(email, password, username);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-text-primary">Create an Account</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
              required
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-text-primary mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="text-text-secondary text-sm mt-1">
              Username must be 3-30 characters and can only contain letters, numbers, and underscores.
            </p>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
              required
              minLength={6}
            />
            <p className="text-text-secondary text-sm mt-1">
              Password must be at least 6 characters long.
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded hover:bg-opacity-90 transition-colors"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </MainLayout>
  );
} 