"use client";
import React, { useState, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import FilterSection from "./components/FilterSection";
import UniversityGrid from "./components/UniversityGrid";
import { Filter } from "lucide-react";

/**
 * Main page component for university search and comparison
 * Handles search, GMAT, and ranking filters with memoized state management
 * @component
 * @returns {JSX.Element} Complete university search interface
 */
const Index = () => {
  // ----------------------------
  // State Management
  // ----------------------------

  /** Search query entered by the user */
  const [searchQuery, setSearchQuery] = useState("");

  /** Selected GMAT filter option */
  const [selectedGmat, setSelectedGmat] = useState("all");

  /** Selected ranking filter option */
  const [selectedRanking, setSelectedRanking] = useState("all");

  // ----------------------------
  // Handlers (Memoized with useCallback to avoid re-renders)
  // ----------------------------

  /**
   * Handle search input changes
   * @param {string} query - The search term entered by the user
   */
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  /**
   * Handle GMAT filter selection
   * @param {string} gmat - Selected GMAT filter value
   */
  const handleGmatChange = useCallback((gmat) => {
    setSelectedGmat(gmat);
  }, []);

  /**
   * Handle ranking filter selection
   * @param {string} ranking - Selected ranking filter value
   */
  const handleRankingChange = useCallback((ranking) => {
    setSelectedRanking(ranking);
  }, []);

  // ----------------------------
  // Render
  // ----------------------------

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* ----------------------------
          Background Decorative Elements
         ---------------------------- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Primary large blur - top right */}
        <div className="absolute top-[10%] right-[5%] w-[1200px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/40 via-bg-[#e1f0ff] to-bg-[#e1f0ff] blur-[150px]"></div>

        {/* Secondary blur - left side */}
        <div className="absolute top-[40%] left-[-10%] w-[1000px] h-[900px] rounded-full bg-gradient-to-tr from-bg-[#e1f0ff] via-blue-200/25 to-bg-[#e1f0ff] blur-[140px]"></div>

        {/* Tertiary blur - bottom center */}
        <div className="absolute bottom-[20%] left-[30%] w-[800px] h-[600px] rounded-full bg-gradient-to-t from-bg-[#e1f0ff] via-white to-blue-200 blur-[120px]"></div>

        {/* Additional accent blurs */}
        <div className="absolute top-[70%] right-[20%] w-[600px] h-[400px] rounded-full bg-gradient-to-bl from-blue-300/25 to-bg-[#e1f0ff] blur-[100px]"></div>
        <div className="absolute top-[15%] left-[40%] w-[500px] h-[300px] rounded-full bg-gradient-to-r from-violet-300/20 to-bg-[#e1f0ff] blur-[90px]"></div>
      </div>

      {/* ----------------------------
          Hero/Header Section
         ---------------------------- */}
      <div className="relative z-10">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Title & Description */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-3xl -m-8"></div>
            <div className="relative z-10">
              <h1 className="text-[2.5rem] tracking-normal font-normal leading-12 font-roboto mt-10 text-black drop-shadow-sm">
                Find Your Perfect University
              </h1>
              <p className="text-lg font-normal tracking-normal leading-7 mt-7 text-black/90 drop-shadow-sm">
                Compare and discover the world&apos;s leading universities for your academic journey
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
        </div>
      </div>

      {/* ----------------------------
          Main Content Area
         ---------------------------- */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Filter Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 relative">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-bg-[#e1f0ff] to-bg-[#e1f0ff] rounded-3xl"></div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 w-full">
            {/* Section header */}
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 drop-shadow-sm">
              <Filter className="h-4 w-4 text-blue-600" />
              Filters
            </div>

            {/* Filter Controls */}
            <FilterSection
              selectedGmat={selectedGmat}
              setSelectedGmat={handleGmatChange}
              selectedRanking={selectedRanking}
              setSelectedRanking={handleRankingChange}
            />
          </div>
        </div>

        {/* University Grid */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-3xl -m-4"></div>
          <div className="relative z-10">
            <UniversityGrid
              searchQuery={searchQuery}
              selectedGmat={selectedGmat}
              selectedRanking={selectedRanking}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
