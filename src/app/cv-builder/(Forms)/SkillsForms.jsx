"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Plus, X } from 'lucide-react';

export const SkillsForm = () => {
  const [skillCategories, setSkillCategories] = useState([
    { id: '1', name: 'Programming Languages', skills: [] },
    { id: '2', name: 'Frameworks & Libraries', skills: [] },
    { id: '3', name: 'Tools & Technologies', skills: [] },
    { id: '4', name: 'Soft Skills', skills: [] },
  ]);

  const [newSkill, setNewSkill] = useState({});

  const addSkillCategory = () => {
    const newCategory = {
      id: Date.now().toString(),
      name: '',
      skills: [],
    };
    setSkillCategories([...skillCategories, newCategory]);
  };

  const removeSkillCategory = (id) => {
    setSkillCategories(skillCategories.filter(category => category.id !== id));
  };

  const updateCategoryName = (id, name) => {
    setSkillCategories(skillCategories.map(category =>
      category.id === id ? { ...category, name } : category
    ));
  };

  const addSkill = (categoryId) => {
    const skill = newSkill[categoryId]?.trim();
    if (!skill) return;

    setSkillCategories(skillCategories.map(category =>
      category.id === categoryId
        ? { ...category, skills: [...category.skills, skill] }
        : category
    ));
    setNewSkill({ ...newSkill, [categoryId]: '' });
  };

  const removeSkill = (categoryId, skillIndex) => {
    setSkillCategories(skillCategories.map(category =>
      category.id === categoryId
        ? { ...category, skills: category.skills.filter((_, index) => index !== skillIndex) }
        : category
    ));
  };

  const handleSkillInputChange = (categoryId, value) => {
    setNewSkill({ ...newSkill, [categoryId]: value });
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(categoryId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Skills</h2>
        <p className="cv-body">Organize your technical and soft skills by category</p>
      </div>

      {Array.isArray(skillCategories) &&
        skillCategories.map((category, index) => (
          // Each Card represents a skill category block
          <Card key={category.id} className="border-cvBorder">
            
            {/* Card Header containing title and remove button */}
            <CardHeader>
              <CardTitle className="flex items-center justify-between cv-heading">
                <div className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Skill Category {index + 1}</span>
                </div>

                {/* Show remove button only if there's more than one skill category */}
                {skillCategories.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkillCategory(category.id)} // remove category
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>

              {/* Description for this section */}
              <CardDescription className="cv-body">
                Group related skills together for better organization
              </CardDescription>
            </CardHeader>

            {/* Card Content: form fields for category and skills */}
            <CardContent className="space-y-4">

              {/* Input for category name */}
              <div className="space-y-2">
                <Label className="cv-heading">Category Name *</Label>
                <Input
                  value={category.name}
                  onChange={(e) => updateCategoryName(category.id, e.target.value)} // update category name
                  placeholder="e.g., Programming Languages, Design Tools, Languages"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>

              {/* Input + Button for adding new skills */}
              <div className="space-y-2">
                <Label className="cv-heading">Skills</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newSkill[category.id] || ''} // dynamic state for each category
                    onChange={(e) => handleSkillInputChange(category.id, e.target.value)} // update input
                    onKeyPress={(e) => handleKeyPress(e, category.id)} // allow enter key to add
                    placeholder="Type a skill and press Enter"
                    className="border-cvBorder focus:border-cvAccent"
                  />
                  <Button
                    onClick={() => addSkill(category.id)} // add skill to category
                    size="sm"
                    className="bg-cvAccent hover:bg-cvAccentHover text-white px-4"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Show added skills as badges, allow click to remove */}
              {category.skills.length > 0 && (
                <div className="space-y-2">
                  <Label className="cv-heading text-sm">Added Skills:</Label>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, skillIndex) => (
                      <Badge
                        key={skillIndex}
                        variant="secondary"
                        className="bg-cvLightBg text-cvHeading hover:bg-cvAccent hover:text-white cursor-pointer transition-colors group"
                        onClick={() => removeSkill(category.id, skillIndex)} // remove skill on click
                      >
                        {skill}
                        {/* Show X icon on hover for better UX */}
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

      <div className="flex justify-end pt-4">
        <Button className="bg-cvAccent hover:bg-cvAccentHover text-white">
          Save & Continue
        </Button>
      </div>
    </div>
  );
};