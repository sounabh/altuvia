"use client";
import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

/**
 * University card component displaying university information with interactive features
 * @param {Object} props - Component props
 * @param {Object} props.university - University data object containing:
 *   @param {string} id - University identifier
 *   @param {string} name - University name
 *   @param {string} image - URL of university image
 *   @param {string} rank - University ranking
 *   @param {string} location - University location
 *   @param {number} gmatAvg - Average GMAT score
 *   @param {number} acceptRate - Acceptance rate percentage
 *   @param {string} tuitionFee - Tuition fee information
 *   @param {string} applicationFee - Application fee information
 *   @param {Array} pros - List of advantages
 *   @param {Array} cons - List of considerations
 *   @param {Array} savedByUsers - Array of users who saved this university
 *   @param {boolean} isAdded - Initial saved status (optional)
 * @returns {JSX.Element} Interactive university card component
 */
const UniversityCard = ({ university }) => {
  const [isAdded, setIsAdded] = useState(university?.isAdded);
  const [isLoading, setIsLoading] = useState(false);

 console.log(university,"card page");

  /**
   * Effect to initialize saved status by checking if current user has saved this university
   * Checks localStorage for auth data and compares with savedByUsers array
   */
  useEffect(() => {
    try {
      const authData = localStorage.getItem("authData");
      if (!authData) return;

      const parsedData = JSON.parse(authData);
      const userId = parsedData.userId;

      // Check if user's id is inside savedByUsers array of objects
      const isSaved = Array.isArray(university.savedByUsers) &&
        university.savedByUsers.some((user) => user.id === userId);

      setIsAdded(isSaved);
    } catch (error) {
      console.error("Error initializing saved status:", error);
    }
  }, [university.savedByUsers]);

  /**
   * Toggle university saved status
   * @param {Event} e - Click event
   */
  const toggleAdd = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log("Button clicked!");
    console.log(university?.id, "university id");
    
    // Get fresh auth data from localStorage
    const authData = typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    
    if (!authData) {
      console.warn("⚠️ No auth data found in localStorage");
      return;
    }

    const parsedData = JSON.parse(authData);
    console.log(parsedData.token, "token");

    setIsLoading(true); // Show loading state
    
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_BASE_URL}/api/university/toggleSaved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedData.token}`,
          },
          body: JSON.stringify({ universityId: university?.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsAdded(data.isAdded); // Update state from response
        console.log("Successfully toggled:", data.isAdded);
      } else {
        console.error("Failed to update status:", response.status);
      }
    } catch (error) {
      console.error("Error toggling add:", error);
    } finally {
      setIsLoading(false); // Hide loading state
    }
  };

  // Early return if no university data
  if (!university) {
    console.warn("⚠️ No university data provided");
    return null;
  }

  return (
    <div className="group relative mt-14 bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-500 overflow-hidden">
      {/* ---------- Image Section with Rank Badge and Add Button ---------- */}
      <div className="relative overflow-hidden">
        {/* University Image */}
        <div className="aspect-[4/3] bg-slate-100">
          <img
            src={university?.image}
            alt={university?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* University Rank Badge */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
          {university?.rank}
        </div>

        {/* Add/Added Button */}
        <button
          onClick={toggleAdd}
          disabled={isLoading}
          className={`absolute top-4 right-4 z-20 px-4 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all duration-300 backdrop-blur-sm ${
            isAdded
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "..." : isAdded ? "Added" : "Add"}
        </button>
      </div>

      {/* ---------- University Info Section ---------- */}
      <div className="p-6">
        {/* University Name & Location */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
            {university?.name}
          </h3>
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {university?.location}
          </div>
        </div>

        {/* GMAT & Acceptance Rate Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* GMAT Average */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {university?.gmatAvg}
            </div>
            <div className="text-sm text-slate-600">GMAT Avg</div>
          </div>

          {/* Acceptance Rate */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {university?.acceptRate}%
            </div>
            <div className="text-sm text-slate-600">Accept Rate</div>
          </div>
        </div>

        {/* Tuition & Application Fees */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          {/* Tuition Fee */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">📅</span>
            <span className="text-slate-700 font-medium">
              {university?.tuitionFee}
            </span>
          </div>

          {/* Application Fee */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">💰</span>
            <span className="text-slate-700 font-medium">
              {university?.applicationFee}
            </span>
          </div>
        </div>

        {/* ---------- Pros and Cons Section ---------- */}
        <div className="space-y-3">
          {/* Pros List */}
          <div>
            <div className="flex items-center mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium text-slate-700">
                Advantages
              </span>
            </div>
            <ul className="space-y-1 ml-4">
              {university?.pros?.map((pro, index) => (
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

          {/* Cons List */}
          <div>
            <div className="flex items-center mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium text-slate-700">
                Considerations
              </span>
            </div>
            <ul className="space-y-1 ml-4">
              {university?.cons?.map((con, index) => (
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

      {/* Hover Effect Border Overlay */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-900/5 group-hover:ring-blue-500/20 group-hover:ring-2 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default UniversityCard;