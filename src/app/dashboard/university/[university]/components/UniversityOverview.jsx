import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, Clock, DollarSign, Award, 
  Calendar, Target, Globe, GraduationCap, BookOpen,
  CheckCircle, School, Building2, Phone, Mail, Download
} from 'lucide-react';

/**
 * UniversityOverview Component
 * 
 * A comprehensive overview card displaying key information about a university.
 * Shows statistics, rankings, requirements, financial information, and contact details.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.university - University data object containing all university information
 * @returns {React.ReactElement} University overview card component
 */
const UniversityOverview = ({ university }) => {
  /**
   * Primary statistics array with formatted values and fallbacks
   * Each stat object contains an icon, label, and formatted value
   */
  const stats = [
    { 
      icon: Award, 
      label: "Global Ranking", 
      value: university.ftGlobalRanking ? `#${university.ftGlobalRanking}` : 
             (university.usNewsRanking ? `#${university.usNewsRanking}` : 
             (university.qsRanking ? `#${university.qsRanking}` : 
             (university.timesRanking ? `#${university.timesRanking}` : 'N/A')))
    },
    { 
      icon: TrendingUp, 
      label: "GMAT Score", 
      value: university.gmatScoreMin && university.gmatScoreMax ? 
        `${university.gmatScoreMin}-${university.gmatScoreMax}` :
        (university.gmatAverageScore ? `${university.gmatAverageScore}` : 'N/A')
    },
    { 
      icon: Clock, 
      label: "Program Length", 
      value: university.averageProgramLengthMonths ? 
        `${university.averageProgramLengthMonths} Months` : "21 Months"
    },
    { 
      icon: Calendar, 
      label: "Application Deadline", 
      value: university.averageDeadlines ? 
        university.averageDeadlines.split(',')[0].trim() : 'Rolling'
    },
    { 
      icon: Users, 
      label: "Acceptance Rate", 
      value: university.acceptanceRate ? 
        `${(university.acceptanceRate * 100).toFixed(1)}%` : 'Competitive'
    },
    { 
      icon: DollarSign, 
      label: "Total Cost", 
      value: university.totalCost ? 
        `${university.currency === 'USD' ? '$' : university.currency || '$'}${university.totalCost.toLocaleString()}` :
        (university.tuitionFees ? 
          `${university.currency === 'USD' ? '$' : university.currency || '$'}${university.tuitionFees.toLocaleString()}` : 'Contact')
    }
  ];

  /**
   * Additional statistics that are conditionally added if data exists
   */
  const additionalStats = [];
  
  if (university.studentsPerYear) {
    additionalStats.push({
      icon: GraduationCap,
      label: "Students Per Year",
      value: university.studentsPerYear.toLocaleString()
    });
  }

  if (university.minimumGpa) {
    additionalStats.push({
      icon: BookOpen,
      label: "Minimum GPA",
      value: university.minimumGpa.toFixed(1)
    });
  }

  if (university.intakes) {
    additionalStats.push({
      icon: Calendar,
      label: "Intakes",
      value: university.intakes
    });
  }

  /**
   * Combined statistics array with all available stats
   * Filters out any stats with null or 'N/A' values
   */
  const allStats = [...stats, ...additionalStats].filter(stat => stat.value && stat.value !== 'N/A');

  /**
   * Processed highlights data with icons and formatted text
   * Uses university-provided highlights or falls back to default content
   */
  const highlights = university.whyChooseHighlights && university.whyChooseHighlights.length > 0 
    ? university.whyChooseHighlights.slice(0, 3).map((text, index) => {
        const hasColon = text.includes(':');
        return {
          icon: index === 0 ? Target : index === 1 ? Award : School,
          title: hasColon ? text.split(':')[0] : `Excellence Point ${index + 1}`,
          description: hasColon ? text.split(':')[1].trim() : text
        };
      })
    : [
        {
          icon: Target,
          title: "World-Class Faculty",
          description: "Learn from renowned professors and industry experts with real-world experience"
        },
        {
          icon: Award,
          title: "Career Excellence",
          description: "Outstanding employment rates and career advancement opportunities"
        },
        {
          icon: School,
          title: "Global Network",
          description: "Join an influential alumni network spanning across continents"
        }
      ];

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
      <CardContent className="p-0">
        
        {/* Header Section */}
        <div className="bg-[#002147] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">University Overview</h2>
              <p className="text-blue-200">
                Comprehensive details about {university.name}
              </p>
            </div>
            <div className="hidden md:flex items-center">
              <div className="w-12 h-12 bg-[#3598FE] rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Main Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStats.map((stat, index) => (
              <div 
                key={index} 
                className="p-4 rounded-xl bg-white border border-gray-200 hover:border-[#3598FE] hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-[#3598FE] group-hover:bg-[#002147] transition-colors duration-300">
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="text-2xl font-bold text-[#002147] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Rankings Section - Conditionally rendered if ranking data exists */}
          {(university.ftGlobalRanking || university.usNewsRanking || university.qsRanking || university.timesRanking) && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[#002147] mb-4 text-center flex items-center justify-center">
                <Award className="h-5 w-5 mr-2 text-[#3598FE]" />
                University Rankings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {university.ftGlobalRanking && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <div className="text-2xl font-bold text-[#002147] mb-1">#{university.ftGlobalRanking}</div>
                    <div className="text-sm text-gray-600">Financial Times</div>
                  </div>
                )}
                
                {university.usNewsRanking && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <div className="text-2xl font-bold text-[#002147] mb-1">#{university.usNewsRanking}</div>
                    <div className="text-sm text-gray-600">US News</div>
                  </div>
                )}
                
                {university.qsRanking && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <div className="text-2xl font-bold text-[#002147] mb-1">#{university.qsRanking}</div>
                    <div className="text-sm text-gray-600">QS World</div>
                  </div>
                )}
                
                {university.timesRanking && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <div className="text-2xl font-bold text-[#002147] mb-1">#{university.timesRanking}</div>
                    <div className="text-sm text-gray-600">Times Higher Ed</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Requirements Section - Conditionally rendered */}
          {(university.languageTestRequirements || university.minimumGpa || university.gmatScoreMin) && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[#002147] mb-4 text-center flex items-center justify-center">
                <School className="h-5 w-5 mr-2 text-[#3598FE]" />
                Academic Requirements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {university.languageTestRequirements && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-[#002147] mb-2 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-[#3598FE]" />
                      Language
                    </h4>
                    <p className="text-sm text-gray-700">{university.languageTestRequirements}</p>
                  </div>
                )}

                {university.minimumGpa && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <h4 className="font-bold text-[#002147] mb-2 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 mr-2 text-[#3598FE]" />
                      Min GPA
                    </h4>
                    <div className="text-2xl font-bold text-[#3598FE]">
                      {university.minimumGpa.toFixed(1)}
                    </div>
                  </div>
                )}

                {(university.gmatScoreMin || university.gmatAverageScore) && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <h4 className="font-bold text-[#002147] mb-2 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-[#3598FE]" />
                      GMAT
                    </h4>
                    <div className="text-2xl font-bold text-[#3598FE]">
                      {university.gmatScoreMin && university.gmatScoreMax 
                        ? `${university.gmatScoreMin}-${university.gmatScoreMax}`
                        : `${university.gmatAverageScore}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Information Section - Conditionally rendered */}
          {(university.scholarshipInfo || university.financialAidDetails || university.tuitionFees) && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[#002147] mb-4 text-center flex items-center justify-center">
                <DollarSign className="h-5 w-5 mr-2 text-[#3598FE]" />
                Financial Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {university.tuitionFees && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-[#002147] mb-2">Tuition Fees</h4>
                    <div className="text-xl font-bold text-[#3598FE] mb-1">
                      {university.currency || '$'}{university.tuitionFees.toLocaleString()}
                    </div>
                    {university.additionalFees && (
                      <p className="text-sm text-gray-600">
                        Additional: {university.currency || '$'}{university.additionalFees.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {university.scholarshipInfo && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-[#002147] mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-[#3598FE]" />
                      Scholarships
                    </h4>
                    <p className="text-sm text-gray-700">{university.scholarshipInfo}</p>
                  </div>
                )}

                {university.financialAidDetails && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 md:col-span-2">
                    <h4 className="font-bold text-[#002147] mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-[#3598FE]" />
                      Financial Aid
                    </h4>
                    <p className="text-sm text-gray-700">{university.financialAidDetails}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Why Choose Section - Always rendered */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-[#002147] mb-6 text-center">
              Why Choose {university.name}?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#3598FE] rounded-xl flex items-center justify-center group-hover:bg-[#002147] transition-colors duration-300">
                    <highlight.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-[#002147] text-lg mb-2 group-hover:text-[#3598FE] transition-colors duration-300">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information Section - Conditionally rendered */}
          {(university.admissionsOfficeContact || university.internationalOfficeContact || university.generalInquiriesContact) && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[#002147] mb-4 text-center flex items-center justify-center">
                <Phone className="h-5 w-5 mr-2 text-[#3598FE]" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {university.admissionsOfficeContact && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <Mail className="h-6 w-6 text-[#3598FE] mx-auto mb-2" />
                    <h4 className="font-bold text-[#002147] mb-2">Admissions</h4>
                    <p className="text-sm text-gray-700 break-words">{university.admissionsOfficeContact}</p>
                  </div>
                )}

                {university.internationalOfficeContact && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <Globe className="h-6 w-6 text-[#3598FE] mx-auto mb-2" />
                    <h4 className="font-bold text-[#002147] mb-2">International</h4>
                    <p className="text-sm text-gray-700 break-words">{university.internationalOfficeContact}</p>
                  </div>
                )}

                {university.generalInquiriesContact && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-all duration-300">
                    <Phone className="h-6 w-6 text-[#3598FE] mx-auto mb-2" />
                    <h4 className="font-bold text-[#002147] mb-2">General</h4>
                    <p className="text-sm text-gray-700 break-words">{university.generalInquiriesContact}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {/* Apply Now Button */}
            <Button 
              onClick={() => window.open('/apply', '_blank')}
              className="bg-[#3598FE] hover:bg-[#2485ed] text-white py-7 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
            
            {/* Scholarships Button */}
            <Button
              onClick={() => window.location.href = `/university/${university.slug}/scholarships`}
              className="bg-[#002147] hover:bg-[#001a36] text-white py-7 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Scholarships
            </Button>
            
            {/* Gallery Button */}
            <Button
              onClick={() => window.location.href = `/university/${university.slug}/gallery`}
              className="bg-white border-2 border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white py-7 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              View More Photos / Gallery
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityOverview;