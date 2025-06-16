"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw, Eye, Calendar, GitBranch, Download, Share } from "lucide-react"

export function VersionManager({ versions, currentContent, onRestoreVersion }) {
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [showComparison, setShowComparison] = useState(false)

  // Format date for display (e.g., "Jun 16, 02:30 PM")
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Count number of words in content
  const getWordCount = (content) => {
    return content.trim() ? content.trim().split(/\s+/).length : 0
  }

  // Get time difference between now and version timestamp
  const getTimeDifference = (date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return "Just now"
  }

  // Find selected version data by ID
  const selectedVersionData = versions.find((v) => v.id === selectedVersion)

  return (
    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
      <div className="p-6">
        {/* Header: Title and Saved Count */}
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
            {versions.length} saved
          </Badge>
        </div>

        {/* Empty state */}
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-[#6C7280] mb-2">No saved versions yet</p>
            <p className="text-xs text-gray-500">Save versions to track your essay evolution</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
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

                {/* Export and Share Buttons */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6C7280]">{formatDate(new Date())}</p>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#3598FE]">
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#3598FE]">
                      <Share className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Saved Versions */}
              {versions
                .slice()
                .reverse()
                .map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedVersion === version.id
                        ? "border-[#3598FE] bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white/50"
                    }`}
                    onClick={() =>
                      setSelectedVersion(selectedVersion === version.id ? null : version.id)
                    }
                  >
                    {/* Version Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        <div>
                          <span className="text-sm font-semibold text-[#002147]">
                            {version.label}
                          </span>
                          <p className="text-xs text-[#6C7280]">
                            Version {versions.length - index}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-[#002147]">
                          {getWordCount(version.content)} words
                        </span>
                        <p className="text-xs text-[#6C7280]">
                          {getTimeDifference(version.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-[#6C7280]">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(version.timestamp)}</span>
                      </div>

                      {selectedVersion === version.id && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowComparison(!showComparison)
                            }}
                            className="h-6 px-2 text-xs text-[#3598FE] hover:bg-blue-100"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {showComparison ? "Hide" : "Preview"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRestoreVersion(version.content)
                              setSelectedVersion(null)
                            }}
                            className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Comparison Preview Section */}
                    {selectedVersion === version.id && showComparison && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-white rounded-lg p-3 max-h-40 overflow-y-auto">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {version.content.replace(/<[^>]*>/g, "").substring(0, 300)}
                            {version.content.length > 300 && "..."}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Word count: {getWordCount(version.content)}</span>
                          <span>
                            {getWordCount(version.content) > getWordCount(currentContent) ? "+" : ""}
                            {getWordCount(version.content) - getWordCount(currentContent)} words vs current
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}
