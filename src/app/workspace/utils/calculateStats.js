export const calculateStats = (workspaceData) => {
  if (!workspaceData?.programs) return null;

  const stats = {
    totalPrograms: workspaceData.programs.length,
    totalEssayPrompts: 0,
    completedEssays: 0,
    totalWords: 0,
    programsByUniversity: {},
  };

  workspaceData.programs.forEach((program) => {
    if (!stats.programsByUniversity[program.universityId]) {
      stats.programsByUniversity[program.universityId] = [];
    }
    stats.programsByUniversity[program.universityId].push(program);

    if (program.essays) {
      stats.totalEssayPrompts += program.essays.length;

      program.essays.forEach((essay) => {
        if (essay.userEssay) {
          stats.totalWords += essay.userEssay.wordCount || 0;
          if (essay.userEssay.isCompleted) {
            stats.completedEssays++;
          }
        }
      });
    }
  });

  stats.averageProgress =
    stats.totalEssayPrompts > 0
      ? (stats.completedEssays / stats.totalEssayPrompts) * 100
      : 0;

  return stats;
};