# Future Features & Improvements

Ideas and enhancements for the MPNext project. This file syncs bidirectionally with [GitHub Issues](https://github.com/The-Moody-Church/mp-charts/issues) — edit freely during sessions, and changes are synced on push to main.

<!-- sync-issues-to-ideas: bidirectional sync enabled -->
<!-- Entries with ([#N](url)) are linked to issues. New entries without a link get issues created automatically on push. -->
<!-- Mark completed: ### ~~Title ([#N](url))~~ ✅ COMPLETED -->

## Features

### Journey/Milestone Tracker ([#17](https://github.com/The-Moody-Church/mp-charts/issues/17))
Track current journeys from Ministry Platform and provide summary detail about what milestones have been completed. Include filters to narrow by specific journeys or milestones.

### Volunteer Processing ([#18](https://github.com/The-Moody-Church/mp-charts/issues/18))
Provide up-to-date info about volunteer processing, particularly for children's ministry. Include an interface for staff to submit documentation like certificates and other documents/PDFs.

#### Layout: Two-Tab Interface

**Tab 1 — New Volunteers In Process (default)**
- Displays volunteers currently working through the onboarding process (application, interview, references, background check, etc.)
- Data source: `Group_Participants` for one or more specific Group IDs in Ministry Platform
- _Implementation note: Claude should prompt for the specific Group ID(s) at development time_

**Tab 2 — Approved Current Volunteers**
- Displays approved children's ministry volunteers
- Data source: `Participants` table (one record per person, 1:1 with actual people), filtered by:
  - Specific **Group Roles** (`Group_Roles` → `Group_Participants` → `Participants`), OR
  - Specific **Contact Milestones** (`Contact_Milestones` → `Participants` on `Contact_ID`)
- _Implementation note: Claude should prompt for the Milestone IDs and Group Role IDs at development time_

#### Card-Based Display (both tabs)

People are displayed as cards in an alphabetical grid sorted by last name:

- **Photo**: Participant's photo from their Contact record _(implementation note: ask how to retrieve the photo file — another tool in this app already pulls it from the Contact record attachment)_
- **Name**: `[Nickname] [Last_Name]`, centered below the photo
- **Requirement checklist**: A list of checkboxes representing required items and checks (e.g., application submitted, interview completed, references received, background check cleared, certifications on file). Each checkbox reflects whether the corresponding record/status exists in Ministry Platform.

#### Detail Modal

Clicking a card opens a modal with expanded information about that person:

- More detailed status of each requirement/check
- Links to the specific Ministry Platform page(s) for the person or related records
- Additional context or notes about the volunteer's progress

#### Write-Back to Ministry Platform

This interface should not be read-only. The volunteer processing team should be able to:

- Update statuses, check off completed requirements, and submit documentation (certificates, PDFs, etc.)
- Changes should create or update the corresponding records in Ministry Platform
- Goal: give the volunteer processing team a more efficient interface than navigating MP directly

#### ~~Completed: Final Director Approval Milestone~~ ✅ COMPLETED

Implemented as "Fully Approved Volunteer" (Milestone_ID = 33) with yellow star icon on card. Missing application/interview/reference items for fully-approved volunteers show yellow question mark ("presumed_complete" status). Also added optional "Elder Approved Teacher" milestone (Milestone_ID = 34) with blue graduation cap icon.

### ~~Volunteer Processing: Shareable Direct Links to Volunteer Modal ([#24](https://github.com/The-Moody-Church/mp-charts/issues/24))~~ ✅ COMPLETED
Add a URL-based deep link to open a specific volunteer's detail modal directly (e.g., `/volunteer-processing?volunteer=123`). This lets staff share a link to a specific volunteer's record with another staff person without them having to search for the card.

### ~~Volunteer Processing: Assign to Group on Approval ([#25](https://github.com/The-Moody-Church/mp-charts/issues/25))~~ ✅ COMPLETED
On the "New Volunteers In Process" tab, when a volunteer receives the fully approved star, add an "Assign to Group" button that reassigns their `Group_Participant` record from the volunteer-in-processing group to an active ministry group. The group picker should use the same list of groups available on the "Approved Active Volunteers" tab.

### Pastoral Interface for Contact Logs ([#19](https://github.com/The-Moody-Church/mp-charts/issues/19))
A dedicated pastoral interface for viewing and managing contact logs.

## Improvements

### Executive Dashboard: Mobile Views ([#13](https://github.com/The-Moody-Church/mp-charts/issues/13))
The mobile view needs redevelopment. Charts are squeezed and the data overlay when clicking on a data point is unruly and difficult to close. Redevelop and refine the mobile view strategy.

### ~~Executive Dashboard One Month Charts Fix ([#12](https://github.com/The-Moody-Church/mp-charts/issues/12))~~ ✅ COMPLETED
When only one month of data is selected on the executive dashboard, charts that normally show monthly averages should instead show individual data points. For example, if February is selected, the service attendance chart should show the four data points for February on their dates instead of a single average data point. This applies to all charts that show monthly averages.

### Hide Unused Modules in Production ([#6](https://github.com/The-Moody-Church/mp-charts/issues/6))
In production, hide modules that are not in use.

### Update Webpage Title ([#4](https://github.com/The-Moody-Church/mp-charts/issues/4))
Code currently says "Pastor App". Update the webpage tab name to "TMC MP Apps".

### Small Group Trends Chart ([#15](https://github.com/The-Moody-Church/mp-charts/issues/15))
The Small Group Trends line chart may not be the best visualization for this data. Consider switching to a bar chart or removing it entirely if it doesn't add enough value to the dashboard.

### ~~Dashboard Date Range Selector ([#20](https://github.com/The-Moody-Church/mp-charts/issues/20))~~ ✅ COMPLETED
Replace the hardcoded ministry year date ranges with an interactive date selector that includes comparison capabilities.

- **Two-row filter layout**:
  - **Top row (months)**: Preceding months going back in time on the left, current month button on the right
  - **Bottom row (years)**: Year buttons for selection
- **Multi-select**: Hold Ctrl/Cmd to select multiple months or years
- **Quick button**: "Ministry Year" preset (Sep–May)
- **Compare toggle**: Checkbox to compare against the previous period
  - Previous period = same selected date range but shifted back one year
  - Must handle ranges that span multiple years (e.g., Sep 2024–May 2025 compares to Sep 2023–May 2024)

## Technical Debt

### ~~Upgrade to Next.js 16~~ ✅ COMPLETED (2026-02-14)
Upgraded from Next.js 15.5.6 to 16.1.6 LTS. See session summary for details.

### Migrate `unstable_cache` to Cache Components (`use cache`) ⚠️ REVERTED (2026-02-14) ([#21](https://github.com/The-Moody-Church/mp-charts/issues/21))
Originally migrated to `'use cache'` directive with `cacheTag` and `cacheLife`, but reverted ([PR #10](https://github.com/The-Moody-Church/mp-charts/pull/10)) because the `'use cache'` directive is only available in Next.js canary builds, not stable releases. The codebase currently uses `unstable_cache`. Revisit when `'use cache'` lands in a stable Next.js release.

### Refine MP Permissions ([#7](https://github.com/The-Moody-Church/mp-charts/issues/7))
Refine Ministry Platform permissions for the application.

**Audit Log User Pass-Through**: When creating records (e.g., `Participant_Milestones` via `createTableRecords`), the `$userId` parameter is passed to the API, but Ministry Platform still records the API client user in the audit log rather than the logged-in user. This needs investigation — the goal is to have the actual logged-in user appear in the MP audit trail for all write operations. Explore whether the MP REST API supports user impersonation or an alternative mechanism for attributing writes to the authenticated user.

### Migrate `middleware.ts` to `proxy.ts` ([#22](https://github.com/The-Moody-Church/mp-charts/issues/22))
Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. However, `proxy.ts` uses the Node.js runtime (not edge). Evaluate whether the current edge-runtime middleware (using `next-auth/jwt` `getToken`) can work in the Node.js proxy runtime before migrating.


### BUG: No Volunteers in Production Builds ([#27](https://github.com/The-Moody-Church/mp-charts/issues/27))
There are no volunteers showing up in volunteer processing in the production builds. The All volunteers tab is hidden as expecte, but i'm not seeing any volunteers in progress, which i know there is at least one showinng up in dev. At this point, we can expore all the volunteer system to production, no need to keep it dev only any more.
