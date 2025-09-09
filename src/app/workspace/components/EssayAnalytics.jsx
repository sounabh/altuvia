"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  RefreshCw,
  Loader2,
} from "lucide-react"

export function EssayAnalytics({ essay, allEssays, essayId, userId, universityName }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch analytics data from API
   */
 // Updated EssayAnalytics component - only the fetchAnalytics function
const fetchAnalytics = async () => {
  if (!essayId || !universityName) return

  setLoading(true)
  setError(null)

  try {
    // FIXED: Use correct endpoint /api/essay/ instead of /api/workspace/
    const response = await fetch(`/api/essay/${encodeURIComponent(universityName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_analytics',
        essayId,
        userId
      })
    })

    if (response.ok) {
      const result = await response.json()
      setAnalytics(result.analytics)
    } else {
      const errorData = await response.json()
      setError(errorData.error || 'Failed to load analytics')
    }
  } catch (err) {
    console.error('Analytics error:', err)
    setError('Failed to connect to analytics service')
  } finally {
    setLoading(false)
  }
}

  /**
   * Load analytics when component mounts or essay changes
   */
  useEffect(() => {
    fetchAnalytics()
  }, [essayId, universityName])

  // Fallback calculations using local data if API analytics aren't available
  const localAnalytics = {
    completion: {
      percentage: essay ? Math.min(100, (essay.wordCount / essay.wordLimit) * 100) : 0,
      wordCount: essay?.wordCount || 0,
      wordLimit: essay?.wordLimit || 500,
      wordsRemaining: essay ? Math.max(0, essay.wordLimit - essay.wordCount) : 0
    },
    timing: {
      readingTime: essay ? Math.ceil(essay.wordCount / 200) : 0,
      lastModified: essay?.lastModified || new Date()
    },
    structure: {
      sentences: essay ? essay.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0,
      paragraphs: essay ? essay.content.split('\n').filter(p => p.trim().length > 0).length : 0,
      avgSentenceLength: essay && essay.wordCount > 0 ? 
        Math.round(essay.wordCount / Math.max(1, essay.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length)) : 0
    },
    versions: {
      total: essay?.versions?.length || 0,
      autoSaves: essay?.versions?.filter(v => v.isAutoSave).length || 0,
      manualSaves: essay?.versions?.filter(v => !v.isAutoSave).length || 0
    },
    progress: {
      overall: allEssays.length > 0 ? 
        allEssays.reduce((acc, e) => acc + Math.min(100, (e.wordCount / e.wordLimit) * 100), 0) / allEssays.length : 0,
      completed: allEssays.filter(e => e.wordCount >= e.wordLimit * 0.8).length,
      total: allEssays.length
    }
  }

  // Use API analytics if available, otherwise use local calculations
  const displayAnalytics = analytics || localAnalytics

  // Helper function for priority colors
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

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
      <div className="p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#002147]">Essay Analytics</h3>
              <p className="text-xs text-[#6C7280]">Performance insights</p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">

          {/* Completion Progress */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Completion</span>
              </div>
              {essay?.priority && (
                <Badge className={`text-xs px-2 py-1 border ${getPriorityColor(essay.priority)}`}>
                  {essay.priority} priority
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-blue-900">
                {Math.round(displayAnalytics.completion.percentage)}%
              </span>
              <span className="text-xs text-blue-700">
                {displayAnalytics.completion.wordCount}/{displayAnalytics.completion.wordLimit} words
              </span>
            </div>

            <Progress value={displayAnalytics.completion.percentage} className="h-2 bg-blue-200" />
            
            {displayAnalytics.completion.wordsRemaining > 0 && (
              <p className="text-xs text-blue-700 mt-2">
                {displayAnalytics.completion.wordsRemaining} words remaining
              </p>
            )}
          </div>

          {/* Writing Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">

            {/* Reading Time */}
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-900">Reading Time</span>
              </div>
              <span className="text-sm font-bold text-green-900">
                {displayAnalytics.timing.readingTime} min
              </span>
            </div>

            {/* Writing Velocity */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-900">
                  {analytics ? 'Velocity' : 'Versions'}
                </span>
              </div>
              <span className="text-sm font-bold text-purple-900">
                {analytics ? `${displayAnalytics.timing.writingVelocity} w/day` : displayAnalytics.versions.total}
              </span>
            </div>

          </div>

          {/* Structure Analysis */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="flex items-center space-x-2 mb-3">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Structure Analysis</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-amber-700">Sentences</span>
                  <span className="text-sm font-bold text-amber-900">{displayAnalytics.structure.sentences}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-amber-700">Paragraphs</span>
                  <span className="text-sm font-bold text-amber-900">{displayAnalytics.structure.paragraphs}</span>
                </div>
              </div>
            </div>

            {displayAnalytics.structure.avgSentenceLength > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-700">Avg Sentence Length</span>
                  <span className="text-sm font-bold text-amber-900">
                    {displayAnalytics.structure.avgSentenceLength} words
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Overall Progress Across All Essays */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Overall Progress</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-gray-900">
                {Math.round(displayAnalytics.progress.overall)}%
              </span>
              <span className="text-xs text-gray-700">
                {displayAnalytics.progress.completed}/{displayAnalytics.progress.total} essays
              </span>
            </div>

            <Progress value={displayAnalytics.progress.overall} className="h-2 bg-gray-200" />
          </div>

          {/* Version History Summary */}
          {displayAnalytics.versions.total > 0 && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Version History</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-indigo-700">Total Saves</span>
                  <span className="font-bold text-indigo-900">{displayAnalytics.versions.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700">Auto-saves</span>
                  <span className="font-bold text-indigo-900">{displayAnalytics.versions.autoSaves}</span>
                </div>
              </div>
            </div>
          )}

          {/* Last Modified Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>Last Modified</span>
              <span className="font-medium text-gray-700">
                {new Date(displayAnalytics.timing.lastModified).toLocaleDateString()}
              </span>
            </div>
            
            {analytics?.timing?.lastAutoSaved && (
              <div className="flex justify-between items-center">
                <span>Last Auto-saved</span>
                <span className="font-medium text-gray-700">
                  {new Date(analytics.timing.lastAutoSaved).toLocaleTimeString()}
                </span>
              </div>
            )}

            {analytics?.timing?.daysSinceStart && (
              <div className="flex justify-between items-center">
                <span>Days Working</span>
                <span className="font-medium text-gray-700">
                  {analytics.timing.daysSinceStart}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}