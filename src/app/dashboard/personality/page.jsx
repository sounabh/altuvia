"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

// =============================================================================
// COMPREHENSIVE PERSONALITY TEST DATA - 60+ QUESTIONS
// =============================================================================

const personalityModules = [
  {
    id: "leadership",
    title: "Leadership & Initiative",
    icon: "👨‍💼",
    color: "from-blue-500 to-indigo-600",
    emoji: "🎯",
    questions: [
      {
        id: "lead_1",
        text: "I enjoy taking the lead in group projects or discussions",
        type: "scale",
        trait: "leadership_orientation"
      },
      {
        id: "lead_2",
        text: "I am comfortable making decisions even with incomplete information",
        type: "scale",
        trait: "decision_making_style"
      },
      {
        id: "lead_3",
        text: "I often take initiative without waiting for instructions",
        type: "scale",
        trait: "proactiveness"
      },
      {
        id: "lead_4",
        text: "I feel comfortable delegating tasks to team members",
        type: "scale",
        trait: "delegation_comfort"
      },
      {
        id: "lead_5",
        text: "I naturally emerge as a leader in unstructured situations",
        type: "scale",
        trait: "natural_leadership"
      }
    ]
  },
  {
    id: "teamwork",
    title: "Teamwork & Collaboration",
    icon: "🤝",
    color: "from-emerald-500 to-teal-600",
    emoji: "👥",
    questions: [
      {
        id: "team_1",
        text: "I work best in collaborative team environments",
        type: "scale",
        trait: "collaborative_style"
      },
      {
        id: "team_2",
        text: "I enjoy mentoring or guiding others",
        type: "scale",
        trait: "mentoring_orientation"
      },
      {
        id: "team_3",
        text: "I feel energized by group discussions and debates",
        type: "scale",
        trait: "extraversion"
      },
      {
        id: "team_4",
        text: "I prefer working independently rather than in teams",
        type: "scale",
        trait: "independence_preference"
      },
      {
        id: "team_5",
        text: "I actively seek diverse perspectives when solving problems",
        type: "scale",
        trait: "diversity_seeking"
      }
    ]
  },
  {
    id: "communication",
    title: "Communication & Expression",
    icon: "💬",
    color: "from-pink-500 to-rose-600",
    emoji: "🗣️",
    questions: [
      {
        id: "comm_1",
        text: "I am confident speaking in front of large groups",
        type: "scale",
        trait: "public_speaking_comfort"
      },
      {
        id: "comm_2",
        text: "I prefer structured conversations over open-ended ones",
        type: "scale",
        trait: "communication_structure_preference"
      },
      {
        id: "comm_3",
        text: "I enjoy classroom debates and speaking frequently",
        type: "scale",
        trait: "debate_participation"
      },
      {
        id: "comm_4",
        text: "I express my ideas better in writing than speaking",
        type: "scale",
        trait: "written_vs_verbal"
      },
      {
        id: "comm_5",
        text: "I gain energy from networking and meeting new people",
        type: "scale",
        trait: "networking_energy"
      }
    ]
  },
  {
    id: "analytical",
    title: "Analytical & Problem-Solving",
    icon: "🧮",
    color: "from-purple-500 to-violet-600",
    emoji: "📊",
    questions: [
      {
        id: "anal_1",
        text: "I enjoy working with data, numbers, and analytical models",
        type: "scale",
        trait: "data_orientation"
      },
      {
        id: "anal_2",
        text: "I prefer decisions backed by data rather than intuition",
        type: "scale",
        trait: "analytical_approach"
      },
      {
        id: "anal_3",
        text: "I am comfortable dealing with ambiguity and uncertain environments",
        type: "scale",
        trait: "ambiguity_tolerance"
      },
      {
        id: "anal_4",
        text: "I enjoy breaking down complex problems into smaller components",
        type: "scale",
        trait: "systematic_thinking"
      },
      {
        id: "anal_5",
        text: "I rely more on logic than emotions when making decisions",
        type: "scale",
        trait: "logic_vs_emotion"
      }
    ]
  },
  {
    id: "innovation",
    title: "Creativity & Innovation",
    icon: "🚀",
    color: "from-orange-500 to-amber-600",
    emoji: "💡",
    questions: [
      {
        id: "innov_1",
        text: "I like experimenting with new ideas even if there's a chance of failure",
        type: "scale",
        trait: "risk_tolerance"
      },
      {
        id: "innov_2",
        text: "I often come up with creative solutions to problems",
        type: "scale",
        trait: "creativity"
      },
      {
        id: "innov_3",
        text: "I enjoy solving open-ended, undefined problems",
        type: "scale",
        trait: "open_problem_solving"
      },
      {
        id: "innov_4",
        text: "I prefer proven methods over experimental approaches",
        type: "scale",
        trait: "traditional_vs_experimental"
      },
      {
        id: "innov_5",
        text: "I get bored with routine tasks and prefer variety",
        type: "scale",
        trait: "variety_seeking"
      }
    ]
  },
  {
    id: "work_style",
    title: "Work Style & Environment",
    icon: "💼",
    color: "from-cyan-500 to-blue-600",
    emoji: "⚡",
    questions: [
      {
        id: "work_1",
        text: "I thrive in fast-paced, high-pressure situations",
        type: "scale",
        trait: "pressure_performance"
      },
      {
        id: "work_2",
        text: "I prefer a structured, predictable routine",
        type: "scale",
        trait: "structure_preference"
      },
      {
        id: "work_3",
        text: "I enjoy multitasking across multiple projects",
        type: "scale",
        trait: "multitasking_ability"
      },
      {
        id: "work_4",
        text: "I work more productively in the early morning hours",
        type: "scale",
        trait: "time_productivity"
      },
      {
        id: "work_5",
        text: "I need frequent breaks to maintain focus",
        type: "scale",
        trait: "work_intensity"
      }
    ]
  },
  {
    id: "learning_style",
    title: "Learning Style & Preferences",
    icon: "📚",
    color: "from-indigo-500 to-blue-600",
    emoji: "🎓",
    questions: [
      {
        id: "learn_pref",
        text: "What type of learning suits you best?",
        type: "mcq",
        trait: "learning_preference",
        options: [
          { value: "case_method", label: "Case method (Harvard style)", emoji: "📖" },
          { value: "quantitative", label: "Quantitative / analytical", emoji: "🔢" },
          { value: "lecture_discussion", label: "Lecture + discussion mix", emoji: "👨‍🏫" },
          { value: "experiential", label: "Experiential / project-based", emoji: "🛠️" },
          { value: "no_preference", label: "No strong preference", emoji: "🤷" }
        ]
      },
      {
        id: "learn_1",
        text: "I like being challenged intellectually in a competitive environment",
        type: "scale",
        trait: "competitive_learning"
      },
      {
        id: "learn_2",
        text: "I prefer flexible curriculums where I can choose most courses",
        type: "scale",
        trait: "curriculum_flexibility"
      },
      {
        id: "learn_3",
        text: "I prefer smaller classes with more personalized attention",
        type: "scale",
        trait: "class_size_preference"
      },
      {
        id: "learn_4",
        text: "I value peer learning more than faculty-led learning",
        type: "scale",
        trait: "peer_learning_value"
      }
    ]
  },
  {
    id: "culture_values",
    title: "Culture & Values",
    icon: "🌟",
    color: "from-rose-500 to-pink-600",
    emoji: "💫",
    questions: [
      {
        id: "culture_env",
        text: "Which environment do you prefer?",
        type: "mcq",
        trait: "culture_preference",
        options: [
          { value: "highly_collaborative", label: "Highly collaborative", emoji: "🤝" },
          { value: "competitive", label: "Competitive & performance-driven", emoji: "🏆" },
          { value: "balanced", label: "Balanced", emoji: "⚖️" },
          { value: "no_preference", label: "No strong preference", emoji: "🤷" }
        ]
      },
      {
        id: "culture_1",
        text: "Diversity and global exposure are important to me",
        type: "scale",
        trait: "diversity_importance"
      },
      {
        id: "culture_2",
        text: "I prefer a school with strong alumni involvement",
        type: "scale",
        trait: "alumni_network_value"
      },
      {
        id: "culture_3",
        text: "Social responsibility and impact are core to my values",
        type: "scale",
        trait: "social_impact_orientation"
      },
      {
        id: "culture_4",
        text: "I prefer schools with entrepreneurial culture",
        type: "scale",
        trait: "entrepreneurial_culture"
      }
    ]
  },
  {
    id: "career_goals",
    title: "Career Goals & Aspirations",
    icon: "🎯",
    color: "from-violet-500 to-purple-600",
    emoji: "🚀",
    questions: [
      {
        id: "career_goal",
        text: "What is your target career goal after MBA?",
        type: "mcq",
        trait: "career_target",
        options: [
          { value: "consulting", label: "Consulting", emoji: "💼" },
          { value: "finance", label: "Finance (IB, PE, VC)", emoji: "💰" },
          { value: "tech", label: "Tech (PM, Strategy)", emoji: "💻" },
          { value: "entrepreneurship", label: "Entrepreneurship", emoji: "🚀" },
          { value: "marketing", label: "Marketing / Brand Management", emoji: "📢" },
          { value: "operations", label: "Operations / Supply Chain", emoji: "⚙️" },
          { value: "general_management", label: "General Management", emoji: "👔" },
          { value: "social_impact", label: "Social Impact / Non-profit", emoji: "🌍" },
          { value: "undecided", label: "Still exploring", emoji: "🤔" }
        ]
      },
      {
        id: "career_priority",
        text: "What do you value most in your future career?",
        type: "mcq",
        trait: "career_priority",
        options: [
          { value: "high_salary", label: "High salary", emoji: "💰" },
          { value: "work_life_balance", label: "Work-life balance", emoji: "⚖️" },
          { value: "prestige", label: "Prestige & brand value", emoji: "🏆" },
          { value: "fast_growth", label: "Fast growth & leadership", emoji: "📈" },
          { value: "impact", label: "Creating impact / social good", emoji: "🌍" },
          { value: "entrepreneurship", label: "Building my own venture", emoji: "🚀" }
        ]
      },
      {
        id: "motivation",
        text: "What motivates you most professionally?",
        type: "mcq",
        trait: "professional_motivation",
        options: [
          { value: "recognition", label: "Recognition & status", emoji: "🏅" },
          { value: "learning", label: "Learning new skills", emoji: "📚" },
          { value: "impact", label: "Making an impact", emoji: "💫" },
          { value: "building", label: "Building something new", emoji: "🏗️" },
          { value: "security", label: "Job security & stability", emoji: "🛡️" },
          { value: "leading", label: "Leading people & teams", emoji: "👑" }
        ]
      },
      {
        id: "longterm_vision",
        text: "What is your long-term career vision?",
        type: "mcq",
        trait: "longterm_vision",
        options: [
          { value: "senior_management", label: "Senior management / C-suite", emoji: "👔" },
          { value: "startup_founder", label: "Startup founder", emoji: "🚀" },
          { value: "specialist_expert", label: "Specialist expert in my field", emoji: "🎯" },
          { value: "social_leader", label: "Social impact leadership", emoji: "🌍" },
          { value: "portfolio_career", label: "Portfolio career (multiple ventures)", emoji: "📊" },
          { value: "exploring", label: "Still exploring options", emoji: "🤔" }
        ]
      },
      {
        id: "career_1",
        text: "Strong recruiter presence in my target industry is critical",
        type: "scale",
        trait: "recruiter_importance"
      },
      {
        id: "career_2",
        text: "International job opportunities are important to me",
        type: "scale",
        trait: "international_opportunities"
      }
    ]
  },
  {
    id: "school_preferences",
    title: "School Environment & Preferences",
    icon: "🏫",
    color: "from-teal-500 to-emerald-600",
    emoji: "🎓",
    questions: [
      {
        id: "class_size",
        text: "Ideal MBA class size:",
        type: "mcq",
        trait: "class_size_preference",
        options: [
          { value: "small", label: "Small (<150 students)", emoji: "👥" },
          { value: "medium", label: "Medium (150-300 students)", emoji: "👨‍👩‍👧‍👦" },
          { value: "large", label: "Large (300+ students)", emoji: "🏟️" },
          { value: "no_preference", label: "No preference", emoji: "🤷" }
        ]
      },
      {
        id: "teaching_style",
        text: "Preferred teaching style:",
        type: "mcq",
        trait: "teaching_style_preference",
        options: [
          { value: "industry_focused", label: "Professors with industry background", emoji: "💼" },
          { value: "research_focused", label: "Research-focused professors", emoji: "📚" },
          { value: "balanced", label: "Mix of both", emoji: "⚖️" },
          { value: "no_preference", label: "No preference", emoji: "🤷" }
        ]
      },
      {
        id: "school_1",
        text: "Networking opportunities are extremely important to me",
        type: "scale",
        trait: "networking_importance"
      },
      {
        id: "school_2",
        text: "Brand and ranking of the school matter a lot to me",
        type: "scale",
        trait: "ranking_importance"
      },
      {
        id: "school_3",
        text: "I prefer schools with strong entrepreneurship programs",
        type: "scale",
        trait: "entrepreneurship_program_value"
      },
      {
        id: "school_4",
        text: "Scholarship availability is a major factor in my decision",
        type: "scale",
        trait: "scholarship_importance"
      }
    ]
  },
  {
    id: "location_lifestyle",
    title: "Location & Lifestyle",
    icon: "🌍",
    color: "from-amber-500 to-orange-600",
    emoji: "📍",
    questions: [
      {
        id: "location_type",
        text: "Which type of environment do you prefer?",
        type: "mcq",
        trait: "location_preference",
        options: [
          { value: "big_city", label: "Big City (NYC, Chicago, LA)", emoji: "🏙️" },
          { value: "suburban", label: "Suburban area", emoji: "🏘️" },
          { value: "college_town", label: "College-town environment", emoji: "🏫" },
          { value: "no_preference", label: "No strong preference", emoji: "🤷" }
        ]
      },
      {
        id: "region_pref",
        text: "Preferred U.S. region(s):",
        type: "mcq",
        trait: "region_preference",
        options: [
          { value: "east_coast", label: "East Coast", emoji: "🗽" },
          { value: "west_coast", label: "West Coast", emoji: "🌊" },
          { value: "midwest", label: "Midwest", emoji: "🌾" },
          { value: "south", label: "South", emoji: "🌴" },
          { value: "no_preference", label: "No preference / Open to all", emoji: "🌍" }
        ]
      },
      {
        id: "campus_vibe",
        text: "Preferred campus vibe:",
        type: "mcq",
        trait: "campus_vibe",
        options: [
          { value: "quiet_academic", label: "Quiet, academic-focused", emoji: "📚" },
          { value: "social_vibrant", label: "Social & vibrant", emoji: "🎉" },
          { value: "professional", label: "Professional & career-focused", emoji: "💼" },
          { value: "balanced", label: "Balanced", emoji: "⚖️" }
        ]
      },
      {
        id: "location_1",
        text: "I am comfortable living in cold climates",
        type: "scale",
        trait: "cold_climate_tolerance"
      },
      {
        id: "location_2",
        text: "Proximity to major business hubs is important",
        type: "scale",
        trait: "business_hub_proximity"
      },
      {
        id: "location_3",
        text: "I prefer large campuses over compact urban campuses",
        type: "scale",
        trait: "campus_size_preference"
      }
    ]
  },
  {
    id: "scenarios",
    title: "Real-World Scenarios",
    icon: "🎬",
    color: "from-fuchsia-500 to-purple-600",
    emoji: "🎭",
    questions: [
      {
        id: "scenario_1",
        text: "When working on a team project, what role do you naturally take?",
        type: "mcq",
        trait: "team_role",
        options: [
          { value: "coordinator", label: "Coordinator / Leader", emoji: "👨‍💼" },
          { value: "analyst", label: "Analyst / Problem solver", emoji: "🔍" },
          { value: "creative", label: "Creative idea generator", emoji: "💡" },
          { value: "executor", label: "Executor / Implementer", emoji: "⚡" },
          { value: "collaborator", label: "Supportive collaborator", emoji: "🤝" }
        ]
      },
      {
        id: "scenario_2",
        text: "You are given an ambiguous business problem. What do you do first?",
        type: "mcq",
        trait: "problem_approach",
        options: [
          { value: "data", label: "Gather more data & research", emoji: "📊" },
          { value: "brainstorm", label: "Brainstorm multiple ideas", emoji: "🧠" },
          { value: "delegate", label: "Delegate tasks to team", emoji: "👥" },
          { value: "plan", label: "Create a structured plan", emoji: "📋" },
          { value: "discuss", label: "Discuss with peers/mentors", emoji: "💬" }
        ]
      },
      {
        id: "scenario_3",
        text: "Your schedule becomes fully packed. How do you feel?",
        type: "mcq",
        trait: "workload_response",
        options: [
          { value: "excited", label: "Excited & energized", emoji: "🚀" },
          { value: "motivated", label: "Motivated to perform", emoji: "💪" },
          { value: "neutral", label: "Neutral / Expected", emoji: "😐" },
          { value: "stressed_manageable", label: "Stressed but manageable", emoji: "😅" },
          { value: "overwhelmed", label: "Overwhelmed", emoji: "😰" }
        ]
      },
      {
        id: "scenario_4",
        text: "Your preferred networking style:",
        type: "mcq",
        trait: "networking_style",
        options: [
          { value: "large_events", label: "Attend large events & conferences", emoji: "🎉" },
          { value: "small_groups", label: "Small-group dinners", emoji: "🍽️" },
          { value: "one_on_one", label: "One-on-one coffee meetings", emoji: "☕" },
          { value: "online", label: "Online connections (LinkedIn)", emoji: "💻" },
          { value: "not_big", label: "Not big on networking", emoji: "🏠" }
        ]
      },
      {
        id: "scenario_5",
        text: "You receive critical feedback on your work. How do you typically respond?",
        type: "mcq",
        trait: "feedback_response",
        options: [
          { value: "eager_improve", label: "Eager to improve immediately", emoji: "📈" },
          { value: "defensive_first", label: "Defensive at first, then reflective", emoji: "🤔" },
          { value: "seek_clarification", label: "Seek clarification & examples", emoji: "❓" },
          { value: "ignore_move_on", label: "Process internally, move forward", emoji: "🚶" },
          { value: "demotivated", label: "Feel demotivated", emoji: "😔" }
        ]
      }
    ]
  },
  {
    id: "priorities",
    title: "School Selection Priorities",
    icon: "⭐",
    color: "from-yellow-500 to-orange-600",
    emoji: "🎯",
    questions: [
      {
        id: "priority_1",
        text: "Rank: Academic Rigor",
        type: "rank",
        trait: "academic_rigor_priority",
        info: "How important is academic rigor? (1 = Most Important, 5 = Least Important)"
      },
      {
        id: "priority_2",
        text: "Rank: Alumni Network Strength",
        type: "rank",
        trait: "alumni_network_priority",
        info: "How important is alumni network? (1 = Most Important, 5 = Least Important)"
      },
      {
        id: "priority_3",
        text: "Rank: Career Opportunities & Placement",
        type: "rank",
        trait: "career_opportunities_priority",
        info: "How important are career opportunities? (1 = Most Important, 5 = Least Important)"
      },
      {
        id: "priority_4",
        text: "Rank: Brand & Prestige",
        type: "rank",
        trait: "brand_prestige_priority",
        info: "How important is brand/prestige? (1 = Most Important, 5 = Least Important)"
      },
      {
        id: "priority_5",
        text: "Rank: Cost & Financial Aid",
        type: "rank",
        trait: "cost_financial_priority",
        info: "How important is cost/aid? (1 = Most Important, 5 = Least Important)"
      }
    ]
  },
  {
    id: "financial",
    title: "Financial Considerations",
    icon: "💰",
    color: "from-green-500 to-emerald-600",
    emoji: "💵",
    questions: [
      {
        id: "budget",
        text: "Annual budget you are comfortable with (tuition + living):",
        type: "mcq",
        trait: "budget_range",
        options: [
          { value: "under_60k", label: "Under $60,000", emoji: "💵" },
          { value: "60k_100k", label: "$60,000 - $100,000", emoji: "💰" },
          { value: "100k_150k", label: "$100,000 - $150,000", emoji: "💎" },
          { value: "150k_plus", label: "$150,000+", emoji: "🏆" },
          { value: "scholarship_dependent", label: "Depends on scholarship", emoji: "🎓" }
        ]
      },
      {
        id: "financial_1",
        text: "I am willing to take significant student loans",
        type: "scale",
        trait: "loan_willingness"
      },
      {
        id: "financial_2",
        text: "Return on investment (ROI) is my primary concern",
        type: "scale",
        trait: "roi_focus"
      }
    ]
  },
  {
    id: "competition",
    title: "Competition & Risk Appetite",
    icon: "🏆",
    color: "from-red-500 to-rose-600",
    emoji: "🎮",
    questions: [
      {
        id: "competition_mindset",
        text: "Choose your application mindset:",
        type: "mcq",
        trait: "application_strategy",
        options: [
          { value: "balanced", label: "Balanced (Mix of Reach/Target/Safe)", emoji: "⚖️" },
          { value: "ambitious", label: "Ambitious (More Reach schools)", emoji: "🚀" },
          { value: "safe", label: "Safe approach (More Target/Safe)", emoji: "🛡️" }
        ]
      },
      {
        id: "competition_1",
        text: "I enjoy being in highly competitive environments",
        type: "scale",
        trait: "competition_comfort"
      },
      {
        id: "competition_2",
        text: "I perform better under competitive pressure",
        type: "scale",
        trait: "competitive_performance"
      }
    ]
  }
];

const scaleLabels = [
  { value: 1, label: "Strongly Disagree", emoji: "😟" },
  { value: 2, label: "Disagree", emoji: "🙁" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 4, label: "Agree", emoji: "🙂" },
  { value: 5, label: "Strongly Agree", emoji: "😊" }
];

const rankOptions = [
  { value: 1, label: "Most Important", emoji: "🥇" },
  { value: 2, label: "Very Important", emoji: "🥈" },
  { value: 3, label: "Important", emoji: "🥉" },
  { value: 4, label: "Somewhat Important", emoji: "⭐" },
  { value: 5, label: "Least Important", emoji: "💫" }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MBAPersonalityTest({ 
  onComplete = () => {},
  onBack = () => {},
  user = { name: "Student", email: "student@example.com", image: null }
}) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showModuleIntro, setShowModuleIntro] = useState(true);
  const [completedModules, setCompletedModules] = useState([]);

  const currentModule = personalityModules?.[currentModuleIndex];
  const currentQuestion = currentModule?.questions?.[currentQuestionIndex];
  const totalQuestions = personalityModules?.reduce((sum, mod) => sum + (mod?.questions?.length || 0), 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      return names.length > 1 
        ? `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`.toUpperCase()
        : (names[0]?.[0] || '').toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : 'U';
  };

  const handleAnswer = (value) => {
    if (!currentQuestion?.id || !currentModule?.id) return;

    const answerData = {
      value,
      trait: currentQuestion?.trait,
      module: currentModule?.id,
      questionId: currentQuestion?.id,
      questionText: currentQuestion?.text,
      questionType: currentQuestion?.type,
      answeredAt: new Date().toISOString()
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerData
    }));

    setTimeout(() => handleNext(), 300);
  };

  const handleNext = () => {
    if (!currentModule?.questions) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      if (currentQuestionIndex < (currentModule?.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (currentModuleIndex < (personalityModules?.length || 0) - 1) {
        setCompletedModules(prev => [...prev, currentModule?.id]);
        setCurrentModuleIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setShowModuleIntro(true);
      } else {
        // TEST COMPLETE - Log all data
        console.log("=== PERSONALITY TEST COMPLETED ===");
        console.log("User:", user);
        console.log("Total Questions Answered:", Object.keys(answers).length);
        console.log("All Answers:", answers);
        console.log("Completed At:", new Date().toISOString());
        console.log("=================================");
        
        onComplete(answers);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      } else if (currentModuleIndex > 0) {
        const prevModule = personalityModules?.[currentModuleIndex - 1];
        if (prevModule?.questions) {
          setCurrentModuleIndex(prev => prev - 1);
          setCurrentQuestionIndex(prevModule.questions.length - 1);
        }
        setShowModuleIntro(false);
      }
      setIsAnimating(false);
    }, 300);
  };

  const canGoBack = currentModuleIndex > 0 || currentQuestionIndex > 0;

  // Safeguard for missing modules
  if (!currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#002147] mb-4">No modules available</h1>
          <Button onClick={onBack} className="bg-[#002147] text-white">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Module Introduction Screen
  if (showModuleIntro && currentQuestionIndex === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <header className="bg-[#002147] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
            <span className="font-roboto font-semibold tracking-[0.7px] text-[22px] text-white">
              Altu<span className="text-[#3598FE]">Via</span>
            </span>
            
            <div className="flex items-center gap-4">
              <div className="text-white text-sm font-medium">
                {answeredQuestions} / {totalQuestions}
              </div>
              <div className="relative">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={`${user?.name || 'User'} avatar`}
                    className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="mt-20 text-center space-y-8 animate-fade-in">
            <div className={`inline-block bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} p-1 rounded-3xl shadow-2xl`}>
              <div className="bg-white px-10 py-6 rounded-3xl">
                <span className="text-7xl animate-bounce">{currentModule?.emoji || '📝'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-[#002147]">
                {currentModule?.title || 'Module'}
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                Module {currentModuleIndex + 1} of {personalityModules?.length || 0}
              </p>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                {currentModule?.questions?.length || 0} questions to help us understand your preferences
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 pt-6">
              {completedModules.map((_, idx) => (
                <div key={idx} className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
              ))}
              <div className="w-5 h-5 rounded-full bg-[#002147] animate-pulse shadow-lg"></div>
              {Array((personalityModules?.length || 0) - currentModuleIndex - 1).fill(0).map((_, idx) => (
                <div key={idx} className="w-3 h-3 rounded-full bg-gray-300"></div>
              ))}
            </div>

            <div className="flex gap-4 justify-center pt-8">
              {canGoBack && (
                <Button
                  onClick={() => {
                    if (currentModuleIndex > 0) {
                      setCurrentModuleIndex(prev => prev - 1);
                      setCurrentQuestionIndex(0);
                      setShowModuleIntro(false);
                    }
                  }}
                  className="bg-white border-2 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all duration-300"
                >
                  <ChevronLeft className="mr-2" /> Previous Module
                </Button>
              )}
              
              <Button
                onClick={() => setShowModuleIntro(false)}
                className="bg-[#002147] hover:bg-[#003366] text-white px-12 py-6 rounded-xl text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Start Module <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safeguard for missing current question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#002147] mb-4">Question not found</h1>
          <Button onClick={() => setCurrentQuestionIndex(0)} className="bg-[#002147] text-white">
            Restart Module
          </Button>
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-8 py-6">
        <header className="bg-[#002147] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between sticky top-4 z-50">
          <span className="font-roboto font-semibold tracking-[0.7px] text-[22px] text-white">
            Altu<span className="text-[#3598FE]">Via</span>
          </span>
          
          <div className="flex items-center gap-4">
            <div className="text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-lg">
              {answeredQuestions} / {totalQuestions}
            </div>
            <div className="relative">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={`${user?.name || 'User'} avatar`}
                  className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm">
                  {getUserInitials()}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-[#002147] bg-blue-100 px-3 py-1 rounded-full">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} transition-all duration-500 rounded-full shadow-md`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-lg">
          <div className={`bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} p-4 rounded-xl text-white text-3xl shadow-md`}>
            {currentModule?.emoji || '📝'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#002147]">{currentModule?.title || 'Module'}</h3>
            <p className="text-sm text-gray-600 font-medium">
              Question {currentQuestionIndex + 1} of {currentModule?.questions?.length || 0} in this module
            </p>
          </div>
        </div>

        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transition-all duration-300 border-2 border-gray-100 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#002147] leading-relaxed mb-3">
              {currentQuestion?.text || 'Question not available'}
            </h2>
            {currentQuestion?.info && (
              <p className="text-sm text-gray-500 italic">{currentQuestion.info}</p>
            )}
          </div>

          {/* Scale Questions */}
          {currentQuestion?.type === "scale" && (
            <div className="space-y-4">
              {scaleLabels.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 transform hover:scale-102 hover:shadow-xl ${
                    answers[currentQuestion?.id]?.value === option.value
                      ? `border-[#002147] bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} text-white shadow-2xl scale-102`
                      : 'border-gray-200 hover:border-[#002147] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <span className="text-4xl">{option.emoji}</span>
                      <span className={`text-xl font-semibold ${
                        answers[currentQuestion?.id]?.value === option.value ? 'text-white' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {answers[currentQuestion?.id]?.value === option.value && (
                      <CheckCircle2 className="text-white" size={28} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* MCQ Questions */}
          {currentQuestion?.type === "mcq" && (
            <div className="space-y-4">
              {currentQuestion?.options?.map?.((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 transform hover:scale-102 hover:shadow-xl ${
                    answers[currentQuestion?.id]?.value === option.value
                      ? `border-[#002147] bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} text-white shadow-2xl scale-102`
                      : 'border-gray-200 hover:border-[#002147] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <span className="text-4xl">{option.emoji}</span>
                      <span className={`text-lg font-semibold text-left ${
                        answers[currentQuestion?.id]?.value === option.value ? 'text-white' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {answers[currentQuestion?.id]?.value === option.value && (
                      <CheckCircle2 className="text-white" size={28} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Rank Questions */}
          {currentQuestion?.type === "rank" && (
            <div className="space-y-4">
              {rankOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 transform hover:scale-102 hover:shadow-xl ${
                    answers[currentQuestion?.id]?.value === option.value
                      ? `border-[#002147] bg-gradient-to-r ${currentModule?.color || 'from-gray-500 to-gray-600'} text-white shadow-2xl scale-102`
                      : 'border-gray-200 hover:border-[#002147] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <span className="text-4xl">{option.emoji}</span>
                      <div className="text-left">
                        <span className={`text-xl font-bold block ${
                          answers[currentQuestion?.id]?.value === option.value ? 'text-white' : 'text-gray-700'
                        }`}>
                          {option.value}
                        </span>
                        <span className={`text-sm ${
                          answers[currentQuestion?.id]?.value === option.value ? 'text-white/90' : 'text-gray-500'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                    </div>
                    {answers[currentQuestion?.id]?.value === option.value && (
                      <CheckCircle2 className="text-white" size={28} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pb-10">
          <Button
            onClick={handlePrevious}
            disabled={!canGoBack}
            className="bg-white border-2 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white px-10 py-6 rounded-xl text-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
          >
            <ChevronLeft className="mr-2" /> Previous
          </Button>

          <div className="flex gap-2">
            {currentModule?.questions?.map?.((_, idx) => (
              <div
                key={idx}
                className={`h-3 rounded-full transition-all duration-300 ${
                  idx === currentQuestionIndex
                    ? 'bg-[#002147] w-10 shadow-md'
                    : answers[currentModule?.questions?.[idx]?.id]
                    ? 'bg-emerald-500 w-3 shadow-sm'
                    : 'bg-gray-300 w-3'
                }`}
              ></div>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion?.id]}
            className="bg-[#002147] hover:bg-[#003366] text-white px-10 py-6 rounded-xl text-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            {currentModuleIndex === (personalityModules?.length || 0) - 1 && 
             currentQuestionIndex === (currentModule?.questions?.length || 0) - 1
              ? '✓ Complete Test'
              : 'Next'} <ChevronRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}