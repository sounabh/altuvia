import React from "react";
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Award,
  Target,
  Globe,
  GraduationCap,
  BookOpen,
  CheckCircle,
  School,
  Phone,
  Mail,
  Sparkles,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

const UniversityOverview = ({ university }) => {
  // Primary colors
  const primaryColor = "#002147";
  const secondaryColor = "#3598FE";
  const lightBg = "#F8FAFC";

  // Validation helper
  const isValidValue = (val) => {
    if (val === null || val === undefined) return false;
    if (val === "" || val === "N/A" || val === "n/a") return false;
    if (typeof val === "number" && val === 0) return false;
    if (typeof val === "string" && val.trim() === "") return false;
    return true;
  };

  const isEmail = (val) => {
    if (!val || typeof val !== "string") return false;
    return /\S+@\S+\.\S+/.test(val.trim());
  };

  const isPhone = (val) => {
    if (!val || typeof val !== "string") return false;
    const digits = val.replace(/\D/g, "");
    return digits.length >= 6;
  };

  // Format deadlines
  const getFormattedDeadlines = () => {
    let formattedDeadlines = [];

    if (
      Array.isArray(university?.roundDeadlines) &&
      university.roundDeadlines.length > 0
    ) {
      formattedDeadlines = university.roundDeadlines.map((d, idx) => {
        const trimmed = d.trim();
        const match = trimmed.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);
        if (match) {
          return {
            round: match[1].replace(/round\s*/i, "Round ").trim(),
            date: match[2].trim(),
          };
        }
        return { round: `Round ${idx + 1}`, date: trimmed };
      });
    } else if (
      typeof university?.averageDeadlines === "string" &&
      university.averageDeadlines.trim()
    ) {
      const deadlineStr = university.averageDeadlines.trim();
      const parts = deadlineStr
        .split(/(?=(?:Round\s*\d+|Deferred)\s*:)/gi)
        .filter(Boolean);

      parts.forEach((part, idx) => {
        const trimmedPart = part.trim().replace(/,\s*$/, "").replace(/^\s*,/, "");
        const match = trimmedPart.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);

        if (match) {
          const roundLabel = match[1].replace(/round\s*/i, "Round ").trim();
          const dateValue = match[2].trim().replace(/,\s*$/, "").replace(/\s+/g, " ");
          if (roundLabel && dateValue) {
            formattedDeadlines.push({ round: roundLabel, date: dateValue });
          }
        } else if (trimmedPart && !trimmedPart.match(/^\s*$/)) {
          formattedDeadlines.push({
            round: `Round ${idx + 1}`,
            date: trimmedPart.replace(/,\s*$/, "").trim(),
          });
        }
      });
    }

    formattedDeadlines.sort((a, b) => {
      const aNum = parseInt(a.round.match(/\d+/)?.[0] || "999");
      const bNum = parseInt(b.round.match(/\d+/)?.[0] || "999");
      return aNum - bNum;
    });

    return formattedDeadlines.length > 0 ? formattedDeadlines : null;
  };

  const formattedDeadlines = getFormattedDeadlines();

  const formatCurrency = (amount, currency) => {
    if (!isValidValue(amount)) return null;
    const symbol = currency === "USD" || !currency ? "$" : currency + " ";
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Build hero stats (top 4 most important)
  const buildHeroStats = () => {
    const stats = [];

    const ranking =
      university.ftGlobalRanking ||
      university.usNewsRanking ||
      university.qsRanking ||
      university.timesRanking;
    if (isValidValue(ranking)) {
      stats.push({ 
        icon: Award, 
        label: "Global Ranking", 
        value: `#${ranking}`, 
        color: "text-amber-600", 
        bg: "bg-amber-50",
        subtitle: "World Rank"
      });
    }

    if (isValidValue(university.gmatScoreMin) && isValidValue(university.gmatScoreMax)) {
      stats.push({ 
        icon: TrendingUp, 
        label: "GMAT Range", 
        value: `${university.gmatScoreMin}-${university.gmatScoreMax}`, 
        color: "text-[#002147]", 
        bg: "bg-blue-50",
        subtitle: "Score Range"
      });
    } else if (isValidValue(university.gmatAverageScore)) {
      stats.push({ 
        icon: TrendingUp, 
        label: "Avg GMAT", 
        value: `${university.gmatAverageScore}`, 
        color: "text-[#002147]", 
        bg: "bg-blue-50",
        subtitle: "Average Score"
      });
    }

    if (isValidValue(university.acceptanceRate)) {
      stats.push({ 
        icon: Users, 
        label: "Acceptance Rate", 
        value: `${university.acceptanceRate.toFixed(1)}%`, 
        color: "text-emerald-600", 
        bg: "bg-emerald-50",
        subtitle: "Admission Rate"
      });
    }

    const tuition = formatCurrency(university.tuitionFees, university.currency);
    if (tuition) {
      stats.push({ 
        icon: DollarSign, 
        label: "Tuition Fee", 
        value: tuition, 
        color: "text-violet-600", 
        bg: "bg-violet-50",
        subtitle: "Annual Fee"
      });
    }

    if (isValidValue(university.averageProgramLengthMonths)) {
      stats.push({ 
        icon: Clock, 
        label: "Program Duration", 
        value: `${university.averageProgramLengthMonths} Months`, 
        color: "text-rose-600", 
        bg: "bg-rose-50",
        subtitle: "Course Length"
      });
    }

    if (isValidValue(university.studentsPerYear)) {
      stats.push({ 
        icon: GraduationCap, 
        label: "Class Size", 
        value: university.studentsPerYear.toLocaleString(), 
        color: "text-cyan-600", 
        bg: "bg-cyan-50",
        subtitle: "Students/Year"
      });
    }

    return stats;
  };

  const heroStats = buildHeroStats();

  // Build all rankings
  const buildRankings = () => {
    const rankings = [];
    if (isValidValue(university.ftGlobalRanking)) {
      rankings.push({ value: university.ftGlobalRanking, label: "Financial Times", color: "text-amber-600", bg: "bg-amber-50", icon: Award });
    }
    if (isValidValue(university.usNewsRanking)) {
      rankings.push({ value: university.usNewsRanking, label: "US News & World Report", color: "text-blue-600", bg: "bg-blue-50", icon: BookOpen });
    }
    if (isValidValue(university.qsRanking)) {
      rankings.push({ value: university.qsRanking, label: "QS World Rankings", color: "text-violet-600", bg: "bg-violet-50", icon: Globe });
    }
    if (isValidValue(university.timesRanking)) {
      rankings.push({ value: university.timesRanking, label: "Times Higher Education", color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp });
    }
    return rankings;
  };

  const rankings = buildRankings();

  // Build highlights
  const highlights =
    university.whyChooseHighlights?.slice(0, 3).map((text, index) => {
      const hasColon = text.includes(":");
      return {
        icon: index === 0 ? Target : index === 1 ? Award : School,
        title: hasColon ? text.split(":")[0] : `Key Strength ${index + 1}`,
        description: hasColon ? text.split(":")[1].trim() : text,
      };
    }) || [];

  // Build contacts
  const contacts = [
    { label: "Admissions Office", value: university.admissionsOfficeContact, icon: Mail },
    { label: "International Office", value: university.internationalOfficeContact, icon: Globe },
    { label: "General Inquiries", value: university.generalInquiriesContact, icon: Phone },
  ].filter((c) => isValidValue(c.value));

  // Check for valid sections
  const hasRankings = rankings.length > 1;
  const hasHighlights = highlights.length > 0;
  const hasScholarship = isValidValue(university.scholarshipInfo);
  const hasFinancialAid = isValidValue(university.financialAidDetails);
  const hasLanguage = isValidValue(university.languageTestRequirements);
  const hasMinGpa = isValidValue(university.minimumGpa);
  const hasContacts = contacts.length > 0;
  const hasDeadlines = formattedDeadlines && formattedDeadlines.length > 0;

  return (
    <div className="w-full space-y-8">
      
      {/* ============ HERO STATS SECTION ============ */}
      {heroStats.length > 0 && (
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {heroStats.slice(0, 4).map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="relative p-4 lg:p-5">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg}`}>
                        <IconComponent className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {stat.subtitle}
                      </div>
                    </div>
                    
                    {/* Value */}
                    <div className={`text-2xl lg:text-3xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary Stats Row - More compact */}
          {heroStats.length > 4 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {heroStats.slice(4).map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <IconComponent className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-500 truncate">{stat.label}</div>
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============ MAIN CONTENT GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* RANKINGS SECTION */}
          {hasRankings && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#002147]">Global Rankings</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {rankings.map((r, i) => {
                  const RankingIcon = r.icon;
                  return (
                    <div 
                      key={i} 
                      className={`${r.bg} rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 rounded-lg bg-white">
                          <RankingIcon className={`w-3.5 h-3.5 ${r.color}`} />
                        </div>
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {r.label}
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${r.color}`}>
                        #{r.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* REQUIREMENTS SECTION */}
          {(hasLanguage || hasMinGpa) && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#002147]">Academic Requirements</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hasLanguage && (
                  <div className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-[#002147]" />
                      </div>
                      <div className="text-sm font-bold text-[#002147]">
                        Language Requirements
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {university.languageTestRequirements}
                    </div>
                  </div>
                )}
                
                {hasMinGpa && (
                  <div className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-[#002147]" />
                      </div>
                      <div className="text-sm font-bold text-[#002147]">
                        Minimum GPA
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#002147]">
                      {university.minimumGpa.toFixed(1)}
                      <span className="text-sm font-normal text-gray-500 ml-1">out of 4.0</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* WHY CHOOSE SECTION */}
          {hasHighlights && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#002147]">
                  Why Choose {university.name}?
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((h, i) => {
                  const HighlightIcon = h.icon;
                  return (
                    <div
                      key={i}
                      className="group relative p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                        <HighlightIcon className="w-5 h-5 text-[#002147]" />
                      </div>
                      
                      <h4 className="text-sm font-bold text-[#002147] mb-2">
                        {h.title}
                      </h4>
                      
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {h.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* FINANCIAL SECTION */}
          {(hasScholarship || hasFinancialAid) && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#002147]">Financial Support</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasScholarship && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-emerald-800 mb-1">
                          Scholarships Available
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed line-clamp-3">
                          {university.scholarshipInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasFinancialAid && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-amber-800 mb-1">
                          Financial Aid Options
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed line-clamp-3">
                          {university.financialAidDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CONTACT SECTION */}
          {hasContacts && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#002147] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#002147]">Get in Touch</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {contacts.map((contact, i) => {
                  const ContactIcon = contact.icon;
                  const text = contact.value.trim();
                  const isEmailContact = isEmail(text);
                  const isPhoneContact = isPhone(text);
                  
                  const href = isEmailContact 
                    ? `mailto:${text}` 
                    : isPhoneContact 
                      ? `tel:${text.replace(/[^+\d]/g, "")}` 
                      : null;

                  return (
                    <a
                      key={i}
                      href={href || "#"}
                      className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-[#002147] transition-all duration-300"
                    >
                      <ContactIcon className="w-4 h-4 text-[#002147] group-hover:text-white transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 group-hover:text-blue-200 font-medium uppercase tracking-wide truncate transition-colors">
                          {contact.label}
                        </div>
                        <div className="text-sm text-[#002147] group-hover:text-white font-medium truncate transition-colors">
                          {text}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN - Deadlines Sidebar */}
        {hasDeadlines && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-[#002147] rounded-2xl p-5 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3598FE]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Application Deadlines
                    </span>
                  </div>
                  {formattedDeadlines.length > 1 && (
                    <span className="text-xs bg-[#3598FE] text-white px-2 py-1 rounded-full font-bold">
                      {formattedDeadlines.length} Rounds
                    </span>
                  )}
                </div>

                {/* Deadline List */}
                <div className="space-y-3">
                  {formattedDeadlines.map((deadline, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#3598FE] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white mb-0.5 truncate">
                          {deadline.round}
                        </div>
                        <div className="text-xs text-blue-200/80 truncate">
                          {deadline.date}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-center">
                    <span className="text-xs text-blue-300/70">
                      Plan your application timeline
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityOverview;