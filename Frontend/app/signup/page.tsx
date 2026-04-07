"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Username and password are required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access);
        router.push("/");
      } else {
        const data = await response.json();
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Cannot connect to the server. Is Django running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white p-4">
      <form onSubmit={handleSignup} className="p-8 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-green-400">Create Account</h1>
        <p className="text-center text-zinc-400 text-sm mb-6">Register your pet account</p>
        
        {error && <p className="mb-4 text-red-400 text-center bg-red-900/20 p-2 rounded">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-zinc-300">Username</label>
          <input
            type="text"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-zinc-300">Email (Optional)</label>
          <input
            type="email"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
          <input
            type="password"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold transition-all transform active:scale-95 disabled:bg-zinc-600 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-center text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold">
            Sign In
          </Link>
        </p>
      </form>
    </main>
  );
}
