"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CollegeShowcase from "./components/CollegeShowcase";
import UniversityOverview from "./components/UniversityOverview";
import ApplicationTabs from "./components/ApplicationTabs";
import Header from "./components/Header";

const UniversityPage = () => {
  const params = useParams();
  const slug = params?.university;
  
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('University slug:', slug);

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        
        const response = await fetch(`${API_BASE_URL}/api/university/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch university: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched university data:', data);
        setUniversity(data);
        
      } catch (err) {
        console.error('Error fetching university:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchUniversity();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002147] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading university information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#002147] text-white px-6 py-2 rounded-lg hover:bg-[#001a36] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-gray-400 text-6xl mb-4">🏫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">University not found</h2>
          <p className="text-gray-600 mb-4">The university you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-[#002147] text-white px-6 py-2 rounded-lg hover:bg-[#001a36] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header university={university} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* College Showcase Section */}
        <section className="mb-12">
          <CollegeShowcase university={university} />
        </section>

        {/* University Overview Section */}
        <section className="mb-12">
          <UniversityOverview university={university} />
        </section>

        {/* Application Workspace Section */}
        <section className="mb-12">
          <ApplicationTabs university={university} />
        </section>
      </main>

      
    </div>
  );
};

export default UniversityPage;