# PWA Gotchas

Hard-won knowledge from shipping a production PWA. These are the things that are not obvious from the docs and will cost you hours if you hit them cold.

---

## Favicon

**Next.js App Router uses `src/app/favicon.ico`, not `public/favicon.ico`.**

If you replace `public/favicon.ico` and wonder why the browser still shows the old icon, this is why. The App Router reads the favicon from the `app/` directory.

Also add `src/app/icon.png` (any size, 32×32 or 64×64 is fine) for a PNG fallback. Firefox does not always display `.ico` files correctly and will fall back to `icon.png` automatically when it exists.

---

## API Route Caching

**Next.js 14 caches GET route handlers by default.** If your API returns stale data, add one of these to the route file:

```ts
// Opt out of caching entirely
export const dynamic = "force-dynamic";

// Or: revalidate every N seconds (0 = no cache)
export const revalidate = 0;
```

**Vercel Data Cache persists across deploys.** Even after a redeploy, cached responses from before the deploy may still be served. If you see stale data in production after deploying a fix:

1. Go to your Vercel project → Storage → Data Cache
2. Purge the cache manually

Alternatively, use `vercel env pull` to sync environment variables, which sometimes triggers a cache bust. For critical routes, prefer `force-dynamic` to avoid this class of bug entirely.

---

## iOS Safe Area

iPhones with notches and home indicator bars eat into usable screen space. Use CSS environment variables:

```css
.pb-nav {
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem);
}
```

The scaffold provides `.pb-nav` and `.pb-safe` utility classes in `src/app/globals.css`.

**`viewport-fit=cover` is required** for `env(safe-area-inset-*)` to work. This is already set in the scaffold's `layout.tsx`:

```tsx
viewport: {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
```

Without `viewport-fit=cover`, the browser adds letterboxing and `env()` values are all zero.

---

## iOS Standalone Mode

When a PWA is installed to the iOS home screen and launched, it runs in standalone mode (no Safari chrome). You can detect this:

```ts
// iOS only
const isStandaloneIOS = window.navigator.standalone === true;

// Cross-platform (iOS + Android)
const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
```

Use `isStandalone` for logic that should run in both. Use `navigator.standalone` only if you need iOS-specific behavior.

---

## Service Worker Gotchas

**SW scope must cover all pages.** A service worker at `/sw.js` defaults to controlling only paths under `/`. That is what you want. Do not move `sw.js` into a subdirectory — it would only control that subdirectory.

The scaffold sets `Service-Worker-Allowed: /` in `next.config.mjs` headers. This is required when the SW file is served from a path that would otherwise restrict its scope.

**`Cache-Control: no-cache` on `sw.js`** prevents the browser from serving a stale service worker. This is already configured in `next.config.mjs`. Without it, users can get stuck on an old SW for hours.

**Never cache `/api/` routes without a cache invalidation strategy.** The scaffold's `sw.js` caches `/_next/static/` (safe — these are content-hashed) and uses network-first for navigation. API routes are intentionally not cached by the SW.

---

## Android Back Button

In PWA standalone mode, pressing the Android hardware back button from a root page (one with no browser history to go back to) exits the app. This is jarring and unexpected for users.

The `BackExitHandler` component (included with bottom tab navigation) handles this:

1. On mount, it pushes a sentinel `history` entry so the back button has somewhere to go
2. On `popstate`, it shows a toast: "Press back again to exit"
3. A second back press within 2 seconds exits; after 2 seconds it resets

Under the hood this uses `history.pushState` to create the cushion entry and a `popstate` listener to intercept it. The component only activates when `window.matchMedia("(display-mode: standalone)").matches` is true — it does nothing in the browser.

---

## Dark Mode Flash

A common PWA bug: the page briefly shows in light mode before the correct theme is applied, causing a flash.

The scaffold handles this correctly:

- The `<html>` element has `suppressHydrationWarning` so React does not warn about the class attribute being set server-side vs. client-side
- The theme class (`dark` or nothing) is applied by a tiny inline script before the page renders, avoiding the flash
- `ThemeSwitcher` defers rendering its icon until `isClient` is true to avoid hydration mismatches

Do not use `visibility: hidden` on the `<html>` element as a flash mitigation — it causes layout shift. The inline script approach is the correct solution.

---

## Framer Motion with Next.js

**Crossfade when keying content** — use `<AnimatePresence mode="wait">` with an `exit` prop:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentId}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

Without `exit`, the old element unmounts instantly and you get a flash before the new one fades in.

**Do not put `key` on the outer wrapper of a draggable `motion.div`.** Keying it destroys and recreates the element, which resets the drag MotionValues and breaks the drag gesture. Instead, key a narrow inner element that wraps only the content that changes:

```tsx
// Wrong — breaks drag
<motion.div key={currentId} drag="x">...</motion.div>

// Correct — drag works, content animates
<motion.div drag="x">
  <AnimatePresence mode="wait">
    <motion.div key={currentId} exit={{ opacity: 0 }}>
      {content}
    </motion.div>
  </AnimatePresence>
</motion.div>
```

**`initial={false}` on `AnimatePresence`** suppresses enter animations for ALL children unconditionally, not just on first page mount. Avoid it if you want key-change animations to play. It is only appropriate when you genuinely want to skip the very first mount animation across all children.

**Static elements** that should not animate must live outside the keyed `motion.div`. Placing a static header inside a keyed div causes it to blink on every content navigation.

---

## Local Font Loading

Use `next/font/google` with `display: "swap"` and `preload: true` for critical fonts.

**Use `px`-based font sizes for scripts with tall ascenders (Tamil, CJK, etc.).** `rem`-based `clamp()` scales with the user's system font size preference:

```css
/* Bad — grows with system font scale causing overflow */
font-size: clamp(1.125rem, 4.5vw, 1.75rem);

/* Good — px-based, unaffected by system font scale */
font-size: clamp(18px, 4.5vw, 28px);
```

---

## HTTPS Requirement

Service workers and push notifications **require HTTPS**, with one exception: `localhost` is always allowed.

For testing on a physical device (which does not get the localhost exemption):

```bash
ngrok http 3000
```

ngrok provides a temporary `https://` tunnel. Open the ngrok URL on your phone — service worker registration and push subscription will work.
