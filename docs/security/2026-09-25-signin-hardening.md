<!--
  EMBARGOED — DO NOT PUBLISH BEFORE COORDINATED DISCLOSURE.
  This advisory describes two issues reported privately on 2026-09-25. This
  repository may be public: do not push this file (or the F3b/F12 sections of
  the downstream playbook) to any public branch until the fix has shipped and
  the disclosure date agreed with the reporter has arrived. Fill in every
  <placeholder>, then delete this comment.
-->

# Security Advisory — Sign-in hardening: `callbackUrl` bypass and ID-token sign-in

| | |
|---|---|
| **Issues** | **F3b** — open redirect on `/signin` via tab/CR/LF (bypass of the F3 fix) · **F12** — ID-token sign-in as another user |
| **Severity** | F3b **Medium** · F12 **Medium**, **High** if the MP OIDC client is shared with other applications or allows the implicit/hybrid flows |
| **Class** | F3b CWE-601 URL Redirection to Untrusted Site · F12 CWE-287 Improper Authentication / CWE-345 Insufficient Verification of Data Authenticity |
| **Affected** | F3b: any checkout containing [`ee46343`](https://github.com/MinistryPlatform-Community/MPNext/commit/ee46343) up to and including `88c734a`. F12: any checkout up to and including `88c734a` running **better-auth 1.7.x** with `discoveryUrl` set on the genericOAuth provider |
| **Fixed in** | `b7dc8e6` (F3b), `cf5a824` (F12) on branch `fix/signin-redirect-and-idtoken-signin` — merge date `<date>` |
| **Reported** | 2026-09-25, privately, by Jonathon Huff (The Moody Church) |

## Summary

Two sign-in weaknesses, both verified upstream:

1. **F3b.** The 2026-09-12 fix for the `/signin` open redirect (F3) only
   refused a leading `//` or `/\`. A tab, LF or CR slipped past it, so a link
   such as `/signin?callbackUrl=/%09/example.com` sent an **already signed-in**
   user to `https://example.com/` from a URL that looks like this app's login.
2. **F12.** better-auth 1.7's `POST /api/auth/sign-in/social` accepts an
   `idToken` body that creates a session with no OAuth code exchange. The
   identity comes from the *access token* the caller supplies, and nothing tied
   it to the id_token. An attacker with their own valid id_token and **a
   victim's MP access token** could obtain an MPNext session **as the victim**.

## Impact

**F3b** — a credible phishing hop: the victim sees a link to their own church's
app, and lands on an attacker's page. Signed-in users only. The signed-out path
was already refused by better-auth's server-side `isSafeRelativeURL`.

**F12** — once the forged session exists, the attacker holds the victim's MP
identity in MPNext: their **security roles** on every authorization check, and
their `User_ID` on every write, so `dp_Audit_Log` attributes the attacker's
changes to the victim. The precondition is a victim's MP access token from
**any** MP OAuth client that `/connect/userinfo` accepts — a leaked token from
another integration is enough. That is why a shared OIDC client, or one that
allows implicit/hybrid flows (tokens in browser URLs), raises the severity.

## Am I affected?

This is a template repository that people fork and copy — the affected set is a
commit range, and your fork will not receive an automated alert.

```bash
# F3b — prints if you have the weak sanitizer
grep -rF 'startsWith("/\\")' src/components/sign-in/

# F12 — affected if discoveryUrl is set, better-auth is 1.7.x, and there is no guard
grep -n "discoveryUrl" src/lib/auth.ts
grep '"version"' node_modules/better-auth/package.json
grep -n "ID_TOKEN_SIGN_IN_DISABLED" src/lib/auth.ts        # absent = affected
```

Runtime checks, against a **non-production** instance:

- F3b: signed in, open `/signin?callbackUrl=/%09/example.com`. Leaving the site
  means affected.
- F12:

  ```bash
  curl -i -X POST https://your-app.example.com/api/auth/sign-in/social \
    -H 'Content-Type: application/json' \
    --data '{"provider":"ministry-platform","idToken":{"token":"x","accessToken":"y"}}'
  ```

  An error from better-auth's **id-token verification** means the branch is
  reachable — affected. A fixed deployment returns a plain **404** before
  better-auth runs.

## Technical detail

### F3b

The WHATWG URL parser strips ASCII tab, LF and CR from anywhere in its input
**before parsing** — after any string check has run. `"/\t/example.com"` does
not start with `//`, but `window.location.href = "/\t/example.com"` navigates
to `//example.com`. On the signed-in path that assignment is the only sink and
no server sees the value.

### F12

`POST /sign-in/social` has an `idToken` branch in better-auth 1.7. It is enabled
for a genericOAuth provider whenever that provider has an id-token verification
config — which MPNext's provider gets automatically because `src/lib/auth.ts`
sets `discoveryUrl`. genericOAuth offers no option to disable it. The body
`{ provider, idToken: { token, accessToken } }` skips `state` and the code
exchange: better-auth verifies the id_token's signature, issuer and audience
(`OIDC_CLIENT_ID`), then calls MPNext's `getUserInfo` with the
**caller-supplied** `accessToken`. MPNext took identity (`sub` → `userGuid`)
from `/connect/userinfo` and never compared it with `id_token.sub`. Reproduced
upstream against a mock.

## The fix

`b7dc8e6` and `cf5a824`:

- **F3b** — `sanitizeCallbackUrl` now mirrors better-auth's `isSafeRelativeURL`:
  it refuses control characters (C0, DEL, C1), **any** backslash, and `%2F`/`%5C`
  in the path; resolves the value against a sentinel origin as a backstop; and
  returns the **raw** value, never the URL-normalized form (normalization turns
  `/.//evil.com` into `//evil.com`).
- **F12**, three layers:
  1. `hooks.before` in `src/lib/auth.ts` refuses any `/sign-in/social` body
     containing `idToken` (404, code `ID_TOKEN_SIGN_IN_DISABLED`) — covers HTTP and
     in-process `auth.api` calls.
  2. `getUserInfo` returns `null` (fails closed, logs
     `auth.userinfo.sub_mismatch`) unless the id_token's `sub` is present and
     equals userinfo's `sub`, case-insensitively.
  3. `src/app/api/auth/[...all]/route.ts` only forwards a `POST /sign-in/social`
     whose Content-Type is exactly `application/json`, whose body keys are a
     subset of `provider` and `callbackURL`, and whose `provider` is
     `ministry-platform`; anything else gets a plain 404.

Porting instructions, snippets and tests: the
[Downstream Hardening Playbook](downstream-hardening-playbook.md), sections F3 /
F3b and F12.

## After patching

- **F12**: patching stops new forged sessions but does not revoke existing
  ones — they live in the JWT cookie cache for up to one hour
  (`session.cookieCache.maxAge`). If you have reason to think F12 was used,
  **rotate `BETTER_AUTH_SECRET`** (signs everyone out) and review
  `dp_Audit_Log` for writes inconsistent with the named user.
- If a victim's MP access token may have leaked from another integration, that
  is an incident in that integration too.

## Timeline

| Date | Event |
|---|---|
| 2026-09-12 | `ee46343` — F3 fixed with a leading-`//`/`/\` check. **F3b introduced.** |
| 2026-09-25 | Both issues reported privately by Jonathon Huff (The Moody Church); both verified. |
| `<date>` | `b7dc8e6`, `cf5a824` — fixed (merged to `main`). |
| `<date>` | Advisory published. |

## Credit

Reported privately and responsibly by **Jonathon Huff** of **The Moody
Church**, who identified both issues and reported them privately so that forks
could be fixed before disclosure.
