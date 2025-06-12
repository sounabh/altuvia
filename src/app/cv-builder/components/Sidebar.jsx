import React from 'react';
import { User, GraduationCap, Briefcase, FolderOpen, Award, Heart, Code } from 'lucide-react';


const sections = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'volunteer', label: 'Volunteer & Extra', icon: Heart },
];

export const Sidebar= ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 bg-white text-black border-r border-cvBorder p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold cv-heading mb-2">CV Sections</h2>
        <p className="text-sm cv-body">Click to edit each section</p>
      </div>

      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full  flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                isActive 
                  ? 'bg-cvAccent text-white bg-[#002147] shadow-md transform scale-[1.02]' 
                  : 'hover:bg-cvLightBg text-cvBody hover:text-cvHeading'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-cvAccent'}`} />
              <span className="font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-cvLightBg rounded-lg border border-cvBorder">
        <h3 className="font-semibold cv-heading text-sm mb-2">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left text-sm cv-body hover:text-cvAccent transition-colors">
            Import from LinkedIn
          </button>
          <button className="w-full text-left text-sm cv-body hover:text-cvAccent transition-colors">
            Duplicate for New School
          </button>
          <button className="w-full text-left text-sm cv-body hover:text-cvAccent transition-colors">
            Auto-fill from Profile
          </button>
        </div>
      </div>
    </div>
  );
};
