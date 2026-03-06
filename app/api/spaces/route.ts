import { NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function GET() {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  try {
    // Get top-level homes
    const homesResult = await api.request("GET", "/v2.0/cloud/thing/space/child?space_id=0");
    if (!homesResult.success || !homesResult.result) {
      return NextResponse.json({ success: true, spaces: [] });
    }

    const homes = (homesResult.result as { data: Record<string, unknown>[] }).data || [];

    // For each home, get its rooms and their devices
    const spaces: { id: string; name: string; rooms: { id: string; name: string; device_ids: string[] }[] }[] = [];

    for (const home of homes) {
      const homeId = String(home.space_id || home.id);
      const homeName = String(home.name || "Home");

      const roomsResult = await api.request("GET", `/v2.0/cloud/thing/space/child?space_id=${homeId}`);
      const rooms: { id: string; name: string; device_ids: string[] }[] = [];

      if (roomsResult.success && roomsResult.result) {
        const roomData = ((roomsResult.result as { data: Record<string, unknown>[] }).data || []);

        // Fetch devices for each room in parallel
        const roomDeviceResults = await Promise.all(
          roomData.map(async (room) => {
            const roomId = String(room.space_id || room.id);
            const roomName = String(room.name || "Room");
            const devResult = await api.request("GET", `/v2.0/cloud/thing/space/device?space_id=${roomId}`);
            const deviceIds: string[] = [];
            if (devResult.success && devResult.result) {
              const devices = (devResult.result as Record<string, unknown>[]) || [];
              for (const d of devices) {
                if (d.device_id) deviceIds.push(String(d.device_id));
                else if (d.id) deviceIds.push(String(d.id));
              }
            }
            return { id: roomId, name: roomName, device_ids: deviceIds };
          })
        );

        rooms.push(...roomDeviceResults);
      }

      spaces.push({ id: homeId, name: homeName, rooms });
    }

    return NextResponse.json({ success: true, spaces });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
