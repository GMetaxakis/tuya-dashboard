import crypto from "crypto";

const REGION_HOSTS: Record<string, string> = {
  eu: "openapi.tuyaeu.com",
  us: "openapi.tuyaus.com",
  cn: "openapi.tuyacn.com",
  in: "openapi.tuyain.com",
};

export const DP_PLATFORM_HINTS: Record<string, string> = {
  switch: "switch", switch_1: "switch", switch_2: "switch",
  switch_led: "switch", child_lock: "switch",
  cur_power: "sensor", cur_current: "sensor", cur_voltage: "sensor",
  add_ele: "sensor", fault: "sensor",
  temp_current: "sensor", humidity_value: "sensor",
  battery_percentage: "sensor",
  temp_set: "number", bright_value: "number",
  countdown_1: "number", countdown_2: "number",
  work_mode: "select", mode: "select",
};

const TYPE_PLATFORM_MAP: Record<string, string> = {
  Boolean: "switch",
  Integer: "sensor",
  Enum: "select",
  String: "sensor",
};

export interface TuyaCreds {
  apiKey: string;
  apiSecret: string;
  region: string;
}

export interface MergedDP {
  code: string;
  type: string;
  values: string | Record<string, unknown>;
  writable: boolean;
  current_value?: unknown;
}

export interface SuggestedEntity {
  platform: string;
  id: number;
  code: string;
  friendly_name: string;
  scaling?: number;
  device_class?: string;
  unit_of_measurement?: string;
  state_on?: string;
  state_off?: string;
  current_value?: unknown;
  writable?: boolean;
}

// ── Cookie encryption ──

const ALGORITHM = "aes-256-gcm";
// In production, set COOKIE_SECRET env var. Falls back to a derived key.
function getEncryptionKey(): Buffer {
  const secret = process.env.COOKIE_SECRET || "tuya-dashboard-default-key-change-me";
  return crypto.scryptSync(secret, "tuya-salt", 32);
}

export function encryptCreds(creds: TuyaCreds): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(creds), "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

export function decryptCreds(encrypted: string): TuyaCreds | null {
  try {
    const key = getEncryptionKey();
    const [ivHex, tagHex, data] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// ── Tuya API Client ──

export class TuyaAPI {
  private apiKey: string;
  private apiSecret: string;
  private host: string;
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(creds: TuyaCreds) {
    this.apiKey = creds.apiKey;
    this.apiSecret = creds.apiSecret;
    this.host = `https://${REGION_HOSTS[creds.region] || REGION_HOSTS.eu}`;
  }

  private sign(method: string, path: string, body = "", query = "", token = ""): [string, string] {
    const t = Date.now().toString();
    const contentHash = crypto.createHash("sha256").update(body).digest("hex");
    const stringToSign = query
      ? `${method}\n${contentHash}\n\n${path}?${query}`
      : `${method}\n${contentHash}\n\n${path}`;
    const signStr = this.apiKey + token + t + stringToSign;
    const sign = crypto
      .createHmac("sha256", this.apiSecret)
      .update(signStr)
      .digest("hex")
      .toUpperCase();
    return [t, sign];
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const path = "/v1.0/token?grant_type=1";
    const [t, sign] = this.sign("GET", "/v1.0/token", "", "grant_type=1");
    const resp = await fetch(`${this.host}${path}`, {
      headers: {
        client_id: this.apiKey,
        sign,
        t,
        sign_method: "HMAC-SHA256",
      },
    });
    const data = await resp.json();
    if (data.success) {
      this.token = data.result.access_token;
      this.tokenExpiry = Date.now() + (data.result.expire_time - 60) * 1000;
      return this.token!;
    }
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }

  async request(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    const token = await this.getToken();
    const bodyStr = body ? JSON.stringify(body) : "";

    let pathPart = path;
    let query = "";
    if (path.includes("?")) {
      [pathPart, query] = path.split("?", 2);
    }

    const [t, sign] = this.sign(method, pathPart, bodyStr, query, token);
    const headers: Record<string, string> = {
      client_id: this.apiKey,
      access_token: token,
      sign,
      t,
      sign_method: "HMAC-SHA256",
      "Content-Type": "application/json",
    };

    const resp = await fetch(`${this.host}${path}`, {
      method,
      headers,
      ...(bodyStr ? { body: bodyStr } : {}),
    });
    return resp.json();
  }

  async getDevices(): Promise<Record<string, unknown>[]> {
    await this.getToken();
    const all: Record<string, unknown>[] = [];
    let lastRowKey = "";

    for (let i = 0; i < 10; i++) {
      const path = `/v1.0/iot-01/associated-users/devices?last_row_key=${lastRowKey}&size=100`;
      const result = await this.request("GET", path);
      if (!result.success || !result.result) break;
      const r = result.result as Record<string, unknown>;
      const devices = (r.devices || []) as Record<string, unknown>[];
      if (!devices.length) break;
      all.push(...devices);
      lastRowKey = (r.last_row_key as string) || "";
      if (!r.has_more) break;
    }
    return all;
  }

  async getDeviceInfo(deviceId: string) {
    return this.request("GET", `/v2.0/cloud/thing/device?device_ids=${deviceId}`);
  }

  async getDeviceShadow(deviceId: string) {
    return this.request("GET", `/v2.0/cloud/thing/${deviceId}/shadow/properties`);
  }

  async getDeviceSpec(deviceId: string) {
    return this.request("GET", `/v1.0/iot-03/devices/${deviceId}/specification`);
  }

  async getDeviceStatus(deviceId: string) {
    return this.request("GET", `/v1.0/iot-03/devices/${deviceId}/status`);
  }

  async renameDevice(deviceId: string, name: string) {
    return this.request("PUT", `/v1.0/iot-03/devices/${deviceId}`, { name });
  }
}

// ── DP Helpers ──

export async function mergeSpecAndShadow(
  api: TuyaAPI,
  deviceId: string
): Promise<{ merged: Record<number, MergedDP>; category: string }> {
  const [specResult, shadowResult] = await Promise.all([
    api.getDeviceSpec(deviceId),
    api.getDeviceShadow(deviceId),
  ]);

  const specByCode: Record<string, { type: string; values: string; writable: boolean }> = {};
  const funcCodes = new Set<string>();
  let category = "?";

  if (specResult.success && specResult.result) {
    const spec = specResult.result as Record<string, unknown>;
    category = (spec.category as string) || "?";
    for (const func of (spec.functions || []) as Record<string, string>[]) {
      funcCodes.add(func.code || "");
      specByCode[func.code || ""] = {
        type: func.type || "?",
        values: func.values || "{}",
        writable: true,
      };
    }
    for (const status of (spec.status || []) as Record<string, string>[]) {
      if (!specByCode[status.code || ""]) {
        specByCode[status.code || ""] = {
          type: status.type || "?",
          values: status.values || "{}",
          writable: false,
        };
      }
    }
  }

  const merged: Record<number, MergedDP> = {};
  if (shadowResult.success && shadowResult.result) {
    const props = ((shadowResult.result as Record<string, unknown>).properties || []) as Record<string, unknown>[];
    for (const prop of props) {
      const dpId = prop.dp_id as number;
      const code = (prop.code as string) || "?";
      const specInfo = specByCode[code] || {};
      merged[dpId] = {
        code,
        type: (specInfo as { type?: string }).type || (prop.type as string) || "?",
        values: (specInfo as { values?: string }).values || "{}",
        writable: (specInfo as { writable?: boolean }).writable ?? funcCodes.has(code),
        current_value: prop.value,
      };
    }
  }

  return { merged, category };
}

export function suggestEntities(mergedDps: Record<number, MergedDP>): SuggestedEntity[] {
  const entities: SuggestedEntity[] = [];

  for (const dpIdStr of Object.keys(mergedDps).sort((a, b) => +a - +b)) {
    const dpId = +dpIdStr;
    const dp = mergedDps[dpId];
    let platform = DP_PLATFORM_HINTS[dp.code] || TYPE_PLATFORM_MAP[dp.type] || "sensor";
    if (dp.type === "Boolean" && !dp.writable) platform = "binary_sensor";

    let scaling: number | undefined;
    try {
      const values = typeof dp.values === "string" ? JSON.parse(dp.values) : dp.values;
      if (values && typeof values === "object" && "scale" in values) {
        const scale = Number((values as Record<string, unknown>).scale);
        if (scale > 0) scaling = Math.pow(10, -scale);
      }
    } catch { /* ignore */ }

    let device_class: string | undefined;
    let unit: string | undefined;
    if (dp.code.includes("temp")) { device_class = "temperature"; unit = "°C"; }
    else if (dp.code.includes("humidity")) { device_class = "humidity"; unit = "%"; }
    else if (dp.code === "cur_power") { device_class = "power"; unit = "W"; }
    else if (dp.code === "cur_current") { device_class = "current"; unit = "mA"; }
    else if (dp.code === "cur_voltage") { device_class = "voltage"; unit = "V"; }
    else if (dp.code.includes("battery")) { device_class = "battery"; unit = "%"; }
    else if (dp.code === "add_ele") { device_class = "energy"; unit = "kWh"; }

    const entity: SuggestedEntity = {
      platform, id: dpId, code: dp.code,
      friendly_name: `DP ${dpId} ${dp.code}`,
      current_value: dp.current_value,
      writable: dp.writable,
    };
    if (scaling) entity.scaling = scaling;
    if (device_class) entity.device_class = device_class;
    if (unit) entity.unit_of_measurement = unit;
    if (platform === "binary_sensor") {
      entity.state_on = "True";
      entity.state_off = "False";
    }
    entities.push(entity);
  }
  return entities;
}

// ── Helper: get API from cookie ──

import { cookies } from "next/headers";

export async function getAPIFromCookies(): Promise<TuyaAPI | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get("tuya_creds")?.value;
  if (!encrypted) return null;
  const creds = decryptCreds(encrypted);
  if (!creds) return null;
  return new TuyaAPI(creds);
}
