/**
 * Report Sighting Page
 * 
 * Allow users (anonymous or authenticated) to report a pet sighting.
 * Users can:
 * - Enter the location address where they saw a pet
 * - Click on interactive map to set coordinates
 * - Upload a photo of the pet (optional)
 * - Add extra details and behavior description
 * - Record date and time of sighting
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("../components/InteractiveMap"), { ssr: false });

export default function ReportSighting() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    date_sighted: new Date().toISOString().split('T')[0] + "T" + new Date().toISOString().split('T')[1].slice(0, 5),
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "photo") {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setPhotoFile(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!formData.location) {
      setError("Please enter a location description");
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError("Please select a location on the map");
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const data = new FormData();
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("date_sighted", new Date(formData.date_sighted).toISOString());
      data.append("latitude", formData.latitude.toString());
      data.append("longitude", formData.longitude.toString());
      if (photoFile) {
        data.append("photo", photoFile);
      }

      const res = await fetch("http://127.0.0.1:8000/api/sightings/", {
        method: "POST",
        headers,
        body: data,
      });

      const responseData = await res.json();

      if (res.ok) {
        router.push("/");
      } else {
        setError(responseData.detail || "Failed to report sighting");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to report sighting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (formData === undefined) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Map
        </Link>

        <h1 className="text-4xl font-black mb-2">Report a Sighting</h1>
        <p className="text-zinc-400 mb-8">Help reunite lost pets with their owners</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Description (Address) */}
          <div>
            <label className="block text-sm font-bold mb-2">Address *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Behind the grocery store on Main St"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Interactive Map */}
          <InteractiveMap 
            onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
            title="Mark where you saw the pet"
          />

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold mb-2">Photo of the pet (optional)</label>
            <input
              type="file"
              accept="image/*"
              name="photo"
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-blue-500"
            />
            {photoFile && <p className="text-xs text-green-400 mt-2">{photoFile.name}</p>}
          </div>

          {/* Extra Info (Description) */}
          <div>
            <label className="block text-sm font-bold mb-2">Extra Info</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Behavior, direction heading, nearby landmarks, etc."
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date & Time Sighted */}
          <div>
            <label className="block text-sm font-bold mb-2">Date & Time Sighted *</label>
            <input
              type="datetime-local"
              name="date_sighted"
              value={formData.date_sighted}
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
            {loading ? 'Reporting...' : 'Report Sighting'}
          </button>
        </form>
      </div>
    </main>
  );
}

