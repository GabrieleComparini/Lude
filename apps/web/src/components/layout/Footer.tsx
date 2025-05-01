import Link from 'next/link';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-text-primary font-bold text-lg mb-4">Lude</h3>
            <p className="text-text-secondary mb-4">
              Track your rides and connect with other enthusiasts.
            </p>
            <p className="text-text-secondary text-sm">
              &copy; {new Date().getFullYear()} Lude. All rights reserved.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-text-primary font-bold text-lg mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-text-secondary hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-text-secondary hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-text-secondary hover:text-primary transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-text-secondary hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-text-primary font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-text-secondary hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}; 