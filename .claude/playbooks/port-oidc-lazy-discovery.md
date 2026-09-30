# Playbook: Stop Fetching MP's OIDC Discovery at Boot (MPNext Issue #101) In This Repo

You are Claude Code running in a repo that was **forked or copied from MPNext** (or from a repo that was). On 2026-09-29 a downstream maintainer (Jonathon Huff, The Moody Church) reported [MPNext issue #101](https://github.com/MinistryPlatform-Community/MPNext/issues/101): with better-auth 1.7's genericOAuth plugin configured by `discoveryUrl`, **one Ministry Platform blip at the wrong moment takes sign-in down**, and a hung MP stalls every request for about five minutes. MPNext fixed it in PR #107 (`6ae05df`, docs `23660fd`) by removing boot-time discovery and verifying the id_token itself. This playbook ports that change into the repo you're in.

**This is a delta playbook.** It stands on its own, but it assumes the identity fixes from [`port-downstream-hardening.md`](port-downstream-hardening.md) (2026-09-12/25) are in. It **supersedes the discovery half of Phase 4** of [`port-security-review-2026-09-28.md`](port-security-review-2026-09-28.md) for any fork that ported that playbook before PR #107 merged (2026-09-29). Until then it said to port a `selfHealingAuth` rebuild facade. If this repo ported that facade, this playbook removes it.

**There is no dependency edge from this repo back to MPNext.** Nothing will alert this repo. Run each check below; don't assume the result.

**Outcome you're driving toward**

1. Building the auth instance makes **no network call**. `next build`, cold starts and every page's session check never contact MP, so the MP provider always registers.
2. The id_token is **still verified**: RS256 signature against MP's JWKS, plus `iss` and `aud`. This now happens in `getUserInfo`, before the existing `sub` binding and `exp`/`azp` checks.
3. The issuer and JWKS URL come from MP's discovery document, loaded **lazily at the first OAuth callback**:
   - with a 5 s timeout and no redirects;
   - single-flight;
   - cached on success;
   - **never cached on failure**.

   An MP outage fails only the sign-ins whose callback hits it, and the next one recovers on the same process. No restart, no cooldown.
4. The config carries explicit `authorizationUrl`, `tokenUrl` and `endSessionEndpoint`, plus an `accountSubject` that reads `sub`. `discoveryUrl`, `requireIdTokenVerification` and `disableIdTokenNonceBinding` are gone, and so is any `selfHealingAuth` facade.
5. Regression tests prove all of this, including that re-adding `discoveryUrl` turns them red.

**Do not skip the discovery phase.** Forks differ in better-auth version, provider config and test harness. Some are not affected at all.

---

## Background: the bug class you're preventing

genericOAuth resolves a `discoveryUrl` **once**, inside the plugin's `init` (`node_modules/better-auth/dist/plugins/generic-oauth/index.mjs`). That fetch has no timeout and no retry. `betterAuth()` starts `init` when it is constructed, and **every** auth request and in-process `auth.api.*` call awaits it. Since the 2026-09-28 shared-instance fix, every Next bundle layer shares that one instance.

- **A failed fetch** (refused connection, non-2xx, non-JSON) makes genericOAuth log `Provider "ministry-platform": discovery left no usable authorization endpoint or token exchange. Provider skipped.` and drop the provider for the life of the instance. `/signin` shows "Redirecting to sign in…" with a spinner that never finishes, and `POST /api/auth/sign-in/social` returns `404 PROVIDER_NOT_FOUND`. It stays that way after MP recovers, and only a restart fixes it. `/signin` still returns 200, so **an uptime check stays green**.
- **A hung fetch** (MP accepts the connection and never answers) holds the first sign-in and **every page that checks the session** for undici's ~300 s headers timeout. After that it ends in the same permanent 404.

better-auth 1.6 re-fetched discovery on each sign-in, so a blip healed itself. The regression arrived with 1.7. The genericOAuth plugin is byte-identical in 1.7.4, 1.7.5 and 1.7.6. Upstream tracking: better-auth/better-auth#11404 and #10999.

**Why the obvious fixes were not taken:**
- **A rebuild facade** (`selfHealingAuth`, upstream's first attempt): rebuilding the instance on the next sign-in after a 30 s cooldown healed the *failed* case. It did not heal the *hang*, because it awaited the first instance's `$context` with no timeout. It also depended on better-auth internals.
- **Wrapping the plugin's `init` in a timeout plus retry** fails faster, but keeps the boot-time dependency and adds a second internal hook. It still gives up when MP stays down past the retry budget.
- **Explicit endpoints with no id_token verification** (what some forks already run) is not an outage risk. But it drops the JWKS signature check that upstream requires. OIDC Core §3.1.3.7 allows TLS in place of the signature check for code-flow tokens, but upstream chose to keep verification.

**Why the JWKS URL is not hardcoded:** it differs between IdentityServers. A live MP serves `/oauth/.well-known/jwks`, while the IdentityServer default is `/oauth/.well-known/openid-configuration/jwks`. Pinning either one breaks sign-in somewhere. So the issuer and `jwks_uri` still come from discovery, only lazily.

---

## Phase 1: Discovery and triage

Answer these by reading the repo. Proceed only once each has an answer, or has been raised with the user.

1. **better-auth version:** `npm ls better-auth`. This playbook targets **1.7.3 and later** (verified on 1.7.4–1.7.6).
   - **On 1.6.x:** discovery is re-fetched per sign-in and not cached, so the outage does not apply. Don't port this onto 1.6. The better-auth 1.7 upgrade is its own change; raise it with the user.
   - **On 1.7.0–1.7.2:** accounts are keyed on `(issuer, accountId)`, and a discovery provider without a resolvable issuer throws out of `init` (`discovery returned no valid data`). Without discovery there is no issuer at all. Upgrade to ≥ 1.7.3 first.
   - **On a newer minor:** re-verify that genericOAuth still fetches nothing in `init` for a provider without `discoveryUrl`. The `fetchDiscovery` call must sit inside `if (c.discoveryUrl)`:
     ```bash
     grep -n "discoveryUrl\|fetchDiscovery" node_modules/better-auth/dist/plugins/generic-oauth/index.mjs
     ```
2. **Which state is this repo in?** Run:

```bash
# (`^\s*discoveryUrl:` is the config key; the second grep skips a function parameter of that name)
grep -nE "^\s*discoveryUrl:" src/lib/auth.ts | grep -v "discoveryUrl: string" && echo "→ discoveryUrl set: AFFECTED"
grep -q "selfHealingAuth" src/lib/auth.ts && echo "→ rebuild facade present: delete it (Phase 4)"
grep -q "requireIdTokenVerification" src/lib/auth.ts && echo "→ requireIdTokenVerification set: must be removed with discoveryUrl"
grep -q "verifyMpIdToken\|jwtVerify" src/lib/auth.ts && echo "→ app already verifies id_tokens itself"
grep -nE "^\s*(authorizationUrl|tokenUrl|endSessionEndpoint|accountSubject):" src/lib/auth.ts
grep -rn "genericOAuth(" src/ --include=*.ts | grep -v test
```

| State | Signals | What to do |
|---|---|---|
| **A.** `discoveryUrl` + `selfHealingAuth` (ported the 2026-09-28 playbook early) | both `→` lines | Phases 2–7. Phase 4 deletes the facade |
| **B.** `discoveryUrl`, no facade | `AFFECTED` only | Phases 2–7 |
| **C.** Explicit endpoints, no id_token verification | no `discoveryUrl`, no `jwtVerify` | **Not affected by the outage.** Adding verification (Phase 3) is a posture change: **ask the user**. If they decline, stop |
| **D.** Done | no `discoveryUrl`, `verifyMpIdToken` present | Phase 6 only |

3. **Other genericOAuth providers?** If the repo configures more than the MP provider, any other provider with a `discoveryUrl` has the same boot-time dependency. This playbook ports only the MP provider. Tell the user about the others.
4. **Env names:** confirm what this repo calls the MP base URL and the OIDC client id (`MINISTRY_PLATFORM_BASE_URL` and `OIDC_CLIENT_ID` upstream), and whether a `getMpBaseUrl()`-style validated reader exists (`src/lib/env.ts` upstream).
5. **Test harness:** does the repo have upstream's mock OIDC provider (`src/test-utils/mock-oidc.ts`), and which suites call `getUserInfo` directly? Phase 5 needs both.
   ```bash
   ls src/test-utils/mock-oidc.ts 2>/dev/null
   grep -rln "getUserInfo" src --include=*.test.ts
   ```

---

## Phase 2: Confirm this repo's MP endpoints

The endpoints get hardcoded, so check them against **this repo's** MP. The discovery document is public and the request is a read-only `GET`. Use the base URL from this repo's environment, and never print secrets:

```bash
BASE="https://<this repo's MP host>/ministryplatformapi"   # the MINISTRY_PLATFORM_BASE_URL value
curl -s --max-time 15 "$BASE/oauth/.well-known/openid-configuration" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);
for (const k of ["issuer","authorization_endpoint","token_endpoint","userinfo_endpoint","end_session_endpoint","jwks_uri","id_token_signing_alg_values_supported","authorization_response_iss_parameter_supported"])
  console.log(k.padEnd(48), JSON.stringify(j[k]));})'
```

What you should see: `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint` and `end_session_endpoint` are `$BASE/oauth/connect/{authorize,token,userinfo,endsession}`, and `id_token_signing_alg_values_supported` is `["RS256"]`. If you see anything else:

- **Different `connect/*` paths:** stop and ask the user. The endpoints in Phase 3 must match the document.
- **An algorithm other than RS256:** add it to `ID_TOKEN_ALGORITHMS` (asymmetric algorithms only), and tell the user.
- **`authorization_response_iss_parameter_supported: true`:** tell the user. Without discovery, better-auth's RFC 9207 callback `iss` check has no issuer to compare against. Upstream's MP doesn't advertise it, so nothing is lost there. A single-provider app has no mix-up to defend in any case.
- **`jwks_uri`:** record it for the PR description, but **do not hardcode it**.

---

## Phase 3: Port the code

### 3a. `jose` becomes a direct dependency

It is already in the tree via better-auth; list it in `package.json` (`"jose": "^6.2.12"` or whatever `npm ls jose` shows), then regenerate the lockfile **the way this repo requires** (upstream: `npm run deps:relock`, never a bare `npm install` on Windows).

**Check that the lockfile actually changed.** Upstream's `scripts/check-lockfile.mjs --fix` had a bug. It wrote the lockfile only when the *tree shape* drifted. Adding a dependency that is already hoisted changes only the root entry's `dependencies`, which the shape comparison skips, so `jose` never reached `package-lock.json`. Verify:

```bash
node -e "console.log(require('./package-lock.json').packages[''].dependencies.jose ?? 'MISSING from the lockfile root')"
```

If it prints `MISSING` and this repo has upstream's script, port the fix (upstream `6ae05df`). In the no-drift branch, write the canonical lockfile when `--fix` is set and it differs from the committed one:

```js
// Write with the repo's existing newline style rather than forcing LF.
const writeCanonical = () => {
  const usesCRLF = readFileSync(LOCKFILE, 'utf8').includes('\r\n');
  writeFileSync(LOCKFILE, usesCRLF ? canonical.replace(/\n/g, '\r\n') : canonical);
};

if (!drifted) {
  if (committed !== canonical && fix) {
    writeCanonical();                     // metadata-only difference, e.g. a new root dependency
    console.log('✓ package-lock.json tree already matched Linux resolution; npm metadata rewritten.');
  } else if (committed !== canonical) {
    // ...the existing "byte differences remain in npm metadata only" message
  } else {
    // ...the existing "no drift" message
  }
  process.exit(0);
}
if (fix) { writeCanonical(); /* ... */ }
```

The expected lockfile diff is exactly one line, `"jose": "^6.2.12",` in the root entry.

### 3b. The lazy verifier (`src/lib/auth.ts`)

Add it next to the other `getUserInfo` helpers. The logging follows this repo's rules, identifiers only: never the token, its claims, the discovery URL or `err.message`.

```ts
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

/** Timeout for the lazy discovery request and (via jose) the JWKS request. */
export const OIDC_DISCOVERY_TIMEOUT_MS = 5_000;

/** Pinned: nothing in a token header or discovery document can widen what is accepted. */
export const ID_TOKEN_ALGORITHMS = ["RS256"];

export interface IdTokenVerifier {
  issuer: string;
  jwks: JWTVerifyGetKey;
}

type DiscoveryFailure =
  | { reason: "http_status"; status: number }
  | { reason: "request_failed" | "invalid_json"; errName: string }
  | { reason: "invalid_document"; field: "body" | "issuer" | "jwks_uri" };

function logDiscoveryFailure(detail: DiscoveryFailure) {
  console.error(JSON.stringify({
    event: "auth.oidc.discovery_failed",
    message: "MP OIDC discovery document unavailable; sign-in fails until it loads (retried on the next sign-in)",
    ...detail,
  }));
}

async function fetchIdTokenVerifier(discoveryUrl: string, timeoutMs: number): Promise<IdTokenVerifier> {
  const fail = (detail: DiscoveryFailure): never => {
    logDiscoveryFailure(detail);
    throw new Error(`OIDC discovery failed: ${detail.reason}`);
  };
  let response: Response;
  try {
    // A redirect here is a misconfiguration, or someone steering us to another key set.
    response = await fetch(discoveryUrl, { signal: AbortSignal.timeout(timeoutMs), redirect: "error" });
  } catch (err) {
    return fail({ reason: "request_failed", errName: errorName(err) });
  }
  if (!response.ok) return fail({ reason: "http_status", status: response.status });
  let doc: unknown;
  try {
    doc = await response.json();
  } catch (err) {
    return fail({ reason: "invalid_json", errName: errorName(err) });
  }
  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
    return fail({ reason: "invalid_document", field: "body" });
  }
  const { issuer, jwks_uri: jwksUri } = doc as Record<string, unknown>;
  if (typeof issuer !== "string" || !URL.canParse(issuer)) {
    return fail({ reason: "invalid_document", field: "issuer" });
  }
  if (typeof jwksUri !== "string" || !URL.canParse(jwksUri, discoveryUrl)) {
    return fail({ reason: "invalid_document", field: "jwks_uri" });
  }
  // jose caches the key set, re-fetches on an unknown `kid` (at most once per 30 s: key
  // rotation), refuses a redirected or non-200 response, and does not cache a failed fetch.
  return { issuer, jwks: createRemoteJWKSet(new URL(jwksUri, discoveryUrl), { timeoutDuration: timeoutMs }) };
}

/** Lazy, single-flight, cached on success, never cached on failure, fails closed. */
export function lazyIdTokenVerifier(
  discoveryUrl: string,
  { timeoutMs = OIDC_DISCOVERY_TIMEOUT_MS }: { timeoutMs?: number } = {},
): () => Promise<IdTokenVerifier> {
  let pending: Promise<IdTokenVerifier> | null = null;
  return () =>
    (pending ??= fetchIdTokenVerifier(discoveryUrl, timeoutMs).catch((err: unknown) => {
      pending = null;
      throw err;
    }));
}

function logIdTokenUnverified(
  detail:
    | { reason: "verifier_unavailable" }
    | { reason: "verification_failed"; code?: string; claim?: string; errName: string },
) {
  console.error(JSON.stringify({
    event: "auth.userinfo.id_token_unverified",
    message: "MP id_token could not be verified; refusing sign-in",
    ...detail,
  }));
}
```

`errorName(err)` is upstream's duck-typed `err.name` reader, which returns the value's type when there is no name. Port it too if this repo lacks it. Then, **after** the validated MP base URL is read:

```ts
export const MP_PROVIDER_ID = "ministry-platform";

const mpOidc = {
  discovery: `${mpBaseUrl}/oauth/.well-known/openid-configuration`,
  authorization: `${mpBaseUrl}/oauth/connect/authorize`,
  token: `${mpBaseUrl}/oauth/connect/token`,
  userinfo: `${mpBaseUrl}/oauth/connect/userinfo`,
  endSession: `${mpBaseUrl}/oauth/connect/endsession`,
};

const loadMpIdTokenVerifier = lazyIdTokenVerifier(mpOidc.discovery);

async function verifyMpIdToken(idToken: string): Promise<JWTPayload | null> {
  let verifier: IdTokenVerifier;
  try {
    verifier = await loadMpIdTokenVerifier();
  } catch {
    logIdTokenUnverified({ reason: "verifier_unavailable" });   // discovery's own line says why
    return null;
  }
  try {
    const { payload } = await jwtVerify(idToken, verifier.jwks, {
      issuer: verifier.issuer,
      audience: process.env.OIDC_CLIENT_ID!,
      algorithms: ID_TOKEN_ALGORITHMS,
    });
    return payload;
  } catch (err) {
    const { code, claim } = (err ?? {}) as { code?: unknown; claim?: unknown };
    logIdTokenUnverified({
      reason: "verification_failed",
      ...(typeof code === "string" && { code }),     // jose error code, e.g. ERR_JWT_EXPIRED
      ...(typeof claim === "string" && { claim }),   // claim name for a claim failure
      errName: errorName(err),
    });
    return null;
  }
}
```

### 3c. The provider config

```ts
genericOAuth({
  config: [{
    providerId: MP_PROVIDER_ID,
    // NO discoveryUrl (issue #101). Re-adding it brings back the boot-time fetch AND gives
    // the provider an id_token config, which re-opens /sign-in/social's id_token mode (F12).
    authorizationUrl: mpOidc.authorization,
    tokenUrl: mpOidc.token,
    // Required: without discovery, better-auth builds no MP logout URL otherwise, and
    // sign-out loses the id_token_hint (MP then stops at a "log out?" prompt).
    endSessionEndpoint: mpOidc.endSession,
    // Required: without discovery the provider is not recognised as OIDC, so the default
    // resolver reads profile.id, which getUserInfo never returns. Every account would key on "".
    accountSubject: ({ profile }) => (typeof profile.sub === "string" ? profile.sub : ""),
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    scopes: ["openid", "http://www.thinkministry.com/dataplatform/scopes/all"],
    pkce: false,              // MP does not support PKCE (accepted risk F8), unchanged
    // requireIdTokenVerification: REMOVE. genericOAuth throws for it without discoveryUrl.
    // disableIdTokenNonceBinding: REMOVE. It is a no-op with no id_token config: better-auth
    //   neither sends nor requires a nonce. Keep this repo's F8 accepted-risk comment.
    authorizationUrlParams: { realm: "realm" },
    getUserInfo: async (tokens) => { /* 3d */ },
    mapProfileToUser: /* unchanged */,
  }],
}),
```

`userInfoUrl` is not needed, because the custom `getUserInfo` fetches `mpOidc.userinfo` itself. Point that fetch at `mpOidc.userinfo` rather than a second hardcoded string.

### 3d. `getUserInfo`: verify first, then run the existing checks on the verified payload

Upstream's hardened `getUserInfo` refused a missing id_token and then decoded the token **without** verifying it. That was safe only because genericOAuth had verified it first. Now nothing upstream of us does, so this repo must verify:

```ts
getUserInfo: async (tokens) => {
  if (typeof tokens.idToken !== "string" || tokens.idToken === "") {
    logSubBindingFailure("missing_id_token");
    return null;
  }
  const claims = await verifyMpIdToken(tokens.idToken);   // replaces the unverified decode
  if (!claims) return null;
  const idTokenSub = claims.sub;
  if (typeof idTokenSub !== "string" || idTokenSub === "") {
    logSubBindingFailure("missing_sub");
    return null;
  }
  const claimFailure = idTokenClaimFailure(claims, process.env.OIDC_CLIENT_ID!);
  if (claimFailure) { logIdTokenClaimFailure(claimFailure); return null; }
  // ...unchanged: the userinfo fetch (timeout, redirect: "error", never throws), the
  //    sanitizeGuid(sub) check, the case-insensitive sub binding, and the returned profile.
},
```

Adjust the helpers so they carry no dead branches:
- **Delete the unverified decoder** (`readIdTokenClaims` upstream) and its `undecodable_id_token` reason. jose refuses a malformed token as `ERR_JWS_INVALID`.
- **`idTokenClaimFailure`:** keep the `missing_exp` and `azp_mismatch` reasons. Drop `expired` and the `Number.isFinite` test. jose already refuses a past `exp` (`ERR_JWT_EXPIRED`) and a non-numeric one (`ERR_JWT_CLAIM_VALIDATION_FAILED`, `claim: "exp"`), and it checks `exp` only when the claim is present. `sub` is type-checked by jose only when a `subject` option is passed, so keep this repo's own `sub` check.
- **Never throw from `getUserInfo`.** Every refusal returns `null`. The callback route doesn't wrap it, so a throw surfaces as an unhandled error.

### 3e. The rest of the change set

- **`src/lib/auth.ts`, the F12 doc comment on `refuseIdTokenSignIn`:** say that better-auth now also refuses the mode itself (`404 ID_TOKEN_NOT_SUPPORTED`), because the provider has no id_token config. Say too that this is a side effect of configuration, not a control, so **the hook and the route's body filter stay**.
- **Export plain, not faceted:** `export const auth = sharedInstance(SHARED_AUTH_KEY, createAuth);`
- **`/auth-error` copy for `unable_to_get_user_info`:** this is now what an MP blip at the callback looks like, so invite a retry. Upstream: "We couldn't read your Ministry Platform account. Please try again in a moment."
- **The sign-in page:** keep its `provider_unavailable` state for `404 PROVIDER_NOT_FOUND`, but update the comment. That 404 now means misconfiguration, never an MP outage.

---

## Phase 4: If this repo ported the rebuild facade (state A)

Delete it along with everything that existed only for it:

- `selfHealingAuth`
- `DISCOVERY_REBUILD_COOLDOWN_MS` and `DISCOVERY_REBUILD_WAIT_MS`
- `RebuildableAuth`, `needsProvider`, `hasProvider` and `logDiscoveryRebuild`
- `src/auth.discovery-rebuild.test.ts`

Keep `MP_PROVIDER_ID` as the `providerId`. Then grep for anything that relied on the facade:

```bash
grep -rn "selfHealingAuth\|discovery\.rebuild\|DISCOVERY_REBUILD" src/ docs/ .claude/ *.md
grep -rn "auth\.\$context" src/ --include=*.ts | grep -v test   # read through the facade before; plain now
```

**Tell the user** that the `auth.discovery.rebuild` log event is gone. Any alert on it should move to `auth.oidc.discovery_failed` and `auth.userinfo.id_token_unverified` (field reference in Phase 7).

---

## Phase 5: Tests

### 5a. The mock OIDC provider

If the repo has upstream's `src/test-utils/mock-oidc.ts`, give it per-endpoint failure modes so outages can be simulated. Its `fetch` must keep **throwing for every URL it does not serve**, so no test can reach a real MP.

```ts
export type MockEndpointMode = 'ok' | 'reject' | 'http_500' | 'hang';
// state: { discovery: MockEndpointMode; jwks: MockEndpointMode; mp: MockEndpointMode; ...existing }
//   mp !== 'ok' → EVERY mock MP endpoint behaves that way (MP down)
// 'hang' accepts the request and settles only when the caller's AbortSignal fires:
function misbehave(mode: Exclude<MockEndpointMode, 'ok'>, signal: AbortSignal) {
  if (mode === 'reject') return Promise.reject(new TypeError('fetch failed'));
  if (mode === 'http_500') return Promise.resolve(new Response('error', { status: 500 }));
  return new Promise<Response>((_, reject) =>
    signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
}
// ...and expose signIdToken(claims) so suites can mint really signed tokens.
```

Pass `request.signal`, taken from `new Request(input, init)`, not `init.signal`.

### 5b. The regression suite (upstream `src/auth.oidc-discovery.test.ts`, 23 tests)

Use `// @vitest-environment node`, because jose's WebCrypto rejects jsdom-realm typed arrays. Re-import `@/lib/auth` per test (`vi.resetModules()`) for a fresh verifier cache.

- **MP `reject`, `http_500` and `hang` at boot:** `await auth.$context`, a `POST /sign-in/social` returns 200 with the authorize URL, and `/get-session` and `auth.api.getSession` answer. **Zero** mock calls. In `hang` mode, any MP call would time the test out, and that is the signal.
- **The provider is always registered**, even with MP down.
- **Discovery `reject` or `http_500` at the callback:** the callback redirects to `/auth-error?error=unable_to_get_user_info`, no session cookie is set, and userinfo is never called. Both `auth.oidc.discovery_failed` and `verifier_unavailable` are logged, and the log never contains the MP host. Then set discovery to `ok` and run a second code flow on **the same instance**: it succeeds, and discovery was fetched twice (the failure was not cached).
- **The same for a JWKS failure:** `reject` gives `errName: "TypeError"`, and a 500 gives `code: "ERR_JOSE_GENERIC"`. Discovery stays fetched once.
- **Discovery request shape:** a timeout of `OIDC_DISCOVERY_TIMEOUT_MS` (find the `AbortSignal.timeout` call with that value) and `redirect: "error"`.
- **Concurrency:** 5 concurrent callbacks share one discovery fetch, and a later sign-in reuses it.
- **`lazyIdTokenVerifier` units:** nothing is fetched before first use; a *relative* `jwks_uri` resolves against the discovery URL (use a real jose `SignJWT` token); success is cached, concurrent and sequential; a failure is never cached; a hung request is given up after `timeoutMs` with `errName: "TimeoutError"`. Plus fail-closed on each bad document: 404, non-JSON, an array, `null`, no issuer, an issuer that isn't a URL, no `jwks_uri`, a non-string one, and an unparseable one. Each logs identifiers only.

### 5c. Suites that change

- **Anything that calls `getUserInfo` directly with an unsigned fake id_token** (`header.payload.sig`) now fails verification. Switch those tests to `signIdToken(...)` from the mock and the node environment. Replace blanket `vi.spyOn(globalThis, 'fetch').mockResolvedValue(...)` with a stub that answers **only** the userinfo URL and passes discovery and JWKS through to the mock. Capture the mock's `fetch` at module level **before** any spy, or the passthrough will recurse. Assertions on "userinfo was not called" should then target the userinfo stub, not `fetch`.
- **Expected log reasons:** a past `exp` is now `auth.userinfo.id_token_unverified` with `code: "ERR_JWT_EXPIRED"`, and a malformed token is `ERR_JWS_INVALID`. `missing_exp`, `azp_mismatch`, `missing_sub` (including a non-string `sub`) and `mismatch` are unchanged.
- **Add alg-confusion cases:** an HS256 token HMAC'd with the client secret, and `alg: none`. Both must fail with `ERR_JOSE_ALG_NOT_ALLOWED`.
- **Partial-discovery tests** that expected `404 PROVIDER_NOT_FOUND` at `/sign-in/social`: sign-in now **starts**. The callback refuses, and `auth.oidc.discovery_failed` reports `field: "issuer"` or `field: "jwks_uri"`.
- **Code-flow verification failures:** assert on the new event and jose code, not better-auth's `id_token failed verification` text:
  - foreign key → `ERR_JWS_SIGNATURE_VERIFICATION_FAILED`
  - wrong `iss` or `aud` → `ERR_JWT_CLAIM_VALIDATION_FAILED` with `claim`
- **Config pins:**
  - no `discoveryUrl`;
  - no `requireIdTokenVerification`;
  - the explicit `authorizationUrl`, `tokenUrl` and `endSessionEndpoint`;
  - `accountSubject` returns `sub`, and `""` for an `id`-only profile;
  - the live provider has `idToken === undefined` and `requiresIdTokenNonce === false`.

  Keep a negative control: with `discoveryUrl` re-added, the authorize request carries a `nonce` and the MP-shaped token (no `nonce`) cannot sign in.
- **F12 tests:**
  - With the hook removed, better-auth itself returns `404 ID_TOKEN_NOT_SUPPORTED`, even for a matched pair, and userinfo is never called.
  - To keep proving the `sub` binding on the path that made F12 possible, build a variant with the hook removed **and** `discoveryUrl` re-added (with `requireIdTokenVerification` and `disableIdTokenNonceBinding`). The substitution must fail with `mismatch`, while a matched pair signs in.
- **A test that asserted discovery was fetched while the instance was built** (upstream's env-normalization test) should now assert the configured endpoint URLs, and that `await auth.$context` makes **no** fetch.
- **A route test that stubbed discovery "so the provider registers"** no longer needs the stub. Replace it with a `fetch` that throws for every URL. Upstream's old stub fell through to the real network for other URLs.

### 5d. Mutation check

Temporarily add `discoveryUrl: mpOidc.discovery,` back into the provider config and run the regression suite with a short timeout (`--testTimeout=3000`). Upstream: **11 of 23 fail**, including the hang case by timeout. Revert, and confirm the line is gone.

---

## Phase 6: Verify

1. **The full suite**, including coverage thresholds if the repo gates them, plus `tsc --noEmit`, lint, `npm run build` and the lockfile check.
2. **The build makes no MP call.** In CI, point the build's MP URL at the reserved, non-resolving `https://mp.invalid`. Nothing should log a discovery error during "Collecting page data".
3. **Replay the issue's repro** against `next build` + `next start`, with a local fake MP. `next start` is `NODE_ENV=production`, and upstream's `env.ts` requires https for the MP URL there, so the fake needs TLS:
   ```bash
   # in a scratch directory outside the repo
   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 1 \
     -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
   ```
   Adapt the issue's `fake-mp.mjs`: use `https.createServer({ key, cert }, handler)` on `127.0.0.1:4443`, with `BASE = "https://localhost:4443"`. Keep its `/__mode?m=ok|fail|hang` and `/__stats` (`discoveryRequests`) switches. Then start the app on a **spare port**, with fake credentials in the *process* env. Process env wins over `.env.local`, so the user's env file is never touched:
   ```bash
   NODE_EXTRA_CA_CERTS=<scratch>/cert.pem MINISTRY_PLATFORM_BASE_URL=https://localhost:4443 \
   MINISTRY_PLATFORM_CLIENT_ID=fake MINISTRY_PLATFORM_CLIENT_SECRET=fake OIDC_CLIENT_ID=fake OIDC_CLIENT_SECRET=fake \
   BETTER_AUTH_URL=http://localhost:3100 BETTER_AUTH_SECRET=<openssl rand -base64 32> MP_SECURITY_ROLES=Test \
   npx next start -p 3100
   ```
   - **`fail` mode set before start:** `POST /api/auth/sign-in/social` (with `Origin: http://localhost:3100`) must return **200** with an authorize URL, and `discoveryRequests` must stay **0**. The issue saw `404 PROVIDER_NOT_FOUND`.
   - **`hang` mode on a fresh process:** `/api/auth/get-session`, `/sign-in/social`, `/signin` and `/` must each answer in milliseconds. The issue measured ~301 s. `discoveryRequests` stays **0**.
   - **On Windows:** stopping a backgrounded `npx next start` can leave the `node … next start` child listening. Afterwards, check the port (`Get-NetTCPConnection -State Listen -LocalPort 3100`), confirm the owning PID's command line is the server you started, and `taskkill /PID <pid> /T /F`. Never touch a `next dev` the user is running.
4. **Smoke test against the real MP** (a person does this; it's a real sign-in):
   - sign in through MP;
   - `/api/auth/get-session` shows a non-null `userGuid` and `userId`;
   - the server log has no `auth.oidc.discovery_failed` or `auth.userinfo.id_token_unverified`;
   - sign out, and MP ends its session **without** a "log out?" prompt. That proves `endSessionEndpoint` + `id_token_hint`.

   Existing users keep their accounts and sessions: the account subject is `sub` either way.

---

## Phase 7: Docs, and what the PR must say

Update this repo's auth reference and `CLAUDE.md` wherever they describe `discoveryUrl`, `requireIdTokenVerification`, the nonce option, a rebuild facade, or "sign-in is broken until discovery returns / until a restart".

The PR description must call out:

- **Fixes the boot-time discovery outage** (MPNext #101). Say which state (A–D) the repo was in, and that building the instance now makes no MP call.
- **The id_token is still JWKS-verified**, now by the app: RS256 pinned, `iss` and `aud` checked, with the issuer and `jwks_uri` loaded lazily. Record the `jwks_uri` Phase 2 found, and that it is **not** hardcoded.
- **Log events changed.** Removed: `auth.discovery.rebuild` (state A). Added:
  - `auth.oidc.discovery_failed`, with `reason`: `http_status` + `status`, `request_failed` + `errName`, `invalid_json`, or `invalid_document` + `field`;
  - `auth.userinfo.id_token_unverified`, with `reason: "verifier_unavailable"`, or `"verification_failed"` + `code` / `claim` / `errName`.

  Removed reasons: `undecodable_id_token`, `expired`. Alerts need updating.
- **What an MP outage looks like now:** `/signin` always starts. A callback during the outage lands on `/auth-error?error=unable_to_get_user_info` (with the retry copy), and the next sign-in recovers. `PROVIDER_NOT_FOUND` now means misconfiguration only.
- **Removed options:** `requireIdTokenVerification` and `disableIdTokenNonceBinding`. Why: genericOAuth throws for the first without discovery, and the second is a no-op.
- **F12:** better-auth now refuses the `idToken` branch itself, and the hook and route filter stay as the primary controls.
- **`jose` is a direct dependency.** Note whether the lockfile-script fix was needed.
- **What was not verified:** say whether the real-MP smoke test was done.

---

## Checklist

- [ ] State A–D recorded; better-auth ≥ 1.7.3 confirmed, and genericOAuth fetches nothing in `init` without `discoveryUrl`.
- [ ] This repo's MP discovery document checked (read-only): `connect/*` paths, RS256, `jwks_uri` recorded, RFC 9207 flag noted.
- [ ] `jose` in `package.json` **and** in the lockfile root entry; lockfile regenerated the supported way.
- [ ] `lazyIdTokenVerifier` + `verifyMpIdToken` ported; logs carry identifiers only.
- [ ] Config: no `discoveryUrl`, `requireIdTokenVerification` or `disableIdTokenNonceBinding`. Explicit `authorizationUrl`, `tokenUrl` and `endSessionEndpoint`; `accountSubject` → `sub`.
- [ ] `getUserInfo` verifies before the `sub`/`exp`/`azp` checks; the unverified decoder and its dead reasons are gone; it never throws.
- [ ] Rebuild facade and its test deleted (state A); `auth` exported plain.
- [ ] F12 hook and route filter still in place.
- [ ] Regression suite ported. Direct `getUserInfo` tests use signed tokens. Mutation check: re-adding `discoveryUrl` turns them red.
- [ ] Full suite, `tsc`, lint, build and lockfile check green; the build makes no MP call.
- [ ] Repro replayed: `fail` → 200 with 0 discovery requests; `hang` → millisecond responses. Test servers stopped.
- [ ] Real-MP smoke test done, or explicitly listed as not done.
- [ ] Docs updated; the PR calls out log-event changes and removed options.

## Reading the upstream work

```bash
git show 6ae05df   # the code, tests and lockfile-script fix (commit message has the full reasoning)
git show 23660fd   # docs: auth reference, testing inventory, security notes, playbooks
git show 5e1d2cc   # the superseded rebuild facade, for comparison (state A)
```

Upstream references: `.claude/references/auth.md` § id_token verification (lazy discovery), and `docs/security/downstream-hardening-playbook.md` § Boot-time discovery (issue #101).
