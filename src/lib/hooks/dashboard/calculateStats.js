/**
 * calculateStats.js  (hook utility)
 *
 * Shared stats calculator — identical logic to controller's aggregateStats
 * but for the frontend (no import from server modules).
 * Pure function, no imports, zero side-effects.
 */

const EMPTY_STATS = {
  total: 0,
  inProgress: 0,
  submitted: 0,
  notStarted: 0,
  upcomingDeadlines: 0,
  totalTasks: 0,
  completedTasks: 0,
  totalEssays: 0,
  completedEssays: 0,
  inProgressEssays: 0,
  notStartedEssays: 0,
  averageProgress: 0,
  fullyCompletedUniversities: 0,
  universitiesReadyForSubmission: 0,
};

/**
 * @param {Array|null|undefined} uniArray
 * @returns {object}
 */
export function calculateStats(uniArray) {
  if (!uniArray?.length) return { ...EMPTY_STATS };

  let inProgress = 0, submitted = 0, notStarted = 0;
  let upcomingDeadlines = 0, totalTasks = 0, completedTasks = 0;
  let totalEssays = 0, completedEssays = 0, inProgressEssays = 0, notStartedEssays = 0;
  let totalProgress = 0, universitiesReadyForSubmission = 0;

  for (const u of uniArray) {
    if      (u.status === 'in-progress') inProgress++;
    else if (u.status === 'submitted')   submitted++;
    else                                 notStarted++;

    upcomingDeadlines  += u.upcomingDeadlines  ?? 0;
    totalTasks         += u.totalTasks         ?? 0;
    completedTasks     += u.tasks              ?? 0;
    totalEssays        += u.totalEssays        ?? 0;
    completedEssays    += u.completedEssays    ?? 0;
    inProgressEssays   += u.inProgressEssays   ?? 0;
    notStartedEssays   += u.notStartedEssays   ?? 0;
    totalProgress      += u.overallProgress    ?? 0;

    if (u.stats?.applicationHealth?.readyForSubmission)
      universitiesReadyForSubmission++;
  }

  return {
    total: uniArray.length,
    inProgress,
    submitted,
    notStarted,
    upcomingDeadlines,
    totalTasks,
    completedTasks,
    totalEssays,
    completedEssays,
    inProgressEssays,
    notStartedEssays,
    averageProgress: Math.round(totalProgress / uniArray.length) || 0,
    fullyCompletedUniversities: submitted,
    universitiesReadyForSubmission,
  };
}