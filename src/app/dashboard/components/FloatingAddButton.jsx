import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Floating action button component with animated effects
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler function
 * @returns {JSX.Element} Floating button with:
 * - Gradient background
 * - Hover scale animation
 * - Glow effect
 * - Icon rotation animation
 * - Fixed positioning
 */
export const FloatingAddButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 hover:scale-110 transition-all duration-300 flex items-center justify-center group z-50"
      aria-label="Add new item"
    >
      {/* Main Plus Icon */}
      <Plus className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" />
      
      {/* Glow Effect (shown on hover) */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md" />
    </button>
  );
};