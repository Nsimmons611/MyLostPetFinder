"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SightingDetail() {
  const params = useParams();
  const [sighting, setSighting] = useState<any>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!params?.id) return;

    const token = localStorage.getItem("token");
    
    fetch(`http://127.0.0.1:8000/api/sightings/${params.id}/`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not Found");
        return res.json();
      })
      .then((data) => {
        setSighting(data);
        setStatus("success");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [params?.id]);

  if (status === "loading") {
    return <div className="p-20 text-white bg-black min-h-screen">Loading sighting...</div>;
  }

  if (status === "error") {
    return (
      <div className="p-20 text-white bg-black min-h-screen">
        <h1 className="text-red-500 text-2xl">Sighting Not Found</h1>
        <p>Could not find sighting with ID: {params?.id}</p>
        <Link href="/" className="text-blue-400 underline mt-4 block">Go Back Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
        <Link href="/" className="text-zinc-500 hover:text-white mb-6 block">← Back to Map</Link>
        
        <h1 className="text-4xl font-bold text-blue-400 mb-2">Sighting Report</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Pet Type: <span className="text-white font-semibold capitalize">{sighting?.petType}</span>
        </p>

        {/* Photo */}
        {sighting?.photo ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-3">Photo</h2>
            <img
              src={sighting.photo}
              alt="Sighting"
              className="w-full max-h-96 rounded-lg object-cover border border-zinc-700"
            />
          </div>
        ) : (
          <div className="w-full h-64 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 mb-8">
            No Photo Available
          </div>
        )}

        {/* Details */}
        <div className="space-y-6">
          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400 text-sm font-bold uppercase">Location</p>
            <p className="text-lg">{sighting?.location}</p>
          </div>

          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400 text-sm font-bold uppercase">Date Sighted</p>
            <p className="text-lg">{new Date(sighting?.dateSighted).toLocaleString()}</p>
          </div>

          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400 text-sm font-bold uppercase">Description</p>
            <p className="text-lg">{sighting?.description}</p>
          </div>

          {sighting?.reporterUsername && sighting?.reporterUsername !== 'anonymous' && (
            <div className="p-4 bg-zinc-800 rounded-lg">
              <p className="text-zinc-400 text-sm font-bold uppercase">Reported By</p>
              <p className="text-lg">{sighting?.reporterUsername}</p>
            </div>
          )}

          {sighting?.lostPetName && (
            <div className="p-4 bg-zinc-800 rounded-lg">
              <p className="text-zinc-400 text-sm font-bold uppercase">Linked to Lost Pet</p>
              <p className="text-lg">{sighting?.lostPetName}</p>
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-8">
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition inline-block">
            Back to Map
          </Link>
        </div>
      </div>
    </main>
  );
}
