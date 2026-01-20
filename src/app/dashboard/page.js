"use client"

import React, { useState, useEffect } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { CVSummaryCard } from './components/CVSummaryCard';
import UniversityTimeline from './components/UniversityTimeline';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, LayoutDashboard, Search, FileText, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const Index = () => {
  const [universities, setUniversities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [cvSummary, setCVSummary] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    submitted: 0,
    notStarted: 0,
    upcomingDeadlines: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalEssays: 0,
    completedEssays: 0,
    inProgressEssays: 0,
    notStartedEssays: 0,
    averageProgress: 0,
    fullyCompletedUniversities: 0,
    universitiesReadyForSubmission: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [timelineCache, setTimelineCache] = useState({});

  const { data: session, status } = useSession();
  const router = useRouter();

  const handleAuthError = async (errorMessage) => {
    console.error("Authentication error:", errorMessage);
    
    const isJWTError = errorMessage?.toLowerCase().includes('jwt') || 
                       errorMessage?.toLowerCase().includes('token') ||
                       errorMessage?.toLowerCase().includes('expired') ||
                       errorMessage?.toLowerCase().includes('invalid');
    
    if (isJWTError) {
      await signOut({ redirect: false });
      router.push('/onboarding/signup');
    } else {
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "loading" && status !== "authenticated") {
      router.push('/onboarding/signup');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSavedUniversities = async () => {
      if (status === "loading") {
        return;
      }

      if (status !== "authenticated" || !session?.token) {
        router.push('/onboarding/signup');
        return;
      }

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        const response = await fetch(`${API_BASE_URL}/api/university/saved`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          const errorData = await response.json();
          await handleAuthError(errorData.error || 'Authentication failed');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log('Enhanced university data:', data);
          
          setUniversities(data.universities || []);
          setUserProfile(data.userProfile || null);
          setCVSummary(data.cvSummary || null);
          setStats(data.stats || {
            total: data.universities?.length || 0,
            inProgress: 0,
            submitted: 0,
            notStarted: 0,
            upcomingDeadlines: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalEssays: 0,
            completedEssays: 0,
            inProgressEssays: 0,
            notStartedEssays: 0,
            averageProgress: 0,
            fullyCompletedUniversities: 0,
            universitiesReadyForSubmission: 0
          });
          
        } else {
          const errorData = await response.json();
          
          if (errorData.error) {
            await handleAuthError(errorData.error);
          } else {
            setError('Failed to fetch saved universities');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching saved universities:', err);
        
        if (err.message?.toLowerCase().includes('jwt') || 
            err.message?.toLowerCase().includes('token')) {
          await handleAuthError(err.message);
        } else {
          setError('Error loading saved universities');
          setLoading(false);
        }
      } finally {
        if (!error?.toLowerCase().includes('jwt')) {
          setLoading(false);
        }
      }
    };

    fetchSavedUniversities();
  }, [session, status, router]);

  const handleRemoveUniversity = async (universityId) => {
    if (!session?.token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId }),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        await handleAuthError(errorData.error || 'Authentication failed');
        return;
      }

      if (response.ok) {
        const updatedUniversities = universities.filter(u => u.id !== universityId);
        setUniversities(updatedUniversities);
        
        const newStats = {
          total: updatedUniversities.length,
          inProgress: updatedUniversities.filter(u => u.status === 'in-progress').length,
          submitted: updatedUniversities.filter(u => u.status === 'submitted').length,
          notStarted: updatedUniversities.filter(u => u.status === 'not-started').length,
          upcomingDeadlines: updatedUniversities.reduce((sum, u) => sum + (u.upcomingDeadlines || 0), 0),
          totalTasks: updatedUniversities.reduce((sum, u) => sum + (u.totalTasks || 0), 0),
          completedTasks: updatedUniversities.reduce((sum, u) => sum + (u.tasks || 0), 0),
          totalEssays: updatedUniversities.reduce((sum, u) => sum + (u.totalEssays || 0), 0),
          completedEssays: updatedUniversities.reduce((sum, u) => sum + (u.completedEssays || 0), 0),
          inProgressEssays: updatedUniversities.reduce((sum, u) => sum + (u.inProgressEssays || 0), 0),
          notStartedEssays: updatedUniversities.reduce((sum, u) => sum + (u.notStartedEssays || 0), 0),
          averageProgress: updatedUniversities.length > 0
            ? Math.round(updatedUniversities.reduce((sum, u) => sum + (u.overallProgress || 0), 0) / updatedUniversities.length)
            : 0,
          fullyCompletedUniversities: updatedUniversities.filter(u => u.status === 'submitted').length,
          universitiesReadyForSubmission: updatedUniversities.filter(u => 
            u.stats?.applicationHealth?.readyForSubmission
          ).length
        };
        setStats(newStats);
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          await handleAuthError(errorData.error);
        } else {
          console.error('Failed to remove university');
        }
      }
    } catch (err) {
      console.error('Error removing university:', err);
      
      if (err.message?.toLowerCase().includes('jwt') || 
          err.message?.toLowerCase().includes('token')) {
        await handleAuthError(err.message);
      }
    }
  };

  // Progress Summary Component
  const ProgressSummary = () => {
    if (universities.length === 0) return null;
    
    const totalEssays = universities.reduce((sum, u) => sum + (u.totalEssays || 0), 0);
    const completedEssays = universities.reduce((sum, u) => sum + (u.completedEssays || 0), 0);
    const totalTasks = universities.reduce((sum, u) => sum + (u.totalTasks || 0), 0);
    const completedTasks = universities.reduce((sum, u) => sum + (u.tasks || 0), 0);
    
    const essayCompletionRate = totalEssays > 0 ? Math.round((completedEssays / totalEssays) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-semibold text-[#002147] mb-4">Overall Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Essays Completed</span>
              <span className="text-sm font-bold text-[#002147]">{completedEssays}/{totalEssays}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-[#3598FE] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${essayCompletionRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{essayCompletionRate}% Complete</div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Tasks Completed</span>
              <span className="text-sm font-bold text-[#002147]">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{taskCompletionRate}% Complete</div>
          </div>
        </div>
      </div>
    );
  };

  // Divider Component
  const SectionDivider = () => (
    <div className="my-10 flex items-center gap-4">
      <div className="flex-1 h-px bg-gray-200"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
  );

  // Skeleton Components
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ProgressSummarySkeleton = () => (
    <div className="bg-white/60 rounded-2xl p-6 mb-8 border border-gray-100 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const UniversityCardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );

  const CVSummarySkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TimelineSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-[#002147] rounded-2xl p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
          <div className="flex-1">
            <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Loading State
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
          <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight">
              Your <span className="text-[#3598FE]">Dashboard.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Track your saved universities and manage your applications
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {activeTab === 'dashboard' ? (
            <>
              <StatsSkeleton />
              <ProgressSummarySkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <UniversityCardSkeleton key={i} />
                ))}
              </div>
              <div className="my-10"><SectionDivider /></div>
              <CVSummarySkeleton />
            </>
          ) : (
            <TimelineSkeleton />
          )}
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
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

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-[#002147] text-white rounded-lg hover:bg-[#3598FE] transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[30%] w-[15rem] h-[15rem] rounded-full bg-purple-100 blur-[60px] mix-blend-multiply opacity-40 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Header Section */}
      <div className="relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight"
          >
            Your <span className="text-[#3598FE]">Dashboard.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Track your saved universities and manage your applications with ease.
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 sm:px-6 py-3 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-[#002147] border-b-2 border-[#002147]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span> Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 sm:px-6 py-3 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'text-[#002147] border-b-2 border-[#002147]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            AI Timeline
          </button>
        </motion.div>

        {activeTab === 'dashboard' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Stats Overview */}
            <StatsOverview stats={stats} />
            
            {/* Progress Summary */}
            {universities.length > 0 && <ProgressSummary />}
            
            {/* Universities Grid or Empty State */}
            {universities.length > 0 ? (
              <>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#002147]/10 rounded-xl">
                      <GraduationCap className="w-5 h-5 text-[#002147]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#002147]">Saved Universities</h2>
                      <p className="text-sm text-gray-500">{universities.length} universities in your list</p>
                    </div>
                  </div>
                  <Link href="/dashboard/search">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm">
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">Add More</span>
                    </button>
                  </Link>
                </div>

                {/* University Cards Grid */}
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
            ) : (
              /* Empty State */
              <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-100 backdrop-blur-sm">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-[#002147]" />
                </div>
                <h3 className="text-xl font-semibold text-[#002147] mb-2">
                  No Saved Universities Yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start by exploring universities and saving your favorites to track your applications
                </p>
                <Link href="/dashboard/search">
                  <button 
                    className="px-6 py-3 bg-[#002147] text-white rounded-xl hover:bg-[#3598FE] transition-all duration-300 font-medium flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
                  >
                    <Search className="w-4 h-4" />
                    Explore Universities
                  </button>
                </Link>

                {/* Quick Tips */}
                <div className="mt-10 max-w-2xl mx-auto">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">Quick Tips</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Search & Filter</p>
                      <p className="text-xs text-gray-400 mt-1">Find schools by ranking, location, or program</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Track Essays</p>
                      <p className="text-xs text-gray-400 mt-1">Monitor your essay progress for each school</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">AI Timeline</p>
                      <p className="text-xs text-gray-400 mt-1">Get personalized deadlines and milestones</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <SectionDivider />

            {/* CV Summary Section */}
            <CVSummaryCard cvSummary={cvSummary} />

          </motion.div>
        ) : (
          /* AI Timeline Tab */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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

      {/* Footer Spacing */}
      <div className="h-20"></div>
    </div>
  );
};

export default Index;