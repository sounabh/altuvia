"use client"

import React from 'react';
import { 
  FileText, GraduationCap, Briefcase, Star, Sparkles, 
  ChevronRight, Zap, BarChart3, Brain, User, Mail, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * CV Summary Card Component - Modern Professional Design
 */
export const CVSummaryCard = ({ cvSummary }) => {
  if (!cvSummary) {
    return <CVEmptyState />;
  }

  const {
    id,
    slug,
    atsScore,
    personalInfo,
    education = [],
    experience = [],
    skills = [],
  } = cvSummary;

  const cvUrl = slug ? `/dashboard/cv/${slug}` : `/dashboard/cv/${id}`;

  // Calculate total skills
  const totalSkills = skills.reduce((sum, cat) => sum + (cat.skillCount || 0), 0);

  // Get latest education & experience
  const latestEducation = education[0] || null;
  const latestExperience = experience[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 shadow-sm bg-white">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#002147] rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">Your Latest CV</h2>
              <p className="text-sm text-gray-500">Resume overview and insights</p>
            </div>
          </div>
          
          {/* ATS Coming Soon Badge */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">ATS Score</span>
              <span className="text-xs font-bold text-gray-400">{atsScore || '--'}/100</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded">
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Latest Education */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Education
                </span>
              </div>
              {latestEducation ? (
                <div>
                  <p className="text-sm font-semibold text-[#002147] leading-tight">
                    {latestEducation.institution}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {latestEducation.degree}
                    {latestEducation.fieldOfStudy && ` in ${latestEducation.fieldOfStudy}`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not added yet</p>
              )}
            </div>

            {/* Latest Experience */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Experience
                </span>
                {latestExperience?.isCurrent && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    Current
                  </span>
                )}
              </div>
              {latestExperience ? (
                <div>
                  <p className="text-sm font-semibold text-[#002147] leading-tight">
                    {latestExperience.position}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {latestExperience.company}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not added yet</p>
              )}
            </div>

            {/* Total Skills */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Skills
                </span>
              </div>
              {totalSkills > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-[#002147] leading-tight">
                    {totalSkills} Skills Added
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Across {skills.length} {skills.length === 1 ? 'category' : 'categories'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not added yet</p>
              )}
            </div>

            {/* Action Section */}
            <div className="flex flex-col justify-between">
              <div className="space-y-2 mb-3">
                {personalInfo?.fullName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{personalInfo.fullName}</span>
                  </div>
                )}
                {personalInfo?.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{personalInfo.email}</span>
                  </div>
                )}
              </div>
              
              <Link href={cvUrl} className="block">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#002147] text-white rounded-xl text-sm font-semibold hover:bg-[#3598FE] transition-all duration-300 group">
                  Continue Editing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* Mobile ATS Badge */}
        <div className="sm:hidden px-6 pb-5">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">ATS Score Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400">{atsScore || '--'}/100</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded">
                Soon
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

/**
 * Empty State when no CV exists
 */
const CVEmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white/60">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#002147] rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">Your Latest CV</h2>
              <p className="text-sm text-gray-500">Create your professional resume</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Education - Empty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50">
                  <GraduationCap className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Education
                </span>
              </div>
              <p className="text-sm text-gray-300">Not added yet</p>
            </div>

            {/* Experience - Empty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <Briefcase className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Experience
                </span>
              </div>
              <p className="text-sm text-gray-300">Not added yet</p>
            </div>

            {/* Skills - Empty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <Star className="w-4 h-4 text-blue-300" />
                </div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Skills
                </span>
              </div>
              <p className="text-sm text-gray-300">Not added yet</p>
            </div>

            {/* Action Section */}
            <div className="flex flex-col justify-end">
              <Link href="/dashboard/cv/create" className="block">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#002147] text-white rounded-xl text-sm font-semibold hover:bg-[#3598FE] transition-all duration-300 group">
                  <Sparkles className="w-4 h-4" />
                  Create Your CV
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* ATS Coming Soon */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-300" />
              <span className="text-xs font-medium text-gray-400">ATS Score Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-300">--/100</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default CVSummaryCard;