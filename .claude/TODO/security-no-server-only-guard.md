# TODO: No `server-only` guard on auth, provider and service modules

**Created:** 2026-09-28
**Severity:** Info — nothing leaks today; this is a build-time tripwire against a future mistake that would bundle the service-account client into browser JS.
**Confidence:** Confirmed by code reading (the `server-only` package isn't installed; client files import only type modules).
**Source:** Auth security review 2026-09-28 (MP-client reviewer).

## Finding

`src/lib/auth.ts`, `src/lib/providers/ministry-platform/{client,auth/client-credentials,utils/http-client}.ts` and `src/services/*` have no `import "server-only"`. Non-`NEXT_PUBLIC_` env vars aren't inlined into client bundles, so the secret itself wouldn't ship — but a client import would pull the modules in, fail confusingly at runtime, and could expose logic/endpoints.

## Fix

- Install `server-only` via `npm run deps:relock` (CLAUDE.md § Dependency Rule), and import it at the top of the modules above.
- Alias it to an empty module in `vitest.config.mts`.
- Caveat: its default export condition throws under plain Node, so the `tsx` generator scripts must either run with `--conditions=react-server` or not load modules that import it.

## How to verify a fix

- Importing `@/lib/auth` from a `"use client"` file fails `npm run build`.
