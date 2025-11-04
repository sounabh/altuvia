"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CollegeShowcase from "./components/CollegeShowcase";
import UniversityOverview from "./components/UniversityOverview";
import ApplicationTabs from "./components/ApplicationTabs";
import Header from "./components/Header";
import { useSession } from "next-auth/react";

// Skeleton Components
const HeaderSkeleton = () => (
  <div className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

const CollegeShowcaseSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="border rounded-lg p-4">
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

const UniversityOverviewSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
    <div className="h-6 bg-gray-200 rounded w-56 mb-6 animate-pulse"></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="text-center p-4 border rounded-lg">
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ApplicationTabsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
    <div className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        ))}
      </div>
    </div>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const UniversityPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <HeaderSkeleton />
    
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* College Showcase Section */}
      <section className="mb-12">
        <CollegeShowcaseSkeleton />
      </section>

      {/* University Overview Section */}
      <section className="mb-12">
        <UniversityOverviewSkeleton />
      </section>

      {/* Application Workspace Section */}
      <section className="mb-12">
        <ApplicationTabsSkeleton />
      </section>
    </main>
  </div>
);

const UniversityPage = () => {
  const params = useParams();
  const slug = params?.university;
  const { data: session, status } = useSession();
  
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        setLoading(true);

        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        // Build headers with session token if available
        const headers = {
          "Content-Type": "application/json",
        };

        // Add authorization header if user is authenticated
        if (status === "authenticated" && session?.token) {
          headers["Authorization"] = `Bearer ${session?.token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/university/${slug}`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch university: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched university data:", data);
        setUniversity(data);
      } catch (err) {
        console.error("Error fetching university:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Wait for session to finish loading before fetching
    // This ensures we include the token if user is logged in
    if (status !== "loading" && slug) {
      fetchUniversity();
    }
  }, [slug, session, status]);

  // Show loading skeleton while session is loading or data is being fetched
  if (loading || status === "loading") {
    return <UniversityPageSkeleton />;
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