# Session Summary — 2026-02-20

## Fix: Production Image & MP Link Display (Issues #30, #31)

### Root Cause

`NEXT_PUBLIC_*` environment variables (specifically `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL` and `NEXT_PUBLIC_APP_NAME`) were referenced directly via `process.env` in `"use client"` components. In Next.js, `NEXT_PUBLIC_*` variables are **inlined at build time** into client-side JavaScript bundles. The Dockerfile's build stage doesn't set these variables, so they get baked in as `undefined` — even though they're available at runtime via docker-compose's `env_file`.

This caused:
- **Issue #30**: Volunteer profile images not showing (image URLs became `undefined/GUID?$thumbnail=true`)
- **Issue #31**: "View in MP" links not rendering (conditional check `mpBaseOrigin` was null, hiding the links)
- **Also affected**: Header avatar image, app name display, contact lookup images (dev-only)

Both worked fine in `npm run dev` because Next.js dev server reads env vars from `.env.local` at runtime.

### Solution: Runtime Config Context

Created a React context that passes server-read env vars to client components at runtime, bypassing the build-time inlining limitation.

**Architecture**:
1. Server component (`layout.tsx`) reads `process.env` at runtime (always works server-side)
2. Passes values as props to `Providers` (client boundary)
3. `RuntimeConfigProvider` context makes values available to all client components
4. Client components use `useRuntimeConfig()` hook instead of `process.env.NEXT_PUBLIC_*`

### Files Created
- `src/contexts/runtime-config-context.tsx` — `RuntimeConfig` interface, context provider, `useRuntimeConfig` hook

### Files Modified
- `src/contexts/index.ts` — Added barrel exports for runtime config context
- `src/app/providers.tsx` — Accepts `runtimeConfig` prop, wraps children with `RuntimeConfigProvider`
- `src/app/(web)/layout.tsx` — Reads env vars server-side, passes `runtimeConfig` to `Providers`
- `src/components/volunteer-processing/volunteer-card.tsx` — Uses `useRuntimeConfig()` for image URLs
- `src/components/volunteer-processing/volunteer-detail-modal.tsx` — Uses `useRuntimeConfig()` for image URLs and MP link construction
- `src/components/layout/header.tsx` — Uses `useRuntimeConfig()` for avatar image and app name
- `src/components/contact-lookup-details/contact-lookup-details.tsx` — Uses `useRuntimeConfig()` for image URLs
- `src/components/contact-lookup/contact-lookup-results.tsx` — Uses `useRuntimeConfig()` for image URLs

### Verification
- Production build (`npm run build`): ✅ Compiled successfully, all 9 routes generated
- ESLint (`npm run lint`): ✅ No new warnings (1 pre-existing unused import warning)
- No remaining `process.env.NEXT_PUBLIC_*` references in any client components

---

## Rename App to "MP Tools" (Issue #4)

Unified the app display name from inconsistent "Pastor App" / "MPNext" / "MPNextApp" to **"MP Tools"** across all occurrences.

### Files Modified
- `src/app/(web)/layout.tsx` — Page title "MP Tools", description "Ministry Platform Tools", fallback default
- `src/contexts/runtime-config-context.tsx` — Default context value
- `.env.example` — Default `NEXT_PUBLIC_APP_NAME=MP Tools`
- `DOCKER.md` — Example env var
- `README.md` — Example env var

## Close Issue #6 (Hide Unused Modules)

Already implemented — Contact Lookup and Template Tool gated behind `isDev` in sidebar and home page. Marked as completed in ideas.md.
