# TODO: `ContactService.updateContact` accepts arbitrary columns and lets `fields.Contact_ID` override the target

**Created:** 2026-09-28
**Severity:** Low (latent — no callers today; gated by `requireSecurityRole`).
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (authorization and MP-client reviewers, independently).

## Finding

`src/services/contactService.ts:118-135`, especially `:122`:

```ts
{ Contact_ID: contactId, ...fields }
```

- `fields` is not validated at runtime → `Household_ID`, `Contact_Status_ID`, or any other column reaches the MP PUT.
- Spread order lets `fields.Contact_ID` override the `contactId` argument → writes land on a different contact than the one authorized/logged.
- `contactId` itself is not passed through `sanitizeNumericId`.

## Fix

- Pick only an allowlist (`Email_Address`, `Mobile_Phone`) through a Zod schema with `.strict()`/`.pick()`.
- Spread first, set `Contact_ID` **last**.
- `sanitizeNumericId(contactId)`.

## How to verify a fix

- Tests: smuggled `Household_ID` dropped; `fields.Contact_ID` ignored; non-numeric `contactId` rejected before any MP call.
