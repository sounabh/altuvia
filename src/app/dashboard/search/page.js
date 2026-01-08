"use client";

// React and Next.js imports
import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Component imports
import SearchBar from "./components/SearchBar";
import FilterSection from "./components/FilterSection";
import UniversityGrid from "./components/UniversityGrid";

// Icon and animation imports
import { Filter } from "lucide-react";
import { motion } from "framer-motion";


// Navigation Component
const Nav = () => {
  // Session management
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated" && !!session?.token;

  return (
    <nav className="pt-6 pb-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        
        {/* Logo with animations */}
        <div className="font-semibold text-2xl text-[#002147] flex items-center">
          <motion.span
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A
          </motion.span>
          <span>ltu</span>
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-[#3598FE]"
          >
            via
          </motion.span>
        </div>

        {/* Authentication button */}
        {isLoading ? (
          // Loading state
          <div className="px-6 py-2 bg-gray-100 animate-pulse rounded-lg">
            <div className="w-24 h-5 bg-gray-200"></div>
          </div>
        ) : (
          // Authenticated/Unauthenticated state
          <Link href={isLoggedIn ? "/dashboard" : "/"}>
            <button className="px-6 py-2 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-medium text-[15px] transform hover:rounded-3xl">
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};


// Main Component
const Index = () => {
  // State management for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGmat, setSelectedGmat] = useState("all");
  const [selectedRanking, setSelectedRanking] = useState("all");

  // Handler functions with useCallback for optimization
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleGmatChange = useCallback((gmat) => {
    setSelectedGmat(gmat);
  }, []);

  const handleRankingChange = useCallback((ranking) => {
    setSelectedRanking(ranking);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      {/* SEO Title for Client Component */}
      <title>Find Your Future | Search Universities</title>
      
      {/* Background Blobs - Two Medium Round Blobs with Distinct Effects */}
      {/* 
        Background Blobs 
        - Localized to top section
        - Unified Blue Color Scheme (#3598FE based)
        - Subtle and distinct
      */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
          {/* Unified color: Purple changed to Blue to match theme */}
          <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
      </div>

      {/* 
        Hero Header SECTION 
        - Shifted upwards by reducing padding
        - Reduced font sizes for better hierarchy
      */}
      <div className="relative z-10  backdrop-blur-sm">
          {/* Reduced py-16 to py-10 for upward shift */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
             <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                /* Reduced text-4xl/6xl to text-3xl/5xl */
                className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight"
            >
              Find Your <span className="text-[#3598FE]">Future.</span>
             </motion.h1>
             <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                /* Reduced text-lg/xl to text-base/lg */
                className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium"
            >
                Start your journey to success. Explore curated programs, track your favorites on your dashboard, and make informed choices for your future.
             </motion.p>
          </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 
          Controls: Search & Filters 
          - Increased gap between search and filters via space-y-12
        */}
        <div className="max-w-7xl mx-auto mb-20 space-y-12">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
          
          <div className="flex flex-wrap items-center justify-between gap-6 p-1">
             <div className="flex items-center gap-6 text-sm font-bold text-[#002147] bg-white px-3 py-1.5 rounded-lg  shadow-sm">
                <Filter className="h-4 w-4" />
                Filters
             </div>
             <FilterSection
                selectedGmat={selectedGmat}
                setSelectedGmat={handleGmatChange}
                selectedRanking={selectedRanking}
                setSelectedRanking={handleRankingChange}
             />
          </div>
        </div>

        {/* University Masonry Grid */}
        <UniversityGrid
          searchQuery={searchQuery}
          selectedGmat={selectedGmat}
          selectedRanking={selectedRanking}
        />
      </div>
    </div>
  );
};

export default Index;
