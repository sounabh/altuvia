"use client";

import React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Heart,
  LayoutGrid,
  Sparkles,
  Zap,
} from "lucide-react";

const TOP_SECTIONS = [
  { id: "personal",   label: "Personal Info",          icon: User },
  { id: "experience", label: "Professional Experience", icon: Briefcase },
  { id: "education",  label: "Education",              icon: GraduationCap },
];

const ADDITIONAL_SECTIONS = [
  { id: "skills",       label: "Skills",           icon: Code },
  { id: "achievements", label: "Achievements",      icon: Award },
  { id: "volunteer",    label: "Volunteer & Extra", icon: Heart },
];

const NavItem = ({ section, isActive, onClick, compact = false }) => {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 rounded-xl text-left transition-all duration-150 ${
        compact ? "py-2" : "py-2.5"
      } ${
        isActive
          ? "bg-[#002147] text-white shadow-md shadow-[#002147]/25"
          : "hover:bg-slate-100 text-slate-500 hover:text-[#002147]"
      }`}
    >
      <div className={`rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
        compact ? "w-6 h-6" : "w-7 h-7"
      } ${
        isActive ? "bg-white/15" : "bg-[#3598FE]/10 group-hover:bg-[#3598FE]/20"
      }`}>
        <Icon className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${isActive ? "text-white" : "text-[#3598FE]"}`} />
      </div>
      <span className={`font-medium leading-none ${compact ? "text-[12px]" : "text-[13px]"}`}>
        {section.label}
      </span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
      )}
    </button>
  );
};

export const Sidebar = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-100 flex flex-col h-full">

      {/* ── Brand header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#002147] flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[13.5px] font-bold text-[#002147] tracking-tight block leading-none">CV Builder</span>
            <span className="text-[10px] text-slate-400 leading-none mt-0.5 block">MBA Edition</span>
          </div>
        </div>
      </div>

      {/* ── All nav — no scroll, no accordion, always fully visible ── */}
      <div className="flex-1 px-3.5 pt-4 pb-3 flex flex-col">

        {/* Core sections label */}
        <p className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-slate-400 px-3 mb-1.5">
          Core
        </p>

        <div className="space-y-0.5">
          {TOP_SECTIONS.map((section) => (
            <NavItem
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              onClick={() => onSectionChange(section.id)}
            />
          ))}
        </div>

        {/* Divider with label */}
        <div className="flex items-center gap-2 my-3 px-1">
          <div className="h-px flex-1 bg-slate-100" />
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3 text-slate-300" />
            <span className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-slate-400">
              Additional
            </span>
          </div>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {/* Additional sub-sections — always visible, slightly indented */}
        <div className="space-y-0.5 pl-2">
          {ADDITIONAL_SECTIONS.map((section) => (
            <NavItem
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              onClick={() => onSectionChange(section.id)}
              compact
            />
          ))}
        </div>

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* ── Quick Actions — always visible, no overflow risk ── */}
        <div className="mt-3">
          <div className="p-3.5 bg-gradient-to-br from-[#002147]/5 to-[#3598FE]/10 rounded-xl border border-[#3598FE]/15 relative overflow-hidden">

            {/* Decorative circle */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#3598FE]/8 pointer-events-none" />

            <span className="absolute top-2.5 right-2.5 bg-[#3598FE] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none tracking-wide">
              SOON
            </span>

            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-[#3598FE]/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#3598FE]" />
              </div>
              <span className="text-[11.5px] font-semibold text-[#002147]">Quick Actions</span>
            </div>

            <div className="space-y-1.5">
              <button
                disabled
                className="w-full text-left text-[11px] text-slate-400 cursor-not-allowed py-1.5 px-2.5 rounded-lg bg-white/70 border border-slate-100/80 flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-slate-200/70 flex-shrink-0" />
                Import from LinkedIn
              </button>
              <button
                disabled
                className="w-full text-left text-[11px] text-slate-400 cursor-not-allowed py-1.5 px-2.5 rounded-lg bg-white/70 border border-slate-100/80 flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-slate-200/70 flex-shrink-0" />
                Auto-fill from Profile
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};