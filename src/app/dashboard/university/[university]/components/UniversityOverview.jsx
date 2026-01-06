import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Award,
  Calendar,
  Target,
  Globe,
  GraduationCap,
  BookOpen,
  CheckCircle,
  School,
  Building2,
  Phone,
  Mail,
  Download,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const UniversityOverview = ({ university }) => {
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

  const renderContactValue = (val) => {
    if (!isValidValue(val)) return null;
    const text = val.trim();
    if (isEmail(text)) {
      return (
        <a
          href={`mailto:${text}`}
          className="text-sm text-[#3598FE] hover:underline break-all"
        >
          {text}
        </a>
      );
    }
    if (isPhone(text)) {
      const tel = text.replace(/[^+\d]/g, "");
      return (
        <a
          href={`tel:${tel}`}
          className="text-sm text-[#3598FE] hover:underline"
        >
          {text}
        </a>
      );
    }
    return <p className="text-sm text-gray-600">{text}</p>;
  };

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
        const trimmedPart = part
          .trim()
          .replace(/,\s*$/, "")
          .replace(/^\s*,/, "");

        const match = trimmedPart.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);

        if (match) {
          const roundLabel = match[1].replace(/round\s*/i, "Round ").trim();
          const dateValue = match[2]
            .trim()
            .replace(/,\s*$/, "")
            .replace(/\s+/g, " ");

          if (roundLabel && dateValue) {
            formattedDeadlines.push({
              round: roundLabel,
              date: dateValue,
            });
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

  const buildStats = () => {
    const statsArray = [];

    const ranking =
      university.ftGlobalRanking ||
      university.usNewsRanking ||
      university.qsRanking ||
      university.timesRanking;
    if (isValidValue(ranking)) {
      statsArray.push({
        icon: Award,
        label: "Global Ranking",
        value: `#${ranking}`,
      });
    }

    if (
      isValidValue(university.gmatScoreMin) &&
      isValidValue(university.gmatScoreMax)
    ) {
      statsArray.push({
        icon: TrendingUp,
        label: "GMAT Range",
        value: `${university.gmatScoreMin}-${university.gmatScoreMax}`,
      });
    } else if (isValidValue(university.gmatAverageScore)) {
      statsArray.push({
        icon: TrendingUp,
        label: "Avg GMAT",
        value: `${university.gmatAverageScore}`,
      });
    }

    if (isValidValue(university.averageProgramLengthMonths)) {
      statsArray.push({
        icon: Clock,
        label: "Duration",
        value: `${university.averageProgramLengthMonths} Months`,
      });
    }

    if (isValidValue(university.acceptanceRate)) {
      statsArray.push({
        icon: Users,
        label: "Acceptance",
        value: `${university.acceptanceRate.toFixed(1)}%`,
      });
    }

    const tuition = formatCurrency(university.tuitionFees, university.currency);
    if (tuition) {
      statsArray.push({ icon: DollarSign, label: "Tuition", value: tuition });
    }

    if (isValidValue(university.studentsPerYear)) {
      statsArray.push({
        icon: GraduationCap,
        label: "Students/Year",
        value: university.studentsPerYear.toLocaleString(),
      });
    }

    if (isValidValue(university.minimumGpa)) {
      statsArray.push({
        icon: BookOpen,
        label: "Min GPA",
        value: university.minimumGpa.toFixed(1),
      });
    }

    if (isValidValue(university.intakes)) {
      statsArray.push({
        icon: Calendar,
        label: "Intakes",
        value: university.intakes,
      });
    }

    return statsArray;
  };

  const allStats = buildStats();

  const buildRankings = () => {
    const rankings = [];
    if (isValidValue(university.ftGlobalRanking))
      rankings.push({
        value: university.ftGlobalRanking,
        label: "Financial Times",
      });
    if (isValidValue(university.usNewsRanking))
      rankings.push({ value: university.usNewsRanking, label: "US News" });
    if (isValidValue(university.qsRanking))
      rankings.push({ value: university.qsRanking, label: "QS World" });
    if (isValidValue(university.timesRanking))
      rankings.push({
        value: university.timesRanking,
        label: "Times Higher Ed",
      });
    return rankings;
  };

  const rankings = buildRankings();

  const highlights =
    university.whyChooseHighlights && university.whyChooseHighlights.length > 0
      ? university.whyChooseHighlights.slice(0, 3).map((text, index) => {
          const hasColon = text.includes(":");
          return {
            icon: index === 0 ? Target : index === 1 ? Award : School,
            title: hasColon ? text.split(":")[0] : `Excellence ${index + 1}`,
            description: hasColon ? text.split(":")[1].trim() : text,
          };
        })
      : [
          {
            icon: Target,
            title: "World-Class Faculty",
            description: "Learn from renowned professors and industry experts",
          },
          {
            icon: Award,
            title: "Career Excellence",
            description:
              "Outstanding employment rates and advancement opportunities",
          },
          {
            icon: School,
            title: "Global Network",
            description: "Join an influential alumni network worldwide",
          },
        ];

  const hasContactInfo =
    isValidValue(university.admissionsOfficeContact) ||
    isValidValue(university.internationalOfficeContact) ||
    isValidValue(university.generalInquiriesContact);

  const hasAcademicRequirements =
    isValidValue(university.languageTestRequirements) ||
    isValidValue(university.minimumGpa) ||
    isValidValue(university.gmatScoreMin) ||
    isValidValue(university.gmatAverageScore);

  const hasFinancialInfo =
    isValidValue(university.scholarshipInfo) ||
    isValidValue(university.financialAidDetails) ||
    isValidValue(university.tuitionFees);

  // Section Header Component for consistency
  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10">
        <Icon className="w-4 h-4 text-[#3598FE]" />
      </div>
      <h3 className="text-sm font-bold text-[#002147] uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
    </div>
  );

  return (
    <div className="w-full">
      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {/* Header - Enhanced with gradient */}
          <div className="relative bg-gradient-to-r from-[#002147] via-[#002147] to-[#003366] px-8 py-6">
            <div className='absolute inset-0 bg-[url(&apos;data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&apos;)] opacity-50'></div>

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#3598FE]" />
                  <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
                    Complete Overview
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  University Overview
                </h2>
                <p className="text-blue-200/80 text-sm mt-1">
                  Everything you need to know about {university.name}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#3598FE] to-[#2080E5] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Top Section: Stats + Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Key Statistics */}
              {allStats.length > 0 && (
                <div className="lg:col-span-2">
                  <SectionHeader icon={TrendingUp} title="Key Statistics" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allStats.map((stat, index) => (
                      <div
                        key={index}
                        className="group bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4 hover:border-[#3598FE]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-[#3598FE]/10 flex items-center justify-center group-hover:bg-[#3598FE]/20 transition-colors">
                            <stat.icon className="h-3.5 w-3.5 text-[#3598FE]" />
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                            {stat.label}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-[#002147] group-hover:text-[#3598FE] transition-colors">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Deadlines */}
              {formattedDeadlines && formattedDeadlines.length > 0 && (
                <div className="lg:col-span-1">
                  <SectionHeader icon={Calendar} title="Deadlines" />
                  <div className="bg-gradient-to-br from-[#002147] to-[#001a38] rounded-xl p-5 shadow-xl shadow-[#002147]/20">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3598FE] rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                          {formattedDeadlines.length > 1
                            ? "Application Rounds"
                            : "Deadline"}
                        </span>
                      </div>
                      {formattedDeadlines.length > 1 && (
                        <span className="text-[10px] bg-[#3598FE] text-white px-2.5 py-1 rounded-full font-semibold">
                          {formattedDeadlines.length} Rounds
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {formattedDeadlines.map((deadline, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 group"
                        >
                          <div className="mt-1 w-6 h-6 rounded-full bg-[#3598FE]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-[#3598FE]">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-white font-semibold block">
                              {deadline.round}
                            </span>
                            <span className="text-sm text-blue-200/80">
                              {deadline.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rankings Row */}
            {rankings.length > 0 && (
              <div className="mb-10">
                <SectionHeader icon={Award} title="University Rankings" />
                <div className="flex flex-wrap gap-4">
                  {rankings.map((ranking, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl px-6 py-4 text-center hover:shadow-xl hover:shadow-blue-500/10 hover:border-[#3598FE]/30 transition-all duration-300 min-w-[140px]"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#3598FE] to-[#2080E5] rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <div className="pt-3">
                        <div className="text-2xl font-black text-[#002147] group-hover:text-[#3598FE] transition-colors">
                          #{ranking.value}
                        </div>
                        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mt-1">
                          {ranking.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Requirements */}
            {hasAcademicRequirements && (
              <div className="mb-10">
                <SectionHeader icon={BookOpen} title="Academic Requirements" />
                <div className="flex flex-wrap gap-4">
                  {isValidValue(university.languageTestRequirements) && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300 max-w-xs">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-[#3598FE]" />
                        </div>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                          Language
                        </span>
                      </div>
                      <p className="text-sm text-[#002147] font-medium leading-relaxed">
                        {university.languageTestRequirements}
                      </p>
                    </div>
                  )}
                  {isValidValue(university.minimumGpa) && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 text-center hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300 min-w-[130px]">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-[#3598FE]" />
                      </div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                        Min GPA
                      </div>
                      <div className="text-3xl font-black bg-gradient-to-r from-[#3598FE] to-[#002147] bg-clip-text text-transparent">
                        {university.minimumGpa.toFixed(1)}
                      </div>
                    </div>
                  )}
                  {(isValidValue(university.gmatScoreMin) ||
                    isValidValue(university.gmatAverageScore)) && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 text-center hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300 min-w-[130px]">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-[#3598FE]" />
                      </div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                        GMAT
                      </div>
                      <div className="text-3xl font-black bg-gradient-to-r from-[#3598FE] to-[#002147] bg-clip-text text-transparent">
                        {isValidValue(university.gmatScoreMin) &&
                        isValidValue(university.gmatScoreMax)
                          ? `${university.gmatScoreMin}-${university.gmatScoreMax}`
                          : university.gmatAverageScore}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Information */}
            {hasFinancialInfo && (
              <div className="mb-10">
                <SectionHeader
                  icon={DollarSign}
                  title="Financial Information"
                />
                <div className="flex flex-wrap gap-4">
                  {isValidValue(university.tuitionFees) && (
                    <div className="relative bg-gradient-to-br from-[#002147] to-[#001a38] rounded-xl p-5 shadow-lg shadow-[#002147]/20 overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-[#3598FE]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-blue-300" />
                          <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">
                            Tuition Fee
                          </div>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {formatCurrency(
                            university.tuitionFees,
                            university.currency
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {isValidValue(university.scholarshipInfo) && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-100 rounded-xl p-5 max-w-sm hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-xs text-green-700 font-bold uppercase tracking-wider">
                          Scholarships
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {university.scholarshipInfo}
                      </p>
                    </div>
                  )}
                  {isValidValue(university.financialAidDetails) && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-xl p-5 max-w-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <Target className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                          Financial Aid
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {university.financialAidDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Why Choose Section */}
            <div className="mb-10">
              <div className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50/30 border border-gray-100 rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3598FE] via-[#002147] to-[#3598FE]"></div>
                <div className="bg-gradient-to-r from-[#002147] via-[#002147] to-[#003366] px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#3598FE]" />
                    <h3 className="text-lg font-bold text-white">
                      Why Choose {university.name}?
                    </h3>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="group text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                        <highlight.icon className="h-7 w-7 text-[#3598FE]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#002147] mb-2">
                        {highlight.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {hasContactInfo && (
              <div>
                <SectionHeader icon={Mail} title="Contact Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isValidValue(university.admissionsOfficeContact) && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Mail className="h-6 w-6 text-[#3598FE]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                            Admissions
                          </div>
                          {renderContactValue(
                            university.admissionsOfficeContact
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {isValidValue(university.internationalOfficeContact) && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Globe className="h-6 w-6 text-[#3598FE]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                            International
                          </div>
                          {renderContactValue(
                            university.internationalOfficeContact
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {isValidValue(university.generalInquiriesContact) && (
                    <div className="group bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#3598FE]/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3598FE]/10 to-[#002147]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Phone className="h-6 w-6 text-[#3598FE]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                            General
                          </div>
                          {renderContactValue(
                            university.generalInquiriesContact
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityOverview;
