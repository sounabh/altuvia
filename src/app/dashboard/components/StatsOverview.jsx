import React from 'react';
import { BookOpen, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

/**
 * Enhanced statistics overview component displaying comprehensive application metrics
 * @param {Object} props - Component props
 * @param {Object} props.stats - Enhanced statistics data containing:
 *   @param {number} total - Total saved universities
 *   @param {number} inProgress - Applications currently in progress
 *   @param {number} submitted - Successfully submitted applications
 *   @param {number} upcomingDeadlines - Total count of upcoming deadlines across all universities
 * @returns {JSX.Element} Responsive grid of enhanced statistic cards with:
 * - Animated icons and gradients
 * - Color-coded categories with hover effects
 * - Progress indicators
 * - Contextual styling based on urgency
 */
export const StatsOverview = ({ stats }) => {
  /**
   * Enhanced stat card configuration array with additional styling and logic
   */
  const statCards = [
    {
      title: "Total Universities",
      value: stats.total || 0,
      icon: BookOpen,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
      description: "Universities saved",
      showTrend: false
    },
    {
      title: "In Progress",
      value: stats.inProgress || 0,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-100",
      textColor: "text-amber-700",
      iconColor: "text-amber-600",
      description: "Active applications",
      showTrend: true,
      isUrgent: stats.inProgress > 0
    },
    {
      title: "Submitted",
      value: stats.submitted || 0,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-700",
      iconColor: "text-green-600",
      description: "Applications complete",
      showTrend: true,
      isSuccess: stats.submitted > 0
    },
    {
      title: "Upcoming Deadlines",
      value: stats.upcomingDeadlines || 0,
      icon: AlertTriangle,
      gradient: stats.upcomingDeadlines > 0 ? "from-red-500 to-red-600" : "from-gray-400 to-gray-500",
      bgGradient: stats.upcomingDeadlines > 0 ? "from-red-50 to-red-100" : "from-gray-50 to-gray-100",
      textColor: stats.upcomingDeadlines > 0 ? "text-red-700" : "text-gray-600",
      iconColor: stats.upcomingDeadlines > 0 ? "text-red-600" : "text-gray-500",
      description: "Deadlines pending",
      showTrend: false,
      isUrgent: stats.upcomingDeadlines > 5,
      isCritical: stats.upcomingDeadlines > 10
    }
  ];

  /**
   * Calculates completion percentage for progress indication
   */
  const completionRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;

  /**
   * Determines if user needs attention based on stats
   */
  const needsAttention = stats.upcomingDeadlines > 3 || (stats.inProgress > 0 && completionRate < 30);

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ${
                stat.isUrgent ? 'ring-2 ring-red-200 animate-pulse' : ''
              } ${stat.isCritical ? 'ring-4 ring-red-400' : ''}`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
              
              {/* Card Content */}
              <div className="relative z-10">
                {/* Header with Icon and Value */}
                <div className="flex items-start justify-between mb-4">
                  {/* Animated Icon Container */}
                  <div className={`p-3 rounded-xl bg-white/70 backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor} ${stat.isUrgent ? 'animate-bounce' : ''}`} />
                  </div>
                  
                  {/* Enhanced Value Display */}
                  <div className="text-right">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                      {stat.value}
                    </div>
                    {stat.showTrend && stat.value > 0 && (
                      <div className="flex items-center justify-end mt-1">
                        <TrendingUp className={`w-4 h-4 ${stat.isSuccess ? 'text-green-500' : 'text-amber-500'}`} />
                        <span className="text-xs text-slate-600 ml-1">Active</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h3 className={`font-semibold text-sm uppercase tracking-wide ${stat.textColor} mb-1`}>
                    {stat.title}
                  </h3>
                  <p className="text-xs text-slate-600 opacity-80">
                    {stat.description}
                  </p>
                </div>

                {/* Progress Indicator for Submitted */}
                {index === 2 && stats.total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600">Completion Rate</span>
                      <span className="text-xs font-semibold text-slate-700">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Urgent Action Indicator */}
                {stat.isUrgent && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Insights Bar */}
      {stats.total > 0 && (
        <div className={`p-4 rounded-xl border-2 ${needsAttention ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${needsAttention ? 'bg-amber-200' : 'bg-blue-200'}`}>
                {needsAttention ? (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-700" />
                )}
              </div>
              <div>
                <h4 className={`font-semibold ${needsAttention ? 'text-amber-800' : 'text-blue-800'}`}>
                  {needsAttention ? 'Action Required' : 'Progress Summary'}
                </h4>
                <p className={`text-sm ${needsAttention ? 'text-amber-700' : 'text-blue-700'}`}>
                  {needsAttention 
                    ? `You have ${stats.upcomingDeadlines} upcoming deadlines and ${stats.inProgress} applications in progress`
                    : `You've completed ${completionRate}% of your applications with ${stats.submitted} submissions`
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">{completionRate}%</div>
                <div className="text-xs text-slate-600">Complete</div>
              </div>
              {stats.upcomingDeadlines > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.upcomingDeadlines}</div>
                  <div className="text-xs text-red-600">Deadlines</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};