# TODO: Docs claim the `contactlookup` layout gate protects child pages — false in Next 16, and its test can't fail

**Created:** 2026-09-28
**Severity:** Low — no current leak (every page data call goes through a gated action), but forks follow this guidance.
**Confidence:** Confirmed by reading Next's source and bundled docs.
**Source:** Auth security review 2026-09-28 (authorization and HTTP-boundary reviewers, independently).

## Finding

The claim that a layout-level `hasSecurityRole` check covers child pages appears in:

- `src/app/(web)/contactlookup/layout.tsx:12-17`
- `.claude/references/auth.md:746`
- `docs/security/downstream-hardening-playbook.md:353-355`
- `.claude/playbooks/port-downstream-hardening.md:275`

But Next renders child segments independently: `node_modules/next/dist/server/app-render/create-component-tree.js:329-457` builds the child segment separately and passes the layout only a `<LayoutRouter>` placeholder as `children`. Next's own docs (`node_modules/next/dist/docs/01-app/02-guides/authentication.md:1352-1356`) say a layout check "does not stop [child segments] from running or from appearing in the RSC Payload", and layouts aren't re-rendered on client navigation.

So a role-less user opening `/contactlookup/<guid>` still runs the page's `getContactDetails`, `getContactLogsByContactId` and `getMpTimezone` — they refuse only because each action is gated (logging `mp.read.unauthorized`). A fork whose `page.tsx` calls an ungated service directly would put member data into the RSC payload.

Concrete request (HTTP-boundary reviewer): `GET /contactlookup/<guid>` with `RSC: 1` and *any* value in a `better-auth.session_token` cookie (the proxy checks presence only) — the `[guid]` page runs even though both layouts redirect.

Optional hardening: call `requireSecurityRole` at the top of `src/app/(web)/contactlookup/[guid]/page.tsx` so the page is self-gating regardless of what its data calls do.

The test `src/app/(web)/contactlookup/layout.test.tsx:104-117` builds the child element itself and asserts nothing was rendered to the DOM — always true, because nothing is ever rendered.

## Fix

- Correct the four documents: page- and action-level gates are **mandatory**; the layout gate is only a UX redirect.
- Delete or rewrite the misleading test (e.g. assert the layout redirects, and separately that the page's own gate refuses).

## How to verify a fix

- Grep the docs for "layout" + "covers"/"protects" claims; the rewritten test fails if the page-level gate is removed.
