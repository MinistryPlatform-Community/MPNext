# TODO: `MinistryPlatformClient` discards `expires_in` and caps every token at 5 minutes

**Created:** 2026-08-21
**Severity:** Low — wasteful, and the code contradicts its own comment.
**Status:** Open.

## Symptom

`src/lib/providers/ministry-platform/client.ts`:

```ts
// Token refresh interval - refresh 5 minutes before actual expiration for safety
const TOKEN_LIFE = 5 * 60 * 1000; // 5 minutes
...
const creds = await getClientCredentialsToken();
this.token = creds.access_token;
// Set expiration time with safety buffer (TOKEN_LIFE before actual expiration)
this.expiresAt = new Date(Date.now() + TOKEN_LIFE);
```

The comments describe subtracting a safety buffer from the real expiry. The code instead sets every
token's usable life to exactly 5 minutes, discarding the `expires_in` value that MP returns in the
token response.

MP client-credentials tokens are typically valid for an hour, so this means roughly 12x more token
requests than necessary. Behavior is correct — just wasteful, and the stated intent and the actual
behavior disagree, which is the kind of gap that bites whoever edits it next.

## Fix

```ts
const creds = await getClientCredentialsToken();
this.token = creds.access_token;
const lifetimeMs = (Number(creds.expires_in) || 3600) * 1000;
const SAFETY_MARGIN = 5 * 60 * 1000;
this.expiresAt = new Date(Date.now() + Math.max(lifetimeMs - SAFETY_MARGIN, 30_000));
```

Rename `TOKEN_LIFE` to `TOKEN_SAFETY_MARGIN` so the constant says what it is. The `max(..., 30s)`
floor keeps a pathologically short `expires_in` from causing a refresh storm.

## Test to add alongside the fix

- `expires_in: 3600` -> `expiresAt` is ~55 minutes out
- `expires_in` missing -> falls back to the 1-hour default
- `expires_in: 60` -> clamped to the 30s floor rather than going negative

Note for whoever writes these: `client.test.ts` already exercises the refresh path, and the current
behavior is not pinned by any assertion on `expiresAt` — so the fix will not break existing tests,
which is precisely the problem.

## Related

- `.claude/docs/TestCoverage.md` §7.7
