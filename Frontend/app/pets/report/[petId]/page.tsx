/**
 * Report Lost Pet Page (Dynamic Route)
 * 
 * Allow authenticated users to report one of their pets as lost.
 * This page is accessed from the "My Pets" page by clicking "Report Lost".
 * 
 * Users can:
 * - Pre-filled with pet details (name, type, description)
 * - Select the date the pet was lost
 * - Enter location description (address/area)
 * - Click on interactive map to set exact coordinates
 * - Submit to add pet to the lost pets map on homepage
 */
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('../../../components/InteractiveMap'), { ssr: false });

interface Pet {
  id: number;
  name: string;
  petType: string;
  description: string;
}

export default function ReportLostPet() {
  const router = useRouter();
  const params = useParams();
  const petId = params.petId as string;
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    dateLost: new Date().toISOString().split('T')[0],
    locationLost: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`http://127.0.0.1:8000/api/owned-pets/${petId}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setPet(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching pet:', err);
        setError('Pet not found');
        setLoading(false);
      });
  }, [petId, router]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map');
      setSubmitting(false);
      return;
    }

    if (!formData.dateLost) {
      setError('Please select a date');
      setSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const dateISO = new Date(formData.dateLost).toISOString();

      const res = await fetch('http://127.0.0.1:8000/api/lostpets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          pet: parseInt(petId),
          name: pet?.name,
          petType: pet?.petType,
          description: pet?.description,
          dateLost: dateISO,
          locationLost: formData.locationLost,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      });

      if (res.ok) {
        alert('Pet reported as lost successfully!');
        router.push('/pets/my-pets');
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to report pet as lost');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-12">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Loading...</p>
        </div>
      </main>
    );
  }

  if (!pet) {
    return (
      <main className="min-h-screen bg-black text-white p-12">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-red-500 mb-4">Pet not found</p>
          <Link href="/pets/my-pets" className="text-blue-500 hover:text-blue-400">
            Back to My Pets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/pets/my-pets" className="text-zinc-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to My Pets
          </Link>
          <h1 className="text-4xl font-black tracking-tighter">Mark where your pet was lost</h1>
          <p className="text-zinc-500 text-sm mt-2">Reporting {pet.name} as lost</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Pet Name</label>
                <input
                  type="text"
                  value={pet.name}
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Type</label>
                <input
                  type="text"
                  value={pet.petType}
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-400"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={pet.description}
                disabled
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-400 h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Date Lost</label>
                <input
                  type="date"
                  name="dateLost"
                  value={formData.dateLost}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Location Description</label>
                <input
                  type="text"
                  name="locationLost"
                  placeholder="e.g., Downtown area, near school"
                  value={formData.locationLost}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Click on the map to mark location</label>
              <InteractiveMap onLocationSelect={handleLocationSelect} />
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-green-500 mt-2">
                  Coordinates selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {submitting ? 'Reporting...' : 'Report Pet As Lost'}
            </button>
            <Link
              href="/pets/my-pets"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
