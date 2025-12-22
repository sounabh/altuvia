import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, Clock, DollarSign, Award, 
  Calendar, Target, Globe, GraduationCap, BookOpen,
  CheckCircle, School, Building2, Phone, Mail, Download,
  ChevronRight
} from 'lucide-react';

const UniversityOverview = ({ university }) => {
  
  const isValidValue = (val) => {
    if (val === null || val === undefined) return false;
    if (val === '' || val === 'N/A' || val === 'n/a') return false;
    if (typeof val === 'number' && val === 0) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  const isEmail = (val) => {
    if (!val || typeof val !== 'string') return false;
    return /\S+@\S+\.\S+/.test(val.trim());
  };

  const isPhone = (val) => {
    if (!val || typeof val !== 'string') return false;
    const digits = val.replace(/\D/g, '');
    return digits.length >= 6;
  };

  const renderContactValue = (val) => {
    if (!isValidValue(val)) return null;
    const text = val.trim();
    if (isEmail(text)) {
      return (
        <a href={`mailto:${text}`} className="text-sm text-[#3598FE] hover:underline break-all">
          {text}
        </a>
      );
    }
    if (isPhone(text)) {
      const tel = text.replace(/[^+\d]/g, '');
      return (
        <a href={`tel:${tel}`} className="text-sm text-[#3598FE] hover:underline">
          {text}
        </a>
      );
    }
    return <p className="text-sm text-gray-600">{text}</p>;
  };

const getFormattedDeadlines = () => {
    let rawDeadlines = [];

    if (Array.isArray(university?.roundDeadlines) && university.roundDeadlines.length > 0) {
      rawDeadlines = university.roundDeadlines.map(d => d.trim());
    } else if (typeof university?.averageDeadlines === 'string' && university.averageDeadlines.trim()) {
      // Split by commas, but be careful not to split dates that contain commas
      // Match pattern: "Round X: " or "Deferred: " followed by everything until the next "Round" or "Deferred" or end
      const pattern = /(Round\s*\d+|Deferred):\s*([^,]+(?:,\s*\d{4})?[^R]*?)(?=\s*(?:Round\s*\d+|Deferred):|$)/gi;
      const matches = [...university.averageDeadlines.matchAll(pattern)];
      
      if (matches.length > 0) {
        rawDeadlines = matches.map(match => {
          const round = match[1].trim();
          const date = match[2].trim();
          return `${round}: ${date}`;
        });
      } else {
        // Fallback to simple comma split
        rawDeadlines = university.averageDeadlines.split(/,(?=\s*(?:Round|Deferred))/i).map(p => p.trim()).filter(Boolean);
      }
    }

    if (rawDeadlines.length === 0) return null;

    return rawDeadlines.map((deadline, idx) => {
      // Simple split on first colon to separate round from date
      const colonIndex = deadline.indexOf(':');
      if (colonIndex > -1) {
        const round = deadline.substring(0, colonIndex).trim();
        const date = deadline.substring(colonIndex + 1).trim();
        return { round, date };
      }
      return { round: `Round ${idx + 1}`, date: deadline };
    });
  };

  const formattedDeadlines = getFormattedDeadlines();

  const formatCurrency = (amount, currency) => {
    if (!isValidValue(amount)) return null;
    const symbol = currency === 'USD' || !currency ? '$' : currency + ' ';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const buildStats = () => {
    const statsArray = [];

    const ranking = university.ftGlobalRanking || university.usNewsRanking || 
                   university.qsRanking || university.timesRanking;
    if (isValidValue(ranking)) {
      statsArray.push({ icon: Award, label: "Global Ranking", value: `#${ranking}` });
    }

    if (isValidValue(university.gmatScoreMin) && isValidValue(university.gmatScoreMax)) {
      statsArray.push({ icon: TrendingUp, label: "GMAT Range", value: `${university.gmatScoreMin}-${university.gmatScoreMax}` });
    } else if (isValidValue(university.gmatAverageScore)) {
      statsArray.push({ icon: TrendingUp, label: "Avg GMAT", value: `${university.gmatAverageScore}` });
    }

    if (isValidValue(university.averageProgramLengthMonths)) {
      statsArray.push({ icon: Clock, label: "Duration", value: `${university.averageProgramLengthMonths} Months` });
    }

    if (isValidValue(university.acceptanceRate)) {
      statsArray.push({ icon: Users, label: "Acceptance", value: `${university.acceptanceRate.toFixed(1)}%` });
    }

    const tuition = formatCurrency(university.tuitionFees, university.currency);
    if (tuition) {
      statsArray.push({ icon: DollarSign, label: "Tuition", value: tuition });
    }

    if (isValidValue(university.studentsPerYear)) {
      statsArray.push({ icon: GraduationCap, label: "Students/Year", value: university.studentsPerYear.toLocaleString() });
    }

    if (isValidValue(university.minimumGpa)) {
      statsArray.push({ icon: BookOpen, label: "Min GPA", value: university.minimumGpa.toFixed(1) });
    }

    if (isValidValue(university.intakes)) {
      statsArray.push({ icon: Calendar, label: "Intakes", value: university.intakes });
    }

    return statsArray;
  };

  const allStats = buildStats();

  const buildRankings = () => {
    const rankings = [];
    if (isValidValue(university.ftGlobalRanking)) rankings.push({ value: university.ftGlobalRanking, label: "Financial Times" });
    if (isValidValue(university.usNewsRanking)) rankings.push({ value: university.usNewsRanking, label: "US News" });
    if (isValidValue(university.qsRanking)) rankings.push({ value: university.qsRanking, label: "QS World" });
    if (isValidValue(university.timesRanking)) rankings.push({ value: university.timesRanking, label: "Times Higher Ed" });
    return rankings;
  };

  const rankings = buildRankings();

  const highlights = university.whyChooseHighlights && university.whyChooseHighlights.length > 0 
    ? university.whyChooseHighlights.slice(0, 3).map((text, index) => {
        const hasColon = text.includes(':');
        return {
          icon: index === 0 ? Target : index === 1 ? Award : School,
          title: hasColon ? text.split(':')[0] : `Excellence ${index + 1}`,
          description: hasColon ? text.split(':')[1].trim() : text
        };
      })
    : [
        { icon: Target, title: "World-Class Faculty", description: "Learn from renowned professors and industry experts" },
        { icon: Award, title: "Career Excellence", description: "Outstanding employment rates and advancement opportunities" },
        { icon: School, title: "Global Network", description: "Join an influential alumni network worldwide" }
      ];

  const hasContactInfo = isValidValue(university.admissionsOfficeContact) || 
                         isValidValue(university.internationalOfficeContact) || 
                         isValidValue(university.generalInquiriesContact);

  const hasAcademicRequirements = isValidValue(university.languageTestRequirements) || 
                                   isValidValue(university.minimumGpa) || 
                                   isValidValue(university.gmatScoreMin) ||
                                   isValidValue(university.gmatAverageScore);

  const hasFinancialInfo = isValidValue(university.scholarshipInfo) || 
                           isValidValue(university.financialAidDetails) || 
                           isValidValue(university.tuitionFees);

  return (
    <div className="w-full">
      <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden rounded-xl">
        <CardContent className="p-0">
          
          {/* Header */}
          <div className="bg-[#002147] px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">University Overview</h2>
              <p className="text-blue-200 text-sm mt-1">Key information about {university.name}</p>
            </div>
            <div className="w-11 h-11 bg-[#3598FE] rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="p-6">
            
            {/* Top Section: Stats + Deadlines side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Key Statistics */}
              {allStats.length > 0 && (
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                    Key Statistics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {allStats.map((stat, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-[#3598FE] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className="h-4 w-4 text-[#3598FE]" />
                          <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                        </div>
                        <p className="text-base font-bold text-[#002147]">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Deadlines */}
              {formattedDeadlines && formattedDeadlines.length > 0 && (
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                    Application Deadlines
                  </h3>
                  <div className="bg-[#002147] rounded-lg p-4">
                    <ul className="space-y-2">
                      {formattedDeadlines.map((deadline, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#3598FE] rounded-full flex-shrink-0"></span>
                          <span className="text-sm text-white">
                            <span className="font-semibold">{deadline.round}:</span>{' '}
                            <span className="text-blue-200">{deadline.date}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Rankings Row */}
            {rankings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                  University Rankings
                </h3>
                <div className="inline-flex flex-wrap gap-3">
                  {rankings.map((ranking, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center hover:shadow-md transition-shadow">
                      <div className="text-xl font-bold text-[#002147]">#{ranking.value}</div>
                      <div className="text-xs text-gray-500 font-medium">{ranking.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Requirements Row */}
            {hasAcademicRequirements && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                  Academic Requirements
                </h3>
                <div className="inline-flex flex-wrap gap-4">
                  {isValidValue(university.languageTestRequirements) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-[#3598FE]" />
                        <span className="text-xs text-gray-500 font-medium uppercase">Language</span>
                      </div>
                      <p className="text-sm text-[#002147] font-medium">{university.languageTestRequirements}</p>
                    </div>
                  )}
                  {isValidValue(university.minimumGpa) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center min-w-[100px]">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-[#3598FE]" />
                        <span className="text-xs text-gray-500 font-medium uppercase">Min GPA</span>
                      </div>
                      <div className="text-2xl font-bold text-[#3598FE]">{university.minimumGpa.toFixed(1)}</div>
                    </div>
                  )}
                  {(isValidValue(university.gmatScoreMin) || isValidValue(university.gmatAverageScore)) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center min-w-[100px]">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-[#3598FE]" />
                        <span className="text-xs text-gray-500 font-medium uppercase">GMAT</span>
                      </div>
                      <div className="text-2xl font-bold text-[#3598FE]">
                        {isValidValue(university.gmatScoreMin) && isValidValue(university.gmatScoreMax)
                          ? `${university.gmatScoreMin}-${university.gmatScoreMax}`
                          : university.gmatAverageScore}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Information Row */}
            {hasFinancialInfo && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                  Financial Information
                </h3>
                <div className="inline-flex flex-wrap gap-4">
                  {isValidValue(university.tuitionFees) && (
                    <div className="bg-[#002147] rounded-lg p-4">
                      <div className="text-xs text-blue-200 font-medium uppercase mb-1">Tuition Fee</div>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(university.tuitionFees, university.currency)}
                      </div>
                    </div>
                  )}
                  {isValidValue(university.scholarshipInfo) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-[#3598FE]" />
                        <span className="text-xs text-gray-500 font-medium uppercase">Scholarships</span>
                      </div>
                      <p className="text-sm text-gray-700">{university.scholarshipInfo}</p>
                    </div>
                  )}
                  {isValidValue(university.financialAidDetails) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-[#3598FE]" />
                        <span className="text-xs text-gray-500 font-medium uppercase">Financial Aid</span>
                      </div>
                      <p className="text-sm text-gray-700">{university.financialAidDetails}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Why Choose Section */}
            <div className="mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-[#002147] px-5 py-3">
                  <h3 className="text-base font-semibold text-white text-center">Why Choose {university.name}?</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-[#3598FE]/10 rounded-xl flex items-center justify-center">
                        <highlight.icon className="h-6 w-6 text-[#3598FE]" />
                      </div>
                      <h4 className="text-sm font-semibold text-[#002147] mb-2">{highlight.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{highlight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information Row */}
            {hasContactInfo && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#002147] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#3598FE] rounded-full"></span>
                  Contact Information
                </h3>
                <div className="inline-flex flex-wrap gap-4">
                  {isValidValue(university.admissionsOfficeContact) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#3598FE]" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium uppercase mb-1">Admissions</div>
                      {renderContactValue(university.admissionsOfficeContact)}
                    </div>
                  )}
                  {isValidValue(university.internationalOfficeContact) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-[#3598FE]" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium uppercase mb-1">International</div>
                      {renderContactValue(university.internationalOfficeContact)}
                    </div>
                  )}
                  {isValidValue(university.generalInquiriesContact) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 bg-[#3598FE]/10 rounded-lg flex items-center justify-center">
                        <Phone className="h-5 w-5 text-[#3598FE]" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium uppercase mb-1">General</div>
                      {renderContactValue(university.generalInquiriesContact)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => window.open('/apply', '_blank')}
                className="bg-[#3598FE] hover:bg-[#2080e8] text-white h-11 px-5 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Apply Now
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.location.href = `/university/${university.slug}/scholarships`}
                className="bg-[#002147] hover:bg-[#001a38] text-white h-11 px-5 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Scholarships
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.location.href = `/university/${university.slug}/gallery`}
                className="bg-white border-2 border-gray-200 text-[#002147] hover:border-[#3598FE] hover:bg-gray-50 h-11 px-5 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                View Gallery
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityOverview;