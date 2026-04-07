'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('../../components/InteractiveMap'), { ssr: false });

export default function ReportLostPet() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    pet_type: 'dog',
    description: '',
    location_lost: '',
    date_lost: new Date().toISOString().split('T')[0],
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/lostpets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to report lost pet');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Map
        </Link>

        <h1 className="text-4xl font-black mb-8">Report Lost Pet</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Interactive Map */}
          <InteractiveMap 
            onLocationSelect={handleLocationSelect}
            title="Mark where your pet was lost"
          />

          {/* Pet Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Pet Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Fluffy, Max"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Pet Type */}
          <div>
            <label className="block text-sm font-bold mb-2">Pet Type *</label>
            <select
              name="pet_type"
              value={formData.pet_type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your pet (color, size, distinguishing features, etc.)"
              required
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Location Description *</label>
            <input
              type="text"
              name="location_lost"
              value={formData.location_lost}
              onChange={handleInputChange}
              placeholder="e.g., Main Street near the park"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Lost */}
          <div>
            <label className="block text-sm font-bold mb-2">Date Lost *</label>
            <input
              type="date"
              name="date_lost"
              value={formData.date_lost}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location Confirmation */}
          {formData.latitude && formData.longitude && (
            <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-green-400 text-sm">
                Location selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white py-3 rounded-lg font-bold transition"
          >
            {loading ? 'Reporting...' : 'Report Lost Pet'}
          </button>
        </form>
      </div>
    </main>
  );
}
