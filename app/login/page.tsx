"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [region, setRegion] = useState("eu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret, region }),
      });
      const d = await r.json();
      if (d.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(d.error || "Login failed");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">
            <span className="text-accent">Tuya</span> Dashboard
          </h1>
          <p className="text-text2 text-sm">
            Enter your Tuya IoT Platform credentials to get started.
            <br />
            <a
              href="https://iot.tuya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Get credentials at iot.tuya.com
            </a>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-text2 tracking-wide mb-1.5">
              Access ID (API Key)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="your_access_id"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg2 text-text text-sm font-mono placeholder:text-text2/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-text2 tracking-wide mb-1.5">
              Access Secret (API Secret)
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="your_access_secret"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg2 text-text text-sm font-mono placeholder:text-text2/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-text2 tracking-wide mb-1.5">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg2 text-text text-sm focus:outline-none focus:border-accent"
            >
              <option value="eu">Europe (eu)</option>
              <option value="us">Americas (us)</option>
              <option value="cn">China (cn)</option>
              <option value="in">India (in)</option>
            </select>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red/10 text-red text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Connecting to Tuya Cloud..." : "Connect"}
          </button>
        </form>

        <p className="text-text2/60 text-xs text-center mt-6 leading-relaxed">
          Your credentials are encrypted and stored as an HTTP-only cookie.
          <br />
          They are never exposed to client-side JavaScript.
        </p>
      </div>
    </div>
  );
}
