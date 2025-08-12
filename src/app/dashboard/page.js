'use client';

import React, { useState, useEffect } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { UniversityCard } from './components/UniversityCard';
import { AddUniversityModal } from './components/AddUniversityModal';
import { FloatingAddButton } from './components/FloatingAddButton';

/**
 * Main dashboard component for managing saved universities
 * @returns {JSX.Element} Dashboard with:
 * - Statistics overview
 * - Saved university cards
 * - Add/remove functionality
 * - Loading and error states
 */
const Index = () => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches saved universities from backend API
   * Adds default values for UI components
   * Handles authentication and error states
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
          const savedUniversities = await response.json();
          //console.log(savedUniversities,"client");
          
          
          // Enhance university data with UI defaults
          const universitiesWithDefaults = savedUniversities?.universities.map(university => ({
            ...university,
            status: 'not-started',
            essayProgress: 0,
            tasks: 0,
            totalTasks: 5,
            name: university.universityName,
          }));
          
          setUniversities(universitiesWithDefaults);
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
        setUniversities(universities.filter(u => u.id !== universityId));
      } else {
        console.error('Failed to remove university');
      }
    } catch (err) {
      console.error('Error removing university:', err);
    }
  };

  // Compute dashboard statistics
  const stats = {
    total: universities.length,
    inProgress: universities.filter(u => u.status === 'in-progress').length,
    submitted: universities.filter(u => u.status === 'submitted').length,
    upcomingDeadlines: universities.filter(u => u.status !== 'submitted').length
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading your saved universities...</p>
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No Saved Universities Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Start by saving some universities to track your applications
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First University
            </button>
          </div>
        )}

        {/* Floating Action Button (Conditional) */}
        {universities.length > 0 && (
          <FloatingAddButton onClick={() => setIsModalOpen(true)} />
        )}

        {/* Add University Modal */}
        <AddUniversityModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onAdd={(newUniversity) => {
            // Add new university with required defaults
            const universityWithDefaults = {
              ...newUniversity,
              id: Date.now(),
              name: newUniversity.universityName || newUniversity.name,
              status: 'not-started',
              essayProgress: 0,
              tasks: 0,
              totalTasks: 5,
            };
            setUniversities([...universities, universityWithDefaults]);
            setIsModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Index;