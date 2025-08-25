"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  MessageSquare,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar,
  Video,
  BookOpen,
  Plus,
  ExternalLink,
  X,
  CalendarDays,
  MapPin,
  Users,
  Timer,
  Archive,
  Target,
} from "lucide-react";

/**
 * ApplicationTabs component - Main application workspace with tabs for essays and tasks/events
 * Provides a comprehensive interface for managing university application materials
 * 
 * @param {Object} props - Component props
 * @param {Object} props.university - University data object containing name, deadlines, essays, and events
 * @returns {JSX.Element} Application workspace component with tabs and modals
 */
const ApplicationTabs = ({ university }) => {


  console.log('====================================');
  console.log("essay",university);
  console.log('====================================');
  const router = useRouter();
  
  // State management for component functionality
  const [essayContent, setEssayContent] = useState("");
  const [activeEssayId, setActiveEssayId] = useState(null);
  const [showWorkspacePopup, setShowWorkspacePopup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState("task");

  // Get essay prompts from university data or use fallback
  const essayPrompts = university?.essayPrompts || [
    {
      id: 1,
      title: "Essay A: What matters most to you, and why?",
      wordLimit: 750,
      status: "in-progress",
      progress: 65,
      content: "What matters most to you, and why?",
      wordCount: 487
    },
    {
      id: 2,
      title: `Essay B: Why ${university?.name || 'this university'}? How does it align with your goals?`,
      wordLimit: 650,
      status: "not-started",
      progress: 0,
      content: "",
      wordCount: 0
    },
  ];

  // Get tasks and events from university data or use fallback
  const tasksAndEvents = university?.tasksAndEvents || [
    {
      id: 1,
      type: "task",
      task: "Submit GMAT Scores",
      date: "2025-04-05",
      status: "pending",
      priority: "high",
      daysLeft: 15,
    },
    {
      id: 2,
      type: "task", 
      task: "Complete Essays",
      date: "2025-04-07",
      status: "in-progress",
      priority: "high",
      daysLeft: 17,
    },
    {
      id: 3,
      type: "event",
      task: `${university?.name || 'University'} Info Session`,
      date: "2025-04-06",
      time: "2:00 PM - 4:00 PM",
      location: "Virtual",
      status: "upcoming",
      priority: "medium",
      daysLeft: 16,
    },
    {
      id: 4,
      type: "task",
      task: "Request Recommendations", 
      date: "2025-04-06",
      status: "completed",
      priority: "medium",
      daysLeft: 16,
    },
    {
      id: 5,
      type: "event",
      task: `${university?.name || 'University'} Application Deadline`,
      date: university?.averageDeadlines
        ? university.averageDeadlines.split(",")[0].trim()
        : "2025-04-15",
      time: "11:59 PM",
      status: "upcoming",
      priority: "high",
      daysLeft: 18,
    },
  ];

  // Initialize essay content for the first essay
  React.useEffect(() => {
    if (essayPrompts.length > 0 && !essayContent) {
      const firstEssay = essayPrompts[0];
      setEssayContent(firstEssay.content || firstEssay.text || "");
      setActiveEssayId(firstEssay.id);
    }
  }, [essayPrompts]);

  /**
   * Opens the add modal with specified type (task or event)
   * @param {string} type - The type of item to add ('task' or 'event')
   */
  const openAddModal = (type) => {
    setAddModalType(type);
    setShowAddModal(true);
  };

  /**
   * Handles workspace redirection and closes the popup
   * Opens the workspace in a new browser tab
   */
  const handleWorkspaceRedirect = () => {
    setShowWorkspacePopup(false);
    window.open("/workspace", "_blank");
  };

  /**
   * Handles calendar redirection for adding events
   */
  const handleCalendarRedirect = () => {
    router.push("/calendar");
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get status color classes for tasks and events
   */
  const getStatusColors = (status, priority = 'medium') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
      case 'missed':
        return 'bg-red-100 text-red-700';
      case 'due-today':
      case 'today':
        return 'bg-orange-100 text-orange-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'upcoming':
      default:
        return priority === 'high' 
          ? 'bg-red-100 text-red-700'
          : priority === 'medium'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700';
    }
  };

  /**
   * Get icon for task/event type
   */
  const getItemIcon = (item) => {
    if (item.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (item.type === 'event') {
      return <CalendarDays className="h-5 w-5 text-purple-600" />;
    }
    
    // Task icons based on priority
    return (
      <Calendar
        className={`h-5 w-5 ${
          item.priority === "high"
            ? "text-red-600"
            : item.priority === "medium"
            ? "text-yellow-600"
            : "text-blue-600"
        }`}
      />
    );
  };

  /**
   * Calculate completion percentage for application
   */
  const calculateCompletionPercentage = () => {
    if (!essayPrompts.length && !tasksAndEvents.length) return 0;
    
    const completedEssays = essayPrompts.filter(essay => 
      essay.status === 'submitted' || essay.progress >= 100
    ).length;
    
    const completedTasks = tasksAndEvents.filter(item => 
      item.status === 'completed'
    ).length;
    
    const totalItems = essayPrompts.length + tasksAndEvents.filter(item => item.type === 'task').length;
    
    if (totalItems === 0) return 0;
    
    return Math.round(((completedEssays + completedTasks) / totalItems) * 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="my-20">
      {/* Main Application Workspace Card */}
      <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section with Application Progress */}
          <div className="bg-[#002147] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-1 h-8 bg-white rounded-full mr-4 opacity-80"></div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Application Workspace
                  </h2>
                </div>
                <p className="text-white text-sm font-medium">
                  Your personalized application center for {university?.name || 'this university'}
                </p>
              </div>

              {/* Progress Indicator Section */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-white font-semibold">
                    Application Progress
                  </div>
                  <div className="text-white">{completionPercentage}% Complete</div>
                </div>

                {/* Circular Progress SVG */}
                <div className="w-16 h-16 relative">
                  <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray={`${completionPercentage}, 100`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{completionPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area with Tabs */}
          <div className="p-6 space-y-8">
            <Tabs defaultValue="essays" className="w-full">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-xl border border-gray-100 h-14">
                <TabsTrigger
                  value="essays"
                  className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-12 font-semibold"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Essay Workspace</span>
                  <span className="sm:hidden">Essays</span>
                </TabsTrigger>

                <TabsTrigger
                  value="deadlines"
                  className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-12 font-semibold"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Tasks & Events</span>
                  <span className="sm:hidden">Tasks</span>
                </TabsTrigger>
              </TabsList>

              {/* Essays Tab Content */}
              <TabsContent value="essays" className="mt-8">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-white">
                      Essay Prompts
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-white">
                        <Save className="h-4 w-4" />
                        <span>Draft saved 2 hours ago</span>
                      </div>
                      <Button
                        onClick={() => setShowWorkspacePopup(true)}
                        className="bg-[#3598FE] hover:bg-[#2485ed] text-white hover:shadow-lg transition-all duration-300"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Access All Essays
                      </Button>
                    </div>
                  </div>

                  {/* Essay Prompts List */}
                  <div className="space-y-6">
                    {essayPrompts.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">No Essay Prompts Available</h4>
                        <p className="text-gray-300">
                          Essay prompts will appear here when they become available for this university.
                        </p>
                      </div>
                    ) : (
                      essayPrompts.map((prompt, index) => (
                        <div
                          key={prompt.id}
                          className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                            <h4 className="font-bold text-[#002147] text-lg">
                              {prompt.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-500">
                                {prompt.wordLimit} words max
                              </span>
                              <div
                                className={`flex items-center px-3 py-1 rounded-full ${
                                  prompt.status === "in-progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : prompt.status === "submitted"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {prompt.status === "in-progress" ? (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                ) : prompt.status === "submitted" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {prompt.status.replace("-", " ")}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{prompt.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#002147] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${prompt.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Essay Textarea (only for first essay or active essay) */}
                          {(index === 0 || activeEssayId === prompt.id) && (
                            <>
                              <textarea
                                className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#3598FE] focus:border-transparent transition-all duration-300 bg-white"
                                placeholder="Start writing your essay here..."
                                value={activeEssayId === prompt.id ? essayContent : prompt.content || ""}
                                onChange={(e) => {
                                  if (activeEssayId === prompt.id) {
                                    setEssayContent(e.target.value);
                                  }
                                }}
                                onFocus={() => setActiveEssayId(prompt.id)}
                              />
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                                <span className="text-sm text-gray-500">
                                  {
                                    (activeEssayId === prompt.id ? essayContent : prompt.content || "")
                                      .split(" ")
                                      .filter((word) => word.length > 0).length
                                  }{" "}
                                  / {prompt.wordLimit} words
                                </span>
                                <div className="flex space-x-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white"
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload Draft
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-[#3598FE] hover:bg-[#2485ed] text-white hover:shadow-lg transition-all duration-300"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save Draft
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tasks & Events Tab Content */}
              <TabsContent value="deadlines" className="mt-8">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-white">
                      Tasks & Events
                    </h3>
                    <div className="flex space-x-3">
                      {/* Add Calendar Event Button - Only show if no events from this university */}
                      {university?.calendarEvents?.length === 0 && (
                        <Button
                          onClick={handleCalendarRedirect}
                          className="bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg transition-all duration-300"
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Add to Calendar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tasks & Events List */}
                  <div className="grid gap-4">
                    {tasksAndEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">No Tasks or Events</h4>
                        <p className="text-gray-300 mb-6">
                          Your application tasks and events will appear here.
                        </p>
                        <Button
                          onClick={handleCalendarRedirect}
                          className="bg-[#3598FE] hover:bg-[#2485ed] text-white hover:shadow-lg transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Event
                        </Button>
                      </div>
                    ) : (
                      tasksAndEvents.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-3 rounded-xl ${
                                item.status === "completed"
                                  ? "bg-green-100"
                                  : item.type === "event"
                                  ? "bg-purple-100"
                                  : item.priority === "high"
                                  ? "bg-red-100"
                                  : item.priority === "medium"
                                  ? "bg-yellow-100"
                                  : "bg-blue-100"
                              }`}
                            >
                              {getItemIcon(item)}
                            </div>

                            <div>
                              <div className="font-bold text-[#002147] text-lg flex items-center space-x-2">
                                <span>{item.task}</span>
                                {item.type === "event" && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    EVENT
                                  </span>
                                )}
                                {item.deadlineType && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {item.deadlineType.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-4">
                                <span>{formatDate(item.date)}</span>
                                {item.time && <span>• {item.time}</span>}
                                {item.location && (
                                  <span className="flex items-center">
                                    • <MapPin className="h-3 w-3 mr-1" /> {item.location}
                                  </span>
                                )}
                                {item.description && (
                                  <span className="flex items-center">
                                    • <MessageSquare className="h-3 w-3 mr-1" /> {item.description.substring(0, 50)}...
                                  </span>
                                )}

                                {item.status !== "completed" && item.daysLeft !== undefined && (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.daysLeft <= 0
                                        ? "bg-red-100 text-red-700"
                                        : item.daysLeft <= 7
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    <Timer className="h-3 w-3 mr-1 inline" />
                                    {item.daysLeft === 0 
                                      ? "Due today" 
                                      : item.daysLeft < 0 
                                      ? `${Math.abs(item.daysLeft)} days overdue`
                                      : `${item.daysLeft} days left`
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-4 py-2 text-sm rounded-full font-medium ${getStatusColors(item.status, item.priority)}`}
                          >
                            {item.status === "completed" && <CheckCircle className="h-4 w-4 mr-1 inline" />}
                            {item.status === "overdue" && <AlertCircle className="h-4 w-4 mr-1 inline" />}
                            {item.status.replace("-", " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="flex-1 bg-[#3598FE] text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] text-center">
                Save All Progress
              </button>
              <button className="flex-1 border-2 border-white text-white py-4 px-6 rounded-xl font-semibold bg-transparent hover:bg-white hover:text-[#002147] transition-all duration-300 hover:scale-[1.02] text-center">
                Export Application
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Access Popup Modal */}
      {showWorkspacePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#3598FE] rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#002147] mb-2">
                Access Essay Workspace
              </h3>
              <p className="text-gray-600">
                You're about to access your comprehensive essay workspace for{" "}
                {university?.name || 'this university'}.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowWorkspacePopup(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleWorkspaceRedirect}
                className="flex-1 bg-[#3598FE] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#2485ed] hover:shadow-lg transition-all duration-300"
              >
                Go to Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task/Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#002147]">
                Add New {addModalType === "task" ? "Task" : "Event"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {addModalType === "task" ? "Task" : "Event"} Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
                  placeholder={`Enter ${addModalType} name...`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
                  />
                </div>

                {addModalType === "event" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {addModalType === "event" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent"
                    placeholder="Enter location or 'Virtual'..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 ${
                  addModalType === "task"
                    ? "bg-[#3598FE] hover:bg-[#2485ed]"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Add {addModalType === "task" ? "Task" : "Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTabs;