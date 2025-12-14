"use client"

import React, { useState, useEffect } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import UniversityTimeline from './components/UniversityTimeline';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Calendar, LayoutDashboard } from 'lucide-react';

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

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchSavedUniversities = async () => {
      if (status === "loading") {
        return;
      }

      if (status !== "authenticated" || !session?.token) {
        setError("Please login to view your saved universities");
        setLoading(false);
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
  }, [session, status]);

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
        console.error('Failed to remove university');
      }
    } catch (err) {
      console.error('Error removing university:', err);
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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen">
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-center font-semibold text-[40px] tracking-[0.2px] -mt-10">
              Dashboard
            </h1>
            <p className="text-center text-slate-600">
              Track your saved universities and manage your applications
            </p>
          </div>
          <div className="text-center mt-8">
            <p className="text-slate-500">Loading your saved universities...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-center text-[40px] font-semibold tracking-[0.2px] -mt-10">
            Dashboard
          </h1>
          <p className="text-center text-slate-600">
            Track your saved universities and manage your applications
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Overview
            {activeTab === 'dashboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            AI Timeline
            {activeTab === 'timeline' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' ? (
          <>
            <StatsOverview stats={stats} />
            {universities.length > 0 && <ProgressSummary />}
            
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Saved Universities Yet
                </h3>
                <p className="text-slate-600 mb-6">
                  Start by saving some universities to track your applications
                </p>
                <Link href={"/dashboard/search"}>
                  <button 
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First University
                  </button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <UniversityTimeline 
            universities={universities} 
            stats={stats} 
            userProfile={userProfile}
          />
        )}
      </div>
    </div>
  );
};

export default Index;