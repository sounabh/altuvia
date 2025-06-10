import React from 'react';
import { MapPin, Calendar, FileText, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';




export const UniversityCard  = ({ university, onRemove }) => {
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

  const handleViewDetails = () => {
    console.log('View details for:', university.name);
    // Add view details functionality here
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(university.id);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
      {/* University Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={university.image} 
          alt={university.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
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

        <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(university.status)}`}>
          {getStatusText(university.status)}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          {university.name}
        </h3>
        
        <div className="flex items-center text-slate-600 mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{university.location}</span>
        </div>

        <div className="space-y-4">
          {/* Deadline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-slate-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{university.deadline}</span>
          </div>

          {/* Essay Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-slate-600">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Essay Progress</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{university.essayProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${university.essayProgress}%` }}
              />
            </div>
          </div>

          {/* Tasks and GMAT */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{university.tasks}/{university.totalTasks}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{university.gmatAverage}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">GMAT Avg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};