import { NextRequest, NextResponse } from "next/server";
import { TuyaAPI, TuyaCreds, encryptCreds } from "@/lib/tuya";

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret, region = "eu" } = await request.json();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "API Key and API Secret are required" },
        { status: 400 }
      );
    }

    // Validate credentials by trying to get a token
    const creds: TuyaCreds = { apiKey, apiSecret, region };
    const api = new TuyaAPI(creds);

    try {
      const devices = await api.getDevices();
      const encrypted = encryptCreds(creds);

      // Anonymous usage tracking
      try {
        const trackingId = process.env.TRACKING_ENDPOINT;
        if (trackingId) {
          fetch(trackingId, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "login",
              region,
              deviceCount: devices.length,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {}); // fire-and-forget
        }
      } catch { /* ignore tracking errors */ }

      const response = NextResponse.json({
        success: true,
        deviceCount: devices.length,
      });

      response.cookies.set("tuya_creds", encrypted, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid credentials — could not authenticate with Tuya Cloud" },
        { status: 401 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
