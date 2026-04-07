"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Pet {
  id: number;
  name: string;
  pet_type: string;
  description: string;
  photo?: string;
  created_at: string;
}

interface LostPetReport {
  id: number;
  is_found: boolean;
}

export default function MyPets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [lostPetReports, setLostPetReports] = useState<Record<number, LostPetReport>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch owned pets
    fetch("http://127.0.0.1:8000/api/owned-pets/", {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPets(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching pets:", err);
        setLoading(false);
      });

    // Fetch lost pet reports for current user
    fetch("http://127.0.0.1:8000/api/my-lost-pets/", {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const reportsByPetId: Record<number, LostPetReport> = {};
          data.forEach((report: any) => {
            if (report.pet && !report.is_found) {
              reportsByPetId[report.pet] = {
                id: report.id,
                is_found: report.is_found,
              };
            }
          });
          setLostPetReports(reportsByPetId);
        }
      })
      .catch((err) => {
        console.error("Error fetching lost pet reports:", err);
      });
  }, [router]);

  const handleDelete = async (petId: number) => {
    if (!window.confirm("Are you sure you want to delete this pet?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/owned-pets/${petId}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        setPets(pets.filter((p) => p.id !== petId));
        alert("Pet deleted successfully.");
      } else {
        alert("Failed to delete pet.");
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Error deleting pet.");
    }
  };

  const handleMarkAsFound = async (petId: number) => {
    if (!window.confirm("Did you find your pet? This will remove it from the lost pets map.")) return;

    const token = localStorage.getItem("token");
    const lostPetReport = lostPetReports[petId];
    
    if (!lostPetReport) {
      alert("No lost pet report found.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/my-lost-pets/${lostPetReport.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ is_found: true }),
      });

      if (res.ok) {
        const newReports = { ...lostPetReports };
        delete newReports[petId];
        setLostPetReports(newReports);
        alert("Pet marked as found!");
      } else {
        alert("Failed to mark pet as found.");
      }
    } catch (error) {
      console.error("Error marking pet as found:", error);
      alert("Error marking pet as found.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">My Registered Pets</h1>
            <p className="text-zinc-500 text-sm mt-1">Your pet profile inventory</p>
          </div>

          <div className="flex gap-4">
            <Link href="/pets/register" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-green-900/20">
              + Register New Pet
            </Link>
            <Link href="/" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition text-zinc-300">
              Back Home
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Loading Pets...</p>
            </div>
          ) : pets.length > 0 ? (
            pets.map((pet) => (
              <div key={pet.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-green-500/50 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-green-400">{pet.name}</h2>
                    <span className="inline-block bg-zinc-800 text-zinc-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter mt-2">
                      {pet.pet_type}
                    </span>
                    <p className="mt-4 text-zinc-300">{pet.description}</p>
                    <p className="text-zinc-500 text-xs mt-3">
                      Registered: {new Date(pet.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {lostPetReports[pet.id] ? (
                      <button
                        onClick={() => handleMarkAsFound(pet.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                      >
                        Set as Found?
                      </button>
                    ) : (
                      <Link
                        href={`/pets/report/${pet.id}`}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm inline-block"
                      >
                        Report Lost
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center bg-zinc-900/10">
              <p className="text-zinc-500 text-lg">No registered pets yet.</p>
              <p className="text-zinc-600 text-sm mt-2">Click the button above to register your first pet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
