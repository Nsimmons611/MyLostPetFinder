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
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [confirmingMatchId, setConfirmingMatchId] = useState<number | null>(null);

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
        const activePets = pets.filter((pet: any) => !pet.isFound);
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

  // Fetch top matches for the lost pet
  useEffect(() => {
    if (!pet?.id) return;

    setMatchesLoading(true);
    const token = localStorage.getItem("token");
    
    fetch(`http://127.0.0.1:8000/api/lostpets/${pet.id}/top-matches/`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setTopMatches(data.matches || []);
        setMatchesLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching matches:", err);
        setMatchesLoading(false);
      });
  }, [pet?.id]);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  // Handle confirming a match
  const handleConfirmMatch = async (matchId: number) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert('You must be logged in to confirm a match.');
      router.push('/login');
      return;
    }

    setConfirmingMatchId(matchId);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/matches/${matchId}/confirm/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.status === 403) {
        alert('Only the owner of the lost pet can confirm a match.');
        setConfirmingMatchId(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        alert('Failed to confirm match: ' + (errorData.error || 'Unknown error'));
        setConfirmingMatchId(null);
        return;
      }

      // Success! Redirect to home
      alert('Pet marked as found! Sighting removed from system.');
      router.push('/');
    } catch (err) {
      console.error('Error confirming match:', err);
      alert('Error confirming match');
      setConfirmingMatchId(null);
    }
  };

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
            <p className="text-lg">{pet?.locationLost}</p>
          </div>
        </div>

        {/* Possible Matches Section */}
        <div className="mt-10">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">Possible Matches</h2>
          
          {matchesLoading ? (
            <p className="text-zinc-400">Loading matches...</p>
          ) : topMatches.length > 0 ? (
            <div className="space-y-4">
              {topMatches.map((match: any, index: number) => (
                <div key={match.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-500 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-blue-400">#{index + 1}</span>
                        <h3 className="text-xl font-semibold">{match.sightingDetails?.location || "Unknown Location"}</h3>
                      </div>
                      <p className="text-zinc-400 text-sm mb-2">
                        Sighted: {new Date(match.sightingDetails?.dateSighted).toLocaleDateString()}
                      </p>
                      <p className="text-zinc-300 text-sm">{match.sightingDetails?.description}</p>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-3xl font-bold text-green-400">
                        {(match.matchScore * 100).toFixed(1)}%
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">Match Score</p>
                    </div>
                  </div>

                  {match.sightingDetails?.photo && (
                    <img 
                      src={match.sightingDetails.photo} 
                      alt="Sighting" 
                      className="mt-3 w-full h-32 object-cover rounded-lg border border-zinc-700 cursor-pointer hover:opacity-80 transition"
                      onClick={() => router.push(`/sighting/${match.sightingDetails.id}`)}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/sighting/${match.sightingDetails?.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleConfirmMatch(match.id)}
                      disabled={confirmingMatchId === match.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded-lg font-semibold transition"
                    >
                      {confirmingMatchId === match.id ? "Confirming..." : "Found It!"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No sightings available for this pet yet.</p>
          )}
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
                <p className="text-zinc-400 mt-2">{pet.petType} • {pet.locationLost}</p>
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