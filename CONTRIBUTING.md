# Contributing to create-pwa-kit

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Types of contributions](#types-of-contributions)
- [Submitting a pull request](#submitting-a-pull-request)
- [Commit message convention](#commit-message-convention)
- [Reporting bugs](#reporting-bugs)
- [Requesting features](#requesting-features)

## Getting started

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/create-pwa-kit.git
   cd create-pwa-kit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the CLI:
   ```bash
   npm run build
   ```

4. Link the CLI locally so you can test it end-to-end:
   ```bash
   npm link packages/cli
   create-pwa-kit my-test-app
   ```

## Project structure

```
create-pwa-kit/
├── packages/
│   ├── cli/          # The create-pwa-kit CLI (prompts, scaffolding logic)
│   └── template/     # The Next.js PWA template files copied into new projects
├── docs/             # Documentation
└── package.json      # Workspace root
```

- Changes to the **CLI flow or prompts** → `packages/cli/src/`
- Changes to **what gets scaffolded** (components, configs, service worker, etc.) → `packages/template/`
- Changes to **documentation** → `docs/`

## Development workflow

Make changes, then test by scaffolding a new project:

```bash
npm run build
create-pwa-kit my-test-app
cd my-test-app
npm install
npm run dev
```

Verify that:
- The dev server starts without errors
- The feature flags you touched work correctly
- The PWA manifest and service worker load in the browser

## Types of contributions

### Bug fixes

Check the [open issues](https://github.com/tharunsuresh-code/create-pwa-kit/issues) for existing bug reports. If you've found a new bug, please [open an issue](#reporting-bugs) before submitting a fix so it can be discussed first.

### New optional features

New features should be addable via a CLI flag (see existing flags like `--supabase` or `--push-notifications` as examples). Keep them optional and off by default so the base scaffold stays minimal.

### Template improvements

Improvements to the generated project — better defaults, updated dependencies, security header tweaks, service worker strategies — are very welcome. Include a brief explanation of _why_ the change is an improvement.

### Documentation

Typo fixes, clarifications, and new guides for the `docs/` folder are always appreciated.

## Submitting a pull request

1. Create a branch from `main`:
   ```bash
   git checkout -b fix/describe-your-change
   # or
   git checkout -b feat/describe-your-change
   ```

2. Make your changes and verify them locally (see [Development workflow](#development-workflow)).

3. Commit your changes following the [commit message convention](#commit-message-convention).

4. Push your branch and open a pull request against `main`.

5. In the PR description:
   - Describe what the change does and why
   - List any flags or generated files affected
   - Include steps to verify the change manually

Pull requests are reviewed on a best-effort basis. Smaller, focused PRs are merged faster.

## Commit message convention

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short summary>
```

Common types:

| Type | When to use |
|------|-------------|
| `feat` | A new feature or CLI option |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that isn't a fix or feature |
| `chore` | Dependency updates, tooling, build scripts |

Examples:

```
feat: add --analytics flag for Plausible integration
fix: correct service worker scope on subdirectory deploys
docs: add iOS Safari gotcha for theme-color
```

## Reporting bugs

Open a [GitHub issue](https://github.com/tharunsuresh-code/create-pwa-kit/issues/new) and include:

- The command you ran (e.g. `npx create-pwa-kit my-app --supabase`)
- The options you selected in the prompts
- The error message or unexpected behaviour
- Your Node.js version (`node -v`) and OS

## Requesting features

Open a [GitHub issue](https://github.com/tharunsuresh-code/create-pwa-kit/issues/new) describing:

- The use case you're trying to solve
- What the ideal CLI/template experience would look like
- Any prior art or libraries you have in mind

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
