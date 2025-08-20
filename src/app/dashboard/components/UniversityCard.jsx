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
 * University card component with interactive features
 * @param {Object} props - Component props
 * @param {Object} props.university - University data object containing:
 *   @param {string} id - University identifier
 *   @param {string} name - University name (fallback to universityName)
 *   @param {string} image - University image URL
 *   @param {string} location - University location
 *   @param {string} status - Application status ('submitted', 'in-progress', etc.)
 *   @param {string} deadline - Application deadline
 *   @param {number} essayProgress - Essay completion percentage
 *   @param {number} tasks - Completed tasks count
 *   @param {number} totalTasks - Total tasks count
 *   @param {number} gmatAverage - Average GMAT score (fallback to gmatAverageScore)
 *   @param {string} slug - URL-friendly identifier (optional)
 * @param {Function} props.onRemove - Callback for remove action
 * @returns {JSX.Element} Interactive university card with:
 * - Context menu actions
 * - Status indicator
 * - Progress tracking
 * - Hover effects
 * - Error handling for images
 */
export const UniversityCard = ({ university, onRemove }) => {
//  console.log('University data in card:', university);

  /**
   * Determines gradient color based on application status
   * @param {string} status - Application status
   * @returns {string} Tailwind gradient classes
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
   * @param {string} status - Application status
   * @returns {string} Human-readable status text
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
   * @param {Event} e - Click event
   */
  const handleViewDetails = (e) => {
    e.preventDefault();
    console.log('View details for:', university.name);
    // Add view details functionality here
  };

  /**
   * Handles remove action
   * @param {Event} e - Click event
   */
  const handleRemove = (e) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(university.id);
    }
  };

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
                  <span className="text-sm font-medium">Essay Progress</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {university.essayProgress || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${university.essayProgress || 0}%` }}
                />
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {/* Tasks Completed */}
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {university.tasks || 0}/{university.totalTasks || 5}
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
          </div>
        </div>
      </div>
    </Link>
  );
};