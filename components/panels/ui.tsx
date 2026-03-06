"use client";

import { ReactNode } from "react";

export function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-bg2 rounded-xl border border-border p-5 mb-6">
      <h3 className="text-sm font-semibold text-text2 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function Toggle({
  label,
  on,
  loading,
  onClick,
}: {
  label: string;
  on: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
        on
          ? "bg-green/10 border-green/30 hover:bg-green/15"
          : "bg-bg3 border-border hover:border-text2"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {loading && (
          <div className="w-3.5 h-3.5 border-2 border-border border-t-accent rounded-full animate-spin" />
        )}
        <span
          className={`inline-block w-10 h-6 rounded-full relative transition-colors ${
            on ? "bg-green" : "bg-text2/30"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              on ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
      </div>
    </button>
  );
}

export function DPValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg3 rounded-lg p-3">
      <div className="text-[10px] uppercase text-text2 tracking-wide mb-1">{label}</div>
      <div className="text-sm font-medium font-mono">{value}</div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onCommit,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="p-4 bg-bg3 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono text-accent">
          {value}{unit || ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
        className="w-full accent-accent h-1.5 bg-border rounded-full appearance-none cursor-pointer disabled:opacity-50"
      />
      <div className="flex justify-between text-[10px] text-text2 mt-1">
        <span>{min}{unit || ""}</span>
        <span>{max}{unit || ""}</span>
      </div>
    </div>
  );
}

export function ModeSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="p-4 bg-bg3 rounded-lg">
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              value === opt
                ? "bg-accent text-white"
                : "bg-bg2 border border-border text-text2 hover:text-text hover:border-accent"
            } disabled:opacity-50`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
