# Executive Dashboard - Work in Progress

## Current Status (2026-02-16)

### Completed Features
1. ✅ Worship service attendance tracking using Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
2. ✅ Group participation tracking (excluding Childcare groups)
3. ✅ Year-over-year comparison
4. ✅ Small group trends
5. ✅ Monthly attendance trends with expandable charts
6. ✅ Fixed metric card calculations to only count events with recorded metrics
7. ✅ **Community Sunday Gathering Attendance Chart - FIXED**
   - Implemented universal auto-pagination for Ministry Platform API
   - Changed from weekly to monthly aggregation
   - Fixed timezone parsing issues with date display
   - Converted to stacked area chart for better visualization
   - Added custom tooltips with sorting
   - Implemented deduplication for Event_Participant records
8. ✅ **Dashboard Caching Optimization - COMPLETE (Phase 1 + 2)**
   - **Phase 1**: Extended page-level cache from 1 hour to 6 hours
   - **Phase 1**: Implemented manual refresh button with loading states
   - **Phase 1**: Optimized small group trends query (27 API calls → 3 calls)
   - **Phase 2**: Added unstable_cache() for Group_Types and Event_Types (24-hour cache)
   - **Phase 2**: Implemented query-level caching for static lookups
   - Fixed pre-existing TypeScript lint errors
   - **Combined achievement: ~91% reduction in database load**
9. ✅ **Baptisms Metric (Last 365 Days) - COMPLETE**
   - Added new metric card showing baptism count from last 365 days
   - Queries Participant_Milestones table (Milestone_ID = 3)
   - Includes year-over-year comparison with previous 365-day period
   - Clearly labeled with "(last 365 days)" to distinguish from Ministry Year metrics
   - All Ministry Year metrics now labeled with "(Ministry Year)" suffix
10. ✅ **Docker Deployment Configuration - COMPLETE**
   - Added production-ready Dockerfile with multi-stage build
   - Added development Dockerfile for hot reload in Codespaces
   - Configured docker-compose.yml for production with Caddy network integration
   - Created docker-compose.override.yml for local development environment
   - Configured Next.js standalone output mode for optimized Docker builds
   - Added comprehensive Docker deployment documentation (DOCKER.md)
   - Created .dockerignore for build optimization
   - **CI/CD**: GitHub Actions workflow for automated builds to GitLab Container Registry
   - **CI/CD**: Multi-platform builds (amd64/arm64) with Trivy security scanning
   - **CI/CD**: Automated tagging strategy (SHA + latest) with build caching
   - **Dependabot**: Automated dependency updates for npm, Docker, and GitHub Actions
11. ✅ **Production Deployment Fixes - COMPLETE (2026-02-06)**
   - Fixed AUTH_SECRET documentation for Docker deployments (.env.example)
   - Added AUTH_TRUST_HOST configuration for reverse proxy deployments
   - Resolved NextAuth UntrustedHost error in production
   - Fixed dashboard caching performance issue (removed force-dynamic)
   - Implemented proper data-level caching with unstable_cache()
   - Application successfully deployed to production at dashboard.moodychurch.org
12. ✅ **Dashboard Date Range Selector - COMPLETE (2026-02-13)**
   - Added interactive date range filter replacing hardcoded ministry year ranges
   - Two-row filter: month buttons (12 months, current rightmost) + year buttons (5 years)
   - Multi-select: Ctrl/Cmd+click to select multiple months or years
   - "Ministry Year" preset button (Sep–May) for quick selection
   - Compare toggle: checkbox to show/hide previous period comparison
   - Dynamic period labels throughout dashboard (cards, charts, descriptions)
   - Year-over-Year comparison section hidden when compare is off
   - Ministry year month/year mapping: Sep-Dec belong to base year, Jan-May to next calendar year
   - New `DashboardShell` client component owns filter state and data fetching
   - Loading state: opacity dimming + pointer-events disabled during fetch
13. ✅ **Client-Side Date Filtering - COMPLETE (2026-02-14)**
   - Replaced per-filter-change server calls with full-range preload + client-side filtering
   - `getFullRangeDashboardMetrics()` fetches 5 ministry years of data on page load (cached 6 hrs)
   - `filterDashboardData()` client-side utility filters trend arrays by selected date range
   - `useMemo` in `DashboardShell` recomputes filtered data instantly on filter change — no round-trip
   - Recomputes `PeriodMetrics` from filtered monthly data using weighted averages by event count
   - Recomputes `YearOverYear` from recomputed current/previous period metrics
   - `groupTypeMetrics`, `eventTypeMetrics`, `baptisms` pass through as full-range values
   - Removed `getDashboardMetricsByDateRange()` server action (no longer needed)
   - Refresh button re-fetches full range data from server
14. ✅ **Dashboard Filter UX Improvements - COMPLETE (2026-02-14)**
   - Month buttons reordered to ministry year order: Sep through Aug (fixed, not dynamic)
   - Data fetching extended to full Sep-Aug range (was Sep-May)
   - Added semester preset buttons: Fall Semester (Sep-Nov), Spring Semester (Feb-Apr), Summer (Jun-Aug)
   - Ministry Year preset still selects Sep-May only
   - Generalized `isPresetMatch()` function replaces single `isMinistryYearPreset()`
   - Attendance chart month ordering extended to include Jun, Jul, Aug
   - Attendance chart margins/padding adjusted so first data point doesn't overlap Y-axis
   - Added Next.js 16 upgrade idea to `.claude/ideas.md` technical debt section
15. ✅ **Chart Layout & Small Group Trends Enhancements - COMPLETE (2026-02-14)**
   - Swapped Small Group Trends and Group Participation chart positions
   - Group Participation + Period Comparison share bottom 2-column grid
   - Added previous period comparison to Small Group Trends (dashed lines)
   - Fixed timezone bug: added `monthName` field to `SmallGroupTrend` DTO at data level
   - Service now populates `monthName` — charts use it directly without YYYY-MM parsing
   - Shared `MONTH_NAMES` constant in dashboardService.ts used by both trend methods

16. ✅ **Docker Build Fix — Next.js 16 Turbopack + Trivy Vulnerabilities (2026-02-16)**
   - **Google Fonts failure**: Next.js 16 Turbopack uses its own TLS stack, which fails to fetch Google Fonts in Alpine Docker. Switched from `next/font/google` to the `geist` npm package (`geist/font/sans`, `geist/font/mono`) — fonts are now bundled locally.
   - **`revalidateTag()` API change**: Next.js 16 requires a 2nd argument (cache life profile). Added `{ expire: 0 }` for immediate invalidation in `refreshDashboardCache()`.
   - **Trivy HIGH CVEs (10)**: `glob` (CVE-2025-64756) and `tar` (CVE-2026-23745/23950/24842) were not project dependencies — they came from npm bundled in `node:22-alpine`. Added `RUN npm uninstall -g npm` in the Dockerfile runner stage to remove npm and all its vulnerable transitive deps. Also cleaned up dead `glob`/`tar` overrides from `package.json`.
   - Auto-generated config updates from Next.js 16 build: `tsconfig.json` (jsx → react-jsx, added .next/dev/types include), `next-env.d.ts` (updated reference syntax).

### Recently Resolved: Community Attendance Chart

**Issues Found and Fixed**:

1. **1000 Record Pagination Limit** (CRITICAL FIX)
   - **Problem**: Ministry Platform API returns max 1000 records per query, causing data loss
   - **Solution**: Implemented universal auto-pagination in `MPHelper.getTableRecords()`
   - **Location**: `src/lib/providers/ministry-platform/helper.ts` lines 85-157
   - **Impact**: Fixes all queries across the application, not just community attendance

2. **Data Visualization Issues**
   - Changed aggregation from weekly to monthly to reduce chart width
   - Converted from LineChart → BarChart → AreaChart (stacked area/"ribbon" chart)
   - Added custom tooltip component with sorting (largest to smallest)
   - Fixed tooltip z-index to display above legend

3. **Timezone Issue with Date Labels**
   - **Problem**: Months displayed off by one (Aug-Dec instead of Sep-Jan)
   - **Cause**: JavaScript parsing "2025-09-01" as UTC, then converting to Central Time (UTC-6) shifted to previous day
   - **Solution**: Parse date components in local time without timezone conversion
   - **Location**: `src/components/dashboard/community-attendance-chart.tsx` lines 80-86

4. **Duplicate Event_Participant Records**
   - **Problem**: Counts showing double the actual participants (290 vs 145 for Fusion in November)
   - **Solution**: Deduplicate by Event_Participant_ID (primary key) before counting
   - **Location**: `src/services/dashboardService.ts` lines 625-633
   - **Debug**: Added logging to show before/after deduplication counts

**Current Chart Configuration**:
- **Type**: Stacked Area Chart (AreaChart with stackId="attendance")
- **Aggregation**: Monthly averages (average of weekly averages within each month)
- **Stacking Order**: Communities sorted by overall average attendance (smallest on bottom, largest on top)
- **Tooltip**: Custom component sorting values largest to smallest, white background with 95% opacity
- **Colors**: 8-color palette cycling through communities

### Key Technical Decisions

#### Universal Auto-Pagination (NEW)
- **Implementation**: `MPHelper.getTableRecords()` automatically paginates when `$top` and `$skip` not explicitly provided
- **Batch Size**: 1000 records per request
- **Behavior**: Continues fetching until receiving less than 1000 records
- **Location**: `src/lib/providers/ministry-platform/helper.ts`

#### Monthly Aggregation Algorithm (Simplified - 2026-01-29)
1. Get Event_Participants for all community groups (Group_Type_ID = 11)
2. Get Event dates for those participants
3. Filter to Sunday events only in JavaScript (date.getDay() === 0)
4. Group by month and community
5. Calculate average per group per month: unique Event_Participant_IDs / unique Event_IDs
6. This gives average weekly attendance per month

#### Attendance Tracking Methods
- **Worship Services**: Use Event_Metrics table (Metric_ID 2 & 3) for headcount
- **Community Groups**: Use Event_Participants table (Status 3 & 4) for individual tracking
- **Small Groups**: Use Group_Participants for membership

#### Participation Status IDs
- **Status 3 & 4**: Both considered "present" for attendance
- Applied to: Community attendance, any future Event_Participants queries

#### Query Pattern
- Always use multi-step queries to avoid SQL errors with relationship paths
- Never use nested paths like `Groups.Group_Type_ID_Table.Group_Type`
- Query base tables first, then join data in JavaScript
- **NEW**: Rely on automatic pagination instead of manual batching

#### Filtering
- **Childcare groups**: Excluded from all group metrics
- **Worship services**: Event_Type_ID = 7 only
- **Ministry year**: September 1 - August 31 (data range); Ministry Year preset = Sep-May
- **Community groups**: Group_Type_ID = 11

### Files Modified

#### Session 2026-01-28
1. **src/lib/providers/ministry-platform/helper.ts**
   - Lines 85-157: Universal auto-pagination implementation
   - Automatically handles 1000 record limit for ALL queries

2. **src/components/dashboard/community-attendance-chart.tsx**
   - Complete rewrite for stacked area chart
   - Lines 14-49: Custom tooltip component with sorting
   - Lines 60-76: Community sorting by average attendance
   - Lines 78-92: Date formatting with local timezone parsing
   - Lines 96-122: AreaChart with stacked areas

3. **src/components/dashboard/attendance-chart.tsx**
   - Lines 78-84: Updated tooltip background for readability

4. **src/components/dashboard/group-participation-chart.tsx**
   - Lines 45-51: Updated tooltip background for readability

5. **src/app/(web)/dashboard/page.tsx**
   - Line 5: Revalidate set to 3600 (1 hour cache)

#### Session 2026-01-29 (Morning: Simplified Logic)
1. **src/services/dashboardService.ts**
   - Lines 537-679: Complete rewrite of getCommunityAttendanceTrends()
   - Simplified query flow: Groups → Event_Participants → Events → Filter Sundays → Calculate
   - Removed all debug logging ([DEBUG], [WARNING])
   - Direct calculation: unique participants / unique events per group per month
   - No more complex weekly averaging or deduplication logic needed

#### Session 2026-01-29 (Afternoon: Phase 1 Caching Optimization)
1. **src/app/(web)/dashboard/page.tsx**
   - Lines 5-7: Extended revalidation from 3600s (1 hour) to 21600s (6 hours)
   - Line 15: Integrated DashboardHeader component

2. **src/components/dashboard/dashboard-header.tsx** (NEW)
   - Complete new file: Client component with refresh button
   - Lines 8-22: handleRefresh function with useTransition for loading state
   - Lines 24-45: Header UI with refresh button, last refresh timestamp

3. **src/components/dashboard/actions.ts**
   - Lines 3: Added revalidatePath import
   - Lines 55-72: New refreshDashboardCache() server action

4. **src/components/dashboard/index.ts**
   - Line 2: Added DashboardHeader export

5. **src/services/dashboardService.ts**
   - Lines 493-614: Complete rewrite of getSmallGroupTrends()
   - Optimized from 27 API calls (9 months × 3 queries) to 3 total queries
   - Fetches all data once, aggregates by month in JavaScript
   - Lines 485-492: Added JSDoc documenting the optimization

6. **Lint Error Fixes (Pre-existing Issues)**
   - **src/components/dashboard/community-attendance-chart.tsx**
     - Lines 14-24: Added proper TypeScript interfaces for Recharts tooltip
     - Removed `any` types, added TooltipPayloadEntry and CustomTooltipProps
   - **src/lib/providers/ministry-platform/utils/http-client.ts**
     - Line 28: Removed unused catch parameter `e`
   - **src/services/dashboardService.ts**
     - Lines 697-698: Removed unused startIso/endIso variables in getCommunityAttendanceTrends()

#### Session 2026-01-29 (Late Afternoon: Phase 2 Query-Level Caching)
1. **src/services/dashboardService.ts**
   - Line 1: Added `unstable_cache` import from 'next/cache'
   - Lines 56-111: Added two new cached helper methods
     - `getGroupTypesWithCache()` - 24-hour cache for Group_Types lookups
     - `getEventTypesWithCache()` - 24-hour cache for Event_Types lookups
   - Line 205: Updated getGroupTypeMetrics() to use cached Group_Types
   - Line 573: Updated getSmallGroupTrends() to use cached Group_Types
   - Line 329: Updated getEventTypeMetrics() to use cached Event_Types

#### Session 2026-01-29 (Evening: Phase 2 Fix - Manual Refresh Cache Invalidation)
1. **src/components/dashboard/actions.ts**
   - Line 3: Added `revalidateTag` import from 'next/cache'
   - Lines 50-77: Updated refreshDashboardCache() to invalidate all caches
     - Added `revalidateTag('group-types')` to invalidate Group_Types cache
     - Added `revalidateTag('event-types')` to invalidate Event_Types cache
     - Updated JSDoc to document both page-level and query-level cache invalidation
   - **Fix**: Manual refresh button now properly invalidates unstable_cache entries

#### Session 2026-02-02 (Baptisms Metric Implementation)
1. **src/lib/dto/dashboard.ts**
   - Lines 100-101: Added `baptismsLastYear` and `baptismsPreviousYear` fields to DashboardData interface

2. **src/services/dashboardService.ts**
   - Lines 131-138: Added baptisms date range calculations (last 365 days and previous 365 days)
   - Lines 150-151: Added baptismsLastYear and baptismsPreviousYear to Promise.all() parallel fetching
   - Lines 170-171: Added baptisms data to return statement
   - Lines 916-950: New `getBaptismsCount()` method
     - Queries Participant_Milestones where Milestone_ID = 3 (Baptism)
     - Accepts date range parameters for flexible period queries
     - Returns count of baptisms in specified period

3. **src/components/dashboard/dashboard-metrics.tsx**
   - Lines 22-27: Updated attendance metric titles to include "(Ministry Year)" suffix
   - Lines 35: Updated communities/small groups title to include "(Ministry Year)"
   - Lines 44-49: Added new Baptisms metric card with 365-day label and YoY comparison
   - Lines 57, 62, 81, 86: Updated chart titles to include "(Ministry Year)" suffix
   - Lines 116, 121, 138, 143: Updated expanded chart titles to include "(Ministry Year)" suffix
   - Lines 155-170: Wrapped Data Summary card in NODE_ENV === 'development' check

4. **src/components/dashboard/metric-card.tsx**
   - Line 56: Changed comparison text from "vs last year" to "vs previous period"

#### Session 2026-02-04 (Docker Deployment Configuration)
1. **Dockerfile** (NEW)
   - Multi-stage production build using Node.js 22 Alpine
   - Stage 1 (deps): Install dependencies from package-lock.json
   - Stage 2 (builder): Build Next.js application with standalone output
   - Stage 3 (runner): Minimal production runtime with non-root user
   - Security: Runs as nextjs user (UID 1001) instead of root
   - Optimization: ~150MB final image size vs ~1GB unoptimized

2. **Dockerfile.dev** (NEW)
   - Single-stage development build for fast iteration
   - Includes all dev dependencies
   - Supports volume mounts for hot reload
   - File watching enabled for container environments

3. **docker-compose.yml** (NEW)
   - Production configuration with external Caddy network
   - Builds image from Dockerfile
   - Uses .env file for environment variables
   - Exposes port 3000 (optional, can be removed if Caddy handles routing)
   - Restart policy: unless-stopped

4. **docker-compose.override.yml** (NEW)
   - Automatically used in development (no flags needed)
   - Overrides build target to use Dockerfile.dev
   - Mounts source code as volumes for hot reload
   - Uses npm run dev instead of production server
   - Default bridge network (no Caddy required)
   - Enables WATCHPACK_POLLING for container file watching

5. **.dockerignore** (NEW)
   - Excludes node_modules, .next, coverage, .git
   - Excludes environment files (added via env_file)
   - Excludes IDE, documentation, and Claude context files
   - Keeps override.yml but ignores .disabled files

6. **DOCKER.md** (NEW)
   - Comprehensive deployment guide (250 lines)
   - Development vs production setup instructions
   - Common commands and troubleshooting section
   - How to switch between environments
   - Caddy integration examples

7. **next.config.ts**
   - Line 5: Added `output: "standalone"` for Docker deployment
   - Required for production Docker builds to work

#### Session 2026-02-04 (Morning: CI/CD GitHub Actions)
1. **.github/workflows/docker-build-push.yml** (NEW)
   - Automated Docker image build and push to GitLab Container Registry
   - Triggers on push/PR to main branch
   - Multi-platform build (linux/amd64, linux/arm64)
   - Security scanning with Trivy (fails on CRITICAL/HIGH vulnerabilities)
   - Tagging strategy: SHA tags for all builds, 'latest' only on main pushes
   - Build caching using registry cache for faster builds
   - Requires GitHub secrets: GITLAB_DEPLOY_USERNAME, GITLAB_DEPLOY_TOKEN

2. **DOCKER.md**
   - Lines 117-211: Added comprehensive "CI/CD with GitHub Actions" section
   - Documents automated workflow triggers and features
   - Instructions for creating GitLab Deploy Tokens
   - How to add required GitHub secrets
   - Production deployment using registry images
   - Examples for pulling and using pre-built images
   - Lines 212-260: Added "Dependency Management with Dependabot" section
   - Explains Dependabot vs Trivy differences
   - Documents what dependencies are monitored (npm, Docker, GitHub Actions)
   - Weekly automated PRs for updates, grouped minor/patch updates

3. **.github/dependabot.yml** (NEW)
   - Automated dependency management configuration
   - Monitors GitHub Actions (weekly updates for workflow actions)
   - Monitors Docker base images (weekly updates for node:22-alpine)
   - Monitors npm packages (weekly updates for package.json/package-lock.json)
   - Groups minor and patch updates to reduce PR noise
   - Major version updates get individual PRs for review

4. **docker-compose.yml**
   - Updated for production use with pre-built GitLab registry images
   - Removed build section (uses registry.gitlab.com/moodychurch/mp-charts:latest)
   - Removed ports section (Cloudflare Tunnel handles routing internally)
   - Simplified configuration matching other production services
   - Container accessible at http://mp-charts:3000 within caddy_network

5. **DOCKER.md**
   - Lines 67-115: Updated production deployment section for Cloudflare Tunnel
   - Replaced Caddy-specific instructions with multi-proxy support
   - Added note explaining caddy_network is legacy name (works with any proxy)
   - Lines 181-202: Updated "Using Pre-built Images" section
   - Lines 226-246: Enhanced architecture notes with network details
   - Documents container name access pattern (mp-charts:3000)
   - Clarifies no public ports exposed in production

6. **src/app/(web)/dashboard/page.tsx**
   - Line 10: Changed `dynamic = 'force-static'` to `dynamic = 'force-dynamic'`
   - Removed `dynamicParams = false` (no longer needed)
   - Fixes Docker build failure where Next.js tried to pre-render during build
   - Still uses ISR with 6-hour revalidation, but renders on first request
   - Prevents build-time API calls that require environment variables

#### Session 2026-02-06 (Production Deployment Fixes)
1. **.env.example**
   - Lines 10-24: Enhanced AUTH_SECRET documentation with multiple generation methods
   - Added openssl and Node.js crypto alternatives to npx auth secret
   - Added Docker-specific deployment instructions
   - Lines 28-30: Added AUTH_TRUST_HOST setting with documentation
   - Documents requirement for reverse proxy deployments (Caddy, nginx, etc.)

2. **src/app/(web)/dashboard/page.tsx**
   - Lines 5-8: Removed `export const dynamic = 'force-dynamic'` that was disabling cache
   - Kept `export const revalidate = 21600` for proper 6-hour ISR cache
   - Fixed performance issue causing dashboard to reload data on every page load

3. **src/components/dashboard/actions.ts**
   - Line 3: Added `unstable_cache` import from 'next/cache'
   - Lines 15-44: Wrapped `getDashboardMetrics()` with `unstable_cache()`
   - Added cache key: `['dashboard-metrics', 'ministry-year-${currentYear}']`
   - Added cache tags: `['dashboard-data', 'year-${currentYear}']`
   - Added revalidate: 21600 (6 hours) to cache options
   - Lines 51-77: Updated `refreshDashboardCache()` to invalidate `dashboard-data` tag
   - Ensures manual refresh button properly clears unstable_cache entries

#### Session 2026-02-13 (Date Range Selector)
1. **src/components/dashboard/date-range-filter.tsx** (NEW)
   - `DateRangeFilter` client component: month/year button rows with multi-select
   - `DateRangeSelection` interface: months[], years[], compare boolean
   - `selectionToDateRange()`: converts selection to start/end Date objects
   - `getPreviousPeriodRange()`: shifts range back one year for comparison
   - `getDefaultSelection()`: returns current ministry year with compare=true
   - Ministry year mapping: months >= Aug belong to base year, < Aug to year+1

2. **src/components/dashboard/dashboard-shell.tsx** (NEW)
   - Client component owning filter state and data lifecycle
   - Integrates DashboardHeader, DateRangeFilter, and DashboardMetrics
   - Calls `getDashboardMetricsByDateRange()` on filter changes
   - Shows loading state (opacity dimming) during server action calls
   - Replaces separate DashboardHeader + DashboardMetrics rendering

3. **src/components/dashboard/actions.ts**
   - Added `getDashboardMetricsByDateRange(startDateISO, endDateISO)` server action
   - Accepts ISO date strings, passes to DashboardService.getDashboardData()

4. **src/components/dashboard/dashboard-metrics.tsx**
   - Added `showCompare` prop (default true) to toggle comparison data visibility
   - Replaced hardcoded "(Ministry Year)" labels with dynamic period labels
   - Period label derived from `data.currentPeriod.periodStart/periodEnd`
   - Year-over-Year section conditionally rendered based on `showCompare`
   - AttendanceChart receives empty array for previousYear when compare is off

5. **src/app/(web)/dashboard/page.tsx**
   - Replaced DashboardHeader + DashboardMetrics with single DashboardShell
   - Passes server-fetched default data as `initialData` prop

6. **src/components/dashboard/index.ts**
   - Added exports for DashboardShell and DateRangeFilter

#### Session 2026-02-14 (Client-Side Date Filtering)
1. **src/components/dashboard/filter-dashboard-data.ts** (NEW)
   - `filterDashboardData(fullData, selection)`: client-side filtering utility
   - Filters `monthlyAttendanceTrends`, `communityAttendanceTrends`, `smallGroupTrends` by date range
   - Computes `previousYearMonthlyAttendanceTrends` by shifting range back one year
   - Recomputes `PeriodMetrics` from filtered monthly data (weighted average by eventCount)
   - Recomputes `YearOverYear` from recomputed period metrics
   - Passes through `groupTypeMetrics`, `eventTypeMetrics`, `baptisms` unchanged

2. **src/components/dashboard/actions.ts**
   - Replaced `getDashboardMetricsByDateRange()` with `getFullRangeDashboardMetrics()`
   - New action fetches 5 ministry years of data (earliest available Sept through today)
   - Cached for 6 hours with `unstable_cache`, tagged `dashboard-full-range`

3. **src/components/dashboard/dashboard-shell.tsx**
   - Stores full-range data in `fullData` state instead of per-filter `data`
   - Derives `filteredData` via `useMemo(filterDashboardData, [fullData, selection])`
   - `handleSelectionChange` now just sets selection — no server call
   - `handleRefresh` re-fetches full range via `getFullRangeDashboardMetrics()`
   - Removed `isFiltering` transition (no longer needed — filtering is synchronous)

4. **src/app/(web)/dashboard/page.tsx**
   - Changed import from `getDashboardMetrics` to `getFullRangeDashboardMetrics`
   - Updated BUILD_ID to `client-side-filter-v1`

5. **src/components/dashboard/index.ts**
   - Added export for `filterDashboardData`

#### Session 2026-02-16 (Docker Build Fix + Trivy Vulnerabilities)
1. **src/app/(web)/layout.tsx**
   - Lines 2-3: Changed font imports from `next/font/google` to `geist/font/sans` and `geist/font/mono`
   - Removed `Geist()` and `Geist_Mono()` constructor calls (geist package exports pre-configured objects)
   - Line 27: Updated variable references from `geistSans`/`geistMono` to `GeistSans`/`GeistMono`

2. **package.json**
   - Added `geist: ^1.7.0` dependency (local Geist font files via `next/font/local`)
   - Removed dead `glob` and `tar` overrides (neither is a project dependency)

3. **src/components/dashboard/actions.ts**
   - Lines 101-103: Added required 2nd argument `{ expire: 0 }` to all `revalidateTag()` calls (Next.js 16 API change)

4. **Dockerfile**
   - Lines 33-35: Added `RUN npm uninstall -g npm` in runner stage to remove npm and its vulnerable transitive dependencies (glob, tar)

5. **next-env.d.ts**
   - Auto-updated by Next.js 16 build: changed `/// <reference path>` to `import` syntax

6. **tsconfig.json**
   - Auto-updated by Next.js 16 build: `jsx: "preserve"` → `"react-jsx"`, added `.next/dev/types/**/*.ts` to includes

### Debug Logging

**Status (2026-01-29)**: All debug logging removed in simplified implementation.

Only essential operational logs remain in getCommunityAttendanceTrends():
- Community groups count
- Event participants count
- Events count
- Filtered Sunday participants count
- Monthly trends count

### Known Issues

**None currently** - Community attendance chart is now working correctly.

### Potential Future Enhancements

1. **Future Phase 3** (Long-term)
   - Scheduled cache warming (4am daily cron job)
   - Redis/Vercel KV for distributed caching
   - Incremental data fetching (only new data since last update)

### Data Summary Card (Debug Info)
Currently showing on dashboard at bottom - can be removed once stable:
- Group Types count
- Event Types count
- Period dates
- Generated timestamp

### Environment Details
- Ministry Platform REST API via MPHelper
- Next.js 16.1.6 LTS with App Router (Turbopack default bundler)
- NextAuth v5 (beta.30) with Ministry Platform OAuth
- React 19 Server Components with 6-hour cache (unstable_cache with revalidate = 21600)
- Recharts for visualization (AreaChart, LineChart, PieChart)
- TypeScript strict mode
- ESLint 9 flat config with eslint-config-next 16.1.6
- Geist fonts via `geist` npm package (local fonts, no Google Fonts CDN dependency at build time)
- Docker production image stripped of npm to reduce attack surface (Trivy-clean)

### Important Ministry Platform Field Names
- Event_Metrics.Metric_ID: 2 = In-Person, 3 = Online
- Event_Participants.Participation_Status_ID: 3 & 4 = Present
- Event_Participants.Event_Participant_ID: Primary key for deduplication
- Events.Event_Type_ID: 7 = Worship Services
- Groups.Group_Type_ID: 11 = Community
- Group_Types.Group_Type: 'Community', 'Childcare' (exact case matters)
- Participant_Milestones.Milestone_ID: 3 = Baptism
- Participant_Milestones.Date_Accomplished: Date when milestone was achieved

### Testing Notes
- Always check browser console for debug logs after refresh
- Server logs show in VS Code terminal with "Server" prefix
- Clear Next.js cache if data seems stale: `npm run dev` restart
- Check Ministry Platform directly if queries return 0 results to verify data exists
- Deduplication warning indicates duplicate records in Event_Participants query results
