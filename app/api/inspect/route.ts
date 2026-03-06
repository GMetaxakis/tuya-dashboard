import { NextRequest, NextResponse } from "next/server";
import { getAPIFromCookies, mergeSpecAndShadow, suggestEntities } from "@/lib/tuya";

export async function GET(request: NextRequest) {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const deviceId = request.nextUrl.searchParams.get("id");
  if (!deviceId) return NextResponse.json({ success: false, error: "id parameter required" }, { status: 400 });

  try {
    // Fetch device info, device list (for fallback name/online), and DPs in parallel
    const [infoResult, allDevices, { merged, category }] = await Promise.all([
      api.getDeviceInfo(deviceId).catch(() => ({ success: false } as Record<string, unknown>)),
      api.getDevices(),
      mergeSpecAndShadow(api, deviceId),
    ]);

    // Find this device in the full list (reliable source for name + online)
    const listDevice = allDevices.find(
      (d) => (d.id || d.device_id) === deviceId
    );

    // Build device info, preferring info API but falling back to list
    let devInfo: Record<string, unknown> = {
      name: listDevice?.name || "?",
      category: listDevice?.category || category,
      is_online: listDevice?.is_online ?? listDevice?.online ?? false,
      ip: "?",
      product_id: listDevice?.product_id || "?",
    };

    // Override with info API data if available (has IP, etc.)
    if (infoResult.success && infoResult.result) {
      const devs = infoResult.result as Record<string, unknown>[] | Record<string, unknown>;
      const dev = Array.isArray(devs) ? devs[0] : devs;
      if (dev) {
        devInfo = {
          name: dev.name || devInfo.name,
          category: dev.category || devInfo.category,
          is_online: dev.is_online ?? devInfo.is_online,
          ip: dev.ip || devInfo.ip,
          product_id: dev.product_id || devInfo.product_id,
        };
      }
    }

    const dps = Object.keys(merged).sort((a, b) => +a - +b).map((dpId) => {
      const dp = merged[+dpId];
      let values: unknown = {};
      try { values = typeof dp.values === "string" ? JSON.parse(dp.values) : dp.values; } catch { /* */ }
      return { dp_id: +dpId, code: dp.code, type: dp.type, writable: dp.writable, current_value: dp.current_value, values };
    });

    const entities = suggestEntities(merged);
    const suggested = entities.map((e) => ({
      platform: e.platform, id: e.id, code: e.code, friendly_name: e.friendly_name,
      current_value: e.current_value, writable: e.writable,
      ...(e.scaling ? { scaling: e.scaling } : {}),
      ...(e.device_class ? { device_class: e.device_class } : {}),
      ...(e.unit_of_measurement ? { unit_of_measurement: e.unit_of_measurement } : {}),
      ...(e.state_on ? { state_on: e.state_on, state_off: e.state_off } : {}),
    }));

    const devName = (devInfo.name as string) || "Device";
    const localtuyaConfig = entities.map((e) => ({
      platform: e.platform, id: e.id,
      friendly_name: `${devName} ${e.code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      ...(e.scaling ? { scaling: e.scaling } : {}),
      ...(e.device_class ? { device_class: e.device_class } : {}),
      ...(e.unit_of_measurement ? { unit_of_measurement: e.unit_of_measurement } : {}),
      ...(e.state_on ? { state_on: e.state_on, state_off: e.state_off } : {}),
    }));

    return NextResponse.json({ success: true, device: devInfo, dps, suggested_entities: suggested, localtuya_config: localtuyaConfig });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
