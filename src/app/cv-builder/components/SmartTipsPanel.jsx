import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, TrendingUp, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Loader2, XCircle } from 'lucide-react';

/**
 * SmartTipsPanel - Sidebar panel showing intelligent tips and analysis for CV sections
 * @param {Object} props - Component props
 * @param {string} props.activeSection - Currently active CV section
 * @param {boolean} props.isVisible - Controls panel visibility
 * @param {Object} props.cvData - Complete CV data object
 * @param {Object} props.aiAnalysis - AI analysis results
 * @param {boolean} props.isAnalyzing - Whether AI analysis is in progress
 * @param {Function} props.onRequestAnalysis - Callback to trigger AI analysis
 * @returns {JSX.Element|null} Smart tips panel or null when hidden
 */
function SmartTipsPanel({ activeSection, isVisible, cvData, aiAnalysis, isAnalyzing, onRequestAnalysis }) {
  
  // State for expanded/collapsed tips
  const [expandedTips, setExpandedTips] = useState({});
  
  // Local tips generated from section data
  const [localTips, setLocalTips] = useState([]);
  
  // ATS (Applicant Tracking System) warnings
  const [atsWarnings, setAtsWarnings] = useState([]);

  /**
   * Effect to regenerate tips when dependencies change
   * Runs whenever activeSection, cvData, or aiAnalysis changes
   */
  useEffect(() => {
    generateSectionTips();
    generateATSWarnings();
  }, [activeSection, cvData, aiAnalysis]);

  /**
   * Generates tips for the current section based on data and AI analysis
   */
  const generateSectionTips = () => {
    const tips = [];

    // Check if section data exists
    if (!cvData || !cvData[activeSection]) {
      // Add empty section tip
      tips.push({
        id: 'empty',
        type: 'error',
        icon: AlertCircle,
        title: 'Section Empty',
        description: 'This section needs content. Add information to improve your CV score.',
        actionable: true,
        priority: 'high'
      });
      setLocalTips(tips);
      return;
    }

    const sectionData = cvData[activeSection];

    // Generate tips specific to each section type
    switch(activeSection) {
      case 'personal':
        generatePersonalTips(sectionData, tips);
        break;
      case 'experience':
        generateExperienceTips(sectionData, tips);
        break;
      case 'education':
        generateEducationTips(sectionData, tips);
        break;
      case 'projects':
        generateProjectsTips(sectionData, tips);
        break;
      case 'skills':
        generateSkillsTips(sectionData, tips);
        break;
      case 'achievements':
        generateAchievementsTips(sectionData, tips);
        break;
      case 'volunteer':
        generateVolunteerTips(sectionData, tips);
        break;
      default:
        // Generic tip for unknown sections
        tips.push({
          id: 'default',
          type: 'info',
          icon: Sparkles,
          title: 'AI Analysis Available',
          description: 'Use the AI Chat to get detailed analysis and improvement suggestions.',
          actionable: false
        });
    }

    // Add AI-generated tips if analysis exists
    if (aiAnalysis && aiAnalysis.sectionAnalyses && aiAnalysis.sectionAnalyses[activeSection]) {
      addAIBasedTips(aiAnalysis.sectionAnalyses[activeSection], tips);
    }

    setLocalTips(tips);
  };

  /**
   * Generates tips for the Personal Information section
   * @param {Object} data - Personal section data
   * @param {Array} tips - Array to add tips to
   */
  const generatePersonalTips = (data, tips) => {
    // Check for full name
    if (data.fullName) {
      tips.push({
        id: 'name-good',
        type: 'success',
        icon: CheckCircle,
        title: 'Name Added ✓',
        description: `Your full name "${data.fullName}" is displayed prominently.`,
        priority: 'low'
      });
    } else {
      tips.push({
        id: 'name-missing',
        type: 'error',
        icon: XCircle,
        title: 'Full Name Missing',
        description: 'Add your full name - it\'s essential for your CV.',
        actionable: true,
        priority: 'critical'
      });
    }

    // Check for professional summary
    if (!data.summary || data.summary.length < 50) {
      tips.push({
        id: 'summary-short',
        type: 'warning',
        icon: Lightbulb,
        title: 'Professional Summary Needed',
        description: 'Add a compelling 2-3 sentence summary (50-75 words) highlighting your key strengths and value proposition.',
        actionable: true,
        priority: 'high'
      });
    } else if (data.summary.length < 100) {
      tips.push({
        id: 'summary-expand',
        type: 'info',
        icon: Lightbulb,
        title: 'Expand Your Summary',
        description: `Your ${data.summary.length} character summary is short. Aim for 50-75 words to showcase key achievements.`,
        actionable: true,
        priority: 'medium'
      });
    } else {
      tips.push({
        id: 'summary-good',
        type: 'success',
        icon: CheckCircle,
        title: 'Summary Added ✓',
        description: `Your ${data.summary.length} character summary looks good. Ensure it highlights key achievements.`,
        priority: 'low'
      });
    }

    // Check for contact information
    if (!data.email || !data.phone) {
      tips.push({
        id: 'contact-incomplete',
        type: 'warning',
        icon: AlertCircle,
        title: 'Contact Information Incomplete',
        description: 'Add both email and phone number for recruiters to reach you easily.',
        actionable: true,
        priority: 'high'
      });
    }

    // Check for professional links
    if (!data.linkedin && !data.website) {
      tips.push({
        id: 'links-missing',
        type: 'info',
        icon: Lightbulb,
        title: 'Add Professional Links',
        description: 'Consider adding LinkedIn profile or personal website to strengthen your online presence.',
        actionable: true,
        priority: 'medium'
      });
    }
  };

  /**
   * Generates tips for the Experience section
   * @param {Object} data - Experience section data
   * @param {Array} tips - Array to add tips to
   */
  const generateExperienceTips = (data, tips) => {
    const exp = Array.isArray(data) ? data : [data];
    
    // Check if experience exists
    if (exp.length === 0 || !exp[0].company) {
      tips.push({
        id: 'exp-empty',
        type: 'error',
        icon: XCircle,
        title: 'No Experience Added',
        description: 'Add your work experience to strengthen your CV. Include role, company, dates, and achievements.',
        actionable: true,
        priority: 'critical'
      });
      return;
    }

    // Count of positions
    tips.push({
      id: 'exp-count',
      type: 'success',
      icon: CheckCircle,
      title: `${exp.length} Position(s) Added ✓`,
      description: 'Use action verbs like "Led", "Developed", "Implemented" in your descriptions.',
      priority: 'low'
    });

    // Analyze each experience entry
    exp.forEach((e, idx) => {
      // Check for description
      if (!e.description || e.description.length < 50) {
        tips.push({
          id: `desc-missing-${idx}`,
          type: 'warning',
          icon: AlertCircle,
          title: `${e.position || 'Position'} Needs Description`,
          description: 'Add 3-5 bullet points describing achievements and responsibilities with quantifiable results.',
          actionable: true,
          priority: 'high'
        });
      } else if (e.description.includes('•')) {
        // Check bullet point count
        const bulletCount = (e.description.match(/•/g) || []).length;
        if (bulletCount < 3) {
          tips.push({
            id: `bullets-few-${idx}`,
            type: 'info',
            icon: Lightbulb,
            title: `Add More Achievements`,
            description: `${e.position} has ${bulletCount} point(s). Add 2-3 more to showcase full impact.`,
            actionable: true,
            priority: 'medium'
          });
        } else {
          tips.push({
            id: `bullets-good-${idx}`,
            type: 'success',
            icon: CheckCircle,
            title: 'Well Structured ✓',
            description: `${e.position} role has ${bulletCount} bullet points - excellent!`,
            priority: 'low'
          });
        }
      } else {
        // Suggest using bullet points
        tips.push({
          id: `bullets-needed-${idx}`,
          type: 'warning',
          icon: Lightbulb,
          title: 'Use Bullet Points',
          description: `Format ${e.position} description with bullet points (•) for better readability.`,
          actionable: true,
          priority: 'medium'
        });
      }

      // Check for quantifiable achievements (numbers)
      const hasNumbers = /\d+/.test(e.description);
      if (!hasNumbers && e.description) {
        tips.push({
          id: `quantify-${idx}`,
          type: 'info',
          icon: TrendingUp,
          title: 'Quantify Achievements',
          description: `Add metrics to ${e.position}: numbers, percentages, team size, budget, etc.`,
          actionable: true,
          priority: 'medium'
        });
      }
    });
  };

  /**
   * Generates tips for the Education section
   * @param {Object} data - Education section data
   * @param {Array} tips - Array to add tips to
   */
  const generateEducationTips = (data, tips) => {
    const edu = Array.isArray(data) ? data : [data];
    
    // Check if education exists
    if (edu.length === 0 || !edu[0].institution) {
      tips.push({
        id: 'edu-empty',
        type: 'error',
        icon: XCircle,
        title: 'No Education Added',
        description: 'Add your educational background, including degree, field, institution, and dates.',
        actionable: true,
        priority: 'critical'
      });
      return;
    }

    // Count of education entries
    tips.push({
      id: 'edu-count',
      type: 'success',
      icon: CheckCircle,
      title: `${edu.length} Degree(s) Listed ✓`,
      description: 'Educational background looks complete.',
      priority: 'low'
    });

    // Analyze each education entry
    edu.forEach((e, idx) => {
      // Check GPA
      if (e.gpa && parseFloat(e.gpa) >= 3.5) {
        tips.push({
          id: `gpa-good-${idx}`,
          type: 'success',
          icon: CheckCircle,
          title: 'Strong GPA Listed ✓',
          description: `GPA ${e.gpa} is excellent and strengthens your profile.`,
          priority: 'low'
        });
      } else if (!e.gpa) {
        tips.push({
          id: `gpa-missing-${idx}`,
          type: 'info',
          icon: Lightbulb,
          title: 'Consider Adding GPA',
          description: 'If your GPA is 3.5 or higher, consider adding it to boost your profile.',
          actionable: true,
          priority: 'low'
        });
      }

      // Check for additional details
      if (!e.description || e.description.length < 20) {
        tips.push({
          id: `edu-details-${idx}`,
          type: 'info',
          icon: Lightbulb,
          title: 'Add Education Details',
          description: `Include relevant coursework, honors, or projects for ${e.degree}.`,
          actionable: true,
          priority: 'medium'
        });
      }
    });
  };

  /**
   * Generates tips for the Projects section
   * @param {Object} data - Projects section data
   * @param {Array} tips - Array to add tips to
   */
  const generateProjectsTips = (data, tips) => {
    const proj = Array.isArray(data) ? data : [data];
    
    // Check if projects exist (optional section)
    if (proj.length === 0 || !proj[0].name) {
      tips.push({
        id: 'proj-empty',
        type: 'info',
        icon: Lightbulb,
        title: 'Add Projects',
        description: 'Optional but powerful: Showcase portfolio projects with technologies, descriptions, and links.',
        actionable: true,
        priority: 'medium'
      });
      return;
    }

    // Count of projects
    tips.push({
      id: 'proj-count',
      type: 'success',
      icon: CheckCircle,
      title: `${proj.length} Project(s) Added ✓`,
      description: 'Projects demonstrate hands-on experience. Great for technical roles!',
      priority: 'low'
    });

    // Analyze each project
    proj.forEach((p, idx) => {
      // Check for project links
      if (!p.githubUrl && !p.liveUrl) {
        tips.push({
          id: `links-${idx}`,
          type: 'warning',
          icon: AlertCircle,
          title: 'Add Project Links',
          description: `Include GitHub or live URL for "${p.name || 'Project'}" to let recruiters see your work.`,
          actionable: true,
          priority: 'medium'
        });
      }

      // Check for technologies list
      if (!p.technologies || p.technologies.length < 10) {
        tips.push({
          id: `tech-${idx}`,
          type: 'info',
          icon: Lightbulb,
          title: 'List Technologies',
          description: `Add technologies used in "${p.name || 'Project'}" (languages, frameworks, tools).`,
          actionable: true,
          priority: 'medium'
        });
      }
    });
  };

  /**
   * Generates tips for the Skills section
   * @param {Object} data - Skills section data
   * @param {Array} tips - Array to add tips to
   */
  const generateSkillsTips = (data, tips) => {
    const skills = Array.isArray(data) ? data : [data];
    const totalSkills = skills.reduce((sum, group) => sum + (group.skills?.length || 0), 0);
    
    // Check if skills exist
    if (totalSkills === 0) {
      tips.push({
        id: 'skills-empty',
        type: 'error',
        icon: XCircle,
        title: 'No Skills Listed',
        description: 'Add your technical and professional skills. Organize them into categories like Programming, Languages, Tools, etc.',
        actionable: true,
        priority: 'critical'
      });
      return;
    }

    // Count of skills
    tips.push({
      id: 'skills-count',
      type: 'success',
      icon: CheckCircle,
      title: `${totalSkills} Skills Listed ✓`,
      description: 'Organize skills by category for better clarity and ATS optimization.',
      priority: 'low'
    });

    // Check if enough skills are listed
    if (totalSkills < 10) {
      tips.push({
        id: 'skills-few',
        type: 'info',
        icon: Lightbulb,
        title: 'Add More Skills',
        description: `You have ${totalSkills} skills. Aim for 15-20 relevant skills across different categories.`,
        actionable: true,
        priority: 'medium'
      });
    }

    // ATS optimization tip
    tips.push({
      id: 'skills-ats',
      type: 'info',
      icon: Sparkles,
      title: 'ATS Optimization Tip',
      description: 'Use industry-standard terminology. Include both acronyms and full names (e.g., "JavaScript (JS)").',
      actionable: true,
      priority: 'medium'
    });
  };

  /**
   * Generates tips for the Achievements section
   * @param {Object} data - Achievements section data
   * @param {Array} tips - Array to add tips to
   */
  const generateAchievementsTips = (data, tips) => {
    const ach = Array.isArray(data) ? data : [data];
    
    // Check if achievements exist (optional section)
    if (ach.length === 0 || !ach[0].title) {
      tips.push({
        id: 'ach-empty',
        type: 'info',
        icon: Lightbulb,
        title: 'Showcase Achievements',
        description: 'Optional but impactful: Add awards, certifications, publications, or recognition.',
        actionable: true,
        priority: 'low'
      });
      return;
    }

    // Count of achievements
    tips.push({
      id: 'ach-count',
      type: 'success',
      icon: CheckCircle,
      title: `${ach.length} Achievement(s) Listed ✓`,
      description: 'Great way to highlight recognition and accomplishments!',
      priority: 'low'
    });
  };

  /**
   * Generates tips for the Volunteer section
   * @param {Object} data - Volunteer section data
   * @param {Array} tips - Array to add tips to
   */
  const generateVolunteerTips = (data, tips) => {
    const vol = Array.isArray(data) ? data : [data];
    
    // Check if volunteer experience exists (optional section)
    if (vol.length === 0 || !vol[0].organization) {
      tips.push({
        id: 'vol-empty',
        type: 'info',
        icon: Lightbulb,
        title: 'Add Volunteer Experience',
        description: 'Optional: Volunteer work demonstrates leadership and community engagement.',
        actionable: true,
        priority: 'low'
      });
      return;
    }

    // Count of volunteer entries
    tips.push({
      id: 'vol-count',
      type: 'success',
      icon: CheckCircle,
      title: `${vol.length} Volunteer Entry Added ✓`,
      description: 'Volunteer experience adds depth to your profile!',
      priority: 'low'
    });
  };

  /**
   * Adds AI-generated tips to the tips array
   * @param {Object} analysis - AI analysis for the section
   * @param {Array} tips - Array to add AI tips to
   */
  const addAIBasedTips = (analysis, tips) => {
    if (!analysis) return;

    // Add critical AI tip at the top based on score
    if (analysis.score < 50) {
      tips.unshift({
        id: 'ai-critical',
        type: 'error',
        icon: XCircle,
        title: '⚠️ AI: Low Section Score',
        description: `Score: ${analysis.score}/100. ${analysis.feedback}`,
        actionable: true,
        priority: 'critical',
        isAIGenerated: true
      });
    } else if (analysis.score < 75) {
      tips.unshift({
        id: 'ai-improvement',
        type: 'warning',
        icon: Lightbulb,
        title: '💡 AI: Room for Improvement',
        description: `Score: ${analysis.score}/100. ${analysis.improvements[0] || 'Consider the AI suggestions.'}`,
        actionable: true,
        priority: 'high',
        isAIGenerated: true
      });
    } else {
      tips.unshift({
        id: 'ai-good',
        type: 'success',
        icon: CheckCircle,
        title: '✓ AI: Section Looking Good',
        description: `Score: ${analysis.score}/100. ${analysis.feedback}`,
        priority: 'low',
        isAIGenerated: true
      });
    }

    // Add top improvement suggestion if available
    if (analysis.improvements && analysis.improvements.length > 0) {
      tips.splice(1, 0, {
        id: 'ai-top-improvement',
        type: 'info',
        icon: TrendingUp,
        title: '🎯 AI Top Priority',
        description: analysis.improvements[0],
        actionable: true,
        priority: 'high',
        isAIGenerated: true
      });
    }
  };

  /**
   * Generates ATS (Applicant Tracking System) warnings based on AI analysis
   */
  const generateATSWarnings = () => {
    const warnings = [];

    if (aiAnalysis && aiAnalysis.atsScore) {
      // Determine ATS score level and add appropriate warning
      if (aiAnalysis.atsScore < 50) {
        warnings.push({
          id: 'ats-critical',
          type: 'error',
          title: 'Critical ATS Issues',
          description: `ATS Score: ${aiAnalysis.atsScore}/100. Your CV may not pass automated screening.`,
          priority: 'critical'
        });
      } else if (aiAnalysis.atsScore < 70) {
        warnings.push({
          id: 'ats-warning',
          type: 'warning',
          title: 'ATS Needs Improvement',
          description: `ATS Score: ${aiAnalysis.atsScore}/100. Optimize keywords and formatting.`,
          priority: 'high'
        });
      } else if (aiAnalysis.atsScore < 85) {
        warnings.push({
          id: 'ats-good',
          type: 'info',
          title: 'ATS Score Good',
          description: `ATS Score: ${aiAnalysis.atsScore}/100. Minor optimizations can help.`,
          priority: 'medium'
        });
      } else {
        warnings.push({
          id: 'ats-excellent',
          type: 'success',
          title: 'ATS Optimized ✓',
          description: `ATS Score: ${aiAnalysis.atsScore}/100. Well-optimized for automated systems.`,
          priority: 'low'
        });
      }
    }

    setAtsWarnings(warnings);
  };

  /**
   * Toggles expanded state of a tip
   * @param {string} id - Tip ID to toggle
   */
  const toggleTip = (id) => {
    setExpandedTips(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Return null if panel is not visible
  if (!isVisible) return null;

  // Sort tips by priority (critical, high, medium, low)
  const sortedTips = [...localTips].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  return (
    /* Sidebar panel container */
    <div className="w-80 border-l border-gray-200 bg-gradient-to-b from-blue-50 via-indigo-50 to-white p-4 overflow-y-auto">
      <div className="space-y-4">
        
        {/* Panel header */}
        <div className="sticky top-0 bg-gradient-to-b from-blue-50 via-indigo-50 to-white pb-3 -m-4 p-4 z-10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800">Smart Tips</h3>
          </div>
          <p className="text-xs text-gray-600">Suggestions for {activeSection}</p>
        </div>

        {/* ATS warnings section */}
        {atsWarnings.length > 0 && (
          <div className="space-y-2">
            {atsWarnings.map(warning => {
              // Define styling based on warning type
              const bgColors = {
                error: 'bg-red-100 border-red-300',
                warning: 'bg-amber-100 border-amber-300',
                info: 'bg-blue-100 border-blue-300',
                success: 'bg-green-100 border-green-300'
              };

              return (
                <div
                  key={warning.id}
                  className={`p-3 rounded-lg border-2 ${bgColors[warning.type]}`}
                >
                  <div className="font-semibold text-sm text-gray-800 mb-1">{warning.title}</div>
                  <p className="text-xs text-gray-700">{warning.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* AI analysis trigger button */}
        {!aiAnalysis && (
          <button
            onClick={onRequestAnalysis}
            disabled={isAnalyzing}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Run AI Analysis
              </>
            )}
          </button>
        )}

        {/* Tips list section */}
        <div className="space-y-2">
          {sortedTips.length === 0 ? (
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">No specific tips at the moment.</p>
            </div>
          ) : (
            sortedTips.map(tip => {
              const Icon = tip.icon;
              
              // Define styling based on tip type
              const bgColors = {
                error: 'bg-red-50',
                warning: 'bg-amber-50',
                success: 'bg-green-50',
                info: 'bg-blue-50'
              };
              
              const borderColors = {
                error: 'border-red-200',
                warning: 'border-amber-200',
                success: 'border-green-200',
                info: 'border-blue-200'
              };
              
              const iconColors = {
                error: 'text-red-600',
                warning: 'text-amber-600',
                success: 'text-green-600',
                info: 'text-blue-600'
              };

              return (
                <button
                  key={tip.id}
                  onClick={() => toggleTip(tip.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition hover:shadow-md ${bgColors[tip.type]} ${borderColors[tip.type]} ${
                    tip.isAIGenerated ? 'ring-2 ring-purple-300' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[tip.type]}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                        {tip.title}
                        {tip.isAIGenerated && (
                          <Sparkles className="w-3 h-3 text-purple-600" />
                        )}
                      </div>
                      
                      {/* Expanded tip content */}
                      {expandedTips[tip.id] && (
                        <p className="text-xs text-gray-700 mt-1">{tip.description}</p>
                      )}
                      
                      {/* Collapsed tip preview */}
                      {!expandedTips[tip.id] && tip.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{tip.description}</p>
                      )}
                    </div>
                    
                    {/* Expand/collapse chevron */}
                    {expandedTips[tip.id] ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Overall CV score display */}
        {aiAnalysis && aiAnalysis.overallAnalysis && (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-sm text-blue-900">Overall CV Score</p>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between items-center">
                <span>CV Score:</span>
                <span className={`font-bold text-lg ${
                  aiAnalysis.overallAnalysis.overallScore >= 80 ? 'text-green-600' :
                  aiAnalysis.overallAnalysis.overallScore >= 60 ? 'text-blue-600' :
                  'text-amber-600'
                }`}>{aiAnalysis.overallAnalysis.overallScore}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ATS Score:</span>
                <span className={`font-bold ${
                  aiAnalysis.atsScore >= 80 ? 'text-green-600' :
                  aiAnalysis.atsScore >= 60 ? 'text-blue-600' :
                  'text-red-600'
                }`}>{aiAnalysis.atsScore}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* Section-specific AI analysis */}
        {aiAnalysis && aiAnalysis.sectionAnalyses && aiAnalysis.sectionAnalyses[activeSection] && (
          <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <p className="font-semibold text-sm text-purple-900">AI Analysis</p>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between items-center">
                <span>Section Score:</span>
                <span className={`font-bold ${
                  aiAnalysis.sectionAnalyses[activeSection].score >= 75 ? 'text-green-600' :
                  aiAnalysis.sectionAnalyses[activeSection].score >= 50 ? 'text-blue-600' :
                  'text-red-600'
                }`}>{aiAnalysis.sectionAnalyses[activeSection].score}/100</span>
              </div>
              <div>
                <p className="font-medium mb-1">Status: {aiAnalysis.sectionAnalyses[activeSection].status}</p>
                <p className="text-gray-600">{aiAnalysis.sectionAnalyses[activeSection].feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI-identified strengths */}
        {aiAnalysis && aiAnalysis.sectionAnalyses && aiAnalysis.sectionAnalyses[activeSection]?.strengths?.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="font-semibold text-sm text-green-900">Strengths</p>
            </div>
            <ul className="space-y-1 text-xs text-gray-700">
              {aiAnalysis.sectionAnalyses[activeSection].strengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI-identified improvements */}
        {aiAnalysis && aiAnalysis.sectionAnalyses && aiAnalysis.sectionAnalyses[activeSection]?.improvements?.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="font-semibold text-sm text-amber-900">Improvements</p>
            </div>
            <ul className="space-y-1 text-xs text-gray-700">
              {aiAnalysis.sectionAnalyses[activeSection].improvements.slice(0, 3).map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Critical issues warning */}
        {aiAnalysis && aiAnalysis.overallAnalysis?.criticalIssues?.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border-2 border-red-300">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="font-semibold text-sm text-red-900">Critical Issues</p>
            </div>
            <ul className="space-y-1 text-xs text-gray-700">
              {aiAnalysis.overallAnalysis.criticalIssues.slice(0, 3).map((issue, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartTipsPanel;