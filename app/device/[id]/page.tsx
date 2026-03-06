"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ControlPanel from "@/components/panels";
import { categoryLabel } from "@/lib/categories";

interface DP {
  dp_id: number;
  code: string;
  type: string;
  writable: boolean;
  current_value: unknown;
  values: Record<string, unknown>;
}

interface SuggestedEntity {
  platform: string;
  id: number;
  code: string;
  friendly_name: string;
  current_value: unknown;
  writable: boolean;
  scaling?: number;
  device_class?: string;
  unit_of_measurement?: string;
}

interface DeviceInfo {
  name: string;
  category: string;
  is_online: boolean;
  ip: string;
  product_id: string;
}

interface InspectData {
  device: DeviceInfo;
  dps: DP[];
  suggested_entities: SuggestedEntity[];
  localtuya_config: Record<string, unknown>[];
}

interface DeviceListItem {
  id: string;
  name: string;
  category: string;
  online: boolean;
}

type Tab = "control" | "dps" | "suggested" | "config" | "raw";

export default function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: deviceId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<InspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("control");
  const [rawResult, setRawResult] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  // Device list for prev/next navigation
  const [deviceList, setDeviceList] = useState<DeviceListItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("tuya_devices") || "[]");
    } catch { return []; }
  });

  // If no cached list, fetch it
  useEffect(() => {
    if (deviceList.length > 0) return;
    fetch("/api/devices").then((r) => r.json()).then((d) => {
      if (d.success && d.result) {
        const list = d.result.map((dev: { id: string; name: string; category: string; online: boolean }) => ({
          id: dev.id, name: dev.name, category: dev.category, online: dev.online,
        }));
        setDeviceList(list);
        try { localStorage.setItem("tuya_devices", JSON.stringify(list)); } catch { /* */ }
      }
    }).catch(() => {});
  }, [deviceList.length]);

  const currentIndex = deviceList.findIndex((d) => d.id === deviceId);
  const prevDevice = currentIndex > 0 ? deviceList[currentIndex - 1] : null;
  const nextDevice = currentIndex >= 0 && currentIndex < deviceList.length - 1 ? deviceList[currentIndex + 1] : null;

  useEffect(() => {
    loadDevice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function loadDevice(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/inspect?id=${deviceId}`);
      if (r.status === 401) { router.push("/login"); return; }
      const d = await r.json();
      if (d.success) {
        setData(d);
      } else {
        if (!silent) setError(d.error || "Failed to load device");
      }
    } catch (e) {
      if (!silent) setError((e as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Lightweight refresh for control panels — no loading spinner
  function refreshDPs() {
    loadDevice(true);
  }

  async function handleRename() {
    if (!data) return;
    const newName = prompt("Rename device:", data.device.name);
    if (!newName || newName === data.device.name) return;
    setRenaming(true);
    setStatus("Renaming...");
    try {
      const r = await fetch("/api/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deviceId, name: newName }),
      });
      const d = await r.json();
      if (d.success) {
        setStatus(`Renamed to: ${newName}`);
        setData((prev) =>
          prev ? { ...prev, device: { ...prev.device, name: newName } } : prev
        );
      } else {
        setStatus(`Rename failed: ${d.msg || d.error}`);
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setRenaming(false);
    }
  }

  async function rawCall(endpoint: string) {
    setRawResult("Loading...");
    setTab("raw");
    try {
      const r = await fetch(`/api/${endpoint}?id=${deviceId}`);
      setRawResult(JSON.stringify(await r.json(), null, 2));
    } catch (e) {
      setRawResult("Error: " + (e as Error).message);
    }
  }

  function copyConfig() {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data.localtuya_config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-center gap-3 text-text2">
          <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
          Inspecting device...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6">
        <Link href="/" className="text-text2 text-sm hover:text-text mb-4 inline-block">&larr; All Devices</Link>
        <div className="px-4 py-3 rounded-lg bg-red/10 text-red text-sm">{error || "No data"}</div>
      </div>
    );
  }

  const dev = data.device;

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="px-3 py-1.5 rounded-md border border-border text-text2 text-sm hover:bg-bg2 hover:text-text transition-colors">
          &larr; All Devices
        </Link>
        <div className="flex items-center gap-2">
          {prevDevice ? (
            <Link
              href={`/device/${prevDevice.id}`}
              className="px-3 py-1.5 rounded-md border border-border text-text2 text-sm hover:bg-bg2 hover:text-text transition-colors"
              title={prevDevice.name}
            >
              &larr; Prev
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-md border border-border text-text2/30 text-sm">&larr; Prev</span>
          )}
          {deviceList.length > 0 && (
            <span className="text-text2 text-xs tabular-nums">
              {currentIndex + 1} / {deviceList.length}
            </span>
          )}
          {nextDevice ? (
            <Link
              href={`/device/${nextDevice.id}`}
              className="px-3 py-1.5 rounded-md border border-border text-text2 text-sm hover:bg-bg2 hover:text-text transition-colors"
              title={nextDevice.name}
            >
              Next &rarr;
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-md border border-border text-text2/30 text-sm">Next &rarr;</span>
          )}
        </div>
      </div>

      {/* Device header */}
      <div className="bg-bg2 rounded-xl border border-border p-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Online indicator */}
            <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${dev.is_online ? "bg-green shadow-[0_0_8px_rgba(52,199,89,0.5)]" : "bg-red shadow-[0_0_8px_rgba(255,69,58,0.3)]"}`} />
            <div>
              <h1 className="text-2xl font-semibold">{dev.name}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-medium">
                  {categoryLabel(dev.category)}
                </span>
                <span className={`text-xs font-medium ${dev.is_online ? "text-green" : "text-red"}`}>
                  {dev.is_online ? "Online" : "Offline"}
                </span>
                {dev.ip && dev.ip !== "?" && (
                  <span className="text-xs text-text2 font-mono">{dev.ip}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRename}
              disabled={renaming}
              className="px-3 py-1.5 rounded-md border border-border bg-bg3 text-text2 text-xs hover:border-accent hover:text-text disabled:opacity-50 transition-colors"
            >
              Rename
            </button>
            <button
              onClick={() => loadDevice()}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Compact info row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 pt-4 border-t border-border">
          <div className="text-xs">
            <span className="text-text2">Device ID: </span>
            <span className="font-mono text-text2/80">{deviceId}</span>
          </div>
          <div className="text-xs">
            <span className="text-text2">Product: </span>
            <span className="font-mono text-text2/80">{dev.product_id}</span>
          </div>
          <div className="text-xs">
            <span className="text-text2">DPs: </span>
            <span className="text-text2/80">{data.dps.length}</span>
          </div>
        </div>
      </div>

      {status && (
        <div className="px-4 py-2.5 rounded-lg bg-bg2 text-text2 text-sm mb-5">{status}</div>
      )}

      {/* Prev/Next device names as subtle hints */}
      {(prevDevice || nextDevice) && (
        <div className="flex justify-between mb-4 text-xs text-text2/50">
          <span>{prevDevice ? `← ${prevDevice.name}` : ""}</span>
          <span>{nextDevice ? `${nextDevice.name} →` : ""}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 bg-bg2 rounded-lg p-1 w-fit mb-5 overflow-x-auto">
        {(["control", "dps", "suggested", "config", "raw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t ? "bg-bg3 text-text" : "text-text2 hover:text-text"
            }`}
          >
            {t === "control" ? "Control" : t === "dps" ? "Data Points" : t === "suggested" ? "Suggested Entities" : t === "config" ? "LocalTuya Config" : "Raw API"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "control" && (
        <ControlPanel
          category={dev.category}
          deviceId={deviceId}
          dps={data.dps}
          onRefresh={refreshDPs}
        />
      )}

      {tab === "dps" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text2 text-xs uppercase tracking-wider">
                <th className="text-left p-3 border-b border-border">DP</th>
                <th className="text-left p-3 border-b border-border">Code</th>
                <th className="text-left p-3 border-b border-border">Type</th>
                <th className="text-left p-3 border-b border-border">R/W</th>
                <th className="text-left p-3 border-b border-border">Value</th>
                <th className="text-left p-3 border-b border-border">Range</th>
              </tr>
            </thead>
            <tbody>
              {data.dps.map((dp) => (
                <tr key={dp.dp_id} className="hover:bg-bg2">
                  <td className="p-3 border-b border-border font-mono font-semibold text-accent">{dp.dp_id}</td>
                  <td className="p-3 border-b border-border font-mono text-xs">{dp.code}</td>
                  <td className="p-3 border-b border-border">{dp.type}</td>
                  <td className="p-3 border-b border-border">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      dp.writable ? "bg-green/15 text-green" : "bg-text2/15 text-text2"
                    }`}>
                      {dp.writable ? "RW" : "RO"}
                    </span>
                  </td>
                  <td className="p-3 border-b border-border">
                    <code className="text-xs">{String(dp.current_value ?? "?")}</code>
                  </td>
                  <td className="p-3 border-b border-border text-text2 text-xs font-mono">
                    {dp.values && Object.keys(dp.values).length > 0
                      ? Object.entries(dp.values).map(([k, v]) => `${k}=${v}`).join(", ")
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "suggested" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text2 text-xs uppercase tracking-wider">
                <th className="text-left p-3 border-b border-border">DP</th>
                <th className="text-left p-3 border-b border-border">Platform</th>
                <th className="text-left p-3 border-b border-border">Code</th>
                <th className="text-left p-3 border-b border-border">Class</th>
                <th className="text-left p-3 border-b border-border">Scale</th>
                <th className="text-left p-3 border-b border-border">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.suggested_entities.map((e) => (
                <tr key={e.id} className="hover:bg-bg2">
                  <td className="p-3 border-b border-border font-mono font-semibold text-accent">{e.id}</td>
                  <td className="p-3 border-b border-border">
                    <span className="inline-block px-2 py-0.5 rounded bg-bg3 text-xs font-medium">{e.platform}</span>
                  </td>
                  <td className="p-3 border-b border-border font-mono text-xs">{e.code}</td>
                  <td className="p-3 border-b border-border">{e.device_class || "-"}</td>
                  <td className="p-3 border-b border-border">{e.scaling || "-"}</td>
                  <td className="p-3 border-b border-border">
                    <code className="text-xs">{String(e.current_value ?? "?")}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "config" && (
        <div>
          <button
            onClick={copyConfig}
            className="px-3 py-1.5 rounded-md border border-border bg-bg2 text-text text-xs hover:bg-bg3 mb-3"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <pre className="bg-bg2 rounded-lg p-4 font-mono text-xs text-text2 max-h-[500px] overflow-auto border border-border whitespace-pre-wrap break-all">
            {JSON.stringify(data.localtuya_config, null, 2)}
          </pre>
        </div>
      )}

      {tab === "raw" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {["shadow", "spec", "status", "info"].map((ep) => (
              <button
                key={ep}
                onClick={() => rawCall(ep)}
                className="px-4 py-2 rounded-lg border border-border bg-bg2 text-text text-sm hover:border-accent capitalize"
              >
                {ep}
              </button>
            ))}
          </div>
          {rawResult && (
            <pre className="bg-bg2 rounded-lg p-4 font-mono text-xs text-text2 max-h-96 overflow-auto border border-border whitespace-pre-wrap break-all">
              {rawResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
