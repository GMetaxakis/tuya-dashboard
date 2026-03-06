# Tuya Dashboard

A self-hosted web dashboard for inspecting and managing Tuya smart devices. Users log in with their own Tuya IoT Platform credentials — no server-side API keys needed.

## Features

- **Device List** — All devices with online status, categories, device IDs, and local keys
- **DP Inspector** — Data Points for any device with current values, types, and ranges
- **LocalTuya Config Generator** — Auto-generates entity configs for [LocalTuya](https://github.com/rospogriern/localtuya)
- **Device Rename** — Rename devices directly from the dashboard
- **API Explorer** — Send raw Tuya API calls (GET/POST/PUT) for debugging
- **Suggested Entities** — Smart mapping of DPs to Home Assistant entity types
- **Secure Auth** — Credentials encrypted in HTTP-only cookies, never exposed to client JS

## How It Works

1. User enters their Tuya IoT Platform credentials (Access ID + Secret)
2. Server validates by fetching the token from Tuya Cloud
3. Credentials are AES-256-GCM encrypted and stored as an HTTP-only cookie
4. All subsequent API calls use the user's own credentials
5. No credentials are stored on the server

## Prerequisites

Each user needs a **Tuya IoT Platform** account:

1. Go to [iot.tuya.com](https://iot.tuya.com)
2. Create a **Cloud Project**
3. Link your **Smart Life / Tuya Smart** app account under **Devices**
4. Subscribe to these APIs under **Service API**:
   - IoT Core
   - Authorization Token Management
   - Smart Home Basic Service

## Setup

```bash
git clone https://github.com/GMetaxakis/tuya-dashboard.git
cd tuya-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Tuya credentials.

## Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `COOKIE_SECRET` | Encryption key for cookie storage | Auto-generated |
| `TRACKING_ENDPOINT` | URL to receive anonymous usage events | None |

## Deploy

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GMetaxakis/tuya-dashboard)

Set `COOKIE_SECRET` in your Vercel environment variables for production.

### Docker

```bash
docker build -t tuya-dashboard .
docker run -p 3000:3000 -e COOKIE_SECRET=your-secret tuya-dashboard
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with Tuya credentials |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/check` | GET | Check auth status |
| `/api/devices` | GET | List all devices |
| `/api/inspect?id=xxx` | GET | Full DP inspection + suggested config |
| `/api/shadow?id=xxx` | GET | Shadow properties |
| `/api/spec?id=xxx` | GET | Device specification |
| `/api/status?id=xxx` | GET | Current DP values |
| `/api/info?id=xxx` | GET | Device info |
| `/api/rename` | POST | Rename device (`{id, name}`) |
| `/api/raw` | POST | Raw API call (`{method, path, body?}`) |

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [Tailwind CSS](https://tailwindcss.com) v4
- TypeScript

## Security

- Tuya credentials are AES-256-GCM encrypted in HTTP-only cookies
- No credentials stored server-side — each user brings their own
- All Tuya API calls authenticated with HMAC-SHA256

## License

MIT
