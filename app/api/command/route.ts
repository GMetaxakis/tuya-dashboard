import { NextRequest, NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function POST(request: NextRequest) {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  try {
    const { device_id, commands } = await request.json();
    if (!device_id || !commands?.length) {
      return NextResponse.json({ success: false, error: "device_id and commands required" }, { status: 400 });
    }
    // Tuya standard command API: POST /v1.0/iot-03/devices/{id}/commands
    const result = await api.request("POST", `/v1.0/iot-03/devices/${device_id}/commands`, { commands });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
