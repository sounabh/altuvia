"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertTriangle, CheckCircle, RefreshCw, Zap, Target, Eye, Lightbulb } from "lucide-react"



export function AISuggestions({ content, prompt, wordCount, wordLimit }) {
  const [suggestions, setSuggestions] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [overallScore, setOverallScore] = useState(0)

  const generateSuggestions = () => {
    setIsAnalyzing(true)

    setTimeout(() => {
      const newSuggestions = []
      let score = 60

      if (content.length > 0) {
        // Critical issues (Red)
        if (wordCount > wordLimit * 1.1) {
          newSuggestions.push({
            id: "1",
            type: "critical",
            priority: "high",
            title: "Word Count Exceeded",
            description: `Your essay is ${wordCount - wordLimit} words over the limit. Admissions committees strictly enforce word limits.`,
            action: "Trim content",
            impact: "high",
          })
          score -= 20
        }

        // Warnings (Yellow/Orange)
        const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        const avgSentenceLength = content.length / sentences.length

        if (avgSentenceLength > 150) {
          newSuggestions.push({
            id: "2",
            type: "warning",
            priority: "medium",
            title: "Long Sentences Detected",
            description: "Your sentences are quite long. Consider breaking them down for better readability.",
            action: "Simplify sentences",
            impact: "medium",
          })
          score -= 10
        }

        // Word repetition
        const words = content.toLowerCase().split(/\s+/)
        const wordFreq = words.reduce(
          (acc, word) => {
            if (word.length > 4) acc[word] = (acc[word] || 0) + 1
            return acc
          },
          {} ,
        )

        const repeatedWords = Object.entries(wordFreq)
          .filter(([word, count]) => count > 3)
          .map(([word]) => word)

        if (repeatedWords.length > 0) {
          newSuggestions.push({
            id: "3",
            type: "warning",
            priority: "medium",
            title: "Repetitive Language",
            description: `Words like "${repeatedWords[0]}" appear ${wordFreq[repeatedWords[0]]} times. Vary your vocabulary.`,
            action: "Use synonyms",
            impact: "medium",
          })
          score -= 8
        }

        // Improvements (Blue)
        if (wordCount < wordLimit * 0.7) {
          newSuggestions.push({
            id: "4",
            type: "improvement",
            priority: "medium",
            title: "Expand Your Narrative",
            description: "You have room to add more specific examples and deeper insights to strengthen your story.",
            action: "Add details",
            impact: "high",
          })
        }

        if (!content.includes("because") && !content.includes("therefore") && !content.includes("consequently")) {
          newSuggestions.push({
            id: "5",
            type: "improvement",
            priority: "low",
            title: "Strengthen Logical Flow",
            description: "Consider adding more connecting words to show cause-and-effect relationships.",
            action: "Add transitions",
            impact: "medium",
          })
        }

        // Strengths (Green)
        if (content.includes("leadership") || content.includes("led") || content.includes("managed")) {
          newSuggestions.push({
            id: "6",
            type: "strength",
            priority: "low",
            title: "Strong Leadership Focus",
            description:
              "Excellent! You're effectively highlighting your leadership experience, which is crucial for MBA applications.",
            impact: "high",
          })
          score += 15
        }

        if (content.includes("impact") || content.includes("result") || content.includes("outcome")) {
          newSuggestions.push({
            id: "7",
            type: "strength",
            priority: "low",
            title: "Results-Oriented Language",
            description: "Great job emphasizing outcomes and impact. This demonstrates your business mindset.",
            impact: "high",
          })
          score += 10
        }

        // Structure analysis
        const paragraphs = content.split("\n").filter((p) => p.trim().length > 0)
        if (paragraphs.length === 1 && wordCount > 200) {
          newSuggestions.push({
            id: "8",
            type: "improvement",
            priority: "medium",
            title: "Improve Structure",
            description: "Consider breaking your essay into 2-3 paragraphs for better organization and flow.",
            action: "Add paragraphs",
            impact: "medium",
          })
        }
      } else {
        newSuggestions.push({
          id: "0",
          type: "improvement",
          priority: "high",
          title: "Start Your Essay",
          description:
            "Begin with a compelling hook that directly addresses the prompt. Consider starting with a specific moment or challenge.",
          action: "Begin writing",
          impact: "high",
        })
      }

      setSuggestions(newSuggestions)
      setOverallScore(Math.max(0, Math.min(100, score)))
      setIsAnalyzing(false)
    }, 2000)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      generateSuggestions()
    }, 1000)

    return () => clearTimeout(timer)
  }, [content, wordCount, wordLimit])

  const getSuggestionConfig = (type) => {
    switch (type) {
      case "critical":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          bgColor: "bg-gradient-to-r from-red-50 to-red-100",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          badgeColor: "bg-red-100 text-red-700",
          accentColor: "bg-red-500",
        }
      case "warning":
        return {
          icon: <Zap className="w-4 h-4" />,
          bgColor: "bg-gradient-to-r from-amber-50 to-orange-100",
          borderColor: "border-amber-200",
          iconColor: "text-amber-600",
          badgeColor: "bg-amber-100 text-amber-700",
          accentColor: "bg-amber-500",
        }
      case "improvement":
        return {
          icon: <Lightbulb className="w-4 h-4" />,
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-100",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          badgeColor: "bg-blue-100 text-blue-700",
          accentColor: "bg-blue-500",
        }
      case "strength":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-100",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-700",
          accentColor: "bg-green-500",
        }
      default:
        return {
          icon: <Sparkles className="w-4 h-4" />,
          bgColor: "bg-gradient-to-r from-purple-50 to-purple-100",
          borderColor: "border-purple-200",
          iconColor: "text-purple-600",
          badgeColor: "bg-purple-100 text-purple-700",
          accentColor: "bg-purple-500",
        }
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreGradient = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-600"
    if (score >= 60) return "from-amber-500 to-orange-600"
    return "from-red-500 to-red-600"
  }

  return (
    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#3598FE] to-[#2563EB] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#002147]">AI Assistant</h3>
              <p className="text-xs text-[#6C7280]">Real-time analysis</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={isAnalyzing}
            className="text-[#3598FE] hover:text-[#2563EB] hover:bg-blue-50"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {/* Overall Score */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#002147]">Essay Quality Score</span>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>{overallScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getScoreGradient(overallScore)} transition-all duration-1000 ease-out`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        {isAnalyzing ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-[#6C7280]">Start writing to get AI-powered insights</p>
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const config = getSuggestionConfig(suggestion.type)
                return (
                  <div
                    key={suggestion.id}
                    className={`relative p-4 ${config.bgColor} ${config.borderColor} border rounded-xl hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor} rounded-l-xl`} />

                    <div className="flex items-start space-x-3 ml-2">
                      <div className={`${config.iconColor} mt-0.5`}>{config.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-[#002147]">{suggestion.title}</h4>
                          <Badge className={`text-xs px-2 py-0 ${config.badgeColor} border-0`}>{suggestion.type}</Badge>
                          {suggestion.impact && (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-gray-300">
                              {suggestion.impact} impact
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed mb-3">{suggestion.description}</p>
                        {suggestion.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 px-3 text-xs ${config.iconColor} hover:bg-white/50`}
                          >
                            <Target className="w-3 h-3 mr-1" />
                            {suggestion.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
