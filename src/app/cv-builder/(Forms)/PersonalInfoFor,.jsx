// PersonalInfoForm.tsx
"use client";

import React from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  HelpCircle,
  Lightbulb,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const PersonalInfoForm = () => {
  const { cvData, updateCVData } = useCVData();
  const data = cvData.personal;

  const handleInputChange = (field, value) => {
    updateCVData("personal", { ...data, [field]: value });
  };

  const calculateCompletion = () => {
    const requiredFields = ["fullName", "email"];
    const optionalFields = ["phone", "location", "website", "linkedin"];
    
    let filled = 0;
    let total = requiredFields.length + optionalFields.length;
    
    requiredFields.forEach((field) => {
      if (data[field]) filled++;
    });
    optionalFields.forEach((field) => {
      if (data[field]) filled++;
    });
    
    return Math.round((filled / total) * 100);
  };

  const completion = calculateCompletion();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold cv-heading">Personal Information</h2>
                <p className="cv-body text-sm mt-1">
                  Your contact details and professional profile
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
                  This information appears at the top of your CV. Make sure your
                  contact details are professional and up-to-date.
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
                Tip: Use a professional email address and include LinkedIn for MBA applications
              </span>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg cv-heading">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              Basic Information
              <Badge variant="outline" className="text-xs font-normal ml-2">
                Required
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  Full Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={data.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="e.g., John Smith"
                  className={`border-cvBorder focus:border-cvAccent ${
                    !data.fullName ? "border-orange-300" : ""
                  }`}
                />
                {!data.fullName && (
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Full name is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cvBody" />
                  Email Address
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className={`border-cvBorder focus:border-cvAccent ${
                    !data.email ? "border-orange-300" : ""
                  }`}
                />
                {!data.email && (
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Email is required
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cvBody" />
                  Phone Number
                </Label>
                <Input
                  value={data.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>

              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cvBody" />
                  Location
                </Label>
                <Input
                  value={data.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="New York, NY"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Presence Card */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg cv-heading">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              Online Presence
              <Badge variant="outline" className="text-xs font-normal ml-2">
                Recommended
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cvBody" />
                  Website/Portfolio
                </Label>
                <Input
                  value={data.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://johndoe.com"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>

              <div className="space-y-2">
                <Label className="cv-heading text-sm flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5 text-cvBody" />
                  LinkedIn Profile
                  <Tooltip>
                    <TooltipTrigger>
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Highly recommended for MBA applications</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  value={data.linkedin}
                  onChange={(e) => handleInputChange("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/johndoe"
                  className="border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>

            {/* LinkedIn Tip */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-blue-900 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                Why LinkedIn Matters for MBA Applications
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-5 list-disc">
                <li>Admissions committees often review your profile</li>
                <li>Shows your professional brand and network</li>
                <li>Provides additional context about your career</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <Card className="border-cvBorder bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-900">
                  Personal Information Best Practices
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Use a professional email (firstname.lastname@gmail.com, not
                      party123@email.com)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Include country code in phone number for international applications
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Ensure your LinkedIn profile is complete and matches your CV
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Double-check all contact information for accuracy
                    </span>
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