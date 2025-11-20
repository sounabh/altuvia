"use client";

// React and hooks imports
import React, { useState, useEffect, useCallback, memo } from "react";
import { useSession } from "next-auth/react";

// Icon and UI imports
import { MapPin, Heart, GraduationCap, DollarSign, TrendingUp, Award, Zap } from "lucide-react";
import { toast } from "sonner";


// University Card Component with memo for performance optimization
const UniversityCard = memo(({ university }) => {
  // State and session management
  const [isAdded, setIsAdded] = useState(false);
  const { data: session, status } = useSession();

  // Construct university URL based on available data
  const universityUrl = university.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;

  // Effect to sync saved state from university data
  useEffect(() => {
    if (!university) return;
    setIsAdded(Boolean(university.isAdded));
  }, [university?.isAdded, university?.id]);

  // Toggle save/unsave functionality
  const toggleHeart = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Authentication check
    if (status !== "authenticated" || !session?.user) {
      toast.error("Please login to save universities");
      return;
    }

    const token = session?.token;

    // Token validation
    if (!token) {
      toast.error("Authentication expired, please login again");
      return;
    }

    // Optimistic UI update
    const previousState = isAdded;
    const newState = !isAdded;

    setIsAdded(newState);

    // Toast notifications for user feedback
    if (newState) {
      toast.success("University added to dashboard", {
        style: {
          background: '#3598FE',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    } else {
      toast("University removed from dashboard", {
        style: {
          background: '#002147',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    }

    // API call to update saved status
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

      // Handle API errors
      if (!response.ok) {
        setIsAdded(previousState);
        toast.error(`Failed to ${newState ? 'save' : 'remove'} university. Please try again.`);
      }

    } catch (error) {
      // Revert optimistic update on error
      setIsAdded(previousState);
      toast.error("Network error. Please check your connection and try again.");
    }
  }, [isAdded, university?.id, session, status]);

  // Return null if no university data
  if (!university) return null;

  return (
    <div 
      className="group relative bg-white border border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col font-sans hover:shadow-lg"
      onClick={() => window.location.href = universityUrl}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      
      {/* Extended Image Header - 60% of card */}
      <div className="relative h-64 overflow-hidden">
        
        {/* University Image */}
        <img
          src={university?.image}
          alt={university?.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Elegant Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/90 via-[#002147]/40 to-transparent" />
        
        {/* Top Action Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-20">
          
          {/* Heart Button for saving */}
          <button
            onClick={toggleHeart}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isAdded
                ? "bg-white text-[#3598FE]"
                : "bg-white/90 text-[#002147] hover:bg-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isAdded ? 'fill-current' : ''}`} />
          </button>

          {/* Rank Badge */}
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5 text-[#3598FE]" />
            <span className="text-xs font-semibold text-[#002147]">Rank #{university?.rank}</span>
          </div>
        </div>

        {/* University Info Overlay - On Image */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          <h3 className="text-white font-semibold text-xl mb-2 leading-tight">
            {university?.name}
          </h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>{university?.location}</span>
          </div>
        </div>
      </div>

      {/* Compact Content Section - 40% of card */}
      <div className="p-5 flex-grow flex flex-col bg-gray-50">
        
        {/* Stats Row - Horizontal Layout with 4 metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          
          {/* GMAT Average */}
          <div className="text-center p-2 bg-white border border-gray-200 rounded hover:border-[#3598FE] transition-colors">
            <TrendingUp className="w-4 h-4 text-[#3598FE] mx-auto mb-1" />
            <div className="text-xs text-gray-500 mb-0.5">GMAT</div>
            <div className="text-sm font-bold text-[#002147]">{university?.gmatAvg || 'N/A'}</div>
          </div>

          {/* Acceptance Rate */}
          <div className="text-center p-2 bg-white border border-gray-200 rounded hover:border-[#3598FE] transition-colors">
            <GraduationCap className="w-4 h-4 text-[#3598FE] mx-auto mb-1" />
            <div className="text-xs text-gray-500 mb-0.5">Accept</div>
            <div className="text-sm font-bold text-[#002147]">{university?.acceptRate}%</div>
          </div>

          {/* Tuition Fee */}
          <div className="text-center p-2 bg-white border border-gray-200 rounded hover:border-[#3598FE] transition-colors">
            <DollarSign className="w-4 h-4 text-[#3598FE] mx-auto mb-1" />
            <div className="text-xs text-gray-500 mb-0.5">Tuition</div>
            <div className="text-xs font-semibold text-[#002147]">{university?.tuitionFee || 'N/A'}</div>
          </div>

          {/* Application Fee */}
          <div className="text-center p-2 bg-white border border-gray-200 rounded hover:border-[#3598FE] transition-colors">
            <Zap className="w-4 h-4 text-[#3598FE] mx-auto mb-1" />
            <div className="text-xs text-gray-500 mb-0.5">Fee</div>
            <div className="text-xs font-semibold text-[#002147]">{university?.applicationFee || 'N/A'}</div>
          </div>
        </div>

        {/* Advantages List */}
        {university?.pros && university.pros.length > 0 && (
          <div className="flex-grow">
            <div className="text-xs font-semibold text-[#002147] uppercase tracking-wide mb-2">Key Advantages</div>
            <ul className="space-y-1.5">
              {university.pros.slice(0, 3).map((advantage, index) => (
                <li key={index} className="flex items-start text-xs text-gray-700">
                  <span className="inline-block w-1 h-1 bg-[#3598FE] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span className="line-clamp-2">{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Button */}
        <button className="mt-4 w-full bg-[#002147] hover:bg-[#3598FE] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-700 ease-in-out transform hover:rounded-3xl">
          View Details →
        </button>
      </div>
    </div>
  );
});

// Display name for debugging purposes
UniversityCard.displayName = "UniversityCard";

export default UniversityCard;