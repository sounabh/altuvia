"use client"

import React from 'react';
import { useCVData } from '../page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Plus, X, Trophy } from 'lucide-react';


export const AchievementsForm = () => {
  const { cvData, updateCVData } = useCVData();
  const achievements = cvData.achievements || [];

  const addAchievement = () => {
    const newAchievement = {
      id: Date.now().toString(),
      title: '',
      organization: '',
      date: '',
      type: '',
      description: '',
    };
    updateCVData('achievements', [...achievements, newAchievement]);
  };

  const removeAchievement = (id) => {
    updateCVData('achievements', achievements.filter(achievement => achievement.id !== id));
  };

  const updateAchievement = (id, field, value) => {
    const updated = achievements.map(achievement => 
      achievement.id === id ? { ...achievement, [field]: value } : achievement
    );
    updateCVData('achievements', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Achievements & Awards</h2>
        <p className="cv-body">Highlight your accomplishments, awards, certifications, and recognitions</p>
      </div>

      {achievements.map((achievement, index) => (
        <Card key={achievement.id} className="border-cvBorder">
          <CardHeader>
            <CardTitle className="flex items-center justify-between cv-heading">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span>Achievement {index + 1}</span>
              </div>
              {achievements.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAchievement(achievement.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="cv-body">
              Awards, certifications, honors, publications, or notable accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="cv-heading">Achievement Title *</Label>
              <Input
                value={achievement.title}
                onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                placeholder="Dean's List, First Place in Hackathon, AWS Certification"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">Organization/Institution</Label>
                <Input
                  value={achievement.organization}
                  onChange={(e) => updateAchievement(achievement.id, 'organization', e.target.value)}
                  placeholder="University, Company, Organization"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">Date Received</Label>
                <Input
                  type="month"
                  value={achievement.date}
                  onChange={(e) => updateAchievement(achievement.id, 'date', e.target.value)}
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Achievement Type</Label>
              <Select value={achievement.type} onValueChange={(value) => updateAchievement(achievement.id, 'type', value)}>
                <SelectTrigger className="border-cvBorder focus:border-cvAccent">
                  <SelectValue placeholder="Select achievement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic Honor</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="competition">Competition/Contest</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="publication">Publication</SelectItem>
                  <SelectItem value="leadership">Leadership Award</SelectItem>
                  <SelectItem value="community">Community Service</SelectItem>
                  <SelectItem value="professional">Professional Recognition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Description & Impact</Label>
              <Textarea
                value={achievement.description}
                onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                placeholder="Describe what you accomplished, the significance of this achievement, and any relevant details..."
                className="min-h-[80px] border-cvBorder focus:border-cvAccent resize-none"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addAchievement}
        variant="outline"
        className="w-full border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Achievement
      </Button>

      
    </div>
  );
};