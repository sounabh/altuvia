import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

export const PersonalInfoForm= () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    summary: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold cv-heading mb-2">Personal Information</h2>
        <p className="cv-body">This information will appear at the top of your CV</p>
      </div>

      <Card className="border-cvBorder">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 cv-heading">
            <User className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription className="cv-body">
            Your core contact details and professional summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="cv-heading">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="John Doe"
                className="border-cvBorder focus:border-cvAccent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="cv-heading">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 cv-body" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10 border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="cv-heading">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 cv-body" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10 border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="cv-heading">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 cv-body" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="New York, NY"
                  className="pl-10 border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="cv-heading">Website/Portfolio</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 cv-body" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://johndoe.com"
                  className="pl-10 border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="cv-heading">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 w-4 h-4 cv-body" />
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/johndoe"
                  className="pl-10 border-cvBorder focus:border-cvAccent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="cv-heading">Professional Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="A brief 2-3 sentence summary of your background, key skills, and career objectives..."
              className="min-h-[100px] border-cvBorder focus:border-cvAccent resize-none"
            />
            <p className="text-xs cv-body">
              Tip: Keep it concise but impactful. Mention your field, key strengths, and what you're seeking.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Button 
          variant="outline"
          className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white"
        >
          Import from LinkedIn
        </Button>
        <Button 
          className="bg-cvAccent hover:bg-cvAccentHover text-white"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
};
