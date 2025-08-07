"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CollegeShowcase from "./components/CollegeShowcase";
import UniversityOverview from "./components/UniversityOverview";
import ApplicationTabs from "./components/ApplicationTabs";

const UniversityPage = () => {
    const params = useParams(); // ✅ returns an object like { university: 'harvard' }
  const slug = params?.university
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedStatus, setSavedStatus] = useState(false);


  console.log(slug);
  

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        setLoading(true);

        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        const response = await fetch(`${API_BASE_URL}/api/university/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch university");
        }

        const data = await response.json();
        setUniversity(data);

        // Check if university is saved
       
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, [slug]);

  const toggleSavedStatus = async () => {
    try {
      const response = await fetch("/api/universities/toggleSaved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ universityId: university.id }),
      });

      if (response.ok) {
        setSavedStatus((prev) => !prev);
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002147]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">University not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CollegeShowcase
          university={university}
          savedStatus={savedStatus}
          toggleSaved={toggleSavedStatus}
        />

        <UniversityOverview
          university={university}
          savedStatus={savedStatus}
          toggleSaved={toggleSavedStatus}
        />

        <ApplicationTabs university={university} />
      </div>
    </div>
  );
};

export default UniversityPage;
