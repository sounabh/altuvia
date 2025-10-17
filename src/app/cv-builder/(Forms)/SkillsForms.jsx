"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Plus, X } from "lucide-react";
import { useCVData } from "../page";

export const SkillsForm = () => {
  const { cvData, updateCVData } = useCVData();
  const [newSkill, setNewSkill] = useState({});

  // Ensure skills is always an array
  const skillCategories = Array.isArray(cvData.skills) ? cvData.skills : [];

  // Debug: Log when skills change
  useEffect(() => {
    console.log("Skills updated:", cvData.skills);
  }, [cvData.skills]);

  const addSkillCategory = () => {
    const newCategory = {
      id: Date.now().toString(),
      name: "",
      skills: [],
    };
    const updatedSkills = [...skillCategories, newCategory];
    console.log("Adding category:", updatedSkills);
    updateCVData("skills", updatedSkills);
  };

  const removeSkillCategory = (id) => {
    const updatedSkills = skillCategories.filter((category) => category.id !== id);
    console.log("Removing category:", updatedSkills);
    updateCVData("skills", updatedSkills);
  };

  const updateCategoryName = (id, name) => {
    const updatedSkills = skillCategories.map((category) =>
      category.id === id ? { ...category, name } : category
    );
    console.log("Updating category name:", updatedSkills);
    updateCVData("skills", updatedSkills);
  };

  const addSkill = (categoryId) => {
    const skill = newSkill[categoryId]?.trim();
    if (!skill) return;

    const updatedSkills = skillCategories.map((category) => {
      if (category.id === categoryId) {
        const currentSkills = Array.isArray(category.skills) ? category.skills : [];
        return {
          ...category,
          skills: [...currentSkills, skill],
        };
      }
      return category;
    });

    console.log("Adding skill:", updatedSkills);
    updateCVData("skills", updatedSkills);
    setNewSkill((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const removeSkill = (categoryId, skillIndex) => {
    const updatedSkills = skillCategories.map((category) => {
      if (category.id === categoryId) {
        const currentSkills = Array.isArray(category.skills) ? category.skills : [];
        return {
          ...category,
          skills: currentSkills.filter((_, index) => index !== skillIndex),
        };
      }
      return category;
    });

    console.log("Removing skill:", updatedSkills);
    updateCVData("skills", updatedSkills);
  };

  const handleSkillInputChange = (categoryId, value) => {
    setNewSkill((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(categoryId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Skills</h2>
        <p className="cv-body">
          Organize your technical and soft skills by category
        </p>
      </div>

      {skillCategories.map((category, index) => (
        <Card key={category.id} className="border-cvBorder">
          <CardHeader>
            <CardTitle className="flex items-center justify-between cv-heading">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Skill Category {index + 1}</span>
              </div>
              {skillCategories.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkillCategory(category.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="cv-body">
              Group related skills together for better organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="cv-heading">Category Name *</Label>
              <Input
                value={category.name || ""}
                onChange={(e) =>
                  updateCategoryName(category.id, e.target.value)
                }
                placeholder="e.g., Programming Languages, Design Tools, Languages"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Skills</Label>
              <div className="flex space-x-2">
                <Input
                  value={newSkill[category.id] || ""}
                  onChange={(e) =>
                    handleSkillInputChange(category.id, e.target.value)
                  }
                  onKeyPress={(e) => handleKeyPress(e, category.id)}
                  placeholder="Type a skill and press Enter"
                  className="border-cvBorder focus:border-cvAccent"
                />
                <Button
                  onClick={() => addSkill(category.id)}
                  size="sm"
                  className="bg-cvAccent hover:bg-cvAccentHover text-white px-4"
                >
                  Add
                </Button>
              </div>
            </div>

            {Array.isArray(category.skills) && category.skills.length > 0 && (
              <div className="space-y-2">
                <Label className="cv-heading text-sm">Added Skills:</Label>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <Badge
                      key={skillIndex}
                      variant="secondary"
                      className="bg-cvLightBg text-cvHeading hover:bg-cvAccent hover:text-white cursor-pointer transition-colors group"
                      onClick={() => removeSkill(category.id, skillIndex)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs cv-body">Click on a skill to remove it</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addSkillCategory}
        variant="outline"
        className="w-full border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Skill Category
      </Button>


    </div>
  );
};