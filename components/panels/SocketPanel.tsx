"use client";

import { useState } from "react";
import { PanelProps, findDP, sendCommand } from "./types";
import { Toggle, DPValue, PanelCard } from "./ui";

export default function SocketPanel({ deviceId, dps, onRefresh }: PanelProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const switch1 = findDP(dps, "switch_1") || findDP(dps, "switch");
  const switch2 = findDP(dps, "switch_2");
  const power = findDP(dps, "cur_power");
  const voltage = findDP(dps, "cur_voltage");
  const current = findDP(dps, "cur_current");
  const energy = findDP(dps, "add_ele");
  const countdown1 = findDP(dps, "countdown_1");
  const countdown2 = findDP(dps, "countdown_2");

  async function toggle(dp: typeof switch1) {
    if (!dp) return;
    setBusy(dp.code);
    const newVal = !dp.current_value;
    await sendCommand(deviceId, [{ code: dp.code, value: newVal }]);
    setTimeout(() => { onRefresh(); setBusy(null); }, 1000);
  }

  return (
    <PanelCard title="Socket Control">
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

      {(power || voltage || current || energy) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {power && <DPValue label="Power" value={`${Number(power.current_value) / 10} W`} />}
          {voltage && <DPValue label="Voltage" value={`${Number(voltage.current_value) / 10} V`} />}
          {current && <DPValue label="Current" value={`${current.current_value} mA`} />}
          {energy && <DPValue label="Energy" value={`${Number(energy.current_value) / 1000} kWh`} />}
        </div>
      )}

      {(countdown1 || countdown2) && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {countdown1 && <DPValue label="Countdown 1" value={`${countdown1.current_value || 0}s`} />}
          {countdown2 && <DPValue label="Countdown 2" value={`${countdown2.current_value || 0}s`} />}
        </div>
      )}
    </PanelCard>
  );
}
