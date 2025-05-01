import React, { useState } from 'react';

interface User {
  id?: string;
  username: string;
  email: string;
  password?: string;
  name?: string;
  isAdmin: boolean;
}

interface UserFormProps {
  user?: User;
  onSubmit: (userData: User) => Promise<void>;
  isEditing?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSubmit, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState<User>({
    id: user?.id || undefined,
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    name: user?.name || '',
    isAdmin: user?.isAdmin || false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await onSubmit(formData);
      // Success is handled by the parent component (redirect, etc.)
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the user.');
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="username" className="block text-text-primary mb-1">
          Username*
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
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
        <label htmlFor="email" className="block text-text-primary mb-1">
          Email*
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
          required
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-text-primary mb-1">
          {isEditing ? 'Password (leave blank to keep current)' : 'Password*'}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
          required={!isEditing}
          minLength={6}
        />
        <p className="text-text-secondary text-sm mt-1">
          Password must be at least 6 characters long.
        </p>
      </div>
      
      <div>
        <label htmlFor="name" className="block text-text-primary mb-1">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary"
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="isAdmin"
          name="isAdmin"
          type="checkbox"
          checked={formData.isAdmin}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="isAdmin" className="ml-2 block text-text-primary">
          Admin Access
        </label>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded hover:bg-opacity-90 transition-colors"
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}; 