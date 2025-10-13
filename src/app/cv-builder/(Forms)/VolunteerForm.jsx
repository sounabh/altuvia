"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Plus, X } from 'lucide-react';
import { useCVData } from '../page';

export const VolunteerForm = () => {
  const { cvData, updateCVData } = useCVData();
  const experiences = cvData.volunteer;

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      organization: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      impact: '',
    };
    updateCVData('volunteer', [...experiences, newExperience]);
  };

  const removeExperience = (id) => {
    updateCVData('volunteer', experiences.filter(exp => exp.id !== id));
  };

  const updateExperience = (id, field, value) => {
    updateCVData('volunteer', experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Volunteer & Extracurricular</h2>
        <p className="cv-body">Showcase your community involvement, leadership roles, and extracurricular activities</p>
      </div>

      {experiences.map((experience, index) => (
        <Card key={experience.id} className="border-cvBorder">
          <CardHeader>
            <CardTitle className="flex items-center justify-between cv-heading">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Activity {index + 1}</span>
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
              Volunteer work, student organizations, clubs, sports, and community involvement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">Organization/Club *</Label>
                <Input
                  value={experience.organization}
                  onChange={(e) => updateExperience(experience.id, 'organization', e.target.value)}
                  placeholder="Red Cross, Student Government, Debate Club"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">Role/Position</Label>
                <Input
                  value={experience.role}
                  onChange={(e) => updateExperience(experience.id, 'role', e.target.value)}
                  placeholder="Volunteer, President, Team Captain"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Location</Label>
              <Input
                value={experience.location}
                onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
                placeholder="Local Food Bank, University Campus"
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
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Activities & Responsibilities</Label>
              <Textarea
                value={experience.description}
                onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                placeholder="Describe your role, responsibilities, and key activities..."
                className="min-h-[80px] border-cvBorder focus:border-cvAccent resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Impact & Achievements</Label>
              <Textarea
                value={experience.impact}
                onChange={(e) => updateExperience(experience.id, 'impact', e.target.value)}
                placeholder="Quantify your impact: people helped, funds raised, events organized, skills developed..."
                className="min-h-[80px] border-cvBorder focus:border-cvAccent resize-none"
              />
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
        Add Another Activity
      </Button>

      <div className="flex justify-end pt-4">
        <Button className="bg-cvAccent hover:bg-cvAccentHover text-white">
          Save & Continue
        </Button>
      </div>
    </div>
  );
};