"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EssayEditor } from "./EssayEditor"
import { VersionManager } from "./VersionManager"
import { AISuggestions } from "./AiSuggestion"
import { SchoolSelector } from "./SchoolSelectpr"
import { AddSchoolModal } from "./AddSchoolModel"
import { EssayAnalytics } from "./EssayAnalytics"
import { BookOpen, Target, Sparkles, TrendingUp, Clock, Award } from "lucide-react"

// Initial mock data for schools with their respective essays
const initialSchools = [
  {
    id: "harvard",
    name: "Harvard Business School",
    shortName: "HBS",
    color: "#A41E22",
    description: "Leading business school focused on case-based learning and leadership development.",
    deadline: "January 4, 2024",
    applicationFee: "$250",
    essays: [
      {
        id: "harvard-1",
        title: "Leadership Essay",
        prompt:
          "Describe a time when you led a team through a significant challenge. What did you learn about yourself and leadership? (500 words)",
        content: "Leadership is about more than just giving orders or making decisions. It's about inspiring others to work toward a common goal, even when the path forward is unclear. During my time as project manager at TechCorp, I faced one of the most challenging situations of my career that taught me invaluable lessons about authentic leadership. Our team was tasked with developing a critical software update that would affect over 100,000 users. Three weeks before the deadline, we discovered a major security vulnerability that required us to rebuild core components from scratch. The team was demoralized, the stakeholders were panicking, and I felt the weight of responsibility crushing down on me.",
        wordCount: 128,
        wordLimit: 500,
        lastModified: new Date(),
        versions: [],
        priority: "high",
      },
    ],
  },
  {
    id: "stanford",
    name: "Stanford Graduate School of Business",
    shortName: "Stanford GSB",
    color: "#8C1515",
    description: "Innovative business education with emphasis on entrepreneurship and social impact.",
    deadline: "January 9, 2024",
    applicationFee: "$275",
    essays: [
      {
        id: "stanford-1",
        title: "Personal Statement",
        prompt: "What matters most to you, and why? How does this connect to your future goals? (650 words)",
        content: "What matters most to me is the power of education to transform lives and communities. This belief stems from my own journey growing up in a small rural town where opportunities were scarce, but education became my pathway to a different future. I witnessed firsthand how a single dedicated teacher could change the trajectory of a student's life, and how access to quality education could break cycles of poverty and limitation. My grandmother, who never learned to read, always told me that education was the one thing no one could ever take away from me. Her words became my guiding principle.",
        wordCount: 98,
        wordLimit: 650,
        lastModified: new Date(),
        versions: [],
        priority: "high",
      },
    ],
  },
  {
    id: "wharton",
    name: "Wharton School - University of Pennsylvania",
    shortName: "Wharton",
    color: "#011F5B",
    description: "Premier business school known for finance, analytics, and global business perspective.",
    deadline: "January 5, 2024",
    applicationFee: "$250",
    essays: [
      {
        id: "wharton-1",
        title: "Career Goals Essay",
        prompt: "How do you plan to use the Wharton MBA to achieve your future professional goals? (500 words)",
        content: "My career goal is to become a venture capitalist focused on investing in healthcare technology startups that can democratize access to medical care. The Wharton MBA will provide me with the financial expertise, network, and strategic thinking skills necessary to identify and nurture the next generation of healthcare innovations. Having worked in healthcare consulting for the past four years, I've seen how technology can revolutionize patient care, but I've also witnessed the challenges that promising startups face in scaling their solutions.",
        wordCount: 79,
        wordLimit: 500,
        lastModified: new Date(),
        versions: [],
        priority: "medium",
      },
    ],
  },
]

/**
 * Main Essay Workspace Component
 * Provides a comprehensive interface for managing and editing application essays for multiple schools
 */
export function EssayWorkspace() {
  // Core state management for schools and essays
  const [schools, setSchools] = useState(initialSchools)
  const [activeSchool, setActiveSchool] = useState(schools[0].id)
  const [activeEssay, setActiveEssay] = useState(schools[0].essays[0].id)
  
  // UI state management for different panels and modals
  const [showVersions, setShowVersions] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(true) // Analytics panel shown by default
  const [showAddSchool, setShowAddSchool] = useState(false)
  
  // Similarity detection warning state
  const [similarityWarning, setSimilarityWarning] = useState({ 
    show: false, 
    percentage: 0, 
    sourceSchool: "" 
  })

  // Derived state - get currently selected school and essay
  const currentSchool = schools.find((s) => s.id === activeSchool)
  const currentEssay = currentSchool?.essays.find((e) => e.id === activeEssay)

  /**
   * Effect to handle active essay synchronization when switching schools
   * Ensures that when a user switches schools, the active essay is valid for that school
   */
  useEffect(() => {
    if (currentSchool && currentSchool.essays.length > 0) {
      // Check if the current essay belongs to the selected school
      const essayBelongsToSchool = currentSchool.essays.some(essay => essay.id === activeEssay)
      
      // If not, switch to the first essay of the selected school
      if (!essayBelongsToSchool) {
        setActiveEssay(currentSchool.essays[0].id)
      }
    }
  }, [activeSchool, currentSchool, activeEssay])

  /**
   * Updates essay content and word count, triggers similarity detection
   * @param {string} content - The updated essay content
   * @param {number} wordCount - The updated word count
   */
  const updateEssayContent = (content, wordCount) => {
    setSchools((prev) =>
      prev.map((school) =>
        school.id === activeSchool
          ? {
              ...school,
              essays: school.essays.map((essay) =>
                essay.id === activeEssay
                  ? {
                      ...essay,
                      content,
                      wordCount,
                      lastModified: new Date(),
                    }
                  : essay,
              ),
            }
          : school,
      ),
    )

    // Enhanced copy/paste detection - simulate similarity checking
    if (content.length > 50) {
      const similarity = Math.random() * 100
      
      // Show warning if similarity is above 75%
      if (similarity > 75) {
        setSimilarityWarning({
          show: true,
          percentage: Math.floor(similarity),
          sourceSchool: schools.find((s) => s.id !== activeSchool)?.name || "Another essay",
        })
      }
    }
  }

  /**
   * Saves the current essay content as a new version
   * @param {string} label - Label for the saved version
   */
  const saveVersion = (label) => {
    if (!currentEssay) return

    const newVersion = {
      id: Date.now().toString(),
      content: currentEssay.content,
      timestamp: new Date(),
      label,
    }

    setSchools((prev) =>
      prev.map((school) =>
        school.id === activeSchool
          ? {
              ...school,
              essays: school.essays.map((essay) =>
                essay.id === activeEssay
                  ? {
                      ...essay,
                      versions: [...essay.versions, newVersion],
                    }
                  : essay,
              ),
            }
          : school,
      ),
    )
  }

  /**
   * Adds a new school to the workspace with a default essay
   * @param {Object} schoolData - The new school data
   */
  const addNewSchool = (schoolData) => {
    const newSchool = {
      ...schoolData,
      id: `school-${Date.now()}`,
      essays: [
        {
          id: `essay-${Date.now()}`,
          title: "Personal Statement",
          prompt: "Tell us about yourself and your goals.",
          content: "",
          wordCount: 0,
          wordLimit: 500,
          lastModified: new Date(),
          versions: [],
          priority: "medium",
        },
      ],
    }
    
    // Add the new school and make it active
    setSchools((prev) => [...prev, newSchool])
    setActiveSchool(newSchool.id)
    setActiveEssay(newSchool.essays[0].id)
    setShowAddSchool(false)
  }

  // Calculate aggregate statistics across all schools and essays
  const totalWords = schools.reduce(
    (acc, school) => acc + school.essays.reduce((essayAcc, essay) => essayAcc + essay.wordCount, 0),
    0,
  )

  const completedEssays = schools.reduce(
    (acc, school) => acc + school.essays.filter((essay) => essay.wordCount >= essay.wordLimit * 0.8).length,
    0,
  )

  const totalEssays = schools.reduce((acc, school) => acc + school.essays.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Header with stats and controls */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#002147]">Essay Workspace</h1>
                <p className="text-sm text-[#6C7280]">Craft compelling application essays</p>
              </div>
            </div>

            {/* Right side - Stats and controls */}
            <div className="flex items-center space-x-6">
              
              {/* Quick Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {completedEssays}/{totalEssays} Complete
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{totalWords.toLocaleString()} words</span>
                </div>
              </div>

              {/* Current Essay Word Count with Progress Bar */}
              {currentEssay && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <Target className="w-5 h-5 text-[#6C7280]" />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-[#002147]">
                      {currentEssay.wordCount}/{currentEssay.wordLimit}
                    </span>
                    
                    {/* Dynamic progress bar with color coding */}
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min((currentEssay.wordCount / currentEssay.wordLimit) * 100, 100)}%`,
                          backgroundColor:
                            currentEssay.wordCount > currentEssay.wordLimit
                              ? "#EF4444" // Red for over limit
                              : currentEssay.wordCount > currentEssay.wordLimit * 0.8
                                ? "#F59E0B" // Yellow for close to limit
                                : "#10B981", // Green for under limit
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for toggling panels */}
              <div className="flex items-center space-x-3">
                
                {/* Analytics Toggle */}
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={showAnalytics 
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                    : "border-purple-500 text-purple-600 hover:bg-purple-50"
                  }
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>

                {/* AI Assistant Toggle */}
                <Button
                  variant={showAI ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAI(!showAI)}
                  className={showAI
                    ? "bg-gradient-to-r from-[#3598FE] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border-0"
                    : "border-[#3598FE] text-[#3598FE] hover:bg-blue-50"
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Sidebar - School Selector */}
          <div className="col-span-12 lg:col-span-3">
            <SchoolSelector
              schools={schools}
              activeSchool={activeSchool}
              activeEssay={activeEssay}
              onSchoolChange={setActiveSchool}
              onEssayChange={setActiveEssay}
              onAddSchool={() => setShowAddSchool(true)}
            />
          </div>

          {/* Main Editor Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="h-full shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-8">
                {currentEssay && (
                  <>
                    {/* Essay Header with title and metadata */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        {/* School color indicator */}
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: currentSchool?.color }}
                        />
                        <div>
                          <h2 className="text-2xl font-bold text-[#002147]">{currentEssay.title}</h2>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-[#6C7280]">{currentSchool?.shortName}</p>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-[#6C7280]" />
                              <span className="text-xs text-[#6C7280]">Due: {currentSchool?.deadline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Versions toggle button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersions(!showVersions)}
                        className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
                      >
                        Versions ({currentEssay.versions.length})
                      </Button>
                    </div>

                    {/* Essay Prompt Display */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 font-medium mb-2">Essay Prompt:</p>
                      <p className="text-sm text-blue-700 leading-relaxed">{currentEssay.prompt}</p>
                    </div>

                    {/* Similarity Warning - Shown when content similarity is detected */}
                    {similarityWarning.show && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-amber-800 font-medium">
                              Similarity Alert: {similarityWarning.percentage}% match detected
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              This content appears similar to your {similarityWarning.sourceSchool} essay.
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSimilarityWarning({ show: false, percentage: 0, sourceSchool: "" })}
                              className="mt-2 h-6 px-2 text-xs text-amber-700 hover:text-amber-800"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Essay Editor */}
                    <EssayEditor
                      content={currentEssay.content}
                      onChange={updateEssayContent}
                      wordLimit={currentEssay.wordLimit}
                    />

                    {/* Editor Footer with metadata and actions */}
                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-xs text-[#6C7280]">
                        Last modified: {currentEssay.lastModified.toLocaleString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveVersion(`Draft ${currentEssay.versions.length + 1}`)}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        Save Version
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analytics, AI, and Versions */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* Essay Analytics Panel - Shown when toggled and essay exists */}
            {showAnalytics && currentEssay && (
              <EssayAnalytics 
                key={`${activeSchool}-${activeEssay}`} // Force re-render when essay changes
                essay={currentEssay} 
                allEssays={schools.flatMap((s) => s.essays)} 
              />
            )}

            {/* AI Suggestions Panel - Shown when toggled and essay exists */}
            {showAI && currentEssay && (
              <AISuggestions
                key={`ai-${activeSchool}-${activeEssay}`} // Force re-render when essay changes
                content={currentEssay.content}
                prompt={currentEssay.prompt}
                wordCount={currentEssay.wordCount}
                wordLimit={currentEssay.wordLimit}
              />
            )}

            {/* Version Manager Panel - Shown when toggled and essay exists */}
            {showVersions && currentEssay && (
              <VersionManager
                key={`versions-${activeSchool}-${activeEssay}`} // Force re-render when essay changes
                versions={currentEssay.versions}
                currentContent={currentEssay.content}
                onRestoreVersion={(content) => updateEssayContent(content, content.split(" ").length)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add School Modal - Shown when user wants to add a new school */}
      <AddSchoolModal 
        isOpen={showAddSchool} 
        onClose={() => setShowAddSchool(false)} 
        onAdd={addNewSchool} 
      />
    </div>
  )
}