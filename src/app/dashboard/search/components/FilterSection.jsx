"use client";

// React and optimization imports
import React, { memo } from 'react';

// Icon imports
import { ChevronDown } from 'lucide-react';


/**
 * GMAT Score Filter Options
 * 
 * Defines the available GMAT score ranges for filtering universities.
 * Each option includes a value for state management and a label for display.
 * @constant {Array}
 */
const gmatAverages = [
  { value: 'all', label: 'All Scores' },
  { value: '700+', label: '700 and above' },
  { value: '650-699', label: '650 - 699' },
  { value: '600-649', label: '600 - 649' },
  { value: 'below-600', label: 'Below 600' }
];

/**
 * University Ranking Filter Options
 * 
 * Defines the available university ranking tiers for filtering.
 * Ranges from top-tier institutions to broader categories.
 * @constant {Array}
 */
const rankings = [
  { value: 'all', label: 'All Ranks' },
  { value: 'top-10', label: 'Top 10' },
  { value: 'top-50', label: 'Top 50' },
  { value: 'top-100', label: 'Top 100' },
  { value: '100+', label: 'Ranked 100+' }
];


/**
 * FilterDropdown Component
 * 
 * A reusable dropdown filter component with custom styling and chevron indicator.
 * Features custom appearance with proper accessibility and hover states.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Callback when selection changes
 * @param {Array} props.options - Array of option objects with value and label
 */
const FilterDropdown = memo(({ value, onChange, options }) => (
  <div className="relative group">
    {/* Native Select Element with Custom Styling */}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-white border border-gray-200 px-4 py-3 pr-10 text-gray-700 font-medium hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-all duration-200 cursor-pointer shadow-sm"
    >
      {/* Dynamically Render Options */}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {/* Custom Chevron Indicator */}
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
));

// Display name for debugging and React DevTools
FilterDropdown.displayName = 'FilterDropdown';


/**
 * FilterSection Component
 * 
 * Main filter section that combines multiple filter dropdowns.
 * Provides filtering capabilities for GMAT scores and university rankings.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.selectedGmat - Currently selected GMAT filter value
 * @param {function} props.setSelectedGmat - Callback to update GMAT filter
 * @param {string} props.selectedRanking - Currently selected ranking filter value
 * @param {function} props.setSelectedRanking - Callback to update ranking filter
 */
const FilterSection = memo(({
  selectedGmat,
  setSelectedGmat,
  selectedRanking,
  setSelectedRanking
}) => {
  return (
    // Filter Container with Responsive Layout
    <div className="flex flex-wrap gap-4 justify-center">
      {/* GMAT Score Filter Dropdown */}
      <FilterDropdown
        value={selectedGmat}
        onChange={setSelectedGmat}
        options={gmatAverages}
      />

      {/* University Ranking Filter Dropdown */}
      <FilterDropdown
        value={selectedRanking}
        onChange={setSelectedRanking}
        options={rankings}
      />
    </div>
  );
});

// Display name for debugging and React DevTools
FilterSection.displayName = 'FilterSection';

export default FilterSection;