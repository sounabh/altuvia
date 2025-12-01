"use client";

import React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  FolderOpen,
  Award,
  Heart,
  Code,
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
    <div className="w-64 bg-white text-black border-r border-cvBorder p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold cv-heading mb-2">CV Sections</h2>
        <p className="text-sm cv-body">Click to edit each section</p>
      </div>

      <nav className="space-y-2 flex-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? "bg-[#002147] text-white shadow-md"
                  : "hover:bg-cvLightBg text-cvBody hover:text-cvHeading"
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? "text-white" : "text-cvAccent"
                }`}
              />
              <span className="font-medium truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-cvLightBg rounded-lg border border-cvBorder relative overflow-hidden">
        {/* Coming Soon Ribbon */}
        <div className="absolute top-1 -right-8 bg-[#002147] text-white text-xs px-8 py-1 transform rotate-45">
          Soon
        </div>
        
        <h3 className="font-semibold cv-heading text-sm mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button 
            disabled
            className="w-full text-left text-sm text-gray-400 cursor-not-allowed transition-colors duration-200"
          >
            Import from LinkedIn
          </button>
          
          <button 
            disabled
            className="w-full text-left text-sm text-gray-400 cursor-not-allowed transition-colors duration-200"
          >
            Auto-fill from Profile
          </button>
        </div>
      </div>
    </div>
  );
};