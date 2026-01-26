"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useCVData } from "@/lib/constants/CVDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Plus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Check,
  AlertCircle,
  Trash2,
  Copy,
  HelpCircle,
  Calendar,
  Building2,
  MapPin,
  Users,
  Target,
  HandHeart,
  Trophy,
  Globe,
  Megaphone,
} from "lucide-react";

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-md" />,
});

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const quillFormats = ["bold", "italic", "underline", "list"];

const volunteerTemplates = [
  {
    organization: "Non-Profit Organization",
    role: "Board Member / Volunteer Leader",
    description:
      "<ul><li>Led strategic initiatives and fundraising campaigns</li><li>Managed team of volunteers and coordinated events</li></ul>",
    impact:
      "<ul><li>Raised $X for community programs</li><li>Impacted X+ beneficiaries through initiatives</li></ul>",
  },
  {
    organization: "Professional Association",
    role: "Committee Chair / Member",
    description:
      "<ul><li>Organized industry events and networking sessions</li><li>Mentored junior professionals in the field</li></ul>",
    impact:
      "<ul><li>Grew membership by X%</li><li>Hosted events with X+ attendees</li></ul>",
  },
  {
    organization: "Community Service Organization",
    role: "Volunteer Coordinator",
    description:
      "<ul><li>Coordinated volunteer activities and community outreach</li><li>Built partnerships with local businesses and organizations</li></ul>",
    impact:
      "<ul><li>Recruited and trained X+ volunteers</li><li>Served X+ community members</li></ul>",
  },
  {
    organization: "Alumni Association",
    role: "Alumni Ambassador / Mentor",
    description:
      "<ul><li>Mentored current students and recent graduates</li><li>Represented alma mater at recruitment events</li></ul>",
    impact:
      "<ul><li>Mentored X+ students/alumni</li><li>Contributed to X% increase in engagement</li></ul>",
  },
];

export const VolunteerForm = () => {
  const { cvData, updateCVData } = useCVData();
  const experiences = cvData.volunteer || [];
  const [expandedCards, setExpandedCards] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const calculateCompletion = () => {
    if (experiences.length === 0) return 0;
    const filledExperiences = experiences.filter(
      (exp) => exp.organization && exp.role
    );
    return Math.round((filledExperiences.length / experiences.length) * 100);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addExperience = (template = null) => {
    const newExperience = {
      id: Date.now().toString(),
      organization: template?.organization || "",
      role: template?.role || "",
      location: "",
      startDate: "",
      endDate: "",
      description: template?.description || "",
      impact: template?.impact || "",
    };
    updateCVData("volunteer", [...experiences, newExperience]);
    setExpandedCards((prev) => ({ ...prev, [newExperience.id]: true }));
    setShowTemplates(false);
  };

  const duplicateExperience = (experience) => {
    const newExperience = {
      ...experience,
      id: Date.now().toString(),
      organization: `${experience.organization} (Copy)`,
    };
    updateCVData("volunteer", [...experiences, newExperience]);
  };

  const removeExperience = (id) => {
    updateCVData(
      "volunteer",
      experiences.filter((exp) => exp.id !== id)
    );
  };

  const updateExperience = (id, field, value) => {
    updateCVData(
      "volunteer",
      experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const completion = calculateCompletion();

  return (
    <>
      <style jsx global>{`
        .prose-editor .ql-container {
          font-family: inherit;
          font-size: 14px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }
        .prose-editor .ql-toolbar {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          background: #f9fafb;
        }
        .prose-editor .ql-editor {
          min-height: 120px;
        }
        .prose-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .cv-heading {
          color: #1f2937;
        }
        .cv-body {
          color: #6b7280;
        }
        .cv-border {
          border-color: #e5e7eb;
        }
        .cv-light-bg {
          background-color: #f9fafb;
        }
        .cv-accent {
          background-color: #ec4899;
        }
        .cv-accent-hover:hover {
          background-color: #db2777;
        }
      `}</style>
      
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-xl p-6 border border-rose-500/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold cv-heading">
                    Volunteer & Extracurricular
                  </h2>
                  <p className="cv-body text-sm mt-1">
                    Showcase your community involvement and leadership outside work
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="w-4 h-4 text-cvBody" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">
                    MBA programs value well-rounded candidates. Highlight leadership
                    roles, community impact, and activities that show your values.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="cv-body">Section Completion</span>
                <span className="font-medium cv-heading">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
              <div className="flex items-center gap-2 text-xs cv-body">
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                <span>
                  Tip: Include activities that demonstrate leadership, teamwork, and
                  social responsibility
                </span>
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <Card className="border-cvBorder border-dashed bg-cvLightBg/30">
            <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-cvLightBg/50 transition-colors rounded-t-lg py-3">
                  <CardTitle className="flex items-center justify-between text-base cv-heading">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      <span>Activities MBA Programs Value</span>
                      <Badge variant="secondary" className="text-xs">
                        {volunteerTemplates.length} templates
                      </Badge>
                    </div>
                    {showTemplates ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {volunteerTemplates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => addExperience(template)}
                      className="justify-start h-auto py-3 px-4 border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center mr-3 shrink-0">
                        <Heart className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm cv-heading truncate">
                          {template.role}
                        </p>
                        <p className="text-xs cv-body truncate">
                          {template.organization}
                        </p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Volunteer Cards */}
          <div className="space-y-4">
            {experiences.map((experience, index) => {
              const isExpanded = expandedCards[experience.id] !== false;
              const isComplete = experience.organization && experience.role;

              return (
                <Card
                  key={experience.id}
                  className={`border-cvBorder transition-all duration-200 ${
                    isExpanded ? "shadow-md" : "shadow-sm"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-rose-600" />
                      </div>

                      {/* Experience Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold cv-heading truncate">
                            {experience.organization || `Activity ${index + 1}`}
                          </span>
                          {isComplete && (
                            <Badge
                              variant="outline"
                              className="border-green-500 text-green-600 shrink-0"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm cv-body mt-0.5">
                          {experience.role && (
                            <span className="truncate">{experience.role}</span>
                          )}
                          {experience.startDate && (
                            <>
                              <span className="text-cvBorder">•</span>
                              <span>
                                {formatDate(experience.startDate)}
                                {experience.endDate
                                  ? ` - ${formatDate(experience.endDate)}`
                                  : " - Present"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => duplicateExperience(experience)}
                            >
                              <Copy className="w-4 h-4 text-cvBody" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleCardExpansion(experience.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>

                        {experiences.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "
                                  {experience.organization || "this activity"}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeExperience(experience.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-5 pt-0 border-t border-cvBorder/50">
                      <div className="pt-4 space-y-5">
                        {/* Organization & Role Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="cv-heading text-sm flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-cvBody" />
                              Organization/Club
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={experience.organization}
                              onChange={(e) =>
                                updateExperience(
                                  experience.id,
                                  "organization",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Red Cross, Habitat for Humanity"
                              className={`border-cvBorder focus:border-cvAccent ${
                                !experience.organization ? "border-orange-300" : ""
                              }`}
                            />
                            {!experience.organization && (
                              <p className="text-xs text-orange-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Organization name is required
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="cv-heading text-sm flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-cvBody" />
                              Role/Position
                            </Label>
                            <Input
                              value={experience.role}
                              onChange={(e) =>
                                updateExperience(experience.id, "role", e.target.value)
                              }
                              placeholder="e.g., Volunteer, Board Member, Team Lead"
                              className="border-cvBorder focus:border-cvAccent"
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-cvBody" />
                            Location
                          </Label>
                          <Input
                            value={experience.location}
                            onChange={(e) =>
                              updateExperience(experience.id, "location", e.target.value)
                            }
                            placeholder="e.g., Local Food Bank, University Campus"
                            className="border-cvBorder focus:border-cvAccent"
                          />
                        </div>

                        {/* Dates Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="cv-heading text-sm flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-cvBody" />
                              Start Date
                            </Label>
                            <Input
                              type="month"
                              value={experience.startDate}
                              onChange={(e) =>
                                updateExperience(
                                  experience.id,
                                  "startDate",
                                  e.target.value
                                )
                              }
                              className="border-cvBorder focus:border-cvAccent"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="cv-heading text-sm flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-cvBody" />
                              End Date
                            </Label>
                            <Input
                              type="month"
                              value={experience.endDate}
                              onChange={(e) =>
                                updateExperience(experience.id, "endDate", e.target.value)
                              }
                              className="border-cvBorder focus:border-cvAccent"
                            />
                          </div>
                        </div>

                        {/* Rich Text Description */}
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <HandHeart className="w-3.5 h-3.5 text-cvBody" />
                            Activities & Responsibilities
                          </Label>
                          <div className="prose-editor">
                            <ReactQuill
                              theme="snow"
                              value={experience.description || ""}
                              onChange={(value) =>
                                updateExperience(experience.id, "description", value)
                              }
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="• Describe your role and key activities&#10;• Highlight leadership responsibilities&#10;• Mention team collaboration and initiatives"
                              className="bg-white rounded-md"
                            />
                          </div>
                        </div>

                        {/* Rich Text Impact */}
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-cvBody" />
                            Impact & Achievements
                            <Badge variant="outline" className="text-xs font-normal">
                              Important
                            </Badge>
                          </Label>
                          <div className="prose-editor">
                            <ReactQuill
                              theme="snow"
                              value={experience.impact || ""}
                              onChange={(value) =>
                                updateExperience(experience.id, "impact", value)
                              }
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="• Number of people helped or impacted&#10;• Funds raised or resources mobilized&#10;• Events organized or initiatives launched"
                              className="bg-white rounded-md"
                            />
                          </div>
                          <p className="text-xs cv-body">
                            Quantify your impact whenever possible (e.g., "Raised $5,000",
                            "Mentored 15 students")
                          </p>
                        </div>

                        {/* Tips */}
                        <div className="bg-rose-50 rounded-lg p-4 space-y-2">
                          <p className="text-xs font-medium text-rose-900 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-rose-600" />
                            Making This Activity Stand Out for MBA
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-800">
                            <div className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Show leadership and initiative</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Quantify your community impact</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Highlight sustained commitment</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Connect to your values and goals</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {experiences.length === 0 && (
            <Card className="border-cvBorder border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="font-semibold cv-heading mb-2">
                  No Activities Added Yet
                </h3>
                <p className="text-sm cv-body mb-4 max-w-md mx-auto">
                  Add volunteer work, community involvement, and extracurricular
                  activities to show MBA programs you're a well-rounded leader.
                </p>
                <Button
                  onClick={() => addExperience()}
                  className="bg-cvAccent hover:bg-cvAccentHover text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Activity
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add Activity Button */}
          {experiences.length > 0 && (
            <Button
              onClick={() => addExperience()}
              variant="outline"
              className="w-full h-14 border-2 border-dashed border-cvAccent/50 text-cvAccent hover:bg-cvAccent hover:text-white transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Activity
            </Button>
          )}

          {/* Pro Tips */}
          <Card className="border-cvBorder bg-gradient-to-r from-rose-50 to-pink-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <HandHeart className="w-4 h-4 text-rose-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-rose-900">
                    Extracurricular Tips for MBA Applicants
                  </h4>
                  <ul className="text-sm text-rose-800 space-y-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Quality over quantity - deep involvement in 2-3 activities beats
                        superficial participation in many
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Show leadership progression - from member to leader over time
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Include diverse activities - professional, community, and personal
                        interests
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Demonstrate alignment with your stated values and MBA goals
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </>
  );
};