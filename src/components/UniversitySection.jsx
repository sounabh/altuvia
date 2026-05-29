'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, GraduationCap, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { UniversityCard } from '@/app/dashboard/components/UniversityCard';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  'submitted':   'bg-white/20 text-white border border-white/30',
  'in-progress': 'bg-[#3598FE]/20 text-white border border-[#3598FE]/40',
  'not-started': 'bg-white/15 text-white border border-white/25',
};

const STATUS_LABELS = {
  'submitted':   'Submitted',
  'in-progress': 'In Progress',
  'not-started': 'Not Started',
};

const StatusBadge = memo(({ status }) => {
  const key = status?.toLowerCase().replace('_', '-') || 'not-started';
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${STATUS_STYLES[key] || STATUS_STYLES['not-started']}`}>
      {STATUS_LABELS[key] || 'Not Started'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

// ─── Collapsible wrapper ──────────────────────────────────────────────────────

const CollapsibleCard = memo(({ university, index, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(prev => !prev);
  }, []);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">

      {/* Always-visible: image + name + location + badges */}
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={university.image || '/default-university.jpg'}
          alt={university.imageAlt || university.universityName}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          onError={(e) => { e.target.src = '/default-university.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="flex items-center gap-1 bg-[#e8445a] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            ADDED
          </span>
          <StatusBadge status={university.status} />
        </div>

        {/* Name + location */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-[15px] leading-tight drop-shadow line-clamp-1">
            {university.universityName}
          </p>
          <p className="text-white/75 text-xs mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="truncate">{university.location}</span>
          </p>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-[#3598FE] hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse university details' : 'Expand university details'}
      >
        {expanded
          ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          : <><ChevronDown className="w-3.5 h-3.5" /> Show details</>
        }
      </button>

      {/* Expanded content — headless UniversityCard (no image) */}
      {expanded && (
        <div className="border-t border-gray-100">
          <UniversityCard
            university={university}
            index={index}
            onRemove={onRemove}
            headless={true}
          />
        </div>
      )}
    </div>
  );
});
CollapsibleCard.displayName = 'CollapsibleCard';

// ─── Add card ─────────────────────────────────────────────────────────────────

const AddUniversityCard = memo(() => (
  <Link href="/dashboard/search" className="block">
    <div className="flex flex-col items-center justify-center h-[160px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#3598FE] hover:bg-[#3598FE]/5 transition-all duration-300 cursor-pointer group gap-2">
      <div className="w-9 h-9 rounded-full border-2 border-gray-200 group-hover:border-[#3598FE] group-hover:bg-[#3598FE]/10 flex items-center justify-center transition-all duration-300">
        <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#3598FE] transition-colors duration-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 group-hover:text-[#002147] transition-colors duration-300">
          Add a university
        </p>
        <p className="text-xs text-gray-300 group-hover:text-gray-400 mt-0.5 transition-colors duration-300">
          Search 1,200+ programs
        </p>
      </div>
    </div>
  </Link>
));
AddUniversityCard.displayName = 'AddUniversityCard';

// ─── Main export ──────────────────────────────────────────────────────────────

export const UniversitiesSection = memo(({ universities, handleRemoveUniversity }) => (
  <>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#002147]/10 rounded-xl" aria-hidden="true">
          <GraduationCap className="w-5 h-5 text-[#002147]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#002147]">Saved Universities</h2>
          <p className="text-sm text-gray-500">
            {universities.length} {universities.length === 1 ? 'university' : 'universities'} in your list
          </p>
        </div>
      </div>
      <Link href="/dashboard/search" aria-label="Add more universities to your list">
        <button className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm">
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add More</span>
        </button>
      </Link>
    </div>

    {/* items-start prevents grid from stretching add card to match expanded card height */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {universities.map((university, index) => (
        <CollapsibleCard
          key={university.id}
          university={university}
          index={index}
          onRemove={handleRemoveUniversity}
        />
      ))}
      <AddUniversityCard />
    </div>
  </>
));
UniversitiesSection.displayName = 'UniversitiesSection';