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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Nav />
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Hero text content */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-semibold text-[#002147] mb-4">
              Find Your Perfect University
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compare and discover the world&apos;s leading universities for your academic journey
            </p>
          </div>

          {/* Search bar component */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 bg-white border border-gray-200 shadow-sm">
          
          {/* Filter header */}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#002147]">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          {/* Filter controls */}
          <FilterSection
            selectedGmat={selectedGmat}
            setSelectedGmat={handleGmatChange}
            selectedRanking={selectedRanking}
            setSelectedRanking={handleRankingChange}
          />
        </div>

        {/* University Grid */}
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