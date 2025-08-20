"use client";
import React, { memo } from 'react';
import { Search } from 'lucide-react';

/**
 * Enhanced search bar component
 * Features:
 * - Long rounded design with smooth gradients and glow effects
 * - Animated hover transitions
 * - Built-in clear button
 *
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query value
 * @param {(value: string) => void} props.setSearchQuery - Handler for updating search query
 * @returns {JSX.Element} Enhanced search bar component
 */
const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="relative group">
        {/* Gradient background effect with smooth hover transition */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-bg-[#e1f0ff] to-bg-[#e1f0ff] rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-110"></div>
        
        {/* Secondary glow layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-[#e1f0ff] to-bg-[#e1f0ff] rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-60"></div>
                
        {/* Main search bar container */}
        <div className="relative bg-white/95 backdrop-blur-lg border border-slate-200/80 rounded-full shadow-2xl shadow-slate-900/10 group-hover:shadow-3xl group-hover:shadow-slate-900/20 transition-all duration-500 group-hover:bg-white/98">
          <div className="flex items-center px-8 py-5">
            
            {/* Search icon */}
            <Search className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-all duration-300 group-hover:scale-110" />
                        
            {/* Search input field */}
            <input
              type="text"
              placeholder="Search universities, locations, or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-6 bg-transparent border-0 outline-none text-slate-900 placeholder-slate-400 font-inter text-lg font-light tracking-wide focus:placeholder-slate-300 transition-all duration-300"
            />
                        
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-4 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/90 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-slate-200/50 hover:border-slate-300/60"
                aria-label="Clear search"
              >
                <span className="text-slate-500 text-lg hover:text-slate-700 transition-colors duration-200">
                  ×
                </span>
              </button>
            )}
          </div>
          
          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
