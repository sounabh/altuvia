import React from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Statistics overview component displaying key metrics in card format
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics data containing:
 *   @param {number} total - Total applications
 *   @param {number} inProgress - Applications in progress
 *   @param {number} submitted - Submitted applications
 *   @param {number} upcomingDeadlines - Applications with upcoming deadlines
 * @returns {JSX.Element} Responsive grid of statistic cards with:
 * - Icon indicators
 * - Color-coded categories
 * - Hover animations
 * - Gradient text values
 */
export const StatsOverview = ({ stats }) => {
  /**
   * Stat card configuration array
   * Defines the appearance and data mapping for each statistic card
   */
  const statCards = [
    {
      title: "Total Applications",
      value: stats.total,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700"
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Upcoming Deadlines",
      value: stats.upcomingDeadlines,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Card Header with Icon and Value */}
            <div className="flex items-center justify-between mb-4">
              {/* Icon Container */}
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              
              {/* Gradient Text Value */}
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
            
            {/* Card Title */}
            <h3 className="text-slate-600 font-medium text-sm uppercase tracking-wide">
              {stat.title}
            </h3>
          </div>
        );
      })}
    </div>
  );
};