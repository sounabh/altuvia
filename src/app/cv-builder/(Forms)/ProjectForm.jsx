"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Plus, X, ExternalLink, Github } from 'lucide-react';
import { useCVData } from '../page';

export const ProjectsForm = () => {
  const { cvData, updateCVData } = useCVData();
  const projects = cvData.projects;

  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: '',
      startDate: '',
      endDate: '',
      githubUrl: '',
      liveUrl: '',
      achievements: '',
    };
    updateCVData('projects', [...projects, newProject]);
  };

  const removeProject = (id) => {
    updateCVData('projects', projects.filter(project => project.id !== id));
  };

  const updateProject = (id, field, value) => {
    updateCVData('projects', projects.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Projects</h2>
        <p className="cv-body">Showcase your personal projects, coursework, and side ventures</p>
      </div>

      {projects.map((project, index) => (
        <Card key={project.id} className="border-cvBorder">
          <CardHeader>
            <CardTitle className="flex items-center justify-between cv-heading">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>Project {index + 1}</span>
              </div>
              {projects.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(project.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="cv-body">
              Personal projects, hackathons, coursework, or open-source contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="cv-heading">Project Name *</Label>
              <Input
                value={project.name}
                onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                placeholder="E-commerce Web Application"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Project Description *</Label>
              <Textarea
                value={project.description}
                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                placeholder="A full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration..."
                className="min-h-[80px] border-cvBorder focus:border-cvAccent resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Technologies Used</Label>
              <Input
                value={project.technologies}
                onChange={(e) => updateProject(project.id, 'technologies', e.target.value)}
                placeholder="React, Node.js, MongoDB, Express, Stripe API"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">Start Date</Label>
                <Input
                  type="month"
                  value={project.startDate}
                  onChange={(e) => updateProject(project.id, 'startDate', e.target.value)}
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">End Date</Label>
                <Input
                  type="month"
                  value={project.endDate}
                  onChange={(e) => updateProject(project.id, 'endDate', e.target.value)}
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading">GitHub Repository</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 w-4 h-4 cv-body" />
                  <Input
                    value={project.githubUrl}
                    onChange={(e) => updateProject(project.id, 'githubUrl', e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="pl-10 border-cvBorder focus:border-cvAccent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="cv-heading">Live Demo URL</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-3 w-4 h-4 cv-body" />
                  <Input
                    value={project.liveUrl}
                    onChange={(e) => updateProject(project.id, 'liveUrl', e.target.value)}
                    placeholder="https://myproject.com"
                    className="pl-10 border-cvBorder focus:border-cvAccent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="cv-heading">Key Achievements & Impact</Label>
              <Textarea
                value={project.achievements}
                onChange={(e) => updateProject(project.id, 'achievements', e.target.value)}
                placeholder="• Implemented secure user authentication with JWT tokens&#10;• Integrated Stripe payment processing with 99.9% success rate&#10;• Deployed using Docker containers on AWS with auto-scaling"
                className="min-h-[80px] border-cvBorder focus:border-cvAccent resize-none"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addProject}
        variant="outline"
        className="w-full border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Project
      </Button>

      <div className="flex justify-end pt-4">
        <Button className="bg-cvAccent hover:bg-cvAccentHover text-white">
          Save & Continue
        </Button>
      </div>
    </div>
  );
};