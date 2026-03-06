import { NextResponse } from "next/server";
import { getAPIFromCookies } from "@/lib/tuya";

export async function GET() {
  const api = await getAPIFromCookies();
  return NextResponse.json({ authenticated: !!api });
}
