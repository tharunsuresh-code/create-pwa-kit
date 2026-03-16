# Features

All features are opt-in during the CLI prompt flow. The base scaffold ships without any of them — add only what you need.

---

## Supabase

**What it adds**

- `src/lib/supabase.ts` — a typed Supabase client singleton
- `.env.example` entries for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- A CSP injection in `next.config.mjs` that whitelists `*.supabase.co` for `connect-src`

**How to use it**

```ts
import { supabase } from "@/lib/supabase";

const { data, error } = await supabase.from("items").select("*");
```

The client is a browser-side client using the anon key. For server-side work (API routes, Server Actions), import the service role client:

```ts
import { supabaseAdmin } from "@/lib/supabase";
```

**Where the keys come from**

Go to your Supabase project → Settings → API. Copy the Project URL, the `anon` key, and the `service_role` key into `.env.local`.

---

## Authentication

Requires Supabase. Adds Google OAuth and passwordless OTP email sign-in.

**What it adds**

- `src/lib/auth.tsx` — `AuthProvider`, `useAuth()` hook
- `src/components/SignInModal.tsx` — modal with Google and email OTP sign-in

**Using the auth context**

Wrap your app in `AuthProvider` (done automatically by the scaffold's `Providers.tsx` via injection):

```tsx
const { user, signOut, openSignIn } = useAuth();
```

| Value | Description |
|---|---|
| `user` | The Supabase `User` object, or `null` if not signed in |
| `signOut()` | Signs out and clears the session |
| `openSignIn()` | Opens the `SignInModal` |

**Opening the sign-in modal**

```tsx
import { useAuth } from "@/lib/auth";

function ProfileButton() {
  const { user, openSignIn } = useAuth();
  return user
    ? <span>{user.email}</span>
    : <button onClick={openSignIn}>Sign in</button>;
}
```

**Google OAuth setup**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy the Client ID and Secret into Supabase: Authentication → Providers → Google

**OTP email**

No extra setup needed. Supabase sends a magic link by default. Customize the template under Authentication → Email Templates in the Supabase dashboard.

---

## Push Notifications

Requires Supabase (subscriptions are stored in the database). For the complete setup guide including VAPID keys, scheduling, and subscription rotation, see [push-notifications.md](push-notifications.md).

**What it adds**

- `src/lib/push.ts` — `subscribeToPush`, `unsubscribeFromPush`, `isPushSubscribed`
- `src/components/PushPrompt.tsx` — a prompt component to ask the user for permission
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/unsubscribe/route.ts`
- `src/app/api/push/send/route.ts`
- Push handlers injected into `public/sw.js` (`push`, `notificationclick`, `pushsubscriptionchange`)

**Client-side API**

```ts
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";

// Check if this device is already subscribed
const subscribed = await isPushSubscribed();

// Subscribe (prompts for permission if needed)
await subscribeToPush(user?.id);

// Unsubscribe
await unsubscribeFromPush();
```

**`PushPrompt` component**

Drop it anywhere in your layout. It renders a non-intrusive prompt after a short delay:

```tsx
import PushPrompt from "@/components/PushPrompt";

// In your layout or page:
<PushPrompt />
```

The component self-hides if the user is already subscribed or has dismissed the prompt.

---

## Bottom Tab Navigation

**What it adds**

- `src/components/BottomNav.tsx` — a fixed bottom navigation bar with iOS safe area support
- `src/components/BackExitHandler.tsx` — Android back button double-press to exit in PWA standalone mode
- Injections into `src/app/layout.tsx` to mount both components

**Customizing the tab bar**

Edit `src/components/BottomNav.tsx`. The tabs are defined as a simple array near the top of the file:

```ts
const tabs = [
  { href: "/",        label: "Home",    icon: HomeIcon },
  { href: "/explore", label: "Explore", icon: SearchIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];
```

Replace `HomeIcon` etc. with any React component or SVG. The active tab is highlighted based on `usePathname()`.

**BackExitHandler behavior**

On Android, pressing the hardware back button at a root route (`/`) in PWA standalone mode would normally exit the app silently. `BackExitHandler` intercepts this:

1. First press: shows a toast — "Press back again to exit"
2. Second press within 2 seconds: exits the app
3. After 2 seconds: resets, first press shows the toast again

This is achieved by pushing a sentinel `history` entry and listening to `popstate`. It only activates in PWA standalone mode (`display-mode: standalone`).

**iOS safe area**

`BottomNav` uses the `.pb-nav` utility class from `globals.css`:

```css
.pb-nav {
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem);
}
```

Apply this class to page content that would otherwise be obscured by the nav bar. `viewport-fit=cover` is already set in `layout.tsx`.

---

## Data Model

Requires Supabase. Adds a starter schema with an example `items` table as a starting point.

**What it adds**

- `supabase/schema.sql` — full schema with `items` table, RLS policies, and indexes
- `supabase/migrations/001_init.sql` — migration file for use with the Supabase CLI or Supabase Studio
- `scripts/seed.ts` — TypeScript seed script to populate sample data

**Running the migration**

Apply the migration via the Supabase CLI:

```bash
npx supabase db push
```

Or copy the SQL from `supabase/migrations/001_init.sql` and run it in the Supabase Studio SQL editor.

**Running the seed script**

```bash
npx tsx scripts/seed.ts
```

Make sure your `.env.local` is populated with the service role key before running the seed — it bypasses RLS to insert rows.

**Customizing the schema**

The `items` table is intentionally generic. Replace it with your own domain model. The schema file includes a `push_subscriptions` table if you also enabled push notifications — do not remove it or push will break.
