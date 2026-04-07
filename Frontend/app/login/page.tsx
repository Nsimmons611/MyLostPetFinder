"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // This stores your 'VIP wristband' in the browser
        localStorage.setItem("token", data.access);
        router.push("/"); // Takes you back to the home page to see Bolt
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Cannot connect to the server. Is Django running?");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Owner Login</h1>
        
        {error && <p className="mb-4 text-red-400 text-center bg-red-900/20 p-2 rounded">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-all transform active:scale-95">
          Sign In
        </button>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
            Create one here
          </Link>
        </p>
      </form>
    </main>
  );
}