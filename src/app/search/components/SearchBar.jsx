import React from 'react';
import { Search } from 'lucide-react';

// SearchBar component for handling search input
const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative max-w-2xl mx-auto">

      {/* Wrapper for background blur hover effect */}
      <div className="relative group">

        {/* Gradient blur background that appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

        {/* Search input container with border and backdrop blur */}
        <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-900/5 group-hover:shadow-xl group-hover:shadow-slate-900/10 transition-all duration-300">

          {/* Search icon, input field and clear button */}
          <div className="flex items-center px-6 py-4">

            {/* Search icon */}
            <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />

            {/* Text input field */}
            <input
              type="text"
              placeholder="Search universities, locations, or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-4 bg-transparent border-0 outline-none text-slate-900 placeholder-black font-inter text-lg font-light"
            />

            {/* Clear (×) button, appears only when there's input */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200"
              >
                <span className="text-slate-500 text-sm">×</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
