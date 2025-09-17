import React from 'react';
import { MapPin, Calendar, FileText, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import Link from 'next/link';

/**
 * University card component with interactive features and debugging
 */
export const UniversityCard = ({ university, onRemove }) => {

  // Debug: Log the university data to see what we're getting
  console.log('University data in card:', {
    id: university.id,
    name: university.name,
    tasks: university.tasks,
    totalTasks: university.totalTasks,
    completedEssays: university.completedEssays,
    totalEssays: university.totalEssays,
    calendarEvents: university.calendarEvents,
    stats: university.stats,
    _debug: university._debug
  });

  /**
   * Determines gradient color based on application status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'from-green-500 to-green-600';
      case 'in-progress':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  /**
   * Gets display text for application status
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
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

  // Calculate essay progress percentage based on completed vs total essays
  const essayProgressPercentage = university.totalEssays > 0 
    ? Math.round((university.completedEssays / university.totalEssays) * 100)
    : 0;

  // Get task data - Calendar events ARE the tasks
  // Backend should already calculate these correctly, so we use the direct values
  const totalTasks = university.totalTasks || 0;
  const completedTasks = university.tasks || 0;

  const taskProgressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  console.log(`Task calculation for ${university.name}:`, {
    completed: completedTasks,
    total: totalTasks,
    percentage: taskProgressPercentage,
    calendarEventsLength: university.calendarEvents?.length || 0,
    statsTasksTotal: university.stats?.tasks?.total || 'N/A',
    debugTasksTotal: university._debug?.calendarEventsAsTasks?.total || 'N/A'
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

          {/* Status Badge */}
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(university.status)}`}>
            {getStatusText(university.status)}
          </div>
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
            {/* Deadline Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Deadline</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {university.deadline || 'TBD'}
              </span>
            </div>

            {/* Essay Progress Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-slate-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Essays</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {university.completedEssays || 0}/{university.totalEssays || 0}
                </span>
              </div>
              {university.totalEssays > 0 && (
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${essayProgressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {essayProgressPercentage}% Complete
                  </div>
                </div>
              )}
            </div>

            {/* Task Progress Section - Calendar Events ARE Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              {totalTasks > 0 && (
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${taskProgressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {taskProgressPercentage}% Complete
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {/* Tasks Completed */}
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {completedTasks}/{totalTasks}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Tasks</div>
              </div>
              
              {/* GMAT Average */}
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {university.gmatAverage || university.gmatAverageScore || 'N/A'}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">GMAT Avg</div>
              </div>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <strong>Debug Info:</strong><br/>
                <div className="mt-1">
                  Backend Values: tasks={university.tasks}, totalTasks={university.totalTasks}<br/>
                  Calendar Events: {university.calendarEvents?.length || 0} events<br/>
                  Stats Available: {university.stats ? 'Yes' : 'No'}<br/>
                  {university.stats && (
                    <>
                      Stats Tasks: {university.stats.tasks?.total || 'N/A'} total, {university.stats.tasks?.completed || 'N/A'} completed<br/>
                    </>
                  )}
                  Debug Tasks: {university._debug?.calendarEventsAsTasks?.total || 'N/A'} total, {university._debug?.calendarEventsAsTasks?.completed || 'N/A'} completed
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Link>
  );
};