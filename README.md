# create-pwa-kit

> Scaffold a production-ready Next.js 14 PWA in seconds.

```bash
npx create-pwa-kit my-app
```

Built from hard-won experience shipping [OneKural](https://onekural.com) — a production PWA. All the tricky bits are pre-wired.

## What you get

- **Service worker** — cache-first assets, network-first navigation, offline fallback
- **Web App Manifest** — with placeholder icons ready for customization
- **Dark mode** — class-based Tailwind, three-way toggle (light/dark/system), persists in localStorage
- **PWA meta tags** — `theme-color`, `viewport-fit=cover`, `apple-mobile-web-app-capable`
- **Security headers** — CSP, X-Frame-Options, Referrer-Policy via `next.config.mjs`

## Optional features

| Flag | What it adds |
|------|-------------|
| **Supabase** | `@supabase/supabase-js` client, `.env.example` keys |
| **Authentication** | `AuthContext`, `SignInModal` (Google OAuth + OTP email) |
| **Push notifications** | VAPID setup, subscribe/unsubscribe/send API routes, `PushPrompt` component, SW push handlers |
| **Bottom tab nav** | `BottomNav`, `BackExitHandler` (Android back button exits on double-press) |
| **Data model** | Supabase schema, migration, seed script |

## CLI prompt flow

```
npx create-pwa-kit my-app

◆  Project name          [prefilled from arg]
◆  Include Supabase?
   ● Yes → sub-prompts:
       ◆  Supabase features (multi-select)
          ☑ Authentication (Google OAuth + OTP email)
          ☑ Database + example data model
◆  Include push notifications?
◆  Include bottom tab navigation?
◆  Install dependencies now?

✔  Done! cd my-app && cp .env.example .env.local
```

## Documentation

- [Getting started](docs/getting-started.md)
- [Features](docs/features.md)
- [PWA gotchas](docs/gotchas.md)
- [Push notifications](docs/push-notifications.md)
- [Deployment](docs/deployment.md)
- [iOS quirks](docs/ios-quirks.md)

## License

MIT
