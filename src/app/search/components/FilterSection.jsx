import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * GMAT score filter options
 * Each option contains a `value` (for filtering logic)
 * and a `label` (for UI display).
 * @type {{ value: string, label: string }[]}
 */
const gmatAverages = [
  { value: 'all', label: 'All Scores' },
  { value: '700+', label: '700 and above' },
  { value: '650-699', label: '650 - 699' },
  { value: '600-649', label: '600 - 649' },
  { value: 'below-600', label: 'Below 600' }
];

/**
 * University ranking filter options
 * Each option contains a `value` (for filtering logic)
 * and a `label` (for UI display).
 * @type {{ value: string, label: string }[]}
 */
const rankings = [
  { value: 'all', label: 'All Ranks' },
  { value: 'top-10', label: 'Top 10' },
  { value: 'top-50', label: 'Top 50' },
  { value: 'top-100', label: 'Top 100' },
  { value: '100+', label: 'Ranked 100+' }
];

/**
 * Memoized dropdown component for filtering
 * Prevents unnecessary re-renders on parent updates.
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected value
 * @param {(value: string) => void} props.onChange - Change handler
 * @param {{ value: string, label: string }[]} props.options - Options for dropdown
 * @returns {JSX.Element} Filter dropdown component
 */
const FilterDropdown = memo(({ value, onChange, options }) => (
  <div className="relative group">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl px-4 py-3 pr-10 text-slate-700 font-medium hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 cursor-pointer shadow-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {/* Chevron icon inside dropdown */}
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors duration-200" />
  </div>
));

FilterDropdown.displayName = 'FilterDropdown';

/**
 * Main filter section
 * Renders GMAT and Ranking dropdowns for filtering.
 * Memoized to prevent unnecessary re-renders when parent state changes.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectedGmat - Selected GMAT filter value
 * @param {(value: string) => void} props.setSelectedGmat - GMAT change handler
 * @param {string} props.selectedRanking - Selected ranking filter value
 * @param {(value: string) => void} props.setSelectedRanking - Ranking change handler
 * @returns {JSX.Element} Filter section component
 */
const FilterSection = memo(({
  selectedGmat,
  setSelectedGmat,
  selectedRanking,
  setSelectedRanking
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {/* GMAT filter dropdown */}
      <FilterDropdown
        value={selectedGmat}
        onChange={setSelectedGmat}
        options={gmatAverages}
      />

      {/* Ranking filter dropdown */}
      <FilterDropdown
        value={selectedRanking}
        onChange={setSelectedRanking}
        options={rankings}
      />
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;
