# Tuya Dashboard

A modern web dashboard for inspecting and controlling your Tuya smart home devices. Built with Next.js, connects directly to the Tuya Cloud API. No server-side secrets needed — bring your own Tuya credentials.

[![Deploy to Vercel](https://img.shields.io/badge/Deploy%20to-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/GMetaxakis/tuya-dashboard)

## Features

- **Device Overview** — Browse all devices with search, categories, online status, local keys, and IPs
- **Device Control Panels** — Tailored UI for each device type:
  - Sockets & Switches (toggles, power/energy monitoring)
  - Thermostats (temperature slider, modes, heating state)
  - Lights (brightness, color temperature, work modes)
  - Air Purifiers & Dehumidifiers (modes, fan speed, PM2.5, filters)
  - Sensors (temperature, humidity, battery, presence, plants)
  - Generic fallback for any unknown device type
- **DP Inspector** — View all data points with types, current values, ranges, and R/W status
- **LocalTuya Config Generator** — Auto-generates Home Assistant LocalTuya entity configs
- **Suggested Entities** — Smart mapping of DPs to HA entity platforms with device classes
- **API Explorer** — Browse a catalog of Tuya Cloud endpoints, or type custom paths. Supports GET/POST/PUT/DELETE with placeholder prompts and request body editing
- **Device Rename** — Rename devices directly via the Tuya Cloud API
- **Prev/Next Navigation** — Quickly browse through your device list

## How It Works

1. User enters their Tuya IoT Platform credentials (Access ID + Secret)
2. Server validates by fetching a token from Tuya Cloud
3. Credentials are AES-256-GCM encrypted and stored as an HTTP-only cookie
4. All subsequent API calls use the user's own credentials
5. No credentials are stored on the server

## Prerequisites

You need a **Tuya IoT Platform** account with a Cloud Project:

1. Go to [iot.tuya.com](https://iot.tuya.com)
2. Create a **Cloud Project** (or use an existing one)
3. Link your **Smart Life / Tuya Smart** app account under **Devices**
4. Subscribe to these APIs under **Service API**:
   - IoT Core
   - Authorization Token Management
   - Smart Home Basic Service

## Getting Started

```bash
git clone https://github.com/GMetaxakis/tuya-dashboard.git
cd tuya-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Tuya credentials.

## Deploy

### Vercel (Recommended)

Click the deploy button above, or:

```bash
npm i -g vercel
vercel
```

No environment variables required. Optionally set `COOKIE_SECRET` for a custom encryption key.

### Docker

```bash
docker build -t tuya-dashboard .
docker run -p 3000:3000 -e COOKIE_SECRET=your-secret tuya-dashboard
```

## Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `COOKIE_SECRET` | Encryption key for cookie storage | Auto-derived |
| `TRACKING_ENDPOINT` | URL to receive anonymous usage events | None |

## Project Structure

```
app/
  page.tsx                # Device list + API Explorer with endpoint catalog
  login/page.tsx          # Login with Tuya credentials
  device/[id]/page.tsx    # Device detail: control panel, DPs, config, raw API
  api/                    # Server-side routes (auth, devices, commands, inspect, raw)
components/
  panels/                 # Device-specific control panels
    SocketPanel.tsx         Sockets (toggle + power monitoring)
    SwitchPanel.tsx         Switches (multi-gang toggles)
    ThermostatPanel.tsx     Thermostats (temp control + modes)
    LightPanel.tsx          Lights (brightness + color temp)
    AirPurifierPanel.tsx    Air purifiers (modes + PM2.5)
    DehumidifierPanel.tsx   Dehumidifiers (humidity target + modes)
    SensorPanel.tsx         T&H / plant sensors (read-only)
    PresencePanel.tsx       Presence sensors (state + illuminance)
    GenericPanel.tsx        Fallback for unknown device types
lib/
  tuya.ts                 # Tuya API client, encryption, DP merge & entity suggestion
  categories.ts           # Device category code-to-label mapping
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with Tuya credentials |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/check` | GET | Check auth status |
| `/api/devices` | GET | List all devices |
| `/api/inspect?id=xxx` | GET | Full DP inspection + suggested config |
| `/api/command` | POST | Send device commands (`{device_id, commands}`) |
| `/api/shadow?id=xxx` | GET | Shadow properties (live DP values) |
| `/api/spec?id=xxx` | GET | Device specification (DP definitions) |
| `/api/status?id=xxx` | GET | Current DP values |
| `/api/info?id=xxx` | GET | Device info |
| `/api/rename` | POST | Rename device (`{id, name}`) |
| `/api/raw` | POST | Raw API call (`{method, path, body?}`) |

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Tuya Cloud API](https://developer.tuya.com/en/docs/cloud/)
- TypeScript

## Security

- Tuya credentials are AES-256-GCM encrypted in HTTP-only cookies
- No credentials stored server-side — each user brings their own
- All Tuya API calls authenticated with HMAC-SHA256
- No cloud dependencies beyond Tuya's own API

## License

MIT
