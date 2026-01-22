import React, { useMemo } from 'react';

// ============================================
// SECTION DIVIDER COMPONENT
// ============================================
export const SectionDivider = () => (
  <div className="my-10 flex items-center gap-4">
    <div className="flex-1 h-px bg-gray-200"></div>
    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
    <div className="flex-1 h-px bg-gray-200"></div>
  </div>
);

// ============================================
// PROGRESS SUMMARY COMPONENT
// Displays overall essay and task completion rates
// ============================================
export const ProgressSummary = ({ universities }) => {
  const summary = useMemo(() => {
    if (universities.length === 0) return null;
    
    const totalEssays = universities.reduce((sum, u) => sum + (u.totalEssays || 0), 0);
    const completedEssays = universities.reduce((sum, u) => sum + (u.completedEssays || 0), 0);
    const totalTasks = universities.reduce((sum, u) => sum + (u.totalTasks || 0), 0);
    const completedTasks = universities.reduce((sum, u) => sum + (u.tasks || 0), 0);
    
    const essayCompletionRate = totalEssays > 0 ? 
      Math.round((completedEssays / totalEssays) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalEssays,
      completedEssays,
      totalTasks,
      completedTasks,
      essayCompletionRate,
      taskCompletionRate
    };
  }, [universities]);

  if (!summary) return null;
  
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-100">
      <h2 className="text-lg font-semibold text-[#002147] mb-4">Overall Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Essays Completed</span>
            <span className="text-sm font-bold text-[#002147]">
              {summary.completedEssays}/{summary.totalEssays}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className="bg-[#3598FE] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.essayCompletionRate}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.essayCompletionRate}% Complete
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Tasks Completed</span>
            <span className="text-sm font-bold text-[#002147]">
              {summary.completedTasks}/{summary.totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.taskCompletionRate}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.taskCompletionRate}% Complete
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOADING SKELETON COMPONENTS
// ============================================
export const LoadingSkeletons = {
  Stats: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),

  ProgressSummary: () => (
    <div className="bg-white/60 rounded-2xl p-6 mb-8 border border-gray-100 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
          </div>
        ))}
      </div>
    </div>
  ),

  UniversityCard: () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  ),

  CVSummary: () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  Timeline: () => (
    <div className="space-y-6">
      <div className="bg-[#002147] rounded-2xl p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
          <div className="flex-1">
            <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  )
};