/**
 * DashboardLoadingStates.jsx
 *
 * All three non-happy-path render branches extracted from Index.jsx:
 *   - LoadingView     (skeleton while data fetches)
 *   - AuthCheckView   (redirecting spinner)
 *   - ErrorView       (error with retry/reload)
 *
 * Extracted so Index.jsx only contains the happy-path render.
 */

import React, { memo } from 'react';
import { BackgroundAnimation, HeroHeader, TabNavigation } from '../DashboardStatic';
import { LoadingSkeletons, SectionDivider } from '@/app/dashboard/components/DashboardUi.jsx';

// ─── Loading ──────────────────────────────────────────────────────────────────

export const LoadingView = memo(({ activeTab }) => (
  <div className="min-h-screen bg-blue-50/60 relative overflow-hidden gpu-accelerated">
    <BackgroundAnimation />
    <HeroHeader
      title={<>Your <span className="text-[#3598FE]">Dashboard.</span></>}
      subtitle="Loading your saved universities and application progress..."
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <div className="h-12 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      {activeTab === 'dashboard' ? (
        <>
          <LoadingSkeletons.Stats />
          <LoadingSkeletons.ProgressSummary />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <LoadingSkeletons.UniversityCard key={i} />)}
          </div>
          <SectionDivider />
          <LoadingSkeletons.CVSummary />
        </>
      ) : (
        <LoadingSkeletons.Timeline />
      )}
    </div>
  </div>
));
LoadingView.displayName = 'LoadingView';

// ─── Auth redirect spinner ────────────────────────────────────────────────────

export const AuthCheckView = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-slate-600">Redirecting to login...</p>
    </div>
  </div>
));
AuthCheckView.displayName = 'AuthCheckView';

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorView = memo(({ error, refetch }) => (
  <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-red-600 text-sm mb-4">{error}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={refetch}
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
));
ErrorView.displayName = 'ErrorView';