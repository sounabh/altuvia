import React from 'react';
import { BookOpen, Clock, CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react';

/**
 * Enhanced statistics overview component with strict submission criteria and 98% essay completion logic
 * @param {Object} props - Component props
 * @param {Object} props.stats - Enhanced statistics data containing:
 *   @param {number} total - Total saved universities
 *   @param {number} inProgress - Applications currently in progress
 *   @param {number} submitted - Successfully submitted applications (only when EVERYTHING is complete)
 *   @param {number} upcomingDeadlines - Total count of upcoming deadlines
 *   @param {number} fullyCompletedUniversities - Universities with both essays and tasks 100% complete
 *   @param {number} universitiesReadyForSubmission - Universities ready for submission
 * @returns {JSX.Element} Enhanced statistic cards with strict completion criteria
 */
export const StatsOverview = ({ stats }) => {
  /**
   * Enhanced stat card configuration with strict submission logic
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
      isUrgent: stats.inProgress > 0,
      // Show additional info about ready universities
      additionalInfo: stats.universitiesReadyForSubmission > 0 ? 
        `${stats.universitiesReadyForSubmission} ready for submission` : null
    },
    {
      title: "Submitted",
      value: stats.submitted || 0,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-700",
      iconColor: "text-green-600",
      description: "Fully completed",
      showTrend: true,
      isSuccess: stats.submitted > 0,
      // Show additional completion info
      additionalInfo: stats.fullyCompletedUniversities !== stats.submitted ? 
        `${stats.fullyCompletedUniversities || 0} fully complete` : null
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
   * Enhanced completion calculation - only count truly submitted universities
   */
  const completionRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
  
  /**
   * Calculate readiness rate - universities ready for submission
   */
  const readinessRate = stats.total > 0 ? 
    Math.round(((stats.submitted + (stats.universitiesReadyForSubmission || 0)) / stats.total) * 100) : 0;

  /**
   * Determines if user needs attention based on enhanced stats
   */
  const needsAttention = stats.upcomingDeadlines > 3 || 
    (stats.inProgress > 0 && completionRate < 30) ||
    (stats.universitiesReadyForSubmission > 0 && stats.submitted === 0);

  /**
   * Determine the primary message based on current state
   */
  const getPrimaryMessage = () => {
    if (stats.universitiesReadyForSubmission > 0) {
      return {
        type: 'ready',
        message: `${stats.universitiesReadyForSubmission} ${stats.universitiesReadyForSubmission === 1 ? 'university is' : 'universities are'} ready for submission!`,
        actionable: true
      };
    }
    
    if (stats.submitted === stats.total && stats.total > 0) {
      return {
        type: 'complete',
        message: 'All university applications completed!',
        actionable: false
      };
    }
    
    if (stats.upcomingDeadlines > 0) {
      return {
        type: 'deadlines',
        message: `You have ${stats.upcomingDeadlines} upcoming deadlines to manage`,
        actionable: true
      };
    }
    
    if (stats.inProgress > 0) {
      return {
        type: 'progress',
        message: `${completionRate}% of applications completed with ${stats.inProgress} in progress`,
        actionable: false
      };
    }
    
    return {
      type: 'start',
      message: 'Ready to start your university application journey',
      actionable: false
    };
  };

  const primaryMessage = getPrimaryMessage();

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
                stat.isCritical ? 'ring-2 ring-red-400' : ''
              }`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
              
              {/* Card Content */}
              <div className="relative z-10">
                {/* Header with Icon and Value */}
                <div className="flex items-start justify-between mb-4">
                  {/* Icon Container */}
                  <div className={`p-3 rounded-xl bg-white/70 backdrop-blur-sm shadow-md group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  
                  {/* Enhanced Value Display */}
                  <div className="text-right">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200`}>
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
                  
                  {/* Additional Info for Enhanced Cards */}
                  {stat.additionalInfo && (
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      {stat.additionalInfo}
                    </p>
                  )}
                </div>

                {/* Enhanced Progress Indicator for Submitted */}
                {index === 2 && stats.total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600">Completion Rate</span>
                      <span className="text-xs font-semibold text-slate-700">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    
                    {/* Readiness Progress Bar */}
                    {stats.universitiesReadyForSubmission > 0 && (
                      <>
                        <div className="flex justify-between items-center mb-1 mt-2">
                          <span className="text-xs text-slate-600">Ready for Submission</span>
                          <span className="text-xs font-semibold text-slate-700">{readinessRate}%</span>
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${readinessRate}%` }}
                          />
                        </div>
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          {stats.universitiesReadyForSubmission} ready to submit
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Critical Indicator */}
                {stat.isCritical && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Insights Bar */}
      {stats.total > 0 && (
        <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
          primaryMessage.type === 'ready' 
            ? 'bg-green-50 border-green-200' 
            : needsAttention 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                primaryMessage.type === 'ready' 
                  ? 'bg-green-200' 
                  : needsAttention 
                  ? 'bg-amber-200' 
                  : 'bg-blue-200'
              }`}>
                {primaryMessage.type === 'ready' ? (
                  <Target className="w-5 h-5 text-green-700" />
                ) : needsAttention ? (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-700" />
                )}
              </div>
              <div>
                <h4 className={`font-semibold ${
                  primaryMessage.type === 'ready' 
                    ? 'text-green-800' 
                    : needsAttention 
                    ? 'text-amber-800' 
                    : 'text-blue-800'
                }`}>
                  {primaryMessage.type === 'ready' ? 'Ready for Submission' :
                   needsAttention ? 'Action Required' : 'Progress Summary'}
                </h4>
                <p className={`text-sm ${
                  primaryMessage.type === 'ready' 
                    ? 'text-green-700' 
                    : needsAttention 
                    ? 'text-amber-700' 
                    : 'text-blue-700'
                }`}>
                  {primaryMessage.message}
                </p>
              </div>
            </div>
            
            {/* Enhanced Quick Stats */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">{completionRate}%</div>
                <div className="text-xs text-slate-600">Submitted</div>
              </div>
              
              {stats.universitiesReadyForSubmission > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.universitiesReadyForSubmission}</div>
                  <div className="text-xs text-green-600">Ready</div>
                </div>
              )}
              
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

      {/* Essay Completion Enhancement Info */}
      {stats.total > 0 && stats.completedEssays > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">Enhanced Essay Tracking</h4>
                <p className="text-sm text-purple-700">
                  Essays automatically marked complete at 98% word count
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-800">{stats.completedEssays}</div>
              <div className="text-xs text-purple-600">Essays Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};