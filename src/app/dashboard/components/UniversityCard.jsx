import React from 'react';
import { MapPin, Calendar, FileText, MoreHorizontal, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import Link from 'next/link';

/**
 * Enhanced University card component with 98% essay completion logic and strict submission criteria
 */
export const UniversityCard = ({ university, onRemove }) => {

  // Debug: Log the university data to see what we're getting
  console.log('Enhanced University data in card:', {
    id: university.id,
    name: university.name,
    status: university.status,
    tasks: university.tasks,
    totalTasks: university.totalTasks,
    completedEssays: university.completedEssays,
    totalEssays: university.totalEssays,
    applicationHealth: university.stats?.applicationHealth,
    enhancedCompletion: university.stats?.essays?.enhancedCompletionBreakdown
  });

  /**
   * Enhanced status color determination with strict submission criteria
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'from-green-500 to-green-600'; // Only when EVERYTHING is complete
      case 'in-progress':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  /**
   * Enhanced status text with completion indicators
   */
  const getStatusText = (status) => {
    const isFullyComplete = university.stats?.applicationHealth?.isFullyComplete;
    const essaysComplete = university.stats?.applicationHealth?.essaysFullyComplete;
    const tasksComplete = university.stats?.applicationHealth?.tasksFullyComplete;
    const hasEssays = university.totalEssays > 0;
    const hasTasks = university.totalTasks > 0;
    
    switch (status) {
      case 'submitted':
        return 'Submitted'; // Only shows when both essays AND tasks are 100% complete
      case 'in-progress':
        // Show more detailed status for in-progress
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

  /**
   * Get status badge styling with enhanced visual indicators
   */
  const getStatusBadgeStyle = (status) => {
    const isFullyComplete = university.stats?.applicationHealth?.isFullyComplete;
    const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;
    
    let baseStyle = `absolute bottom-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(status)}`;
    
    // Add pulsing effect for ready-for-submission state
    if (readyForSubmission && status !== 'submitted') {
      baseStyle += ' animate-pulse ring-2 ring-white/50';
    }
    
    return baseStyle;
  };

  /**
   * Handles view details action
   */
  const handleViewDetails = (e) => {
    e.preventDefault();
    console.log('View details for:', university.name);
  };

  /**
   * Handles remove action
   */
  const handleRemove = (e) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(university.id);
    }
  };

  // Enhanced essay progress calculation (backend already handles 98% logic)
  const essayProgressPercentage = university.totalEssays > 0 
    ? Math.round((university.completedEssays / university.totalEssays) * 100)
    : 0;

  // Task progress calculation
  const totalTasks = university.totalTasks || 0;
  const completedTasks = university.tasks || 0;
  const taskProgressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Enhanced completion indicators
  const essaysFullyComplete = university.stats?.applicationHealth?.essaysFullyComplete;
  const tasksFullyComplete = university.stats?.applicationHealth?.tasksFullyComplete;
  const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;

  // FIXED: Better logic for showing essay and task sections
  const hasEssays = university.totalEssays > 0;
  const hasTasks = totalTasks > 0;
  const hasAnyContent = hasEssays || hasTasks;

  console.log(`Enhanced calculation for ${university.name}:`, {
    essayProgress: essayProgressPercentage,
    taskProgress: taskProgressPercentage,
    essaysComplete: essaysFullyComplete,
    tasksComplete: tasksFullyComplete,
    readyForSubmission: readyForSubmission,
    status: university.status,
    hasEssays,
    hasTasks,
    hasAnyContent
  });

  // Determine URL using slug or fallback to ID
  const universityUrl = university.slug 
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;

  return (
    <Link href={universityUrl}>
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer">
        {/* University Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={university.image || '/default-university.jpg'} 
            alt={university.name || university.universityName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = '/default-university.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Context Menu for Actions */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button 
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="w-4 h-4 text-slate-600" />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={handleViewDetails} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={handleRemove} 
                className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* Enhanced Status Badge with Ready Indicator */}
          <div className={getStatusBadgeStyle(university.status)}>
            <div className="flex items-center gap-1">
              {readyForSubmission && university.status !== 'submitted' && (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{getStatusText(university.status)}</span>
            </div>
          </div>

          {/* Completion Indicator Icons */}
          {(essaysFullyComplete || tasksFullyComplete) && university.status !== 'submitted' && (
            <div className="absolute top-4 left-4 flex gap-1">
              {essaysFullyComplete && hasEssays && (
                <div className="bg-green-500 text-white rounded-full p-1" title="Essays Complete">
                  <FileText className="w-3 h-3" />
                </div>
              )}
              {tasksFullyComplete && hasTasks && (
                <div className="bg-blue-500 text-white rounded-full p-1" title="Tasks Complete">
                  <Calendar className="w-3 h-3" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Content Section */}
        <div className="p-6">
          {/* University Name */}
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            {university.name || university.universityName}
          </h3>
          
          {/* Location */}
          <div className="flex items-center text-slate-600 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{university.location}</span>
          </div>

          <div className="space-y-4">
            {/* Deadline Info with Enhanced Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Deadline</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {university.deadline || 'TBD'}
                </span>
                {readyForSubmission && (
                  <div className="text-xs text-green-600 font-medium">Ready!</div>
                )}
              </div>
            </div>

            {/* FIXED: Enhanced Essay Progress Section - Only show if essays exist */}
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
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{essayProgressPercentage}% Complete</span>
                    {university.stats?.essays?.enhancedCompletionBreakdown?.completedByWordCount98 > 0 && (
                      <span className="text-green-600 font-medium">
                        {university.stats.essays.enhancedCompletionBreakdown.completedByWordCount98} at 98%+
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FIXED: Enhanced Task Progress Section - Only show if tasks exist */}
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
              {/* FIXED: Tasks Completed with Status - Only show if tasks exist */}
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
                // Show essay count if no tasks but has essays
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
                // Placeholder if no content
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">0</div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Items</div>
                </div>
              )}
              
              {/* GMAT Average */}
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {university.gmatAverage || university.gmatAverageScore || 'N/A'}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">GMAT Avg</div>
              </div>
            </div>

            {/* Ready for Submission Banner */}
            {readyForSubmission && university.status !== 'submitted' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mt-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Ready for Submission!</span>
                </div>
                <div className="text-xs text-green-600 text-center mt-1">
                  {hasEssays && hasTasks ? 'All essays and tasks completed' :
                   hasEssays ? 'All essays completed' :
                   hasTasks ? 'All tasks completed' : 'Ready to submit'}
                </div>
              </div>
            )}

            {/* FIXED: Progress Summary for In-Progress Applications */}
            {university.status === 'in-progress' && !readyForSubmission && hasAnyContent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Progress Summary
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  {hasEssays && !essaysFullyComplete && (
                    <div>• {university.totalEssays - university.completedEssays} essays remaining</div>
                  )}
                  {hasTasks && !tasksFullyComplete && (
                    <div>• {totalTasks - completedTasks} tasks remaining</div>
                  )}
                </div>
              </div>
            )}

            {/* FIXED: Show message if no essays or tasks exist */}
            {!hasAnyContent && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                <div className="text-sm text-gray-600 text-center">
                  No essays or tasks configured yet
                </div>
              </div>
            )}

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-3 rounded text-xs font-mono mt-4">
                <strong>Enhanced Debug Info:</strong><br/>
                <div className="mt-1 space-y-1">
                  <div>Status: {university.status}</div>
                  <div>Essays: {university.completedEssays}/{university.totalEssays} ({essayProgressPercentage}%)</div>
                  <div>Tasks: {completedTasks}/{totalTasks} ({taskProgressPercentage}%)</div>
                  <div>Has Essays: {hasEssays ? 'Yes' : 'No'}</div>
                  <div>Has Tasks: {hasTasks ? 'Yes' : 'No'}</div>
                  <div>Essays Complete: {essaysFullyComplete ? 'Yes' : 'No'}</div>
                  <div>Tasks Complete: {tasksFullyComplete ? 'Yes' : 'No'}</div>
                  <div>Ready for Submission: {readyForSubmission ? 'Yes' : 'No'}</div>
                  {university.stats?.essays?.enhancedCompletionBreakdown && (
                    <div>
                      98% Completions: {university.stats.essays.enhancedCompletionBreakdown.completedByWordCount98}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Link>
  );
};