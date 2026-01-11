"use client";

import React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Heart,
  Sparkles,
} from "lucide-react";

const sections = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "volunteer", label: "Volunteer & Extra", icon: Heart },
];

export const Sidebar = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-100 p-4 flex flex-col">
      <nav className="space-y-1 flex-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? "bg-[#002147] text-white shadow-lg shadow-[#002147]/20"
                  : "hover:bg-white hover:shadow-sm text-slate-600 hover:text-[#002147]"
              }`}
            >
              <div
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-white/20"
                    : "bg-[#3598FE]/10 group-hover:bg-[#3598FE]/15"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-[#3598FE]"
                  }`}
                />
              </div>
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 p-3 bg-gradient-to-br from-[#002147]/5 to-[#3598FE]/5 rounded-xl relative overflow-hidden">
        <span className="absolute top-2 right-2 bg-gradient-to-r from-[#3598FE] to-[#002147] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          Soon
        </span>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#3598FE]" />
          <span className="text-xs font-semibold text-[#002147]">
            Quick Actions
          </span>
        </div>

        <div className="space-y-1.5">
          <button
            disabled
            className="w-full text-left text-xs text-slate-400 cursor-not-allowed py-1.5 px-2 rounded-md bg-white/50"
          >
            Import from LinkedIn
          </button>

          <button
            disabled
            className="w-full text-left text-xs text-slate-400 cursor-not-allowed py-1.5 px-2 rounded-md bg-white/50"
          >
            Auto-fill from Profile
          </button>
        </div>
      </div>
    </div>
  );
};