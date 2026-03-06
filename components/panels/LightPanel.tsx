"use client";

import { useState } from "react";
import { PanelProps, findDP, sendCommand } from "./types";
import { Toggle, Slider, ModeSelect, PanelCard } from "./ui";

export default function LightPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const switchDP = findDP(dps, "switch_led") || findDP(dps, "switch");
  const brightness = findDP(dps, "bright_value") || findDP(dps, "bright_value_v2");
  const colorTemp = findDP(dps, "temp_value") || findDP(dps, "temp_value_v2");
  const workMode = findDP(dps, "work_mode");

  const [busy, setBusy] = useState(false);
  const [brightVal, setBrightVal] = useState(Number(brightness?.current_value || 100));
  const [tempVal, setTempVal] = useState(Number(colorTemp?.current_value || 250));

  // Parse ranges
  let brightMin = 10, brightMax = 1000;
  if (brightness?.values) {
    if (brightness.values.min !== undefined) brightMin = Number(brightness.values.min);
    if (brightness.values.max !== undefined) brightMax = Number(brightness.values.max);
  }

  let tempMin = 0, tempMax = 1000;
  if (colorTemp?.values) {
    if (colorTemp.values.min !== undefined) tempMin = Number(colorTemp.values.min);
    if (colorTemp.values.max !== undefined) tempMax = Number(colorTemp.values.max);
  }

  let modeOptions: string[] = [];
  if (workMode?.values?.range) {
    try {
      modeOptions = typeof workMode.values.range === "string" ? JSON.parse(workMode.values.range) : workMode.values.range;
    } catch { /* */ }
  }

  async function toggleSwitch() {
    if (!switchDP) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: switchDP.code, value: !switchDP.current_value }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  async function commitBrightness(val: number) {
    if (!brightness) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: brightness.code, value: val }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  async function commitColorTemp(val: number) {
    if (!colorTemp) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: colorTemp.code, value: val }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  async function changeMode(newMode: string) {
    if (!workMode) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: workMode.code, value: newMode }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  return (
    <PanelCard title="Light Control">
      {switchDP && (
        <div className="mb-4">
          <Toggle
            label="Power"
            on={switchDP.current_value === true}
            loading={busy}
            onClick={toggleSwitch}
          />
        </div>
      )}

      <div className="space-y-4">
        {brightness && (
          <Slider
            label="Brightness"
            value={brightVal}
            min={brightMin}
            max={brightMax}
            unit=""
            onChange={setBrightVal}
            onCommit={commitBrightness}
            disabled={busy}
          />
        )}

        {colorTemp && (
          <Slider
            label="Color Temperature"
            value={tempVal}
            min={tempMin}
            max={tempMax}
            unit=""
            onChange={setTempVal}
            onCommit={commitColorTemp}
            disabled={busy}
          />
        )}

        {workMode && modeOptions.length > 0 && (
          <ModeSelect
            label="Mode"
            value={String(workMode.current_value || "")}
            options={modeOptions}
            onChange={changeMode}
            disabled={busy}
          />
        )}
      </div>
    </PanelCard>
  );
}
