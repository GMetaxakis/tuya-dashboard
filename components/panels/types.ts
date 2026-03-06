export interface DP {
  dp_id: number;
  code: string;
  type: string;
  writable: boolean;
  current_value: unknown;
  values: Record<string, unknown>;
}

export interface PanelProps {
  deviceId: string;
  dps: DP[];
  onRefresh: () => void;
}

export function findDP(dps: DP[], code: string): DP | undefined {
  return dps.find((dp) => dp.code === code);
}

export function findDPByPattern(dps: DP[], pattern: RegExp): DP | undefined {
  return dps.find((dp) => pattern.test(dp.code));
}

export async function sendCommand(
  deviceId: string,
  commands: { code: string; value: unknown }[]
): Promise<boolean> {
  try {
    const r = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, commands }),
    });
    const d = await r.json();
    return d.success === true;
  } catch {
    return false;
  }
}
