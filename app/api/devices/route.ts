import { NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function GET() {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  try {
    const devices = await api.getDevices();
    const result = devices.map((d) => ({
      id: d.id || d.device_id || "",
      name: d.name || "Unknown",
      category: d.category || "?",
      product_id: d.product_id || "?",
      local_key: d.local_key || "?",
      online: d.online ?? d.is_online ?? false,
      ip: d.ip || "?",
    }));
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
