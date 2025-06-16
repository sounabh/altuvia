"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, FileText, Clock, Calendar, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react"

// Main component: SchoolSelector
export function SchoolSelector({
  schools,
  activeSchool,
  activeEssay,
  onSchoolChange,
  onEssayChange,
  onAddSchool,
}) {
  // Determine icon based on essay priority level
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-3 h-3 text-red-500" />
      case "medium":
        return <Clock className="w-3 h-3 text-amber-500" />
      case "low":
        return <CheckCircle2 className="w-3 h-3 text-green-500" />
      default:
        return <FileText className="w-3 h-3 text-gray-400" />
    }
  }

  // Determine essay progress level and related color
  const getCompletionStatus = (essay) => {
    const percentage = (essay.wordCount / essay.wordLimit) * 100

    if (percentage >= 100) return { status: "complete", color: "bg-green-500" }
    if (percentage >= 80) return { status: "near-complete", color: "bg-amber-500" }
    if (percentage >= 50) return { status: "in-progress", color: "bg-blue-500" }

    return { status: "started", color: "bg-gray-400" }
  }

  return (
    <div className="space-y-6">
      {/* Header: Title and Add School button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#002147]">Schools</h3>
          <p className="text-sm text-[#6C7280]">Manage your applications</p>
        </div>

        <Button
          onClick={onAddSchool}
          className="bg-gradient-to-r from-[#3598FE] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border-0 shadow-lg"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      {/* School Cards */}
      <div className="space-y-4">
        {schools.map((school) => {
          // Calculate overall essay progress for each school
          const totalWords = school.essays.reduce((acc, essay) => acc + essay.wordCount, 0)
          const totalWordLimit = school.essays.reduce((acc, essay) => acc + essay.wordLimit, 0)
          const overallProgress = totalWordLimit > 0 ? (totalWords / totalWordLimit) * 100 : 0

          return (
            <Card
              key={school.id}
              className={`p-5 cursor-pointer transition-all duration-300 hover:shadow-xl border-0 ${
                activeSchool === school.id
                  ? "ring-2 ring-[#3598FE] shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50"
                  : "hover:shadow-lg bg-white/70 backdrop-blur-sm"
              }`}
              onClick={() => onSchoolChange(school.id)}
            >
              <div className="flex items-start space-x-4">
                {/* Colored dot based on school color */}
                <div
                  className="w-4 h-4 rounded-full mt-2 flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: school.color }}
                />

                {/* School details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002147] text-sm leading-tight">{school.name}</h4>
                      <p className="text-xs text-[#6C7280] mt-1">{school.shortName}</p>
                    </div>

                    <Badge variant="outline" className="text-xs px-2 py-1 bg-white/50 border-gray-300">
                      {school.essays.length} essay{school.essays.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Optional description */}
                  {school.description && (
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">{school.description}</p>
                  )}

                  {/* Deadline and Fee info */}
                  <div className="flex items-center space-x-4 mb-3 text-xs text-[#6C7280]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{school.deadline}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{school.applicationFee}</span>
                    </div>
                  </div>

                  {/* School Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#002147]">Overall Progress</span>
                      <span className="text-xs text-[#6C7280]">{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-1.5" />
                  </div>

                  {/* Essay list under each school */}
                  <div className="space-y-2">
                    {school.essays.map((essay) => {
                      const completion = getCompletionStatus(essay)

                      return (
                        <div
                          key={essay.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            activeEssay === essay.id
                              ? "bg-[#3598FE] text-white shadow-md"
                              : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEssayChange(essay.id)
                          }}
                        >
                          {/* Essay title and priority status */}
                          <div className="flex items-center space-x-2 mb-2">
                            {getPriorityIcon(essay.priority)}
                            <span className="text-xs font-semibold truncate flex-1">{essay.title}</span>
                            <div className={`w-2 h-2 rounded-full ${completion.color}`} />
                          </div>

                          {/* Word count, version count, last edited */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs opacity-75">
                              {essay.wordCount}/{essay.wordLimit} words
                            </span>
                            <div className="flex items-center space-x-2">
                              {essay.versions.length > 0 && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-1.5 py-0 ${
                                    activeEssay === essay.id
                                      ? "bg-white/20 text-white border-white/30"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {essay.versions.length}v
                                </Badge>
                              )}
                              <Clock className="w-3 h-3 opacity-50" />
                            </div>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="mt-2">
                            <div
                              className={`w-full h-1 rounded-full overflow-hidden ${
                                activeEssay === essay.id ? "bg-white/20" : "bg-gray-200"
                              }`}
                            >
                              <div
                                className={`h-full transition-all duration-300 ${
                                  activeEssay === essay.id ? "bg-white" : completion.color
                                }`}
                                style={{ width: `${Math.min((essay.wordCount / essay.wordLimit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
