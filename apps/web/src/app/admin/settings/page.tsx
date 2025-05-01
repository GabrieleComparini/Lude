'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import apiClient from '@/lib/api/client';

export default function AdminSettings() {
  // App settings
  const [appSettings, setAppSettings] = useState({
    allowPublicRegistration: true,
    requireEmailVerification: true,
    maxUploadSizeMB: 10,
    defaultTrackPrivacy: 'private',
  });
  
  // Firebase settings - these would typically be managed differently
  const [firebaseSettings, setFirebaseSettings] = useState({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '[hidden]',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[hidden]',
  });
  
  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    fromEmail: 'notifications@lude-app.com',
    adminEmail: 'admin@lude-app.com',
    enableWelcomeEmail: true,
    enableActivityNotifications: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleAppSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setAppSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const saveSettings = async (settingsType: string) => {
    setLoading(true);
    setSuccessMessage('');
    setError('');
    
    try {
      // This would be replaced with an actual API call
      // let data;
      // switch(settingsType) {
      //   case 'app':
      //     data = appSettings;
      //     break;
      //   case 'email':
      //     data = emailSettings;
      //     break;
      // }
      // await apiClient.post('/api/admin/settings', { type: settingsType, data });
      
      // Simulate API call
      console.log('Saving settings:', settingsType, 
        settingsType === 'app' ? appSettings : emailSettings);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccessMessage('Settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="System Settings">
      {successMessage && (
        <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* App Settings */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Application Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="allowPublicRegistration"
              name="allowPublicRegistration"
              type="checkbox"
              checked={appSettings.allowPublicRegistration}
              onChange={handleAppSettingsChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="allowPublicRegistration" className="ml-2 block text-text-primary">
              Allow Public Registration
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="requireEmailVerification"
              name="requireEmailVerification"
              type="checkbox"
              checked={appSettings.requireEmailVerification}
              onChange={handleAppSettingsChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="requireEmailVerification" className="ml-2 block text-text-primary">
              Require Email Verification
            </label>
          </div>
          
          <div>
            <label htmlFor="maxUploadSizeMB" className="block text-text-primary mb-1">
              Max Upload Size (MB)
            </label>
            <input
              id="maxUploadSizeMB"
              name="maxUploadSizeMB"
              type="number"
              value={appSettings.maxUploadSizeMB}
              onChange={handleAppSettingsChange}
              className="w-full md:w-64 bg-surface border border-border rounded px-4 py-2 text-text-primary"
              min="1"
              max="50"
            />
          </div>
          
          <div>
            <label htmlFor="defaultTrackPrivacy" className="block text-text-primary mb-1">
              Default Track Privacy
            </label>
            <select
              id="defaultTrackPrivacy"
              name="defaultTrackPrivacy"
              value={appSettings.defaultTrackPrivacy}
              onChange={handleAppSettingsChange}
              className="w-full md:w-64 bg-surface border border-border rounded px-4 py-2 text-text-primary"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          
          <div className="pt-2">
            <button
              onClick={() => saveSettings('app')}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
            >
              {loading ? 'Saving...' : 'Save App Settings'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Firebase Settings */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Firebase Configuration</h2>
        <p className="text-text-secondary mb-4">
          Firebase configuration is managed through environment variables.
        </p>
        
        <div className="bg-surface border border-border rounded p-4">
          <pre className="text-text-secondary overflow-x-auto">
            {JSON.stringify(firebaseSettings, null, 2)}
          </pre>
        </div>
      </div>
      
      {/* Email Settings */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Email Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="fromEmail" className="block text-text-primary mb-1">
              From Email
            </label>
            <input
              id="fromEmail"
              name="fromEmail"
              type="email"
              value={emailSettings.fromEmail}
              onChange={handleEmailSettingsChange}
              className="w-full md:w-64 bg-surface border border-border rounded px-4 py-2 text-text-primary"
            />
          </div>
          
          <div>
            <label htmlFor="adminEmail" className="block text-text-primary mb-1">
              Admin Email
            </label>
            <input
              id="adminEmail"
              name="adminEmail"
              type="email"
              value={emailSettings.adminEmail}
              onChange={handleEmailSettingsChange}
              className="w-full md:w-64 bg-surface border border-border rounded px-4 py-2 text-text-primary"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="enableWelcomeEmail"
              name="enableWelcomeEmail"
              type="checkbox"
              checked={emailSettings.enableWelcomeEmail}
              onChange={handleEmailSettingsChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="enableWelcomeEmail" className="ml-2 block text-text-primary">
              Enable Welcome Email
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="enableActivityNotifications"
              name="enableActivityNotifications"
              type="checkbox"
              checked={emailSettings.enableActivityNotifications}
              onChange={handleEmailSettingsChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="enableActivityNotifications" className="ml-2 block text-text-primary">
              Enable Activity Notifications
            </label>
          </div>
          
          <div className="pt-2">
            <button
              onClick={() => saveSettings('email')}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 