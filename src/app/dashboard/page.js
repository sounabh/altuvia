"use client"

import React, { useState, useMemo, memo } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { CVSummaryCard } from './components/CVSummaryCard';
import UniversityTimeline from './components/UniversityTimeline';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Calendar, LayoutDashboard, Search, FileText, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { LoadingSkeletons, SectionDivider, ProgressSummary } from './components/DashboardUi';

// ============================================
// MEMOIZED SUB-COMPONENTS FOR PERFORMANCE
// ============================================

// OPTIMIZED: Reduced blur intensity and simplified animation
const BackgroundAnimation = memo(() => (
  <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden gpu-accelerated">
    <div 
      className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 opacity-60 animate-blob"
      style={{ 
        filter: 'blur(60px)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    />
    <div 
      className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 opacity-60 animate-blob animation-delay-2000"
      style={{ 
        filter: 'blur(60px)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    />
    <div 
      className="absolute top-[40%] left-[30%] w-[15rem] h-[15rem] rounded-full bg-purple-100 opacity-40 animate-blob animation-delay-4000"
      style={{ 
        filter: 'blur(50px)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    />
  </div>
));
BackgroundAnimation.displayName = 'BackgroundAnimation';

// OPTIMIZED: Disabled animations during initial render
const HeroHeader = memo(({ title, subtitle }) => (
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

// OPTIMIZED: Simplified animation
const TabNavigation = memo(({ activeTab, setActiveTab }) => (
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

const EmptyState = memo(() => (
  <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-100 backdrop-blur-sm gpu-accelerated">
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center" 
      aria-hidden="true"
    >
      <GraduationCap className="w-10 h-10 text-[#002147]" />
    </div>
    <h3 className="text-xl font-semibold text-[#002147] mb-2">
      No Saved Universities Yet
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Start by exploring universities and saving your favorites to track your applications
    </p>
    <Link href="/dashboard/search" aria-label="Explore universities to add to your list">
      <button 
        className="px-6 py-3 bg-[#002147] text-white rounded-xl hover:bg-[#3598FE] transition-all duration-300 font-medium flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl gpu-accelerated"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        Explore Universities
      </button>
    </Link>

    {/* Quick Tips Section */}
    <div className="mt-10 max-w-2xl mx-auto">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">
        Quick Tips
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto"
            aria-hidden="true"
          >
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Search & Filter</p>
          <p className="text-xs text-gray-400 mt-1">
            Find schools by ranking, location, or program
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2 mx-auto"
            aria-hidden="true"
          >
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Track Essays</p>
          <p className="text-xs text-gray-400 mt-1">
            Monitor your essay progress for each school
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2 mx-auto"
            aria-hidden="true"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">AI Timeline</p>
          <p className="text-xs text-gray-400 mt-1">
            Get personalized deadlines and milestones
          </p>
        </div>
      </div>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

const UniversitiesSection = memo(({ universities, handleRemoveUniversity }) => (
  <>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#002147]/10 rounded-xl" aria-hidden="true">
          <GraduationCap className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#002147]">
            Saved Universities
          </h2>
          <p className="text-sm text-gray-500">
            {universities.length} universities in your list
          </p>
        </div>
      </div>
      <Link 
        href="/dashboard/search" 
        aria-label="Add more universities to your list"
      >
        <button className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm gpu-accelerated">
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add More</span>
        </button>
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {universities.map((university, index) => (
        <UniversityCard 
          key={university.id} 
          university={university} 
          index={index}
          onRemove={handleRemoveUniversity}
        />
      ))}
    </div>
  </>
));
UniversitiesSection.displayName = 'UniversitiesSection';

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

const Index = () => {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timelineCache, setTimelineCache] = useState({});

  // ========== CUSTOM HOOK FOR DATA FETCHING (WITH SWR) ==========
  const {
    universities,
    userProfile,
    cvSummary,
    stats,
    loading,
    error,
    handleRemoveUniversity,
    isInitialized,
    refetch,
  } = useDashboardData();

  // ========== AUTHENTICATION & ROUTING ==========
  const { status } = useSession();
  const router = useRouter();

  // ============================================
  // SEO METADATA - Memoized
  // ============================================
  const seoMetadata = useMemo(() => ({
    title: `MBA Application Dashboard | ${universities.length} Universities | Altuvia`,
    description: `Track ${universities.length} saved universities, manage applications, and monitor your progress. ${stats.completedEssays} essays completed out of ${stats.totalEssays} total.`,
    keywords: "MBA application, college admissions, application tracker, essay progress, admissions dashboard",
    ogTitle: "University Application Dashboard",
    ogDescription: `Track ${universities.length} saved universities and manage your college applications with ease.`
  }), [universities.length, stats.completedEssays, stats.totalEssays]);

  // ============================================
  // LOADING STATE
  // ============================================
  if ((loading && !isInitialized) || status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50/60 relative overflow-hidden gpu-accelerated">
        <BackgroundAnimation />

        <HeroHeader 
          title={<>Your <span className="text-[#3598FE]">Dashboard.</span></>}
          subtitle="Loading your saved universities and application progress..."
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {activeTab === 'dashboard' ? (
            <>
              <LoadingSkeletons.Stats />
              <LoadingSkeletons.ProgressSummary />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeletons.UniversityCard key={i} />
                ))}
              </div>
              <SectionDivider />
              <LoadingSkeletons.CVSummary />
            </>
          ) : (
            <LoadingSkeletons.Timeline />
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // AUTHENTICATION REDIRECT
  // ============================================
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => refetch()} 
              className="px-6 py-2 bg-[#002147] text-white rounded-lg hover:bg-[#3598FE] transition-colors font-medium gpu-accelerated"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium gpu-accelerated"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - OPTIMIZED
  // ============================================
  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden gpu-accelerated">
      <BackgroundAnimation />

      <HeroHeader 
        title={<>Your <span className="text-[#3598FE]">Dashboard.</span></>}
        subtitle="Track your saved universities and manage your applications with ease."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dashboard Tab Content - OPTIMIZED: Removed initial animation */}
        {activeTab === 'dashboard' ? (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="gpu-accelerated"
          >
            <StatsOverview stats={stats} />
            
            <ProgressSummary universities={universities} />
            
            {universities.length > 0 ? (
              <UniversitiesSection 
                universities={universities}
                handleRemoveUniversity={handleRemoveUniversity}
              />
            ) : (
              <EmptyState />
            )}

            <SectionDivider />

            <CVSummaryCard cvSummary={cvSummary} />
          </motion.div>
        ) : (
          /* AI Timeline Tab Content - OPTIMIZED */
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="gpu-accelerated"
          >
            <UniversityTimeline 
              universities={universities} 
              stats={stats} 
              userProfile={userProfile}
              timelineCache={timelineCache}
              setTimelineCache={setTimelineCache}
            />
          </motion.div>
        )}
      </div>

      <div className="h-20" aria-hidden="true"></div>
    </div>
  );
};

export default Index;