---
title: iOS Quirks
nav_order: 7
---

# iOS Quirks

iOS PWAs have a unique set of constraints and behaviors that differ from Android and desktop. These are the things worth knowing before you ship.

---

## Home Screen Installation

There is no browser install prompt on iOS. Users must install manually:

1. Open the PWA URL in **Safari** (not Chrome, not Firefox — they cannot install PWAs on iOS)
2. Tap the **Share** button (the box with an arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Optionally edit the name, then tap **Add**

The app icon appears on the home screen and launches in standalone mode (no Safari chrome) from then on.

**There is no `beforeinstallprompt` event on iOS.** Do not rely on it. The scaffold does not use it.

---

## Status Bar

Control the status bar appearance when running in standalone mode via the `apple-mobile-web-app-status-bar-style` meta tag:

| Value | Effect |
|---|---|
| `default` | White status bar with dark text |
| `black` | Black status bar with white text |
| `black-translucent` | Status bar overlays the page content (requires your page to handle the inset) |

The scaffold uses `default`. To change it, update the `appleWebApp` entry in `src/app/layout.tsx`:

```ts
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "My App",
},
```

With `black-translucent`, the page renders behind the status bar. Use `env(safe-area-inset-top)` in your CSS to push content below it.

---

## Safe Areas

iPhones with Face ID (notch/Dynamic Island) and the home indicator bar encroach on the usable screen area. Use CSS environment variables to respect these insets:

```css
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-left: env(safe-area-inset-left, 0px);
padding-right: env(safe-area-inset-right, 0px);
```

The fallback `0px` ensures this works on older devices and non-iOS platforms.

**`viewport-fit=cover` is required.** Without it, the browser letterboxes the content and all inset values are zero. The scaffold sets this in `layout.tsx`:

```ts
viewport: {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
```

The scaffold provides `.pb-nav` and `.pb-safe` utility classes in `globals.css` that already account for the bottom safe area. Apply `.pb-nav` to the main content area when the bottom navigation bar is present.

---

## Standalone Detection

```ts
// iOS only — undefined in browsers, true when launched from home screen
const isStandaloneIOS = window.navigator.standalone === true;

// Cross-platform — works on iOS and Android
const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
```

Use `isStandalone` for cross-platform code. Use `navigator.standalone` only for iOS-specific logic (e.g., showing the install prompt banner).

---

## Session Persistence

**PWA sessions are completely separate from Safari.**

When a user signs in via Safari and then opens the PWA from the home screen, they are not signed in. The PWA runs in its own isolated context with its own cookies, localStorage, and IndexedDB. There is no way to share the session.

Consequence: users must sign in separately within the PWA. Design your auth flow with this in mind — avoid relying on an existing browser session.

---

## Back Navigation

iOS has no hardware back button. Users navigate back using in-app controls or swipe gestures (which are part of the OS, not the PWA).

In standalone mode, there is no browser back button either. **You must provide in-app back navigation** for every page that is not a root page.

Use Next.js `<Link>` components with explicit back buttons, or `router.back()`:

```tsx
import { useRouter } from "next/navigation";

function BackButton() {
  const router = useRouter();
  return <button onClick={() => router.back()}>Back</button>;
}
```

---

## Push Notifications

Web Push on iOS requires:

- **iOS 16.4 or later**
- **Safari 16.4 or later**
- The PWA must be **installed to the home screen** — push does not work in mobile Safari

Push notifications do not work in Chrome, Firefox, or any other browser on iOS due to Apple's browser engine restrictions (all iOS browsers must use WebKit).

To check if push is supported on the current device:

```ts
const pushSupported =
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;
```

On iOS before 16.4, `PushManager` is undefined. The `PushPrompt` component checks this and hides itself if push is not supported.

---

## Required Meta Tags

The scaffold handles all of these via Next.js metadata config in `src/app/layout.tsx`. They are documented here for reference.

```html
<!-- Enables standalone mode (no browser chrome) -->
<meta name="apple-mobile-web-app-capable" content="yes" />

<!-- Status bar style (default | black | black-translucent) -->
<meta name="apple-mobile-web-app-status-bar-style" content="default" />

<!-- App name shown under the home screen icon -->
<meta name="apple-mobile-web-app-title" content="My App" />
```

In Next.js `layout.tsx`:

```ts
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My App",
  },
};
```

---

## Apple Touch Icon

iOS uses `apple-touch-icon.png` as the home screen icon. It must be **180×180 pixels** and PNG format.

Place it at `public/apple-touch-icon.png`. The scaffold includes a placeholder. Replace it with your own icon.

The icon should not have rounded corners or a transparent background — iOS applies rounding and a background color automatically.

To reference it in HTML (the scaffold's `layout.tsx` handles this):

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

## Audio and Video Autoplay

iOS does not allow audio or video to autoplay without a user gesture, even in standalone mode. This is a WebKit restriction that applies to PWAs.

If your app plays audio (notifications, background music, transitions), it must be triggered by a user interaction (tap, swipe). The `AudioContext` must also be resumed in response to a user gesture:

```ts
async function playSound() {
  const ctx = new AudioContext();
  await ctx.resume(); // Required on iOS
  // ... play audio
}
```
