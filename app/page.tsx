"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);

    try {
      // Normalize username: lowercase, remove spaces
      const normalizedUsername = username
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9_-]/g, "");

      if (!normalizedUsername) {
        setError("Username must contain alphanumeric characters");
        return;
      }

      // Store username in localStorage
      localStorage.setItem("username", normalizedUsername);
      localStorage.setItem("fcmToken", ""); // Will be set after permission
      localStorage.setItem("topic", `user_${normalizedUsername}`);

      // Redirect to inbox
      router.push("/inbox");
    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 text-center">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Firebase FCM
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
              Notify Inbox
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with your username to receive realtime notifications.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Username
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-600">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            No authentication required. Username only.
          </p>
        </div>
      </div>
    </div>
  );
}
