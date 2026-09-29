# TODO: Info-level authorization notes (grouped)

**Created:** 2026-09-28
**Severity:** Info — all fail closed; these are accuracy, performance and surface-area items.
**Source:** Auth security review 2026-09-28 (authorization reviewer).

## Items

- [ ] **Session/MP failures are reported as "no access".** `sessionContextService.ts:44-47` catches and returns null; `src/lib/auth.ts:85-93` (`resolveMpUserId`) returns null when MP fails; `authorizationService.ts:222-224` then returns `{ permitted: false, reason: "no_mp_user" }`. The user is sent to `/no-access` ("ask an admin for a role") and `canAccessContactFeatures` is false. This contradicts `(web)/contactlookup/layout.tsx:19-20`, `authorizationService.ts:201-203` and playbook line ~374 ("MP is down" never reads as "not allowed"). Fix: distinguish "could not resolve" (throw → error boundary) from "session has no MP user" (deny), or correct the docs.

- [ ] **The per-request role memo does nothing inside server actions.** `authorizationService.ts:83-103` uses React `cache()`. Next runs actions via `workUnitAsyncStorage.run(requestStore, () => action.apply(...))` (`next/dist/server/app-render/action-handler.js:987`) outside a React Flight request, and React's `getCacheForType` falls back to a fresh `Map` there (`react-server-dom-turbopack-server.node.production.js:718-722, 906-910`). So `createContactLog` reads session + `dp_User_Roles` twice; the contact-details log action three times. `.claude/references/auth.md:843-845` and playbook `:362` ("one request costs at most one role read") only hold during RSC render. Fix: correct the docs, or memo via a request-scoped store.

- [ ] **Unused exported server actions are extra public endpoints.** `src/components/contact-logs/actions.ts` exports `getContactLogsByContactId` (`:135`) and `getContactLogById` (`:151`), which no client uses. Both are gated. Fix: remove or un-export.

- [ ] **`SessionContextService.getActingUserIdForWrite` (log-and-continue) is still exported**, keeping the F10 "write without a gate" pattern one import away. Fix: make it private to `AuthorizationService`, or document why it stays.

- [ ] **`.claude/references/ministryplatform.query-syntax.md:252-253` says input is validated before the gate;** the code gates first (the better order). Fix the doc.
