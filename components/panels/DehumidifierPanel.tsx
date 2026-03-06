"use client";

import { useState } from "react";
import { PanelProps, findDP, findDPByPattern, sendCommand } from "./types";
import { Toggle, DPValue, Slider, ModeSelect, PanelCard } from "./ui";

export default function DehumidifierPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const switchDP = findDP(dps, "switch");
  const mode = findDP(dps, "mode") || findDP(dps, "work_mode");
  const humidity = findDPByPattern(dps, /humidity_indoor|humidity_current/);
  const targetHumidity = findDP(dps, "dehumidify_set_value") || findDPByPattern(dps, /humidity_set/);
  const temp = findDPByPattern(dps, /temp_indoor|temp_current/);
  const tankFull = findDPByPattern(dps, /tank|fault/);
  const fanSpeed = findDP(dps, "fan_speed_enum") || findDPByPattern(dps, /speed/);

  const [busy, setBusy] = useState(false);
  const [humidityVal, setHumidityVal] = useState(Number(targetHumidity?.current_value || 50));

  let modeOptions: string[] = [];
  if (mode?.values?.range) {
    try { modeOptions = typeof mode.values.range === "string" ? JSON.parse(mode.values.range) : mode.values.range; } catch { /* */ }
  }
  let speedOptions: string[] = [];
  if (fanSpeed?.values?.range) {
    try { speedOptions = typeof fanSpeed.values.range === "string" ? JSON.parse(fanSpeed.values.range) : fanSpeed.values.range; } catch { /* */ }
  }

  let humMin = 30, humMax = 80;
  if (targetHumidity?.values) {
    if (targetHumidity.values.min !== undefined) humMin = Number(targetHumidity.values.min);
    if (targetHumidity.values.max !== undefined) humMax = Number(targetHumidity.values.max);
  }

  async function toggleSwitch() {
    if (!switchDP) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: switchDP.code, value: !switchDP.current_value }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
  }

  return (
    <PanelCard title="Dehumidifier Control">
      {switchDP && (
        <div className="mb-4">
          <Toggle label="Power" on={switchDP.current_value === true} loading={busy} onClick={toggleSwitch} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {humidity && <DPValue label="Humidity" value={`${humidity.current_value ?? "?"}%`} />}
        {temp && <DPValue label="Temperature" value={`${temp.current_value ?? "?"}°C`} />}
        {tankFull && <DPValue label="Tank" value={tankFull.current_value ? "Full" : "OK"} />}
      </div>

      {targetHumidity && (
        <Slider
          label="Target Humidity"
          value={humidityVal}
          min={humMin}
          max={humMax}
          unit="%"
          onChange={setHumidityVal}
          onCommit={async (v) => {
            setBusy(true);
            await sendCommand(deviceId, [{ code: targetHumidity.code, value: v }]);
            setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
          }}
          disabled={busy}
        />
      )}

      <div className="space-y-4 mt-4">
        {mode && modeOptions.length > 0 && (
          <ModeSelect label="Mode" value={String(mode.current_value || "")} options={modeOptions} onChange={async (v) => {
            setBusy(true);
            await sendCommand(deviceId, [{ code: mode.code, value: v }]);
            setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
          }} disabled={busy} />
        )}
        {fanSpeed && speedOptions.length > 0 && (
          <ModeSelect label="Fan Speed" value={String(fanSpeed.current_value || "")} options={speedOptions} onChange={async (v) => {
            setBusy(true);
            await sendCommand(deviceId, [{ code: fanSpeed.code, value: v }]);
            setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
          }} disabled={busy} />
        )}
      </div>
    </PanelCard>
  );
}
