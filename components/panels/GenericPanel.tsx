"use client";

import { useState } from "react";
import { PanelProps, sendCommand } from "./types";
import { Toggle, DPValue, PanelCard } from "./ui";

export default function GenericPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const [busy, setBusy] = useState<number | null>(null);

  const booleanDPs = dps.filter((dp) => dp.type === "Boolean" && dp.writable);
  const readOnlyDPs = dps.filter((dp) => !dp.writable || dp.type !== "Boolean");

  async function toggleBool(dpId: number, code: string, currentValue: unknown) {
    setBusy(dpId);
    await sendCommand(deviceId, [{ code, value: !currentValue }]);
    setTimeout(() => { onRefresh(); setBusy(null); }, 1000);
  }

  return (
    <PanelCard title="Device Control">
      {booleanDPs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {booleanDPs.map((dp) => (
            <Toggle
              key={dp.dp_id}
              label={`${dp.code} (DP ${dp.dp_id})`}
              on={dp.current_value === true}
              loading={busy === dp.dp_id}
              onClick={() => toggleBool(dp.dp_id, dp.code, dp.current_value)}
            />
          ))}
        </div>
      )}

      {readOnlyDPs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {readOnlyDPs.map((dp) => (
            <DPValue
              key={dp.dp_id}
              label={`${dp.code} (DP ${dp.dp_id})`}
              value={String(dp.current_value ?? "?")}
            />
          ))}
        </div>
      )}
    </PanelCard>
  );
}
