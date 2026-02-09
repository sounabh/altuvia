'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Star,
  Heart,
  Zap,
  ExternalLink,
  Search,
  BookOpen,
  LayoutDashboard,
  Calendar,
  FileText
} from 'lucide-react';

// ============================================
// BETA FEEDBACK PAGE
// Dedicated page for collecting user feedback
// ============================================

const FeedbackPage = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Google Form URL
  const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdvHIt1JKbaWBTm8wdtMLOJotwPrZILhCpO0wakv1PYIvnYKg/viewform?usp=publish-editor";

  // ============================================
  // TESTING CHECKLIST ITEMS
  // Features users should test before feedback
  // ============================================
  const testingChecklist = [
    {
      icon: Search,
      title: "Search Universities",
      description: "Browse and search for MBA programs based on your interests",
      time: "2 min"
    },
    {
      icon: BookOpen,
      title: "View University Details",
      description: "Explore key info, deadlines, and application requirements",
      time: "2 min"
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard & Timeline",
      description: "Add universities and check AI-generated application timeline",
      time: "3 min"
    },
    {
      icon: Calendar,
      title: "Calendar & Events",
      description: "View personalized calendar and add important dates",
      time: "2 min"
    },
    {
      icon: FileText,
      title: "Essay Tools",
      description: "Try university-specific prompts and AI essay assistance",
      time: "2 min"
    },
    {
      icon: FileText,
      title: "CV Builder",
      description: "Create or edit your CV with AI suggestions",
      time: "2 min"
    }
  ];

  // ============================================
  // FEEDBACK CATEGORIES
  // What kind of feedback we're looking for
  // ============================================
  const feedbackCategories = [
    {
      icon: Star,
      title: "Confusing Features",
      question: "Was anything unclear or hard to use?"
    },
    {
      icon: Zap,
      title: "Bugs & Errors",
      question: "Did you encounter any broken features?"
    },
    {
      icon: Heart,
      title: "AI Usefulness",
      question: "Was the AI timeline and essay help valuable?"
    },
    {
      icon: Sparkles,
      title: "Missing Features",
      question: "What did you expect but didn&apos;t find?"
    }
  ];

  // ============================================
  // HANDLE FORM REDIRECT
  // Opens Google Form in new tab
  // ============================================
  const handleOpenForm = () => {
    window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
    setHasSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8 font-roboto">
      <div className="max-w-4xl mx-auto">
        
        {/* ========== HEADER SECTION ========== */}
        <div className="text-center mb-6">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 bg-[#3598FE]/10 border border-[#3598FE]/30 rounded-full px-3 py-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#3598FE]" />
            <span className="text-xs font-semibold text-[#002147]">BETA VERSION</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#002147] mb-3 tracking-tight">
            Help Shape <span className="text-[#3598FE]">Altuvia</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mb-5">
            Your honest feedback helps us build the best MBA application platform. 
            Every response matters and directly shapes our roadmap.
          </p>
        </div>

        {/* ========== PRIMARY CTA SECTION (MOVED TO TOP) ========== */}
        <div className="bg-gradient-to-br from-[#002147] to-[#001e3e] rounded-lg shadow-xl p-6 text-center text-white mb-6">
          <div className="mb-4">
            <div className="inline-block bg-white/10 p-3 rounded-full mb-3">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Share Your Feedback</h2>
            <p className="text-blue-100 max-w-xl mx-auto text-xs leading-relaxed">
              Already tested the platform? Click below to share your thoughts.
              If not, scroll down to see what to test first.
            </p>
          </div>

          {/* Feedback Button */}
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center gap-2 bg-white text-[#002147] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span>Give Feedback Now</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Submission Confirmation */}
          {hasSubmitted && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-300/50 rounded-lg">
              <p className="flex items-center justify-center gap-2 text-green-100 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Form opened! Please complete it in the new tab.
              </p>
            </div>
          )}

          {/* Privacy Note */}
          <p className="mt-4 text-xs text-blue-200">
            🔒 Your responses are confidential and used only for product improvement
          </p>
        </div>

        {/* ========== DIVIDER ========== */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">Haven&apos;t tested yet? See below</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* ========== IMPORTANT NOTE CARD ========== */}
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-l-4 border-amber-500 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-1.5 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1 text-sm">
                📋 Please Test Before Giving Feedback
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                To provide valuable insights, please spend <strong>10-12 minutes</strong> exploring 
                the features below. Your feedback is most helpful when it&apos;s based on actual usage.
              </p>
            </div>
          </div>
        </div>

        {/* ========== TESTING CHECKLIST ========== */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-bold text-[#002147] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#3598FE]" />
            Testing Checklist
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {testingChecklist.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#3598FE] hover:bg-blue-50/30 transition-all"
                >
                  <div className="bg-[#3598FE]/10 p-1.5 rounded-lg flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#3598FE]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-[#002147] text-sm truncate">{item.title}</h3>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 ml-2 flex-shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Time */}
          <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <p className="text-center text-[#002147] text-xs font-medium">
              <span className="text-[#3598FE] font-semibold">Total time:</span> ~10-12 minutes 
              for comprehensive testing
            </p>
          </div>
        </div>

        {/* ========== WHAT FEEDBACK WE NEED ========== */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-bold text-[#002147] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3598FE]" />
            What Feedback We Need
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {feedbackCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200"
                >
                  <div className="bg-[#002147] p-1.5 rounded-lg flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#002147] mb-0.5 text-sm">{category.title}</h3>
                    <p className="text-xs text-gray-600">{category.question}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Honest Feedback Note */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-200/50">
            <p className="text-center text-gray-700 text-xs">
              <strong className="text-[#002147]">💬 Brutal honesty is welcome.</strong> 
              {' '}We&apos;re here to learn and improve!
            </p>
          </div>
        </div>

      

      </div>
    </div>
  );
};

export default FeedbackPage;