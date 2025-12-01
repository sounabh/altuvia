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



// Main Component
const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGmat, setSelectedGmat] = useState("all");
  const [selectedRanking, setSelectedRanking] = useState("all");

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
     

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-semibold text-[#002147] mb-4">
              Find Your Perfect University
            </h1>
            <p className="text-lg text-gray-600">
              Compare and discover the world&apos;s leading universities for your academic journey and add to your dashboard.
            </p>
          </div>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
        </div>
      </div>

      {/* Main Content Section - Properly constrained */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filters Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 bg-white border border-gray-200 shadow-sm rounded-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#002147]">
            <Filter className="h-5 w-5" />
            Filters
          </div>

          <FilterSection
            selectedGmat={selectedGmat}
            setSelectedGmat={handleGmatChange}
            selectedRanking={selectedRanking}
            setSelectedRanking={handleRankingChange}
          />
        </div>

        {/* University Grid - Full width within container */}
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