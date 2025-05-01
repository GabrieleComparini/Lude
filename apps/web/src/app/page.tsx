'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero section */}
      <section className="py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Track Your Rides Like Never Before
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Lude is the ultimate companion for tracking your rides, analyzing performance, and connecting with fellow enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register" 
                className="btn-primary text-center"
              >
                Get Started
              </Link>
              <Link 
                href="/explore" 
                className="btn-secondary text-center"
              >
                Explore Tracks
              </Link>
            </div>
          </div>
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
            {/* Placeholder for app screenshot or illustration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">App Screenshot</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-12 md:py-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-text-primary">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">GPS Tracking</h3>
            <p className="text-text-secondary">
              Accurate GPS tracking to record your routes, speed, altitude, and more in real-time.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="card">
            <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">Analytics</h3>
            <p className="text-text-secondary">
              Detailed performance metrics and visualizations to help you improve your riding skills.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="card">
            <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">Social Community</h3>
            <p className="text-text-secondary">
              Connect with other riders, share routes, and participate in challenges and leaderboards.
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-text-primary">
            Ready to Elevate Your Riding Experience?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of riders already using Lude to track, analyze, and share their journeys.
          </p>
          <Link 
            href="/register" 
            className="btn-primary inline-block"
          >
            Sign Up for Free
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
