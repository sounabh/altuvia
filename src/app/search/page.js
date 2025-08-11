"use client";

import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import FilterSection from './components/FilterSection';
import UniversityGrid from './components/UniversityGrid';
import { Filter } from "lucide-react";

/**
 * Main page component for university search and comparison
 * @returns {JSX.Element} Complete university search interface with:
 * - Search bar
 * - Filter controls
 * - University grid display
 */
const Index = () => {
  // State for search and filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGmat, setSelectedGmat] = useState('all');
  const [selectedRanking, setSelectedRanking] = useState('all');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero/Header Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Page Title and Description */}
          <div className="text-center mb-12">
            <h1 className="text-[50px] font-medium">
              Top Global Universities
            </h1>
            <p className="mt-4 text-gray-600">
              Compare and discover the world&apos;s leading universities for your academic journey
            </p>
          </div>

          {/* Search Bar Component */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter Controls Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 bg-gradient-to-r from-white/80 via-violet-50/30 to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-violet-100/50">
          {/* Filter Section Header */}
          <div className="flex items-center gap-2 text-sm font-medium text-blue-500 bg-clip-text">
            <Filter className="h-4 w-4 text-blue-500" />
            Filters
          </div>

          {/* Filter Controls Component */}
          <FilterSection
            selectedGmat={selectedGmat}
            setSelectedGmat={setSelectedGmat}
            selectedRanking={selectedRanking}
            setSelectedRanking={setSelectedRanking}
          />
        </div>

        {/* University Grid Component */}
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