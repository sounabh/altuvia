export const filterPrograms = (workspaceData, selectedUniversityId, filterStatus) => {
  if (!workspaceData?.programs) return [];

  let programs = workspaceData.programs;

  // Filter by university
  if (selectedUniversityId !== "all") {
    programs = programs.filter(
      (p) => p.universityId === selectedUniversityId
    );
  }

  // Filter by essay status
  if (filterStatus !== "all") {
    programs = programs
      .map((program) => ({
        ...program,
        essays: program.essays?.filter((essay) => {
          if (filterStatus === "completed")
            return essay.userEssay?.isCompleted;
          if (filterStatus === "in-progress")
            return essay.userEssay && !essay.userEssay.isCompleted;
          if (filterStatus === "not-started") return !essay.userEssay;
          return true;
        }),
      }))
      .filter((p) => p.essays?.length > 0);
  }

  // Filter out programs with no essays
  programs = programs.filter((p) => p.essays && p.essays.length > 0);

  return programs;
};