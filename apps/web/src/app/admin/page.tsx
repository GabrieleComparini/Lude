'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  newUsersLastWeek: number;
  newTracksLastWeek: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Placeholder for API call - would be implemented on the backend
        // const response = await apiClient.get('/api/admin/stats');
        // setStats(response.data);
        
        // For now, using mock data
        setStats({
          totalUsers: 156,
          totalTracks: 423,
          newUsersLastWeek: 24,
          newTracksLastWeek: 78
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message || 'Failed to load admin statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-surface rounded mt-6"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-lg border border-border">
              <h3 className="text-text-secondary text-sm">Total Users</h3>
              <p className="text-2xl font-bold text-text-primary">{stats?.totalUsers}</p>
              <p className="text-xs text-green-500">+{stats?.newUsersLastWeek} this week</p>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-border">
              <h3 className="text-text-secondary text-sm">Total Tracks</h3>
              <p className="text-2xl font-bold text-text-primary">{stats?.totalTracks}</p>
              <p className="text-xs text-green-500">+{stats?.newTracksLastWeek} this week</p>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-border">
              <h3 className="text-text-secondary text-sm">Active Users</h3>
              <p className="text-2xl font-bold text-text-primary">89</p>
              <p className="text-xs text-text-secondary">Last 7 days</p>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-border">
              <h3 className="text-text-secondary text-sm">Avg. Tracks / User</h3>
              <p className="text-2xl font-bold text-text-primary">
                {stats ? (stats.totalTracks / stats.totalUsers).toFixed(1) : '-'}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/users/new" className="p-4 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg hover:bg-opacity-20 transition-colors">
                <h3 className="font-bold text-blue-500">Add New User</h3>
                <p className="text-text-secondary text-sm">Create a new user account</p>
              </Link>
              <Link href="/admin/tracks" className="p-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg hover:bg-opacity-20 transition-colors">
                <h3 className="font-bold text-green-500">Manage Tracks</h3>
                <p className="text-text-secondary text-sm">Edit or delete user tracks</p>
              </Link>
              <Link href="/admin/settings" className="p-4 bg-purple-600 bg-opacity-10 border border-purple-600 rounded-lg hover:bg-opacity-20 transition-colors">
                <h3 className="font-bold text-purple-500">System Settings</h3>
                <p className="text-text-secondary text-sm">Configure application settings</p>
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Recent Activity</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface p-3 border-b border-border grid grid-cols-4">
                <div className="col-span-2 font-semibold text-text-primary">Action</div>
                <div className="font-semibold text-text-primary">User</div>
                <div className="font-semibold text-text-primary">Time</div>
              </div>
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 grid grid-cols-4 hover:bg-surface">
                    <div className="col-span-2 text-text-primary">New track created</div>
                    <div className="text-text-secondary">user{i + 1}</div>
                    <div className="text-text-secondary text-sm">{i + 1} hour{i !== 0 ? 's' : ''} ago</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
} 