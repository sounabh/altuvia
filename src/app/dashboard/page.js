'use client';

/**
 * Index.jsx  (Dashboard page)
 *
 * Responsibilities:
 *  - Compose sub-components
 *  - Manage tab state + timeline cache state
 *  - Delegate data fetching to useDashboardData
 *  - Render appropriate view (loading / auth / error / happy path)
 *
 * No business logic, no inline style props, no large JSX trees.
 * Every reusable piece lives in its own file.
 */

import React, { useState, useMemo } from 'react';
import { useSession }  from 'next-auth/react';
import { motion }      from 'framer-motion';

import { useDashboardData } from '@/lib/hooks/useDashboardData';

// UI components
import { StatsOverview }     from './components/StatsOverview';
import { CVSummaryCard }     from './components/CVSummaryCard';
import UniversityTimeline    from './components/UniversityTimeline';
import { ProgressSummary, SectionDivider } from './components/DashboardUi';

// Static / structural components
import {
  BackgroundAnimation,
  HeroHeader,
  TabNavigation,
  EmptyState,
} from '@/components/DashboardStatic';
import { UniversitiesSection }  from '@/components/UniversitySection';
import { LoadingView, AuthCheckView, ErrorView } from '@/components/skeletons/dashboardLoading';

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_TITLE    = <> Your <span className="text-[#3598FE]">Dashboard.</span></>;
const HERO_SUBTITLE = 'Track your saved universities and manage your applications with ease.';

// ─── Main component ───────────────────────────────────────────────────────────

const Index = () => {
  // ── Local state ─────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [timelineCache,  setTimelineCache]  = useState({});

  // ── Data ────────────────────────────────────────────────────────────────────
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

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { status } = useSession();

  // ── SEO metadata (memoized — only recalculates when counts change) ───────────
  // eslint-disable-next-line no-unused-vars
  const seoMetadata = useMemo(
    () => ({
      title:       `MBA Application Dashboard | ${universities.length} Universities | Altuvia`,
      description: `Track ${universities.length} saved universities, manage applications, and monitor your progress. ${stats.completedEssays} essays completed out of ${stats.totalEssays} total.`,
      keywords:    'MBA application, college admissions, application tracker, essay progress, admissions dashboard',
      ogTitle:     'University Application Dashboard',
      ogDescription: `Track ${universities.length} saved universities and manage your college applications with ease.`,
    }),
    [universities.length, stats.completedEssays, stats.totalEssays]
  );

  // ── Guard renders ────────────────────────────────────────────────────────────
  if ((loading && !isInitialized) || status === 'loading') {
    return <LoadingView activeTab={activeTab} />;
  }

  if (status !== 'authenticated') {
    return <AuthCheckView />;
  }

  if (error && !isInitialized) {
    return <ErrorView error={error} refetch={refetch} />;
  }

  // ── Happy path ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-blue-50/60 dark:bg-slate-950 relative overflow-hidden gpu-accelerated transition-colors">
      <BackgroundAnimation />
      <HeroHeader title={HERO_TITLE} subtitle={HERO_SUBTITLE} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'dashboard' ? (
          <motion.div initial={false} animate={{ opacity: 1 }} className="gpu-accelerated">
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
          <motion.div initial={false} animate={{ opacity: 1 }} className="gpu-accelerated">
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

      {/* Bottom spacer */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
};

export default Index;