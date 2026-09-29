# Playbook: Port the MPNext 2026-09-28 Security Review Hardening Into This Repo

You are Claude Code running in a repo that was **forked or copied from MPNext** (or from a repo that was). On 2026-09-28 MPNext had a second, broader auth security review. It covered every authentication and authorization path: the better-auth config, the MP OIDC flow, sessions and cookies, the `/api/auth` catch-all and `proxy.ts`, server actions and the role gate, the MP service-account HTTP client, the auth UI, security headers, setup and CI. It found **no Critical or High issues**, and the 2026-09-12 and 2026-09-25 fixes all held against targeted bypass attempts. It did find about sixty Medium, Low and hardening items. Every one was fixed, closed by decision, or accepted as a documented risk on 2026-09-28/29. This playbook ports that work, and the other `main` changes shipped with it, into the repo you are in.

**This playbook comes after `port-downstream-hardening.md`.** That playbook ports the 2026-09-12 findings (F-UPDATE-USER, F2, F1, F4, F5, F7, F9, F10, F11) and the 2026-09-25 ones (F3b, F12). Much of what follows hardens code those fixes introduced: `allowedAuthRoutes`, `refuseIdTokenSignIn`, `AuthorizationService`, the nonce CSP. **If Phase 1 below shows this repo has not taken the earlier playbook, stop and run it first.** Porting this one onto an unhardened fork produces a false sense of completion, because the identity bugs underneath are still open.

**There is no dependency edge from this repo back to MPNext.** The fork was copied, not installed, so no advisory or Dependabot alert will ever reach it. That is why each phase starts with a check you can run in under a minute. Run each check; don't assume the result.

**Outcome you're driving toward**

1. The app **refuses to boot** on a forgeable auth configuration: no secret, better-auth's public default secret, a secret shorter than 32 characters, `BETTER_AUTH_SECRETS`, `TEST` set in production, an unset or non-https `BETTER_AUTH_URL`, or a non-https MP URL.
2. Sessions have a **hard 12 h ceiling**. A copied or forged cookie that no live server row backs dies within 1 h. `session_data` is encrypted (JWE). The user's MP OAuth tokens are held neither in a cookie nor in memory.
3. There is **one `auth` instance per process** across Next's bundle layers, so sign-out deletes the row that `/get-session` reads and the MP logout carries `id_token_hint`. A failed OIDC discovery at boot heals on the next sign-in instead of lasting until a restart.
4. **The role gate fails closed**: with `MP_SECURITY_ROLES` unset, nobody gets in. `*` is an explicit opt-in.
5. **Every MP fetch has a timeout and refuses redirects.** The service-account token is refreshed single-flight and validated. A 401 refreshes and retries once. No endpoint path can leave the API root.
6. **Provider services validate every path segment.** Stored procedures are deny-all unless allowlisted per instance. Communications take a server-built trusted sender.
7. App services write through **Zod `pick` allowlists**, never `omit` blocklists. `Made_By` means "original author". Search input is capped, and the LIKE sanitizer escapes `[`.
8. The HTTP boundary, headers and auth UI are hardened: exact `/api` match, anchored matcher, COOP/CORP, `base-uri 'none'`, `no-store` on auth routes, and a public `/signed-out` page that never auto-starts OAuth. Sign-out is always reachable.
9. `server-only` guards stop a client import of `auth.ts`, the MP client or any service at build time.
10. CI pins actions by SHA with least-privilege permissions and runs lint, `tsc`, a production build and a prerender check.

**Do not skip the discovery phase.** Forks diverge. Some items below will already be done, some will not apply, and some will apply in a different shape.

---

## Breaking changes: read these before you merge anything

Each one changes a contract that fork-specific code may depend on. Grep for every item first, and raise any hit with the user before you change behaviour.

| Change | What breaks | Grep |
|---|---|---|
| `firstName`/`lastName` removed from the session user | Anything reading `session.user.firstName` | `grep -rn "firstName\|lastName" src/` |
| `MPHelper.createCommunication(content, sender, attachments?)` / `sendMessage(content, sender, attachments?)` require a trusted sender. `AuthorUserId`/`FromContactId`/`FromAddress` on the content object are **ignored** | Every existing communication or message send | `grep -rn "createCommunication\|sendMessage" src/` |
| Stored procedures are **deny-all** unless the name is passed as `new MPHelper({ allowedProcedures: [...] })` | Every `executeProcedure(WithBody)` call | `grep -rn "executeProcedure" src/` |
| `getCurrentUserProfile()` returns the six-field `CurrentUserProfile` (`First_Name`, `Nickname`, `Last_Name`, `Email_Address`, `Image_GUID`, `canAccessContactFeatures`), with no roles, groups, IDs or phone | UI that read `roles`, `userGroups`, `Mobile_Phone`, `User_ID` off the profile | `grep -rn "userProfile\.\(roles\|userGroups\|Mobile_Phone\|User_ID\|Contact_ID\)" src/` |
| `UserService.getUserProfile(guid)` serves **only the caller's own** profile | Admin screens that look up other users through it | `grep -rn "getUserProfile" src/` |
| `BETTER_AUTH_URL` (or `NEXTAUTH_URL`) is **required**, must be an origin only, and must be https for every real host (loopback http allowed). `MINISTRY_PLATFORM_BASE_URL` must be https (loopback http outside production only) | Deploys with a trailing path, http staging hosts, or an unset URL | `.env*`, host env settings |
| `MP_SECURITY_ROLES` unset or blank now means **nobody**, not "any role" | Deploys that relied on the old default | host env settings |
| `import "server-only"` in `auth.ts`, the MP client and every service | Any `"use client"` file that imports them, even transitively | `next build` tells you |
| `mp:generate*` scripts need `tsx --conditions=react-server` | Plain `tsx` generator runs | `package.json` |
| Cookie-cache strategy `jwt` → `jwe` | Every existing `session_data` cookie is invalidated **once** on deploy. Users with no in-memory row behind them sign in again | none (tell the user) |
| Contact-log `Made_By` is **no longer re-stamped on update** | Reports that treated `Made_By` as "last editor" | `grep -rn "Made_By" src/` |

---

## Phase 1: Discovery and triage

Answer these by reading the repo. Track the answers, and only proceed once each has an answer or has been raised with the user.

1. **Has the 2026-09-12/25 playbook been ported?** Run its triage block (the start of `port-downstream-hardening.md` Phase 1). Any `✗` there means stop and port that playbook first.
2. **better-auth version** (`npm ls better-auth`). Upstream is 1.7.4, and several items below cite 1.7.4 internals (`refreshCache` defaulting on in stateless mode, `requireIdTokenVerification`, `DEFAULT_SECRET`). On a different minor, re-verify each cited behaviour in `node_modules/better-auth/dist/` before you port it. Don't carry the claim over unchecked.
3. **Stateless or database-backed sessions?** Upstream has no database: an encrypted cookie cache backed by better-auth's per-process memory adapter. With a real adapter, Phases 3 and 4 change shape (revocation becomes possible, and the shared-instance fix matters less). **Ask the user** before porting those phases onto a database-backed fork.
4. **Host.** Vercel, Azure, Cloudflare in front, a bare VM? It decides the rate-limit IP header in Phase 6, and whether the per-process caveats in Phase 4 apply.
5. **Run the triage script.** Every `✗` is work. A `✓` means the grep passed; still read the phase for what a grep cannot see.

```bash
# Phase 2: boot guards
grep -q "assertAuthEnvironment" src/lib/auth.ts && echo "✓ secret guard" || echo "✗ P2 secret guard"
test -f src/lib/env.ts && grep -q "getAuthBaseUrl" src/lib/env.ts && echo "✓ env URL validation" || echo "✗ P2 env.ts"
grep -qx '\.env\*' .gitignore && echo "✓ .env* ignored" || echo "✗ P2 .gitignore"
git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' && echo "✗ P2 env file TRACKED" || echo "✓ no tracked env files"
git ls-files --error-unmatch .claude/settings.local.json 2>/dev/null && echo "✗ P2 settings.local.json tracked" || echo "✓ settings.local.json untracked"

# Phase 3: session lifetime and cookie contents
grep -q "disableSessionRefresh: true" src/lib/auth.ts && echo "✓ no sliding refresh" || echo "✗ P3 disableSessionRefresh"
grep -q "refreshCache: false" src/lib/auth.ts && echo "✓ refreshCache off" || echo "✗ P3 refreshCache (defaults ON when stateless)"
grep -q 'strategy: "jwe"' src/lib/auth.ts && echo "✓ JWE cookie cache" || echo "✗ P3 cookie cache readable"
grep -q "storeAccountCookie: false" src/lib/auth.ts && echo "✓ no account cookie" || echo "✗ P3 user OAuth tokens in a cookie"
grep -q "WITHHELD_SESSION_FIELDS\|ipAddress.*userAgent" src/lib/auth.ts && echo "✓ session fields withheld" || echo "✗ P3 token/ip/UA in /get-session"

# Phase 4: one instance, discovery rebuild, logout hint
grep -q "globalThis" src/lib/auth.ts && echo "✓ shared instance" || echo "✗ P4 one auth per bundle layer"
grep -q "selfHealingAuth\|discovery.rebuild" src/lib/auth.ts && echo "✓ discovery rebuild" || echo "✗ P4 discovery failure lasts until restart"
grep -rq "id_token_hint" src/components/ && echo "✓ id_token_hint on logout" || echo "✗ P4 logout hint"

# Phase 5: OIDC
grep -q "requireIdTokenVerification: true" src/lib/auth.ts && echo "✓ id_token verification required" || echo "✗ P5 requireIdTokenVerification"
grep -q "azp" src/lib/auth.ts && echo "✓ exp/azp checks" || echo "✗ P5 exp/azp"
grep -q '"offline_access"' src/lib/auth.ts && echo "✗ P5 offline_access requested" || echo "✓ no offline_access"

# Phase 6: /sign-in/social boundary
grep -q "MAX_SIGN_IN_SOCIAL_BODY_BYTES" "src/app/api/auth/[...all]/route.ts" && echo "✓ body cap" || echo "✗ P6 body cap"
grep -q "no-store" "src/app/api/auth/[...all]/route.ts" && echo "✓ no-store" || echo "✗ P6 no-store"
grep -q "AUTH_IP_ADDRESS_HEADERS" src/lib/auth.ts && echo "✓ rate-limit IP config" || echo "✗ P6 rate-limit IP"

# Phase 7: fail-closed roles
grep -q "roles_not_configured" src/services/authorizationService.ts && echo "✓ fails closed" || echo "✗ P7 unset roles = anyone"

# Phase 8: MP HTTP client
grep -q "AbortSignal.timeout" src/lib/providers/ministry-platform/utils/http-client.ts && echo "✓ timeouts" || echo "✗ P8 timeouts"
grep -q "redirect: 'error'\|redirect: \"error\"" src/lib/providers/ministry-platform/utils/http-client.ts && echo "✓ no redirects" || echo "✗ P8 redirects followed"
grep -q "inflight" src/lib/providers/ministry-platform/client.ts && echo "✓ single-flight token" || echo "✗ P8 token stampede"
grep -q "assertSafeEndpoint" src/lib/providers/ministry-platform/utils/http-client.ts && echo "✓ path guard" || echo "✗ P8 path guard"

# Phase 9: provider services
test -f src/lib/providers/ministry-platform/services/guards.ts && echo "✓ identifier guards" || echo "✗ P9 guards"
grep -rq "allowedProcedures" src/lib/providers/ministry-platform/ && echo "✓ procedure allowlist" || echo "✗ P9 any procedure callable"
grep -rn "ignorePermissions" src/lib/providers/ministry-platform/ --include="*.ts" | grep -v "\.test\." | grep -vE ":[0-9]+:[[:space:]]*(\*|//)" \
  && echo "  ↑ ✗ P9 \$ignorePermissions still in code" || echo "✓ no \$ignorePermissions in code"

# Phase 10: app services
grep -rn "\.omit(" src/services/ && echo "  ↑ each .omit() on a write path is a blocklist — see P10"
grep -q '\\\[' src/lib/providers/ministry-platform/utils/filter-sanitize.ts && echo "✓ LIKE [ escaped" || echo "✗ P10 LIKE ["

# Phase 11: HTTP boundary
grep -q "pathname.startsWith('/api')" src/proxy.ts && echo "✗ P11 /api prefix match" || echo "✓ /api exact"
grep -q "poweredByHeader: false" next.config.ts && echo "✓ no X-Powered-By" || echo "✗ P11 X-Powered-By"
grep -q "serverFunctions: false" next.config.ts && echo "✓ dev action-arg logging off" || echo "✗ P11 next dev logs action args"
grep -q "Cross-Origin-Opener-Policy" src/lib/security-headers.ts && echo "✓ COOP/CORP" || echo "✗ P11 COOP/CORP"
grep -q "base-uri 'none'" src/lib/security-headers.ts && echo "✓ base-uri none" || echo "✗ P11 base-uri"

# Phase 12: auth UI
test -f src/app/signed-out/page.tsx && echo "✓ /signed-out" || echo "✗ P12 /signed-out"
grep -rqF "a-z0-9_]{1,64}" src/app/auth-error/ && echo "✓ auth-error code allowlist" || echo "✗ P12 auth-error echoes free text"

# Phase 14: server-only
grep -q '"server-only"' src/lib/auth.ts && echo "✓ server-only" || echo "✗ P14 server-only"

# Phase 15: CI
grep -q "permissions:" .github/workflows/*.yml && echo "✓ permissions declared" || echo "✗ P15 permissions"
grep -E "uses: [^@]+@v[0-9]" .github/workflows/*.yml && echo "  ↑ ✗ P15 actions pinned by tag, not SHA"
```

---

## Phase 2: Refuse to boot on a forgeable configuration

**Why.** better-auth falls back to a **public** default secret (`DEFAULT_SECRET` in `node_modules/better-auth/dist/utils/constants.mjs`) and only throws for it when `NODE_ENV === "production"`. A dev or demo box, which in the MP world usually talks to the production MP, boots silently with it. In stateless mode the signed cookie is the only authority, so a known secret lets anyone mint a session for any `userGuid`. Three other traps sit next to it:

- `isTest()` is `NODE_ENV === "test" || toBoolean(env.TEST)`. A truthy `TEST` on a production process skips secret validation, and, unless `advanced.disableOriginCheck` is pinned, the Origin and `callbackURL` checks too.
- `BETTER_AUTH_SECRETS` (versioned secrets) silently takes precedence over `secret`, so a guard that checks `BETTER_AUTH_SECRET` checks the wrong key.
- An unset `BETTER_AUTH_URL` makes better-auth derive its base URL from the request's `Host` header. That poisons `redirect_uri` and the trusted origins.

**Port.**

1. `assertAuthEnvironment(env)` in `src/lib/auth.ts`. It is pure (it takes the env as an argument) and is called at module load in every environment except Vitest (`if (!process.env.VITEST)`). It throws when the secret is missing, equals `BETTER_AUTH_DEFAULT_SECRET`, is shorter than 32 characters, when `BETTER_AUTH_SECRETS` is set, or when `NODE_ENV=production` with a truthy `TEST`. **The error must never contain the secret.** Pin `advanced: { disableOriginCheck: false }` explicitly.
2. `src/lib/env.ts` with `getMpBaseUrl()` and `getAuthBaseUrl()`. Both throw without echoing the value, since a URL can carry `user:pass@`. Both refuse credentials, a query or a fragment (check the raw string for `?`/`#` too, because `new URL("https://x?")` gives an empty `search`). MP URL: https, with loopback http **outside production only**; path allowed; trailing slash stripped. Auth URL: required (with `NEXTAUTH_URL` as fallback), **origin only**, https for real hosts, loopback http allowed **even in production** so that `next build` and `next start` work locally and in CI. Replace every `process.env.MINISTRY_PLATFORM_BASE_URL!` and every `?? "http://localhost:3000"` fallback with these readers (auth, MP client, client-credentials, sign-out action).
3. Pin `test-setup.ts` values that pass the validators, so the suite still loads `auth.ts`.
4. **Secrets hygiene in git.** Put `.env*` with `!.env.example`, plus `.vercel`, `.claude/settings.local.json`, `.claude/worktrees/` and `.playwright-mcp/`, in `.gitignore`. Playwright MCP snapshots capture real member data. Add a pre-commit hook that refuses staged env files (see upstream `.githooks/pre-commit`: NUL-separated `git diff --cached --name-only -z` so a quoted non-ASCII path can't slip past, and deletions allowed). If `.claude/settings.local.json` is tracked, `git rm --cached` it and move the shared entries into `.claude/settings.json`. Upstream's contained a `sed:*` allow rule, which is effectively arbitrary file write.
5. `SECURITY.md`: point at GitHub private vulnerability reporting, not a placeholder email. **Ask the user** to enable private vulnerability reporting, secret scanning, push protection and Dependabot security updates in the repo settings. You cannot do that from here.

**Tests.** Upstream `src/auth.secret-guard.test.ts` clears `VITEST` to prove the module-level call really runs. It also reads better-auth's `constants.mjs` to catch a change to the default secret. `src/lib/env.test.ts` covers each rule, and asserts that no thrown message contains the input.

---

## Phase 3: Bound session lifetime and empty the cookies

**Why.** The earlier advisory said a forged session lasted "up to an hour". **That was wrong.** With no database, better-auth 1.7.4 defu-merges `session.cookieCache.refreshCache: true` *under* your config (`context/create-context.mjs`). A `session_data` cookie then re-signs itself from the cookie alone on `/get-session` until `expiresAt`: **up to 7 days** on defaults, and longer on a long-running host where the memory row kept sliding `expiresAt` forward. If this fork was exposed to F-UPDATE-USER, **rotating `BETTER_AUTH_SECRET` is mandatory**, not optional. Tell the user explicitly.

With `strategy: "jwt"`, the cookie payload was readable by anything that sees `Cookie` headers (proxy and APM logs, HAR files, extensions). It held name, real MP email, `userGuid`, IP, user agent and the raw session token. And because better-auth defaults `storeAccountCookie` to `true` without a database, the **user's MP access, refresh and id tokens** sat in an `account_data` cookie, and in plaintext in the memory adapter until restart.

**Port** (`src/lib/auth.ts` options):

```ts
session: {
  expiresIn: 12 * 60 * 60,          // hard ceiling: expiresAt = sign-in + 12h
  disableSessionRefresh: true,      // expiresAt never slides
  cookieCache: {
    enabled: true,
    maxAge: 60 * 60,                // an unbacked cookie dies within 1h
    strategy: "jwe",                // encrypted, not just signed
    refreshCache: false,            // MUST be explicit; stateless mode defaults it to true
  },
},
account: {
  storeStateStrategy: "cookie",
  storeAccountCookie: false,        // user's MP tokens never reach the browser
  accountLinking: { enabled: false },
},
databaseHooks: {                    // ...or the memory adapter
  account: {
    create: { before: async (a) => ({ data: stripUserOAuthTokens(a) }) },
    update: { before: async (a) => ({ data: stripUserOAuthTokens(a) }) },
  },
},
```

`stripUserOAuthTokens` nulls `accessToken`, `refreshToken` and both expiries. **Keep the `idToken`**: it is not an API bearer, and Phase 4's logout hint needs it. Drop `offline_access` from the scopes (Phase 5).

In `enrichSessionUser` (the `customSession` callback), return the user plus `userId`, **without** `firstName`/`lastName`. Nothing read them, and a missing name part rendered as `"undefined"`. Strip `token`, `ipAddress` and `userAgent` from the returned session (`WITHHELD_SESSION_FIELDS`).

**`resolveMpUserId` negative cache.** `customSession` runs on *every* `/get-session`, including focus refetches, so an uncached failure costs one MP query and one log line per request per tab. Cache a thrown lookup as `null` for 30 s and a "no such login" answer for 5 min, with the positive entry at 15 min. Log `{ event: "auth.session.user_id_unresolved", errName }` and **never the GUID or `err.message`**: an MP client error can carry the request URL, whose `$filter` contains the GUID. Session creation must never block on this lookup.

**Emergency "sign everyone out"**: bump `cookieCache.version` and redeploy, or rotate the secret. Document both in this repo's auth reference.

**Tests.** Upstream `src/auth.session-lifetime.test.ts` walks the clock through the real `auth` instance. It pins the 12 h ceiling, the 1 h unbacked-cookie death, and that sign-out kills a copied cookie on the same process. `src/auth.session-config.test.ts` pins each option so that a mutation turns it red. `src/auth.user-oauth-tokens.test.ts` asserts that no cookie or stored row carries the access or refresh token.

---

## Phase 4: One `auth` instance per process, self-healing discovery, logout hint

**Why: the instance.** Next loads `src/lib/auth.ts` once **per bundle layer**. Upstream measured 4 copies under `next dev` and 2 in a production build. Each copy built its own `betterAuth()` with its own memory adapter. The OAuth callback wrote the session and account rows in the route-handler copy, while the sign-out server action ran in another copy where those rows did not exist. Two consequences followed:
- Sign-out never deleted the row `/get-session` reads, so a copied cookie pair outlived sign-out up to the 12 h cap.
- better-auth found no id_token, so the MP logout URL had no `id_token_hint`, and MP stopped at a "log out?" prompt. On a shared PC whose tab is then closed, the **MP SSO session stays alive**.

**Why: discovery.** genericOAuth fetches MP's discovery document **once**, with no retry. In 1.7.4 a failed fetch skips the provider, so `/sign-in/social` returns `404 PROVIDER_NOT_FOUND` **until the process restarts**. That fails closed, but it is an outage caused by one cold-start blip.

**Port.**

```ts
export const SHARED_AUTH_KEY = Symbol.for("mpnext.auth");
export function sharedInstance<T>(key: symbol, create: () => T, env = process.env): T {
  if (env.VITEST) return create();                      // tests rebuild per env
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  return (store[key] ??= create());
}
export const auth = sharedInstance(SHARED_AUTH_KEY, () => selfHealingAuth(createAuth));
```

`selfHealingAuth(create)` returns a `Proxy` whose `handler` checks, **only for `/api/auth/sign-in/social` and `/api/auth/callback/*`**, whether the current instance has the MP provider (`(await instance.$context).socialProviders`). If it doesn't, the proxy rebuilds: single-flight, at most one build per 30 s counting the first, and a request waits at most 10 s. It swaps the new instance in **only if it has the provider**, and logs `auth.discovery.rebuild` with `outcome` and never the URL. An instance that has the provider is never rebuilt, so live sessions are never thrown away. Every other property reads through to the current instance at access time, so **never cache `auth.api` in a module-level variable**.

**Sign-out** (`src/components/user-menu/actions.ts`): call `auth.api.signOut({ headers, body: { disableRedirect: true } })` first, so the app session is cleared even if the env below is broken. Take the `id_token_hint` out of the returned `url`, trusting it **only if its origin is the MP origin**. Rebuild the end-session URL yourself, with `post_logout_redirect_uri` set to exactly the registered value (`getAuthBaseUrl()`), `client_id` always, and `id_token_hint` when available. No localhost fallback.

**Caveat to tell the user.** This is per *process*. On serverless, a sign-out that lands on another instance has no id_token, so MP prompts once. That is documented upstream as accepted.

**Tests.** `src/auth.shared-instance.test.ts` signs in through one module copy and signs out through another, with a negative control. It fails when the cache is removed. `src/auth.discovery-rebuild.test.ts` covers cooldown, single-flight, wait cap, swap-only-on-success and that non-sign-in paths never rebuild.

---

## Phase 5: OIDC core hardening

**Port** in the genericOAuth provider config and `getUserInfo`:

1. **`requireIdTokenVerification: true`.** genericOAuth builds its id_token verifier only when discovery yields both `issuer` and `jwks_uri`. Without this option, a partial discovery document left the provider live with **verification silently off**. With it, that provider is skipped and an error is logged.
2. **`exp` and `azp` checks.** better-auth hands jose only `issuer` and `audience`, and jose checks `exp` only when it is present. In `getUserInfo`, decode the already-verified id_token (hand-rolled base64url decode, because `jose` is only a transitive dependency) and refuse when `exp` is missing, not finite or in the past, or when `aud` is an array and `azp !== OIDC_CLIENT_ID`. Log `auth.userinfo.id_token_claims_invalid` with `reason` only.
3. **The userinfo fetch never throws.** Use `AbortSignal.timeout(10_000)` and `redirect: "error"`, because a followed redirect would re-send the user's bearer. A non-2xx status, a network error, invalid JSON or a non-object body each **return `null`** and log `auth.userinfo.fetch_failed` with a status or `errName`. Returning `null` is better-auth's contract for "unusable". A throw from `getUserInfo` is **not** equivalent: the callback route doesn't wrap it, so it surfaces as an unhandled error.
4. **Display name.** Build `name` only from `given_name`/`family_name`/`name` claims that are actually strings (`profileDisplayName`). Never interpolate a missing claim.
5. **Scopes.** Use `openid` plus the MP data scope, with **no `offline_access`**. The app never refreshes the user's token. (Upstream decided against narrowing further, because forks need the broad scope.)
6. Keep `pkce: false` and `disableIdTokenNonceBinding: true`. MP supports neither PKCE nor the nonce. F8 is an accepted risk; see `port-downstream-hardening.md` Phase 11.

**Tests.** Upstream `src/test-utils/mock-oidc.ts` is a mock OIDC provider (discovery, JWKS, token, userinfo) that drives the **real** code flow end to end. `src/auth.code-flow.test.ts`, `src/auth.oidc-hardening.test.ts` and `src/auth.origin-check.test.ts` run on it. Mutants (origin check off, `trustedOrigins: ["*"]`, strategy, `expiresIn`, `refreshCache`, sub binding, nonce, PKCE, account cookie) each turn a test red. Port the harness first. It makes every other auth phase testable.

---

## Phase 6: The `/sign-in/social` boundary, auth-route caching, rate-limit IP

**Why: size.** One anonymous request with a multi-megabyte *relative* `callbackURL` passes `isSafeRelativeURL`, is copied into the OAuth state, and comes back as a `Set-Cookie` about twice its size. The route filter runs **before** better-auth's rate limiter, so nothing stopped it.

**Why: Content-Type.** better-call picks its JSON parser only when the untrimmed header matches `/^application\/([a-z0-9.+-]*\+)?json/i`. Anything else falls through to substring matches for form, multipart and text. A filter that `trim()`s the header accepts ` application/json`, because JS `trim()` strips NBSP and HTTP does not. better-call then parses the body a different way, and the filter inspected the wrong keys.

**Why: IP.** By default better-auth trusts only a single valid IP in `x-forwarded-for`. No header, an appended chain, or Azure's `ip:port` all put **every client into one shared bucket**, so about one request every 3 s blocks sign-in for everyone.

**Port** (extending the `isAllowedSignInSocialBody` filter from the earlier playbook's F12 phase):

- Test the **raw** header against `/^application\/json[\t ]*(;|$)/i`, and refuse any `,`.
- Refuse a declared `Content-Length` over 4096 before cloning. Then read the `clone()` with a hard 4096-byte streaming cap, because chunked bodies carry no length. **Do not `await reader.cancel()`** on the tee branch: its promise settles only when both branches cancel, so the request hangs. `releaseLock()` instead.
- Decode with `new TextDecoder()` (which strips the BOM and replaces bad sequences, the same as `request.json()`), then `JSON.parse`.
- Accept `callbackURL` only as a string of ≤ 2048 characters.
- Every failure returns the same 404 as a non-allowlisted path.
- `withNoStore(response)` on **every** return path of the auth route, 404s included. A response with immutable headers is copied first.
- `parseIpAddressOptions(env)` maps `AUTH_IP_ADDRESS_HEADERS` (comma-separated header names, lower-cased, `[a-z0-9-]` only) and `AUTH_TRUSTED_PROXIES` (IPs or CIDRs, validated with `node:net` `isIP` and prefix bounds) to `advanced.ipAddress`. **Invalid entries refuse startup.** better-auth itself only warns, and falls back to the shared bucket. Document per-host guidance in `.env.example`: `cf-connecting-ip` behind Cloudflare, and so on. Name only a header your edge always *overwrites*.

**Tests.** Oversized declared length, oversized chunked body, NBSP Content-Type, a comma, BOM, duplicate keys and a 2049-character `callbackURL` all return 404. A normal body passes. `src/auth.rate-limit.test.ts` and `src/auth.ip-address.test.ts` cover the rate limiter and the IP parsing.

---

## Phase 7: The role gate fails closed

**Why.** Before this review, an unset or blank `MP_SECURITY_ROLES` meant "any MP security role will do". Any MP user with any role could read every contact and every pastoral note. A value like `","` also parsed to "no names", and so to "any role".

**Port** (`src/services/authorizationService.ts`):

- `resolveRolePolicy()` returns one of `{ kind: "any" }` (the value is exactly `*`), `{ kind: "list", names }`, or `{ kind: "unconfigured" }`. `*` is a wildcard **only as the whole value**. Inside a list it is just a non-matching name, so `"Administrators,*"` does not widen the gate.
- Read `MP_SECURITY_ROLES` first, then the deprecated `MP_WRITE_SECURITY_ROLES`. A non-blank value that names no roles is a config error: warn once (`mp.authz.config`) and treat it as unset, **never** as "any".
- If the policy is unconfigured, deny with the new reason `roles_not_configured`. Check it *after* resolving the acting user, so that `mp.write.non_user` still fires, and *before* the role read, which would be wasted.
- Make the raw `dp_User_Roles` read `private` and have it sanitize its own ID (`sanitizeNumericId`), so the interpolation is safe on its own. Move the `cache()` memo to a private static. Note in a comment that `cache()` does **not** dedupe inside a server action (no React render), so an action plus a gated service method costs two role reads. The extra read costs MP time but never gives a wrong answer.
- **Deploy note for the user:** set `MP_SECURITY_ROLES` (or `*`) on every environment **before** deploying, or every user is refused.

**Known limitation (deferred upstream):** roles are matched by **name**, trimmed and case-insensitive. Anyone who can create, rename or assign MP Security Roles can satisfy the gate. Tell the user to restrict who can edit Security Roles in MP.

---

## Phase 8: The MP service-account HTTP client

The service account holds `dataplatform/scopes/all`. Everything this client sends is sent with an admin-level bearer.

**Port** (`utils/http-client.ts`, `client.ts`, `auth/client-credentials.ts`):

1. **Timeouts on every fetch**: 10 s for the token, 20 s for JSON API calls, 60 s for multipart uploads, and a fresh `AbortSignal.timeout()` per attempt. Without them a stalled MP holds requests until undici's 300 s default, and because `resolveMpUserId` runs inside every `getSession`, every page stalls with it.
2. **`redirect: "error"`** on every MP fetch, the token request included. A 307/308 re-sends the body, which means member data or the `client_secret`, to wherever it points.
3. **Path guard in `buildUrl`.** Refuse any endpoint that doesn't start with `/` or matches `/\.\.|[?#\\]|%2e|%2f|%5c|[\u0000-\u001f\u007f]/i`, then confirm the resolved URL still starts with the API root. The guard has to live here because `encodeURIComponent("..") === ".."`, and the URL parser silently strips tabs and newlines, so `.\t.` becomes `..`.
4. **Query keys.** `encodeURIComponent` them, but restore `$` and `@`, which MP expects literally.
5. **Safe JSON reads** (`readJsonResponse`). Treat 204 or `Content-Length: 0` as `undefined`. Require a JSON content-type. **Never let a `SyntaxError` escape**, because V8's message quotes a fragment of the body.
6. **Token response validation.** A 200 without a non-empty string `access_token` and a `token_type` of `bearer` throws. Otherwise it gets cached and sent as `Bearer undefined`. Clamp `expires_in` to [min, 3600 s], because an absurd value produced an Invalid Date that compared as never expired.
7. **Single-flight refresh.** Concurrent callers share one `inflight` promise. After a failed refresh, fail fast for 5–30 s (jittered) instead of stampeding a token endpoint that is already down.
8. **401 → refresh → retry once.** The `onUnauthorized(rejectedToken)` hook invalidates only if the token is still the current one, so a burst of 401s for one stale token triggers a single refresh.
9. **Logging.** Log the method, the **redacted** endpoint (GUIDs replaced with `{uniqueId}`, because MP serves `/files/{uniqueId}` unauthenticated, so the ID is a download capability), and the status or `errorName(error)`. Never the URL (it carries the `$filter`), the body or `err.message`.

**Tests.** Upstream `http-client.test.ts` and `client.test.ts` cover every refused path shape, a redirect, a timeout, 401-retry-once, the single-flight under concurrency, the negative cache, and that no log call contains a GUID, filter or body.

---

## Phase 9: Provider services, codegen, stored procedures, communications

**Port** (`src/lib/providers/ministry-platform/services/`):

1. **`guards.ts`**: `sanitizeIdentifier(value, field)` accepts `^[A-Za-z_][A-Za-z0-9_]*$`, ≤ 128 characters, and rejects anything else with a message that **never includes the value**. `errorName(error)` returns a class-name-shaped `name` or `typeof`.
2. **Every path segment** in the Table, File and Procedure services is validated and then `encodeURIComponent`ed: table names with `sanitizeIdentifier`, record and file IDs with `sanitizeNumericId`, file unique IDs with `sanitizeGuid`. `deleteTableRecords` refuses a non-array `ids` and sanitizes each one. The unauthenticated `/files/{uniqueId}` content fetch gets its own timeout and `redirect: "error"`, and its error message says `{uniqueId}`.
3. **Stored procedures are deny-all.** `ALLOWED_PROCEDURES = []` is built in. `new MPHelper({ allowedProcedures: ['api_MyChurch_Get_Stats'] })` enables names **per instance**, and each name is validated at construction. The service that calls a procedure builds its own helper with a fixed module-level list, so the name is reviewed next to its caller. **Never build that list from request input.** Before you merge, list every procedure this fork calls and ask the user to confirm each one.
4. **Trusted sender.** `createCommunication(content, sender: { authorUserId, fromContactId }, attachments?)` and `sendMessage(content, sender: { fromAddress }, attachments?)`. Author and From fields on the content object are ignored. The caller must be a service method that has already run `requireSecurityRole`, and it builds `sender` from the `User_ID` the gate returned plus a server-side lookup. **Never from form fields, action arguments or query strings.** The service account can send as anyone, so this is the only thing stopping a caller from impersonating the senior pastor. Also refuse CR/LF (C0 controls) in subjects and display names, which would be header injection.
5. **Remove `$ignorePermissions`** from the helper, provider and types. Requests already run as the admin-level service account, so the flag could only widen what they see. Where a caller-shaped params object is forwarded (upstream: `DomainService.getGlobalFilters`), forward an explicit allowlist (only `$userId`), so a smuggled `$ignorePermissions` is dropped even when an untyped caller sets it.
6. **Codegen escaping** (`src/lib/providers/ministry-platform/scripts/generate-types.ts`). Emit MP metadata (table and column names, descriptions) through `JSON.stringify` so that `"`, `\` and control characters come out as a valid TS string literal. Hostile or odd metadata must not be able to inject code into generated models.
7. **Log `errorName(error)` only** everywhere in these services.

**Tests.** Path traversal attempts (`../procs/x`, `%2e%2e`, `a/b`, arrays, objects) throw before any fetch. A non-allowlisted procedure throws. A sender missing or on the content object is refused or ignored. Upstream's `helper.wiring.test.ts` checks that `MPHelper` actually forwards `allowedProcedures` and `sender` to the provider.

---

## Phase 10: App services: allowlists, authorship, input validation

**Why.** The 2026-09-12 F4 fix used `ContactLogSchema.omit({ Made_By, Contact_ID, ... })`. A blocklist admits every field it doesn't name. Here that meant `Planned_Contact_ID`, `Original_Contact_Log_Entry` and `Feedback_Entry_ID`, which let a caller point a log at any other record. `updateContact` spread `...fields` straight into the PUT, which is mass assignment. And re-stamping `Made_By` on every update meant any role-holder's trivial edit erased who wrote a pastoral note.

**Port.**

1. **`pick`, not `omit`, on every write path.** Upstream uses `ContactLogSchema.pick({ Contact_ID, Contact_Log_Type_ID, Notes }).partial({ Contact_Log_Type_ID: true })` for create and `.pick({ Contact_Log_Type_ID, Notes }).partial()` for update. `Contact_Date` goes through `DomainTimezoneService`. `ContactsSchema.pick({ Email_Address, Mobile_Phone }).partial()` handles `updateContact`. Make the TypeScript input types `Pick<>`s of the same fields. Put the server-authoritative fields **last** in the record literal (`{ ...allowed, Contact_ID: id }`).
2. **`Made_By` = original author.** Stamp it on create, from the gate's return value. On update, **send neither `Made_By` nor `Contact_ID`**, so MP preserves both. Who edited the row is still recorded in `dp_Audit_Log` through `$userId`. This is a behaviour change, so tell the user.
3. **Validate foreign keys you accept.** A non-null `Contact_Log_Type_ID` must be a row of `Contact_Log_Types` (upstream `assertKnownContactLogType`, run after the write gate).
4. **Validate IDs in the service too**, not only in the action. The service must not rely on its callers (`sanitizeNumericId` before any PUT body).
5. **Cap reads.** No unbounded `$top`: upstream uses `CONTACT_LOGS_PER_CONTACT_LIMIT = 500`, and search terms are capped at 100 characters (`CONTACT_SEARCH_MAX_LENGTH`, enforced in the service).
6. **Sanitizers** (`filter-sanitize.ts`). All string sanitizers refuse non-strings (a one-element array otherwise stringifies to a passing value) and ASCII control characters. `sanitizeLikeValue` also escapes `[`, which opens a T-SQL character class. `sanitizeFilterValue` refuses non-ASCII single-quote look-alikes (`‘’‛ʼ＇`), while `sanitizeLikeValue` maps them to `_`, so `O’Brien` still matches `O'Brien`. `sanitizeGuid` refuses non-strings.
7. **`getUserProfile` is self-only.** It reads the session, and throws `UnauthorizedError` unless the requested GUID equals `session.user.userGuid` (case-insensitive). It returns contact name, email and image only: no phone, roles or groups. `getCurrentUserProfile` maps that to the six-field `CurrentUserProfile` DTO, which is serialised into the page, so it must carry only what the client renders.
8. **No caller input in logs or errors.** Log action failures as **one** `JSON.stringify`'d line (`{ event, action, error: { name, message } }`). Escaping stops caller text from forging a separate structured line such as a fake `mp.write.unauthorized`. Error messages must not echo input.
9. **Delete unused exported server actions.** Every export of a `"use server"` file is a callable POST endpoint whether or not anything imports it. Upstream removed `getContactLogsByContactId` and `getContactLogById`. Grep this fork's `actions.ts` files for exports with no importer.
10. **Return only rendered fields to the browser** from read actions. Map to a DTO; don't pass the MP row through.

**Tests.** Adversarial payloads carrying `Made_By`, `Contact_ID`, `Feedback_Entry_ID` and similar are dropped (assert the exact PUT body). An update does not send `Made_By`. An unknown log type is refused. A 101-character search is refused. `getUserProfile` for another GUID throws. Verify each test **fails when the fix is reverted**.

---

## Phase 11: HTTP boundary, proxy and headers

**Port.**

1. **`src/proxy.ts`.** Match the public paths exactly: `pathname === '/api' || pathname.startsWith('/api/')`. A bare `startsWith('/api')` also made a future `/apidocs` public. Add `/signed-out` (Phase 12) next to `/signin` and `/auth-error`.
2. **Anchored matcher**: `'/((?!_next/static/|_next/image(?:$|/)|favicon\\.ico$|assets/).*)'`. The unescaped prefix form also skipped `/faviconXico`, `/favicon.ico/x`, `/_next/imagefoo` and `/_next/staticX`, which then got no cookie redirect and no CSP. Upstream pins this behaviourally in `proxy.test.ts` through Next's own `getMiddlewareMatchers`.
3. **`next.config.ts`**: `poweredByHeader: false`, `images: { unoptimized: true }` (turns the `/_next/image` optimizer endpoint off; only do this if every `next/image` already passes `unoptimized`, so check first), and `logging: { serverFunctions: false }`. The last matters because `next dev` otherwise prints **every server action's arguments** (pastoral notes, search terms) to the terminal, and dev servers usually point at the shared production MP. `no-console` cannot catch it, because it's outside `src/`.
4. **Static headers**: add `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin`. That's safe because sign-in and sign-out are full-page redirects, not popups. Check this fork has no popups or cross-origin embeds first.
5. **CSP**: `base-uri 'none'` (nothing renders a `<base>`). `originOf()` must return `null` for any non-http(s) scheme or any hostname outside `^[a-z0-9.-]+$`. Otherwise an env value like `https://*` (or `https://%2A`) allows every host, and `https://a;sandbox` injects a directive.
6. **Leave these as they are** (decided upstream; see `security-headers.md`): `style-src 'unsafe-inline'` **without** a nonce, and no CSP reporting endpoint. HSTS is gated on a production *build*, so a local `next start` over https will pin that host. Warn the user.

---

## Phase 12: Auth UI: error pages, sign-in loop cap, sign-out that sticks

**Port.**

1. **`/auth-error` content spoofing.** Echo `?error=` only when it matches `/^[a-z0-9_]{1,64}$/`, and look up known messages with `Object.hasOwn`, so that `?error=constructor` doesn't resolve a prototype member. Never render `error_description`. Otherwise a link can put arbitrary prose on the app's own origin.
2. **`/signin` surfaces failures and caps its own restarts.** Map a failed `signIn.social` or `getSession` to explicit states: `rate_limited` (429), `provider_unavailable` (404 or `PROVIDER_NOT_FOUND`), `session_check_failed`, and so on. Nothing is swallowed. Count *automatic* navigations in `sessionStorage` (`sign-in-attempts.ts`: at most 2 per 2 min, every storage access in try/catch, uncapped if storage is unusable) and show an error instead of looping forever when a session never sticks (mismatched secrets across instances, a dropped oversized cookie). `SessionGuard` clears the counter once it sees a working session.
3. **Sign-out is always reachable.** A failed MP profile load must resolve to `null`, not reject. The header, which holds the shell's only sign-out control, sits **above** `(web)/error.tsx`, so a rejection used to replace the whole shell and leave the user unable to sign out. The no-profile header still renders the user menu with sign-out.
4. **`/signed-out`.** This is a public, `force-dynamic` page that reads no session, redirects nowhere and **never starts OAuth**. Its only control is a link to `/signin`. Add it to the proxy's public paths.
5. **`SessionGuard`** (client, inside the protected shell). Watch `authClient.useSession()`. On a real transition from a session to none (not the initial null, and not a network error: better-auth keeps the previous session on those), stop rendering and `window.location.replace("/signed-out")`. Use `replace` so Back doesn't return to member data. **Not `/signin`**: that page auto-starts OAuth, and with the MP SSO session still alive the tab would silently sign straight back in, undoing a sign-out on a shared machine.
6. **Cross-tab sign-out** (`sign-out-broadcast.ts`). A server-action sign-out never triggers better-auth's own broadcast. After the action returns, post a data-free message on a `BroadcastChannel`. Receivers treat it only as a hint to `refetch()` the session, so a forged message costs one extra `/get-session`. Make it a no-op where `BroadcastChannel` is missing.
7. **`global-error.tsx` works without JavaScript.** `/_global-error` is prerendered, so it has no nonce and never hydrates under the enforced CSP, and an error boundary cannot opt out. Make the primary control a plain `<a href="/">`, and render the `retry()` button only after hydration (`useSyncExternalStore` with a server snapshot of `false`).
8. **Every page gates itself.** This was already in the earlier playbook's Phase 4, corrected on 2026-09-29. If the fork has any layout-only `hasSecurityRole()` → `redirect()`, port upstream's `contactlookup/[guid]/page.tsx` pattern now: `requireSecurityRole` before any data call, a refusal redirects to `/no-access`, and an MP failure still throws. Replace any layout test that could never fail with one that exercises the page's own gate with the layout out of the picture.

**Tests.** Upstream `session-guard.test.tsx`, `sign-out-broadcast.test.ts`, `sign-out-button.test.tsx`, `signin/page.test.tsx`, `sign-in-attempts.test.ts`, `signed-out/page.test.tsx` and `auth-error/page.test.tsx`.

---

## Phase 13: Two rendering bugs on `main` you will hit after Phase 12

Neither is a security finding. Both shipped in this release, and a fork that takes Phase 12 item 3 without them breaks every page, or shifts the layout on every load.

**13a. The streamed profile promise has no `.catch()` (PR #102, `4380b22`).** Upstream now starts the profile load **on the server**. `ServerProviders`, rendered *below* `AuthWrapper` so a signed-out request makes no MP call, passes the un-awaited `getCurrentUserProfile()` promise to the client `UserProvider`. A promise streamed from a Server Component arrives as React Flight's `ReactPromise`, **whose `then()` returns `undefined`**. So `profilePromise.catch(...)` returned `undefined`, `use(undefined)` threw, and **every signed-in page** fell to the root error boundary. Unit tests missed it because they passed native Promises.

Fix: settle it in an async helper that relies only on `then()` invoking its callbacks:

```ts
async function settleProfile(p: PromiseLike<CurrentUserProfile | null>) {
  try { return await p; } catch (e) { return profileLoadFailed(e); } // logs name only, returns null
}
const safeServerPromise = useMemo(() => settleProfile(profilePromise), [profilePromise]);
```

Add tests with a **Flight-shaped** promise (`then` returning `undefined`) for both the resolve and reject paths. They fail without the fix.

**13b. Header layout shift (PR #98, `f1ad0c8`).** The whole `Header` suspended on `useUser()`, and the Suspense fallback was an in-flow `h-16` div standing in for a `fixed` header, which gave a CLS of about 0.05 on every load. Fix: only the avatar suspends, behind its own boundary with a same-size placeholder, and the sidebar's gated entry behind another. Keep the layout-level boundary as a safety net, with a pixel-identical fixed `HeaderSkeleton`. Use `next/link` for the sidebar, because a plain `<a>` reloaded the document on every click. Rule for every `useUser()` caller: **the Suspense boundary is as tight as possible and its fallback is the same size.**

---

## Phase 14: `server-only` guards and the Next patch

1. `npm i server-only`, then `import "server-only";` as the **first line** of `src/lib/auth.ts`, the MP `client.ts`, `auth/client-credentials.ts`, `utils/http-client.ts`, and **every** module in `src/services/`. A `"use client"` import of any of them, even a transitive one, now fails `next build` instead of bundling service-account code into browser JS. Verify it by planting a throwaway client component that imports a service, running `next build`, confirming it fails, and deleting the component.
2. Vitest: alias `server-only` to `node_modules/server-only/empty.js` in `vitest.config.mts`, or every test that imports a guarded module throws.
3. Generators: `tsx --conditions=react-server …` in every `mp:generate*` script. They import `MPHelper`, and plain `tsx` hits the guard.
4. **Next ≥ 16.3.7** (GHSA-vcvr-r3jv-pc5j), with `eslint-config-next` to match. **Use this repo's lockfile rules.** Upstream's is `npm run deps:relock` followed by `npm run deps:verify`, because a Windows `npm install` produces a lockfile Linux CI cannot install. If this fork has no such tooling, ask the user how they regenerate the lockfile. Do not improvise with `npm install` on Windows.

---

## Phase 15: CI and setup

1. **Pin every action by full commit SHA**, with a version comment. Resolve each SHA from the tag via the GitHub API; don't copy SHAs from here. Add `permissions: contents: read` at workflow level, `persist-credentials: false` on checkout, and a `.github/dependabot.yml` for `github-actions` (weekly, grouped).
2. **Jobs**: `lint` (`npm run lint` + `npx tsc --noEmit`); `build` (`npm run build` with dummy env, then a prerender check); `test` (with coverage); and `lockfile` if the fork has one. In the dummy build env, point the MP URL at the reserved, non-resolving `https://mp.invalid`, so OIDC discovery during "Collecting page data" fails harmlessly and **never reaches a real MP**.
3. **Prerender check** (`scripts/check-prerender.mjs`). Read `.next/prerender-manifest.json` and fail if any route other than `/_not-found` and `/_global-error` was prerendered. A static page carries no CSP nonce and never hydrates under the enforced CSP. Every new page that doesn't read `headers()` needs `export const dynamic = "force-dynamic"`.
4. **Setup script** (if the fork kept `npm run setup`). Write `.env.local` values quoted, with `$` escaped as `\$`, so `@next/env`'s dotenv-expand returns them unchanged. Use a replacer *function* in line replacement, because `$'`, `` $` `` and `$&` in a value otherwise copy other parts of the file, secrets included. Write with mode `0600`. Enforce a hand-entered secret of ≥ 32 characters that isn't the public default, judged the way Next's `loadEnvConfig` will read it back. Use `npm ci`, never `npm install` or `npm update`. Recommend a **dedicated** MP OIDC client (Authorization Code only, exact redirect URIs) separate from the Client Credentials data client, and remove any "enable Implicit/Hybrid" guidance.
5. Run the `scripts/` tests in CI as a second Vitest project, outside the `src/` coverage denominator.

---

## Phase 16: Docs and `CLAUDE.md`

Carry the rules into this repo's docs, so they survive future contributors and agents:

- **`CLAUDE.md`**: the `server-only` rule for new modules that hold secrets or call MP; `MP_SECURITY_ROLES` fails closed; `BETTER_AUTH_URL` is required and https; the session user has no `firstName`/`lastName`; the `useUser()` Suspense rule; generators need `--conditions=react-server`.
- **`.env.example`**: `MP_SECURITY_ROLES` (with `*` explained), `AUTH_IP_ADDRESS_HEADERS`/`AUTH_TRUSTED_PROXIES` with per-host guidance, and the dedicated-OIDC-client guidance.
- **Auth reference**: session lifetime numbers, emergency sign-out, the per-process caveats, roles by name, F8, and better-auth's own logger logging callback `error`/`state`/`iss`/`callbackURL` verbatim (accepted upstream).
- **OAuth logout doc**: register `<origin>` as a post-logout redirect URI in MP. Optionally register `<origin>/signed-out` too, which needs an MP admin, and then point `post_logout_redirect_uri` at it.

---

## Phase 17: Verify

Unit tests are necessary but not sufficient. Several of these bugs only exist across Next's bundle layers or under the enforced CSP. Tick each box against a **production build** (`npm run build && npm run start`), not only `next dev`.

- [ ] The app refuses to start with: no secret; the public default; a 31-character secret; `BETTER_AUTH_SECRETS` set; `NODE_ENV=production TEST=1`; `BETTER_AUTH_URL` unset, with a path, or `http://` on a real host; `MINISTRY_PLATFORM_BASE_URL` on `http://` in production. No error message contains the value.
- [ ] Sign in, sign out: MP logs out **without a prompt** (the `id_token_hint` was sent) and returns to the app. The next sign-in asks for credentials.
- [ ] Sign in, copy both session cookies, sign out, replay them: refused (same process).
- [ ] Decode `session_data`: it is a JWE, not readable JSON. No `account_data` cookie exists.
- [ ] `/api/auth/get-session` response has no `token`, `ipAddress`, `userAgent`, `firstName` or `lastName`, and carries `Cache-Control: no-store`.
- [ ] `POST /sign-in/social` with a 5 KB body, a chunked 5 KB body, an NBSP Content-Type, or a 2049-character `callbackURL` → 404.
- [ ] `MP_SECURITY_ROLES` unset → a user with roles sees the shell but no contact data, and the log shows `roles_not_configured`.
- [ ] Sign out in tab A → tab B leaves the member-data page for `/signed-out` and **does not** sign back in.
- [ ] `/auth-error?error=<b>hi</b>` shows only the generic message.
- [ ] Response headers include COOP, CORP, and CSP with `base-uri 'none'`. No `X-Powered-By`. `/_next/image?url=…` → 404.
- [ ] `next dev`: a server action call prints no arguments to the terminal.
- [ ] Every signed-in page renders (13a), and the header does not shift on load or navigation (13b).
- [ ] Planted client import of a service → `next build` fails.
- [ ] CI: lint, `tsc`, build + prerender check, and tests are all green on the PR.

**Never make an MP write to verify any of this.** Every check above is read-only or local. If a check seems to need a write, stop and ask the user.

---

## Phase 18: Branch, commit, PR

Use this repo's conventions. **One commit per phase** (or per item within the bigger phases), each with the mechanism, what was ruled out, and which alternatives were rejected in the body. Upstream's history is shaped that way precisely so that each change can be reviewed and reverted on its own.

The PR description must call out:

- Every row of the **breaking changes** table that applied, and what you changed in fork-specific code for each one.
- The env vars that must be set **before** deploy (`MP_SECURITY_ROLES`, `BETTER_AUTH_URL`, and `AUTH_IP_ADDRESS_HEADERS` where needed), and that `session_data` cookies are invalidated once.
- Whether the fork was ever exposed to F-UPDATE-USER. If it was, **secret rotation is mandatory** (Phase 3).
- The stored procedures you allowlisted, and the user's confirmation of each.
- Items that did not apply, and the check that established it.

---

## What "done" looks like

- [ ] Boot guards for the secret, `TEST`, `BETTER_AUTH_SECRETS` and both URLs, each tested, with no value in any message.
- [ ] `.env*` ignored and blocked in pre-commit. No tracked env or personal settings files. `SECURITY.md` points at private reporting.
- [ ] 12 h / no-slide / 1 h / JWE / `refreshCache: false` / no account cookie / tokens stripped / session fields withheld / negative-cached `User_ID`.
- [ ] One `auth` per process, self-healing discovery, and logout with `client_id` + `id_token_hint`.
- [ ] `requireIdTokenVerification`, `exp`/`azp` checks, a userinfo fetch that never throws, no `offline_access`.
- [ ] `/sign-in/social` raw Content-Type check, 4 KB body cap, 2048-character `callbackURL` limit, `no-store` everywhere, validated rate-limit IP config.
- [ ] Role gate fails closed, with `*` as an explicit opt-in.
- [ ] MP client: timeouts, no redirects, path guard, validated single-flight token, 401 retry, name-only logs.
- [ ] Provider segment validation, deny-all procedures, trusted sender, no `$ignorePermissions`, escaped codegen.
- [ ] `pick` allowlists on every write, `Made_By` preserved on update, capped reads, hardened sanitizers, self-only profile DTO, unused actions removed.
- [ ] Proxy and header hardening; `/signed-out`, `SessionGuard`, cross-tab broadcast, `/auth-error` allowlist, sign-in loop cap, no-JS global error, every page self-gated.
- [ ] Flight-promise fix and tight Suspense boundaries.
- [ ] `server-only` everywhere it belongs, verified by a failing build; patched Next.
- [ ] Pinned CI with lint, `tsc`, build, prerender check and tests.
- [ ] Every Phase 17 box ticked against a production build.

## Known-open items upstream (not fixed anywhere yet)

Carry these forward as known risk; don't present them as closed.

- **F8 (accepted)**: no PKCE and no nonce from MP, so authorization-code injection is unmitigated. OAuth `state` is not one-time use in cookie mode.
- **Sign-out does not revoke a copied session everywhere (accepted 2026-09-29)**: up to 1 h after sign-out, or 12 h on an instance that never saw the sign-out. The 12 h cookie is persistent.
- **Deleting or disabling an MP login** doesn't end a live app session before the 12 h cap. **The role gate** ignores table and operation, and MP's own rights. Both are pending policy decisions: `docs/security/Additional_Security_Hardening.md` §2–§3.
- **Roles matched by name (deferred)**: restrict who can edit MP Security Roles.
- **No CSP reporting endpoint (decided).**
- `/_not-found` and `/_global-error` are prerendered and nonce-less (accepted; the prerender check fails CI on any other static route).
- An MP timeout during a role lookup fails after 20 s to the error boundary, with no retry or backoff.
- **F12 residue**: the `idToken` branch is refused, not removed. Re-check the hook and the route's key list on every better-auth upgrade.
- better-auth's own logger logs callback `error`/`state`/`iss`/`callbackURL` verbatim (accepted).

## Reading the upstream work

Each upstream commit message carries the full reasoning: the mechanism, what was ruled out, and what was tried and rejected. **Read the relevant one before adapting a phase to a diverged fork.** These SHAs refer to the MPNext repository:

```bash
git log --no-merges --reverse ea2e0ad..7342517      # everything in this release after F3b/F12

git show fd7fc4a 7725098   # P2/P3 12h sessions, secret guard, session-lifetime docs
git show 9e8ef87 6f1d6fc   # P2 .env* ignore + pre-commit, SECURITY.md; settings.local.json
git show 6616310 2227a80   # P2 env.ts URL validation; loopback http in production
git show a424953 f2af96d   # P3/P5 user OAuth tokens; OIDC provider, userinfo, JWE, session fields
git show 0e2652e 10ef3df   # P4 shared instance; logout client_id + id_token_hint
git show 5e1d2cc           # P4 discovery rebuild
git show 48a871b 96ab2f5   # P6 4 KB body cap; raw Content-Type check
git show 721d6e5 0f61f54   # P6 no-store; rate-limit IP
git show 2801d11 8370bcb   # P7 fail-closed roles; private self-sanitizing role read
git show 9b7b4d1 5aa0b5e   # P8 HttpClient; token single-flight + validation + 401 retry
git show 41bba94 56bd228   # P9 provider path segments + sender; codegen escaping
git show 3d9ae92           # P9 trusted sender + procedure allowlist through MPHelper
git show dc4a25b defd338 710dfa8   # P10 contact-log allowlists/author; log injection; DTO fields
git show a11c2a3 69fa5c5 0670531   # P10 LIKE + search cap; self-only profile; CurrentUserProfile
git show 9b61b82 9904f67 6e160a3   # P11 proxy matcher; next.config; headers + originOf
git show 6aa1633 595ecab f3cb739   # P12 auth-error; signin errors + cap; sign-out reachable
git show ace4566 02731d4 aa696f8   # P12 /signed-out; SessionGuard; global-error without JS
git show e775734           # P12 [guid] page self-gates
git show 4380b22 f1ad0c8   # P13 Flight promise; header layout shift
git show 56fffd9 606dc53   # P14 Next 16.3.7; server-only guards
git show fc224f3 3e9e96d 7aae2ae   # P15 CI pinning + lint; build + prerender; setup env writer
git show 6167cfd           # mock OIDC harness and auth suites
git show e17c55e           # SessionContextService rethrows Next control-flow errors
```

Reference docs in the upstream repo:

- `docs/security/2026-09-28-auth-review.md`: the review record (every item, decisions, and what was checked and held)
- `docs/security/downstream-hardening-playbook.md` § 2026-09-29 follow-up: the human-readable summary
- `docs/security/Additional_Security_Hardening.md`: the open policy options (revocation, MP login re-validation, role granularity)
- `.claude/references/auth.md`: session lifetime, emergency sign-out, authorization policy, the per-process caveats
- `.claude/references/security-headers.md`: the header set and the deliberate loosenings not to "tighten"
- `.claude/references/testing.md`: the mock OIDC harness and mock patterns

---

If you hit something this playbook doesn't cover, **stop and ask the user before improvising**. Examples: a fork with a database adapter, a replaced auth library, fork-specific procedures or communications, or a host whose client-IP header you can't determine. Every phase here is security-relevant, and a plausible guess is worse than a question.
