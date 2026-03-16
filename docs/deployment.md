# Deployment

The scaffold is optimized for deployment on Vercel, the platform built by the Next.js team. Other platforms that support Next.js (Netlify, Railway, Render) will work but may require additional configuration for service worker headers.

---

## Vercel CLI

Install the Vercel CLI globally:

```bash
npm i -g vercel
```

Log in:

```bash
vercel login
```

Deploy to production:

```bash
vercel --prod
```

On first deploy, the CLI will ask you to link the project to a Vercel account and organization. It detects Next.js automatically and configures the build settings.

---

## Environment Variables

Set all variables from your `.env.local` in Vercel before deploying. There are two ways:

**Via the Vercel dashboard**

1. Go to your project → Settings → Environment Variables
2. Add each variable, selecting the appropriate environments (Production, Preview, Development)

**Via the CLI**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_MAILTO
vercel env add CRON_SECRET
```

Each command prompts you to paste the value and choose which environments it applies to.

After adding variables, redeploy to pick them up:

```bash
vercel --prod
```

---

## Domain Setup

1. Go to your project in the Vercel dashboard → Settings → Domains
2. Click **Add Domain** and enter your domain
3. Update your DNS registrar:
   - For an apex domain (`example.com`): add an `A` record pointing to `76.76.21.21`
   - For a subdomain (`app.example.com`): add a `CNAME` record pointing to `cname.vercel-dns.com`
4. Wait for DNS propagation (usually a few minutes, up to 48 hours)
5. Vercel automatically provisions an SSL certificate via Let's Encrypt

PWA installation requires HTTPS — your custom domain covers this.

---

## Push Notifications: Vercel Cron Setup

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/push/send?secret=<YOUR_CRON_SECRET>",
      "schedule": "0 * * * *"
    }
  ]
}
```

Replace `<YOUR_CRON_SECRET>` with the value of your `CRON_SECRET` environment variable. The schedule `0 * * * *` runs at the top of every hour.

The send route filters by subscriber timezone, so only subscribers for whom it is currently 9 AM receive the notification.

**Vercel cron limits**

- Free plan: 2 cron jobs, minimum interval 1 day
- Pro plan: 40 cron jobs, minimum interval 1 minute

For an hourly cron, you need the Vercel Pro plan.

---

## Data Cache Purging

Vercel caches responses from Next.js data fetches. This cache persists across deploys, so stale data can appear even after deploying a fix.

**How to purge**

1. Vercel dashboard → your project → Storage → Data Cache
2. Click **Purge All** or purge specific cache keys

**Preventing the problem**

For routes where freshness matters, add this to the route handler:

```ts
export const dynamic = "force-dynamic";
```

Or set a short revalidation period:

```ts
export const revalidate = 60; // revalidate every 60 seconds
```

See [gotchas.md](gotchas.md) for more detail on Next.js 14 caching behavior.

---

## Service Worker Headers

The scaffold's `next.config.mjs` adds two critical headers for the service worker:

```js
{
  source: "/sw.js",
  headers: [
    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
    { key: "Service-Worker-Allowed", value: "/" },
  ],
}
```

These are required on all deployment platforms, not just Vercel. If you deploy to a different platform, ensure these headers are served with `sw.js`. Without `Cache-Control: no-cache`, users can get stuck on a stale service worker for up to 24 hours.

---

## Preview Deployments

Vercel automatically creates preview deployments for every push to a non-main branch. Preview deployments get a unique URL (`https://<branch>-<project>.vercel.app`).

Push notifications work in preview deployments if your VAPID keys are set for the Preview environment. The `pushsubscriptionchange` rotation handler references the site origin, so it will correctly target the preview URL.
