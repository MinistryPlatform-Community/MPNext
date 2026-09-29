import { redirect } from "next/navigation";
import { AuthorizationService } from "@/services/authorizationService";

/**
 * UX redirect for every route under `/contactlookup` — NOT an enforcement
 * point for its child pages.
 *
 * It sends a role-less user somewhere that explains the refusal
 * (`/no-access`) instead of a broken page full of thrown actions. That is all
 * it can do.
 *
 * **It does not protect `[guid]/page.tsx` or any other child page.** Next 16
 * renders each route segment independently: the child page is built as its
 * own segment and this layout only receives a placeholder as `children`
 * (node_modules/next/dist/server/app-render/create-component-tree.js), so a
 * `redirect()` here does not stop the page running or its output reaching
 * the RSC payload — Next's own guide says so (node_modules/next/dist/docs/
 * 01-app/02-guides/authentication.md, "Layouts and auth checks"). Layouts
 * are also not re-rendered on client navigation. So every page that reads MP
 * data must gate ITSELF (`[guid]/page.tsx` calls `requireSecurityRole` before
 * any data call), and every action and service it calls gates again.
 *
 * Uses the non-throwing `hasSecurityRole` so a refusal becomes a redirect
 * rather than an error page. Infrastructure failures (MP unreachable) still
 * throw, so "MP is down" never silently reads as "you are not allowed".
 *
 * Closes F1 (2026-09-12) — see `.claude/references/auth.md` § Authorization.
 */
export default async function ContactLookupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const decision = await AuthorizationService.getInstance().hasSecurityRole({
    table: "Contacts",
    operation: "read",
  });

  if (!decision.permitted) {
    redirect("/no-access");
  }

  return <>{children}</>;
}
