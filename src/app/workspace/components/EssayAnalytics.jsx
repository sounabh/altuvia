"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, BarChart3, PieChart, Activity, Award } from "lucide-react"




export function EssayAnalytics({ essay, allEssays }) {
  const completionPercentage = (essay.wordCount / essay.wordLimit) * 100
  const readingTime = Math.ceil(essay.wordCount / 200) // Average reading speed

  // Calculate writing velocity (words per day)
  const daysSinceStart = Math.max(
    1,
    Math.ceil((new Date().getTime() - essay.lastModified.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const writingVelocity = Math.round(essay.wordCount / daysSinceStart)

  // Analyze sentence structure
  const sentences = essay.content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const avgSentenceLength = sentences.length > 0 ? Math.round(essay.wordCount / sentences.length) : 0

  // Calculate readability score (simplified)
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2))

  // Overall progress across all essays
  const totalProgress =
    allEssays.reduce((acc, e) => acc + Math.min(100, (e.wordCount / e.wordLimit) * 100), 0) / allEssays.length

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200"
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "low":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#002147]">Essay Analytics</h3>
            <p className="text-xs text-[#6C7280]">Performance insights</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Completion Status */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Completion</span>
              </div>
              <Badge className={`text-xs px-2 py-1 border ${getPriorityColor(essay.priority)}`}>
                {essay.priority} priority
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-blue-900">{Math.round(completionPercentage)}%</span>
              <span className="text-xs text-blue-700">
                {essay.wordCount}/{essay.wordLimit} words
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2 bg-blue-200" />
          </div>

          {/* Writing Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-900">Reading Time</span>
              </div>
              <span className="text-sm font-bold text-green-900">{readingTime} min</span>
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-900">Velocity</span>
              </div>
              <span className="text-sm font-bold text-purple-900">{writingVelocity} w/day</span>
            </div>
          </div>

          {/* Readability Score */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="flex items-center space-x-2 mb-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Readability Score</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-amber-900">{readabilityScore}/100</span>
              <span className="text-xs text-amber-700">
                {readabilityScore >= 80 ? "Excellent" : readabilityScore >= 60 ? "Good" : "Needs Work"}
              </span>
            </div>
            <Progress value={readabilityScore} className="h-2 bg-amber-200" />
            <p className="text-xs text-amber-700 mt-2">Avg sentence: {avgSentenceLength} words</p>
          </div>

          {/* Overall Progress */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Overall Progress</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-gray-900">{Math.round(totalProgress)}%</span>
              <span className="text-xs text-gray-700">{allEssays.length} essays</span>
            </div>
            <Progress value={totalProgress} className="h-2 bg-gray-200" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-[#6C7280]">Sentences</span>
              <span className="font-medium text-[#002147]">{sentences.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-[#6C7280]">Paragraphs</span>
              <span className="font-medium text-[#002147]">
                {essay.content.split("\n").filter((p) => p.trim().length > 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#6C7280]">Last Updated</span>
              <span className="font-medium text-[#002147]">{essay.lastModified.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
