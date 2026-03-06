"use client";

import { useState } from "react";
import { PanelProps, findDP, findDPByPattern, sendCommand } from "./types";
import { Toggle, DPValue, ModeSelect, Slider, PanelCard } from "./ui";

export default function AirPurifierPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const switchDP = findDP(dps, "switch");
  const mode = findDP(dps, "mode") || findDP(dps, "work_mode");
  const speed = findDP(dps, "speed") || findDP(dps, "fan_speed_enum");
  const pm25 = findDPByPattern(dps, /pm25|pm2_5/);
  const filterLife = findDPByPattern(dps, /filter/);
  const childLock = findDP(dps, "child_lock");
  const countdown = findDPByPattern(dps, /countdown/);

  const [busy, setBusy] = useState(false);

  let modeOptions: string[] = [];
  if (mode?.values?.range) {
    try {
      modeOptions = typeof mode.values.range === "string" ? JSON.parse(mode.values.range) : mode.values.range;
    } catch { /* */ }
  }

  let speedOptions: string[] = [];
  if (speed?.values?.range) {
    try {
      speedOptions = typeof speed.values.range === "string" ? JSON.parse(speed.values.range) : speed.values.range;
    } catch { /* */ }
  }

  async function toggleSwitch() {
    if (!switchDP) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: switchDP.code, value: !switchDP.current_value }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  async function changeEnum(dp: typeof mode, value: string) {
    if (!dp) return;
    setBusy(true);
    await sendCommand(deviceId, [{ code: dp.code, value }]);
    setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
  }

  return (
    <PanelCard title="Air Purifier Control">
      {switchDP && (
        <div className="mb-4">
          <Toggle label="Power" on={switchDP.current_value === true} loading={busy} onClick={toggleSwitch} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {pm25 && <DPValue label="PM2.5" value={`${pm25.current_value ?? "?"}`} />}
        {filterLife && <DPValue label="Filter Life" value={`${filterLife.current_value ?? "?"}%`} />}
        {countdown && <DPValue label="Countdown" value={`${countdown.current_value ?? 0} min`} />}
      </div>

      <div className="space-y-4">
        {mode && modeOptions.length > 0 && (
          <ModeSelect label="Mode" value={String(mode.current_value || "")} options={modeOptions} onChange={(v) => changeEnum(mode, v)} disabled={busy} />
        )}
        {speed && speedOptions.length > 0 && (
          <ModeSelect label="Fan Speed" value={String(speed.current_value || "")} options={speedOptions} onChange={(v) => changeEnum(speed, v)} disabled={busy} />
        )}
      </div>

      {childLock && (
        <div className="mt-4">
          <Toggle
            label="Child Lock"
            on={childLock.current_value === true}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await sendCommand(deviceId, [{ code: childLock.code, value: !childLock.current_value }]);
              setTimeout(() => { onRefresh(); setBusy(false); }, 1000);
            }}
          />
        </div>
      )}
    </PanelCard>
  );
}
