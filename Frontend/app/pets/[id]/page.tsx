"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PetDetail() {
  const params = useParams();
  const router = useRouter();
  const [pet, setPet] = useState<any>(null);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [status, setStatus] = useState("loading");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    const token = localStorage.getItem("token");
    
    // Fetch all lost pets to get navigation context
    fetch(`http://127.0.0.1:8000/api/lostpets/`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        const pets = Array.isArray(data) ? data : data.results || [];
        // Filter out found pets for navigation
        const activePets = pets.filter((pet: any) => !pet.is_found);
        setAllPets(activePets);
      })
      .catch((err) => console.error("Error fetching pets:", err));

    // Fetch the specific lost pet
    fetch(`http://127.0.0.1:8000/api/lostpets/${params.id}/`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not Found");
        return res.json();
      })
      .then((data) => {
        setPet(data);
        setStatus("success");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [params?.id]);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const currentIndex = allPets.findIndex((p) => p.id === parseInt(params?.id as string));
  const prevPet = currentIndex > 0 ? allPets[currentIndex - 1] : null;
  const nextPet = currentIndex >= 0 && currentIndex < allPets.length - 1 ? allPets[currentIndex + 1] : null;

  if (status === "loading") {
    return <div className="p-20 text-white bg-black min-h-screen">Connecting to database for Pet #{params?.id}...</div>;
  }

  if (status === "error") {
    return (
      <div className="p-20 text-white bg-black min-h-screen">
        <h1 className="text-red-500 text-2xl">Pet Not Found</h1>
        <p>Could not find pet with ID: {params?.id}</p>
        <Link href="/" className="text-blue-400 underline mt-4 block">Go Back Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
        <Link href="/" className="text-zinc-500 hover:text-white mb-6 block">← Back to Dashboard</Link>
        <h1 className="text-5xl font-bold text-blue-400">{pet?.name}</h1>

        <div className="mt-6">
          {pet?.photo ? (
            <img
              src={pet.photo}
              alt={pet?.name}
              className="w-48 h-48 rounded-lg object-cover cursor-pointer border border-zinc-800"
              onClick={() => setModalOpen(true)}
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">No Photo</div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-xl">{pet?.description}</p>
          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400 text-sm font-bold uppercase">Last Seen</p>
            <p className="text-lg">{pet?.location_lost}</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
          {prevPet ? (
            <button
              onClick={() => router.push(`/pets/${prevPet.id}`)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition"
            >
              ← Previous
            </button>
          ) : (
            <div></div>
          )}
          
          <span className="text-zinc-400 text-sm">
            Pet {currentIndex + 1} of {allPets.length}
          </span>
          
          {nextPet ? (
            <button
              onClick={() => router.push(`/pets/${nextPet.id}`)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition"
            >
              Next →
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {modalOpen && pet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setModalOpen(false)}>
          <div className="bg-zinc-900 rounded-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row gap-6">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="w-full md:w-48 h-48 object-cover rounded-lg" />
              ) : (
                <div className="w-full md:w-48 h-48 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">No Photo</div>
              )}

              <div className="flex-1">
                <h2 className="text-3xl font-bold">{pet.name}</h2>
                <p className="text-zinc-400 mt-2">{pet.pet_type} • {pet.location_lost}</p>
                <p className="mt-4 text-zinc-300">{pet.description}</p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setModalOpen(false)} className="bg-blue-600 px-4 py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}