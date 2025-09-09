"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Target,
  Eye,
  Lightbulb,
  Loader2,
  TrendingUp,
  AlertCircle,
  Award,
  BookOpen,
  Brain,
  BarChart3,
  Wifi,
  WifiOff,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
  Play
} from "lucide-react"

export function AISuggestions({ 
  content, 
  prompt, 
  wordCount, 
  wordLimit, 
  essayId, 
  universityName,
  currentVersionId = null,
  versions = [],
  onAnalysisComplete = null
}) {
  // State for current analysis
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  
  // State for version-specific analyses
  const [versionAnalyses, setVersionAnalyses] = useState({}) // versionId -> analysis
  const [selectedVersionForView, setSelectedVersionForView] = useState(null)
  
  // UI state
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    improvement: true,
    strength: true
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  /**
   * Load existing analyses for versions on component mount
   */
  useEffect(() => {
    if (versions && versions.length > 0) {
      loadExistingAnalyses()
    }
  }, [versions, essayId])

  /**
   * Set current analysis when versions change
   */
  useEffect(() => {
    if (currentVersionId && versionAnalyses[currentVersionId]) {
      setAnalysis(versionAnalyses[currentVersionId])
    } else if (!currentVersionId) {
      // For current content (not a saved version)
      setAnalysis(versionAnalyses['current'] || null)
    }
  }, [currentVersionId, versionAnalyses])

  /**
   * Load existing AI analyses for all versions
   */
  const loadExistingAnalyses = async () => {
    try {
      const response = await fetch(`/api/essay/${encodeURIComponent(universityName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_version_analyses',
          essayId
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.analyses) {
          const analysesMap = {}
          result.analyses.forEach(analysis => {
            const key = analysis.essayVersionId || 'current'
            analysesMap[key] = analysis
          })
          setVersionAnalyses(analysesMap)
        }
      }
    } catch (error) {
      console.error('Error loading existing analyses:', error)
    }
  }

  /**
   * Perform AI analysis for current content or specific version
   */
  const performAIAnalysis = async (versionId = null, versionContent = null) => {
    if (!essayId) return

    const analysisContent = versionContent || content
    const analysisVersionId = versionId

    if (!analysisContent || analysisContent.length < 50) {
      setError("Content too short for analysis (minimum 50 characters)")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log("Starting AI analysis...", {
        essayId,
        versionId: analysisVersionId,
        contentLength: analysisContent.length,
        universityName
      })

      const response = await fetch(`/api/essay/${encodeURIComponent(universityName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai_analysis',
          essayId,
          versionId: analysisVersionId,
          content: analysisContent,
          prompt,
          analysisTypes: ['comprehensive', 'structure', 'content']
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.analysis) {
          const key = analysisVersionId || 'current'
          
          // Update version analyses
          setVersionAnalyses(prev => ({
            ...prev,
            [key]: result.analysis
          }))
          
          // Set current analysis if analyzing current version
          if (!analysisVersionId || analysisVersionId === currentVersionId) {
            setAnalysis(result.analysis)
          }
          
          if (onAnalysisComplete) {
            onAnalysisComplete(result.analysis, analysisVersionId)
          }
          
        } else {
          throw new Error(result.error || 'Invalid response format')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("AI Analysis API error:", response.status, errorData)
        
        if (response.status === 500 && errorData.error?.includes("API key")) {
          throw new Error("AI service configuration issue. Please contact support.")
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.")
        } else {
          throw new Error(errorData.error || `Analysis failed (${response.status})`)
        }
      }
    } catch (err) {
      console.error('AI Analysis error:', err)
      setError(err.message || 'Failed to analyze content')
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * Get suggestion icon based on type
   */
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'improvement':
        return <Lightbulb className="w-4 h-4 text-blue-500" />
      case 'strength':
        return <Award className="w-4 h-4 text-green-500" />
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />
    }
  }

  /**
   * Get suggestion styling based on type
   */
  const getSuggestionStyling = (type) => {
    const base = "border rounded-lg p-4 transition-all duration-200"
    
    switch (type) {
      case 'critical':
        return `${base} border-red-100 bg-red-50/70 hover:bg-red-50`
      case 'warning':
        return `${base} border-amber-100 bg-amber-50/70 hover:bg-amber-50`
      case 'improvement':
        return `${base} border-blue-100 bg-blue-50/70 hover:bg-blue-50`
      case 'strength':
        return `${base} border-green-100 bg-green-50/70 hover:bg-green-50`
      default:
        return `${base} border-purple-100 bg-purple-50/70 hover:bg-purple-50`
    }
  }

  /**
   * Get score color
   */
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-amber-600 bg-amber-100"
    return "text-red-600 bg-red-100"
  }

  /**
   * Filter suggestions by type
   */
  const getSuggestionsByType = (type, analysisData = analysis) => {
    if (!analysisData?.suggestions) return []
    return analysisData.suggestions.filter(s => s.type === type)
  }

  /**
   * Count issues by severity
   */
  const getIssueCounts = (analysisData = analysis) => {
    if (!analysisData?.suggestions) return { critical: 0, warning: 0, improvement: 0, strength: 0 }
    
    return {
      critical: getSuggestionsByType('critical', analysisData).length,
      warning: getSuggestionsByType('warning', analysisData).length,
      improvement: getSuggestionsByType('improvement', analysisData).length,
      strength: getSuggestionsByType('strength', analysisData).length
    }
  }

  /**
   * Toggle section expansion
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  /**
   * Get version analysis or indicate if none exists
   */
  const getVersionAnalysisStatus = (versionId) => {
    if (versionAnalyses[versionId]) {
      return { hasAnalysis: true, analysis: versionAnalyses[versionId] }
    }
    return { hasAnalysis: false, analysis: null }
  }

  /**
   * Render analysis for display
   */
  const renderAnalysis = (analysisData) => {
    if (!analysisData) return null

    const issueCounts = getIssueCounts(analysisData)
    const totalIssues = issueCounts.critical + issueCounts.warning + issueCounts.improvement

    return (
      <div className="space-y-6">
        {/* Header with overall score */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Essay Analysis</h2>
            <p className="text-sm text-gray-600">Comprehensive feedback on your essay</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Overall Score:</span>
            <Badge className={`${getScoreColor(analysisData.overallScore)} text-sm px-3 py-1 font-semibold`}>
              {analysisData.overallScore}/100
            </Badge>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-700">Structure</span>
              <BarChart3 className="w-3 h-3 text-blue-600" />
            </div>
            <span className={`text-sm font-bold ${getScoreColor(analysisData.structureScore || 50).replace('bg-', 'text-')}`}>
              {analysisData.structureScore || 50}
            </span>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700">Relevance</span>
              <Target className="w-3 h-3 text-purple-600" />
            </div>
            <span className={`text-sm font-bold ${getScoreColor(analysisData.contentRelevance || 50).replace('bg-', 'text-')}`}>
              {analysisData.contentRelevance || 50}
            </span>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Leadership</span>
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
            <span className={`text-sm font-bold ${getScoreColor(analysisData.leadershipEmphasis || 50).replace('bg-', 'text-')}`}>
              {analysisData.leadershipEmphasis || 50}
            </span>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-700">Specificity</span>
              <Zap className="w-3 h-3 text-amber-600" />
            </div>
            <span className={`text-sm font-bold ${getScoreColor(analysisData.specificityScore || 50).replace('bg-', 'text-')}`}>
              {analysisData.specificityScore || 50}
            </span>
          </div>
        </div>

        {/* Render suggestion sections */}
        {/* Critical Issues */}
        {getSuggestionsByType('critical', analysisData).length > 0 && (
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
              onClick={() => toggleSection('critical')}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-900">Critical Issues</span>
                <Badge className="bg-red-200 text-red-800 border-0">
                  {getSuggestionsByType('critical', analysisData).length}
                </Badge>
              </div>
              {expandedSections.critical ? (
                <ChevronUp className="w-4 h-4 text-red-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            
            {expandedSections.critical && (
              <div className="space-y-3 pl-2">
                {getSuggestionsByType('critical', analysisData).map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={getSuggestionStyling(suggestion.type)}
                  >
                    <div className="flex items-start space-x-3">
                      {getSuggestionIcon(suggestion.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-red-700 mb-2">{suggestion.description}</p>
                        
                        {suggestion.action && (
                          <div className="mt-3 p-3 bg-red-100 rounded-lg">
                            <p className="text-xs font-semibold text-red-800 mb-1 flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" /> Suggested Revision:
                            </p>
                            <p className="text-sm text-red-700">{suggestion.action}</p>
                          </div>
                        )}
                      </div>
                      {suggestion.priority && (
                        <Badge className={`text-xs ${
                          suggestion.priority === 'high' ? 'bg-red-600 text-white' :
                          suggestion.priority === 'medium' ? 'bg-amber-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {suggestion.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Similar sections for warnings, improvements, and strengths */}
        {/* ... (other sections remain similar) ... */}
        
        {/* Writing Metrics */}
        {analysisData.readabilityScore && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">Writing Metrics</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">Readability</span>
                <span className={`font-bold ${getScoreColor(analysisData.readabilityScore).replace('bg-', 'text-')}`}>
                  {analysisData.readabilityScore}/100
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">Avg Sentence</span>
                <span className="font-bold text-gray-900">
                  {Math.round(analysisData.avgSentenceLength)} words
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">Sentences</span>
                <span className="font-bold text-gray-900">{analysisData.sentenceCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">Paragraphs</span>
                <span className="font-bold text-gray-900">{analysisData.paragraphCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const currentAnalysis = selectedVersionForView ? 
    versionAnalyses[selectedVersionForView] : 
    (currentVersionId ? versionAnalyses[currentVersionId] : versionAnalyses['current'])
  
  const issueCounts = getIssueCounts(currentAnalysis)
  const totalIssues = issueCounts.critical + issueCounts.warning + issueCounts.improvement

  return (
    <>
      {/* Compact Card View */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <div className="p-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#3598FE] to-[#2563EB] rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-[#002147]">AI Assistant</h3>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Version History Button */}
              {versions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="h-7 px-2 text-xs"
                >
                  <History className="w-3 h-3 mr-1" />
                  {Object.keys(versionAnalyses).length}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => performAIAnalysis(currentVersionId)}
                disabled={isAnalyzing || !content || content.length < 50}
                className="h-7 w-7 p-0"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>
              
              {currentAnalysis && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      View All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                      <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <span>AI Analysis - Full Report</span>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 px-6 py-4">
                      {renderAnalysis(currentAnalysis)}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Version History Panel */}
          {showVersionHistory && versions.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Version Analyses</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {versions.map((version) => {
                  const { hasAnalysis } = getVersionAnalysisStatus(version.id)
                  return (
                    <div key={version.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1 text-gray-600">
                        {version.label}
                      </span>
                      <div className="flex items-center space-x-1">
                        {hasAnalysis ? (
                          <Badge className="bg-green-100 text-green-700 text-xs px-2">
                            Analyzed
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => performAIAnalysis(version.id, version.content)}
                            disabled={isAnalyzing}
                            className="h-6 px-2 text-xs"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-xs text-blue-700">Analyzing your essay...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* No Content State */}
          {!content || content.length < 50 ? (
            <div className="text-center py-4">
              <Brain className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Save your essay to get AI analysis</p>
            </div>
          ) : currentAnalysis ? (
            <div className="space-y-3">
              
              {/* Quick Score Overview */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-900">Overall Score</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Progress 
                    value={currentAnalysis.overallScore} 
                    className="h-2 w-20 bg-indigo-200"
                  />
                  <Badge className={`${getScoreColor(currentAnalysis.overallScore)} text-xs px-2 py-1 font-semibold`}>
                    {currentAnalysis.overallScore}/100
                  </Badge>
                </div>
              </div>

              {/* Issue Summary */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {issueCounts.critical > 0 && (
                  <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
                    <span className="text-red-700 font-bold">{issueCounts.critical}</span>
                    <span className="text-red-600 text-xs">Critical</span>
                  </div>
                )}
                {issueCounts.warning > 0 && (
                  <div className="flex flex-col items-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertCircle className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-amber-700 font-bold">{issueCounts.warning}</span>
                    <span className="text-amber-600 text-xs">Warnings</span>
                  </div>
                )}
                {issueCounts.improvement > 0 && (
                  <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Lightbulb className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-blue-700 font-bold">{issueCounts.improvement}</span>
                    <span className="text-blue-600 text-xs">Suggestions</span>
                  </div>
                )}
                {issueCounts.strength > 0 && (
                  <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg border border-green-100">
                    <Award className="w-4 h-4 text-green-500 mb-1" />
                    <span className="text-green-700 font-bold">{issueCounts.strength}</span>
                    <span className="text-green-600 text-xs">Strengths</span>
                  </div>
                )}
              </div>

              {/* Most Important Issue */}
              {issueCounts.critical > 0 && getSuggestionsByType('critical', currentAnalysis)[0] && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-900 mb-1">
                        Priority Issue: {getSuggestionsByType('critical', currentAnalysis)[0].title}
                      </p>
                      <p className="text-xs text-red-700">
                        {getSuggestionsByType('critical', currentAnalysis)[0].description.substring(0, 120)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* View Full Analysis Button */}
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-9 bg-[#3598FE] hover:bg-[#2563EB] text-xs font-medium"
              >
                <Eye className="w-4 h-4 mr-1" />
                View {totalIssues} Suggestions & Full Analysis
              </Button>

            </div>
          ) : (
            /* Initial State - Manual analysis required */
            <div className="text-center py-3">
              <Button
                onClick={() => performAIAnalysis(currentVersionId)}
                disabled={!content || content.length < 50 || isAnalyzing}
                size="sm"
                className="bg-[#3598FE] hover:bg-[#2563EB] text-xs h-8 font-medium"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Analyze Essay
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Click to get AI-powered feedback
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}