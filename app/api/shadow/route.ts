import { NextRequest, NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function GET(request: NextRequest) {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
  try {
    return NextResponse.json(await api.getDeviceShadow(id));
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
