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

/**
 * Array defining all CV sections with their properties
 * Each section has:
 * - id: Unique identifier for the section
 * - label: Display name shown in the sidebar
 * - icon: Lucide React icon component for the section
 */
const sections = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "volunteer", label: "Volunteer & Extra", icon: Heart },
];

/**
 * Sidebar component for navigating between CV sections
 * @param {Object} props - Component props
 * @param {string} props.activeSection - Currently active section ID
 * @param {Function} props.onSectionChange - Callback when section is changed
 * @returns {JSX.Element} Sidebar navigation component
 */
export const Sidebar = ({ activeSection, onSectionChange }) => {
  return (
    // Main sidebar container with gradient background
    <div className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-100 p-4 flex flex-col">
      
      {/* Navigation section */}
      <nav className="space-y-1 flex-1">
        
        {/* Map through all sections to create navigation buttons */}
        {sections.map((section) => {
          // Get the icon component for this section
          const Icon = section.icon;
          
          // Check if this section is currently active
          const isActive = activeSection === section.id;

          return (
            // Navigation button for each section
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? "bg-[#002147] text-white shadow-lg shadow-[#002147]/20"
                  : "hover:bg-white hover:shadow-sm text-slate-600 hover:text-[#002147]"
              }`}
            >
              {/* Icon container with conditional styling */}
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
              
              {/* Section label */}
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions panel (disabled/upcoming features) */}
      <div className="mt-6 p-3 bg-gradient-to-br from-[#002147]/5 to-[#3598FE]/5 rounded-xl relative overflow-hidden">
        
        {/* "Soon" badge indicating upcoming feature */}
        <span className="absolute top-2 right-2 bg-gradient-to-r from-[#3598FE] to-[#002147] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          Soon
        </span>

        {/* Quick Actions header */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#3598FE]" />
          <span className="text-xs font-semibold text-[#002147]">
            Quick Actions
          </span>
        </div>

        {/* Quick Actions buttons (currently disabled) */}
        <div className="space-y-1.5">
          {/* Import from LinkedIn button */}
          <button
            disabled
            className="w-full text-left text-xs text-slate-400 cursor-not-allowed py-1.5 px-2 rounded-md bg-white/50"
          >
            Import from LinkedIn
          </button>

          {/* Auto-fill from Profile button */}
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