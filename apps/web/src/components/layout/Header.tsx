import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import React from 'react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Lude
          </Link>
          
          {/* Main navigation */}
          {user && (
            <div className="ml-8 hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-text-primary hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/tracks" className="text-text-primary hover:text-primary transition-colors">
                My Tracks
              </Link>
              <Link href="/explore" className="text-text-primary hover:text-primary transition-colors">
                Explore
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="text-text-primary hover:text-primary transition-colors">
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>
        
        {/* Auth links */}
        <div className="space-x-4 flex items-center">
          {user ? (
            <>
              <Link href="/profile" className="text-text-primary hover:text-primary transition-colors">
                Profile
              </Link>
              <button 
                onClick={() => logout()} 
                className="text-secondary hover:text-opacity-80 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-text-primary hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="bg-primary px-4 py-2 rounded-md text-white hover:bg-opacity-90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}; 