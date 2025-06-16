"use client"

import React, { useState } from 'react';

// UI Components from your design system
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Icons used throughout the UI
import {
  FileText, Clock, MessageSquare, Save, Upload,
  CheckCircle, AlertCircle, Calendar, Video, BookOpen
} from 'lucide-react';

const ApplicationTabs = () => {
  // State to hold the content of the essay textarea
  const [essayContent, setEssayContent] = useState("What matters most to you, and why?");

  // Static essay prompts with progress and word limits
  const essayPrompts = [
    {
      title: "Essay A: What matters most to you, and why?",
      wordLimit: 750,
      status: "in-progress",
      progress: 65
    },
    {
      title: "Essay B: Why Stanford? How does Stanford align with your goals?",
      wordLimit: 650,
      status: "not-started",
      progress: 0
    }
  ];

  return (
    <div className="my-20">
      <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <CardContent className="p-0">
          
          {/* 🔷 Premium Header Section */}
          <div className="bg-[#002147] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-1 h-8 bg-white rounded-full mr-4 opacity-80"></div>
                  <h2 className="text-2xl font-semibold tracking-tight">Application Workspace</h2>
                </div>
                <p className="text-white text-sm font-medium">Your personalized application center</p>
              </div>

              {/* 📊 Progress Circle – Only visible on medium+ screens */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-white font-semibold">Application Progress</div>
                  <div className="text-white">65% Complete</div>
                </div>

                {/* Circular progress bar using SVG */}
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    {/* Foreground Progress (65%) */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray="65, 100"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔽 Tabs Section */}
          <div className="p-6 space-y-8">
            <Tabs defaultValue="essays" className="w-full">

              {/* Tabs Header */}
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-xl border border-gray-200 h-14">
                
                {/* Essay Tab */}
                <TabsTrigger 
                  value="essays" 
                  className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-12 font-semibold"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Essay Workspace</span>
                  <span className="sm:hidden">Essays</span>
                </TabsTrigger>

                {/* Tasks & Deadlines Tab */}
                <TabsTrigger 
                  value="deadlines"
                  className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-12 font-semibold"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Tasks & Deadlines</span>
                  <span className="sm:hidden">Tasks</span>
                </TabsTrigger>

                {/* Interview Prep Tab */}
                <TabsTrigger 
                  value="interview"
                  className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-12 font-semibold"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Interview Prep</span>
                  <span className="sm:hidden">Interview</span>
                </TabsTrigger>
              </TabsList>

              {/* 📝 Essay Workspace Content */}
              <TabsContent value="essays" className="mt-8">
                <div className="space-y-6">

                  {/* Essay Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-white">Essay Prompts</h3>
                    <div className="flex items-center space-x-2 text-sm text-white">
                      <Save className="h-4 w-4" />
                      <span>Draft saved 2 hours ago</span>
                    </div>
                  </div>

                  {/* Mapping through each essay prompt */}
                  <div className="space-y-6">
                    {essayPrompts.map((prompt, index) => (
                      <div key={index} className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">

                        {/* Essay title and status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                          <h4 className="font-bold text-[#002147] text-lg">{prompt.title}</h4>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">{prompt.wordLimit} words max</span>
                            <div className={`flex items-center px-3 py-1 rounded-full ${
                              prompt.status === 'in-progress' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {/* Icon depends on status */}
                              {prompt.status === 'in-progress' ? (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {prompt.status.replace('-', ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Essay Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{prompt.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#002147] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${prompt.progress}%` }} // Dynamic width
                            ></div>
                          </div>
                        </div>

                        {/* First prompt only has a textarea input */}
                        {index === 0 && (
                          <>
                            <textarea 
                              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#3598FE] focus:border-transparent transition-all duration-300 bg-white"
                              placeholder="Start writing your essay here..."
                              value={essayContent}
                              onChange={(e) => setEssayContent(e.target.value)}
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                              <span className="text-sm text-gray-500">
                                {
                                  // Word count calculation (excluding empty strings)
                                  essayContent.split(' ').filter(word => word.length > 0).length
                                } / {prompt.wordLimit} words
                              </span>
                              <div className="flex space-x-3">
                                <Button size="sm" variant="outline" className="border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white">
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload Draft
                                </Button>
                                <Button size="sm" className="bg-[#3598FE] hover:bg-[#2485ed] text-white hover:shadow-lg transition-all duration-300">
                                  <Save className="h-3 w-3 mr-1" />
                                  Save Draft
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* 📅 Deadlines & Tasks Section */}
              <TabsContent value="deadlines" className="mt-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white">Upcoming Deadlines</h3>

                  <div className="grid gap-4">
                    {[
                      { task: "Submit GMAT Scores", date: "Apr 5, 2025", status: "pending", priority: "high", daysLeft: 15 },
                      { task: "Complete Essays", date: "Apr 7, 2025", status: "in-progress", priority: "high", daysLeft: 17 },
                      { task: "Request Recommendations", date: "Apr 6, 2025", status: "completed", priority: "medium", daysLeft: 16 },
                      { task: "Final Application Review", date: "Apr 8, 2025", status: "pending", priority: "low", daysLeft: 18 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">

                        {/* Icon depending on status and priority */}
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${
                            item.status === 'completed' ? 'bg-green-100' :
                            item.priority === 'high' ? 'bg-red-100' :
                            item.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            {item.status === 'completed' ? (
                              <CheckCircle className={`h-5 w-5 text-green-600`} />
                            ) : (
                              <Calendar className={`h-5 w-5 ${
                                item.priority === 'high' ? 'text-red-600' :
                                item.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                            )}
                          </div>

                          {/* Task details */}
                          <div>
                            <div className="font-bold text-[#002147] text-lg">{item.task}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4">
                              <span>{item.date}</span>

                              {/* Days left only shown if not completed */}
                              {item.status !== 'completed' && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item.daysLeft} days left
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`px-4 py-2 text-sm rounded-full font-medium ${
                          item.status === 'completed' ? 'bg-green-100 text-green-700' :
                          item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* 🎤 Interview Prep Section */}
              <TabsContent value="interview" className="mt-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white">Interview Preparation</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Common Questions Card */}
                    <div className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-[#002147] rounded-xl mr-4">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-[#002147] text-lg">Common Questions</h4>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">Practice answers to frequently asked questions and improve your confidence</p>
                      <Button className="w-full bg-[#3598FE] hover:bg-[#2485ed] text-white hover:shadow-lg transition-all duration-300">
                        Start Practice Session
                      </Button>
                    </div>

                    {/* Mock Interview Card */}
                    <div className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-[#002147] rounded-xl mr-4">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-[#002147] text-lg">Mock Interview</h4>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">Schedule a practice session with our admissions experts</p>
                      <Button variant="outline" className="w-full border-2 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white transition-all duration-300">
                        Schedule Session
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* ⚡ Quick Action Buttons */}
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
    </div>
  );
};

export default ApplicationTabs;
