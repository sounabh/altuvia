"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Code,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Check,
  AlertCircle,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Target,
  HelpCircle,
} from "lucide-react";
import { useCVData } from "../page";

// Pre-MBA focused skill suggestions (for MBA applicants from diverse backgrounds)
const skillSuggestions = {
  "Technical Skills": [
    "Microsoft Excel (Advanced)",
    "SQL",
    "Python",
    "Tableau",
    "Power BI",
    "SAP",
    "Salesforce",
    "JIRA",
  ],
  "Financial Skills": [
    "Financial Modeling",
    "Valuation",
    "Budgeting & Forecasting",
    "P&L Management",
    "Financial Analysis",
    "Investment Analysis",
    "Risk Assessment",
    "Cost-Benefit Analysis",
  ],
  "Leadership & Management": [
    "Team Leadership",
    "Project Management",
    "Cross-functional Collaboration",
    "Stakeholder Management",
    "Strategic Planning",
    "Change Management",
    "Performance Management",
    "Mentoring & Coaching",
  ],
  "Analytical Skills": [
    "Data Analysis",
    "Market Research",
    "Competitive Analysis",
    "Business Intelligence",
    "Problem Solving",
    "Critical Thinking",
    "Process Improvement",
    "Root Cause Analysis",
  ],
  "Communication Skills": [
    "Executive Presentations",
    "Client Relations",
    "Negotiation",
    "Public Speaking",
    "Technical Writing",
    "Cross-cultural Communication",
    "Stakeholder Communication",
    "Report Writing",
  ],
  "Industry Knowledge": [
    "Consulting Frameworks",
    "Agile Methodology",
    "Lean Six Sigma",
    "Supply Chain Management",
    "Digital Transformation",
    "E-commerce",
    "SaaS Business Models",
    "Regulatory Compliance",
  ],
  "Languages": [
    "English (Native/Fluent)",
    "Spanish",
    "Mandarin Chinese",
    "French",
    "German",
    "Japanese",
    "Portuguese",
    "Hindi",
  ],
};

// Category templates - Pre-MBA focused
const categoryTemplates = [
  { name: "Technical Skills", icon: "💻" },
  { name: "Financial Skills", icon: "📊" },
  { name: "Leadership & Management", icon: "👔" },
  { name: "Analytical Skills", icon: "🔍" },
  { name: "Communication Skills", icon: "💬" },
  { name: "Industry Knowledge", icon: "🏢" },
  { name: "Languages", icon: "🌍" },
];

// Skill proficiency levels
const proficiencyLevels = [
  { level: "Beginner", color: "bg-gray-400", value: 25 },
  { level: "Intermediate", color: "bg-blue-400", value: 50 },
  { level: "Advanced", color: "bg-green-500", value: 75 },
  { level: "Expert", color: "bg-purple-600", value: 100 },
];

export const SkillsForm = () => {
  const { cvData, updateCVData } = useCVData();
  const [newSkill, setNewSkill] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const skillCategories = Array.isArray(cvData.skills) ? cvData.skills : [];

  const calculateCompletion = () => {
    if (skillCategories.length === 0) return 0;
    const categoriesWithSkills = skillCategories.filter(
      (cat) => cat.name && cat.skills && cat.skills.length > 0
    );
    return Math.round((categoriesWithSkills.length / skillCategories.length) * 100);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addSkillCategory = (template) => {
    const newCategory = {
      id: Date.now().toString(),
      name: template?.name || "",
      icon: template?.icon || "📋",
      skills: [],
      showProficiency: false,
    };
    updateCVData("skills", [...skillCategories, newCategory]);
    setExpandedCards((prev) => ({ ...prev, [newCategory.id]: true }));
    setShowTemplates(false);
  };

  const duplicateCategory = (category) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
      name: `${category.name} (Copy)`,
    };
    updateCVData("skills", [...skillCategories, newCategory]);
  };

  const removeSkillCategory = (id) => {
    updateCVData("skills", skillCategories.filter((category) => category.id !== id));
  };

  const updateCategoryName = (id, name) => {
    const updatedSkills = skillCategories.map((category) =>
      category.id === id ? { ...category, name } : category
    );
    updateCVData("skills", updatedSkills);
  };

  const addSkill = (categoryId, skillName = null) => {
    const skill = skillName || newSkill[categoryId]?.trim();
    if (!skill) return;

    const updatedSkills = skillCategories.map((category) => {
      if (category.id === categoryId) {
        const currentSkills = Array.isArray(category.skills) ? category.skills : [];
        const skillExists = currentSkills.some((s) => 
          (typeof s === "string" ? s : s.name).toLowerCase() === skill.toLowerCase()
        );
        if (skillExists) return category;
        
        return {
          ...category,
          skills: [...currentSkills, { name: skill, proficiency: "Intermediate" }],
        };
      }
      return category;
    });

    updateCVData("skills", updatedSkills);
    setNewSkill((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const removeSkill = (categoryId, skillIndex) => {
    const updatedSkills = skillCategories.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          skills: category.skills.filter((_, index) => index !== skillIndex),
        };
      }
      return category;
    });
    updateCVData("skills", updatedSkills);
  };

  const updateSkillProficiency = (categoryId, skillIndex, proficiency) => {
    const updatedSkills = skillCategories.map((category) => {
      if (category.id === categoryId) {
        const updatedCategorySkills = [...category.skills];
        const skill = updatedCategorySkills[skillIndex];
        updatedCategorySkills[skillIndex] = {
          name: typeof skill === "string" ? skill : skill.name,
          proficiency,
        };
        return { ...category, skills: updatedCategorySkills };
      }
      return category;
    });
    updateCVData("skills", updatedSkills);
  };

  const toggleProficiencyDisplay = (categoryId) => {
    const updatedSkills = skillCategories.map((category) =>
      category.id === categoryId
        ? { ...category, showProficiency: !category.showProficiency }
        : category
    );
    updateCVData("skills", updatedSkills);
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(categoryId);
    }
  };

  const getSuggestionsForCategory = (categoryName) => {
    return skillSuggestions[categoryName] || [];
  };

  const completion = calculateCompletion();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 from-cvAccent/10 to-cvAccent/5 rounded-xl p-6 border border-cvAccent/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cvAccent/20 flex items-center justify-center">
                <Code className="w-6 h-6 text-cvAccent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold cv-heading">Skills & Expertise</h2>
                <p className="cv-body text-sm mt-1">
                  Highlight skills that demonstrate your readiness for MBA and leadership roles
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
                  MBA programs value leadership, analytical thinking, and quantitative skills. 
                  Include both technical proficiencies and soft skills.
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
                Tip: MBA admissions value quantitative skills, leadership abilities, and industry expertise
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Templates */}
        <Card className="border-cvBorder border-dashed bg-cvLightBg/30">
          <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-cvLightBg/50 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-base cv-heading">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cvAccent" />
                    <span>Quick Start Templates</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryTemplates.length} available
                    </Badge>
                  </div>
                  {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categoryTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => addSkillCategory(template)}
                      className="justify-start h-auto py-2 px-3 border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5"
                    >
                      <span className="mr-2">{template.icon}</span>
                      <span className="text-xs truncate">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Skill Categories */}
        <div className="space-y-4">
          {skillCategories.map((category, index) => {
            const isExpanded = expandedCards[category.id] !== false;
            const suggestions = getSuggestionsForCategory(category.name);
            const skillsList = Array.isArray(category.skills) ? category.skills : [];

            return (
              <Card
                key={category.id}
                className={`border-cvBorder transition-all duration-200 ${isExpanded ? "shadow-md" : "shadow-sm"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-lg bg-cvLightBg flex items-center justify-center text-lg">
                      {category.icon || "📋"}
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          value={category.name || ""}
                          onChange={(e) => updateCategoryName(category.id, e.target.value)}
                          placeholder="Category Name (e.g., Technical Skills)"
                          className="border-0 p-0 h-auto text-lg font-semibold cv-heading bg-transparent focus-visible:ring-0"
                        />
                        {category.name && skillsList.length > 0 && (
                          <Badge variant="secondary" className="shrink-0">
                            {skillsList.length} skills
                          </Badge>
                        )}
                      </div>
                      {!category.name && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Category name is required
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleProficiencyDisplay(category.id)}
                          >
                            {category.showProficiency ? (
                              <Eye className="w-4 h-4 text-cvAccent" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-cvBody" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {category.showProficiency ? "Hide proficiency levels" : "Show proficiency levels"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateCategory(category)}
                          >
                            <Copy className="w-4 h-4 text-cvBody" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate category</TooltipContent>
                      </Tooltip>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleCardExpansion(category.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {skillCategories.length > 1 && (
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
                              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{category.name || "this category"}" and all {skillsList.length} skills within it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeSkillCategory(category.id)}
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
                  <CardContent className="space-y-4 pt-0">
                    {/* Skill Input */}
                    <div className="space-y-2">
                      <Label className="cv-heading text-sm flex items-center gap-2">
                        Add Skills
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3 h-3 text-cvBody" />
                          </TooltipTrigger>
                          <TooltipContent>Press Enter or click Add to include a skill</TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={newSkill[category.id] || ""}
                            onChange={(e) => setNewSkill((prev) => ({ ...prev, [category.id]: e.target.value }))}
                            onKeyPress={(e) => handleKeyPress(e, category.id)}
                            placeholder="Type a skill name..."
                            className="border-cvBorder focus:border-cvAccent pr-10"
                          />
                          {newSkill[category.id] && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                              onClick={() => setNewSkill((prev) => ({ ...prev, [category.id]: "" }))}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <Button
                          onClick={() => addSkill(category.id)}
                          disabled={!newSkill[category.id]?.trim()}
                          className="bg-cvAccent hover:bg-cvAccentHover text-white px-6"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Skill Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="cv-heading text-xs flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          Suggested Skills for MBA Applicants
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions
                            .filter((s) => !skillsList.some((skill) => 
                              (typeof skill === "string" ? skill : skill.name).toLowerCase() === s.toLowerCase()
                            ))
                            .slice(0, 8)
                            .map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                onClick={() => addSkill(category.id, suggestion)}
                                className="h-7 text-xs border-dashed border-cvBorder hover:border-cvAccent hover:bg-cvAccent/5"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Skills List */}
                    {skillsList.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="cv-heading text-sm">Added Skills ({skillsList.length})</Label>
                          {category.showProficiency && (
                            <div className="flex items-center gap-2 text-xs cv-body">
                              {proficiencyLevels.map((p) => (
                                <span key={p.level} className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                                  {p.level}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {skillsList.map((skill, skillIndex) => {
                            const skillName = typeof skill === "string" ? skill : skill.name;
                            const proficiency = typeof skill === "string" ? "Intermediate" : skill.proficiency;
                            const profLevel = proficiencyLevels.find((p) => p.level === proficiency);

                            return (
                              <div key={skillIndex} className="group relative">
                                <Badge
                                  variant="secondary"
                                  className={`bg-cvLightBg text-cvHeading pr-7 py-1.5 text-sm hover:bg-red-50 hover:text-red-600 cursor-pointer transition-all ${category.showProficiency ? "pl-3" : ""}`}
                                >
                                  {category.showProficiency && (
                                    <span className={`w-2 h-2 rounded-full mr-2 ${profLevel?.color}`} />
                                  )}
                                  {skillName}
                                  <button
                                    onClick={() => removeSkill(category.id, skillIndex)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>

                                {category.showProficiency && (
                                  <div className="absolute -bottom-1 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="flex justify-center gap-0.5 pt-2">
                                      {proficiencyLevels.map((p) => (
                                        <Tooltip key={p.level}>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateSkillProficiency(category.id, skillIndex, p.level);
                                              }}
                                              className={`w-4 h-4 rounded-full ${p.color} ${proficiency === p.level ? "ring-2 ring-offset-1 ring-cvAccent" : "opacity-50 hover:opacity-100"} transition-all`}
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="text-xs">
                                            {p.level}
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-xs cv-body flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Click a skill badge to remove it
                          {category.showProficiency && " • Hover to change proficiency level"}
                        </p>
                      </div>
                    )}

                    {/* Empty State */}
                    {skillsList.length === 0 && (
                      <div className="text-center py-6 bg-cvLightBg/50 rounded-lg border border-dashed border-cvBorder">
                        <Code className="w-8 h-8 mx-auto text-cvBody mb-2" />
                        <p className="text-sm cv-body">No skills added yet</p>
                        <p className="text-xs cv-body mt-1">Start typing above or click a suggestion</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Add Category Button */}
        <Button
          onClick={() => addSkillCategory()}
          variant="outline"
          className="w-full h-14 border-2 border-dashed border-cvAccent/50 text-cvAccent hover:bg-cvAccent hover:text-white hover:border-cvAccent transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Skill Category
        </Button>

        {/* Tips Section */}
        <Card className="border-cvBorder bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Skills That Impress MBA Admissions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Quantitative skills (Excel, SQL, financial modeling) show analytical ability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Leadership experience and team management demonstrate MBA readiness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Industry-specific expertise shows depth of professional experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Languages and cross-cultural skills highlight global perspective</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};