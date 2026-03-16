# Getting Started

## Prerequisites

- **Node.js 18+** — check with `node -v`
- **npm**, **pnpm**, or **yarn** — the scaffold uses npm scripts by default
- A terminal and a modern browser

## Running the CLI

```bash
npx create-pwa-kit my-app
```

You can pass the project name as a positional argument (as above) or leave it blank and the CLI will prompt you. Project names must be lowercase letters, numbers, hyphens, or underscores.

The CLI walks you through a short prompt sequence:

1. Project name (pre-filled if passed as arg)
2. Include Supabase? (yes → sub-prompts for auth and data model)
3. Include push notifications?
4. Include bottom tab navigation?
5. Install dependencies now?

Once complete, your project is created at `./<project-name>/`.

## Setting Up Supabase

If you selected Supabase, you need a project at [supabase.com](https://supabase.com).

1. Sign in and click **New project**
2. Choose your organization, set a name and database password, and pick a region
3. After the project is ready, go to **Settings → API**
4. Copy the **Project URL** and the **anon / public** key
5. For server-side operations, also copy the **service_role** key (keep it secret)

If you selected **Authentication**, also enable the providers you need:

- **Google OAuth**: Settings → Authentication → Providers → Google — you will need a Google Cloud project with an OAuth 2.0 client ID. Set the callback URL to `https://your-project.supabase.co/auth/v1/callback`.
- **OTP email**: Enabled by default in Supabase. Customize the email template under Authentication → Email Templates.

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe to expose in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key — server-side only, never expose |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | VAPID private key — server-side only |
| `VAPID_MAILTO` | Contact email for push — e.g. `mailto:you@example.com` |
| `CRON_SECRET` | Random secret that protects the push send endpoint |

`NEXT_PUBLIC_*` variables are embedded in the client bundle — never put secrets there.

## Local Development

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Hot reload is enabled.

## Mobile Testing on the Local Network

Service workers and push notifications require either HTTPS or `localhost`. To test on a physical device connected to the same Wi-Fi:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then find your machine's IP address:

```bash
hostname -I
```

Open `http://<your-ip>:3000` on your phone. The service worker will register, but push notifications will not work without HTTPS — use [ngrok](https://ngrok.com) for that:

```bash
ngrok http 3000
```

ngrok gives you a temporary `https://` tunnel, which satisfies the HTTPS requirement for push.

## Generating Icons

The scaffold ships with placeholder icons at `public/icons/`. Replace them with your own. If you have a single high-res source image (at least 512×512 PNG), you can generate all sizes automatically:

```bash
npm run generate-icons
```

This script uses the `canvas` npm package. If you get an error about a missing native module, install it:

```bash
npm install canvas
```

`canvas` requires native build tools (`python`, `make`, `gcc`/`clang`). On Ubuntu: `sudo apt install build-essential libcairo2-dev`. On macOS with Homebrew: `brew install pkg-config cairo`.

The script reads `public/icons/source.png` and writes:

- `icon-192.png` — used in the manifest and as the push notification icon
- `icon-512.png` — used in the manifest and as the maskable icon
- `apple-touch-icon.png` — 180×180, used by iOS

## Running the Build

```bash
npm run build
```

This compiles the Next.js app to `.next/`. Check for type errors and build warnings before deploying. Run the production build locally with:

```bash
npm start
```
