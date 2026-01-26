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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Award,
  Plus,
  Trophy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Check,
  AlertCircle,
  Trash2,
  Copy,
  HelpCircle,
  Star,
  Calendar,
  Building2,
  FileText,
  Crown,
  Gem,
  TrendingUp,
  BookOpen,
  Heart,
  Briefcase,
  GraduationCap,
  Users,
  Globe,
} from "lucide-react";

import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-md" />
});


const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const quillFormats = ["bold", "italic", "underline", "list"];

const achievementTypes = [
  { value: "professional", label: "Professional Recognition", icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "leadership", label: "Leadership Achievement", icon: Crown, color: "text-purple-600", bgColor: "bg-purple-100" },
  { value: "academic", label: "Academic Honor", icon: GraduationCap, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  { value: "certification", label: "Professional Certification", icon: Award, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "competition", label: "Competition/Contest", icon: Trophy, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "community", label: "Community Impact", icon: Heart, color: "text-pink-600", bgColor: "bg-pink-100" },
  { value: "publication", label: "Publication/Speaking", icon: BookOpen, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  { value: "international", label: "International Experience", icon: Globe, color: "text-orange-600", bgColor: "bg-orange-100" },
  { value: "other", label: "Other", icon: Star, color: "text-gray-600", bgColor: "bg-gray-100" },
];

const achievementTemplates = [
  {
    title: "Top Performer Award",
    type: "professional",
    description: "<p>Recognized as top 10% performer in annual review. Led initiatives that drove significant business impact.</p>",
  },
  {
    title: "Team Leadership Recognition",
    type: "leadership",
    description: "<p>Successfully led cross-functional team of 8+ members. Delivered project ahead of schedule with measurable results.</p>",
  },
  {
    title: "CFA Level I/II/III",
    type: "certification",
    description: "<p>Passed CFA exam demonstrating commitment to finance and analytical rigor valued by MBA programs.</p>",
  },
  {
    title: "Volunteer Leadership",
    type: "community",
    description: "<p>Led volunteer initiative impacting 100+ beneficiaries. Demonstrated commitment to social responsibility.</p>",
  },
  {
    title: "Dean's List / Academic Honors",
    type: "academic",
    description: "<p>Achieved academic excellence while balancing extracurricular leadership activities.</p>",
  },
  {
    title: "International Project/Assignment",
    type: "international",
    description: "<p>Completed international assignment demonstrating global mindset and cross-cultural competence.</p>",
  },
];

export const AchievementsForm = () => {
  const { cvData, updateCVData } = useCVData();
  const achievements = cvData.achievements || [];
  const [expandedCards, setExpandedCards] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const calculateCompletion = () => {
    if (achievements.length === 0) return 0;
    const filledAchievements = achievements.filter((a) => a.title && a.type);
    return Math.round((filledAchievements.length / achievements.length) * 100);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addAchievement = (template = null) => {
    const newAchievement = {
      id: Date.now().toString(),
      title: template?.title || "",
      organization: "",
      date: "",
      type: template?.type || "",
      description: template?.description || "",
      featured: false,
    };
    updateCVData("achievements", [...achievements, newAchievement]);
    setExpandedCards((prev) => ({ ...prev, [newAchievement.id]: true }));
    setShowTemplates(false);
  };

  const duplicateAchievement = (achievement) => {
    const newAchievement = {
      ...achievement,
      id: Date.now().toString(),
      title: `${achievement.title} (Copy)`,
    };
    updateCVData("achievements", [...achievements, newAchievement]);
  };

  const removeAchievement = (id) => {
    updateCVData("achievements", achievements.filter((a) => a.id !== id));
  };

  const updateAchievement = (id, field, value) => {
    const updated = achievements.map((a) => (a.id === id ? { ...a, [field]: value } : a));
    updateCVData("achievements", updated);
  };

  const toggleFeatured = (id) => {
    const updated = achievements.map((a) =>
      a.id === id ? { ...a, featured: !a.featured } : a
    );
    updateCVData("achievements", updated);
  };

  const getTypeInfo = (typeValue) => {
    return achievementTypes.find((t) => t.value === typeValue) || achievementTypes[8];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const completion = calculateCompletion();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold cv-heading">Achievements & Awards</h2>
                <p className="cv-body text-sm mt-1">
                  Showcase accomplishments that demonstrate your MBA readiness
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
                  MBA programs value leadership, impact, and initiative. 
                  Focus on achievements that show you can lead and make a difference.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="cv-body">Section Completion</span>
                <span className="font-medium cv-heading">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>
            <div className="flex items-center justify-end gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="cv-body">{achievements.filter((a) => a.featured).length} Featured</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cvAccent" />
                <span className="cv-body">{achievements.length} Total</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-cvBorder border-dashed bg-cvLightBg/30">
          <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-cvLightBg/50 transition-colors rounded-t-lg py-3">
                <CardTitle className="flex items-center justify-between text-base cv-heading">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>Achievements MBA Programs Value</span>
                    <Badge variant="secondary" className="text-xs">
                      {achievementTemplates.length} templates
                    </Badge>
                  </div>
                  {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                {achievementTemplates.map((template, index) => {
                  const typeInfo = getTypeInfo(template.type);
                  const Icon = typeInfo.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => addAchievement(template)}
                      className="justify-start h-auto py-3 px-4 border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.bgColor} flex items-center justify-center mr-3 shrink-0`}>
                        <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm cv-heading truncate">{template.title}</p>
                        <p className="text-xs cv-body truncate">{typeInfo.label}</p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <div className="space-y-4">
          {achievements.map((achievement, index) => {
            const isExpanded = expandedCards[achievement.id] !== false;
            const typeInfo = getTypeInfo(achievement.type);
            const Icon = typeInfo?.icon || Star;
            const isComplete = achievement.title && achievement.type;

            return (
              <Card
                key={achievement.id}
                className={`border-cvBorder transition-all duration-200 ${isExpanded ? "shadow-md" : "shadow-sm"} ${
                  achievement.featured ? "ring-2 ring-yellow-400 ring-offset-2" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold cv-heading truncate">
                          {achievement.title || `Achievement ${index + 1}`}
                        </span>
                        {achievement.featured && (
                          <Badge className="bg-yellow-100 text-yellow-700 shrink-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                        {isComplete && (
                          <Badge variant="outline" className="border-green-500 text-green-600 shrink-0">
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm cv-body mt-0.5">
                        {achievement.organization && <span className="truncate">{achievement.organization}</span>}
                        {achievement.date && (
                          <>
                            <span className="text-cvBorder">•</span>
                            <span>{formatDate(achievement.date)}</span>
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
                            className={`h-8 w-8 ${achievement.featured ? "text-yellow-500" : "text-cvBody"}`}
                            onClick={() => toggleFeatured(achievement.id)}
                          >
                            <Star className={`w-4 h-4 ${achievement.featured ? "fill-current" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {achievement.featured ? "Remove from featured" : "Mark as featured"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateAchievement(achievement)}
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
                        onClick={() => toggleCardExpansion(achievement.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

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
                            <AlertDialogTitle>Delete Achievement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{achievement.title || "this achievement"}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeAchievement(achievement.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-5 pt-0 border-t border-cvBorder/50">
                    <div className="pt-4 space-y-5">
                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          Achievement Title
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={achievement.title}
                          onChange={(e) => updateAchievement(achievement.id, "title", e.target.value)}
                          placeholder="e.g., Top Performer Award, Team Lead Recognition, CFA Level II"
                          className={`border-cvBorder focus:border-cvAccent ${!achievement.title ? "border-red-300" : ""}`}
                        />
                        {!achievement.title && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Title is required
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-cvBody" />
                            Organization / Company
                          </Label>
                          <Input
                            value={achievement.organization}
                            onChange={(e) => updateAchievement(achievement.id, "organization", e.target.value)}
                            placeholder="e.g., McKinsey & Company, Google, University Name"
                            className="border-cvBorder focus:border-cvAccent"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="cv-heading text-sm flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-cvBody" />
                            Date Received
                          </Label>
                          <Input
                            type="month"
                            value={achievement.date}
                            onChange={(e) => updateAchievement(achievement.id, "date", e.target.value)}
                            className="border-cvBorder focus:border-cvAccent"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          Achievement Type
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={achievement.type}
                          onValueChange={(value) => updateAchievement(achievement.id, "type", value)}
                        >
                          <SelectTrigger className={`border-cvBorder ${!achievement.type ? "border-red-300" : ""}`}>
                            <SelectValue placeholder="Select achievement type" />
                          </SelectTrigger>
                          <SelectContent>
                            {achievementTypes.map((type) => {
                              const TypeIcon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded ${type.bgColor} flex items-center justify-center`}>
                                      <TypeIcon className={`w-3.5 h-3.5 ${type.color}`} />
                                    </div>
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {!achievement.type && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Please select a type
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="cv-heading text-sm flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cvBody" />
                          Description & Impact
                        </Label>
                        <div className="prose-editor">
                          <ReactQuill
                            theme="snow"
                            value={achievement.description || ""}
                            onChange={(value) => updateAchievement(achievement.id, "description", value)}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Describe the achievement, your role, and quantifiable impact..."
                            className="bg-white rounded-md"
                          />
                        </div>
                        <p className="text-xs cv-body">
                          Tip: Quantify your impact with numbers (e.g., "Led team of 12", "Increased revenue by 25%")
                        </p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                        <p className="text-xs font-medium text-yellow-900 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />
                          Making This Achievement Stand Out for MBA
                        </p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-5 list-disc">
                          <li>Focus on leadership and initiative you demonstrated</li>
                          <li>Quantify results and business impact where possible</li>
                          <li>Highlight teamwork and collaboration aspects</li>
                          <li>Show how this connects to your MBA goals</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {achievements.length === 0 && (
          <Card className="border-cvBorder border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold cv-heading mb-2">No Achievements Added Yet</h3>
              <p className="text-sm cv-body mb-4 max-w-md mx-auto">
                Add professional achievements, leadership recognition, and certifications 
                to strengthen your MBA application.
              </p>
              <Button onClick={() => addAchievement()} className="bg-cvAccent hover:bg-cvAccentHover text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Achievement
              </Button>
            </CardContent>
          </Card>
        )}

        {achievements.length > 0 && (
          <Button
            onClick={() => addAchievement()}
            variant="outline"
            className="w-full h-14 border-2 border-dashed border-cvAccent/50 text-cvAccent hover:bg-cvAccent hover:text-white transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Achievement
          </Button>
        )}

        <Card className="border-cvBorder bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-900">Achievements That Impress MBA Admissions</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Professional recognition showing you're a top performer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Leadership roles where you drove measurable results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Community involvement showing social responsibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Certifications (CFA, PMP, Six Sigma) demonstrating commitment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>International experience showing global perspective</span>
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