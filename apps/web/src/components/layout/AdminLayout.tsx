import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { MainLayout } from './MainLayout';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user.isAdmin) {
    return null; // Will redirect due to useEffect
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Admin: {title}</h1>
        <p className="text-text-secondary">Manage your application data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="card">
            <h2 className="font-bold text-xl mb-4 text-text-primary">Admin Menu</h2>
            <nav className="space-y-2">
              <Link 
                href="/admin" 
                className="block px-3 py-2 rounded hover:bg-surface hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/users" 
                className="block px-3 py-2 rounded hover:bg-surface hover:text-primary transition-colors"
              >
                Users
              </Link>
              <Link 
                href="/admin/tracks" 
                className="block px-3 py-2 rounded hover:bg-surface hover:text-primary transition-colors"
              >
                Tracks
              </Link>
              <Link 
                href="/admin/stats" 
                className="block px-3 py-2 rounded hover:bg-surface hover:text-primary transition-colors"
              >
                Statistics
              </Link>
              <Link 
                href="/admin/settings" 
                className="block px-3 py-2 rounded hover:bg-surface hover:text-primary transition-colors"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="card">
            {children}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 