"use client";

import React from 'react';
import { PersonalInfoForm } from '../(Forms)/PersonalInfoFor,';
import { EducationForm } from '../(Forms)/EducationForm';
import { ExperienceForm } from '../(Forms)/ExperienceForm';
import { SkillsForm } from '../(Forms)/SkillsForms';
import { AchievementsForm } from '../(Forms)/AchievementForm';
import { VolunteerForm } from '../(Forms)/VolunteerForm';

// Section order matches sidebar:
// personal → experience → education → [skills, achievements, volunteer]
// Projects removed from sidebar navigation

export const CVBuilder = ({ activeSection, onSectionChange }) => {
  const renderActiveForm = () => {
    switch (activeSection) {
      case 'personal':      return <PersonalInfoForm />;
      case 'experience':    return <ExperienceForm />;
      case 'education':     return <EducationForm />;
      case 'skills':        return <SkillsForm />;
      case 'achievements':  return <AchievementsForm />;
      case 'volunteer':     return <VolunteerForm />;
      default:              return <PersonalInfoForm />;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="animate-slide-in-up">
          {renderActiveForm()}
        </div>
      </div>
    </div>
  );
};