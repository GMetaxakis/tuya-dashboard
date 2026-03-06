"use client";

import { PanelProps, findDPByPattern } from "./types";
import { DPValue, PanelCard } from "./ui";

export default function SensorPanel({ dps }: PanelProps) {
  const temp = findDPByPattern(dps, /temp_current|temperature/);
  const humidity = findDPByPattern(dps, /humidity/);
  const battery = findDPByPattern(dps, /battery/);

  const tempVal = temp
    ? Number(temp.current_value) > 100
      ? (Number(temp.current_value) / 10).toFixed(1)
      : String(temp.current_value)
    : null;

  return (
    <PanelCard title="Sensor Readings">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tempVal && <DPValue label="Temperature" value={`${tempVal}°C`} />}
        {humidity && <DPValue label="Humidity" value={`${humidity.current_value ?? "?"}%`} />}
        {battery && (
          <DPValue
            label="Battery"
            value={`${battery.current_value ?? "?"}%`}
          />
        )}
      </div>
    </PanelCard>
  );
}
