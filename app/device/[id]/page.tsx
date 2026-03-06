"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ControlPanel from "@/components/panels";

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

  useEffect(() => {
    loadDevice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function loadDevice() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/inspect?id=${deviceId}`);
      if (r.status === 401) { router.push("/login"); return; }
      const d = await r.json();
      if (d.success) {
        setData(d);
      } else {
        setError(d.error || "Failed to load device");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <header className="flex items-center justify-between pb-4 mb-6 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="px-3 py-1.5 rounded-md border border-border text-text2 text-sm hover:bg-bg2">
            &larr;
          </Link>
          <h1 className="text-xl font-semibold">
            <span className="text-accent">{dev.name}</span>
          </h1>
          <button
            onClick={handleRename}
            disabled={renaming}
            className="px-2.5 py-1 rounded-md border border-border bg-bg2 text-text2 text-xs hover:border-accent hover:text-text disabled:opacity-50"
          >
            Rename
          </button>
        </div>
      </header>

      {status && (
        <div className="px-4 py-2.5 rounded-lg bg-bg2 text-text2 text-sm mb-5">{status}</div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <InfoCard label="Status" value={dev.is_online ? "Online" : "Offline"} dot={dev.is_online} />
        <InfoCard label="Category" value={dev.category} />
        <InfoCard label="IP" value={dev.ip} mono />
        <InfoCard label="Device ID" value={deviceId} mono />
        <InfoCard label="Product" value={dev.product_id} mono />
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-bg2 rounded-lg p-1 w-fit mb-5">
        {(["control", "dps", "suggested", "config", "raw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
          onRefresh={loadDevice}
        />
      )}

      {tab === "dps" && (
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
      )}

      {tab === "suggested" && (
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

function InfoCard({ label, value, mono, dot }: { label: string; value: string; mono?: boolean; dot?: boolean }) {
  return (
    <div className="bg-bg2 rounded-lg p-3.5 border border-border">
      <div className="text-[11px] uppercase text-text2 tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-medium ${mono ? "font-mono text-xs break-all" : ""}`}>
        {dot !== undefined && (
          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${dot ? "bg-green" : "bg-red"}`} />
        )}
        {value}
      </div>
    </div>
  );
}
