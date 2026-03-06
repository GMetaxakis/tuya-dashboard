"use client";

import { useState } from "react";
import { PanelProps, findDP, findDPByPattern, sendCommand } from "./types";
import { DPValue, Slider, ModeSelect, PanelCard } from "./ui";

export default function PresencePanel({ deviceId, dps, onRefresh }: PanelProps) {
  const presence = findDP(dps, "presence_state") || findDPByPattern(dps, /presence/);
  const sensitivity = findDPByPattern(dps, /sensitivity/);
  const distance = findDPByPattern(dps, /near_detection|far_detection|distance/);
  const illuminance = findDPByPattern(dps, /illuminance/);

  const [busy, setBusy] = useState(false);
  const [sensVal, setSensVal] = useState(Number(sensitivity?.current_value || 5));

  let sensMin = 0, sensMax = 9;
  if (sensitivity?.values) {
    if (sensitivity.values.min !== undefined) sensMin = Number(sensitivity.values.min);
    if (sensitivity.values.max !== undefined) sensMax = Number(sensitivity.values.max);
  }

  return (
    <PanelCard title="Presence Sensor">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {presence && (
          <DPValue
            label="Presence"
            value={presence.current_value === "presence" || presence.current_value === true ? "Detected" : "None"}
          />
        )}
        {illuminance && <DPValue label="Illuminance" value={`${illuminance.current_value ?? "?"} lux`} />}
        {distance && <DPValue label="Distance" value={`${distance.current_value ?? "?"}`} />}
      </div>

      {sensitivity && sensitivity.writable && (
        <Slider
          label="Sensitivity"
          value={sensVal}
          min={sensMin}
          max={sensMax}
          onChange={setSensVal}
          onCommit={async (v) => {
            setBusy(true);
            await sendCommand(deviceId, [{ code: sensitivity.code, value: v }]);
            setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
          }}
          disabled={busy}
        />
      )}
    </PanelCard>
  );
}
