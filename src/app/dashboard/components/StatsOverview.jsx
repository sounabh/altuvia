import React from 'react';
import { BookOpen, Clock, CheckCircle, AlertTriangle, TrendingUp, Target, Sparkles, Zap } from 'lucide-react';

/**
 * Enhanced statistics overview with premium glassmorphism aesthetic
 * 
 * SEO Considerations:
 * - Uses semantic HTML structure with proper heading hierarchy
 * - Accessible color contrast for text and backgrounds
 * - ARIA labels could be added for screen readers if interactive elements are added
 */
export const StatsOverview = ({ stats }) => {
  // ========== STATISTICS CARDS CONFIGURATION ==========
  /**
   * Array of statistic cards with their visual and data configurations
   * Each card includes:
   * - title: Display title
   * - value: Numerical value to display
   * - icon: Lucide React icon component
   * - gradient: Background gradient for value text
   * - bgEffect: Card background effect
   * - textColor: Text color for title
   * - iconBg: Icon background color
   * - description: Short description text
   * - trend: Whether to show "Active" trend badge
   * - additionalInfo: Optional supplementary information
   */
  const statCards = [
    {
      title: "Total Universities",
      value: stats.total || 0,
      icon: BookOpen,
      gradient: "from-[#3598FE] to-[#002147]",
      bgEffect: "bg-blue-50/50",
      textColor: "text-[#002147]",
      iconBg: "bg-blue-100",
      description: "Universities saved",
      trend: false
    },
    {
      title: "Active Applications",
      value: stats.inProgress || 0,
      icon: Zap,
      gradient: "from-amber-400 to-orange-500",
      bgEffect: "bg-amber-50/50",
      textColor: "text-amber-900",
      iconBg: "bg-amber-100",
      description: "In progress",
      trend: stats.inProgress > 0
    },
    {
      title: "Completed",
      value: stats.submitted || 0,
      icon: CheckCircle,
      gradient: "from-emerald-400 to-green-600",
      bgEffect: "bg-emerald-50/50",
      textColor: "text-emerald-900",
      iconBg: "bg-emerald-100",
      description: "Ready to submit",
      trend: stats.submitted > 0,
      // Show additional completion info if not all submitted are fully complete
      additionalInfo: stats.fullyCompletedUniversities !== stats.submitted ? 
        `${stats.fullyCompletedUniversities || 0} fully complete` : null
    },
    {
      title: "Upcoming Deadlines",
      value: stats.upcomingDeadlines || 0,
      icon: AlertTriangle,
      gradient: stats.upcomingDeadlines > 0 ? "from-rose-400 to-red-600" : "from-gray-400 to-gray-500",
      bgEffect: stats.upcomingDeadlines > 0 ? "bg-rose-50/50" : "bg-gray-50/50",
      textColor: stats.upcomingDeadlines > 0 ? "text-rose-900" : "text-gray-700",
      iconBg: stats.upcomingDeadlines > 0 ? "bg-rose-100" : "bg-gray-100",
      description: "Action required",
      trend: false,
      isUrgent: stats.upcomingDeadlines > 0  // Flag for urgent deadlines
    }
  ];

  // ========== CALCULATION FUNCTIONS ==========
  /**
   * Calculate overall completion rate percentage
   * Returns 0 if no universities are tracked to avoid division by zero
   */
  const completionRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
  
  /**
   * Determine the primary message to display based on application status
   * Priority order: ready for submission > all completed > upcoming deadlines > in progress > start
   * Returns object with message type, text, and icon
   */
  const getPrimaryMessage = () => {
    // Check for universities ready for submission
    if (stats.universitiesReadyForSubmission > 0) return { 
      type: 'ready', 
      message: `${stats.universitiesReadyForSubmission} apps ready for submission!`, 
      icon: Target 
    };
    
    // Check if all applications are completed
    if (stats.submitted === stats.total && stats.total > 0) return { 
      type: 'complete', 
      message: 'All applications completed!', 
      icon: Sparkles 
    };
    
    // Check for upcoming deadlines
    if (stats.upcomingDeadlines > 0) return { 
      type: 'deadlines', 
      message: `${stats.upcomingDeadlines} deadlines approaching`, 
      icon: AlertTriangle 
    };
    
    // Check for in-progress applications
    if (stats.inProgress > 0) return { 
      type: 'progress', 
      message: 'Keep making progress!', 
      icon: TrendingUp 
    };
    
    // Default message for new users
    return { 
      type: 'start', 
      message: 'Start your journey', 
      icon: BookOpen 
    };
  };

  const primaryMessage = getPrimaryMessage();

  return (
    <div className="space-y-6 mb-10">
      {/* ========== MAIN STATISTICS GRID ========== */}
      {/* Responsive grid layout for statistic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`relative group overflow-hidden rounded-2xl border border-white/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/40 backdrop-blur-xl`}
            >
              {/* Subtle Gradient Overlay on Hover */}
              <div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${stat.gradient}`} 
              />
              
              {/* Card Content */}
              <div className="p-5 flex flex-col h-full justify-between relative z-10">
                
                {/* Card Header: Icon and Trend Badge */}
                <div className="flex justify-between items-start mb-4">
                  {/* Icon with background */}
                  <div 
                    className={`p-2.5 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}
                    aria-label={`${stat.title} icon`}
                  >
                    <Icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                  
                  {/* Trend Badge (only shown when active) */}
                  {stat.trend && (
                    <div className="flex items-center gap-1 text-[10px] font-bold bg-white/50 px-2 py-1 rounded-full text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
                
                {/* Card Body: Statistics and Description */}
                <div>
                  {/* Main Value with Gradient Text */}
                  <div className={`text-3xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  
                  {/* Card Title */}
                  <div className={`text-sm font-semibold ${stat.textColor} tracking-tight`}>
                    {stat.title}
                  </div>
                  
                  {/* Description */}
                  <div className="text-xs text-gray-500 font-medium mt-0.5">
                    {stat.description}
                  </div>
                  
                  {/* Additional Information (Conditional) */}
                  {stat.additionalInfo && (
                    <div className="text-[10px] text-gray-400 mt-1 font-medium bg-gray-50 inline-block px-1.5 py-0.5 rounded-md border border-gray-100">
                      {stat.additionalInfo}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== COMPLETION INSIGHT BAR ========== */}
      {/* Only show completion bar when there are tracked universities */}
      {stats.total > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#002147] p-1 shadow-lg">
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
          
          {/* Main Content Container */}
          <div className="relative bg-[#002147] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left Section: Message and Icon */}
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="p-3 bg-white/10 rounded-full" aria-label="Progress indicator">
                <primaryMessage.icon className="w-6 h-6 text-[#3598FE]" />
              </div>
              
              {/* Text Content */}
              <div>
                <h4 className="text-white font-bold text-lg leading-tight">
                  {/* Conditional heading based on message type */}
                  {primaryMessage.type === 'ready' ? 'Ready for Liftoff 🚀' : 'Application Progress'}
                </h4>
                <p className="text-blue-200 text-sm font-medium">
                  {primaryMessage.message}
                </p>
              </div>
            </div>

            {/* Right Section: Progress Bar */}
            <div className="w-full md:w-1/3">
              {/* Progress Label and Percentage */}
              <div className="flex justify-between text-xs text-blue-200 mb-2 font-semibold uppercase tracking-wider">
                <span>Overall Completion</span>
                <span>{completionRate}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                {/* Animated Progress Fill */}
                <div 
                  className="h-full bg-gradient-to-r from-[#3598FE] to-[#60B4FF] relative"
                  style={{ width: `${completionRate}%` }}
                  role="progressbar"
                  aria-valuenow={completionRate}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {/* Shimmer Animation Effect */}
                  <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};