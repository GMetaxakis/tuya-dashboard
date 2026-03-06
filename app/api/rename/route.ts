import { NextRequest, NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function POST(request: NextRequest) {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ success: false, error: "id and name required" }, { status: 400 });
    return NextResponse.json(await api.renameDevice(id, name));
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
