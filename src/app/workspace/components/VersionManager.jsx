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
  Trash2,
  Clock,
  Loader2,
  FileText,
  FileDown,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
  CheckCircle
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
  const [showExportMenu, setShowExportMenu] = useState(null)
  const [loadingAction, setLoadingAction] = useState(null)
  const [viewMode, setViewMode] = useState('compact')

  const formatDate = useCallback((date) => {
    if (!date) return 'Unknown'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  const getWordCount = useCallback((content) => {
    if (!content || typeof content !== 'string') return 0
    
    const textContent = content
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-zA-Z0-9]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    
    return textContent ? textContent.split(/\s+/).filter(word => word.length > 0).length : 0
  }, [])

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

 const handleRestoreVersion = useCallback(async (versionId) => {
  if (!onRestoreVersion || !versionId) return;
  
  setLoadingAction(`restore-${versionId}`);
  try {
    await onRestoreVersion(versionId);
    setSelectedVersion(null);
  } catch (error) {
    console.error('Error restoring version:', error);
    // ✅ FIX: Show user-friendly error
    toast.error(error.message || 'Failed to restore version');
  } finally {
    setLoadingAction(null);
  }
}, [onRestoreVersion]);

const handleDeleteVersion = useCallback(async (versionId) => {
  if (!onDeleteVersion || !versionId) return;
  
  if (versions.length <= 1) {
    // ✅ FIX: Better user feedback
    toast.error("Cannot delete the only version");
    return;
  }
  
  setLoadingAction(`delete-${versionId}`);
  try {
    await onDeleteVersion(versionId);
    setSelectedVersion(null);
    toast.success('Version deleted successfully');
  } catch (error) {
    console.error('Error deleting version:', error);
    toast.error(error.message || 'Failed to delete version');
  } finally {
    setLoadingAction(null);
  }
}, [onDeleteVersion, versions.length]);

  const exportVersion = useCallback((version, format = 'docx') => {
    if (!version || !version.content) return
    
    try {
      const cleanContent = version.content.replace(/<[^>]*>/g, "").trim()
      const fileName = version.label?.replace(/[^a-z0-9]/gi, '_') || 'essay_version'
      
      if (format === 'pdf') {
        const pdfContent = `
Essay Version Export
${'='.repeat(80)}

Title: ${version.label || 'Essay Version'}
Date: ${new Date(version.timestamp).toLocaleString()}
Word Count: ${getWordCount(version.content)}

${'='.repeat(80)}

${cleanContent}

${'='.repeat(80)}
End of Document
        `.trim()
        
        const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'docx') {
        const docxContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${version.label || 'Essay Version'}</title>
  <style>
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 12pt; 
      line-height: 1.6; 
      margin: 1in; 
      max-width: 8.5in;
    }
    h1 { 
      font-size: 18pt; 
      font-weight: bold; 
      margin-bottom: 0.3in; 
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 0.2in;
    }
    .metadata { 
      color: #666; 
      font-size: 10pt; 
      margin-bottom: 0.5in; 
      text-align: center;
      font-style: italic;
    }
    .content p { 
      text-align: justify; 
      margin-bottom: 0.15in; 
      text-indent: 0.5in; 
    }
    .footer {
      margin-top: 0.5in;
      padding-top: 0.2in;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${version.label || 'Essay Version'}</h1>
  <div class="metadata">
    <p>Saved: ${new Date(version.timestamp).toLocaleString()}</p>
    <p>Word Count: ${getWordCount(version.content)} words</p>
  </div>
  <div class="content">
    ${cleanContent.split('\n\n').map(para => `<p>${para}</p>`).join('\n')}
  </div>
  <div class="footer">
    <p>Exported from Essay Workspace</p>
  </div>
</body>
</html>
        `.trim()
        
        const blob = new Blob([docxContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      setShowExportMenu(null)
    } catch (error) {
      console.error('Error exporting version:', error)
    }
  }, [getWordCount])

  const getContentPreview = useCallback((content, maxLength = 150) => {
    if (!content) return ''
    
    const plainText = content.replace(/<[^>]*>/g, "").trim()
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + "..."
      : plainText
  }, [])

  const sortedVersions = versions
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return dateB.getTime() - dateA.getTime()
    })

  const stats = {
    total: versions.length,
    autoSaves: versions.filter(v => v.isAutoSave).length,
    manualSaves: versions.filter(v => !v.isAutoSave).length,
    averageWords: versions.length > 0 
      ? Math.round(versions.reduce((sum, v) => sum + getWordCount(v.content), 0) / versions.length)
      : 0
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/70 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base truncate">Version History</h3>
              <p className="text-xs text-white/80 truncate">Track your essay</p>
            </div>
          </div>
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 px-2.5 py-1 text-xs flex-shrink-0">
            {stats.total}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-white/80 mt-0.5">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{stats.autoSaves}</div>
            <div className="text-xs text-white/80 mt-0.5">Auto</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{stats.manualSaves}</div>
            <div className="text-xs text-white/80 mt-0.5">Manual</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-sm text-gray-600">Loading...</span>
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <GitBranch className="w-7 h-7 text-indigo-600" />
            </div>
            <h4 className="text-base font-semibold text-[#002147] mb-2">No Versions Yet</h4>
            <p className="text-sm text-[#6C7280] mb-3 px-4">Start writing to create your first version</p>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-indigo-100 text-left">
              <h5 className="text-xs font-semibold text-indigo-800 mb-2 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                Version Tips:
              </h5>
              <ul className="text-xs text-indigo-700 space-y-1">
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Auto-save every 25+ words</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Manual save for milestones</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Restore previous versions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Export as HTML or TXT</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {!isLoading && versions.length > 0 && (
          <div className="space-y-4">
            
            <div className="relative">
              <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#3598FE] to-transparent" />
              
              <div className="p-3 bg-gradient-to-r from-[#3598FE]/10 via-blue-50 to-indigo-50 border-2 border-[#3598FE]/30 rounded-xl shadow-sm">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#3598FE] to-[#2563EB] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-sm font-bold text-[#002147]">Current Draft</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-[#3598FE] rounded-full animate-pulse" />
                          <Badge className="bg-[#3598FE] text-white text-xs border-0 px-1.5 py-0">
                            Live
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-[#6C7280] mt-0.5 truncate">
                        {formatDate(new Date())}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-[#002147]">
                      {getWordCount(currentContent)}
                    </div>
                    <p className="text-xs text-[#6C7280]">words</p>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                    {getContentPreview(currentContent, 100)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#3598FE]/20">
                  <div className="flex items-center space-x-1.5 text-xs text-[#6C7280]">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Editing in progress</span>
                  </div>
                  
                  <div className="relative flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowExportMenu(showExportMenu === 'current' ? null : 'current')
                      }}
                      className="h-7 px-2 text-xs bg-white/50 text-[#3598FE] hover:bg-white hover:text-[#2563EB] border border-[#3598FE]/30"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                    
                    {showExportMenu === 'current' && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[140px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            exportVersion({ content: currentContent, label: 'Current_Draft', timestamp: new Date() }, 'docx')
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center space-x-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-xs">HTML</div>
                            <div className="text-gray-500 text-xs truncate">Open in Word</div>
                          </div>
                        </button>
                        <Separator className="my-0.5" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            exportVersion({ content: currentContent, label: 'Current_Draft', timestamp: new Date() }, 'pdf')
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center space-x-2"
                        >
                          <FileDown className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-xs">TXT</div>
                            <div className="text-gray-500 text-xs truncate">Plain text</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Separator className="flex-1" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Saved ({sortedVersions.length})
              </span>
              <Separator className="flex-1" />
            </div>

            <ScrollArea className="h-[380px] pr-2">
              <div className="space-y-2.5">
                {sortedVersions.map((version, index) => {
                  const isSelected = selectedVersion === version.id
                  const versionWordCount = getWordCount(version.content)
                  const currentWordCount = getWordCount(currentContent)
                  const wordDiff = versionWordCount - currentWordCount
                  
                  return (
                    <div
                      key={version.id}
                      className={`relative group transition-all duration-200 ${
                        isSelected ? "ring-2 ring-indigo-500" : ""
                      }`}
                    >
                      {index < sortedVersions.length - 1 && (
                        <div className="absolute left-[16px] top-11 bottom-[-10px] w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
                      )}
                      
                      <div
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg"
                            : "border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white"
                        }`}
                      >
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                              version.isAutoSave 
                                ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                                : 'bg-gradient-to-br from-green-400 to-green-600'
                            }`}>
                              <Save className="w-4 h-4 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-[#002147] truncate">
                                    {version.label || `Version ${sortedVersions.length - index}`}
                                  </span>
                                  {version.isAutoSave && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs border-0 px-1.5 py-0 flex-shrink-0">
                                      Auto
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs font-semibold text-[#002147]">
                                    {versionWordCount}
                                  </div>
                                  <p className="text-xs text-[#6C7280]">words</p>
                                </div>
                              </div>

                              <p className="text-xs text-[#6C7280] mb-1.5 truncate">
                                {getTimeDifference(version.timestamp)} • {formatDate(version.timestamp)}
                              </p>

                              {!isSelected && (
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                  {getContentPreview(version.content, 80)}
                                </p>
                              )}

                              {wordDiff !== 0 && (
                                <div className="mt-1.5 flex items-center">
                                  <Badge className={`text-xs px-1.5 py-0 ${
                                    wordDiff > 0 
                                      ? 'bg-green-100 text-green-700 border-green-200' 
                                      : 'bg-red-100 text-red-700 border-red-200'
                                  }`}>
                                    {wordDiff > 0 ? '+' : ''}{wordDiff}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="flex-shrink-0">
                              {isSelected ? (
                                <ChevronUp className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="border-t border-gray-200">
                            <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestoreVersion(version.id)
                                  }}
                                  disabled={loadingAction === `restore-${version.id}`}
                                  className="h-8 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                >
                                  {loadingAction === `restore-${version.id}` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  ) : (
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Restore
                                </Button>

                                <div className="relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowExportMenu(showExportMenu === version.id ? null : version.id)
                                    }}
                                    className="h-8 w-full text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    Export
                                  </Button>
                                  
                                  {showExportMenu === version.id && (
                                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          exportVersion(version, 'docx')
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center space-x-2"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                        <div>
                                          <div className="font-medium text-gray-900">HTML</div>
                                        </div>
                                      </button>
                                      <Separator className="my-0.5" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          exportVersion(version, 'pdf')
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center space-x-2"
                                      >
                                        <FileDown className="w-3.5 h-3.5 text-red-600" />
                                        <div>
                                          <div className="font-medium text-gray-900">TXT</div>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {onDeleteVersion && versions.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete "${version.label}"?`)) {
                                      handleDeleteVersion(version.id)
                                    }
                                  }}
                                  disabled={loadingAction === `delete-${version.id}`}
                                  className="h-7 w-full mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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

                            <div className="p-3 bg-white">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <h5 className="text-xs font-semibold text-gray-700 uppercase">
                                  Preview
                                </h5>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {versionWordCount}w
                                </Badge>
                              </div>
                              
                              <div className="bg-gray-50 rounded-lg p-2.5 max-h-40 overflow-y-auto border border-gray-200">
                                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                  {version.content.replace(/<[^>]*>/g, "")}
                                </p>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Chars:</span>
                                  <span className="font-medium">{version.content.replace(/<[^>]*>/g, "").length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Paras:</span>
                                  <span className="font-medium">{version.content.split('\n\n').filter(p => p.trim()).length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center">
                <GitBranch className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Statistics
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total</span>
                    <span className="text-xs font-bold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Auto</span>
                    <span className="text-xs font-semibold text-blue-600">{stats.autoSaves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Manual</span>
                    <span className="text-xs font-semibold text-green-600">{stats.manualSaves}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Avg</span>
                    <span className="text-xs font-bold text-gray-900">{stats.averageWords}w</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Latest</span>
                    <span className="text-xs font-semibold text-purple-600 truncate">
                      {sortedVersions.length > 0 ? getTimeDifference(sortedVersions[0].timestamp) : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">First</span>
                    <span className="text-xs font-semibold text-gray-600 truncate">
                      {sortedVersions.length > 0 ? getTimeDifference(sortedVersions[sortedVersions.length - 1].timestamp) : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {sortedVersions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">Timeline</span>
                    <span className="text-xs text-gray-500 truncate ml-2">
                      {sortedVersions[sortedVersions.length - 1] && new Date(sortedVersions[sortedVersions.length - 1].timestamp).toLocaleDateString()} → Today
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>Start</span>
                    <span className="truncate mx-2">{stats.total} ver.</span>
                    <span>Now</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-200">
              <h5 className="text-xs font-semibold text-indigo-900 mb-2 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                Pro Tips
              </h5>
              <div className="space-y-1.5">
                <div className="flex items-start space-x-1.5">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    <strong>Save before edits:</strong> Create manual versions before big changes
                  </p>
                </div>
                <div className="flex items-start space-x-1.5">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    <strong>Label clearly:</strong> Use names like "First Draft" or "After Feedback"
                  </p>
                </div>
                <div className="flex items-start space-x-1.5">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    <strong>Export regularly:</strong> Download important versions as backup
                  </p>
                </div>
                <div className="flex items-start space-x-1.5">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    <strong>Compare versions:</strong> Click to preview and compare with current
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}