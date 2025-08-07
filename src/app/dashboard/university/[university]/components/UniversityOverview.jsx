import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, Users, Clock, DollarSign, Award, 
  Calendar, Target, BarChart, Sparkles 
} from 'lucide-react';

const UniversityOverview = ({ university, savedStatus, toggleSaved }) => {
  const stats = [
    { 
      icon: Award, 
      label: "FT RANKING 2024", 
      value: university.additionalData.ftGlobalRanking ? `#${university.additionalData.ftGlobalRanking}` : 'N/A', 
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-yellow-200",
      iconBg: "bg-[#002147]"
    },
    { 
      icon: TrendingUp, 
      label: "GMAT AVERAGE", 
      value: university.additionalData.gmatAverageScore || 'N/A',
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-green-200",
      iconBg: "bg-[#002147]"
    },
    { 
      icon: Clock, 
      label: "PROGRAM LENGTH", 
      value: "21 Months", 
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-blue-200",
      iconBg: "bg-[#002147]"
    },
    { 
      icon: Calendar, 
      label: "APPLICATION DEADLINE", 
      value: university.additionalData.averageDeadlines ? 
        university.additionalData.averageDeadlines.split(',')[0].trim() : 'TBD',
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-red-200",
      iconBg: "bg-[#002147]"
    },
    { 
      icon: Users, 
      label: "ACCEPTANCE RATE", 
      value: university.additionalData.acceptanceRate ? 
        `${(university.additionalData.acceptanceRate * 100).toFixed(1)}%` : 'N/A',
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-purple-200",
      iconBg: "bg-[#002147]"
    },
    { 
      icon: DollarSign, 
      label: "TOTAL PROGRAM COST", 
      value: university.additionalData.tuitionFees ? 
        `$${university.additionalData.tuitionFees}` : 'N/A',
      color: "text-[#002147]",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      iconBg: "bg-[#002147]"
    }
  ];

  const highlights = university.whyChooseHighlights.length > 0 
    ? university.whyChooseHighlights.map((text, index) => ({
        icon: index === 0 ? Target : index === 1 ? BarChart : Sparkles,
        title: text.split(':')[0],
        description: text.split(':')[1] || text
      }))
    : [
        {
          icon: Target,
          title: "World-Class Faculty",
          description: "Learn from renowned professors and industry experts"
        },
        {
          icon: BarChart,
          title: "Career Advancement",
          description: "95% employment rate within 3 months of graduation"
        },
        {
          icon: Sparkles,
          title: "Innovation Hub",
          description: "Located in the global center of technology"
        }
      ];

  return (
    <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-[#002147] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-1 h-8 bg-white rounded-full mr-4 opacity-80"></div>
                <h2 className="text-2xl font-semibold tracking-tight">University Overview</h2>
              </div>
              <p className="text-white text-sm font-medium">
                {university.name} Excellence
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${stat.color} mb-1 group-hover:text-[#3598FE] transition-colors duration-200`}>
                      {stat.value}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 font-semibold leading-tight">
                  {stat.label}
                </div>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-inner">
            <h3 className="text-xl font-bold text-[#002147] mb-6 text-center">
              Why Choose {university.name}?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#002147] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <highlight.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-[#002147] mb-2 group-hover:text-[#3598FE] transition-colors duration-200">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="flex-1 bg-[#3598FE] text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] text-center">
              Save additional Documents
            </button>
            <button 
              onClick={toggleSaved}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] text-center ${
                savedStatus 
                  ? 'bg-green-600 text-white' 
                  : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#002147]'
              }`}
            >
              {savedStatus ? 'University Saved ✓' : 'Save to My Universities'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityOverview;