/**
 * DashboardStaticComponents.jsx
 *
 * Pure, static UI sub-components for the Dashboard page.
 * All are memo-wrapped and have display names set.
 * Extracted from Index so the page file only contains routing/state logic.
 *
 * Nothing changed functionally — only co-location improved.
 */

import React, { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, LayoutDashboard, Search, FileText, GraduationCap } from 'lucide-react';

// ─── Background blobs ─────────────────────────────────────────────────────────

export const BackgroundAnimation = memo(() => (
  <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden gpu-accelerated">
    <div
      className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 opacity-60 animate-blob"
      style={{ filter: 'blur(60px)', transform: 'translateZ(0)', willChange: 'transform' }}
    />
    <div
      className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 opacity-60 animate-blob animation-delay-2000"
      style={{ filter: 'blur(60px)', transform: 'translateZ(0)', willChange: 'transform' }}
    />
    <div
      className="absolute top-[40%] left-[30%] w-[15rem] h-[15rem] rounded-full bg-purple-100 opacity-40 animate-blob animation-delay-4000"
      style={{ filter: 'blur(50px)', transform: 'translateZ(0)', willChange: 'transform' }}
    />
  </div>
));
BackgroundAnimation.displayName = 'BackgroundAnimation';

// ─── Hero header ─────────────────────────────────────────────────────────────

export const HeroHeader = memo(({ title, subtitle }) => (
  <div className="relative z-10 backdrop-blur-sm gpu-accelerated">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
      <motion.h1
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium"
      >
        {subtitle}
      </motion.p>
    </div>
  </div>
));
HeroHeader.displayName = 'HeroHeader';

// ─── Tab navigation ───────────────────────────────────────────────────────────

export const TabNavigation = memo(({ activeTab, setActiveTab }) => (
  <motion.div
    initial={false}
    animate={{ opacity: 1 }}
    className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 overflow-x-auto gpu-accelerated"
  >
    <button
      onClick={() => setActiveTab('dashboard')}
      className={`px-4 sm:px-6 py-3 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
        activeTab === 'dashboard'
          ? 'text-[#002147] border-b-2 border-[#002147]'
          : 'text-gray-500 hover:text-gray-900'
      }`}
      aria-label="Switch to Dashboard view"
    >
      <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
      <span className="hidden sm:inline">Dashboard</span> Overview
    </button>
    <button
      onClick={() => setActiveTab('timeline')}
      className={`px-4 sm:px-6 py-3 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
        activeTab === 'timeline'
          ? 'text-[#002147] border-b-2 border-[#002147]'
          : 'text-gray-500 hover:text-gray-900'
      }`}
      aria-label="Switch to AI Timeline view"
    >
      <Calendar className="w-4 h-4" aria-hidden="true" />
      AI Timeline
    </button>
  </motion.div>
));
TabNavigation.displayName = 'TabNavigation';

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyState = memo(() => (
  <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-100 backdrop-blur-sm gpu-accelerated">
    <div
      className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center"
      aria-hidden="true"
    >
      <GraduationCap className="w-10 h-10 text-[#002147]" />
    </div>
    <h3 className="text-xl font-semibold text-[#002147] mb-2">No Saved Universities Yet</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Start by exploring universities and saving your favorites to track your applications
    </p>
    <Link href="/dashboard/search" aria-label="Explore universities to add to your list">
      <button className="px-6 py-3 bg-[#002147] text-white rounded-xl hover:bg-[#3598FE] transition-all duration-300 font-medium flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl gpu-accelerated">
        <Search className="w-4 h-4" aria-hidden="true" />
        Explore Universities
      </button>
    </Link>

    <div className="mt-10 max-w-2xl mx-auto">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">
        Quick Tips
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIPS.map(({ icon: Icon, color, label, desc }) => (
          <div key={label} className="bg-white/60 rounded-xl p-4 border border-gray-100">
            <div
              className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-2 mx-auto`}
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

// Tip definitions lifted out of render to avoid recreation each paint
const TIPS = [
  {
    icon: Search,
    color: 'bg-blue-100',
    label: 'Search & Filter',
    desc: 'Find schools by ranking, location, or program',
  },
  {
    icon: FileText,
    color: 'bg-purple-100',
    label: 'Track Essays',
    desc: 'Monitor your essay progress for each school',
  },
  {
    icon: Calendar,
    color: 'bg-emerald-100',
    label: 'AI Timeline',
    desc: 'Get personalized deadlines and milestones',
  },
];

// ─── Universities section ─────────────────────────────────────────────────────

// Import lazily inside the component file that uses this —
// kept here as a named export so the page import list stays clean.
export { UniversitiesSection } from './UniversitySection';