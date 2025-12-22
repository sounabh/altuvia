"use client"

import React, { useState } from 'react';
import { MapPin, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';

/**
 * Enhanced University card component with clean deadline display
 */
export const UniversityCard = ({ university, onRemove, onUpdate }) => {
  const [isAdded, setIsAdded] = useState(Boolean(university.isAdded));
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  // Format deadlines using the same logic as UniversityOverview
  const getFormattedDeadlines = () => {
    let rawDeadlines = [];

    if (Array.isArray(university?.roundDeadlines) && university.roundDeadlines.length > 0) {
      rawDeadlines = university.roundDeadlines.map(d => d.trim());
    } else if (typeof university?.averageDeadlines === 'string' && university.averageDeadlines.trim()) {
      const pattern = /(Round\s*\d+|Deferred):\s*([^,]+(?:,\s*\d{4})?[^R]*?)(?=\s*(?:Round\s*\d+|Deferred):|$)/gi;
      const matches = [...university.averageDeadlines.matchAll(pattern)];
      
      if (matches.length > 0) {
        rawDeadlines = matches.map(match => {
          const round = match[1].trim();
          const date = match[2].trim();
          return `${round}: ${date}`;
        });
      } else {
        rawDeadlines = university.averageDeadlines.split(/,(?=\s*(?:Round|Deferred))/i).map(p => p.trim()).filter(Boolean);
      }
    }

    if (rawDeadlines.length === 0) return null;

    return rawDeadlines.map((deadline, idx) => {
      const colonIndex = deadline.indexOf(':');
      if (colonIndex > -1) {
        const round = deadline.substring(0, colonIndex).trim();
        const date = deadline.substring(colonIndex + 1).trim();
        return { round, date };
      }
      return { round: `Round ${idx + 1}`, date: deadline };
    });
  };

  const formattedDeadlines = getFormattedDeadlines();
  const hasMultipleRounds = formattedDeadlines && formattedDeadlines.length > 1;

  const toggleHeart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdded(!isAdded);
  };

  const getStatusText = (status) => {
    const essaysComplete = university.stats?.applicationHealth?.essaysFullyComplete;
    const tasksComplete = university.stats?.applicationHealth?.tasksFullyComplete;
    const hasEssays = university.totalEssays > 0;
    const hasTasks = university.totalTasks > 0;

    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in-progress':
        if (essaysComplete && hasEssays && !tasksComplete && hasTasks) {
          return 'Essays Done';
        } else if (!essaysComplete && hasEssays && tasksComplete && hasTasks) {
          return 'Tasks Done';
        } else if (essaysComplete && hasEssays && !hasTasks) {
          return 'Essays Done';
        } else if (tasksComplete && hasTasks && !hasEssays) {
          return 'Tasks Done';
        } else {
          return 'In Progress';
        }
      default:
        return 'Not Started';
    }
  };

  const essayProgressPercentage = university.totalEssays > 0
    ? Math.round((university.completedEssays / university.totalEssays) * 100)
    : 0;

  const totalTasks = university.totalTasks || 0;
  const completedTasks = university.tasks || 0;
  const taskProgressPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const essaysFullyComplete = university.stats?.applicationHealth?.essaysFullyComplete;
  const tasksFullyComplete = university.stats?.applicationHealth?.tasksFullyComplete;
  const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;

  const hasEssays = university.totalEssays > 0;
  const hasTasks = totalTasks > 0;
  const hasAnyContent = hasEssays || hasTasks;

  return (
    <div className="group relative bg-white border border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-lg rounded-lg">
      {/* University Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={university.image || '/default-university.jpg'}
          alt={university.name || university.universityName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/90 via-[#002147]/40 to-transparent" />

        {/* University Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          <h3 className="text-white font-semibold text-xl mb-2 leading-tight">
            {university.name || university.universityName}
          </h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>{university.location}</span>
          </div>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="p-5 flex-grow flex flex-col bg-gray-50">
        <div className="space-y-4">
          {/* Deadline Section - Cleaner Inline Design */}
          {formattedDeadlines && formattedDeadlines.length > 0 && (
            <div className="bg-[#002147] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-300" />
                  <span className="text-sm font-semibold text-white">
                    {hasMultipleRounds ? 'Application Rounds' : 'Deadline'}
                  </span>
                </div>
                {hasMultipleRounds && (
                  <span className="text-xs bg-[#3598FE] text-white px-2 py-1 rounded-full">
                    {formattedDeadlines.length} Rounds
                  </span>
                )}
              </div>
              
              {/* Show first deadline or all based on state */}
              <div className="space-y-2">
                {(showAllDeadlines ? formattedDeadlines : formattedDeadlines.slice(0, 1)).map((deadline, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#3598FE] rounded-full flex-shrink-0 mt-1.5"></span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white font-medium block">{deadline.round}</span>
                      <span className="text-xs text-blue-200 block truncate">{deadline.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggle button for multiple rounds */}
              {hasMultipleRounds && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAllDeadlines(!showAllDeadlines);
                  }}
                  className="mt-3 w-full text-xs text-blue-300 hover:text-white transition-colors flex items-center justify-center gap-1 py-1"
                >
                  {showAllDeadlines ? (
                    <>Show Less</>
                  ) : (
                    <>Show All {formattedDeadlines.length} Rounds</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Essay Progress Section */}
          {hasEssays && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-slate-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Essays</span>
                  {essaysFullyComplete && (
                    <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {university.completedEssays || 0}/{university.totalEssays || 0}
                </span>
              </div>
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      essaysFullyComplete
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${essayProgressPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {essayProgressPercentage}% Complete
                </div>
              </div>
            </div>
          )}

          {/* Task Progress Section */}
          {hasTasks && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Tasks</span>
                  {tasksFullyComplete && (
                    <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      tasksFullyComplete
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600'
                    }`}
                    style={{ width: `${taskProgressPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {taskProgressPercentage}% Complete
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {hasTasks ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                  {completedTasks}/{totalTasks}
                  {tasksFullyComplete && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Tasks</div>
              </div>
            ) : hasEssays ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                  {university.completedEssays}/{university.totalEssays}
                  {essaysFullyComplete && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Essays</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">0</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Items</div>
              </div>
            )}

            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {university.gmatAverage || university.gmatAverageScore || 'N/A'}
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">GMAT Avg</div>
            </div>
          </div>

          {/* Ready for Submission Banner */}
          {readyForSubmission && university.status !== 'submitted' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Ready for Submission!</span>
              </div>
              <div className="text-xs text-green-600 text-center mt-1">
                {hasEssays && hasTasks
                  ? 'All essays and tasks completed'
                  : hasEssays
                  ? 'All essays completed'
                  : hasTasks
                  ? 'All tasks completed'
                  : 'Ready to submit'}
              </div>
            </div>
          )}

          {/* No Content Message */}
          {!hasAnyContent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 text-center">
                No essays or tasks configured yet
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Button - Top Left */}
      <button
        onClick={toggleHeart}
        className={`absolute top-4 left-4 px-3 py-1.5 rounded-md backdrop-blur-sm transition-all duration-200 text-xs font-medium z-20 ${
          isAdded
            ? "bg-[#3598FE] text-white"
            : "bg-white/95 text-[#002147] hover:bg-white"
        }`}
      >
        {isAdded ? "Added" : "Add"}
      </button>

      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-20">
        {readyForSubmission && university.status !== 'submitted' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        )}
        <span className="text-xs font-semibold text-[#002147]">{getStatusText(university.status)}</span>
      </div>

      {/* CTA Button */}
      <div className="p-5 pt-0">
        <button className="w-full bg-[#002147] hover:bg-[#3598FE] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-700 ease-in-out transform hover:rounded-3xl">
          View Details →
        </button>
      </div>
    </div>
  );
};