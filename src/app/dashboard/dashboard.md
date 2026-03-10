# Altuvia Dashboard — Developer Reference

## Architecture Overview

The dashboard follows a strict separation of concerns: the page (`Index.jsx`) only composes and routes, data lives in a single hook (`useDashboardData`), and the backend controller delegates everything to pure utility functions.

```
Index.jsx
  ├── useDashboardData (SWR + auth + derived data)
  │     ├── createFetcher.js
  │     ├── useAuthGuard.js
  │     └── useRemoveUniversity.js
  └── UI Components
        ├── DashboardStaticComponents.jsx (BackgroundAnimation, HeroHeader, TabNavigation, EmptyState)
        ├── UniversitiesSection.jsx
        ├── StatsOverview, CVSummaryCard, UniversityTimeline
        └── LoadingView / AuthCheckView / ErrorView (skeletons)

Backend: GET /api/university/saved
  └── getSavedUniversities (controller)
        ├── universityQueryBuilder.js  (Prisma select shapes)
        ├── universityTransformer.js   (raw row → response shape)
        ├── statsAggregator.js         (aggregation + timeline map)
        ├── cvSummaryBuilder.js
        └── parseTestScores.js
```

---

## File Responsibilities

| File | What it does |
|------|-------------|
| `Layout.jsx` | Fixed sidebar, collapse toggle, active route detection, logout |
| `Index.jsx` | Composes UI, owns `activeTab` + `timelineCache` state, render guards |
| `DashboardStaticComponents.jsx` | Pure presentational blobs — all `React.memo`, no side effects |
| `useDashboardData.js` | Single data source: SWR fetch, derived data via `useMemo`, delegates sub-actions |
| `createFetcher.js` | Factory returning SWR fetcher bound to JWT token + API base URL |
| `useAuthGuard.js` | Detects JWT errors → `signOut` → redirect |
| `useRemoveUniversity.js` | Optimistic remove: update cache → POST API → rollback on failure |
| `calculateStats.js` | Client-side stats fallback (mirrors server aggregation) |
| `getSavedUniversities` | Express controller: parallel DB queries → filter → transform → respond |
| `universityQueryBuilder.js` | All Prisma select/where shapes, zero logic |
| `universityTransformer.js` | Maps raw Prisma university row to API shape, computes essay/task stats |
| `statsAggregator.js` | Single-pass aggregation across all universities, builds timeline Map |

---

## Data Flow

```
1. useSession() → status === "authenticated" && session.token
2. SWR key = "/api/university/saved" (null if not authed → no fetch)
3. createFetcher → GET /api/university/saved (Bearer token)
4. Controller: Promise.all([userProfile, user+universities, cvData, timelineData])
5. Filter universities by program.degreeType === userStudyLevel
6. transformUniversity() per university → essay/task stats computed in one pass
7. aggregateStats() → dashboard-level summary
8. Response → SWR cache → useMemo extracts universities, stats, userProfile, cvSummary
9. Index.jsx passes down to components
```

---

## API Response Shape

```js
{
  success: boolean,
  count: number,
  universities: University[],   // see below
  stats: StatsObject,
  userProfile: { studyLevel, gpa, testScores, workExperience },
  cvSummary: CVSummaryObject | null,
  timestamp: string,
}
```

### University Object (key fields)

```js
{
  id, name, slug, location,          // basics
  image, imageAlt,
  ftGlobalRanking, rank,             // e.g. "#12" or "N/A"
  status,                            // "not-started" | "in-progress" | "submitted"
  essayProgress,                     // 0-100, % of essay prompts completed
  taskProgress,                      // 0-100, % of calendar tasks completed
  overallProgress,                   // weighted: essays*0.7 + tasks*0.3
  totalEssays, completedEssays, inProgressEssays, notStartedEssays,
  totalTasks, tasks,                 // tasks = completedTasks count
  upcomingDeadlines,                 // count of future non-completed events
  deadline,                          // human-readable label
  aiTimeline,                        // TimelineObject | null
  requiresGMAT, requiresGRE, requiresIELTS, requiresTOEFL,  // from admissions
  userHasGMAT, userHasGRE, ...       // from parsed testScores
  stats: {
    tasks: { total, completed, completionRate },
    essays: { total, completed, inProgress, notStarted, completionRate },
    applicationHealth: { status, overallProgress, readyForSubmission }
  }
}
```

### Stats Object

```js
{
  total, inProgress, submitted, notStarted,
  upcomingDeadlines,
  totalTasks, completedTasks,
  totalEssays, completedEssays, inProgressEssays, notStartedEssays,
  averageProgress,                   // mean overallProgress across all universities
  universitiesReadyForSubmission,    // essays + tasks both fully complete
}
```

---

## Key Business Logic

### Application Status
Computed in `deriveApplicationStatus()` inside `universityTransformer.js`:

| Status | Condition |
|--------|-----------|
| `not-started` | No essays written AND no calendar events |
| `in-progress` | Has activity but essays or tasks incomplete |
| `submitted` | All prompts completed + all tasks completed (at least one of each must exist) |

### Essay "Completed" Rule (98% threshold)
An essay counts as completed if **any** is true:
- `essay.isCompleted === true`
- `essay.status === "COMPLETED"` or `"SUBMITTED"`
- `(wordCount / wordLimit) * 100 >= 98`

This threshold is hardcoded in `calcEssayStats()` — search for `>= 98` to change it.

### Overall Progress Weighting
```
has both essays & tasks  →  overallProgress = essayProgress * 0.7 + taskProgress * 0.3
essays only              →  overallProgress = essayProgress
tasks only               →  overallProgress = taskProgress
```

### Study Level Filtering
- Comes from `userProfile.studyLevel` (lowercased, e.g. `"mba"`)
- Programs filtered by `program.degreeType.toLowerCase() === userStudyLevel`
- If `studyLevel` is null → no filter, all programs shown

---

## Auth & Error Handling

**Token flow:** NextAuth JWT → `session.token` → passed to `createFetcher` and `useRemoveUniversity`

**JWT error detection** (`useAuthGuard.js`): checks if error message contains `jwt`, `token`, `expired`, `invalid` (case-insensitive) → calls `signOut({ redirect: false })` → `router.push("/onboarding/signup")`

**Optimistic remove flow** (`useRemoveUniversity.js`):
1. Immediately filter university from SWR cache (`rollbackOnError: true`)
2. POST `/api/university/toggleSaved` with `{ universityId }`
3. On 401 → `handleAuthError()` + restore server state
4. On any error → `mutate()` to rollback
5. On success → `mutate()` to confirm

---

## SWR Config (notable settings)

```js
dedupingInterval:      2000,   // suppress duplicate requests within 2s
focusThrottleInterval: 5000,   // cap focus-triggered revalidations
errorRetryCount:       3,
refreshInterval:       0,      // no polling — event-driven only
```

The `SWR_CONFIG` object is defined at **module level** in `useDashboardData.js` (stable reference, never recreated on render).

Stats preference: server-computed `data.stats` is used when available; `calculateStats(universities)` runs client-side only as a fallback.

---

## Sidebar Navigation (`Layout.jsx`)

- Sidebar is `position: fixed` so Lenis smooth-scroll controls the body independently
- Active route: **exact match** for `/dashboard`, **prefix match** for all others
- `comingSoon: true` items render as disabled `<button>` with a "SOON" ribbon — not a `<Link>`
- `menuItems` is wrapped in `useMemo` — won't recreate on re-render

---

## Common Change Scenarios

**Add a sidebar item** → edit `menuItems` array in `Layout.jsx`. Set `comingSoon: false` when ready.

**Add a new stat** → add field to `aggregateStats()` in `statsAggregator.js` (backend) AND mirror in `calculateStats.js` + update `EMPTY_STATS` constant.

**Add a new DB relation to dashboard** → add select shape in `universityQueryBuilder.js` → consume in `transformUniversity()` → add to return object.

**Change essay completion threshold** → find `>= 98` in `calcEssayStats()` inside `universityTransformer.js`.

**Timeline cache** → lives in `Index.jsx` state (`timelineCache`), keyed by university ID. No persistence — clears on navigation.