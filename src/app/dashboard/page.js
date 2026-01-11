"use client"

import React, { useState, useEffect } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import UniversityTimeline from './components/UniversityTimeline';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, LayoutDashboard, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const Index = () => {
  const [universities, setUniversities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    submitted: 0,
    upcomingDeadlines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Timeline cache state lifted to parent
  const [timelineCache, setTimelineCache] = useState({});

  const { data: session, status } = useSession();
  const router = useRouter();

  // Helper function to handle JWT errors and redirect
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

  // Check authentication status first
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
          setStats(data.stats || {
            total: data.universities?.length || 0,
            inProgress: 0,
            submitted: 0,
            upcomingDeadlines: 0
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
          upcomingDeadlines: updatedUniversities.reduce((sum, u) => sum + (u.upcomingDeadlines || 0), 0)
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3"></div>
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
        <div className="flex gap-2 pt-4">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );

  const TimelineSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-8 animate-pulse">
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
          <div key={i} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-white/20 rounded w-20 mx-auto mb-2"></div>
              <div className="h-10 bg-white/20 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="h-4 bg-white/20 rounded-full w-full"></div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden animate-pulse">
          <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
                <div className="h-6 bg-white/20 rounded w-64 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
          <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
        </div>

        {/* Hero Header */}
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
            </>
          ) : (
            <TimelineSkeleton />
          )}
        </div>
      </div>
    );
  }

  // Don't show error if we're unauthenticated (will redirect)
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
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
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      {/* Background Blobs - Matching Search Page */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
      </div>

      {/* Hero Header Section - Matching Search Page */}
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
          className="flex gap-4 mb-8 border-b border-gray-200"
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'text-[#002147] border-b-2 border-[#002147]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 ${
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
            <StatsOverview stats={stats} />
            {universities.length > 0 && <ProgressSummary />}
            
            {universities.length > 0 ? (
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
            ) : (
              <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold text-[#002147] mb-2">
                  No Saved Universities Yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start by exploring universities and saving your favorites to track your applications
                </p>
                <Link href={"/dashboard/search"}>
                  <button 
                    className="px-6 py-3 bg-[#002147] text-white rounded-lg hover:bg-[#3598FE] transition-all duration-300 font-medium flex items-center gap-2 mx-auto"
                  >
                    <Search className="w-4 h-4" />
                    Explore Universities
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
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
    </div>
  );
};

export default Index;