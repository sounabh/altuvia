"use client";

import React, { useState } from "react";

import "react-quill-new/dist/quill.snow.css";
import dynamic from "next/dynamic";
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
  GraduationCap,
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
  BookOpen,
  Award,
} from "lucide-react";
import { useCVData } from "@/lib/constants/CVDataContext";

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

// Quick-start templates (degree is now a plain string)
const educationTemplates = [
  {
    degree: "Bachelor of Business Administration (BBA)",
    field: "Business Administration",
    description: "<ul><li>Relevant coursework: Accounting, Finance, Marketing, Economics</li><li>Dean's List recognition</li></ul>",
  },
  {
    degree: "B.Tech / B.E.",
    field: "Engineering",
    description: "<ul><li>Strong quantitative and analytical foundation</li><li>Project management experience through capstone projects</li></ul>",
  },
  {
    degree: "Bachelor of Science (B.Sc.)",
    field: "Economics",
    description: "<ul><li>Coursework in Microeconomics, Macroeconomics, Econometrics</li><li>Research thesis on market analysis</li></ul>",
  },
  {
    degree: "Bachelor of Science (B.Sc.)",
    field: "Computer Science",
    description: "<ul><li>Technical skills in programming and data analysis</li><li>Led team projects and hackathon participation</li></ul>",
  },
];

// Suggested degree names shown as chips below the input
const degreeSuggestions = [
  "B.Tech / B.E.",
  "BBA",
  "B.Com",
  "B.Sc.",
  "BA",
  "LLB",
  "MBBS / MD",
  "MBA",
  "M.Tech",
  "M.Sc.",
  "MCA",
  "CA / CPA",
  "Diploma",
  "Other",
];

export const EducationForm = () => {
  const { cvData, updateCVData } = useCVData();
  const educations = cvData.education || [];
  const [expandedCards, setExpandedCards] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const calculateCompletion = () => {
    if (educations.length === 0) return 0;
    const filled = educations.filter(
      (edu) => edu.institution && edu.field && edu.degree
    );
    return Math.round((filled.length / educations.length) * 100);
  };

  const toggleCardExpansion = (id) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  const addEducation = (template = null) => {
    const newEducation = {
      id: Date.now().toString(),
      institution: "",
      degree: template?.degree || "",
      field: template?.field || "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: template?.description || "",
    };
    updateCVData("education", [...educations, newEducation]);
    setExpandedCards((prev) => ({ ...prev, [newEducation.id]: true }));
    setShowTemplates(false);
  };

  const duplicateEducation = (education) => {
    const newEdu = {
      ...education,
      id: Date.now().toString(),
      institution: `${education.institution} (Copy)`,
    };
    updateCVData("education", [...educations, newEdu]);
  };

  const removeEducation = (id) =>
    updateCVData("education", educations.filter((edu) => edu.id !== id));

  const updateEducation = (id, field, value) =>
    updateCVData(
      "education",
      educations.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const completion = calculateCompletion();

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold cv-heading">Education</h2>
                <p className="cv-body text-sm mt-1">
                  Your academic background that prepares you for MBA studies
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
                  MBA programs look for strong academic foundations. Highlight
                  quantitative coursework, leadership roles, and academic achievements.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="cv-body">Section Completion</span>
              <span className="font-medium cv-heading">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            <div className="flex items-center gap-2 text-xs cv-body">
              <Lightbulb className="w-3 h-3 text-yellow-500" />
              <span>
                Tip: Include GPA if 3.3+ and highlight quantitative coursework for MBA applications
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Templates ── */}
        <Card className="border-cvBorder border-dashed bg-cvLightBg/30">
          <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-cvLightBg/50 transition-colors rounded-t-lg py-3">
                <CardTitle className="flex items-center justify-between text-base cv-heading">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Common Pre-MBA Backgrounds</span>
                    <Badge variant="secondary" className="text-xs">
                      {educationTemplates.length} templates
                    </Badge>
                  </div>
                  {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                {educationTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => addEducation(template)}
                    className="justify-start h-auto py-3 px-4 border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5 text-left"
                  >
                    <span className="text-2xl mr-3">🎓</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm cv-heading truncate">{template.degree}</p>
                      <p className="text-xs cv-body truncate">{template.field}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* ── Education Cards ── */}
        <div className="space-y-4">
          {educations.map((education, index) => {
            const isExpanded = expandedCards[education.id] !== false;
            const isComplete = education.institution && education.degree && education.field;

            return (
              <Card
                key={education.id}
                className={`border-cvBorder transition-all duration-200 ${isExpanded ? "shadow-md" : "shadow-sm"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl shrink-0">
                      🎓
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold cv-heading truncate">
                          {education.institution || `Education ${index + 1}`}
                        </span>
                        {isComplete && (
                          <Badge variant="outline" className="border-green-500 text-green-600 shrink-0">
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm cv-body mt-0.5">
                        {education.degree && <span className="truncate font-medium">{education.degree}</span>}
                        {education.degree && education.field && <span className="text-cvBorder">·</span>}
                        {education.field && <span className="truncate">{education.field}</span>}
                        {education.startDate && (
                          <>
                            <span className="text-cvBorder">•</span>
                            <span>
                              {formatDate(education.startDate)}
                              {education.endDate && ` – ${formatDate(education.endDate)}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateEducation(education)}
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
                        onClick={() => toggleCardExpansion(education.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {educations.length > 1 && (
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
                              <AlertDialogTitle>Delete Education?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{education.institution || "this education entry"}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeEducation(education.id)}
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

                      {/* Institution & Degree Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Institution */}
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-cvBody" />
                            Institution Name
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={education.institution}
                            onChange={(e) => updateEducation(education.id, "institution", e.target.value)}
                            placeholder="e.g., IIT Delhi, Harvard University"
                            className={`border-cvBorder focus:border-cvAccent ${!education.institution ? "border-orange-300" : ""}`}
                          />
                          {!education.institution && (
                            <p className="text-xs text-orange-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Institution name is required
                            </p>
                          )}
                        </div>

                        {/* Degree — free-text input with suggestion chips */}
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-cvBody" />
                            Degree / Qualification
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={education.degree}
                            onChange={(e) => updateEducation(education.id, "degree", e.target.value)}
                            placeholder="e.g., B.Tech, BBA, MBA, B.Com, M.Sc."
                            className={`border-cvBorder focus:border-cvAccent ${!education.degree ? "border-orange-300" : ""}`}
                          />
                          {/* Quick-pick suggestion chips */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {degreeSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => updateEducation(education.id, "degree", suggestion)}
                                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors
                                  ${education.degree === suggestion
                                    ? "bg-cvAccent text-white border-cvAccent"
                                    : "bg-white text-cvBody border-cvBorder hover:border-cvAccent hover:text-cvAccent"
                                  }`}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          {!education.degree && (
                            <p className="text-xs text-orange-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Degree is required
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Field of Study */}
                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-cvBody" />
                          Field of Study / Major
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={education.field}
                          onChange={(e) => updateEducation(education.id, "field", e.target.value)}
                          placeholder="e.g., Computer Science, Finance, Mechanical Engineering"
                          className={`border-cvBorder ${!education.field ? "border-orange-300" : ""}`}
                        />
                        {!education.field && (
                          <p className="text-xs text-orange-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Field of study is required
                          </p>
                        )}
                      </div>

                      {/* Dates & GPA */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-cvBody" />
                            Start Date
                          </Label>
                          <Input
                            type="month"
                            value={education.startDate}
                            onChange={(e) => updateEducation(education.id, "startDate", e.target.value)}
                            className="border-cvBorder"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-cvBody" />
                            End Date
                          </Label>
                          <Input
                            type="month"
                            value={education.endDate}
                            onChange={(e) => updateEducation(education.id, "endDate", e.target.value)}
                            className="border-cvBorder"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            GPA / Percentage
                            <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
                          </Label>
                          <Input
                            value={education.gpa}
                            onChange={(e) => updateEducation(education.id, "gpa", e.target.value)}
                            placeholder="e.g., 3.7/4.0 or 85%"
                            className="border-cvBorder"
                          />
                          <p className="text-xs cv-body">Include if 3.3+ / 75%+ for MBA applications</p>
                        </div>
                      </div>

                      {/* Rich Text Description */}
                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          Additional Details
                          <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
                        </Label>
                        <div className="prose-editor">
                          <ReactQuill
                            theme="snow"
                            value={education.description || ""}
                            onChange={(value) => updateEducation(education.id, "description", value)}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="• Relevant coursework (especially quantitative)&#10;• Academic honors, Dean's List&#10;• Leadership roles in student organizations&#10;• Research or thesis projects"
                            className="bg-white rounded-md"
                          />
                        </div>
                        <p className="text-xs cv-body">
                          Highlight coursework, honors, and activities relevant to your MBA goals
                        </p>
                      </div>

                      {/* Tips box */}
                      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                        <p className="text-xs font-medium text-blue-900 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                          What MBA Programs Look For
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
                          {[
                            "Quantitative coursework (calculus, statistics, economics)",
                            "Leadership in clubs, sports, or organizations",
                            "Academic achievements and honors",
                            "Study abroad or international experience",
                          ].map((tip) => (
                            <div key={tip} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Empty State ── */}
        {educations.length === 0 && (
          <Card className="border-cvBorder border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold cv-heading mb-2">No Education Added Yet</h3>
              <p className="text-sm cv-body mb-4 max-w-md mx-auto">
                Add your undergraduate degree and any other relevant education to strengthen your MBA application.
              </p>
              <Button onClick={() => addEducation()} className="bg-cvAccent hover:bg-cvAccentHover text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your Education
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Add More Button ── */}
        {educations.length > 0 && (
          <Button
            onClick={() => addEducation()}
            variant="outline"
            className="w-full h-14 border-2 border-dashed border-cvAccent/50 text-cvAccent hover:bg-cvAccent hover:text-white transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Education
          </Button>
        )}

        {/* ── Pro Tips ── */}
        <Card className="border-cvBorder bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Education Tips for MBA Applicants</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {[
                    "Strong GPA (3.3+) is important, but work experience matters more for top programs",
                    "Highlight quantitative courses to show analytical readiness",
                    "Include leadership roles in student organizations",
                    "Diverse academic backgrounds are valued – you don't need a business degree",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
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