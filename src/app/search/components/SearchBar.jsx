import React from 'react';
import { Search } from 'lucide-react';



const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
        <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-900/5 group-hover:shadow-xl group-hover:shadow-slate-900/10 transition-all duration-300">
          <div className="flex items-center px-6 py-4">
            <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search universities, locations, or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 ml-4 bg-transparent border-0 outline-none text-slate-900 placeholder-black font-inter text-lg font-light"
            />
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