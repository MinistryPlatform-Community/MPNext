# Dependency Known Issues

State carried between `/audit-deps` runs so each audit starts from prior conclusions
instead of re-deriving them. Every entry needs a date and a re-check trigger.

Seeded 2026-08-20 from the previous version of the audit-deps command. Entries marked
`(inherited)` were verified during an earlier run whose exact date wasn't recorded —
re-verify them on the next audit and stamp a real date.

## Accepted advisories (triaged as not exploitable)

| Package | Advisory | Reason not exploitable | Verified | Re-check when |
|---|---|---|---|---|
| `postcss` (bundled in `next`) | 2 moderate findings under `node_modules/next/...` | This is the copy vendored **inside Next.js**, not the app's direct `postcss` dep (already patched). Next controls it; the only fix npm offers is `npm audit fix --force`, which downgrades `next` to 9.3.3. | (inherited) | Next.js major/minor upgrade, or npm stops offering the `--force` downgrade |
| `better-auth` — `oidc-provider` / `mcp` plugin advisories | class of advisories | This app configures only the **`genericOAuth` client** plugin (`src/lib/auth.ts`). The OIDC-provider and MCP server code paths are never imported. | (inherited) | Any change to `src/lib/auth.ts` plugin list |

## Blocked majors

| Package | Target | Blocker | Verified | Re-check when |
|---|---|---|---|---|
| `typescript` | 7.x | Breaks the Next.js 16 build worker; also rejected by `typescript-eslint` (peer capped `<6.1.0`). Staying on TypeScript 6. | (inherited) | `typescript-eslint` widens its peer range, or Next.js ships TS 7 support |
| `eslint` | 10.x | Outside the current range; `eslint-config-next` / `typescript-eslint` peer support unconfirmed. | (inherited) | `eslint-config-next` declares ESLint 10 support |
| `@types/node` | 26.x | Outside the current range (`^25`); needs evaluation against the installed Node version. | (inherited) | Local/CI Node runtime moves to the matching major |

## Held packages (deliberately not upgraded)

| Package | Pinned at | Reason | Decided |
|---|---|---|---|
| _(none)_ | | | |
