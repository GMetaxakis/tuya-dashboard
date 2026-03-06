"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

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

type ViewMode = "list" | "rooms";

interface Room {
  id: string;
  name: string;
  device_ids: string[];
}

interface Space {
  id: string;
  name: string;
  rooms: Room[];
}

export default function Home() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);

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

  async function loadSpaces() {
    if (spaces.length > 0) return;
    setSpacesLoading(true);
    try {
      const r = await fetch("/api/spaces");
      const d = await r.json();
      if (d.success) setSpaces(d.spaces);
    } catch { /* ignore */ }
    finally { setSpacesLoading(false); }
  }

  function toggleView() {
    const next = viewMode === "list" ? "rooms" : "list";
    setViewMode(next);
    if (next === "rooms") loadSpaces();
  }

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
          <ThemeToggle />
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
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-bg2 text-text2 text-sm mb-5">
          <span>{devices.length} devices</span>
          <button
            onClick={toggleView}
            className="text-xs text-accent hover:underline"
          >
            {viewMode === "list" ? "Group by room" : "Show flat list"}
          </button>
        </div>
      )}

      {viewMode === "rooms" ? (
        spacesLoading ? (
          <div className="p-8 text-center text-text2">
            <div className="inline-block w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
            <span className="ml-3">Loading rooms...</span>
          </div>
        ) : (
          <RoomView spaces={spaces} devices={filtered} search={search} />
        )
      ) : (
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
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text2">
                    {search ? "No devices match your search" : "No devices found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ApiExplorer />
    </div>
  );
}

function RoomView({ spaces, devices, search }: { spaces: Space[]; devices: Device[]; search: string }) {
  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const assignedIds = new Set<string>();

  // Collect assigned device IDs
  for (const space of spaces) {
    for (const room of space.rooms) {
      for (const id of room.device_ids) assignedIds.add(id);
    }
  }

  // Devices not in any room
  const unassigned = devices.filter((d) => !assignedIds.has(d.id));

  function renderDevice(d: Device) {
    return (
      <Link
        key={d.id}
        href={`/device/${d.id}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-bg3 hover:bg-border transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${d.online ? "bg-green" : "bg-red"}`} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{d.name}</div>
          <div className="text-xs text-text2">{CATEGORIES[d.category] || d.category}</div>
        </div>
      </Link>
    );
  }

  if (spaces.length === 0) {
    return <div className="p-8 text-center text-text2">No rooms found. Your Tuya account may not have spaces configured.</div>;
  }

  return (
    <div className="space-y-6">
      {spaces.map((space) => (
        <div key={space.id}>
          <h2 className="text-lg font-semibold mb-3">{space.name}</h2>
          <div className="space-y-4">
            {space.rooms.map((room) => {
              const roomDevices = room.device_ids
                .map((id) => deviceMap.get(id))
                .filter((d): d is Device => !!d && (
                  !search ||
                  d.name.toLowerCase().includes(search.toLowerCase()) ||
                  d.category.includes(search.toLowerCase())
                ));

              if (roomDevices.length === 0) return null;

              return (
                <div key={room.id} className="bg-bg2 rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
                    {room.name}
                    <span className="text-text2 ml-2 normal-case tracking-normal font-normal">{roomDevices.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {roomDevices.map(renderDevice)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {unassigned.length > 0 && (
        <div className="bg-bg2 rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text2 uppercase tracking-wider mb-3">
            Unassigned
            <span className="text-text2 ml-2 normal-case tracking-normal font-normal">{unassigned.length}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unassigned.filter((d) =>
              !search ||
              d.name.toLowerCase().includes(search.toLowerCase()) ||
              d.category.includes(search.toLowerCase())
            ).map(renderDevice)}
          </div>
        </div>
      )}
    </div>
  );
}

interface APIEndpoint {
  method: string;
  path: string;
  label: string;
  body?: string;
}

const API_CATALOG: { group: string; endpoints: APIEndpoint[] }[] = [
  {
    group: "Devices",
    endpoints: [
      { method: "GET", path: "/v1.0/iot-01/associated-users/devices?size=100", label: "List all devices" },
      { method: "GET", path: "/v2.0/cloud/thing/device?device_ids={device_id}", label: "Device info" },
      { method: "GET", path: "/v1.0/iot-03/devices/{device_id}", label: "Device details (v1)" },
      { method: "PUT", path: "/v1.0/iot-03/devices/{device_id}", label: "Rename device", body: '{"name": "New Name"}' },
    ],
  },
  {
    group: "Data Points",
    endpoints: [
      { method: "GET", path: "/v2.0/cloud/thing/{device_id}/shadow/properties", label: "Shadow properties (live DPs)" },
      { method: "GET", path: "/v1.0/iot-03/devices/{device_id}/specification", label: "Device specification (DP defs)" },
      { method: "GET", path: "/v1.0/iot-03/devices/{device_id}/status", label: "Device status" },
      { method: "GET", path: "/v1.0/iot-03/devices/{device_id}/functions", label: "Device functions (writable DPs)" },
    ],
  },
  {
    group: "Commands",
    endpoints: [
      { method: "POST", path: "/v1.0/iot-03/devices/{device_id}/commands", label: "Send commands", body: '{"commands": [{"code": "switch_1", "value": true}]}' },
      { method: "POST", path: "/v2.0/cloud/thing/{device_id}/shadow/properties/issue", label: "Issue shadow properties", body: '{"properties": [{"dp_id": 1, "value": true}]}' },
    ],
  },
  {
    group: "Logs & History",
    endpoints: [
      { method: "GET", path: "/v2.0/cloud/thing/{device_id}/report-logs?start_time={start}&end_time={end}&size=20", label: "Report logs" },
      { method: "GET", path: "/v2.0/cloud/thing/{device_id}/state-change-logs?start_time={start}&end_time={end}&size=20", label: "State change logs" },
    ],
  },
  {
    group: "Homes & Rooms",
    endpoints: [
      { method: "GET", path: "/v2.0/cloud/thing/space/child?space_id=0", label: "List homes" },
      { method: "GET", path: "/v2.0/cloud/thing/space/child?space_id={space_id}", label: "List rooms in home" },
      { method: "GET", path: "/v2.0/cloud/thing/space/device?space_id={space_id}", label: "Devices in room" },
    ],
  },
  {
    group: "Scenes & Automation",
    endpoints: [
      { method: "GET", path: "/v2.0/cloud/scene/rule?space_id={space_id}", label: "List scenes/automations" },
      { method: "POST", path: "/v2.0/cloud/scene/rule/{rule_id}/actions/trigger", label: "Trigger scene" },
    ],
  },
];

function ApiExplorer() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const selectEndpoint = (ep: APIEndpoint) => {
    setMethod(ep.method);
    setPath(ep.path);
    if (ep.body) setBody(ep.body);
    else if (ep.method === "GET" || ep.method === "DELETE") setBody("");
    setShowCatalog(false);
  };

  const parseBody = (s: string) => { try { return JSON.parse(s); } catch { return s; } };

  const send = async () => {
    if (!path) return;
    let finalPath = path;
    // Prompt to fill placeholders like {device_id}
    const placeholders = path.match(/\{[^}]+\}/g);
    if (placeholders) {
      const filled = window.prompt(
        `Fill placeholders: ${placeholders.join(", ")}\n\nEdit the path:`,
        path
      );
      if (!filled) return;
      finalPath = filled;
      setPath(filled);
      if (/\{[^}]+\}/.test(filled)) return;
    }
    setLoading(true);
    setResult("Loading...");
    try {
      const r = await fetch("/api/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, path: finalPath, ...(body && (method === "POST" || method === "PUT") ? { body: parseBody(body) } : {}) }),
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
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-semibold">API Explorer</h2>
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${showCatalog ? "bg-accent text-white" : "border border-border bg-bg2 text-text2 hover:text-text hover:border-accent"}`}
        >
          {showCatalog ? "Hide catalog" : "Browse APIs"}
        </button>
      </div>

      {showCatalog && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {API_CATALOG.map((group) => (
            <div key={group.group} className="rounded-lg border border-border bg-bg2 p-3">
              <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{group.group}</h3>
              <div className="space-y-1">
                {group.endpoints.map((ep) => (
                  <button
                    key={ep.path + ep.method}
                    onClick={() => selectEndpoint(ep)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-bg3 transition-colors group"
                  >
                    <span className={`inline-block w-11 text-[10px] font-bold mr-2 ${ep.method === "GET" ? "text-green" : ep.method === "POST" ? "text-yellow" : "text-blue"}`}>
                      {ep.method}
                    </span>
                    <span className="text-xs text-text group-hover:text-accent transition-colors">{ep.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-bg2 text-text text-sm w-24"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
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
      {(method === "POST" || method === "PUT") && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='{"commands": [{"code": "switch_1", "value": true}]}'
          rows={3}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-border bg-bg2 text-text text-sm font-mono placeholder:text-text2 focus:outline-none focus:border-accent resize-y"
        />
      )}
      {result && (
        <pre className="bg-bg2 rounded-lg p-4 font-mono text-xs text-text2 max-h-96 overflow-auto border border-border whitespace-pre-wrap break-all">
          {result}
        </pre>
      )}
    </div>
  );
}
