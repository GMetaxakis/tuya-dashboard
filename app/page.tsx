"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Device {
  id: string;
  name: string;
  category: string;
  product_id: string;
  local_key: string;
  online: boolean;
  ip: string;
}

import { CATEGORIES } from "@/lib/categories";

export default function Home() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/devices");
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const d = await r.json();
      if (d.success) {
        setDevices(d.result);
        // Cache device list for prev/next navigation on device pages
        try {
          localStorage.setItem("tuya_devices", JSON.stringify(
            d.result.map((dev: Device) => ({ id: dev.id, name: dev.name, category: dev.category, online: dev.online }))
          ));
        } catch { /* ignore */ }
      } else {
        setError(d.error || "Failed to load devices");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const filtered = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.category.includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <header className="flex items-center justify-between pb-4 mb-6 border-b border-border flex-wrap gap-3">
        <h1 className="text-xl font-semibold">
          <span className="text-accent">Tuya</span> Dashboard
        </h1>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-bg2 text-text text-sm w-56 placeholder:text-text2 focus:outline-none focus:border-accent"
          />
          <button
            onClick={loadDevices}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-border bg-bg2 text-text2 text-sm hover:text-text hover:border-red transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red/10 text-red text-sm mb-5">{error}</div>
      )}
      {!error && !loading && (
        <div className="px-4 py-2.5 rounded-lg bg-bg2 text-text2 text-sm mb-5">
          {devices.length} devices
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text2 text-xs uppercase tracking-wider">
              <th className="text-left p-3 border-b border-border w-8"></th>
              <th className="text-left p-3 border-b border-border">Name</th>
              <th className="text-left p-3 border-b border-border">Category</th>
              <th className="text-left p-3 border-b border-border">Device ID</th>
              <th className="text-left p-3 border-b border-border">Local Key</th>
              <th className="text-left p-3 border-b border-border">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text2">
                  <div className="inline-block w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                </td>
              </tr>
            )}
            {!loading && filtered.map((d) => (
              <tr key={d.id} className="hover:bg-bg2 transition-colors">
                <td className="p-3 border-b border-border">
                  <span className={`inline-block w-2 h-2 rounded-full ${d.online ? "bg-green" : "bg-red"}`} />
                </td>
                <td className="p-3 border-b border-border">
                  <Link href={`/device/${d.id}`} className="font-medium hover:text-accent transition-colors">
                    {d.name}
                  </Link>
                </td>
                <td className="p-3 border-b border-border">
                  <span className="inline-block px-2 py-0.5 rounded bg-bg3 text-accent text-xs font-medium">
                    {CATEGORIES[d.category] || d.category}
                  </span>
                </td>
                <td className="p-3 border-b border-border font-mono text-xs text-text2">{d.id}</td>
                <td className="p-3 border-b border-border font-mono text-xs text-text2 max-w-36 truncate" title={d.local_key}>
                  {d.local_key}
                </td>
                <td className="p-3 border-b border-border font-mono text-xs text-text2">{d.ip}</td>
              </tr>
            ))}
            {!loading && !filtered.length && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text2">
                  {search ? "No devices match your search" : "No devices found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ApiExplorer />
    </div>
  );
}

function ApiExplorer() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!path) return;
    setLoading(true);
    setResult("Loading...");
    try {
      const r = await fetch("/api/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, path }),
      });
      setResult(JSON.stringify(await r.json(), null, 2));
    } catch (e) {
      setResult("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h2 className="text-base font-semibold mb-4">API Explorer</h2>
      <div className="flex gap-2.5 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-bg2 text-text text-sm w-24"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/v2.0/cloud/thing/{device_id}/shadow/properties"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg2 text-text text-sm font-mono placeholder:text-text2 focus:outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      {result && (
        <pre className="bg-bg2 rounded-lg p-4 font-mono text-xs text-text2 max-h-96 overflow-auto border border-border whitespace-pre-wrap break-all">
          {result}
        </pre>
      )}
    </div>
  );
}
