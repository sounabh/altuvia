"use client";

import React, { memo } from 'react';
import { Search } from 'lucide-react';

/**
 * SearchBar Component
 *
 * A styled search input field with:
 * - Search icon on the left
 * - Input field for university, location, or program search
 * - Clear button on the right (appears when input has value)
 *
 * Includes animated hover/focus effects for a premium look.
 *
 * @component
 *
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search text entered by the user
 * @param {function} props.setSearchQuery - Function to update the search query
 */
const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative max-w-4xl mx-auto mb-8">
      
      {/* Glow and gradient background layers */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50 to-blue-50 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-110"></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-60"></div>
                
        {/* Search input container */}
        <div className="relative bg-white/95 backdrop-blur-lg border border-gray-200/80 rounded-full shadow-lg group-hover:shadow-xl group-hover:shadow-gray-900/10 transition-all duration-500 group-hover:bg-white/98">
          <div className="flex items-center px-6 py-4">
            
            {/* Search icon */}
            <Search className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-300 group-hover:scale-110" />
            
            {/* Input field */}
            <input
              type="text"
              placeholder="Search universities, locations, or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-4 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400 font-medium focus:placeholder-gray-300 transition-all duration-300"
            />
            
            {/* Clear button (only visible when query exists) */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-4 w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200/90 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/60"
                aria-label="Clear search"
              >
                <span className="text-gray-500 text-lg hover:text-gray-700 transition-colors duration-200">
                  ×
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
