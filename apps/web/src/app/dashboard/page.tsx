'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import apiClient from '@/lib/api/client';

interface Track {
  _id: string;
  description: string;
  startTime: string;
  duration: number;
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
  isPublic: boolean;
}

interface Stats {
  totalDistance: number;
  totalTime: number;
  avgSpeed: number;
  topSpeed: number;
  totalTracks: number;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Fetch user stats and recent tracks
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoadingData(true);
        setError('');
        try {
          const [statsResponse, tracksResponse] = await Promise.all([
            apiClient.get('/api/analytics/summary'),
            apiClient.get('/api/tracks/list?limit=5')
          ]);
          
          setStats(statsResponse.data);
          setRecentTracks(tracksResponse.data.tracks || []);
        } catch (err: any) {
          console.error('Error fetching dashboard data:', err);
          setError('Failed to load dashboard data');
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchData();
    }
  }, [user]);
  
  // Format distance (meters to km)
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };
  
  // Format time (seconds to hours and minutes)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">Welcome back, {user.username || user.email}!</p>
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Statistics Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Your Statistics</h2>
        
        {loadingData ? (
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface h-24 rounded-lg"></div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-text-secondary">Total Distance</p>
              <p className="text-2xl font-bold text-text-primary">{formatDistance(stats.totalDistance)} km</p>
            </div>
            
            <div className="card">
              <p className="text-text-secondary">Total Time</p>
              <p className="text-2xl font-bold text-text-primary">{formatTime(stats.totalTime)}</p>
            </div>
            
            <div className="card">
              <p className="text-text-secondary">Top Speed</p>
              <p className="text-2xl font-bold text-text-primary">{stats.topSpeed} km/h</p>
            </div>
            
            <div className="card">
              <p className="text-text-secondary">Total Tracks</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalTracks}</p>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary">No statistics available yet.</p>
        )}
      </section>
      
      {/* Recent Tracks Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Recent Tracks</h2>
          <button 
            onClick={() => router.push('/tracks')}
            className="text-primary hover:underline"
          >
            View All
          </button>
        </div>
        
        {loadingData ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface h-24 rounded-lg"></div>
            ))}
          </div>
        ) : recentTracks.length > 0 ? (
          <div className="space-y-4">
            {recentTracks.map(track => (
              <div key={track._id} className="card flex flex-col md:flex-row md:items-center">
                <div className="flex-grow">
                  <h3 className="font-bold text-text-primary">
                    {track.description || 'Untitled Track'}
                    {track.isPublic ? (
                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Public</span>
                    ) : (
                      <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">Private</span>
                    )}
                  </h3>
                  <p className="text-text-secondary text-sm">{formatDate(track.startTime)}</p>
                  
                  <div className="flex flex-wrap gap-x-4 mt-2">
                    <span className="text-text-secondary text-sm">
                      <strong>Distance:</strong> {formatDistance(track.distance)} km
                    </span>
                    <span className="text-text-secondary text-sm">
                      <strong>Duration:</strong> {formatTime(track.duration)}
                    </span>
                    <span className="text-text-secondary text-sm">
                      <strong>Avg Speed:</strong> {track.avgSpeed} km/h
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push(`/tracks/${track._id}`)}
                  className="mt-3 md:mt-0 md:ml-4 btn-secondary"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-text-secondary mb-4">You haven't created any tracks yet.</p>
            <button 
              onClick={() => router.push('/tracks/new')}
              className="btn-primary"
            >
              Create Your First Track
            </button>
          </div>
        )}
      </section>
    </MainLayout>
  );
} 