# Design Spec: create-pwa-kit

**Date**: 2026-03-15
**Status**: Implemented

---

## Purpose

`create-pwa-kit` exists because building a production-quality PWA with Next.js 14 involves a long list of non-obvious decisions that are easy to get wrong. Service worker scope, iOS safe areas, Android back button handling, push subscription rotation, dark mode flash prevention, VAPID key management — none of these are covered by the official Next.js docs, and all of them cost real time to figure out.

The project extracts the complete working solution from [OneKural](https://onekural.com), a production PWA, and turns it into a reusable scaffold. The goal is: `npx create-pwa-kit my-app` produces a project that is production-ready on day one, with no hidden traps.

---

## Architecture

The repo is a pnpm monorepo with two packages:

```
create-pwa-kit/
  packages/
    cli/          — the CLI tool (published to npm as "create-pwa-kit")
    template/     — the project template (bundled inside the CLI)
  pnpm-workspace.yaml
  package.json
```

### `packages/cli`

TypeScript source compiled with `tsup`. The CLI entry point is `src/index.ts`, which:

1. Parses CLI arguments
2. Runs the interactive prompt sequence via `@clack/prompts`
3. Assembles a list of `FeaturePack` objects based on user choices
4. Calls `scaffold()` to create the project

The compiled output at `dist/index.js` is the file referenced by the `bin` field in `package.json`. Running `npx create-pwa-kit` downloads and executes this file.

### `packages/template`

A fully working Next.js 14 app. It contains all files that could potentially be included in a scaffolded project, including feature-specific files. The scaffold copies files selectively based on which features are enabled.

The template contains token placeholders (`{{PROJECT_NAME}}`, etc.) that the scaffold replaces during project creation.

---

## CLI Flow

```
npx create-pwa-kit [project-name] [--skip-install]
```

**Prompt sequence** (implemented in `src/prompts.ts`):

1. Project name (text input, pre-filled if passed as arg)
2. Include Supabase? (confirm)
   - If yes: Supabase features (multi-select: auth, data-model)
3. Include push notifications? (confirm)
4. Include bottom tab navigation? (confirm)
5. Install dependencies now? (confirm)

After prompts, `src/index.ts`:

1. Auto-enables Supabase if auth or data-model was selected (they require it)
2. Builds an ordered `FeaturePack[]` — Supabase must precede auth/data-model because auth's injections target files that Supabase creates
3. Calls `scaffold(projectName, dest, packs)`
4. Runs `npm install` if requested
5. Prints next steps via `p.outro()`

---

## Feature Pack System

Each optional feature is a `FeaturePack` object defined in `src/features/`. The scaffold applies packs in order, so dependencies between packs are handled by ordering.

### `FeaturePack` Interface

```ts
interface FeaturePack {
  name: string;
  deps?: Record<string, string>;       // npm dependencies (name → semver)
  devDeps?: Record<string, string>;    // npm devDependencies
  files: FeatureFile[];                // files to copy from template
  injections: FeatureInjection[];      // string injections into existing files
  envVars: string[];                   // lines to append to .env.example
}

interface FeatureFile {
  templateSrc: string;  // path relative to packages/template/
  dest: string;         // path relative to new project root
}

interface FeatureInjection {
  file: string;         // path relative to new project root
  marker: string;       // exact string to find in the file
  content: string;      // text to insert after the marker line
}
```

### Feature Pack Catalog

| Pack | Key additions |
|---|---|
| `supabase` | `src/lib/supabase.ts`, CSP injection for `*.supabase.co`, env vars |
| `auth` | `src/lib/auth.tsx`, `src/components/SignInModal.tsx`, `AuthProvider` injected into `Providers.tsx` |
| `push` | `src/lib/push.ts`, `PushPrompt`, 3 API routes, push handlers injected into `sw.js` |
| `bottom-nav` | `BottomNav`, `BackExitHandler`, both injected into `layout.tsx` |
| `data-model` | `supabase/schema.sql`, `supabase/migrations/001_init.sql`, `scripts/seed.ts` |

---

## Token Replacement

The scaffold performs string replacement on all text files after copying. Tokens are `{{DOUBLE_BRACE}}` placeholders in the template source.

| Token | Value | Example input | Example output |
|---|---|---|---|
| `{{PROJECT_NAME}}` | The project name as-is | `my-pwa` | `my-pwa` |
| `{{PROJECT_NAME_TITLE}}` | Title-cased from slug | `my-pwa` | `My Pwa` |
| `{{PROJECT_INITIALS}}` | First letters of first two words | `my-pwa` | `MP` |

Token replacement runs on files with these extensions: `.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.css`, `.md`, `.sql`, `.yaml`, `.yml`, `.env`, `.example`. Binary files (images, etc.) are skipped.

---

## Injection System

The injection system inserts feature-specific code into base template files without requiring the base files to know about any features. This keeps the base template clean while still allowing features to add imports, providers, components, and event handlers.

**Marker format**: `// FEATURE_INJECT: <identifier>` for TypeScript/JS files, `{/* FEATURE_INJECT: <identifier> */}` for JSX.

**How injection works** (in `scaffold.ts`):

1. Find the marker string in the file
2. Find the end of the marker's line (`\n`)
3. Insert the `content` string immediately after the newline

The content is inserted on the line(s) after the marker, preserving indentation context. Markers are left in place — they are inert comments and do not affect runtime behavior.

**Defined markers**

| File | Marker | Used by |
|---|---|---|
| `src/components/Providers.tsx` | `// FEATURE_INJECT: providers_imports` | auth |
| `src/components/Providers.tsx` | `{/* FEATURE_INJECT: providers_wrap_start */}` | auth |
| `src/components/Providers.tsx` | `{/* FEATURE_INJECT: providers_wrap_end */}` | auth |
| `src/app/layout.tsx` | `// FEATURE_INJECT: layout_imports` | bottom-nav |
| `src/app/layout.tsx` | `{/* FEATURE_INJECT: layout_bottom_nav */}` | bottom-nav |
| `public/sw.js` | `// FEATURE_INJECT: push_handlers` | push |
| `next.config.mjs` | `"connect-src 'self'"` | supabase (CSP expansion) |

---

## Template Structure

The base template (what you always get, regardless of features) includes:

```
src/
  app/
    layout.tsx          — root layout with metadata, font, Providers
    page.tsx            — minimal home page
    globals.css         — Tailwind base + .pb-nav / .pb-safe / dark mode utilities
    loading.tsx         — loading UI
    about/page.tsx      — example secondary route
  components/
    Providers.tsx       — ThemeProvider wrapper with FEATURE_INJECT markers
    ThemeSwitcher.tsx   — three-way theme toggle (light/dark/system)
    ServiceWorkerRegistrar.tsx — registers sw.js on mount
  lib/
    theme.tsx           — theme context and useTheme() hook
public/
  sw.js                 — service worker (network-first nav, cache-first static)
  manifest.json         — web app manifest with {{PROJECT_NAME}} tokens
  favicon.ico           — placeholder
  icons/
    icon-192.png        — placeholder
    icon-512.png        — placeholder
    apple-touch-icon.png — placeholder
next.config.mjs         — security headers, SW headers, image config
tailwind.config.ts
tsconfig.json
package.json.hbs        — Handlebars-like template processed into package.json
.env.example            — base env (empty)
```

Feature-specific files exist in the template directory but are excluded from the base copy. They are only copied when their feature pack is active.

---

## Distribution

The CLI is distributed as a public npm package named `create-pwa-kit`. The `bin` field in `packages/cli/package.json`:

```json
{
  "bin": {
    "create-pwa-kit": "./dist/index.js"
  }
}
```

This enables:

```bash
npx create-pwa-kit my-app
```

The `template/` directory is bundled inside the published package. At runtime, `scaffold.ts` resolves the template path relative to `__dirname`:

```ts
const TEMPLATE_DIR = path.join(__dirname, "../../template");
```

When the package is installed via npx, `__dirname` points to `node_modules/create-pwa-kit/dist/`, so `../../template` resolves to `node_modules/create-pwa-kit/template/`.

**Build command**: `tsup src/index.ts --format cjs --dts --clean`

tsup compiles TypeScript to CommonJS and generates type declarations. CommonJS is used (not ESM) for maximum compatibility with the wide range of Node.js versions that run `npx`.

---

## Key Design Decisions

### Why @clack/prompts

`@clack/prompts` provides excellent terminal UX out of the box: spinners, multi-select, confirm prompts, cancellation handling, and styled output. The alternatives (`inquirer`, `prompts`, `enquirer`) are heavier and less visually polished. Clack's API is clean and the bundle size is minimal.

### Why tsup

`tsup` is zero-configuration — it infers everything from `package.json` and the entry file. The alternative (`tsc` alone) does not bundle dependencies, which would require the template to be separately resolving. `esbuild` (which tsup uses internally) is fast enough that the build step is not a bottleneck.

### Why string injection vs AST transformation

AST-based code modification (e.g., using TypeScript's compiler API or `jscodeshift`) would be more robust for complex transformations, but it is significantly more complex to implement and debug. The injection system has one job: insert a known string after a known marker. String injection is predictable, transparent (the markers are visible in the template source), and easy to extend. For the complexity level of the injections needed here, string injection is the right tradeoff.

### Why a flat feature list vs nested dependencies

Each feature pack declares its own deps, files, injections, and env vars. There is no dependency graph between feature packs — ordering is handled by the fixed sequence in `index.ts`. This is intentional: the feature combinations are known in advance and limited in number. A dependency resolution system would add complexity without real benefit given the small feature set.

### Why template files live in `packages/template/` rather than being embedded as strings

Keeping real files in `packages/template/` means the template is itself a valid Next.js app that can be run and tested independently. If template files were embedded as template literal strings in the CLI source, they would be impossible to type-check, lint, or run without extracting them first.
