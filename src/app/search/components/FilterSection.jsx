import React from 'react';
import { ChevronDown } from 'lucide-react';

const gmatAverages = [
  { value: 'all', label: 'All Scores' },
  { value: '700+', label: '700 and above' },
  { value: '650-699', label: '650 - 699' },
  { value: '600-649', label: '600 - 649' },
  { value: 'below-600', label: 'Below 600' }
];

const rankings = [
  { value: 'all', label: 'All Ranks' },
  { value: 'top-10', label: 'Top 10' },
  { value: 'top-50', label: 'Top 50' },
  { value: 'top-100', label: 'Top 100' },
  { value: '100+', label: 'Ranked 100+' }
];

const FilterDropdown = ({ value, onChange, options }) => (
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
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors duration-200" />
  </div>
);

const FilterSection = ({
  selectedGmat,
  setSelectedGmat,
  selectedRanking,
  setSelectedRanking
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <FilterDropdown
        value={selectedGmat}
        onChange={setSelectedGmat}
        options={gmatAverages}
      />
      <FilterDropdown
        value={selectedRanking}
        onChange={setSelectedRanking}
        options={rankings}
      />
    </div>
  );
};

export default FilterSection;
