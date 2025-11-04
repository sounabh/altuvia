"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { MapPin, Heart, GraduationCap, DollarSign, TrendingUp, Award, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const UniversityCard = memo(({ university }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { data: session, status } = useSession();

  const universityUrl = university.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;

  useEffect(() => {
    if (!university) return;
    setIsAdded(Boolean(university.isAdded));
  }, [university?.isAdded, university?.id]);

  const toggleHeart = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if user is authenticated
    if (status !== "authenticated" || !session?.user) {
      toast.error("Please login to save universities");
      return;
    }

    // Get token from session
    const token = session?.token;

    if (!token) {
      toast.error("Authentication expired, please login again");
      return;
    }

    const previousState = isAdded;
    const newState = !isAdded;

    // ✨ INSTANT UI UPDATE - No loading state
    setIsAdded(newState);

    // Show immediate feedback with pink toast
    if (newState) {
      toast.success("University added to dashboard", {
        style: {
          background: '#ec4899',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    } else {
      toast("University removed from dashboard", {
        style: {
          background: '#6b7280',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    }

    // Make API call in background
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ universityId: university?.id }),
      });

      if (!response.ok) {
        // Revert on failure
        setIsAdded(previousState);
        toast.error(`Failed to ${newState ? 'save' : 'remove'} university. Please try again.`);
      }

    } catch (error) {
      // Revert on failure
      setIsAdded(previousState);
      toast.error("Network error. Please check your connection and try again.");
    }
  }, [isAdded, university?.id, session, status]);

  if (!university) return null;

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 font-roboto h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = universityUrl}
    >
      <div className="flex flex-col h-full">
        {/* Header with Image */}
        <div className="relative h-36 overflow-hidden">
          <img
            src={university?.image}
            alt={university?.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
          
          {/* Rank Badge */}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded-lg shadow flex items-center">
            <Award className="w-3 h-3 mr-1 text-blue-600" />
            #{university?.rank}
          </div>
          
          {/* Heart Button - No Loading State */}
          <button
            onClick={toggleHeart}
            className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
              isAdded
                ? "bg-rose-500 text-white shadow-md"
                : "bg-white/90 text-gray-600 hover:text-rose-500 shadow-sm"
            }`}
          >
            <Heart className={`w-4 h-4 transition-all ${isAdded ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-grow flex flex-col">
          {/* University Name and Location */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {university?.name}
            </h3>
            <div className="flex items-center text-gray-600 text-xs">
              <MapPin className="w-3 h-3 mr-1 text-blue-500" />
              <span className="line-clamp-1">{university?.location}</span>
            </div>
          </div>

          {/* Key Metrics Grid - Compact */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* GMAT Score */}
            <div className="flex items-center bg-blue-50 rounded-lg p-2 border border-blue-100">
              <TrendingUp className="w-3 h-3 text-blue-600 mr-1.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">GMAT</div>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {university?.gmatAvg || 'N/A'}
                </div>
              </div>
            </div>

            {/* Acceptance Rate */}
            <div className="flex items-center bg-green-50 rounded-lg p-2 border border-green-100">
              <GraduationCap className="w-3 h-3 text-green-600 mr-1.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-medium text-green-700 uppercase tracking-wide">Acceptance</div>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {university?.acceptRate || 'N/A'}%
                </div>
              </div>
            </div>

            {/* Tuition */}
            <div className="flex items-center bg-amber-50 rounded-lg p-2 border border-amber-100">
              <DollarSign className="w-3 h-3 text-amber-600 mr-1.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wide">Tuition</div>
                <div className="text-xs font-semibold text-gray-900 truncate">
                  {university?.tuitionFee || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Application Fee */}
            <div className="flex items-center bg-purple-50 rounded-lg p-2 border border-purple-100">
              <Zap className="w-3 h-3 text-purple-600 mr-1.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-medium text-purple-700 uppercase tracking-wide">Additional Fee</div>
                <div className="text-xs font-semibold text-gray-900 truncate">
                  {university?.applicationFee || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Advantages Section - Always Visible with Scrollbar */}
          {university?.pros && university.pros.length > 0 && (
            <div className="mt-auto pt-2 border-t border-gray-100">
              <div className="flex items-center text-xs font-bold text-green-800 mb-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                Key Advantages
              </div>
              <div className="bg-green-50/60 rounded-lg p-2 max-h-16 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {university.pros.slice(0, 3).map((advantage, index) => (
                    <div key={index} className="flex items-start text-xs text-gray-800">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-1.5 flex-shrink-0"></div>
                      <span className="flex-1">{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-4 pb-4 pt-0">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center text-sm font-semibold py-2 rounded-lg shadow-md transition-all duration-300 group-hover:shadow-lg">
          View Details →
        </div>
      </div>

      {/* Hover effect */}
      <div 
        className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
          isHovered ? 'ring-2 ring-blue-200 bg-blue-50/5' : ''
        }`} 
      />

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
});

UniversityCard.displayName = "UniversityCard";

export default UniversityCard;