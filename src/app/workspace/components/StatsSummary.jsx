"use client";

import React, { useMemo } from "react";
import { Building2, GraduationCap, FileText, TrendingUp } from "lucide-react";

export function StatsSummary({ stats, selectedUniversityId, universities }) {
  const displayStats = useMemo(() => {
    if (selectedUniversityId === "all") {
      return {
        universities: universities?.length || 0,
        programs: stats?.totalPrograms || 0,
        essays: stats?.totalEssayPrompts || 0,
        completed: stats?.completedEssays || 0,
        words: stats?.totalWords || 0,
        progress: stats?.averageProgress || 0,
      };
    }

    const uniPrograms =
      stats?.programsByUniversity?.[selectedUniversityId] || [];
    const uniEssays = uniPrograms.reduce(
      (acc, p) => acc + (p.essays?.length || 0),
      0
    );
    const uniCompleted = uniPrograms.reduce(
      (acc, p) =>
        acc + (p.essays?.filter((e) => e.userEssay?.isCompleted).length || 0),
      0
    );
    const uniWords = uniPrograms.reduce(
      (acc, p) =>
        acc +
        (p.essays?.reduce((ea, e) => ea + (e.userEssay?.wordCount || 0), 0) ||
          0),
      0
    );

    return {
      universities: 1,
      programs: uniPrograms.length,
      essays: uniEssays,
      completed: uniCompleted,
      words: uniWords,
      progress: uniEssays > 0 ? (uniCompleted / uniEssays) * 100 : 0,
    };
  }, [stats, selectedUniversityId, universities]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">Universities</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.universities}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-500">Programs</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.programs}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Essays</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.completed}/{displayStats.essays}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-500">Total Words</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.words.toLocaleString()}
        </p>
      </div>
    </div>
  );
}