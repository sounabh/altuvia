"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  History, 
  RotateCcw, 
  Eye, 
  Calendar, 
  GitBranch, 
  Download, 
  Share,
  Trash2,
  Clock,
  Loader2,
  EyeOff
} from "lucide-react"

export function VersionManager({ 
  versions = [], 
  currentContent = '', 
  onRestoreVersion, 
  onDeleteVersion,
  essayId,
  universityName,
  isLoading = false 
}) {
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const [expandedVersions, setExpandedVersions] = useState(new Set())

  /**
   * Format date for display - Enhanced
   */
  const formatDate = useCallback((date) => {
    if (!date) return 'Unknown'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  /**
   * Count words in content - Enhanced accuracy
   */
  const getWordCount = useCallback((content) => {
    if (!content || typeof content !== 'string') return 0
    
    // Remove HTML tags and count words more accurately
    const textContent = content
      .replace(/<[^>]*>/g, " ")           // Remove HTML tags
      .replace(/&nbsp;/g, " ")           // Replace non-breaking spaces
      .replace(/&[a-zA-Z0-9]+;/g, " ")   // Replace HTML entities
      .replace(/\s+/g, " ")              // Normalize whitespace
      .trim()
    
    return textContent ? textContent.split(/\s+/).filter(word => word.length > 0).length : 0
  }, [])

  /**
   * Get time difference from now - Enhanced
   */
  const getTimeDifference = useCallback((date) => {
    if (!date) return 'Unknown'
    
    const now = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return 'Unknown'
    
    const diff = now.getTime() - dateObj.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }, [])

  /**
   * Handle version restoration - Enhanced error handling
   */
  const handleRestoreVersion = useCallback(async (versionId) => {
    if (!onRestoreVersion || !versionId) return
    
    setLoadingAction(`restore-${versionId}`)
    try {
      await onRestoreVersion(versionId)
      setSelectedVersion(null)
      setShowComparison(false)
    } catch (error) {
      console.error('Error restoring version:', error)
    } finally {
      setLoadingAction(null)
    }
  }, [onRestoreVersion])

  /**
   * Handle version deletion - Enhanced error handling
   */
  const handleDeleteVersion = useCallback(async (versionId) => {
    if (!onDeleteVersion || !versionId) return
    
    // Don't allow deletion of the only version
    if (versions.length <= 1) {
      console.warn("Cannot delete the only version")
      return
    }
    
    setLoadingAction(`delete-${versionId}`)
    try {
      await onDeleteVersion(versionId)
      setSelectedVersion(null)
      setShowComparison(false)
    } catch (error) {
      console.error('Error deleting version:', error)
    } finally {
      setLoadingAction(null)
    }
  }, [onDeleteVersion, versions.length])

  /**
   * Export version content - Enhanced
   */
  const exportVersion = useCallback((version) => {
    if (!version || !version.content) return
    
    try {
      // Clean content and export as text
      const cleanContent = version.content.replace(/<[^>]*>/g, "").trim()
      const blob = new Blob([cleanContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${version.label?.replace(/[^a-z0-9]/gi, '_') || 'essay_version'}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting version:', error)
    }
  }, [])

  /**
   * Toggle version expansion
   */
  const toggleVersionExpansion = useCallback((versionId) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(versionId)) {
        newSet.delete(versionId)
      } else {
        newSet.add(versionId)
      }
      return newSet
    })
  }, [])

  /**
   * Get content preview
   */
  const getContentPreview = useCallback((content, maxLength = 200) => {
    if (!content) return ''
    
    const plainText = content.replace(/<[^>]*>/g, "").trim()
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + "..."
      : plainText
  }, [])

  // Sort versions by timestamp (newest first)
  const sortedVersions = versions
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return dateB.getTime() - dateA.getTime()
    })

  // Calculate statistics
  const stats = {
    total: versions.length,
    autoSaves: versions.filter(v => v.isAutoSave).length,
    manualSaves: versions.filter(v => !v.isAutoSave).length,
    averageWords: versions.length > 0 
      ? Math.round(versions.reduce((sum, v) => sum + getWordCount(v.content), 0) / versions.length)
      : 0
  }

  return (
    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#002147]">Version History</h3>
              <p className="text-xs text-[#6C7280]">Track your progress</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-white/50 border-gray-300">
            {stats.total} saved
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Loading versions...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && versions.length === 0 && (
          <div className="text-center py-8">
            <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-[#6C7280] mb-2">No saved versions yet</p>
            <p className="text-xs text-gray-500">Save versions to track your essay evolution</p>
          </div>
        )}

        {/* Versions List */}
        {!isLoading && versions.length > 0 && (
          <div className="space-y-6">
            
            {/* Current Version Section */}
            <div className="p-4 bg-gradient-to-r from-[#3598FE]/10 to-blue-100 border border-[#3598FE]/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-[#3598FE] rounded-full animate-pulse" />
                  <div>
                    <span className="text-sm font-bold text-[#002147]">Current Draft</span>
                    <Badge className="ml-2 bg-[#3598FE] text-white text-xs border-0">Live</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-[#002147]">
                    {getWordCount(currentContent)} words
                  </span>
                  <p className="text-xs text-[#6C7280]">Active</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6C7280]">{formatDate(new Date())}</p>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => exportVersion({ content: currentContent, label: 'Current_Draft' })}
                    className="h-6 px-2 text-xs text-[#3598FE] hover:bg-blue-100"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Saved Versions - Enhanced with better UX */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {sortedVersions.map((version, index) => {
                  const isExpanded = expandedVersions.has(version.id)
                  const isSelected = selectedVersion === version.id
                  const versionWordCount = getWordCount(version.content)
                  const currentWordCount = getWordCount(currentContent)
                  const wordDiff = versionWordCount - currentWordCount
                  
                  return (
                    <div
                      key={version.id}
                      className={`border rounded-xl transition-all duration-200 ${
                        isSelected
                          ? "border-[#3598FE] bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white/50"
                      }`}
                    >
                      {/* Version Header - Always clickable */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              version.isAutoSave ? 'bg-blue-400' : 'bg-green-500'
                            }`} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-[#002147]">
                                  {version.label || `Version ${index + 1}`}
                                </span>
                                {version.isAutoSave && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs border-0">Auto</Badge>
                                )}
                              </div>
                              <p className="text-xs text-[#6C7280] mt-1">
                                Version {sortedVersions.length - index} • {getTimeDifference(version.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-[#002147]">
                              {versionWordCount} words
                            </span>
                            {wordDiff !== 0 && (
                              <p className={`text-xs ${wordDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {wordDiff > 0 ? '+' : ''}{wordDiff} vs current
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Content Preview - Show when not selected */}
                        {!isSelected && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {getContentPreview(version.content, 150)}
                            </p>
                          </div>
                        )}

                        {/* Version Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-[#6C7280]">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(version.timestamp)}</span>
                            {version.changesSinceLastVersion && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">{version.changesSinceLastVersion}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {isSelected ? (
                              <span className="text-xs text-blue-600">Click to collapse</span>
                            ) : (
                              <span className="text-xs text-gray-400">Click to expand</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Show when selected */}
                      {isSelected && (
                        <div className="border-t border-gray-200 bg-white/70">
                          {/* Action Buttons */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowComparison(!showComparison)
                                  }}
                                  className="h-7 px-3 text-xs text-[#3598FE] hover:bg-blue-100"
                                >
                                  {showComparison ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                  {showComparison ? "Hide Content" : "View Content"}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    exportVersion(version)
                                  }}
                                  className="h-7 px-3 text-xs text-blue-600 hover:bg-blue-50"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Export
                                </Button>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestoreVersion(version.id)
                                  }}
                                  disabled={loadingAction === `restore-${version.id}`}
                                  className="h-7 px-3 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  {loadingAction === `restore-${version.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                  )}
                                  Restore
                                </Button>

                                {onDeleteVersion && versions.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Delete "${version.label}"? This cannot be undone.`)) {
                                        handleDeleteVersion(version.id)
                                      }
                                    }}
                                    disabled={loadingAction === `delete-${version.id}`}
                                    className="h-7 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {loadingAction === `delete-${version.id}` ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Trash2 className="w-3 h-3 mr-1" />
                                    )}
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Content Preview Section */}
                          {showComparison && (
                            <div className="p-4">
                              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {version.content.replace(/<[^>]*>/g, "")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>Word count: {versionWordCount}</span>
                                  <span>Characters: {version.content.replace(/<[^>]*>/g, "").length}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {wordDiff !== 0 && (
                                    <span className={wordDiff > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {wordDiff > 0 ? '+' : ''}{wordDiff} words vs current
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Version Statistics - Enhanced */}
        {versions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6C7280]">Total Versions</span>
                  <span className="font-medium text-[#002147]">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C7280]">Auto-saves</span>
                  <span className="font-medium text-[#002147]">{stats.autoSaves}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6C7280]">Manual Saves</span>
                  <span className="font-medium text-[#002147]">{stats.manualSaves}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C7280]">Latest Save</span>
                  <span className="font-medium text-[#002147]">
                    {sortedVersions.length > 0 ? getTimeDifference(sortedVersions[0].timestamp) : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {stats.averageWords > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6C7280]">Average Length</span>
                  <span className="font-medium text-[#002147]">{stats.averageWords} words</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Tips */}
        {versions.length === 0 && !isLoading && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Version Control Tips:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Versions are automatically saved every 25+ words or 10 minutes</li>
              <li>• Use "Save Version" for manual checkpoints at key milestones</li>
              <li>• Label important versions (e.g., "First Draft", "Final Review")</li>
              <li>• Export versions as backup before major changes</li>
              <li>• Restore any version if you need to revert changes</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}