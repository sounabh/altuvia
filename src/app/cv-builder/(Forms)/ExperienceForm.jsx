// ExperienceForm.tsx
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useCVData } from "../page";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Briefcase,
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
  TrendingUp,
  Users,
  Target,
  Rocket,
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

const experienceTemplates = [
  {
    position: "Management Consultant",
    company: "",
    description:
      "<ul><li>Led client engagements delivering strategic recommendations</li><li>Managed cross-functional teams and stakeholder relationships</li><li>Drove measurable business impact through data-driven insights</li></ul>",
  },
  {
    position: "Investment Banking Analyst",
    company: "",
    description:
      "<ul><li>Executed M&A transactions and capital raising activities</li><li>Built financial models and conducted valuation analyses</li><li>Prepared client presentations and due diligence materials</li></ul>",
  },
  {
    position: "Product Manager",
    company: "",
    description:
      "<ul><li>Owned product roadmap and feature prioritization</li><li>Collaborated with engineering, design, and marketing teams</li><li>Launched features that drove user engagement and revenue growth</li></ul>",
  },
  {
    position: "Software Engineer",
    company: "",
    description:
      "<ul><li>Developed scalable applications serving millions of users</li><li>Led technical initiatives and mentored junior engineers</li><li>Improved system performance and reliability</li></ul>",
  },
];

export const ExperienceForm = () => {
  const { cvData, updateCVData } = useCVData();
  const experiences = cvData.experience || [];
  const [expandedCards, setExpandedCards] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const calculateCompletion = () => {
    if (experiences.length === 0) return 0;
    const filledExperiences = experiences.filter(
      (exp) => exp.company && exp.position
    );
    return Math.round((filledExperiences.length / experiences.length) * 100);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addExperience = (template = null) => {
    const newExperience = {
      id: Date.now().toString(),
      company: template?.company || "",
      position: template?.position || "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrentRole: false,
      description: template?.description || "",
    };
    updateCVData("experience", [...experiences, newExperience]);
    setExpandedCards((prev) => ({ ...prev, [newExperience.id]: true }));
    setShowTemplates(false);
  };

  const duplicateExperience = (experience) => {
    const newExperience = {
      ...experience,
      id: Date.now().toString(),
      company: `${experience.company} (Copy)`,
    };
    updateCVData("experience", [...experiences, newExperience]);
  };

  const removeExperience = (id) => {
    updateCVData(
      "experience",
      experiences.filter((exp) => exp.id !== id)
    );
  };

  const updateExperience = (id, field, value) => {
    const updated = experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateCVData("experience", updated);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const completion = calculateCompletion();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold cv-heading">Work Experience</h2>
                <p className="cv-body text-sm mt-1">
                  Showcase your professional journey and achievements
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
                  MBA programs value progressive career growth and leadership.
                  Highlight impact, team leadership, and quantifiable achievements.
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
                Tip: Focus on leadership, impact, and quantifiable results for MBA applications
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
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Common Pre-MBA Roles</span>
                    <Badge variant="secondary" className="text-xs">
                      {experienceTemplates.length} templates
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
                {experienceTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => addExperience(template)}
                    className="justify-start h-auto py-3 px-4 border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3 shrink-0">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm cv-heading truncate">
                        {template.position}
                      </p>
                      <p className="text-xs cv-body truncate">Click to use template</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Experience Cards */}
        <div className="space-y-4">
          {experiences.map((experience, index) => {
            const isExpanded = expandedCards[experience.id] !== false;
            const isComplete = experience.company && experience.position;

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
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                    </div>

                    {/* Experience Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold cv-heading truncate">
                          {experience.position || `Experience ${index + 1}`}
                        </span>
                        {experience.isCurrentRole && (
                          <Badge className="bg-emerald-100 text-emerald-700 shrink-0">
                            Current
                          </Badge>
                        )}
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
                        {experience.company && (
                          <span className="truncate">{experience.company}</span>
                        )}
                        {experience.startDate && (
                          <>
                            <span className="text-cvBorder">•</span>
                            <span>
                              {formatDate(experience.startDate)}
                              {experience.isCurrentRole
                                ? " - Present"
                                : experience.endDate
                                ? ` - ${formatDate(experience.endDate)}`
                                : ""}
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
                              <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "
                                {experience.position || "this experience"}".
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
                      {/* Company & Position Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-cvBody" />
                            Company Name
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={experience.company}
                            onChange={(e) =>
                              updateExperience(experience.id, "company", e.target.value)
                            }
                            placeholder="e.g., McKinsey & Company"
                            className={`border-cvBorder focus:border-cvAccent ${
                              !experience.company ? "border-orange-300" : ""
                            }`}
                          />
                          {!experience.company && (
                            <p className="text-xs text-orange-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Company name is required
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-cvBody" />
                            Job Title
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={experience.position}
                            onChange={(e) =>
                              updateExperience(experience.id, "position", e.target.value)
                            }
                            placeholder="e.g., Senior Consultant"
                            className={`border-cvBorder focus:border-cvAccent ${
                              !experience.position ? "border-orange-300" : ""
                            }`}
                          />
                          {!experience.position && (
                            <p className="text-xs text-orange-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Job title is required
                            </p>
                          )}
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
                          placeholder="e.g., New York, NY"
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
                              updateExperience(experience.id, "startDate", e.target.value)
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
                            disabled={experience.isCurrentRole}
                            className="border-cvBorder focus:border-cvAccent disabled:bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* Current Role Checkbox */}
                      <div className="flex items-center space-x-2 p-3 bg-cvLightBg rounded-lg">
                        <Checkbox
                          id={`current-${experience.id}`}
                          checked={experience.isCurrentRole}
                          onCheckedChange={(checked) =>
                            updateExperience(experience.id, "isCurrentRole", !!checked)
                          }
                        />
                        <Label
                          htmlFor={`current-${experience.id}`}
                          className="cv-body text-sm cursor-pointer"
                        >
                          I currently work here
                        </Label>
                      </div>

                      {/* Rich Text Description */}
                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          Job Description & Achievements
                          <Badge variant="outline" className="text-xs font-normal">
                            Important
                          </Badge>
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
                            placeholder="• Led cross-functional team of 8 members&#10;• Increased revenue by 25% through strategic initiatives&#10;• Managed $2M budget and delivered project ahead of schedule"
                            className="bg-white rounded-md"
                          />
                        </div>
                        <p className="text-xs cv-body">
                          Use bullet points and start with action verbs. Quantify achievements
                          when possible.
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                        <p className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                          What MBA Programs Look For in Experience
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-800">
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>Progressive career growth and promotions</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>Leadership and team management</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>Quantifiable business impact</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>Cross-functional collaboration</span>
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold cv-heading mb-2">No Experience Added Yet</h3>
              <p className="text-sm cv-body mb-4 max-w-md mx-auto">
                Add your professional experience to showcase your career journey and
                leadership potential.
              </p>
              <Button
                onClick={() => addExperience()}
                className="bg-cvAccent hover:bg-cvAccentHover text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your Experience
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Experience Button */}
        {experiences.length > 0 && (
          <Button
            onClick={() => addExperience()}
            variant="outline"
            className="w-full h-14 border-2 border-dashed border-cvAccent/50 text-cvAccent hover:bg-cvAccent hover:text-white transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Experience
          </Button>
        )}

        {/* Pro Tips */}
        <Card className="border-cvBorder bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-emerald-900">
                  Experience Tips for MBA Applicants
                </h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Most top MBA programs prefer 3-7 years of work experience
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Focus on impact and leadership, not just responsibilities
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Quantify achievements: revenue generated, team size, budget managed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Show progression and increasing responsibility over time
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
      `}</style>
    </TooltipProvider>
  );
};