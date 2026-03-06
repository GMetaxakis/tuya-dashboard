"use client";

import { useState } from "react";
import { PanelProps, findDP, findDPByPattern, sendCommand } from "./types";
import { Toggle, DPValue, Slider, ModeSelect, PanelCard } from "./ui";

export default function ThermostatPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const switchDP = findDP(dps, "switch");
  const tempSet = findDP(dps, "temp_set");
  const tempCurrent = findDP(dps, "temp_current") || findDPByPattern(dps, /temp_current/);
  const mode = findDP(dps, "mode") || findDP(dps, "work_mode");
  const heatingState = findDPByPattern(dps, /heating|Heating/);

  const [busy, setBusy] = useState(false);
  const [targetTemp, setTargetTemp] = useState(() => {
    const v = Number(tempSet?.current_value || 200);
    return v > 100 ? v / 10 : v; // handle scaled values
  });

  // Parse temp range from spec
  let tempMin = 5, tempMax = 35;
  if (tempSet?.values) {
    const v = tempSet.values;
    if (v.min !== undefined) tempMin = Number(v.min) > 100 ? Number(v.min) / 10 : Number(v.min);
    if (v.max !== undefined) tempMax = Number(v.max) > 100 ? Number(v.max) / 10 : Number(v.max);
  }

  // Parse mode options
  let modeOptions: string[] = [];
  if (mode?.values?.range) {
    try {
      modeOptions = typeof mode.values.range === "string" ? JSON.parse(mode.values.range) : mode.values.range;
    } catch { /* */ }
  }

  async function toggleSwitch() {
    if (!switchDP) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: switchDP.code, value: !switchDP.current_value }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
  }

  async function commitTemp(temp: number) {
    if (!tempSet) return;
    setBusy(true);
    // Send scaled value if original was scaled
    const sendVal = Number(tempSet.current_value) > 100 ? temp * 10 : temp;
    await sendCommand(deviceId, [{ code: tempSet.code, value: sendVal }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
  }

  async function changeMode(newMode: string) {
    if (!mode) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: mode.code, value: newMode }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1500);
  }

  const currentTemp = tempCurrent
    ? Number(tempCurrent.current_value) > 100
      ? (Number(tempCurrent.current_value) / 10).toFixed(1)
      : String(tempCurrent.current_value)
    : "?";

  return (
    <PanelCard title="Thermostat Control">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {switchDP && (
          <Toggle
            label="Power"
            on={switchDP.current_value === true}
            loading={busy}
            onClick={toggleSwitch}
          />
        )}
        <DPValue label="Current Temperature" value={`${currentTemp}°C`} />
        {heatingState && (
          <DPValue
            label="Heating"
            value={heatingState.current_value ? "Active" : "Idle"}
          />
        )}
      </div>

      {tempSet && (
        <Slider
          label="Target Temperature"
          value={targetTemp}
          min={tempMin}
          max={tempMax}
          step={0.5}
          unit="°C"
          onChange={setTargetTemp}
          onCommit={commitTemp}
          disabled={busy}
        />
      )}

      {mode && modeOptions.length > 0 && (
        <div className="mt-4">
          <ModeSelect
            label="Mode"
            value={String(mode.current_value || "")}
            options={modeOptions}
            onChange={changeMode}
            disabled={busy}
          />
        </div>
      )}
    </PanelCard>
  );
}
