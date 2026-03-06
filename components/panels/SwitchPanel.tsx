"use client";

import { useState } from "react";
import { PanelProps, findDP, sendCommand } from "./types";
import { Toggle, PanelCard } from "./ui";

export default function SwitchPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const switch1 = findDP(dps, "switch_1") || findDP(dps, "switch");
  const switch2 = findDP(dps, "switch_2");

  async function toggle(dp: typeof switch1) {
    if (!dp) return;
    setBusy(dp.code);
    await sendCommand(deviceId, [{ code: dp.code, value: !dp.current_value }]);
    setTimeout(() => { onRefresh(); setBusy(null); }, 1000);
  }

  return (
    <PanelCard title="Switch Control">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {switch1 && (
          <Toggle
            label="Switch 1"
            on={switch1.current_value === true}
            loading={busy === switch1.code}
            onClick={() => toggle(switch1)}
          />
        )}
        {switch2 && (
          <Toggle
            label="Switch 2"
            on={switch2.current_value === true}
            loading={busy === switch2.code}
            onClick={() => toggle(switch2)}
          />
        )}
      </div>
    </PanelCard>
  );
}
