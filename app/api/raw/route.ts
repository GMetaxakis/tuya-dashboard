import { NextRequest, NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function POST(request: NextRequest) {
  const api = await getAPIFromCookies();
  if (!api) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  try {
    const { method = "GET", path, body } = await request.json();
    if (!path) return NextResponse.json({ success: false, error: "path required" }, { status: 400 });
    return NextResponse.json(await api.request(method.toUpperCase(), path, body));
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
