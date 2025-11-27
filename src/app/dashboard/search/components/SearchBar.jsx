"use client";

// React and optimization imports
import React, { memo } from 'react';

// Icon imports
import { Search, X } from 'lucide-react';


/**
 * SearchBar Component
 * 
 * A reusable search input component with:
 * - Clear search functionality
 * - Search icon indicator
 * - Responsive design
 * - Memoized for performance optimization
 * 
 * Features:
 * - Dynamic clear button that appears only when there's text
 * - Smooth hover and focus transitions
 * - Accessible clear button with ARIA label
 * - Clean, modern design with proper spacing
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query value
 * @param {function} props.setSearchQuery - Callback function to update search query
 */
const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative max-w-4xl mx-auto mb-8">
      
      {/* Main Search Container */}
      <div className="relative bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        
        {/* Input Group */}
        <div className="flex items-center px-6 py-4">
          
          {/* Search Icon */}
          <Search className="w-5 h-5 text-gray-400" />
          
          {/* Search Input Field */}
          <input
            type="text"
            placeholder="Search universities, locations, or programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 ml-4 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400 font-medium"
          />
          
          {/* Clear Search Button - Conditionally Rendered */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Display name for debugging and React DevTools
SearchBar.displayName = 'SearchBar';

export default SearchBar;