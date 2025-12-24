"use client";

import React, { useState } from "react";
import {
  Building2,
  GraduationCap,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

export function UniversitySelector({
  universities,
  selectedUniversityId,
  onSelect,
  stats,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUniversity = universities?.find(
    (u) => u.id === selectedUniversityId
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all min-w-[250px] hover:shadow-md active:scale-[0.98]"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: selectedUniversity?.color || "#002147" }}
        >
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#002147] truncate">
            {selectedUniversityId === "all"
              ? "All Universities"
              : selectedUniversity?.name || "Select University"}
          </p>
          <p className="text-xs text-gray-500">
            {selectedUniversityId === "all"
              ? `${universities?.length || 0} universities`
              : `${selectedUniversity?.programCount || 0} programs`}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
            {/* All Universities Option */}
            <button
              onClick={() => {
                onSelect("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                selectedUniversityId === "all" ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#002147]">
                  All Universities
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.totalPrograms || 0} programs •{" "}
                  {stats?.totalEssayPrompts || 0} essays
                </p>
              </div>
              {selectedUniversityId === "all" && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </button>

            <div className="border-t border-gray-100" />

            {/* Individual Universities */}
            {universities?.map((university) => {
              const uniPrograms =
                stats?.programsByUniversity?.[university.id] || [];
              const uniEssayCount = uniPrograms.reduce(
                (acc, p) => acc + (p.essays?.length || 0),
                0
              );

              return (
                <button
                  key={university.id}
                  onClick={() => {
                    onSelect(university.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                    selectedUniversityId === university.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: university.color || "#002147" }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#002147]">
                      {university.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {university.programCount} programs • {uniEssayCount}{" "}
                      essays
                    </p>
                  </div>
                  {selectedUniversityId === university.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}