"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPet() {
  const [formData, setFormData] = useState({
    name: "",
    pet_type: "dog",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to register a pet. Redirecting to login...");
      router.push("/login");
      setLoading(false);
      return;
    }

    try {
      // Create FormData to handle file upload
      const data = new FormData();
      data.append("name", formData.name);
      data.append("pet_type", formData.pet_type);
      data.append("description", formData.description);
      if (photoFile) {
        data.append("photo", photoFile);
      }

      const res = await fetch("http://127.0.0.1:8000/api/owned-pets/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: data,
      });

      const responseData = await res.json();

      if (res.ok) {
        alert("Success! Pet registered.");
        router.push("/");
      } else {
        alert("Error: " + JSON.stringify(responseData));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to connect to server. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 bg-black min-h-screen text-white flex flex-col items-center font-sans">
      <Link href="/" className="text-zinc-500 hover:text-white mb-8">← Back to Home</Link>
      <h1 className="text-3xl font-bold mb-8">Register Your Pet</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input
          placeholder="Pet Name"
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <select
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
          value={formData.pet_type}
          onChange={(e) => setFormData({ ...formData, pet_type: e.target.value })}
        >
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="other">Other</option>
        </select>

        <textarea
          placeholder="Describe your pet (breed, color, special markings, etc.)"
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl h-32"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Pet Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-zinc-600 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register Pet"}
        </button>
      </form>
    </main>
  );
}
