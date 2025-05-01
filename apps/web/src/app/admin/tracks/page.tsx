'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

interface Track {
  _id: string;
  userId: string;
  username: string;
  description: string;
  startTime: string;
  duration: number;
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
  isPublic: boolean;
}

export default function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // const response = await apiClient.get(`/api/admin/tracks?page=${currentPage}&search=${searchTerm}`);
        // setTracks(response.data.tracks);
        // setTotalPages(response.data.totalPages);
        
        // For now, using mock data
        setTimeout(() => {
          const mockTracks: Track[] = Array.from({ length: 10 }, (_, i) => ({
            _id: `track-${i + 1}`,
            userId: `user-${Math.floor(Math.random() * 5) + 1}`,
            username: `user${Math.floor(Math.random() * 5) + 1}`,
            description: `Track ${i + 1}`,
            startTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            duration: Math.floor(Math.random() * 3600),
            distance: Math.floor(Math.random() * 10000),
            avgSpeed: Math.floor(Math.random() * 30),
            maxSpeed: Math.floor(Math.random() * 50),
            isPublic: Math.random() > 0.5
          }));
          
          setTracks(mockTracks);
          setTotalPages(5);
          setLoading(false);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching tracks:', err);
        setError(err.message || 'Failed to load tracks');
        setLoading(false);
      }
    };

    fetchTracks();
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

  const handleDeleteTrack = async (trackId: string) => {
    if (window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      try {
        // await apiClient.delete(`/api/admin/tracks/${trackId}`);
        // Filter out the deleted track from the current state
        setTracks(tracks.filter(track => track._id !== trackId));
        alert('Track deleted successfully.');
      } catch (err: any) {
        console.error('Error deleting track:', err);
        alert('Failed to delete track: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleTogglePublic = async (trackId: string, currentStatus: boolean) => {
    try {
      // await apiClient.patch(`/api/admin/tracks/${trackId}`, { isPublic: !currentStatus });
      // Update the track in the current state
      setTracks(tracks.map(track => 
        track._id === trackId ? { ...track, isPublic: !currentStatus } : track
      ));
      alert(`Track visibility ${!currentStatus ? 'made public' : 'made private'} successfully.`);
    } catch (err: any) {
      console.error('Error updating track:', err);
      alert('Failed to update track: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <AdminLayout title="Tracks Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">All Tracks</h2>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracks by description or username..."
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

      {/* Tracks Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded"></div>
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-surface border border-border rounded-lg">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-4 py-3 text-left text-text-primary">Description</th>
                <th className="px-4 py-3 text-left text-text-primary">User</th>
                <th className="px-4 py-3 text-left text-text-primary">Date</th>
                <th className="px-4 py-3 text-left text-text-primary">Distance</th>
                <th className="px-4 py-3 text-left text-text-primary">Duration</th>
                <th className="px-4 py-3 text-center text-text-primary">Visibility</th>
                <th className="px-4 py-3 text-right text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track._id} className="border-b border-border hover:bg-surface">
                  <td className="px-4 py-3 text-text-primary">{track.description}</td>
                  <td className="px-4 py-3 text-text-secondary">{track.username}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(track.startTime)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDistance(track.distance)} km</td>
                  <td className="px-4 py-3 text-text-secondary">{formatTime(track.duration)}</td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        track.isPublic 
                          ? 'bg-green-500 bg-opacity-10 text-green-500 border border-green-500' 
                          : 'bg-gray-500 bg-opacity-10 text-gray-500 border border-gray-500'
                      }`}
                    >
                      {track.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link 
                      href={`/admin/tracks/${track._id}`} 
                      className="inline-block px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleTogglePublic(track._id, track.isPublic)}
                      className={`inline-block px-3 py-1 text-sm rounded ${
                        track.isPublic
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {track.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                    <button
                      onClick={() => handleDeleteTrack(track._id)}
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
          No tracks found.
        </div>
      )}

      {/* Pagination */}
      {tracks.length > 0 && (
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