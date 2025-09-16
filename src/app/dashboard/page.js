'use client';

import React, { useState, useEffect } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { AddUniversityModal } from './components/AddUniversityModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import Link from 'next/link';

/**
 * Skeleton loading component for stats overview
 * Mimics the structure of the actual stats cards
 */
const StatsOverviewSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
        {/* Skeleton for stat number */}
        <div className="h-8 bg-slate-200 rounded animate-pulse mb-2"></div>
        {/* Skeleton for stat label */}
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton loading component for university cards
 * Replicates the university card layout with placeholders
 */
const UniversityCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    {/* University name skeleton */}
    <div className="h-6 bg-slate-200 rounded animate-pulse mb-4 w-3/4"></div>
    
    {/* Location skeleton */}
    <div className="h-4 bg-slate-200 rounded animate-pulse mb-3 w-1/2"></div>
    
    {/* Status badge skeleton */}
    <div className="h-6 bg-slate-200 rounded-full animate-pulse mb-4 w-24"></div>
    
    {/* Progress bar skeleton */}
    <div className="mb-4">
      <div className="h-3 bg-slate-200 rounded animate-pulse mb-2 w-full"></div>
      <div className="h-3 bg-slate-200 rounded animate-pulse w-16"></div>
    </div>
    
    {/* Action buttons skeleton */}
    <div className="flex gap-2">
      <div className="h-9 bg-slate-200 rounded animate-pulse flex-1"></div>
      <div className="h-9 bg-slate-200 rounded animate-pulse w-9"></div>
    </div>
  </div>
);

/**
 * Main dashboard component for managing saved universities with enhanced progress tracking
 * @returns {JSX.Element} Dashboard with:
 * - Statistics overview with real progress data
 * - University cards showing essay and task progress
 * - Add/remove functionality
 * - Loading and error states with skeleton UI
 */
const Index = () => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    submitted: 0,
    upcomingDeadlines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches saved universities from backend API with enhanced progress data
   * Includes essays, calendar events, and task completion tracking
   */
  useEffect(() => {
    const fetchSavedUniversities = async () => {
      try {
        const authData = localStorage.getItem("authData");
        if (!authData) {
          setError("No authentication data found");
          setLoading(false);
          return;
        }

        const parsedData = JSON.parse(authData);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        const response = await fetch(`${API_BASE_URL}/api/university/saved`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${parsedData.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Enhanced university data:', data);
          
          // Set universities and stats from API response
          setUniversities(data.universities || []);
          setStats(data.stats || {
            total: data.universities?.length || 0,
            inProgress: 0,
            submitted: 0,
            upcomingDeadlines: 0
          });
          
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch saved universities');
        }
      } catch (err) {
        console.error('Error fetching saved universities:', err);
        setError('Error loading saved universities');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedUniversities();
  }, []);

  /**
   * Handles removing a university from saved list
   * @param {string} universityId - ID of university to remove
   */
  const handleRemoveUniversity = async (universityId) => {
    try {
      const authData = localStorage.getItem("authData");
      if (!authData) {
        console.error("No authentication data found");
        return;
      }

      const parsedData = JSON.parse(authData);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/unsave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsedData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId }),
      });

      if (response.ok) {
        // Remove from local state and recalculate stats
        const updatedUniversities = universities.filter(u => u.id !== universityId);
        setUniversities(updatedUniversities);
        
        // Recalculate stats
        const newStats = {
          total: updatedUniversities.length,
          inProgress: updatedUniversities.filter(u => u.status === 'in-progress').length,
          submitted: updatedUniversities.filter(u => u.status === 'submitted').length,
          upcomingDeadlines: updatedUniversities.reduce((sum, u) => sum + (u.upcomingDeadlines || 0), 0)
        };
        setStats(newStats);
      } else {
        console.error('Failed to remove university');
      }
    } catch (err) {
      console.error('Error removing university:', err);
    }
  };

  /**
   * Progress summary component showing overall completion across all universities
   */
  const ProgressSummary = () => {
    if (universities.length === 0) return null;
    
    const totalEssays = universities.reduce((sum, u) => sum + (u.totalEssays || 0), 0);
    const completedEssays = universities.reduce((sum, u) => sum + (u.completedEssays || 0), 0);
    const totalTasks = universities.reduce((sum, u) => sum + (u.totalTasks || 0), 0);
    const completedTasks = universities.reduce((sum, u) => sum + (u.tasks || 0), 0);
    
    const essayCompletionRate = totalEssays > 0 ? Math.round((completedEssays / totalEssays) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Overall Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Essay Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Essays Completed</span>
              <span className="text-sm font-bold text-slate-800">{completedEssays}/{totalEssays}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${essayCompletionRate}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">{essayCompletionRate}% Complete</div>
          </div>
          
          {/* Task Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Tasks Completed</span>
              <span className="text-sm font-bold text-slate-800">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">{taskCompletionRate}% Complete</div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state UI with skeleton components
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="px-4 py-8 max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-center text-[40px] tracking-[0.2px] -mt-10">
              My Saved Universities
            </h1>
            <p className="text-center text-slate-600">
              Track your saved universities and manage your applications
            </p>
          </div>

          {/* Statistics Overview Skeleton */}
          <StatsOverviewSkeleton />

          {/* University Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <UniversityCardSkeleton key={index} />
            ))}
          </div>

          {/* Loading indicator text */}
          <div className="text-center mt-8">
            <p className="text-slate-500">Loading your saved universities...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-center text-[40px] tracking-[0.2px] -mt-10">
            My Saved Universities
          </h1>
          <p className="text-center text-slate-600">
            Track your saved universities and manage your applications
          </p>
        </div>

        {/* Statistics Overview Component */}
        <StatsOverview stats={stats} />

        {/* Progress Summary */}
        {universities.length > 0 && <ProgressSummary />}

        {/* University Cards Grid */}
        {universities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {universities.map((university) => (
              <UniversityCard 
                key={university.id} 
                university={university} 
                onRemove={handleRemoveUniversity}
              />
            ))}
          </div>
        ) : (
          /* Empty state when no universities are saved */
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No Saved Universities Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Start by saving some universities to track your applications
            </p>
            <Link href={"/search"}>
              <button 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First University
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;