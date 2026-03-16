# create-pwa-kit

Scaffold a production-ready Next.js 14 PWA in seconds.

```bash
npx create-pwa-kit my-app
```

---

## What you get

A Next.js 14 App Router project pre-wired with everything a PWA needs:

- **Service worker** — cache-first static assets, network-first navigation
- **Web App Manifest** — installable on Android and iOS
- **Icons** — placeholder icons + `generate-icons` script for custom branding
- **Dark mode** — system/light/dark toggle, no flash on load
- **CSP headers** — Content Security Policy, X-Frame-Options, Referrer-Policy
- **Tailwind CSS** — dark mode via `class`, custom color palette
- **TypeScript** — strict mode

## Optional features

The CLI walks you through a prompt sequence. Each feature is opt-in:

| Feature | What it adds |
|---|---|
| **Supabase** | Typed Supabase client, env var scaffolding |
| **Authentication** | Google OAuth + passwordless OTP email via Supabase Auth |
| **Push notifications** | VAPID-based push, subscribe/unsubscribe API routes, SW push handlers |
| **Bottom tab navigation** | iOS safe area nav bar, Android back button double-press to exit |
| **Data model** | Starter schema (`items` table), RLS policies, seed script |

`auth` and `data-model` auto-enable `supabase` if not already selected.

## Usage

```
npx create-pwa-kit my-app

◆  Project name          my-app
◆  Include Supabase?     Yes
   ◆  Supabase features  Authentication, Database + data model
◆  Include push notifications?   Yes
◆  Include bottom tab navigation?  Yes
◆  Install dependencies now?  Yes

✔  Done! cd my-app && cp .env.example .env.local
```

## After scaffolding

```bash
cd my-app
cp .env.example .env.local
# Fill in your env vars
npm run dev
```

## Documentation

- [Getting started](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/getting-started.md)
- [Features](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/features.md)
- [PWA gotchas](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/gotchas.md)
- [Push notifications](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/push-notifications.md)
- [iOS quirks](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/ios-quirks.md)
- [Deployment](https://github.com/tharunsuresh-code/create-pwa-kit/blob/main/docs/deployment.md)

## License

MIT
