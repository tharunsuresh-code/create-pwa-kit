# Push Notifications

The push notification feature pack wires up everything needed for server-sent push notifications: VAPID key management, browser subscription, API routes, a Vercel cron for scheduled sends, and automatic cleanup of expired subscriptions.

---

## 1. Prerequisites

- The **push notifications** feature must be selected during `npx create-pwa-kit`
- The **Supabase** feature must also be selected — subscriptions are stored in the `push_subscriptions` table
- The **data model** feature's `schema.sql` includes the `push_subscriptions` table. If you did not select data model, add the table manually (see below)

**`push_subscriptions` table (minimal)**

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  subscription jsonb not null,
  timezone text,
  created_at timestamptz default now()
);
```

---

## 2. Generating VAPID Keys

VAPID (Voluntary Application Server Identification) is a standard that authenticates your server when sending push messages.

```bash
npx web-push generate-vapid-keys
```

The output looks like:

```
Public Key:
BN2s3...

Private Key:
XyZ9...
```

Copy both keys into `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN2s3...
VAPID_PRIVATE_KEY=XyZ9...
VAPID_MAILTO=mailto:you@example.com
CRON_SECRET=some-long-random-secret
```

Generate a random `CRON_SECRET` with:

```bash
openssl rand -base64 32
```

The public key is safe to embed in the browser bundle (`NEXT_PUBLIC_*`). The private key must stay server-side — never commit it, never expose it in client code.

---

## 3. Client-Side Flow

`src/lib/push.ts` exports three functions:

```ts
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";
```

**`isPushSubscribed(): Promise<boolean>`**

Returns `true` if this device has a push subscription registered with the server. Checks `Notification.permission` and the service worker's `PushManager`.

```ts
const subscribed = await isPushSubscribed();
```

**`subscribeToPush(userId?: string): Promise<void>`**

Requests browser notification permission (if not already granted), subscribes to the browser's push service, and saves the subscription to the server via `POST /api/push/subscribe`.

```ts
await subscribeToPush(user?.id);
```

If the user denies permission, the function throws. Catch the error and show appropriate UI.

**`unsubscribeFromPush(): Promise<void>`**

Removes the browser subscription and deletes it from the server via `POST /api/push/unsubscribe`.

```ts
await unsubscribeFromPush();
```

**Device ID**

Each device gets a stable UUID stored in `localStorage` (key: `device_id`). This ID is also mirrored into IndexedDB so the service worker can access it during `pushsubscriptionchange` events (service workers cannot read `localStorage`).

---

## 4. `PushPrompt` Component

Drop `<PushPrompt />` anywhere in your layout to show a non-intrusive permission prompt:

```tsx
import PushPrompt from "@/components/PushPrompt";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <PushPrompt />
    </>
  );
}
```

The prompt appears after a short delay on first visit, only if the user is not already subscribed and has not previously dismissed it. Dismissal is tracked in `localStorage`.

---

## 5. Server-Side API Routes

**`POST /api/push/subscribe`**

Upserts a push subscription by `device_id`. Body:

```json
{
  "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
  "deviceId": "uuid",
  "userId": "optional-user-uuid",
  "timezone": "America/New_York"
}
```

**`POST /api/push/unsubscribe`**

Deletes a subscription by `device_id`. Body:

```json
{ "deviceId": "uuid" }
```

**`POST /api/push/send`** (also accepts `GET` for Vercel cron compatibility)

Sends a push notification to all subscriptions. Protected by `Authorization: Bearer <CRON_SECRET>`.

The route filters subscriptions by `timezone` — it only sends to subscribers for whom the current UTC time corresponds to 9 AM in their local timezone. This prevents sending notifications in the middle of the night.

Customize the notification content in `src/app/api/push/send/route.ts`.

---

## 6. Scheduling with Vercel Cron

Create `vercel.json` in your project root to run the send route on a schedule:

```json
{
  "crons": [
    {
      "path": "/api/push/send",
      "schedule": "0 * * * *"
    }
  ]
}
```

This fires the route every hour on the hour. The timezone filter inside the route ensures each subscriber receives the notification at 9 AM their local time, regardless of when the cron fires.

**Protecting the endpoint**

Vercel crons do not natively support sending a secret header, but you can add it via `vercel.json` headers:

```json
{
  "crons": [
    {
      "path": "/api/push/send",
      "schedule": "0 * * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/push/send",
      "headers": [
        { "key": "Authorization", "value": "Bearer {{CRON_SECRET}}" }
      ]
    }
  ]
}
```

Note: The `{{CRON_SECRET}}` syntax above is illustrative — Vercel does not perform variable substitution in `vercel.json` headers. In practice, either make the route IP-restricted (Vercel crons come from known IP ranges) or accept a token via a query parameter and set it as an environment variable.

The simplest approach is to check `CRON_SECRET` in the route handler against a Bearer token passed as a query parameter:

```
GET /api/push/send?secret=<CRON_SECRET>
```

And in your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/push/send?secret=your-secret",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 7. Push Subscription Rotation

Browsers occasionally rotate push endpoints silently (the old endpoint stops working and a new one is issued). The service worker handles this automatically via the `pushsubscriptionchange` event:

1. SW receives `pushsubscriptionchange` with `oldSubscription` and a new subscription
2. SW reads the `device_id` from IndexedDB (it cannot read `localStorage`)
3. SW calls `POST /api/push/subscribe` with the new subscription and the device ID

This is why the device ID is mirrored to IndexedDB — so the SW can re-subscribe without any user interaction.

---

## 8. Expired Subscriptions

When a push endpoint returns a `410 Gone` or `404 Not Found`, the subscription is permanently invalid. The `send` route detects these status codes and deletes the expired subscription from the database automatically.

This keeps the `push_subscriptions` table clean and prevents wasting time sending to dead endpoints.
