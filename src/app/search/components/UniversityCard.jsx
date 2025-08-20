"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";

/**
 * UniversityCard Component
 *
 * Renders a card UI for a university with:
 * - Image, name, location, and ranking
 * - GMAT average, acceptance rate, tuition & application fee
 * - Advantages (pros) and Considerations (cons)
 * - "Add / Added" button to save universities for the user
 */
const UniversityCard = memo(({ university }) => {
  // Track if the university is already added/saved
  const [isAdded, setIsAdded] = useState(false);
  
  // Track loading state for the "Add" button
  const [isLoading, setIsLoading] = useState(false);

  // Generate clean university URL (slug > id fallback)
  const universityUrl = university.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;

  /**
   * Effect: Set initial saved state from API data
   * Fixed logic to properly check if current user has saved this university
   */
  useEffect(() => {
    if (!university) return;
    
    // Check if savedByUsers exists and has data
    if (Array.isArray(university.savedByUsers)) {
      // If the array has any items, it means the current user has saved this university
      // (because the API filters savedByUsers to only include current user's data)
      setIsAdded(university.savedByUsers.length > 0);
    } else if (typeof university.isAdded === 'boolean') {
      // Fallback to isAdded property if it exists
      setIsAdded(university.isAdded);
    } else {
      // Default to false if no saved state information is available
      setIsAdded(false);
    }
  }, [university?.savedByUsers, university?.isAdded, university?.id]);

  /**
   * Handler: Toggle "Add / Added" state for the university
   * - Optimistically updates UI
   * - Sends request to backend
   * - Handles errors with proper rollback
   */
  const toggleAdd = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();

      // Get auth token from localStorage
      let authData;
      try {
        authData = localStorage.getItem("authData");
        if (!authData) {
          console.error("No auth data found");
          return;
        }
      } catch (error) {
        console.error("Failed to get auth data:", error);
        return;
      }

      const { token } = JSON.parse(authData);
      if (!token) {
        console.error("No token found in auth data");
        return;
      }

      const newState = !isAdded;

      // Optimistic UI update
      setIsAdded(newState);
      setIsLoading(true);

      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        const response = await fetch(
          `${API_BASE_URL}/api/university/toggleSaved`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ universityId: university?.id }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Toggle response:", data); // For debugging
          
          // Always use the API response as the source of truth
          setIsAdded(data.isAdded);
        } else {
          console.error("Toggle failed:", response.status, response.statusText);
          // Rollback on error
          setIsAdded(!newState);
        }
      } catch (error) {
        console.error("Network error during toggle:", error);
        // Rollback on network failure
        setIsAdded(!newState);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdded, university?.id]
  );

  // If no university data is passed, render nothing
  if (!university) return null;

  return (
    <div className="group relative mt-14 bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-500 overflow-hidden">
      {/* University Image + Rank + Add Button */}
      <div className="relative overflow-hidden">
        <Link href={universityUrl}>
          <div className="aspect-[4/3] bg-slate-100 cursor-pointer">
            <img
              src={university?.image}
              alt={university?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
        </Link>

        {/* University Rank Badge */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
          {university?.rank}
        </div>

        {/* Add / Added Button */}
        <button
          onClick={toggleAdd}
          disabled={isLoading}
          className={`absolute top-4 right-4 z-20 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-sm ${
            isAdded
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200"
          } ${isLoading ? "opacity-75" : ""}`}
        >
          {isLoading ? "..." : isAdded ? "Added" : "Add"}
        </button>
      </div>

      {/* University Content Section */}
      <Link href={universityUrl}>
        <div className="p-6 cursor-pointer">
          {/* Name + Location */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
              {university?.name}
            </h3>
            <div className="flex items-center text-slate-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {university?.location}
            </div>
          </div>

          {/* Stats: GMAT Avg + Acceptance Rate */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {university?.gmatAvg}
              </div>
              <div className="text-sm text-slate-600">GMAT Avg</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {university?.acceptRate}%
              </div>
              <div className="text-sm text-slate-600">Accept Rate</div>
            </div>
          </div>

          {/* Fees Section */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">📅</span>
              <span className="text-slate-700 font-medium">
                {university?.tuitionFee}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">💰</span>
              <span className="text-slate-700 font-medium">
                {university?.applicationFee}
              </span>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="space-y-3">
            {/* Pros */}
            <div>
              <div className="flex items-center mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium text-slate-700">
                  Advantages
                </span>
              </div>
              <ul className="space-y-1 ml-4">
                {university?.pros?.slice(0, 2).map((pro, index) => (
                  <li
                    key={index}
                    className="text-sm text-slate-600 flex items-center"
                  >
                    <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center mb-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium text-slate-700">
                  Considerations
                </span>
              </div>
              <ul className="space-y-1 ml-4">
                {university?.cons?.slice(0, 2).map((con, index) => (
                  <li
                    key={index}
                    className="text-sm text-slate-600 flex items-center"
                  >
                    <span className="w-1 h-1 bg-slate-400 rounded-full mr-2"></span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Link>

      {/* Hover Ring Effect */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-900/5 group-hover:ring-blue-500/20 group-hover:ring-2 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
});

// Set displayName for React DevTools
UniversityCard.displayName = "UniversityCard";

export default UniversityCard;