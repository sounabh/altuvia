"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, Plus, X, Lightbulb } from 'lucide-react';


export const ExperienceForm = () => {
  const [experiences, setExperiences] = useState([
    {
      id: '1',
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentRole: false,
      description: '',
    }
  ]);

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentRole: false,
      description: '',
    };
    setExperiences([...experiences, newExperience]);
  };

  const removeExperience = (id) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const updateExperience = (id, field, value) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Work Experience</h2>
        <p className="cv-body">Add your professional experience, starting with the most recent</p>
      </div>

      {experiences.map((experience, index) => (
        <Card key={experience.id} className="border-cvBorder">
          <CardHeader>
            <CardTitle className="flex items-center justify-between cv-heading">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Experience {index + 1}</span>
              </div>
              {experiences.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(experience.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="cv-body">
              Professional work experience, internships, and part-time roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">Company Name *</Label>
                <Input
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                  placeholder="Google Inc."
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">Job Title *</Label>
                <Input
                  value={experience.position}
                  onChange={(e) => updateExperience(experience.id, 'position', e.target.value)}
                  placeholder="Software Engineer Intern"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Location</Label>
              <Input
                value={experience.location}
                onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
                placeholder="San Francisco, CA"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">Start Date</Label>
                <Input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">End Date</Label>
                <Input
                  type="month"
                  value={experience.endDate}
                  onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                  disabled={experience.isCurrentRole}
                  className="border-cvBorder focus:border-cvAccent disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`current-${experience.id}`}
                checked={experience.isCurrentRole}
                onCheckedChange={(checked) => updateExperience(experience.id, 'isCurrentRole', !!checked)}
              />
              <Label htmlFor={`current-${experience.id}`} className="cv-body text-sm">
                I currently work here
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Job Description & Achievements</Label>
              <Textarea
                value={experience.description}
                onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                placeholder="• Developed and maintained web applications using React and Node.js&#10;• Collaborated with cross-functional teams to deliver features on time&#10;• Improved application performance by 25% through code optimization"
                className="min-h-[120px] border-cvBorder focus:border-cvAccent resize-none"
              />
              <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Pro tip:</strong> Use bullet points and start with action verbs. Quantify your achievements when possible (e.g., "Increased efficiency by 30%").
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addExperience}
        variant="outline"
        className="w-full border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Experience
      </Button>

      <div className="flex justify-end pt-4">
        <Button className="bg-cvAccent hover:bg-cvAccentHover text-white">
          Save & Continue
        </Button>
      </div>
    </div>
  );
};
