"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const UniversityCard = memo(({ university, index = 0, onToggleSuccess }) => {
  const [isAdded, setIsAdded] = useState(false);
  const { data: session, status } = useSession();

  const universityUrl = university?.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university?.id}`;

  // Sync saved state from university data
  useEffect(() => {
    if (!university) return;
    setIsAdded(Boolean(university.isAdded));
  }, [university?.isAdded, university?.id]);

  // ✅ Format rank with proper fallback handling
  const formatRank = (rank) => {
    // Handle null, undefined, empty string
    if (rank === null || rank === undefined || rank === '' || rank === 'N/A') {
      return null;
    }
    
    // Convert to string and clean up
    const rankStr = String(rank).trim();
    
    // If it's empty after trim, return null
    if (!rankStr) return null;
    
    // If it already starts with #, return as is
    if (rankStr.startsWith('#')) {
      return rankStr;
    }
    
    // If it's a number or can be parsed as one
    const rankNum = parseInt(rankStr.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(rankNum) && rankNum > 0) {
      return `#${rankNum}`;
    }
    
    // If it's a text rank like "Top 10", "Tier 1", etc.
    if (rankStr.length > 0) {
      return rankStr;
    }
    
    return null;
  };

  const displayRank = formatRank(university?.rank);

  const toggleHeart = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (status !== "authenticated" || !session?.user) {
      toast.error("Please login to save universities");
      return;
    }

    const token = session?.token;

    if (!token) {
      toast.error("Authentication expired, please login again");
      return;
    }

    const previousState = isAdded;
    const newState = !isAdded;

    // Optimistic update
    setIsAdded(newState);

    // Notify parent to update its state & cache
    if (onToggleSuccess) {
      onToggleSuccess(university?.id, newState);
    }

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
        if (onToggleSuccess) {
          onToggleSuccess(university?.id, previousState);
        }
        toast.error(`Failed to ${newState ? 'save' : 'remove'} university. Please try again.`);
      }

    } catch (error) {
      // Revert on error
      setIsAdded(previousState);
      if (onToggleSuccess) {
        onToggleSuccess(university?.id, previousState);
      }
      toast.error("Network error. Please check your connection and try again.");
    }
  }, [isAdded, university?.id, session, status, onToggleSuccess]);

  if (!university) return null;

  const variations = [
    { border: "border-blue-100", bg: "bg-blue-50/30" },
    { border: "border-purple-100", bg: "bg-purple-50/30" },
    { border: "border-emerald-100", bg: "bg-emerald-50/30" },
    { border: "border-rose-100", bg: "bg-rose-50/30" },
  ];
  const style = variations[index % variations.length];

  return (
    <div 
      className="group relative flex flex-col w-full cursor-pointer break-inside-avoid"
      onClick={() => window.location.href = universityUrl}
    >
      {/* Image Block */}
      <div className="relative h-52 w-full mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
        <Image
          src={university?.image || '/placeholder-university.jpg'}
          alt={university?.name || "University Image"}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={80}
        />
        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
        
        {/* ✅ Rank Badge - Only show if rank exists */}
        {displayRank && (
          <div className="absolute top-3 left-3">
            <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-bold tracking-wide uppercase text-[#002147] shadow-sm flex items-center gap-1">
              <span className="text-amber-500">🏆</span>
              <span>Rank {displayRank}</span>
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={toggleHeart}
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-300 shadow-sm backdrop-blur-md flex items-center gap-1.5 ${
            isAdded
              ? "bg-white text-[#E11D48] shadow-md transform scale-105"
              : "bg-black/30 text-white border border-white/20 hover:bg-white hover:text-[#E11D48]"
          }`}
        >
          {isAdded ? (
            <>
              <Heart className="w-3 h-3 fill-current" />
              <span>Added</span>
            </>
          ) : (
            <span>+ Add</span>
          )}
        </button>

        {/* Location Tag */}
        {university?.location && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center text-white text-xs font-semibold drop-shadow-md">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {university.location}
            </div>
          </div>
        )}
      </div>

      {/* Content Block */}
      <div className={`flex flex-col ${style.bg} rounded-2xl p-3 border ${style.border} shadow-sm transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -z-10" />
        
        {/* Header */}
        <h3 className="text-[#002147] font-bold text-[16px] leading-tight mb-2 group-hover:text-[#3598FE] transition-colors">
          {university?.name}
        </h3>

        {/* Stats Grid */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 rounded-xl border border-gray-100 mb-4">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">🎓</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GMAT</span>
            </div>
            <span className="block text-[13px] font-bold text-[#002147]">
              {university?.gmatAvg || '-'}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">💰</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tuition</span>
            </div>
            <span className="block text-[13px] font-bold text-[#002147] whitespace-nowrap">
              {university?.tuitionFee 
                ? `$${parseInt(university.tuitionFee.toString().replace(/,/g, '')).toLocaleString()}` 
                : '-'}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">⚡</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accept</span>
            </div>
            <span className="block text-[13px] font-bold text-[#002147]">
              {university?.acceptRate ? `${university.acceptRate}%` : '-'}
            </span>
          </div>
        </div>

        {/* Advantages */}
        {university?.pros && university.pros.length > 0 && (
          <div className="space-y-1 mb-2">
            {university.pros.slice(0, 2).map((pro, idx) => (
              <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-white/60 transition-colors duration-200">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3598FE] flex-shrink-0" />
                <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed">
                  {pro}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View Sign/Action */}
        <div className="mt-2 flex items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#3598FE] group/btn transition-all">
            View Details
            <div className="w-6 h-6 rounded-full bg-[#3598FE]/10 flex items-center justify-center group-hover/btn:bg-[#3598FE] group-hover/btn:scale-110 transition-all duration-300">
              <TrendingUp className="w-3.5 h-3.5 text-[#3598FE] group-hover/btn:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UniversityCard.displayName = "UniversityCard";

export default UniversityCard;